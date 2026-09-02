"""Actualización diaria de la base independiente de NUVIA.

La función usa BDB exclusivamente como fuente de lectura para fondos y EODHD
para acciones/ETF. Solo reescribe el año en curso y el catálogo público.
"""
from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from zoneinfo import ZoneInfo

import requests
from firebase_functions import scheduler_fn
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from nuvia_mapper import catalog_item, map_asset

SOURCE_PROJECT = "bbdd-activos-financieros"
TARGET_PROJECT = "nuvia-market-data"
CURRENT_YEAR = datetime.now(timezone.utc).year
EODHD_URL = "https://eodhd.com/api/eod"


def _number(value):
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _normalized_market_point(row: dict) -> dict | None:
    close = _number(row.get("close"))
    adjusted = _number(row.get("adjusted_close"))
    value = adjusted if adjusted and adjusted > 0 else close
    if not row.get("date") or not value or value <= 0:
        return None
    point = {
        "date": str(row["date"]),
        "value": round(value, 8),
        "open": _number(row.get("open")),
        "high": _number(row.get("high")),
        "low": _number(row.get("low")),
        "close": close,
        "adjusted_close": adjusted,
        "volume": _number(row.get("volume")),
    }
    return {key: value for key, value in point.items() if value is not None}


def _public_fund_series(source: dict, asset_id: str, document_id: str) -> dict:
    allowed = {
        "schema_version", "asset_type", "series_type", "source",
        "source_price_id", "source_listing_id", "currency", "source_currency",
        "native_currency", "fx_pair", "fx_policy", "fx_source", "fx_applied",
        "minor_scale", "instrument_type", "interval", "year", "points",
        "first_date", "last_date", "observations_count",
        "history_quality_status", "updated_at", "refresh",
    }
    result = {key: value for key, value in source.items() if key in allowed}
    result.update({
        "asset_id": asset_id,
        "document_id": document_id,
        "nuvia_source": {
            "system": "BDB",
            "project_id": SOURCE_PROJECT,
            "original_document_id": document_id,
        },
    })
    return result


def _commit_batches(db: firestore.Client, writes: list[tuple]) -> int:
    count = 0
    for offset in range(0, len(writes), 45):
        batch = db.batch()
        for reference, data, merge in writes[offset:offset + 45]:
            batch.set(reference, data, merge=merge)
            count += 1
        batch.commit()
    return count


def _sync_funds(source: firestore.Client, target: firestore.Client, assets: list) -> dict:
    funds = [
        snapshot for snapshot in assets
        if (snapshot.to_dict() or {}).get("instrument_type") == "FUND"
    ]
    root_refs = [source.collection("assets").document(snapshot.id) for snapshot in funds]
    metric_refs = [ref.collection("metrics").document("latest") for ref in root_refs]
    roots = {snapshot.id: snapshot.to_dict() or {} for snapshot in source.get_all(root_refs)}
    metrics = {
        snapshot.reference.parent.parent.id: snapshot.to_dict() or {}
        for snapshot in source.get_all(metric_refs)
        if snapshot.exists
    }

    current_document_ids = {}
    current_query = (
        target.collection_group("series")
        .where(filter=FieldFilter("year", "==", CURRENT_YEAR))
        .select([])
    )
    for snapshot in current_query.stream(timeout=120):
        asset_id = snapshot.reference.parent.parent.id
        current_document_ids[asset_id] = snapshot.id

    series_refs = []
    for target_snapshot in funds:
        history = (target_snapshot.to_dict() or {}).get("history") or {}
        symbol = str(history.get("eodhd_symbol") or "").strip()
        document_id = current_document_ids.get(target_snapshot.id)
        if not document_id and symbol:
            document_id = f"EODHD_{symbol.replace('.', '_')}_{CURRENT_YEAR}"
        if not document_id:
            continue
        series_refs.append(
            source.collection("assets").document(target_snapshot.id)
            .collection("price_series").document(document_id)
        )
    current_series = {
        snapshot.reference.parent.parent.id: snapshot
        for snapshot in source.get_all(series_refs)
        if snapshot.exists
    }

    now = datetime.now(timezone.utc).isoformat()
    writes = []
    for target_snapshot in funds:
        root = roots.get(target_snapshot.id)
        if not root:
            continue
        existing = target_snapshot.to_dict() or {}
        mapped = map_asset(root, metrics.get(target_snapshot.id))
        mapped["history"] = dict(existing.get("history") or {})
        series_snapshot = current_series.get(target_snapshot.id)
        if series_snapshot:
            series = _public_fund_series(
                series_snapshot.to_dict() or {},
                target_snapshot.id,
                series_snapshot.id,
            )
            writes.append((
                target_snapshot.reference.collection("series").document(series_snapshot.id),
                series,
                False,
            ))
            history = mapped["history"]
            history["available"] = True
            history["last_date"] = series.get("last_date")
            history["source"] = series.get("source")
            history["interval"] = series.get("interval")
            years = set(history.get("available_years") or [])
            years.add(CURRENT_YEAR)
            history["available_years"] = sorted(years)
        mapped["synced_at"] = now
        writes.append((target_snapshot.reference, mapped, False))
    return {
        "funds": len(funds),
        "fund_series": len(current_series),
        "writes": _commit_batches(target, writes),
    }


def _fetch_market(session: requests.Session, token: str, symbol: str) -> list[dict]:
    from_date = (datetime.now(timezone.utc) - timedelta(days=12)).date().isoformat()
    response = session.get(
        f"{EODHD_URL}/{quote(symbol, safe='.')}",
        params={
            "api_token": token,
            "fmt": "json",
            "period": "d",
            "order": "a",
            "from": from_date,
        },
        timeout=45,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list):
        raise RuntimeError(f"Respuesta no válida para {symbol}")
    return [
        point for row in payload
        if (point := _normalized_market_point(row)) is not None
    ]


def _sync_market(target: firestore.Client, assets: list, token: str) -> dict:
    session = requests.Session()
    writes = []
    loaded = 0
    errors = []
    now = datetime.now(timezone.utc).isoformat()
    for snapshot in assets:
        asset = snapshot.to_dict() or {}
        if asset.get("instrument_type") not in {"STOCK", "ETF"}:
            continue
        history = dict(asset.get("history") or {})
        symbol = str(history.get("eodhd_symbol") or "").strip()
        if not symbol:
            continue
        try:
            fresh = _fetch_market(session, token, symbol)
            if not fresh:
                continue
            by_year: dict[int, list[dict]] = defaultdict(list)
            for point in fresh:
                by_year[int(point["date"][:4])].append(point)
            for year, points in by_year.items():
                document_id = f"EODHD_{symbol.replace('.', '_')}_{year}"
                reference = snapshot.reference.collection("series").document(document_id)
                existing_snapshot = reference.get()
                existing = existing_snapshot.to_dict() if existing_snapshot.exists else {}
                merged = {
                    point["date"]: point for point in (existing.get("points") or [])
                }
                merged.update({point["date"]: point for point in points})
                all_points = sorted(merged.values(), key=lambda point: point["date"])
                writes.append((reference, {
                    "schema_version": "nuvia-market-series.v1",
                    "asset_id": snapshot.id,
                    "asset_type": asset.get("instrument_type"),
                    "series_type": "ADJUSTED_CLOSE",
                    "source": "EODHD",
                    "document_id": document_id,
                    "currency": asset.get("currency") or "EUR",
                    "native_currency": asset.get("currency") or "EUR",
                    "interval": "1d",
                    "year": year,
                    "points": all_points,
                    "first_date": all_points[0]["date"],
                    "last_date": all_points[-1]["date"],
                    "observations_count": len(all_points),
                    "history_quality_status": "COMPLETE",
                    "updated_at": now,
                }, False))
            history.update({
                "available": True,
                "last_date": fresh[-1]["date"],
                "source": "EODHD",
                "interval": "1d",
                "ohlcv_available": True,
            })
            writes.append((snapshot.reference, {
                "history": history,
                "synced_at": now,
            }, True))
            loaded += 1
        except Exception as exc:  # un símbolo no interrumpe el universo
            errors.append({"asset_id": snapshot.id, "error": str(exc)[:160]})
    return {
        "market_assets": loaded,
        "market_errors": errors[:20],
        "writes": _commit_batches(target, writes),
    }


def _rebuild_catalog(target: firestore.Client) -> dict:
    assets = list(target.collection("assets").stream(timeout=120))
    items = [catalog_item(snapshot.to_dict() or {}) for snapshot in assets]
    items.sort(key=lambda item: (
        str(item.get("instrument_type") or ""),
        str(item.get("display_name") or "").lower(),
    ))
    now = datetime.now(timezone.utc).isoformat()
    chunks = []
    writes = []
    for offset in range(0, len(items), 150):
        chunk_id = f"{offset // 150:03d}"
        chunks.append(chunk_id)
        writes.append((
            target.collection("catalog_chunks").document(chunk_id),
            {
                "schema_version": "nuvia-catalog.v1",
                "items": items[offset:offset + 150],
                "updated_at": now,
            },
            False,
        ))
    writes.append((
        target.collection("catalog_manifest").document("public"),
        {
            "schema_version": "nuvia-catalog-manifest.v1",
            "chunks": chunks,
            "total": len(items),
            "types": ["ETF", "FUND", "STOCK"],
            "updated_at": now,
        },
        False,
    ))
    return {"catalog": len(items), "writes": _commit_batches(target, writes)}


@scheduler_fn.on_schedule(
    schedule="30 5 * * *",
    timezone=ZoneInfo("Europe/Madrid"),
    region="europe-west1",
    memory=512,
    timeout_sec=540,
    min_instances=0,
    max_instances=1,
    secrets=["EODHD_API_KEY"],
    retry_count=1,
)
def daily_nuvia_sync(event: scheduler_fn.ScheduledEvent) -> None:
    del event
    token = os.environ.get("EODHD_API_KEY", "").strip()
    if not token:
        raise RuntimeError("EODHD_API_KEY no está disponible")
    source = firestore.Client(project=SOURCE_PROJECT)
    target = firestore.Client(project=TARGET_PROJECT)
    assets = list(target.collection("assets").stream(timeout=120))
    summary = {
        "funds": _sync_funds(source, target, assets),
        "market": _sync_market(target, assets, token),
        "catalog": _rebuild_catalog(target),
        "finished_at": datetime.now(timezone.utc).isoformat(),
    }
    print(summary)

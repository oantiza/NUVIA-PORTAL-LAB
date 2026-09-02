"""Contrato público y estable de activos para NUVIA.

Este módulo no realiza I/O. Convierte documentos internos de BDB en una
proyección pequeña y segura para el gestor, el simulador y los análisis.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

SCHEMA_VERSION = "nuvia-asset.v1"
SUPPORTED_TYPES = {"FUND", "ETF", "STOCK"}


def json_safe(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _number(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _fraction_map(value: Any) -> dict[str, float]:
    if not isinstance(value, dict):
        return {}
    result: dict[str, float] = {}
    for key, raw in value.items():
        number = _number(raw)
        if number is not None and number > 0:
            result[str(key)] = round(number, 8)
    return result


def instrument_type(root: dict) -> str:
    value = str(root.get("asset_type") or root.get("instrument_type") or "").upper()
    return value if value in SUPPORTED_TYPES else "UNKNOWN"


def economic_asset_class(root: dict) -> str:
    classification = root.get("classification") or {}
    raw = str(
        classification.get("fondosdb_asset_type")
        or classification.get("asset_class")
        or ""
    ).strip().upper()
    aliases = {
        "RV": "EQUITY",
        "EQUITY": "EQUITY",
        "RF": "FIXED_INCOME",
        "BOND": "FIXED_INCOME",
        "FIXED_INCOME": "FIXED_INCOME",
        "MONETARIO": "MONEY_MARKET",
        "MONETARY": "MONEY_MARKET",
        "MONEY_MARKET": "MONEY_MARKET",
        "MIXTO": "MIXED",
        "ALLOCATION": "MIXED",
        "BALANCED": "MIXED",
        "MIXED": "MIXED",
        "ALTERNATIVE": "ALTERNATIVE",
        "ALTERNATIVES": "ALTERNATIVE",
        "REAL_ASSET": "REAL_ASSET",
        "OTHER": "OTHER",
    }
    if raw in aliases:
        return aliases[raw]
    if instrument_type(root) == "STOCK":
        return "EQUITY"
    return "UNKNOWN"


def normalized_costs(root: dict) -> dict[str, float]:
    source = root.get("costs") or {}
    ongoing_pct = source.get("ter_pct")
    if ongoing_pct is None:
        ongoing_pct = source.get("mifid_ongoing_pct")
    ongoing = _number(ongoing_pct)
    management = _number(source.get("management_fee_pct"))
    result: dict[str, float] = {}
    if ongoing is not None:
        result["ongoing_charge"] = round(ongoing / 100.0, 8)
    if management is not None:
        result["management_fee"] = round(management / 100.0, 8)
    return result


def normalized_metrics(root: dict, latest: dict | None) -> dict[str, Any]:
    if latest:
        result: dict[str, Any] = {
            "source": latest.get("source") or "METRICS_LATEST",
            "as_of_date": latest.get("last_date"),
        }
        windows = latest.get("windows") or {}
        for period in ("1y", "3y", "5y", "10y"):
            node = windows.get(period) or {}
            for source_key, target_prefix in (
                ("annualized_return", "annualized_return"),
                ("annualized_volatility", "volatility"),
                ("sharpe_ratio", "sharpe"),
            ):
                number = _number(node.get(source_key))
                if number is not None:
                    result[f"{target_prefix}_{period}"] = round(number, 8)
        ytd = _number(latest.get("ytd_return"))
        if ytd is not None:
            result["ytd_return"] = round(ytd, 8)
        risk_score = _number(latest.get("srri"))
        if risk_score is not None:
            result["risk_score"] = int(risk_score)
        max_drawdown = latest.get("max_drawdown_hist")
        if isinstance(max_drawdown, dict):
            value = _number(max_drawdown.get("value"))
            if value is not None:
                result["max_drawdown_hist"] = round(value, 8)
            if max_drawdown.get("date"):
                result["max_drawdown_hist_date"] = str(max_drawdown["date"])
        return {key: value for key, value in result.items() if value is not None}

    risk = root.get("risk") or {}
    performance = ((root.get("performance") or {}).get("returns") or {}).get("trailing_pct") or {}
    result = {"source": "BDB_ROOT_FALLBACK"}
    periods = {
        "1y": ("1a", "1a"),
        "3y": ("3a", "3a_anualizada"),
        "5y": ("5a", "5a_anualizada"),
        "10y": ("10a", "10a_anualizada"),
    }
    for suffix, (risk_key, return_key) in periods.items():
        return_node = performance.get(return_key)
        return_value = _number(return_node.get("fondo") if isinstance(return_node, dict) else return_node)
        if return_value is not None:
            result[f"annualized_return_{suffix}"] = round(return_value / 100.0, 8)
        for raw_key, target in (("volatilidad_pct", "volatility"), ("sharpe", "sharpe")):
            node = (risk.get(raw_key) or {}).get(risk_key)
            number = _number(node.get("fondo") if isinstance(node, dict) else node)
            if number is not None:
                result[f"{target}_{suffix}"] = round(
                    number / 100.0 if target == "volatility" else number, 8
                )
    score = _number(risk.get("srri_1a7") or risk.get("sri_kid_1a7"))
    if score is not None:
        result["risk_score"] = int(score)
    return result


def _history_summary(first_doc: dict | None, last_doc: dict | None) -> dict[str, Any]:
    if not first_doc or not last_doc:
        return {"available": False}
    first_date = first_doc.get("first_date")
    last_date = last_doc.get("last_date")
    years: list[int] = []
    try:
        start = int(str(first_date)[:4])
        end = int(str(last_date)[:4])
        years = list(range(start, end + 1))
    except (TypeError, ValueError):
        pass
    listing = last_doc.get("source_listing_id") or last_doc.get("source_price_id")
    symbol = None
    if isinstance(listing, str) and listing.startswith("EODHD:"):
        symbol = listing.split("EODHD:", 1)[1]
    return {
        "available": True,
        "first_date": first_date,
        "last_date": last_date,
        "interval": last_doc.get("interval"),
        "series_type": last_doc.get("series_type"),
        "currency": last_doc.get("currency"),
        "source": last_doc.get("source"),
        "available_years": years,
        "eodhd_symbol": symbol,
    }


def map_asset(
    root: dict,
    metrics_latest: dict | None = None,
    first_series_doc: dict | None = None,
    last_series_doc: dict | None = None,
) -> dict[str, Any]:
    identity = root.get("identity") or {}
    identifiers = root.get("identifiers") or {}
    product = root.get("product") or {}
    classification = root.get("classification") or {}
    exposure = root.get("portfolio_exposure") or {}
    quality = root.get("quality") or {}
    asset_id = str(root.get("asset_id") or identifiers.get("isin") or "")
    asset_type = instrument_type(root)
    display_name = str(identity.get("name") or product.get("fund_name") or asset_id)
    category = (
        classification.get("category")
        or classification.get("morningstar_category")
        or product.get("commercial_type")
    )
    currency = identity.get("currency") or root.get("currency") or "EUR"
    ticker = identifiers.get("ticker") or identifiers.get("openfigi_ticker")
    isin = identifiers.get("isin")
    history = _history_summary(first_series_doc, last_series_doc)
    region = classification.get("region_primary") or classification.get("region")
    provider = product.get("provider") or root.get("provider") or "BDB Activos"
    metrics = normalized_metrics(root, metrics_latest)
    pms = exposure.get("asset_mix") or {}
    exposures = {
        "asset_mix": {
            "equity": round(_number(pms.get("equity")) or 0.0, 8),
            "fixed_income": round(_number(pms.get("bond")) or 0.0, 8),
            "cash": round(_number(pms.get("cash")) or 0.0, 8),
            "other": round(_number(pms.get("other")) or 0.0, 8),
        },
        "regions": _fraction_map(exposure.get("equity_regions")),
        "sectors": _fraction_map(exposure.get("sectors")),
        "styles": _fraction_map(exposure.get("equity_styles")),
        "market_caps": _fraction_map(exposure.get("market_caps")),
        "confidence": _number(exposure.get("exposure_confidence")),
    }
    quality_status = quality.get("status") or "UNKNOWN"
    review_flags = list(quality.get("review_flags") or [])
    warnings = list(quality.get("warnings") or [])
    document = {
        "schema_version": SCHEMA_VERSION,
        "asset_id": asset_id,
        "instrument_type": asset_type,
        "economic_asset_class": economic_asset_class(root),
        "display_name": display_name,
        "isin": isin,
        "ticker": ticker,
        "currency": currency,
        "region": region,
        "provider": provider,
        "category": category,
        "morningstar_rating": classification.get("morningstar_rating"),
        "costs": normalized_costs(root),
        "metrics": metrics,
        "exposures": exposures,
        "fixed_income_profile": root.get("fixed_income_profile") or {},
        "holdings_summary": root.get("holdings_summary") or {},
        "quality": {
            "status": quality_status,
            "review_flags": review_flags[:25],
            "warnings": warnings[:25],
        },
        "history": history,
        "is_investable": asset_type in SUPPORTED_TYPES,
        "source": {
            "system": "BDB",
            "project_id": "bbdd-activos-financieros",
            "asset_id": asset_id,
            "source_updated_at": root.get("updated_at"),
        },
        "search_text": " ".join(
            str(item or "")
            for item in (display_name, isin, ticker, provider, category, region)
        ).lower(),
        "updated_at": root.get("updated_at"),
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }
    return json_safe(document)


def catalog_item(asset: dict) -> dict[str, Any]:
    history = asset.get("history") or {}
    quality = asset.get("quality") or {}
    return {
        "asset_id": asset.get("asset_id"),
        "instrument_type": asset.get("instrument_type"),
        "economic_asset_class": asset.get("economic_asset_class"),
        "display_name": asset.get("display_name"),
        "isin": asset.get("isin"),
        "ticker": asset.get("ticker"),
        "currency": asset.get("currency"),
        "provider": asset.get("provider"),
        "category": asset.get("category"),
        "morningstar_rating": asset.get("morningstar_rating"),
        "quality_status": quality.get("status"),
        "history_available": bool(history.get("available")),
        "ohlcv_available": bool(history.get("ohlcv_available")),
        "eodhd_symbol": history.get("eodhd_symbol"),
        "history_last_date": history.get("last_date"),
    }

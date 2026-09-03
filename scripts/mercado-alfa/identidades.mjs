// Plan puro, limitado a las dos sucesiones autorizadas. No hace llamadas de red.
import assert from 'node:assert/strict';
import { CAMBIOS_IDENTIDAD } from '../../js/nuvia-identidades.js';
import { documentFor, validateEntry } from '../../company-analysis/alfa/ingestion.mjs';
import { aFirestore, documentoAObjeto, NOMBRE_BASE } from './firestore-rest.mjs';
import { clavesProhibidasEn } from './proyecta.mjs';

export const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
export const sourcePaths = ['catalog_manifest/public', ...[0, 1, 2, 3].map(n => `catalog_chunks/${String(n).padStart(3, '0')}`),
  ...CAMBIOS_IDENTIDAD.flatMap(c => [`assets/${c.old}`, ...YEARS.map(y => `assets/${c.old}/series/${y}`)])];
const assetKeys = ['asset_id', 'isin', 'ticker', 'eodhd_symbol', 'instrument_type', 'economic_asset_class', 'display_name', 'currency', 'region', 'sector', 'category', 'grupo', 'costs', 'exposures', 'metrics', 'history', 'quality', 'source', 'schema_version', 'updated_at'];
const cleanDoc = raw => { const { _id, ...value } = documentoAObjeto(raw); return value; };

export function planIdentidades(sources, entries, at) {
  assert.equal(Object.keys(sources).length, sourcePaths.length, 'Inventario de origen incompleto');
  for (const path of sourcePaths) {
    assert.equal(sources[path]?.name, `${NOMBRE_BASE}/${path}`, 'Documento de otro destino');
    assert.ok(sources[path]?.updateTime, 'Falta versión del documento');
  }
  assert.ok(Number.isFinite(Date.parse(at)), 'Fecha de carga inválida');
  assert.equal(entries.length, 2, 'Solo dos fundamentales');
  const manifest = cleanDoc(sources['catalog_manifest/public']);
  assert.equal(manifest.total, 698, 'Ha cambiado el universo');
  assert.equal(manifest.chunks, 4, 'Ha cambiado el catálogo');
  const items = [0, 1, 2, 3].flatMap(n => cleanDoc(sources[`catalog_chunks/${String(n).padStart(3, '0')}`]).items);
  assert.equal(items.length, 698); assert.equal(new Set(items.map(i => i.asset_id)).size, 698);
  const creates = [];
  for (const c of CAMBIOS_IDENTIDAD) {
    assert.equal(items.filter(i => i.asset_id === c.old && i.isin === c.old).length, 1, 'Referencia antigua alterada');
    assert.ok(!items.some(i => i.asset_id === c.current), 'Referencia actual ya activada');
    const entry = entries.find(e => e.assetId === c.current);
    validateEntry(entry); assert.equal(entry.symbol, c.symbol); assert.equal(entry.quoteCurrency, 'EUR');
    const asset = cleanDoc(sources[`assets/${c.old}`]);
    assert.ok(Object.keys(asset).every(key => assetKeys.includes(key)), 'Campos inesperados en la ficha de origen');
    assert.equal(asset.asset_id, c.old); assert.equal(asset.isin, c.old); assert.equal(asset.eodhd_symbol, c.symbol);
    assert.equal(asset.currency, 'EUR'); assert.equal(asset.instrument_type, 'STOCK');
    assert.deepEqual(clavesProhibidasEn(asset), [], 'Ficha con campos fuera de alcance');
    assert.doesNotMatch(JSON.stringify(asset), /"(?:Officers|Holders|email|phone|token|api_key|users|clients)"\s*:/i);
    const newAsset = { ...asset, asset_id: c.current, isin: c.current, updated_at: at,
      identity_transition: { previous_isin: c.old, current_isin: c.current, effective_date: c.effective, source: c.source, note: c.note } };
    creates.push({ path: `assets/${c.current}`, value: newAsset });
    let count = 0, previous = '';
    for (const year of YEARS) {
      const series = cleanDoc(sources[`assets/${c.old}/series/${year}`]);
      assert.deepEqual(Object.keys(series).sort(), ['asset_id', 'currency', 'first_date', 'last_date', 'n', 'points', 'year'].sort());
      assert.equal(series.asset_id, c.old); assert.equal(series.year, year); assert.equal(series.currency, 'EUR');
      assert.equal(series.n, series.points.length); assert.ok(series.n > 0);
      for (const point of series.points) {
        assert.deepEqual(Object.keys(point).sort(), ['date', 'value']);
        assert.match(point.date, new RegExp(`^${year}-\\d{2}-\\d{2}$`));
        assert.equal(new Date(point.date).toISOString().slice(0, 10), point.date);
        assert.ok(point.date > previous && Number.isFinite(point.value) && point.value > 0); previous = point.date;
      }
      assert.equal(series.first_date, series.points[0].date); assert.equal(series.last_date, series.points.at(-1).date);
      count += series.n;
      creates.push({ path: `assets/${c.current}/series/${year}`, value: { ...series, asset_id: c.current } });
    }
    assert.equal(count, asset.history.observations);
    creates.push({ path: `assets/${c.current}/fundamentals/current`, value: documentFor(entry, at) });
  }
  const aliases = { ...manifest.identity_aliases };
  for (const c of CAMBIOS_IDENTIDAD) {
    assert.ok(!aliases[c.old] || aliases[c.old] === c.current, 'Correspondencia anterior distinta'); aliases[c.old] = c.current;
  }
  const nextManifest = { ...manifest, identity_aliases: aliases, updated_at: at };
  const writes = creates.map(({ path, value }) => ({ update: { name: `${NOMBRE_BASE}/${path}`, fields: aFirestore(value).mapValue.fields }, currentDocument: { exists: false } }));
  writes.push({ update: { name: `${NOMBRE_BASE}/catalog_manifest/public`, fields: aFirestore(nextManifest).mapValue.fields },
    currentDocument: { updateTime: sources['catalog_manifest/public'].updateTime } });
  assert.equal(writes.length, 17); assert.ok(Buffer.byteLength(JSON.stringify(writes)) < 8_000_000);
  return { creates, manifest: nextManifest, writes };
}

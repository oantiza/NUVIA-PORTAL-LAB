// Proyección cerrada de la carga puntual autorizada el 04-09-2026. Sin red.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { annualOhlcv, inspectOhlcv } from '../../company-analysis/alfa/ohlcv.mjs';
import { validDay } from '../../company-analysis/alfa/technical.mjs';
import { aFirestore, NOMBRE_BASE } from './firestore-rest.mjs';

export const FROM = '2021-01-01', TO = '2026-09-03';
export const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
export const digest = v => createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
export const fingerprint = d => d ? { name: d.name, updateTime: d.updateTime, sha256: digest(d.fields) } : null;
export function identity(entry, asset) {
  assert.match(entry.isin, /^[A-Z]{2}[A-Z0-9]{10}$/);
  assert.equal(entry.assetId, entry.isin);
  assert.match(entry.symbol, /^[A-Z0-9-]+\.[A-Z0-9]+$/);
  assert.equal(entry.quoteCurrency, 'EUR');
  assert.equal(asset?.asset_id, entry.isin); assert.equal(asset.isin, entry.isin);
  assert.equal(asset.eodhd_symbol, entry.symbol); assert.equal(asset.instrument_type, 'STOCK');
  assert.equal(asset.currency, 'EUR'); assert.equal(asset.source?.system, 'EODHD');
  assert.equal(asset.source.symbol, entry.symbol);
  assert.equal(asset.source.currency_check?.value, 'EUR');
  assert.ok(validDay(asset.history?.first_date) && validDay(asset.history?.last_date));
}
export const targets = entry => [...YEARS.map(y => `assets/${entry.isin}/ohlcv/${y}`), `assets/${entry.isin}/ohlcv_manifest/current`];
export function compareCloses(points, series, entry) {
  const expected = [];
  for (const doc of series.filter(Boolean)) {
    assert.equal(doc.asset_id, entry.isin); assert.equal(doc.currency, 'EUR');
    assert.ok(YEARS.includes(doc.year) && Array.isArray(doc.points));
    assert.equal(doc.n, doc.points.length);
    assert.equal(doc.first_date, doc.points[0]?.date); assert.equal(doc.last_date, doc.points.at(-1)?.date);
    for (const [i, p] of doc.points.entries()) {
      assert.ok(validDay(p.date) && Number(p.date.slice(0,4)) === doc.year);
      assert.ok(Number.isFinite(p.value) && p.value > 0);
      assert.ok(!i || p.date > doc.points[i-1].date);
      if (p.date >= FROM && p.date <= TO) expected.push(p);
    }
  }
  const newMap = new Map(points.map(p => [p.date, Number(p.adjusted_close.toFixed(6))]));
  const differences = expected.filter(p => !newMap.has(p.date) || newMap.get(p.date) !== p.value)
    .map(p => ({date:p.date, existing:p.value, downloaded:newMap.get(p.date) ?? null}));
  return { compared: expected.length, differences: differences.length, examples: differences.slice(0, 8) };
}
export function bundle(entry, input) {
  const {points, issues} = inspectOhlcv(input.prices);
  assert.equal(issues.length, 0, 'Precios con incidencias'); assert.ok(points.length);
  assert.ok(points.every(p => p.date >= FROM && p.date <= TO), 'Fuera de la ventana autorizada');
  assert.ok(Number.isFinite(Date.parse(input.fetchedAt)));
  const meta = {isin:entry.isin,symbol:entry.symbol,currency:entry.quoteCurrency,fetchedAt:input.fetchedAt};
  const revision = digest({meta, points});
  const docs = annualOhlcv(points, {...meta, revision});
  docs.push({path:`assets/${entry.isin}/ohlcv_manifest/current`,value:{
    schema_version:'nuvia-ohlcv-manifest.v1',asset_id:entry.isin,isin:entry.isin,
    symbol:entry.symbol,currency:entry.quoteCurrency,revision,
    source:docs[0].value.source,requested_from:FROM,requested_to:TO,
    first_date:points[0].date,last_date:points.at(-1).date,n:points.length,
    years:docs.map(d => ({year:d.value.year,n:d.value.n,sha256:digest(d.value)})),
  }});
  return docs;
}
// La API no recibe escrituras arbitrarias: solo proyecciones reconstruidas.
export function createWrites(entry, input) {
  const allowed = new Set(targets(entry));
  return bundle(entry, input).map(d => {
    assert.ok(allowed.has(d.path));
    const update = {name:`${NOMBRE_BASE}/${d.path}`,fields:aFirestore(d.value).mapValue.fields};
    assert.ok(Buffer.byteLength(JSON.stringify(update)) < 800000, 'Documento excesivo');
    return {update,currentDocument:{exists:false}};
  });
}

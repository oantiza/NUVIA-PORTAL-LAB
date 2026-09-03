import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEntry, validateEntry, createWrite } from '../company-analysis/alfa/ingestion.mjs';
import { aFirestore, NOMBRE_BASE } from '../scripts/mercado-alfa/firestore-rest.mjs';
const asset = { asset_id: 'ES0000000001', isin: 'ES0000000001', eodhd_symbol: 'TEST.MC', display_name: 'Empresa de prueba', currency: 'EUR' };
const dates = { catalogObservedAt: '2026-09-03T00:00:00Z', downloadedAt: '2026-09-03T08:00:00Z' };
const raw = () => ({ General: { Code: 'TEST', Exchange: 'MC', Name: 'Empresa de prueba', ISIN: asset.isin, Type: 'Common Stock', CurrencyCode: 'EUR', Officers: { name: 'PERSONA_NO_GUARDAR' } }, Highlights: { PERatio: 10, EarningsShare: 2, EPSEstimateNextYear: 100 }, Valuation: { ForwardPE: 9 }, SplitsDividends: { ForwardAnnualDividendRate: 1 }, Holders: { Institutions: { name: 'PERSONA_NO_GUARDAR' } }, Financials: {} });
test('proyecta la respuesta en memoria sin conservar personas ni estimaciones', () => {
  const entry = prepareEntry(asset, raw(), dates);
  assert.equal(entry.company.metrics.PERatio, 10);
  assert.equal(entry.company.source.downloadedAt, dates.downloadedAt);
  assert.doesNotMatch(JSON.stringify(entry), /PERSONA_NO_GUARDAR|Officers|Holders|ForwardPE|EPSEstimate|ForwardAnnual/);
});
test('no fuerza un ISIN o cotización distintos', () => {
  const other = raw(); other.General.ISIN = 'NL0000000002';
  assert.equal(prepareEntry(asset, other, dates).state, 'isin_conflict');
});
test('la lista positiva se revalida antes de cualquier escritura', () => {
  for (const corrupt of [e => { e.company.metrics.epsEstimate = 2; }, e => { e.company.identity.Officers = {}; }, e => { e.company.source.token = 'NO'; }, e => { e.assetId = '../otra'; }]) {
    const entry = prepareEntry(asset, raw(), dates); corrupt(entry);
    assert.throws(() => validateEntry(entry));
  }
});
test('solo crea fundamentales nuevos bajo el activo; no sobrescribe ni cambia el catálogo', () => {
  const entry = prepareEntry(asset, raw(), dates);
  const write = createWrite(entry, dates.downloadedAt, { baseName: NOMBRE_BASE, encode: aFirestore });
  assert.equal(write.update.name, NOMBRE_BASE + '/assets/ES0000000001/fundamentals/current');
  assert.deepEqual(write.currentDocument, { exists: false });
  assert.equal(write.delete, undefined);
  assert.throws(() => createWrite(entry, dates.downloadedAt, { baseName: 'otro-proyecto', encode: aFirestore }));
});

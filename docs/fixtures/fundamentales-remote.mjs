// Datos sintéticos de transporte para pruebas sin red. No se publica esta copia.
import { FUNDAMENTALS_SCHEMA } from '../../company-analysis/alfa/contract.mjs';
import { DIVIDEND_DATES_SCHEMA, DIVIDEND_FIELDS } from '../../company-analysis/alfa/dividend-dates.mjs';
export const BASE = 'https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents';
export function encode(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])) } };
}
export function wire(path, value) {
  return { name: `${BASE.slice('https://firestore.googleapis.com/v1/'.length)}/${path}`, fields: encode(value).mapValue.fields };
}
export function fixtureDocuments(entry, sourceCompany = entry.company) {
  const asset = { asset_id: entry.assetId, isin: entry.isin, eodhd_symbol: entry.symbol, currency: entry.quoteCurrency };
  if (!sourceCompany) return { asset, fundamental: null };
  const company = structuredClone(sourceCompany);
  const [ticker, exchange] = entry.symbol.split('.');
  company.symbol = entry.symbol;
  Object.assign(company.identity, { name: entry.name, isin: entry.isin, ticker, exchange, quoteCurrency: entry.quoteCurrency });
  Object.assign(company.source, { downloadedAt: '2026-09-03T08:00:00Z', rawSha256: 'a'.repeat(64), hashBasis: 'Fixture sintética de prueba, no dato actualizado' });
  return { asset, fundamental: { schema_version: FUNDAMENTALS_SCHEMA, asset_id: entry.assetId, isin: entry.isin, symbol: entry.symbol,
    loaded_at: '2026-09-03T08:10:00Z', entry: { ...entry, state: 'matched', company, identityCandidates: [{ symbol: entry.symbol, isin: entry.isin }] } } };
}

export function fixtureDividendDates(entry, overrides = {}) {
  return { schema_version: DIVIDEND_DATES_SCHEMA, asset_id: entry.assetId, isin: entry.isin, symbol: entry.symbol,
    dividendDate: null, exDividendDate: '2026-10-01', availability: 'exDividendOnly',
    source: { provider: 'EODHD', endpoint: 'fundamentals-filtered', fields: [...DIVIDEND_FIELDS], providerUpdated: '2026-09-02',
      fetchedAt: '2026-09-03T11:00:00.000Z', responseSha256: 'a'.repeat(64) }, loaded_at: '2026-09-03T11:05:00.000Z', ...overrides };
}

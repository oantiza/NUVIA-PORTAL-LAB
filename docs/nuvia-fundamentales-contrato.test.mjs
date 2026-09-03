import test from 'node:test';
import assert from 'node:assert/strict';
import { matchIdentity, compareCoverage, auditCompany, auditRawPeriods } from '../company-analysis/local/coverage.mjs';
import { CONTRACT_VERSION, RATIO_FIELDS, validateRecord, dataLimitations } from '../company-analysis/local/contract.mjs';
const asOf = '2026-09-03';
const asset = { asset_id: 'ES0144580Y14', isin: 'ES0144580Y14', eodhd_symbol: 'IBE.MC', currency: 'EUR' };
const company = { symbol: 'IBE.MC', identity: { isin: asset.isin, quoteCurrency: 'EUR' } };
test('cruce exige ISIN, símbolo con mercado y moneda coincidentes', () => {
  assert.equal(matchIdentity(asset, [company]).status, 'matched');
  assert.equal(matchIdentity({ ...asset, isin: 'NL0015001FS8' }, [company]).status, 'asset_identity_conflict');
  assert.equal(matchIdentity(asset, []).status, 'missing');
  assert.equal(matchIdentity(asset, [{ ...company, identity: { ...company.identity, isin: 'NL0015001FS8' } }]).status, 'isin_conflict');
  assert.equal(matchIdentity(asset, [{ ...company, symbol: 'IBE.OTC' }]).status, 'listing_conflict');
  assert.equal(matchIdentity(asset, [{ ...company, identity: { ...company.identity, isin: null } }]).status, 'unconfirmed');
  assert.equal(matchIdentity(asset, [{ ...company, identity: { ...company.identity, quoteCurrency: 'USD' } }]).status, 'currency_conflict');
});
test('varias cotizaciones o candidatos no se resuelven escogiendo el primero', () => {
  assert.equal(matchIdentity(asset, [company, { ...company, symbol: 'IBE.OTC' }]).status, 'ambiguous');
  assert.throws(() => compareCoverage([asset, asset], [], asOf), /duplicada/);
  assert.equal(matchIdentity({ ...asset, eodhd_symbol: '' }, [company]).status, 'listing_conflict');
});
test('la revisión diferencia periodos vacíos, fechas y huecos de campos', () => {
  const audited = auditCompany({ ...company, warnings: [], metrics: { per: null }, multiples: {}, source: {},
    statements: { income: { currency: null, rows: [{ period: '2025-12-31', reportedAt: null, revenue: null },
      { period: '2026-12-31', reportedAt: '2027-01-01', revenue: 0 }] } } }, asOf);
  assert.deepEqual(audited.statements.income.emptyPeriods, ['2025-12-31']);
  assert.deepEqual(audited.statements.income.futurePeriods, ['2026-12-31']);
  assert.equal(audited.statements.income.missingFilingCount, 1);
  assert.deepEqual(audited.statements.income.missingLatest, []);
});
test('moneda por ejercicio no se oculta tras la moneda de la cabecera', () => {
  const result = auditRawPeriods({ Financials: { Balance_Sheet: { currency_symbol: 'EUR', yearly: {
    '2000-12-31': { currency_symbol: 'USD', date: '2000-12-31' },
    '2001-12-31': { currency_symbol: null, date: '2002-12-31' },
  } } } });
  assert.equal(result.currencyDifferences.length, 1);
  assert.equal(result.missingRowCurrency, 1);
  assert.equal(result.inconsistentDates.length, 1);
});
function record() {
  return { schema_version: CONTRACT_VERSION, asset_id: asset.isin, symbol: 'IBE.MC', kind: 'annual',
    statement: 'income', period_end: '2025-12-31', filed_on: '2026-02-28', currency: 'USD', scale: 1,
    values: { revenue: 100, gross_profit: null, operating_income: 0, net_income: -20, ebitda: 10 },
    source: { provider: 'EODHD', symbol: 'IBE.MC', provider_updated_on: '2026-09-01',
      downloaded_at: null, raw_sha256: '0'.repeat(64) } };
}
test('contrato sintético: moneda contable independiente, cero y pérdidas válidos', () => {
  assert.deepEqual(validateRecord(record(), asOf), []);
  assert.match(dataLimitations(record()).join(' '), /descarga/);
});
test('lista positiva excluye bloques originales y campos de opinión', () => {
  for (const key of ['Highlights', 'recommendation', 'price_target', 'api_key']) {
    assert.ok(validateRecord({ ...record(), [key]: 'no admitido' }, asOf).some(e => e.includes(key)));
  }
  const r = record(); r.values.rating = 5;
  assert.ok(validateRecord(r, asOf).some(e => e.includes('rating')));
  for (const statement of ['__proto__', 'constructor', 'unknown']) {
    assert.ok(validateRecord({ ...record(), statement }, asOf).some(e => e.includes('statement')));
  }
});
test('ausente exige null explícito; prohíbe cadenas numéricas e infinitos', () => {
  for (const value of ['', '12', undefined, Infinity, NaN, true]) {
    const r = record(); r.values.revenue = value;
    assert.ok(validateRecord(r, asOf).some(e => e.includes('revenue')));
  }
  const r = record(); delete r.values.gross_profit;
  assert.ok(validateRecord(r, asOf).some(e => e.includes('gross_profit')));
});
test('divisa o escala desconocida no se inventan; bloquean el uso monetario', () => {
  const r = record(); r.currency = null; r.scale = null;
  assert.deepEqual(validateRecord(r, asOf), []);
  assert.ok(dataLimitations(r).some(e => e.includes('Moneda')));
  assert.ok(dataLimitations(r).some(e => e.includes('Escala')));
  r.scale = 100; assert.ok(validateRecord(r, asOf).some(e => e.includes('scale')));
});
test('rechaza fechas imposibles, futuras o de presentación anterior al cierre', () => {
  for (const value of ['2026-02-30', '2027-01-01']) {
    const r = record(); r.period_end = value;
    assert.ok(validateRecord(r, asOf).some(e => e.includes('period_end')));
  }
  const r = record(); r.filed_on = '2025-01-01';
  assert.ok(validateRecord(r, asOf).some(e => e.includes('filed_on')));
  assert.ok(validateRecord(record(), 'invalid').length);
});
test('ratios tienen unidad expresa y no heredan el cierre anual', () => {
  const { source } = record();
  const r = { schema_version: CONTRACT_VERSION, asset_id: asset.isin, symbol: 'IBE.MC', kind: 'ratios',
    source, observed_on: asOf, values: Object.fromEntries(Object.entries(RATIO_FIELDS)
      .map(([key, unit]) => [key, { value: null, unit, period_end: null }])) };
  r.values.net_margin_ttm.value = 0.15;
  assert.deepEqual(validateRecord(r, asOf), []);
  r.values.net_margin_ttm.unit = 'percent';
  assert.ok(validateRecord(r, asOf).some(e => e.includes('unit')));
  r.values.pe_ttm.period_end = '2027-01-01';
  assert.ok(validateRecord(r, asOf).some(e => e.includes('period_end')));
});

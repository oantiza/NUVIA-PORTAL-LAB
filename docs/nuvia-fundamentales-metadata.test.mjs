import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectStatement, inspectCompany, statementNotes, chartCaption, filingMatchesClose, displayWarnings, SCALE_NOTICE } from '../company-analysis/alfa/metadata.mjs';
import { COMPANY_FIELDS } from '../company-analysis/alfa/contract.mjs';

const row = (period, currency, value = 0) => ({ period, reportedAt: null, currency, scale: null, totalRevenue: value, netIncome: value });
test('diagnóstico conserva ceros, ausencias y monedas sin completar ni convertir datos', () => {
  const statement = { currency: 'EUR', rows: [row('2022-12-31', 'ESP'), row('2023-12-31', null, null), row('2024-12-31', 'USD', -1), row('2025-12-31', 'EUR')] };
  const before = structuredClone(statement);
  const result = inspectStatement(statement, ['totalRevenue', 'netIncome'], 'EUR', '2026-09-03');
  assert.deepEqual(statement, before);
  assert.deepEqual(result.currencies, { ESP: 1, notReported: 1, USD: 1, EUR: 1 });
  assert.deepEqual(result.emptyRows, ['2023-12-31']);
  assert.equal(result.missingScale.length, 4);
  assert.equal(result.differsFromQuote.length, 2); assert.equal(result.differsFromStatement.length, 2);
  assert.deepEqual(result.futureDates, []);
});
test('los últimos cinco son filas por estado; no declara cinco años completos', () => {
  const rows = Array.from({ length: 7 }, (_, i) => row(`${2017 + i}-12-31`, i < 2 ? null : 'EUR'));
  const result = inspectStatement({ currency: 'EUR', rows }, ['totalRevenue'], 'EUR', '2026-09-03');
  assert.deepEqual(result.latestFiveCurrencies, { EUR: 5 });
  assert.equal(result.missingCurrency.length, 2);
});
test('no confunde cierre anual con presentación, ni une estados con cierres distintos', () => {
  const company = { symbol: 'TEST.MC', identity: { isin: 'ES0000000001', quoteCurrency: 'EUR' }, source: {},
    statements: Object.fromEntries(Object.keys(COMPANY_FIELDS).map(key => [key, { currency: 'EUR', rows: [row(key === 'Balance_Sheet' ? '2026-06-30' : '2025-06-30', 'EUR')] }])),
    earnings: [{ period: '2026-06-30', reportedAt: '2026-10-01', currency: null, actual: 0 }] };
  const result = inspectCompany(company, '2026-09-03');
  assert.equal(result.latestClosesDiffer, true);
  assert.equal(result.earnings.futureDates.length, 1);
  assert.deepEqual(result.earnings.currencies, { notReported: 1 });
});
test('los avisos no presentan moneda ausente como una moneda común o escala homogénea', () => {
  const statement = { currency: 'EUR', rows: [row('2024-12-31', null), row('2025-12-31', 'USD')] };
  assert.equal(statementNotes(statement).length, 2);
  assert.match(chartCaption(null), /no se puede asegurar su comparabilidad/);
  assert.match(chartCaption('EUR'), /no acredita una escala homogénea/);
  assert.doesNotMatch(chartCaption(null), /no se mezclan monedas/);
  assert.deepEqual(statementNotes({ currency: 'EUR', rows: [row('2025-12-31', 'EUR')] }), []);
});

test('fecha igual al cierre se describe sin corregirla ni certificar presentación oficial', () => {
  const same = { ...row('2025-09-30', 'EUR'), reportedAt: '2025-09-30' };
  const later = { ...row('2024-09-30', 'EUR'), reportedAt: '2024-11-06' };
  const missing = { ...row('2023-09-30', 'EUR'), reportedAt: null };
  const statement = { currency: 'EUR', rows: [missing, later, same] }, before = structuredClone(statement);
  assert.equal(filingMatchesClose(same), true); assert.equal(filingMatchesClose(later), false);
  assert.equal(filingMatchesClose(missing), false); assert.equal(filingMatchesClose({ period: null, reportedAt: null }), false);
  assert.deepEqual(inspectStatement(statement, ['netIncome'], 'EUR', '2026-09-03').filingDatesEqualClose, ['2025-09-30']);
  assert.match(statementNotes(statement).at(-1), /sin darla por acreditada/);
  assert.deepEqual(statement, before);
});
test('presentación de avisos corrige solo el texto heredado y no altera el documento recibido', () => {
  const company = { warnings: ['Las escalas contables no constan en estos archivos. Se muestran las cifras originales sin conversión ni atribución de unidad monetaria.', 'Otro aviso conservado'] };
  const before = structuredClone(company);
  assert.deepEqual(displayWarnings(company), [SCALE_NOTICE, 'Otro aviso conservado']);
  assert.deepEqual(company, before); assert.deepEqual(displayWarnings({ warnings: [SCALE_NOTICE] }), [SCALE_NOTICE]);
});

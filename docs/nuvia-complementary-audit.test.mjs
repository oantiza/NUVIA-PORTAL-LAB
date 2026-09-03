import test from 'node:test';
import assert from 'node:assert/strict';
import { dateStatus, inspectComplementary } from '../company-analysis/alfa/complementary-audit.mjs';
const entry = { isin: 'ES0000000001', symbol: 'TEST.MC' };
const asOf = '2026-09-03';
const fixture = () => ({ General: { Type: 'Common Stock', ISIN: entry.isin, Code: 'TEST', Exchange: 'MC', UpdatedAt: asOf },
  SplitsDividends: { DividendDate: '2026-04-01', ExDividendDate: '2026-10-01', ForwardAnnualDividendRate: 9 },
  Holders: { Institutions: { 0: { name: 'NO_EXPORTAR', date: '2026-06-30', totalShares: 0, currentShares: '0', contact: 'NO_EXPORTAR' }, 1: { name: 'NO_EXPORTAR', date: '2026-02-30', totalShares: null } }, Insiders: { name: 'NO_EXPORTAR' } },
});
test('fechas declaradas no equivalen a próximos pagos; inválidas y ausentes se distinguen', () => {
  assert.deepEqual(dateStatus('2026-02-30', asOf), { state: 'invalid', date: null });
  assert.equal(dateStatus('2026-09-03', asOf).state, 'pastOrToday');
  assert.equal(dateStatus('2026-10-01', asOf).state, 'future');
  for (const value of [null, undefined, '']) assert.equal(dateStatus(value, asOf).state, 'missing');
  for (const value of [0, {}, '03/09/2026', '2026-09-03T00:00:00Z']) assert.equal(dateStatus(value, asOf).state, 'invalid');
});
test('inventario sin mutar fuente ni exportar nombres, transacciones, importes estimados o contactos', () => {
  const raw = fixture(), before = structuredClone(raw);
  const result = inspectComplementary(raw, entry, asOf);
  assert.deepEqual(raw, before);
  assert.equal(result.institutions.objectRows, 2); assert.equal(result.institutions.datedRows, 1);
  assert.equal(result.institutions.percentageRows, 1); assert.equal(result.institutions.shareCountRows, 1);
  assert.equal(result.institutions.legalNatureVerified, false);
  assert.doesNotMatch(JSON.stringify(result), /NO_EXPORTAR|ForwardAnnual|Insiders|contact/);
});
test('no reutiliza un archivo con otro ISIN o mercado ni convierte ausencia en cobertura nominal', () => {
  const raw = fixture(); raw.General.ISIN = 'NL0000000002';
  assert.deepEqual(inspectComplementary(raw, entry, asOf), { state: 'identityMismatch' });
  raw.General.ISIN = entry.isin; raw.General.Exchange = 'AS';
  assert.deepEqual(inspectComplementary(raw, entry, asOf), { state: 'identityMismatch' });
  raw.General.Exchange = 'MC'; raw.Holders = {};
  assert.equal(inspectComplementary(raw, entry, asOf).institutions.objectRows, 0);
  raw.Holders = { Institutions: [{ name: 'NO_EXPORTAR', date: asOf, totalShares: 0 }] };
  assert.equal(inspectComplementary(raw, entry, asOf).institutions.objectRows, 1);
  raw.Holders.Institutions = 'ilegible';
  assert.equal(inspectComplementary(raw, entry, asOf).institutions.containerState, 'invalid');
  assert.throws(() => inspectComplementary(raw, entry, '2026-02-30'));
});

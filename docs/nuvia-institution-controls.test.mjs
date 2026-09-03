import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeInstitutions } from '../scripts/check-institution-controls.mjs';
test('distingue ausencia, vacío y filas conservando solo recuentos', () => {
  for (const value of ['NA', null, undefined]) assert.deepEqual(summarizeInstitutions(value), { state: 'not-reported', rows: 0 });
  assert.deepEqual(summarizeInstitutions({}), { state: 'empty', rows: 0, datedRows: 0, percentageRows: 0 });
  const result = summarizeInstitutions({ one: { name: 'NO EXPORTAR', date: '2026-06-30', totalShares: '0' } });
  assert.deepEqual(result, { state: 'rows', rows: 1, datedRows: 1, percentageRows: 1 });
  assert.doesNotMatch(JSON.stringify(result), /NO EXPORTAR|name/);
});
test('rechaza estructuras que no son filas', () => {
  for (const value of [false, 0, '', [], { one: null }, { one: [] }]) assert.throws(() => summarizeInstitutions(value));
});

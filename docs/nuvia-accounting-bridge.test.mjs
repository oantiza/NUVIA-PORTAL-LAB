import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGE_PLANS, bridgeFilters, projectBridge, arithmeticChecks } from '../scripts/check-company-accounting-bridge.mjs';
const plan = BRIDGE_PLANS[0];
function fixture() {
  const data = Object.fromEntries(bridgeFilters(plan).map(k => [k, null]));
  Object.assign(data, { 'General::Code': 'LOG', 'General::Exchange': 'MC', 'General::ISIN': plan.isin, 'General::Type': 'Common Stock' });
  for (const row of plan.rows) data[`Financials::${row.statement}::yearly::${row.period}`] = {
    date: row.period, totalRevenue: '20', costOfRevenue: '25', grossProfit: '-5', ebit: '0',
    depreciationAndAmortization: null, ebitda: '3', person: 'NO EXPORTAR', epsEstimate: 999,
  };
  return data;
}
test('proyección acotada conserva cero y pérdidas, excluye personas y estimaciones sin mutar', () => {
  const input = fixture(), before = structuredClone(input), result = projectBridge(input, plan);
  assert.deepEqual(input, before); assert.equal(result.rows[0].values.ebit, 0);
  assert.equal(result.rows[0].values.grossProfit, -5);
  assert.equal(result.rows[0].values.reconciledDepreciation, null);
  assert.doesNotMatch(JSON.stringify(result), /NO EXPORTAR|epsEstimate|999/);
});
test('rechaza identidad, periodo, contenedor y cifra inválidos', () => {
  const wrong = fixture(); wrong['General::ISIN'] = 'OTRO'; assert.throws(() => projectBridge(wrong, plan));
  assert.throws(() => projectBridge({ ...fixture(), Officers: [] }, plan));
  for (const patch of [{ date: '2026-09-30' }, { totalRevenue: false }, { totalRevenue: ' ' }, { totalRevenue: Infinity }]) {
    const data = fixture(); Object.assign(data['Financials::Income_Statement::yearly::2024-09-30'], patch);
    assert.throws(() => projectBridge(data, plan));
  }
});
test('aritmética no convierte componentes ausentes en cero ni en equivalencia acreditada', () => {
  const result = arithmeticChecks(projectBridge(fixture(), plan));
  assert.equal(result[0].difference, 0); assert.equal(result[1].expected, null); assert.equal(result[1].difference, null);
  assert.ok(result.every(row => row.note.includes('no acredita')));
});
test('fila ausente se declara y no produce cálculos', () => {
  const input = fixture(); for (const key of Object.keys(input)) if (key.startsWith('Financials::')) input[key] = null;
  const result = projectBridge(input, plan); assert.ok(result.rows.every(row => row.state === 'missing'));
  assert.deepEqual(arithmeticChecks(result), []);
});

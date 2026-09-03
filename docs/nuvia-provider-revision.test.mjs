import test from 'node:test';
import assert from 'node:assert/strict';
import { projectRevision, compareAnnualSnapshots, REVISION_FIELDS } from '../scripts/check-company-provider-revision.mjs';
import { COMPANY_FIELDS } from '../company-analysis/alfa/contract.mjs';

const entry = { assetId: 'ES0105027009', isin: 'ES0105027009', symbol: 'LOG.MC', quoteCurrency: 'EUR' };
function fixture() {
  const values = { Code: 'LOG', Exchange: 'MC', ISIN: entry.isin, Name: 'Logista', CurrencyCode: 'EUR', UpdatedAt: '2026-09-03', Type: 'Common Stock' };
  const result = Object.fromEntries(Object.entries(values).map(([k, v]) => [`General::${k}`, v]));
  for (const key of Object.keys(COMPANY_FIELDS)) {
    result[`Financials::${key}::currency_symbol`] = null;
    result[`Financials::${key}::yearly`] = { '2025-09-30': { currency_symbol: null, filing_date: '2025-09-30', totalRevenue: '0', netIncome: '-12', epsEstimate: '666', person: 'NO EXPORTAR' } };
  }
  return result;
}
test('lectura filtrada y proyección positiva sin personas, estimaciones, monedas heredadas ni ceros ficticios', () => {
  const input = fixture(), before = structuredClone(input), output = projectRevision(input, entry);
  assert.deepEqual(input, before); assert.equal(REVISION_FIELDS.length, 13);
  assert.equal(output.statements.Income_Statement.rows[0].totalRevenue, 0);
  assert.equal(output.statements.Income_Statement.rows[0].netIncome, -12);
  assert.equal(output.statements.Income_Statement.rows[0].grossProfit, null);
  assert.equal(output.statements.Income_Statement.rows[0].currency, null);
  assert.doesNotMatch(JSON.stringify(output), /NO EXPORTAR|epsEstimate|666/);
});
test('identidad diferente o respuesta no filtrada no entra en la comparación', () => {
  const data = fixture(); data['General::ISIN'] = 'FR0000120693';
  assert.throws(() => projectRevision(data, entry));
  assert.throws(() => projectRevision({ ...fixture(), General: { Officers: [] } }, entry));
  const invalid = fixture(); invalid['Financials::Cash_Flow::yearly'] = null;
  assert.throws(() => projectRevision(invalid, entry));
});
test('distingue periodo nuevo, desaparecido y cambio de cifras sin modificar la copia', () => {
  const a = projectRevision(fixture(), entry), b = structuredClone(a);
  b.statements.Income_Statement.rows.push({ ...b.statements.Income_Statement.rows[0], period: '2026-09-30' });
  b.statements.Cash_Flow.rows = [];
  b.statements.Balance_Sheet.rows[0].currency = 'EUR';
  const before = structuredClone(a), changes = compareAnnualSnapshots(a, b);
  assert.deepEqual(a, before);
  assert.equal(changes.find(s => s.statement === 'Income_Statement').rows.at(-1).state, 'new-in-provider');
  assert.equal(changes.find(s => s.statement === 'Cash_Flow').rows[0].state, 'not-in-provider');
  assert.deepEqual(changes.find(s => s.statement === 'Balance_Sheet').rows[0].changes, [{ field: 'currency', before: null, after: 'EUR' }]);
});

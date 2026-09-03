import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compareCase } from '../scripts/check-company-issuer-evidence.mjs';

const source = { currency: 'EUR', sourceUnitMultiplier: 1000 };
const item = { symbol: 'LOG.MC', isin: 'ES0105027009', statement: 'Cash_Flow', period: '2025-09-30', source: 'logista-fy25',
  fields: [{ field: 'dividendsPaid', sourceValue: -275943, relation: 'outflow-magnitude' }] };
const company = value => ({ symbol: 'LOG.MC', identity: { isin: 'ES0105027009' }, statements: { Cash_Flow: { currency: null,
  rows: [{ period: '2025-09-30', reportedAt: null, currency: null, scale: null, dividendsPaid: value }] } } });

test('contraste convierte solo la referencia y conserva signo, escala y moneda almacenados', () => {
  const data = company(275943000); const before = structuredClone(data);
  const result = compareCase(data, item, source);
  assert.deepEqual(data, before); assert.equal(result.storedCurrency, null); assert.equal(result.storedScale, null);
  assert.equal(result.fields[0].issuerBaseValue, -275943000);
  assert.equal(result.fields[0].comparisonValue, 275943000); assert.equal(result.fields[0].numericEqual, true);
});
test('ausencia no se convierte en cero; cero y pérdidas conservan su valor', () => {
  assert.equal(compareCase(company(null), item, source).fields[0].numericEqual, null);
  assert.equal(compareCase(company(0), item, source).fields[0].difference, -275943000);
  assert.equal(compareCase(company(-1), item, source).fields[0].storedValue, -1);
  assert.throws(() => compareCase(company('275943000'), item, source), /Cifra/);
});
test('no combina identidades, estados ni cierres distintos o duplicados', () => {
  assert.throws(() => compareCase({ ...company(0), symbol: 'RI.PA' }, item, source), /Símbolo/);
  const other = company(0); other.identity.isin = 'FR0000120693';
  assert.throws(() => compareCase(other, item, source), /ISIN/);
  assert.equal(compareCase(company(0), { ...item, period: '2026-09-30' }, source).rowPresent, false);
  const duplicate = company(0); duplicate.statements.Cash_Flow.rows.push({ ...duplicate.statements.Cash_Flow.rows[0] });
  assert.throws(() => compareCase(duplicate, item, source), /duplicado/);
});
test('coincidencia aritmética no borra una definición pendiente ni inventa referencias', () => {
  const ambiguous = { ...item, fields: [{ ...item.fields[0], sourceValue: 3, relation: 'definition-unresolved' }] };
  const result = compareCase(company(3000), ambiguous, source).fields[0];
  assert.equal(result.numericEqual, true); assert.equal(result.relation, 'definition-unresolved');
  ambiguous.fields[0].sourceValue = null; ambiguous.fields[0].relation = 'not-reconciled';
  assert.equal(compareCase(company(3000), ambiguous, source).fields[0].comparisonValue, null);
});
test('referencias acotadas: no admiten campos de estimaciones ni factores arbitrarios', () => {
  assert.throws(() => compareCase(company(0), { ...item, fields: [{ ...item.fields[0], field: 'epsEstimate' }] }, source), /Campo/);
  assert.throws(() => compareCase(company(0), item, { ...source, sourceUnitMultiplier: 0 }));
  assert.throws(() => compareCase(company(0), { ...item, fields: [{ ...item.fields[0], sourceValue: 5 }] }, source));
});
test('registro local cubre exactamente los quince campos de las tres filas pendientes', async () => {
  const evidence = JSON.parse(await readFile(new URL('./evidence/fundamentales-emisores-20260903.json', import.meta.url), 'utf8'));
  assert.equal(evidence.cases.length, 3);
  assert.equal(evidence.cases.flatMap(c => c.fields).length, 15);
  for (const c of evidence.cases) {
    assert.equal(new Set(c.fields.map(f => f.field)).size, c.fields.length);
    assert.ok(evidence.sources[c.source]);
    assert.ok(c.fields.every(f => Number.isInteger(f.page) && f.page > 0));
  }
});

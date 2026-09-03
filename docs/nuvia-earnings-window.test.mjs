import test from 'node:test';
import assert from 'node:assert/strict';
import { earningsWindow } from '../company-analysis/alfa/earnings-window.mjs';

const row = (period, actual = 1, reportedAt = null) => ({ period, actual, reportedAt, currency: 'EUR' });
test('BPA usa fechas de periodo, no cuatro comunicados por año ni fecha de publicación', () => {
  const data = [row('2026-06-30'), row('2025-06-30'), row('2022-06-30'), row('2021-07-01'), row('2021-06-30', 9, '2026-09-01')];
  const before = structuredClone(data), result = earningsWindow(data, 5);
  assert.deepEqual(result.rows.map(r => r.period), ['2026-06-30', '2025-06-30', '2022-06-30', '2021-07-01']);
  assert.equal(result.after, '2021-06-30'); assert.equal(result.through, '2026-06-30');
  assert.deepEqual(data, before);
});
test('conserva más de 20 comunicados, pérdidas, ceros y duplicados dentro de cinco años', () => {
  const data = Array.from({ length: 30 }, (_, i) => row(`2025-${String(i % 12 + 1).padStart(2, '0')}-01`, i === 0 ? 0 : -i));
  assert.equal(earningsWindow(data, '5').rows.length, 30);
  assert.equal(earningsWindow(data, 'all').rows.length, 30);
});
test('no atribuye una fecha a los comunicados sin periodo; los conserva al final', () => {
  const undated = row(null, 0, '2026-01-01');
  const result = earningsWindow([undated, row('2025-01-01'), row('2020-01-01')], 5);
  assert.equal(result.undated, 1); assert.equal(result.rows.at(-1), undated);
  assert.equal(result.rows.length, 2);
  assert.equal(earningsWindow([undated], 5).through, null);
});
test('ventana bisiesta y todos los periodos sin truncar ni usar el día de consulta', () => {
  const data = [row('2024-02-29'), row('2019-03-01'), row('2019-02-28')];
  assert.equal(earningsWindow(data, 5).after, '2019-02-28');
  assert.equal(earningsWindow(data, 5).rows.length, 2);
  assert.equal(earningsWindow(data, 'all').rows.length, 3);
  assert.equal(earningsWindow([], 10).rows.length, 0);
});
test('opciones inesperadas no aparentan un histórico válido', () => {
  for (const limit of [0, -1, 1.5, 'none', null]) assert.throws(() => earningsWindow([], limit));
});

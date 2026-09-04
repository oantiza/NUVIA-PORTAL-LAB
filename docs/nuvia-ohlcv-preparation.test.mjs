import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectOhlcv, annualOhlcv, adjustedCandles, atrWilder } from '../company-analysis/alfa/ohlcv.mjs';

const p = { date: '2025-06-18', open: 100, high: 110, low: 90, close: 100, adjusted_close: 10, volume: 1000 };
const meta = { isin: 'ES0105046017', symbol: 'AENA.MC', currency: 'EUR', fetchedAt: '2026-09-04T00:00:00Z', revision: 'a'.repeat(64) };
test('OHLCV: lista blanca, originales intactos, cero volumen distinto de ausente', () => {
  const source = { ...p, volume: 0, personalName: 'no copiar' };
  const result = inspectOhlcv([source]);
  assert.equal(result.points[0].volume, 0); assert.equal(source.personalName, 'no copiar');
  assert.equal(result.points[0].personalName, undefined);
  assert.equal(inspectOhlcv([{ ...p, volume: undefined }]).points[0].volume, null);
  const docs = annualOhlcv([source], meta);
  assert.equal(docs[0].path, 'assets/ES0105046017/ohlcv/2025');
  assert.deepEqual(docs[0].value.points, result.points);
  assert.equal(docs[0].value.source.volume_basis, 'split-adjusted');
});
test('OHLCV: no convierte nulos, strings, rangos incoherentes o fechas en datos válidos', () => {
  for (const patch of [{ open: null }, { close: '100' }, { low: 101 }, { high: 99 }, { date: '2025-02-30' }, { volume: -1 }, { volume: 1.2 }, { adjusted_close: 0 }]) {
    const source = [{ ...p, ...patch }];
    assert.equal(inspectOhlcv(source).issues.length, 1);
    assert.throws(() => annualOhlcv(source, meta), /requiere revisión/);
  }
  assert.equal(inspectOhlcv([p, p]).issues[0].reason, 'order-or-duplicate');
  assert.throws(() => annualOhlcv([p], { ...meta, isin: '../outside' }));
  assert.throws(() => annualOhlcv([p], { ...meta, currency: 'USD' }));
});
test('ajuste: el split no se convierte en caída; volumen no se vuelve a ajustar', () => {
  const source = [p, { ...p, date: '2025-06-19', open: 10, high: 11, low: 9, close: 10, adjusted_close: 10 }];
  const copy = structuredClone(source), adjusted = adjustedCandles(source);
  assert.deepEqual(adjusted.map(({ factor, date, ...values }) => values), [0, 1].map(() => ({ open: 10, high: 11, low: 9, close: 10, volume: 1000 })));
  assert.deepEqual(source, copy);
  assert.equal(atrWilder(adjusted, 2).at(-1).atr, 2);
  assert.ok(atrWilder(source, 2).at(-1).atr > 40);
});
test('ATR: semilla y suavizado manual, plano, historial corto y reinicio tras hueco', () => {
  const candles = Array.from({ length: 16 }, (_, i) => ({ ...p, date: `2025-07-${String(i + 1).padStart(2, '0')}`, high: 101, low: 99 }));
  const values = atrWilder(candles);
  assert.equal(values[12].atr, null); assert.equal(values[13].atr, 2);
  candles[14].high = 103;
  assert.ok(Math.abs(atrWilder(candles)[14].atr - 30 / 14) < 1e-12);
  assert.equal(atrWilder([{ ...p, high: 100, low: 100 }], 1)[0].atr, 0);
  assert.equal(atrWilder([...candles, { ...p, date: '2025-08-15' }]).at(-1).atr, null);
  assert.throws(() => atrWilder(candles, 0));
  assert.throws(() => atrWilder([p, p]));
});

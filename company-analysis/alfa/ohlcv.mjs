// Preparación pura: no red, almacenamiento, escritor ni activación en la web.
import { validDay, technicalAnalysis } from './technical.mjs';

export const OHLCV_SCHEMA = 'nuvia-ohlcv.v1';
const positive = value => Number.isFinite(value) && value > 0;
export function inspectOhlcv(input) {
  if (!Array.isArray(input)) return { points: [], issues: [{ row: null, reason: 'not-array' }] };
  const points = [], issues = []; let previous = null;
  for (const [row, p] of input.entries()) {
    let reason = null;
    if (!p || !validDay(p.date)) reason = 'date';
    else if (previous && p.date <= previous) reason = 'order-or-duplicate';
    else if (!['open', 'high', 'low', 'close', 'adjusted_close'].every(key => positive(p[key]))) reason = 'price';
    else if (p.low > Math.min(p.open, p.close) || p.high < Math.max(p.open, p.close) || p.high < p.low) reason = 'range';
    else if (p.volume != null && (!Number.isSafeInteger(p.volume) || p.volume < 0)) reason = 'volume';
    if (p && validDay(p.date)) previous = p.date;
    if (reason) { issues.push({ row, date: validDay(p?.date) ? p.date : null, reason }); continue; }
    points.push({ date: p.date, open: p.open, high: p.high, low: p.low, close: p.close,
      adjusted_close: p.adjusted_close, volume: p.volume ?? null });
  }
  return { points, issues };
}
function checked(input) {
  const result = inspectOhlcv(input);
  if (result.issues.length) throw new Error('OHLCV requiere revisión: no se proyecta una serie parcial como completa.');
  return result.points;
}
export function annualOhlcv(input, { isin, symbol, currency, fetchedAt, revision }) {
  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin) || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(symbol)
    || currency !== 'EUR' || !Number.isFinite(Date.parse(fetchedAt)) || !/^[a-f0-9]{64}$/.test(revision)) throw new Error('Metadatos OHLCV no válidos.');
  const groups = new Map();
  for (const point of checked(input)) {
    const year = Number(point.date.slice(0, 4));
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(point);
  }
  return [...groups].map(([year, points]) => ({
    path: `assets/${isin}/ohlcv/${year}`,
    value: { schema_version: OHLCV_SCHEMA, asset_id: isin, isin, symbol, currency,
      year, revision, source: { system: 'EODHD', endpoint: 'eod', fetched_at: fetchedAt,
        price_basis: 'unadjusted', adjusted_close_basis: 'splits-and-dividends', volume_basis: 'split-adjusted' },
      n: points.length, first_date: points[0].date, last_date: points.at(-1).date, points },
  }));
}
// Derivado explícito para compartir escala con adjusted_close; volumen intacto.
export function adjustedCandles(input) {
  return checked(input).map(p => {
    const factor = p.adjusted_close / p.close;
    const result = { date: p.date, open: p.open * factor, high: p.high * factor,
      low: p.low * factor, close: p.adjusted_close, volume: p.volume, factor };
    if (!['open', 'high', 'low', 'close', 'factor'].every(key => positive(result[key]))) throw new Error('Desbordamiento numérico del ajuste.');
    return result;
  });
}
// ATR de Wilder: primer TR=H-L, semilla media de n TR; luego (ATR*(n-1)+TR)/n.
// Se reinicia tras >10 días naturales, igual que el resto del técnico de la alfa.
export function atrWilder(candles, period = 14) {
  if (!Number.isInteger(period) || period < 1) throw new Error('Periodo ATR no válido.');
  let previous = null, seed = [], atr = null;
  return candles.map(p => {
    const epsilon = Math.max(p?.high || 0, p?.close || 0, p?.open || 0) * Number.EPSILON * 8;
    if (!validDay(p?.date) || !['open', 'high', 'low', 'close'].every(key => positive(p[key]))
      || p.low > Math.min(p.open, p.close) + epsilon || p.high + epsilon < Math.max(p.open, p.close)
      || previous && p.date <= previous.date) throw new Error('Vela ATR no válida.');
    if (previous && Date.parse(p.date) - Date.parse(previous.date) > 10 * 86400000) { previous = null; seed = []; atr = null; }
    const tr = previous ? Math.max(p.high - p.low, Math.abs(p.high - previous.close), Math.abs(p.low - previous.close)) : p.high - p.low;
    if (atr === null) { seed.push(tr); if (seed.length === period) atr = seed.reduce((a, b) => a + b, 0) / period; }
    else atr += (tr - atr) / period;
    previous = p;
    if (atr !== null && !Number.isFinite(atr)) throw new Error('Desbordamiento numérico del ATR.');
    return { date: p.date, tr, atr };
  });
}

// Todos los indicadores comparten descarga y escala, sin mezclar /series/.
export function technicalOhlcv(raw) {
  const candles = adjustedCandles(raw), atr = atrWilder(candles);
  const analysis = technicalAnalysis(candles.map(p => ({date:p.date,value:p.close})));
  const rows = analysis.rows.map((row,i) => ({...row,candle:candles[i],atr:atr[i].atr,volume:raw[i].volume,
    rawOpen:raw[i].open,rawHigh:raw[i].high,rawLow:raw[i].low,rawClose:raw[i].close,factor:candles[i].factor}));
  return {...analysis,rows,latest:rows.at(-1) ?? null};
}

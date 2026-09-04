// Deterministic descriptive indicators. No provider predictions or trading signals.
export const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function yearsBefore(day, years) {
  const d = new Date(day + 'T00:00:00Z'), month = d.getUTCMonth();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  if (d.getUTCMonth() !== month) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
export function daysBefore(day, days) { return new Date(Date.parse(day) - days * 86400000).toISOString().slice(0, 10); }
export function sma(values, n) {
  return values.map((_, i) => {
    const w = values.slice(Math.max(0, i - n + 1), i + 1);
    return w.length === n && w.every(Number.isFinite) ? w.reduce((a, b) => a + b, 0) / n : null;
  });
}
export function ema(values, n) {
  let previous = null, seed = [];
  return values.map(value => {
    if (!Number.isFinite(value)) { previous = null; seed = []; return null; }
    if (previous === null) {
      seed.push(value);
      if (seed.length < n) return null;
      previous = seed.reduce((a, b) => a + b, 0) / n;
    } else previous += 2 / (n + 1) * (value - previous);
    return previous;
  });
}
export function rsi(values, n = 14) {
  let gain = 0, loss = 0;
  return values.map((v, i) => {
    if (!i) return null;
    const delta = v - values[i - 1], g = Math.max(0, delta), l = Math.max(0, -delta);
    if (i <= n) { gain += g / n; loss += l / n; }
    else { gain = (gain * (n - 1) + g) / n; loss = (loss * (n - 1) + l) / n; }
    if (i < n) return null;
    return loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  });
}
function deviation(values, sample = false) {
  if (values.length < (sample ? 2 : 1)) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - (sample ? 1 : 0)));
}
function calculateSegment(points) {
  const values = points.map(p => p.value), fast = ema(values, 12), slow = ema(values, 26);
  const macd = values.map((_, i) => fast[i] !== null && slow[i] !== null ? fast[i] - slow[i] : null);
  const signal = ema(macd, 9), mid = sma(values, 20), strength = rsi(values), short = sma(values, 50), long = sma(values, 200);
  return points.map((p, i) => {
    const sd = i >= 19 ? deviation(values.slice(i - 19, i + 1)) : null;
    return { ...p, sma50: short[i], sma200: long[i], rsi: strength[i], macd: macd[i], signal: signal[i],
      histogram: signal[i] !== null ? macd[i] - signal[i] : null,
      upper: sd !== null ? mid[i] + 2 * sd : null, lower: sd !== null ? mid[i] - 2 * sd : null };
  });
}
export function historicalChange(points, target) {
  const first = points.filter(p => p.date <= target).at(-1), last = points.at(-1);
  if (!first || !last || Date.parse(target) - Date.parse(first.date) > 10 * 86400000) return null;
  return { value: last.value / first.value - 1, from: first.date, to: last.date };
}
export function technicalAnalysis(points) {
  if (!Array.isArray(points)) throw new Error('Serie no válida.');
  points.forEach((p, i) => {
    if (!validDay(p.date) || !Number.isFinite(p.value) || p.value <= 0 || i && p.date <= points[i - 1].date) throw new Error('Serie no válida.');
  });
  if (!points.length) return { rows: [], latest: null, gaps: [] };
  const segments = [[]], gaps = [];
  for (const p of points) {
    const last = segments.at(-1).at(-1);
    if (last && Date.parse(p.date) - Date.parse(last.date) > 10 * 86400000) {
      gaps.push({ from: last.date, to: p.date }); segments.push([]);
    }
    segments.at(-1).push(p);
  }
  const rows = segments.flatMap(calculateSegment), tail = segments.at(-1), last = rows.at(-1);
  const yearTarget = yearsBefore(last.date, 1), yearChange = historicalChange(tail, yearTarget);
  const yearRows = yearChange ? tail.filter(p => p.date >= yearChange.from) : [];
  let peak = 0, drawdown = 0;
  yearRows.forEach(p => { peak = Math.max(peak, p.value); drawdown = Math.min(drawdown, p.value / peak - 1); });
  const returns = tail.slice(-31).slice(1).map((p, i) => Math.log(p.value / tail.slice(-31)[i].value));
  const windows = [['1 semana', daysBefore(last.date, 7)], ['1 mes', daysBefore(last.date, 30)],
    ['3 meses', daysBefore(last.date, 90)], ['6 meses', daysBefore(last.date, 183)],
    ['Año en curso', `${Number(last.date.slice(0, 4)) - 1}-12-31`], ['12 meses', yearTarget]];
  return { rows, gaps, latest: last, volatility: returns.length === 30 ? deviation(returns, true) * Math.sqrt(252) : null,
    high: yearRows.length ? Math.max(...yearRows.map(p => p.value)) : null,
    low: yearRows.length ? Math.min(...yearRows.map(p => p.value)) : null,
    drawdown: yearRows.length ? drawdown : null,
    performance: windows.map(([label, target]) => ({ label, ...historicalChange(tail, target) })) };
}

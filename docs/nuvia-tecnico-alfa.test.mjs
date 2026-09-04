import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const readSource = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
import { sma, ema, rsi, technicalAnalysis, yearsBefore, historicalChange } from '../company-analysis/alfa/technical.mjs';
import { readPrices } from '../company-analysis/src/alfa/prices.js';
import { BASE, wire } from './fixtures/fundamentales-remote.mjs';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const points = Array.from({ length: 240 }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10), value: i + 1 }));
test('serie lineal: SMA, EMA, RSI, MACD y Bollinger coinciden con valores independientes', () => {
  const a = technicalAnalysis(points), l = a.latest;
  close(l.sma50, 215.5); close(l.sma200, 140.5); close(l.rsi, 100);
  close(l.macd, 7); close(l.signal, 7); close(l.histogram, 0);
  close(l.lower, 230.5 - 2 * Math.sqrt(399 / 12)); close(l.upper, 230.5 + 2 * Math.sqrt(399 / 12));
  assert.equal(a.high, null, 'No presenta ocho meses como un año completo');
  assert.equal(a.rows[198].sma200, null); assert.equal(a.rows[199].sma200, 100.5);
  assert.equal(a.rows[32].signal, null); assert.equal(a.rows[33].signal, 7);
});
test('series planas, pérdidas y RSI Wilder sin divisiones por cero', () => {
  const flat = technicalAnalysis(points.map(p => ({ ...p, value: 40 })));
  assert.equal(flat.latest.rsi, 50); assert.equal(flat.latest.macd, 0); assert.equal(flat.volatility, 0);
  assert.equal(flat.latest.lower, 40); assert.equal(flat.latest.upper, 40);
  const down = technicalAnalysis(points.map((p, i) => ({ ...p, value: 250 - i })));
  assert.equal(down.latest.rsi, 0); close(down.latest.macd, -7);
  const values = [44.34,44.09,44.15,43.61,44.33,44.83,45.1,45.42,45.84,46.08,45.89,46.03,45.61,46.28,46.28,46];
  close(rsi(values)[14], 70.46413502109705); close(rsi(values)[15], 66.24961855355505);
});
test('preparación, calendario bisiesto, datos vacíos y ventanas reales', () => {
  assert.deepEqual(sma([1, 2], 3), [null, null]);
  assert.deepEqual(ema([null,1,2,3,4], 3), [null,null,null,2,3]);
  assert.deepEqual(technicalAnalysis([]), { rows: [], latest: null, gaps: [] });
  assert.equal(yearsBefore('2024-02-29', 1), '2023-02-28');
  assert.equal(historicalChange(points, '2024-01-01'), null);
  const result = historicalChange(points, '2025-01-10');
  assert.equal(result.from, '2025-01-10'); close(result.value, 23);
  const year = Array.from({ length: 370 }, (_, i) => ({ date: new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10), value: i < 200 ? 100 : 50 }));
  const a = technicalAnalysis(year); close(a.drawdown, -.5); assert.equal(a.high, 100); assert.equal(a.low, 50);
});
test('los saltos reinician los indicadores y no convierten ausencias en cero', () => {
  const a = technicalAnalysis([...points, { date: '2026-02-01', value: 80 }]);
  assert.equal(a.gaps.length, 1); assert.equal(a.latest.sma50, null); assert.equal(a.latest.rsi, null); assert.equal(a.volatility, null);
  for (const bad of [null, 0, -1, Infinity, NaN, '10']) assert.throws(() => technicalAnalysis([{ date: '2025-01-01', value: bad }]));
  assert.throws(() => technicalAnalysis([{ date: '2025-02-29', value: 2 }]));
  assert.throws(() => technicalAnalysis([points[0], points[0]]));
});

const entry = { assetId: 'ES0144580Y14', isin: 'ES0144580Y14', symbol: 'IBE.MC', quoteCurrency: 'EUR' };
function fixture(e = entry) {
  const asset = { asset_id: e.assetId, isin: e.isin, eodhd_symbol: e.symbol, currency: 'EUR',
    history: { first_date: '2021-01-04', last_date: '2026-09-02' }, updated_at: '2026-09-03T00:00:00Z',
    source: { system: 'EODHD', symbol: e.symbol, fetched_at: '2026-09-02T20:00:00Z' } };
  const annual = year => {
    const date = year === 2026 ? '2026-09-02' : `${year}-01-04`;
    return { asset_id: e.assetId, year, currency: 'EUR', first_date: date, last_date: date, n: 1, points: [{ date, value: 10 }] };
  };
  return { asset, annual };
}
function transport({ e = entry, alter = () => {}, missing, controller } = {}) {
  const { asset, annual } = fixture(e), calls = []; let assetReads = 0;
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    assert.ok(url.startsWith(`${BASE}/assets/${e.assetId}`));
    assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error'); assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.headers, undefined);
    const path = url.slice(BASE.length + 1), year = Number(path.split('/').at(-1));
    const doc = Number.isInteger(year) ? annual(year) : structuredClone(asset);
    if (!Number.isInteger(year)) assetReads++;
    alter(doc, { year, assetReads });
    return { status: year === missing ? 404 : 200, ok: true, json: async () => { if (controller) controller.abort(); return wire(path, doc); } };
  };
  return { fetchFn, calls };
}
test('lector: solo la empresa elegida, seis años naturales, sin autenticación ni escrituras', async () => {
  const t = transport(); const d = await readPrices(entry, t);
  assert.equal(t.calls.length, 8); assert.equal(d.points.length, 6); assert.equal(d.lastDate, '2026-09-02');
  assert.deepEqual(Object.keys(d).sort(), ['currency','fetchedAt','lastDate','loadedAt','points']);
});
test('lector: alias aprobado de Ferrovial usa la identidad actual', async () => {
  const e = { assetId: 'NL0015001FS8', isin: 'NL0015001FS8', symbol: 'FER.MC', quoteCurrency: 'EUR' };
  const t = transport({ e }); await readPrices({ ...e, assetId: 'ES0118900010', isin: 'ES0118900010' }, t);
  assert.ok(t.calls.every(c => !c.url.includes('ES0118900010')));
});
test('lector: rechaza identidad, moneda, formato, duplicados y revisión cruzada', async () => {
  for (const alter of [
    d => { d.currency = 'USD'; },
    d => { d.asset_id = 'ES0000000000'; },
    (d, { year }) => { if (year) d.points[0].value = null; },
    (d, { year }) => { if (year) { d.points.push(d.points[0]); d.n++; } },
    (d, { year }) => { if (year) d.n = 20; },
    (d, { year }) => { if (year) d.points[0].date = '2026-02-30'; },
    (d, { assetReads, year }) => { if (!year && assetReads === 2) d.updated_at = '2026-09-04T00:00:00Z'; },
  ]) await assert.rejects(readPrices(entry, transport({ alter })), { code: 'prices' });
  await assert.rejects(readPrices(entry, transport({ missing: 2024 })), /2024/);
  await assert.rejects(readPrices({ ...entry, assetId: '../other' }, transport()), /Identificador/);
});
test('lector: fallo y cancelación no entregan una serie parcial ni cifras tardías', async () => {
  await assert.rejects(readPrices(entry, { fetchFn: async () => { throw new Error('offline'); } }), /offline/);
  const controller = new AbortController();
  await assert.rejects(readPrices(entry, { ...transport({ controller }), signal: controller.signal }), { name: 'AbortError' });
});
test('la pestaña no depende del éxito de los fundamentales ni conecta la API antigua', async () => {
  const app = await readSource('company-analysis/src/alfa/App.jsx');
  assert.match(app, /const tabs = \['Resumen', 'Fundamentales', 'Técnico', 'Informe'\]/);
  assert.ok(app.indexOf('<CompanyTechnical') < app.indexOf("{company && <div"));
  const ui = await readSource('company-analysis/src/alfa/CompanyTechnical.jsx');
  assert.match(ui, /AbortController/); assert.match(ui, /controller.abort/);
  assert.match(ui, /Serie de datos/); assert.match(ui, /cierre ajustado/); assert.match(ui, /Velas ajustadas/);
  for (const file of ['prices.js', 'ohlcv.js', 'CompanyTechnical.jsx', 'TechnicalChart.jsx']) {
    const source = await readSource(`company-analysis/src/alfa/${file}`);
    assert.doesNotMatch(source, /auth.currentUser|localStorage|sessionStorage|setDoc|addDoc|api\(/);
  }
});

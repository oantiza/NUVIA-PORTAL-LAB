import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readDividendDates } from '../company-analysis/src/alfa/remote.js';
import { BASE, wire, fixtureDividendDates } from './fixtures/fundamentales-remote.mjs';
const entry = { assetId: 'ES0000000001', isin: 'ES0000000001', symbol: 'TEST.MC', quoteCurrency: 'EUR' };
const path = `assets/${entry.isin}/fundamentals/dividends`;
const response = (value = fixtureDividendDates(entry), name = path) => ({ status: 200, ok: true, json: async () => wire(name, value) });

test('fechas: una lectura anónima de la empresa elegida, sin cambiar el contrato contable', async () => {
  const controller = new AbortController(), calls = [];
  const result = await readDividendDates(entry, { signal: controller.signal, fetchFn: async (url, options) => {
    calls.push(url); assert.equal(url, `${BASE}/${path}`); assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store');
    assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.redirect, 'error');
    assert.equal(options.signal, controller.signal); assert.equal(options.headers, undefined); assert.equal(options.body, undefined);
    return response();
  } });
  assert.equal(calls.length, 1); assert.equal(result.state, 'ready');
  assert.equal(result.dates.dividendDate, null); assert.equal(result.dates.exDividendDate, '2026-10-01');
});
test('fechas: un documento ausente no equivale a dos fechas no informadas', async () => {
  assert.deepEqual(await readDividendDates(entry, { fetchFn: async () => ({ status: 404, ok: false }) }), { state: 'missing', dates: null });
  const doc = fixtureDividendDates(entry, { dividendDate: null, exDividendDate: null, availability: 'notReported' });
  assert.equal((await readDividendDates(entry, { fetchFn: async () => response(doc) })).state, 'ready');
});
test('fechas: rechaza identidad cruzada, campos no permitidos y calendarios inválidos', async () => {
  for (const change of [d => { d.isin = 'NL0000000002'; }, d => { d.symbol = 'OTHER.MC'; },
    d => { d.exDividendDate = '2026-02-30'; }, d => { d.ForwardAnnualDividendRate = 1; }, d => { d.Officers = 'NO_MOSTRAR'; }]) {
    const doc = fixtureDividendDates(entry); change(doc);
    await assert.rejects(readDividendDates(entry, { fetchFn: async () => response(doc) }));
  }
  await assert.rejects(readDividendDates(entry, { fetchFn: async () => response(fixtureDividendDates(entry), 'assets/otra/fundamentals/dividends') }), { code: 'format' });
  let calls = 0;
  await assert.rejects(readDividendDates({ ...entry, assetId: '../otra' }, { fetchFn: async () => { calls++; } }), { code: 'identity' });
  assert.equal(calls, 0);
});
test('fechas: error recuperable, sin consultar respaldos ni reintentar automáticamente', async () => {
  let calls = 0;
  await assert.rejects(readDividendDates(entry, { fetchFn: async () => { calls++; return { ok: false, status: 503 }; } }), { code: 'network' });
  assert.equal(calls, 1);
});
test('fechas: la cancelación impide entregar una respuesta o cuerpo tardíos', async () => {
  for (const moment of ['before', 'response', 'json']) {
    const controller = new AbortController(); let calls = 0;
    if (moment === 'before') controller.abort();
    await assert.rejects(readDividendDates(entry, { signal: controller.signal, fetchFn: async () => {
      calls++; if (moment === 'response') controller.abort();
      return { ok: true, status: 200, json: async () => { controller.abort(); return wire(path, fixtureDividendDates(entry)); } };
    } }), { name: 'AbortError' });
    assert.equal(calls, moment === 'before' ? 0 : 1);
  }
});
test('fechas: presentación separa ausencia, pasado, futuro, procedencia y reintento', async () => {
  const { createServer } = await import('../company-analysis/node_modules/vite/dist/node/index.js');
  const React = (await import('../company-analysis/node_modules/react/index.js')).default;
  const { renderToStaticMarkup } = await import('../company-analysis/node_modules/react-dom/server.node.js');
  const server = await createServer({ configFile: false, envDir: false, root: fileURLToPath(new URL('../company-analysis/', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { DividendDatesContent } = await server.ssrLoadModule('/src/alfa/CompanyDividendDates.jsx');
    const render = reading => renderToStaticMarkup(React.createElement(DividendDatesContent, { reading, onRetry() {} }));
    const ready = render({ state: 'ready', dates: fixtureDividendDates(entry, { dividendDate: '2024-05-21', availability: 'both' }) });
    for (const phrase of ['Fechas de dividendos', '21 may 2024', 'Anterior a la consulta', 'Posterior a la consulta', 'Fuente de estas fechas: EODHD', 'eventos distintos', 'no actualiza las cuentas anuales', 'UTC']) assert.ok(ready.includes(phrase), phrase);
    assert.doesNotMatch(ready, /Próximo pago|PER estimado|BPA previsto|Dividendo anual estimado|NaN/);
    const empty = render({ state: 'ready', dates: fixtureDividendDates(entry, { exDividendDate: null, availability: 'notReported' }) });
    assert.equal((empty.match(/<dd>No informada<\/dd>/g) || []).length, 2); assert.match(empty, /no significa dividendo cero/);
    assert.match(render({ state: 'missing' }), /No hay un complemento de fechas cargado/);
    assert.match(render(null), /role="status"/); assert.doesNotMatch(render(null), /<button/);
    const error = render({ state: 'error', error: 'No se han podido consultar las fechas.' });
    assert.match(error, /role="alert"/); assert.match(error, /Volver a consultar las fechas/);
    const sameDay = render({ state: 'ready', dates: fixtureDividendDates(entry, { exDividendDate: '2026-09-03' }) });
    assert.match(sameDay, /Coincide con el día/);
  } finally { await server.close(); }
});
test('fechas: integración aislada por empresa y sin almacenamiento ni escrituras', async () => {
  const app = await readFile(new URL('../company-analysis/src/alfa/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /<CompanyDividendDates key=\{entry.assetId\} entry=\{entry\}/);
  const component = await readFile(new URL('../company-analysis/src/alfa/CompanyDividendDates.jsx', import.meta.url), 'utf8');
  assert.match(component, /active = false/); assert.match(component, /controller.abort\(\)/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|setDoc|deleteDoc|api_token|fetch\(/);
});

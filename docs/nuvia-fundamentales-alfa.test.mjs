import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { projectAlphaCompany, buildAlphaSnapshot } from '../company-analysis/alfa/project.mjs';
import { readSnapshot, searchCompanies } from '../company-analysis/src/alfa/client.js';

const asset = { asset_id: 'ES0000000001', isin: 'ES0000000001', eodhd_symbol: 'TEST.MC', display_name: 'Empresa Prueba', currency: 'EUR' };
function fixture() {
  const yearly = { '2025-06-30': { date: '2025-06-30', currency_symbol: 'USD', filing_date: '2025-09-01', totalRevenue: '2000', netIncome: '-100', cash: '0', freeCashFlow: null, private_field: 'NO_TRANSFERIR' }, '2024-06-30': { date: '2024-06-30', totalRevenue: '1000', netIncome: '0' } };
  return { General: { Code: 'TEST', Type: 'Common Stock', Exchange: 'MC', Name: 'Empresa Prueba', ISIN: asset.isin, CurrencyCode: 'EUR', UpdatedAt: '2026-09-01', Officers: { name: 'NO_TRANSFERIR' } }, Highlights: { PERatio: 0, ProfitMargin: 0.1, EPSEstimateNextYear: 'NO_TRANSFERIR', WallStreetTargetPrice: 'NO_TRANSFERIR' }, Valuation: { PriceSalesTTM: 4 }, Financials: Object.fromEntries(['Income_Statement', 'Balance_Sheet', 'Cash_Flow'].map(key => [key, { currency_symbol: 'EUR', yearly: structuredClone(yearly) }])) };
}
function snapshot(raw = fixture()) { return buildAlphaSnapshot({ assets: [asset], rawBySymbol: { 'TEST.MC': raw }, catalogObservedAt: '2026-09-03T00:00:00Z', preparedAt: '2026-09-03T08:00:00Z' }); }

test('recupera números originales, pérdidas y cero sin inventar escala ni moneda por fila', () => {
  const company = projectAlphaCompany(fixture(), 'TEST.MC');
  const rows = company.statements.Income_Statement.rows;
  assert.equal(rows[0].currency, null); assert.equal(rows[1].currency, 'USD');
  assert.equal(rows[1].scale, null); assert.equal(rows[1].totalRevenue, 2000); assert.equal(rows[1].netIncome, -100);
  assert.equal(company.metrics.PERatio, 0); assert.equal(company.source.downloadedAt, null);
});
test('la instantánea positiva no copia personas, campos nuevos ni opiniones', () => {
  const raw = fixture(), before = structuredClone(raw), result = snapshot(raw);
  assert.deepEqual(raw, before); assert.doesNotMatch(JSON.stringify(result), /NO_TRANSFERIR|Officers|private_field|WallStreetTargetPrice/);
  assert.equal(result.entries[0].state, 'matched'); assert.equal(result.entries[0].company.identity.isin, asset.isin);
});
test('conserva las entradas sin archivo y conflictos sin inventar datos ni fusionar identidades', () => {
  const raw = fixture(); raw.General.ISIN = 'NL0000000002';
  const result = snapshot(raw); assert.equal(result.entries.length, 1); assert.equal(result.entries[0].state, 'isin_conflict'); assert.equal(result.entries[0].company, null);
  const missing = buildAlphaSnapshot({ assets: [asset], rawBySymbol: {}, catalogObservedAt: '2026-09-03', preparedAt: '2026-09-03' });
  assert.equal(missing.entries[0].state, 'missing'); assert.equal(missing.entries[0].company, null);
});
test('búsqueda por nombre, símbolo e ISIN sin criterios de atractivo', () => {
  const entries = snapshot().entries;
  for (const query of ['Émpresa', 'TEST.MC', asset.isin, 'empresa test']) assert.equal(searchCompanies(entries, query).length, 1);
  assert.equal(searchCompanies(entries, 'noexiste').length, 0);
});
test('recupera BPA real y magnitudes históricas sin copiar las columnas de estimaciones', () => {
  const raw = fixture();
  raw.Highlights.EarningsShare = 2.5; raw.Highlights.MarketCapitalization = 123000;
  raw.Earnings = { History: { one: { date: '2025-06-30', reportDate: '2025-09-01', epsActual: 0, epsEstimate: 99, surprisePercent: 34, currency: 'USD' } } };
  const company = projectAlphaCompany(raw, 'TEST.MC');
  assert.equal(company.snapshotMetrics.EarningsShare, 2.5); assert.equal(company.snapshotMetrics.MarketCapitalization, 123000);
  assert.deepEqual(company.earnings[0], { period: '2025-06-30', reportedAt: '2025-09-01', currency: 'USD', actual: 0 });
  assert.doesNotMatch(JSON.stringify(company), /epsEstimate|surprisePercent|EPSEstimateNextYear/);
});
test('orden del fundador: excluye PER, BPA y dividendos estimados aunque la fuente tenga valores', () => {
  const raw = fixture();
  Object.assign(raw.Highlights, { PERatio: 15, EarningsShare: 2.5, DividendShare: 0.75, DividendYield: 0.02,
    EPSEstimateCurrentYear: 3, EPSEstimateNextYear: 4, EPSEstimateCurrentQuarter: 0.8, EPSEstimateNextQuarter: 0.9 });
  raw.Valuation.ForwardPE = 12;
  raw.SplitsDividends = { ForwardAnnualDividendRate: 1.1, ForwardAnnualDividendYield: 0.03, PayoutRatio: 0.3 };
  raw.Earnings = { History: { one: { date: '2025-06-30', reportDate: '2025-09-01', epsActual: 2.5, epsEstimate: 2.8, currency: 'EUR' } } };
  const company = snapshot(raw).entries[0].company;
  assert.doesNotMatch(JSON.stringify(company), /ForwardPE|EPSEstimate|epsEstimate|ForwardAnnualDividend/);
  assert.equal(company.metrics.PERatio, 15);
  assert.equal(company.snapshotMetrics.EarningsShare, 2.5);
  assert.equal(company.snapshotMetrics.DividendShare, 0.75);
  assert.equal(company.snapshotMetrics.DividendYield, 0.02);
  assert.equal(company.snapshotMetrics.PayoutRatio, 0.3);
  assert.equal(company.earnings[0].actual, 2.5);
});
test('lector solo solicita su archivo relativo sin sesión; comunica fallos y admite reintento', async () => {
  const signal = new AbortController().signal;
  const data = snapshot();
  assert.equal(await readSnapshot({ signal, fetchFn: async (url, options) => {
    assert.equal(url, './data/fundamentals.json'); assert.equal(options.credentials, 'omit'); assert.equal(options.signal, signal);
    return { ok: true, json: async () => data };
  } }), data);
  await assert.rejects(readSnapshot({ fetchFn: async () => ({ ok: false }) }), /reintentar/);
  await assert.rejects(readSnapshot({ fetchFn: async () => ({ ok: true, json: async () => ({}) }) }), /formato/);
  const malformed = snapshot(); malformed.entries[0].company.statements.Balance_Sheet = null;
  await assert.rejects(readSnapshot({ fetchFn: async () => ({ ok: true, json: async () => malformed }) }), /formato/);
});
test('render de estados y ratios: cifras visibles, divisas separadas, nulo distinto de cero', async t => {
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => { if (!String(args[0]).startsWith('Warning: useLayoutEffect does nothing on the server')) originalError(...args); });
  const { createServer } = await import('../company-analysis/node_modules/vite/dist/node/index.js');
  const React = (await import('../company-analysis/node_modules/react/index.js')).default;
  const { renderToStaticMarkup } = await import('../company-analysis/node_modules/react-dom/server.node.js');
  const server = await createServer({ configFile: false, envDir: false, root: fileURLToPath(new URL('../company-analysis/', import.meta.url)), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { CompanyStatements, CompanyRatios, CompanySnapshot } = await server.ssrLoadModule('/src/alfa/CompanyReport.jsx');
    const company = projectAlphaCompany(fixture(), 'TEST.MC');
    const html = renderToStaticMarkup(React.createElement(CompanyStatements, { company, limit: 'all' }));
    assert.match(html, /2 k/); assert.match(html, /-100/); assert.match(html, /USD/); assert.match(html, /No informada/); assert.match(html, /escala contable no indicada/i);
    assert.doesNotMatch(html, /NaN|Infinity|€|\$2/); assert.equal((html.match(/<table/g) || []).length, 3);
    assert.match(html, /Margen neto/); assert.match(html, /-5,0 %/); assert.match(html, /0,0 %/);
    assert.match(html, /no se puede asegurar su comparabilidad/);
    assert.match(html, /cabecera del proveedor declara EUR/);
    assert.match(html, /no acredita una escala homogénea/);
    assert.match(html, /Presentación declarada/);
    for (const label of ['Ingresos', 'EBITDA', 'Margen neto', 'Activos', 'Caja', 'Capex']) assert.ok(html.includes(`<span class="print-only">${label}</span>`), `Cabecera de impresión independiente: ${label}`);
    assert.match(html, /sin verificación documental individual/);
    const first = company.statements.Income_Statement.rows[0];
    first.reportedAt = first.period;
    const withFilingNote = renderToStaticMarkup(React.createElement(CompanyStatements, { company, limit: 'all' }));
    assert.match(withFilingNote, /sin darla por acreditada/);
    assert.match(withFilingNote, /<td>[^<]+ \*<\/td>/);
    const ratios = renderToStaticMarkup(React.createElement(CompanyRatios, { company }));
    assert.match(ratios, /0,0×/); assert.match(ratios, /10,0 %/); assert.doesNotMatch(ratios, /PER estimado|Compra fuerte/);
    company.earnings = [{ period: '2025-12-31', reportedAt: '2026-01-20', currency: 'USD', actual: -2 }];
    const snapshotHtml = renderToStaticMarkup(React.createElement(CompanySnapshot, { company, limit: 5 }));
    assert.match(snapshotHtml, /BPA diluido \(ttm\)/); assert.match(snapshotHtml, /Dividendo por acción \(ttm\)/);
    for (const name of ['BPA diluido (ttm)', 'Valor contable por acción (MRQ)', 'Dividendo por acción (ttm)', 'Rent. por dividendo (ttm)', 'Pay-out (ttm)']) {
      assert.ok([...snapshotHtml.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].some(([button]) => button.includes('aria-haspopup="dialog"') && button.includes(`<span>${name}</span>`)), `Ayuda conservada: ${name}`);
    }
    assert.match(snapshotHtml, /no GAAP/); assert.match(snapshotHtml, /desdoblamientos/);
    assert.match(snapshotHtml, /no garantiza 5 años completos/); assert.match(snapshotHtml, /-2,00/);
  } finally { await server.close(); }
});

test('un archivo corrupto se comunica como error recuperable, no rompe la pantalla al pintar', async () => {
  for (const alter of [
    company => { company.statements.Income_Statement.rows[0] = null; },
    company => { company.statements.Income_Statement.rows[0].totalRevenue = {}; },
    company => { company.earnings = [null]; },
    company => { company.warnings = [{}]; },
    company => { company.identity.sector = {}; },
  ]) {
    const data = snapshot(); alter(data.entries[0].company);
    await assert.rejects(readSnapshot({ fetchFn: async () => ({ ok: true, json: async () => data }) }), /formato esperado/);
  }
  const real = JSON.parse(await readFile(new URL('../company-analysis/public/data/fundamentals.json', import.meta.url), 'utf8'));
  assert.equal(await readSnapshot({ fetchFn: async () => ({ ok: true, json: async () => real }) }), real);
});
test('la entrada alfa y la compilación no dependen de servicios ni credenciales antiguos', async () => {
  const index = await readFile(new URL('../company-analysis/index.html', import.meta.url), 'utf8');
  assert.match(index, /src\/alfa\/main.jsx/);
  for (const file of ['App.jsx', 'main.jsx', 'client.js', 'CompanyReport.jsx']) {
    const code = await readFile(new URL(`../company-analysis/src/alfa/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /firebase|api\.js|Login|setDoc|deleteDoc|localStorage|sessionStorage/);
  }
});

async function suiteFixture(view = 'portfolio') {
  const html = await readFile(new URL('../cartera.html', import.meta.url), 'utf8');
  const code = html.match(/<script[^>]+type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const listeners = new Map(), nodes = new Map();
  let loads = 0, location = new URL(`https://nuvia.test/portal/cartera.html?vista=${view}`);
  for (const id of ['laboratorio', 'carteras-modelo', 'suite-nuvia', 'nuvia-company-frame', 'vista-portfolio', 'vista-models', 'vista-companies']) {
    nodes.set(id, { hidden: false, attrs: {}, style: {}, dataset: { src: 'company-analysis/index.html' }, handlers: new Map(), contentWindow: {},
      getAttribute(key) { return this.attrs[key] ?? null; }, setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(type, handler) { this.handlers.set(type, handler); },
      set src(value) { loads++; this.attrs.src = value; } });
  }
  const window = { get location() { return location; },
    history: { replaceState(_state, _title, url) { location = new URL(url); }, pushState(_state, _title, url) { location = new URL(url); } },
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type); } };
  const document = { body: { dataset: {} }, getElementById: id => nodes.get(id) || null };
  // VM sin cargador de importaciones: las dependencias diferidas se rechazan y
  // sus catch locales las recogen. No se ejecuta ningún acceso a datos ni red.
  const Component = vm.runInNewContext(code + ';Component', { DCLogic: class {}, URL, URLSearchParams, window, document, console: { error() {} } });
  const component = new Component(); component.componentDidMount();
  return { component, window, document, nodes, listeners, get loads() { return loads; },
    pop(view) { location = new URL(`https://nuvia.test/portal/cartera.html?vista=${view}`); listeners.get('popstate')(); },
    click(view) { nodes.get(`vista-${view}`).handlers.get('click')({ preventDefault() {} }); } };
}
test('integración: carga empresas al seleccionarlas y conserva el iframe al cambiar de vista', async () => {
  const suite = await suiteFixture();
  assert.equal(suite.loads, 0); assert.equal(suite.nodes.get('suite-nuvia').hidden, true);
  suite.click('companies'); assert.equal(suite.loads, 1); assert.equal(suite.nodes.get('suite-nuvia').hidden, false);
  assert.equal(suite.nodes.get('nuvia-company-frame').attrs.src, 'company-analysis/index.html');
  assert.equal(suite.window.location.search, '?vista=companies');
  suite.click('models'); assert.equal(suite.nodes.get('suite-nuvia').hidden, true);
  suite.click('companies'); assert.equal(suite.loads, 1);
  assert.equal(suite.nodes.get('vista-companies').attrs['aria-current'], 'page');
  suite.component.componentWillUnmount();
});
test('integración: los alias antiguos abren empresas también al volver con el historial', async () => {
  for (const alias of ['technical', 'fundamental']) {
    const suite = await suiteFixture(alias);
    assert.equal(suite.window.location.search, '?vista=companies');
    suite.click('portfolio'); suite.pop(alias);
    assert.equal(suite.document.body.dataset.suiteVista, 'companies');
    assert.equal(suite.nodes.get('suite-nuvia').hidden, false);
    assert.equal(suite.loads, 1);
    suite.component.componentWillUnmount();
  }
});
test('integración: altura solo desde su iframe y desmontaje sin escuchas residuales', async () => {
  const suite = await suiteFixture('companies'), frame = suite.nodes.get('nuvia-company-frame');
  const send = (height, changes = {}) => suite.listeners.get('message')({ origin: suite.window.location.origin,
    source: frame.contentWindow, data: { type: 'nuvia-company-height', height }, ...changes });
  send(1200.1); assert.equal(frame.style.height, '1201px');
  for (const height of ['900', 0, -1, NaN, Infinity, 100000, null]) send(height);
  send(999, { origin: 'https://otro.test' }); send(999, { source: {} }); send(999, { data: { type: 'otro', height: 999 } });
  assert.equal(frame.style.height, '1201px');
  send(50); assert.equal(frame.style.height, '720px');
  suite.component.componentWillUnmount(); assert.equal(suite.listeners.size, 0);
});

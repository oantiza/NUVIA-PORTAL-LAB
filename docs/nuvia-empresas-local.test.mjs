import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { projectCompany, dateOnly, catalogOf } from '../company-analysis/local/data.mjs';
import { localMiddleware, LOCAL_ORIGIN } from '../company-analysis/local/server.mjs';
import { toFundamentalView } from '../company-analysis/src/local/adapter.js';
import { financialNumber, marginPercent } from '../company-analysis/src/lib/financial.js';
import { fmtRatio, fmtNum, fmtPct, fmtBig, pct100 } from '../company-analysis/src/lib/format.js';

// Synthetic fixtures only: no private raw files, network or Firebase in tests.
function fixture() {
  const statement = { currency_symbol: 'USD', yearly: { '2025-12-31': {
    totalRevenue: '100', netIncome: null, totalAssets: '0', totalCashFromOperatingActivities: '-20',
    filing_date: '2026-02-28', targetPrice: 900,
  }, 'invalid': { totalRevenue: 1000 } } };
  return { General: { Type: 'Common Stock', Code: 'TEST', Exchange: 'MC', Name: 'Empresa de prueba',
    CurrencyCode: 'EUR', UpdatedAt: '2026-09-01', LogoURL: 'https://not-allowed.invalid', Description: 'Unreviewed text' },
  Highlights: { PERatio: '0', RevenueTTM: '100', WallStreetTargetPrice: 999, EPSEstimateNextYear: 300 },
  Valuation: { ForwardPE: 30, EnterpriseValueEbitda: 'NA' },
  AnalystRatings: { Buy: 99 }, SharesStats: { SharesOutstanding: '200' },
  Financials: { Income_Statement: structuredClone(statement), Balance_Sheet: structuredClone(statement), Cash_Flow: structuredClone(statement) } };
}
function request(dataset, url, options = {}) {
  const headers = {};
  const result = { status: 200, body: null, passed: false, headers };
  const res = {
    setHeader(key, value) { headers[key] = value; },
    set statusCode(value) { result.status = value; },
    writeHead(status, extra) { result.status = status; Object.assign(headers, extra); },
    end(body) { result.body = body; },
  };
  localMiddleware(dataset)({ url, method: 'GET', ...options,
    headers: { host: '127.0.0.1:18792', ...options.headers } }, res, () => { result.passed = true; });
  return result;
}

test('nulos y valores inválidos no se convierten en ceros', () => {
  for (const value of [null, undefined, '', ' ', 'NA', NaN, Infinity, 'Infinity', true, false, {}, [], '0x10']) assert.equal(financialNumber(value), null);
  for (const value of [0, '0', '0.0']) assert.equal(financialNumber(value), 0);
  assert.equal(financialNumber('-2.5e2'), -250);
});
test('margen exige dos datos válidos y denominador distinto de cero', () => {
  assert.equal(marginPercent(null, 100), null);
  assert.equal(marginPercent(20, 0), null);
  assert.equal(marginPercent(20, null), null);
  assert.equal(marginPercent(0, 100), 0);
  assert.equal(marginPercent(-20, 100), -20);
  assert.equal(marginPercent(1e308, 1e-300), null);
});
test('formato distingue cero, dato ausente e infinito', () => {
  assert.equal(fmtRatio(0), '0,0×');
  for (const formatter of [fmtRatio, fmtNum, fmtPct, fmtBig]) {
    for (const value of ['', 'NA', Infinity, null]) assert.equal(formatter(value), '—');
  }
  assert.equal(pct100(''), null); assert.equal(pct100(0), 0);
});
test('fechas imposibles no pasan como fechas del proveedor', () => {
  assert.equal(dateOnly('2026-02-30'), null);
  assert.equal(dateOnly('2024-02-29'), '2024-02-29');
  assert.equal(dateOnly('ayer'), null);
});
test('solo acciones identificadas por el símbolo de su archivo', () => {
  const raw = fixture();
  assert.equal(projectCompany(raw, '../TEST.MC'), null);
  assert.equal(projectCompany(raw, 'OTHER.MC'), null);
  raw.General.Type = 'ETF'; assert.equal(projectCompany(raw, 'TEST.MC'), null);
});
test('proyección permitida excluye recomendaciones, futuros, texto y URL no revisados', () => {
  const raw = fixture(), initial = structuredClone(raw);
  const projected = projectCompany(raw, 'TEST.MC');
  assert.deepEqual(raw, initial);
  const json = JSON.stringify(projected);
  for (const key of ['AnalystRatings', 'WallStreetTargetPrice', 'EPSEstimateNextYear', 'ForwardPE', 'LogoURL', 'Description', 'targetPrice']) assert.ok(!json.includes(key), key);
  assert.equal(projected.metrics.PERatio, 0);
  assert.equal(projected.multiples.EnterpriseValueEbitda, null);
});
test('periodos ordenados; sin crudos ni moneda contable inferida', () => {
  const raw = fixture();
  delete raw.Financials.Cash_Flow.currency_symbol;
  const projected = projectCompany(raw, 'TEST.MC');
  assert.equal(projected.identity.quoteCurrency, 'EUR');
  assert.equal(projected.statements.Income_Statement.currency, 'USD');
  assert.equal(projected.statements.Cash_Flow.currency, null);
  assert.equal(projected.statements.Income_Statement.rows.length, 1);
  assert.equal(projected.statements.Income_Statement.rows[0].netIncome, null);
  assert.equal(projected.source.latestPeriod, '2025-12-31');
  assert.ok(projected.warnings.some(w => w.includes('divisa')));
});
test('los estados ausentes son explícitos y no bloquean una ficha parcial', () => {
  const raw = fixture(); delete raw.Financials;
  const projected = projectCompany(raw, 'TEST.MC');
  assert.equal(projected.source.latestPeriod, null);
  assert.equal(projected.statements.Income_Statement.rows.length, 0);
  assert.ok(projected.warnings.length >= 3);
  assert.equal(catalogOf({ companies: [projected], issues: [] }).items[0].hasStatements, false);
});
test('adaptador reutiliza vista sin incorporar previsiones ni servicios', () => {
  const projected = projectCompany(fixture(), 'TEST.MC');
  const view = toFundamentalView(projected);
  assert.equal(view.Financials.Income_Statement.currency_symbol, 'USD');
  assert.equal(view.Financials.Income_Statement.yearly['2025-12-31'].netIncome, null);
  assert.equal(view.Valuation.ForwardPE, undefined);
  assert.equal(view.SplitsDividends, undefined);
});
test('transporte solo permite lecturas locales y rutas expresas', () => {
  const dataset = { companies: [projectCompany(fixture(), 'TEST.MC')], issues: [] };
  assert.equal(request(dataset, '/__local-company__/catalog').status, 200);
  assert.equal(JSON.parse(request(dataset, '/__local-company__/company/TEST.MC').body).symbol, 'TEST.MC');
  assert.equal(request(dataset, '/__local-company__/company/OTHER.MC').status, 404);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) assert.equal(request(dataset, '/__local-company__/catalog', { method }).status, 405);
  for (const host of ['localhost:18792', 'evil.invalid:18792', '0.0.0.0:18792']) assert.equal(request(dataset, '/local.html', { headers: { host } }).status, 403);
  assert.equal(request(dataset, '/local.html', { headers: { origin: 'https://evil.invalid' } }).status, 403);
  assert.equal(request(dataset, '/local.html', { headers: { 'sec-fetch-site': 'cross-site' } }).status, 403);
  assert.equal(request(dataset, '/local.html', { headers: { origin: LOCAL_ORIGIN } }).passed, true);
  for (const path of ['/index.html', '/src/main.jsx', '/src/api.js', '/src/firebase.js', '/.env', '/@fs/C:/private', '/output/mercado-alfa/crudo/TEST.MC.fundamentals.json', '/local/data.mjs', '/vite.local.config.js', '/__local-company__/company/%2e%2e%2fTEST.MC']) assert.equal(request(dataset, path).status, 404, path);
  assert.equal(request(dataset, '/__local-company__/catalog', { method: 'HEAD' }).body, undefined);
  assert.match(request(dataset, '/local.html').headers['Content-Security-Policy'], /connect-src 'self'/);
});
test('entrada y adaptación locales no importan el acceso ni el SDK anteriores', async () => {
  for (const path of ['main.jsx', 'adapter.js']) {
    const source = await readFile(new URL(`../company-analysis/src/local/${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /(?:from|import\s*\()\s*['"].*(?:firebase|api\.js|App\.jsx|Login)/);
    assert.doesNotMatch(source, /(?:setDoc|deleteDoc|onSnapshot|localStorage|sessionStorage|https?:\/\/)/);
  }
});
test('entrada alfa independiente compilable; el archivo de pruebas sigue sin compilarse', async () => {
  const build = await readFile(new URL('../scripts/build-company-analysis.mjs', import.meta.url), 'utf8');
  const site = await readFile(new URL('../scripts/build-site.mjs', import.meta.url), 'utf8');
  const config = await readFile(new URL('../company-analysis/vite.local.config.js', import.meta.url), 'utf8');
  assert.match(build, /npm run build --prefix company-analysis/);
  assert.match(site, /await cp\(companyBuild/);
  const entry = await readFile(new URL('../company-analysis/index.html', import.meta.url), 'utf8');
  assert.match(entry, /src="\.\/src\/alfa\/main\.jsx"/);
  assert.match(config, /command !== 'serve' \|\| isPreview/);
  assert.match(config, /host: '127\.0\.0\.1'/);
  assert.match(config, /envDir: false/);
  assert.match(config, /entries: \['local\.html'\]/);
});
test('el JSX reutilizado y la nueva entrada compilan sin ejecutar conexiones', async () => {
  const { transformWithOxc } = await import('../company-analysis/node_modules/vite/dist/node/index.js');
  for (const path of ['local/main.jsx', 'views/tabs/FundamentalTab.jsx', 'components/SvgCharts.jsx']) {
    const source = await readFile(new URL(`../company-analysis/src/${path}`, import.meta.url), 'utf8');
    const result = await transformWithOxc(source, path);
    assert.ok(result.code.length > 0);
  }
});

test('render real: sin futuros, conserva cero y separa monedas y ausencia de barras', async (t) => {
  // Los tooltips solo se posicionan en el navegador. Este test comprueba el HTML,
  // no hidrata; silencia exclusivamente ese aviso conocido del render de servidor.
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => {
    if (String(args[0]).startsWith('Warning: useLayoutEffect does nothing on the server')) return;
    originalError(...args);
  });
  const { createServer } = await import('../company-analysis/node_modules/vite/dist/node/index.js');
  const React = (await import('../company-analysis/node_modules/react/index.js')).default;
  const { renderToStaticMarkup } = await import('../company-analysis/node_modules/react-dom/server.node.js');
  const server = await createServer({ configFile: false, envDir: false,
    root: fileURLToPath(new URL('../company-analysis/', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { default: Fundamental } = await server.ssrLoadModule('/src/views/tabs/FundamentalTab.jsx');
    const { DualBars } = await server.ssrLoadModule('/src/components/SvgCharts.jsx');
    const raw = fixture(); delete raw.Financials.Balance_Sheet.currency_symbol;
    const fund = toFundamentalView(projectCompany(raw, 'TEST.MC'));
    const html = renderToStaticMarkup(React.createElement(Fundamental, { fund, historicalOnly: true, yearlyLimit: 5 }));
    assert.ok(html.includes('0,0×'));
    assert.ok(html.includes('Divisa del estado: USD'));
    assert.ok(html.includes('Divisa del estado: no informada'));
    assert.doesNotMatch(html, /PER estimado|PEG|BPA real|Dividendo anual estimado|Próximo pago/);
    assert.doesNotMatch(html, /NaN|Infinity/);
    const bars = renderToStaticMarkup(React.createElement(DualBars, { rows: [{ label: '2025', a: 100, b: null }], aLabel: 'Ingresos', bLabel: 'Beneficio neto', currency: 'EUR' }));
    assert.equal((bars.match(/<rect /g) || []).length, 1);
    assert.match(bars, /Beneficio neto —/);
  } finally { await server.close(); }
});

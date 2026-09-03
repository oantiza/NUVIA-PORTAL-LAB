import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildReview, loadReviewSample } from '../company-analysis/local/review.mjs';
import { normalizeSample, sha256 } from '../company-analysis/local/normalize.mjs';
import { localMiddleware } from '../company-analysis/local/server.mjs';

const asOf = '2026-09-03';
function fixture() {
  const asset = { asset_id: 'ES0144580Y14', isin: 'ES0144580Y14', eodhd_symbol: 'IBE.MC', currency: 'EUR', display_name: 'Empresa de prueba' };
  const raw = { General: { Type: 'Common Stock', Name: asset.display_name, Code: 'IBE', Exchange: 'MC', CurrencyCode: 'EUR', ISIN: asset.isin, UpdatedAt: '2026-09-01' },
    Financials: { Income_Statement: { yearly: { '2025-12-31': { date: '2025-12-31', currency_symbol: 'EUR', totalRevenue: '987654321', netIncome: '0' } } },
      Balance_Sheet: { yearly: { '2026-06-30': { date: '2026-06-30', totalAssets: '24681357' } } },
      Cash_Flow: { yearly: { '2025-12-31': { date: '2025-12-31', currency_symbol: 'USD', freeCashFlow: '-20' } } } },
    Highlights: { PERatio: 0, ProfitMargin: 0.15 } };
  const rawBytes = Buffer.from(JSON.stringify(raw));
  const records = normalizeSample({ rawBytes, asset, symbol: asset.eodhd_symbol, observedOn: asOf }).records;
  const evidence = { asOf, at: '2026-09-03T00:02:53.007Z', assets: [asset] };
  const evidenceBytes = Buffer.from(JSON.stringify(evidence));
  const sample = { schema: 'nuvia-local-review-sample.v1', publication_status: 'blocked', generated_at: '2026-09-03T02:58:15.713Z',
    catalog_evidence: { observed_at: evidence.at, live_rechecked: false, sha256: sha256(evidenceBytes),
      path: 'output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json' }, records };
  return { asset, raw, rawBytes, evidence, evidenceBytes, sample };
}
const income = r => r.companies[0].statements.find(s => s.key === 'income').rows[0];

test('la proyección no entrega al navegador los importes sin escala o moneda', () => {
  const f = fixture(), result = buildReview(f.sample, f.evidence);
  assert.equal(result.state, 'ready');
  assert.equal(result.publication_status, 'blocked');
  assert.equal(income(result).cells.revenue.state, 'blocked');
  assert.equal(income(result).cells.revenue.value, null);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /987654321|24681357|raw_sha256/);
  assert.match(income(result).cells.revenue.reason, /Escala/);
});
test('dato ausente, cero y signo no se confunden al habilitar unidades acreditadas', () => {
  const f = fixture(); f.sample.records[0].scale = 1000;
  const r = income(buildReview(f.sample, f.evidence));
  assert.equal(r.cells.revenue.value, 987654321000);
  assert.equal(r.cells.net_income.value, 0);
  assert.equal(r.cells.net_income.state, 'reported');
  assert.equal(r.cells.ebitda.state, 'missing');
  const cash = f.sample.records.find(r => r.statement === 'cash_flow'); cash.scale = 1;
  const view = buildReview(f.sample, f.evidence).companies[0].statements.find(s => s.key === 'cash_flow');
  assert.equal(view.rows[0].cells.free_cash_flow.value, -20);
});
test('la multiplicación de escala que desborda no genera Infinity ni cero', () => {
  const f = fixture(); f.sample.records[0].scale = 1000000; f.sample.records[0].values.revenue = 1e308;
  const cell = income(buildReview(f.sample, f.evidence)).cells.revenue;
  assert.equal(cell.state, 'blocked'); assert.equal(cell.value, null);
});
test('mantiene cierres completos por estado y avisa de la desalineación', () => {
  const f = fixture(), company = buildReview(f.sample, f.evidence).companies[0];
  assert.equal(company.statements[0].rows[0].period, '2025-12-31');
  assert.equal(company.statements[1].rows[0].period, '2026-06-30');
  assert.equal(company.statements[1].rows[0].currency, null);
  assert.equal(company.statements[2].rows[0].currency, 'USD');
  assert.ok(company.warnings.some(w => w.includes('no coinciden')));
});
test('ratios conservan fracción, cero y periodo desconocido sin fecharlos como anuales', () => {
  const f = fixture(), ratios = buildReview(f.sample, f.evidence).companies[0].ratios;
  assert.equal(ratios.observedOn, asOf);
  assert.equal(ratios.items.find(r => r.key === 'pe_ttm').value, 0);
  assert.equal(ratios.items.find(r => r.key === 'net_margin_ttm').value, 0.15);
  assert.ok(ratios.items.every(r => r.period_end === null));
});
test('rechaza duplicados, variantes incompatibles e identidad cambiada', () => {
  for (const alter of [
    f => f.sample.records.push(structuredClone(f.sample.records[0])),
    f => { f.sample.records[0].asset_id = 'NL0015001FS8'; },
    f => { f.sample.records[0].source = { ...f.sample.records[0].source, raw_sha256: 'a'.repeat(64) }; },
    f => { f.sample.records[0].recommendation = 'unreviewed'; },
    f => { f.sample.records[0].values.revenue = Infinity; },
    f => { f.sample.publication_status = 'approved'; },
    f => { f.sample.catalog_evidence.live_rechecked = true; },
  ]) { const f = fixture(); alter(f); assert.throws(() => buildReview(f.sample, f.evidence)); }
});
test('sin mutación de muestra y sin traslado de campos no previstos', () => {
  const f = fixture(); f.evidence.assets[0].privateKey = 'SECRET'; f.sample.unknown = 'SECRET';
  const before = structuredClone(f), result = buildReview(f.sample, f.evidence);
  assert.deepEqual(f.sample, before.sample); assert.deepEqual(f.evidence, before.evidence);
  assert.ok(!JSON.stringify(result).includes('SECRET'));
});

function memoryFiles(f) {
  const sampleBytes = Buffer.from(JSON.stringify(f.sample));
  const reviewBytes = Buffer.from('{}');
  return new Map([
    ['muestra.json', sampleBytes], ['revision.json', reviewBytes],
    ['integridad.json', Buffer.from(JSON.stringify({ files: { 'muestra.json': sha256(sampleBytes), 'revision.json': sha256(reviewBytes) } }))],
    ['contraste-2026-09-03T00-02-53-007Z.json', f.evidenceBytes], ['IBE.MC.fundamentals.json', f.rawBytes],
  ]);
}
function readMemory(files) {
  return async (url, encoding) => {
    const content = files.get(url.pathname.split('/').at(-1));
    if (!content) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    return encoding ? content.toString(encoding) : Buffer.from(content);
  };
}
test('lector verifica archivos, reconstruye la muestra y no necesita red', async () => {
  const f = fixture();
  const result = await loadReviewSample({ read: readMemory(memoryFiles(f)), now: new Date('2026-09-04') });
  assert.equal(result.state, 'ready'); assert.equal(result.recordCount, 4);
});
test('ausencia de archivo no recurre a otra fuente ni revela rutas internas', async () => {
  const files = memoryFiles(fixture()); files.delete('muestra.json');
  const result = await loadReviewSample({ read: readMemory(files) });
  assert.equal(result.state, 'unavailable'); assert.equal(result.reason, 'missing_files');
  assert.equal(result.companies, undefined); assert.doesNotMatch(JSON.stringify(result), /C:|output\//);
});
test('manipular fuente, catálogo o salidas bloquea la lectura', async () => {
  for (const name of ['muestra.json', 'revision.json', 'contraste-2026-09-03T00-02-53-007Z.json', 'IBE.MC.fundamentals.json']) {
    const files = memoryFiles(fixture()); files.set(name, Buffer.from('{"tampered":true}'));
    const result = await loadReviewSample({ read: readMemory(files), now: new Date('2026-09-04') });
    assert.equal(result.state, 'unavailable', name); assert.equal(result.reason, 'verification_failed');
  }
});
test('modificar la muestra y rehacer su huella no elude el contraste con el crudo', async () => {
  const f = fixture(); f.sample.records[0].values.revenue = 123;
  const result = await loadReviewSample({ read: readMemory(memoryFiles(f)), now: new Date('2026-09-04') });
  assert.equal(result.state, 'unavailable');
});
test('no lee muestras con fecha futura', async () => {
  const result = await loadReviewSample({ read: readMemory(memoryFiles(fixture())), now: new Date('2026-09-01') });
  assert.equal(result.state, 'unavailable');
});
test('endpoint revisado mantiene solo lectura, mismo origen y ocultación de archivos', () => {
  const f = fixture(), dto = buildReview(f.sample, f.evidence);
  const middleware = localMiddleware({ companies: [], issues: [] }, dto);
  function request(url, method = 'GET', host = '127.0.0.1:18792') {
    const result = {};
    middleware({ url, method, headers: { host } }, { setHeader() {}, set statusCode(v) { result.code = v; }, end(body) { result.body = body; } }, () => { result.passed = true; });
    return result;
  }
  assert.deepEqual(JSON.parse(request('/__local-company__/review').body), dto);
  assert.equal(request('/__local-company__/review', 'HEAD').body, undefined);
  assert.equal(request('/__local-company__/review', 'POST').code, 405);
  assert.equal(request('/__local-company__/review', 'GET', 'external:18792').code, 403);
  assert.equal(request('/local/review.mjs').code, 404);
  assert.equal(request('/output/fundamentales-muestra/muestra.json').code, 404);
});
test('render de revisión: pendientes, huecos, fechas completas y ratios sin datos crudos', async () => {
  const { createServer } = await import('../company-analysis/node_modules/vite/dist/node/index.js');
  const React = (await import('../company-analysis/node_modules/react/index.js')).default;
  const { renderToStaticMarkup } = await import('../company-analysis/node_modules/react-dom/server.node.js');
  const server = await createServer({ configFile: false, envDir: false, root: fileURLToPath(new URL('../company-analysis/', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { ReviewCompany } = await server.ssrLoadModule('/src/local/ReviewPanel.jsx');
    const f = fixture();
    const html = renderToStaticMarkup(React.createElement(ReviewCompany, { company: buildReview(f.sample, f.evidence).companies[0] }));
    assert.match(html, /Pendiente/); assert.match(html, /Sin dato/);
    assert.match(html, /30 jun 2026/); assert.match(html, /31 dic 2025/);
    assert.match(html, /15,00 %/); assert.match(html, /0,00×/);
    assert.match(html, /instantánea archivada/);
    assert.doesNotMatch(html, /987654321|24681357|NaN|Infinity|precio objetivo|PER estimado/);
  } finally { await server.close(); }
});
test('entrada revisada no importa SDK, API anterior ni guardado', async () => {
  const source = await readFile(new URL('../company-analysis/src/local/ReviewPanel.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /(?:from|import\s*\()\s*['"].*(?:firebase|api\.js|App\.jsx|Login)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|setDoc|deleteDoc|https?:\/\//);
});

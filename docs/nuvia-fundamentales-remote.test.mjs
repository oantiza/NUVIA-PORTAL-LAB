import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readCompany, loadCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';
import { BASE, wire, fixtureDocuments } from './fixtures/fundamentales-remote.mjs';
const snapshot = JSON.parse(await readFile(new URL('../company-analysis/public/data/fundamentals.json', import.meta.url), 'utf8'));
const entry = snapshot.entries.find(e => e.symbol === 'IBE.MC');
function transport(documents = fixtureDocuments(entry), inspect = () => {}) {
  return async (url, options) => {
    inspect(url, options);
    const path = url.slice(BASE.length + 1);
    const value = path.endsWith('/current') ? documents.fundamental : documents.asset;
    return { ok: !!value, status: value ? 200 : 404, json: async () => wire(path, value) };
  };
}
test('lee solo identidad y fundamentales propios por GET anónimo; no descarga el universo', async () => {
  const calls = [], signal = new AbortController().signal;
  const docs = fixtureDocuments(entry);
  const result = await readCompany(entry, { signal, fetchFn: transport(docs, (url, options) => {
    calls.push(url); assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error'); assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.signal, signal); assert.equal(options.cache, 'no-store'); assert.equal(options.headers, undefined);
  }) });
  assert.equal(FUNDAMENTALS_BASE, BASE);
  assert.deepEqual(calls, [`${BASE}/assets/${entry.isin}`, `${BASE}/assets/${entry.isin}/fundamentals/current`]);
  assert.deepEqual(result.company, docs.fundamental.entry.company); assert.equal(result.origin, 'database');
});
test('recupera desde la base una empresa ausente en el respaldo', async () => {
  const missing = snapshot.entries.find(e => e.symbol === 'ANA.MC'); assert.equal(missing.company, null);
  const result = await loadCompany(missing, { fetchFn: transport(fixtureDocuments(missing, entry.company)) });
  assert.equal(result.company.identity.isin, missing.isin); assert.equal(result.origin, 'database');
});
test('un documento ausente no se confunde con cero ni con el respaldo antiguo', async () => {
  const docs = fixtureDocuments(entry); docs.fundamental = null;
  assert.deepEqual(await loadCompany(entry, { fetchFn: transport(docs) }), { origin: 'database', state: 'missing', company: null });
});
test('fallos de red: respaldo explícito si existe, error recuperable si no existe', async () => {
  const fetchFn = async () => { throw new TypeError('Failed to fetch'); };
  const result = await loadCompany(entry, { fetchFn });
  assert.equal(result.origin, 'fallback'); assert.match(result.notice, /respaldo local.*desactualizado/);
  await assert.rejects(loadCompany({ ...entry, company: null }, { fetchFn }));
  const forbidden = await loadCompany(entry, { fetchFn: async () => ({ ok: false, status: 403 }) });
  assert.equal(forbidden.origin, 'fallback');
});
test('cambio de ISIN, ticker o moneda no fusiona cifras ni recupera el respaldo', async () => {
  for (const alter of [
    d => { d.asset.isin = 'NL0000000002'; }, d => { d.asset.eodhd_symbol = 'OTRA.MC'; },
    d => { d.asset.currency = 'USD'; }, d => { d.fundamental.entry.company.identity.isin = 'NL0000000002'; },
    d => { d.fundamental.symbol = 'OTRA.MC'; },
  ]) {
    const docs = fixtureDocuments(entry); alter(docs);
    await assert.rejects(loadCompany(entry, { fetchFn: transport(docs) }), error => error.code === 'identity');
  }
});
test('no incorpora estimaciones ni personas aunque se añadan al documento remoto', async () => {
  for (const alter of [
    c => { c.metrics.ForwardPE = 3; }, c => { c.snapshotMetrics.ForwardAnnualDividendRate = 3; },
    c => { c.earnings.push({ period: '2025-12-31', reportedAt: null, currency: null, actual: 2, epsEstimate: 4 }); },
    c => { c.identity.Officers = 'persona'; }, c => { c.metrics.PERatio = { value: 2 }; },
    c => { c.statements.Income_Statement.rows[0].period = '2025-02-31'; },
  ]) {
    const docs = fixtureDocuments(entry); alter(docs.fundamental.entry.company);
    await assert.rejects(readCompany(entry, { fetchFn: transport(docs) }), error => error.code === 'format');
  }
});
test('conserva ceros, nulos y cifras negativas al decodificar', async () => {
  const docs = fixtureDocuments(entry), metrics = docs.fundamental.entry.company.metrics;
  Object.assign(metrics, { PERatio: 0, ReturnOnEquityTTM: null, ProfitMargin: -0.2 });
  assert.deepEqual((await readCompany(entry, { fetchFn: transport(docs) })).company.metrics, metrics);
});
test('rechaza rutas, respuestas cruzadas y esquemas incorrectos', async () => {
  let calls = 0;
  await assert.rejects(readCompany({ ...entry, assetId: '../secreto' }, { fetchFn: async () => calls++ }));
  assert.equal(calls, 0);
  const docs = fixtureDocuments(entry); docs.fundamental.schema_version = 'otra';
  await assert.rejects(readCompany(entry, { fetchFn: transport(docs) }), /formato/);
  await assert.rejects(readCompany(entry, { fetchFn: async () => ({ ok: true, status: 200, json: async () => ({ name: 'otro-proyecto', fields: {} }) }) }), /corresponde/);
});
test('cancelación incluso si el transporte termina tarde: no devuelve ficha ni respaldo', async () => {
  const controller = new AbortController(); let release;
  const ready = new Promise(resolve => { release = resolve; });
  const read = loadCompany(entry, { signal: controller.signal, fetchFn: async (...args) => { await ready; return transport()(...args); } });
  controller.abort(); release();
  await assert.rejects(read, error => error.name === 'AbortError');
});
test('la ruta activa de lectura carece de SDK, credenciales, persistencia y escrituras', async () => {
  for (const file of ['../company-analysis/src/alfa/remote.js', '../company-analysis/alfa/contract.mjs']) {
    const code = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /firebase|api_token|Authorization|setDoc|deleteDoc|localStorage|sessionStorage|node:|method:\s*['"](?:POST|PATCH|DELETE|PUT)/);
  }
});

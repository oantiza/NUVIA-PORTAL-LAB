import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { packSnapshot } from '../company-analysis/alfa/pack.mjs';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { validateEntry, validateBackupEntry } from '../company-analysis/alfa/contract.mjs';
import { readCompanyIndex, readBackup } from '../company-analysis/src/alfa/catalog.js';
import { loadCompany } from '../company-analysis/src/alfa/remote.js';
import { wire, fixtureDocuments, BASE } from './fixtures/fundamentales-remote.mjs';
const text = await readFile(new URL('../company-analysis/public/data/fundamentals.json', import.meta.url), 'utf8');
const original = JSON.parse(text), packed = packSnapshot(original);
const entry = packed.index.entries.find(e => e.symbol === 'IBE.MC');
const legacy = original.entries.find(e => e.symbol === entry.symbol);
const sha = str => createHash('sha256').update(str).digest('hex');
const response = body => ({ ok: true, status: 200, json: async () => JSON.parse(body), arrayBuffer: async () => new TextEncoder().encode(body).buffer });
const backupBody = packed.files.get(`data/backups/${entry.assetId}.${entry.backupSha256}.json`);
function transport(mode, calls) {
  const documents = fixtureDocuments(legacy);
  if (mode === 'missing') documents.fundamental = null;
  if (mode === 'identity') documents.asset.isin = 'NL0000000002';
  return async (url, options) => {
    calls.push(url);
    assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers, undefined);
    if (url.startsWith('./data/')) { const body = packed.files.get(url.slice(2)); assert.ok(body); return response(body); }
    assert.ok(url.startsWith(BASE + '/assets/'));
    if (mode === 'offline') throw new TypeError('Failed to fetch');
    const path = url.slice(BASE.length + 1), data = path.endsWith('/current') ? documents.fundamental : documents.asset;
    return { ok: !!data, status: data ? 200 : 404, json: async () => data ? wire(path, data) : {} };
  };
}
test('índice de 73 sin cifras, 52 respaldos íntegros y generación determinista sin mutar la fuente', () => {
  const before = structuredClone(original), next = packSnapshot(original);
  assert.deepEqual(original, before); assert.deepEqual(next, packed);
  assert.equal(packed.index.entries.length, 73); assert.equal(packed.files.size, 53);
  assert.equal(packed.files.has('data/fundamentals.json'), false);
  assert.ok(Buffer.byteLength(packed.files.get('data/company-index.json')) < Buffer.byteLength(text) * 0.02);
  assert.doesNotMatch(JSON.stringify(packed.index), /totalRevenue|PERatio|statements|metrics|Officers/);
  assert.equal(packed.index.preparedAt, original.preparedAt);
  for (const item of packed.index.entries.filter(e => e.backupSha256)) {
    const body = packed.files.get(`data/backups/${item.assetId}.${item.backupSha256}.json`);
    assert.equal(sha(body), item.backupSha256);
    assert.deepEqual(JSON.parse(body).entry, original.entries.find(e => e.assetId === item.assetId));
  }
  for (const symbol of ['AENA.MC', 'FER.MC']) assert.equal(packed.index.entries.find(e => e.symbol === symbol).backupSha256, null);
});
test('empaquetar no relaja el contrato de la base ni inventa fecha de descarga del respaldo', () => {
  assert.equal(legacy.company.source.downloadedAt, null);
  assert.equal(validateBackupEntry(legacy), legacy);
  assert.throws(() => validateEntry(legacy), /Procedencia/);
  const bad = structuredClone(original); bad.entries.find(e => e.company).company.metrics.ForwardPE = 8;
  assert.throws(() => packSnapshot(bad), /contrato/);
});
test('lectura inicial solo pide el índice relativo, sin cifras, sesión o respaldo', async () => {
  const calls = [];
  const index = await readCompanyIndex({ fetchFn: transport('normal', calls) });
  assert.deepEqual(index, packed.index); assert.deepEqual(calls, ['./data/company-index.json']);
  await assert.rejects(readCompanyIndex({ fetchFn: async () => ({ ok: false }) }), /reintentar/);
});
test('el índice rechaza rutas, identidades duplicadas, hashes inválidos y campos no declarados', () => {
  for (const alter of [
    i => i.entries.push(i.entries[0]), i => { i.entries[0].assetId = '../otro'; },
    i => { i.entries[0].backupSha256 = 'https://otro.test'; }, i => { i.entries[0].metrics = { ForwardPE: 9 }; },
    i => { i.entries[0].backupUrl = 'https://otro.test'; }, i => { i.entries[0].quoteCurrency = 'USD'; },
  ]) { const index = structuredClone(packed.index); alter(index); assert.throws(() => validateIndex(index), /formato/); }
});
test('base correcta o ficha ausente: nunca descarga el respaldo', async () => {
  for (const mode of ['normal', 'missing']) {
    const calls = [], result = await loadCompany(entry, { fetchFn: transport(mode, calls) });
    assert.equal(result.origin, 'database'); assert.equal(result.state, mode === 'normal' ? 'ready' : 'missing');
    assert.equal(calls.length, 2); assert.ok(calls.every(url => url.startsWith(BASE)));
  }
});
test('fallo de red: descarga solamente el respaldo elegido y no reutiliza el estado al reintentar', async () => {
  const calls = [], result = await loadCompany(entry, { fetchFn: transport('offline', calls) });
  assert.equal(result.origin, 'fallback'); assert.deepEqual(result.company, legacy.company);
  assert.equal(calls.length, 3); assert.equal(calls.filter(url => url.startsWith('./data/backups/')).length, 1);
  const retry = []; assert.equal((await loadCompany(entry, { fetchFn: transport('normal', retry) })).origin, 'database');
  assert.equal(retry.length, 2);
});
test('identidad remota distinta: no se disimula con un respaldo', async () => {
  const calls = [];
  await assert.rejects(loadCompany(entry, { fetchFn: transport('identity', calls) }), e => e.code === 'identity');
  assert.equal(calls.length, 2);
});
test('respaldo corrupto, de otra empresa o con estimaciones no se presenta', async () => {
  await assert.rejects(readBackup(entry, { fetchFn: async () => response(backupBody + ' ') }), /versión/);
  await assert.rejects(readBackup(entry, { fetchFn: async () => ({ ok: false }) }), /reintentar/);
  for (const alter of [
    d => { d.entry.company.snapshotMetrics.ForwardAnnualDividendRate = 4; },
    d => { d.entry.company.identity.Officers = 'persona'; },
  ]) { const data = JSON.parse(backupBody); alter(data); const body = JSON.stringify(data);
    await assert.rejects(readBackup({ ...entry, backupSha256: sha(body) }, { fetchFn: async () => response(body) }), /contrato/); }
  const other = packed.index.entries.find(e => e.backupSha256 && e.symbol !== entry.symbol);
  const body = packed.files.get(`data/backups/${other.assetId}.${other.backupSha256}.json`);
  await assert.rejects(readBackup({ ...entry, backupSha256: sha(body) }, { fetchFn: async () => response(body) }), /identidad/);
});
test('cancelación tardía del índice y del respaldo no entrega datos de la selección anterior', async () => {
  for (const kind of ['index', 'backup']) {
    const controller = new AbortController(); let release, entered;
    const gate = new Promise(ok => { release = ok; });
    const started = new Promise(ok => { entered = ok; });
    const fetchFn = async () => ({ ok: true, json: async () => { entered(); await gate; return packed.index; },
      arrayBuffer: async () => { entered(); await gate; return new TextEncoder().encode(backupBody).buffer; } });
    const reading = kind === 'index' ? readCompanyIndex({ fetchFn, signal: controller.signal }) : readBackup(entry, { fetchFn, signal: controller.signal });
    await started;
    controller.abort(); release(); await assert.rejects(reading, e => e.name === 'AbortError');
  }
});
test('sin respaldo no se descarga nada y sin ISIN válido no se construyen rutas', async () => {
  let calls = 0;
  assert.equal(await readBackup({ ...entry, backupSha256: null }, { fetchFn: async () => calls++ }), null);
  await assert.rejects(readBackup({ ...entry, assetId: '../otro' }, { fetchFn: async () => calls++ }));
  assert.equal(calls, 0);
});

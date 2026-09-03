// Carga puntual autorizada. prepare solo lee; apply crea únicamente el complemento.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { tokenGcloud, URL_BASE, NOMBRE_BASE, documentoAObjeto, aFirestore } from './mercado-alfa/firestore-rest.mjs';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { DIVIDEND_FIELDS, projectDividendDates, validateDividendDates, dividendCreate } from '../company-analysis/alfa/dividend-dates.mjs';

const [mode, input] = process.argv.slice(2);
assert.ok(['prepare', 'apply'].includes(mode), 'Uso: prepare | apply archivo-preparado.json');
const directory = resolve('output/carga-fechas-dividendos');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
assert.equal(index.entries.length, 73, 'Revisar un cambio de universo');
const assets = new Map(index.entries.map(entry => [entry.isin, entry]));
const paths = index.entries.flatMap(e => [`assets/${e.isin}`, `assets/${e.isin}/fundamentals/current`]);
const targets = index.entries.map(e => `assets/${e.isin}/fundamentals/dividends`);
const checks = [...paths, 'catalog_manifest/public', ...['000', '001', '002', '003'].map(id => `catalog_chunks/${id}`)];
const allowed = new Set([...checks, ...targets]);
const calls = [];
let providerRequests = 0;
let phase = 'inicio';
await mkdir(directory, { recursive: true });

try {
  const token = tokenGcloud();
  async function api(path, body) {
    const get = body === undefined;
    if (get) assert.ok(allowed.has(path) || /^assets\/[A-Z0-9]{12}\/fundamentals\?/.test(path));
    else assert.ok(path === ':batchGet' || path.endsWith(':listCollectionIds') || mode === 'apply' && [':commit', ':beginTransaction', ':rollback'].includes(path));
    const url = path.startsWith(':') ? URL_BASE + path : URL_BASE + '/' + path;
    const response = await fetch(url, { method: get ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(get ? {} : { body: JSON.stringify(body) }), redirect: 'error', signal: AbortSignal.timeout(25000) });
    calls.push({ path, method: get ? 'GET' : 'POST', status: response.status });
    if (!response.ok) throw new Error(`Base propia: HTTP ${response.status}`);
    return response.json();
  }
  async function batch(requested, transaction) {
    assert.ok(requested.every(path => allowed.has(path)));
    const result = await api(':batchGet', { documents: requested.map(path => `${NOMBRE_BASE}/${path}`), ...(transaction ? { transaction } : {}) });
    const mapped = new Map(result.map(item => [item.found?.name || item.missing, item.found || null]));
    assert.equal(mapped.size, requested.length);
    return requested.map(path => { assert.ok(mapped.has(`${NOMBRE_BASE}/${path}`)); return mapped.get(`${NOMBRE_BASE}/${path}`); });
  }
  async function inventory() {
    async function collections(parent) {
      const value = await api(parent ? parent + ':listCollectionIds' : ':listCollectionIds', { pageSize: 100 });
      assert.ok(!value.nextPageToken, 'Inventario paginado: completar antes de crear');
      return (value.collectionIds || []).sort();
    }
    const root = await collections('');
    assert.deepEqual(root, ['assets', 'catalog_chunks', 'catalog_manifest', 'sync_runs']);
    const companies = [];
    for (let offset = 0; offset < index.entries.length; offset += 6) {
      companies.push(...await Promise.all(index.entries.slice(offset, offset + 6).map(async e => {
        const nested = await collections(`assets/${e.isin}`);
        assert.deepEqual(nested, ['fundamentals', 'series'], 'Revisar subcolecciones antes de duplicar eventos');
        const list = await api(`assets/${e.isin}/fundamentals?pageSize=100&mask.fieldPaths=schema_version`);
        assert.ok(!list.nextPageToken);
        const names = (list.documents || []).map(d => d.name.split('/').at(-1)).sort();
        assert.deepEqual(names, ['current'], 'Complemento existente: no sobrescribir');
        const nestedCurrent = await collections(`assets/${e.isin}/fundamentals/current`);
        assert.deepEqual(nestedCurrent, [], 'Revisar eventos anidados');
        return { isin: e.isin, collections: nested, fundamentals: names, currentChildren: nestedCurrent };
      })));
    }
    return { root, companies };
  }
  function validateParents(before) {
    for (let i = 0; i < index.entries.length; i++) {
      const e = index.entries[i], asset = documentoAObjeto(before[i * 2]);
      assert.equal(asset?.asset_id, e.isin); assert.equal(asset.isin, e.isin); assert.equal(asset.eodhd_symbol, e.symbol);
      assert.equal(asset.currency, e.quoteCurrency); assert.ok(before[i * 2 + 1]);
    }
  }
  if (mode === 'prepare') {
    phase = 'inventario';
    const existing = await inventory();
    const before = await batch(checks); validateParents(before);
    assert.ok(before.every(Boolean)); assert.ok((await batch(targets)).every(d => d === null));
    if (!process.env.EODHD_API_KEY) throw new Error('Falta la credencial del proveedor');
    const docs = [], failures = [];
    phase = 'consulta selectiva al proveedor';
    for (const e of index.entries) {
      try {
        const url = new URL(`https://eodhd.com/api/fundamentals/${e.symbol}`);
        url.searchParams.set('filter', DIVIDEND_FIELDS.join(','));
        url.searchParams.set('api_token', process.env.EODHD_API_KEY); url.searchParams.set('fmt', 'json');
        providerRequests++;
        const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error();
        const payload = await response.json(), fetchedAt = new Date().toISOString();
        docs.push(projectDividendDates(payload, e, { fetchedAt, loadedAt: fetchedAt, responseSha256: digest(payload) }));
      } catch { failures.push({ symbol: e.symbol, reason: 'Identidad, formato o respuesta no confirmados; no se incorpora.' }); }
      // Ritmo máximo de cuatro consultas por segundo; no se conservan URLs con claves.
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    const prepared = { schema: 'nuvia-dividend-dates-load.v1', preparedAt: new Date().toISOString(), indexSha256: digest(index),
      existing, protected: before.map(d => ({ name: d.name, updateTime: d.updateTime, fieldsSha256: digest(d.fields) })),
      docs, payloadSha256: digest(docs), failures, providerRequests, calls };
    const file = resolve(directory, `preparado-${stamp()}.json`);
    await writeFile(file, JSON.stringify(prepared, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ file, prepared: docs.length, failures, paymentDates: docs.filter(d => d.dividendDate).length,
      exDividendDates: docs.filter(d => d.exDividendDate).length, bothMissing: docs.filter(d => d.availability === 'notReported').length,
      providerRequests, remoteWrites: 0 }, null, 2));
  } else {
    phase = 'validación del lote local';
    assert.ok(input && resolve(input).startsWith(directory + sep));
    const prepared = JSON.parse(await readFile(resolve(input), 'utf8'));
    assert.equal(prepared.schema, 'nuvia-dividend-dates-load.v1'); assert.equal(prepared.indexSha256, digest(index));
    assert.equal(prepared.payloadSha256, digest(prepared.docs)); assert.equal(prepared.docs.length, 73);
    assert.deepEqual(prepared.failures, [], 'Completar diagnóstico de todas las respuestas antes de aplicar');
    assert.equal(new Set(prepared.docs.map(d => d.isin)).size, prepared.docs.length);
    for (const doc of prepared.docs) { validateDividendDates(doc); assert.equal(assets.get(doc.isin)?.symbol, doc.symbol); }
    const begun = await api(':beginTransaction', { options: { readWrite: {} } });
    assert.ok(typeof begun.transaction === 'string' && begun.transaction.length);
    let committedSuccessfully = false;
    try {
    phase = 'comprobación transaccional previa';
    const before = await batch(checks, begun.transaction); validateParents(before);
    assert.deepEqual(before.map(d => ({ name: d.name, updateTime: d.updateTime, fieldsSha256: digest(d.fields) })), prepared.protected, 'Cambios concurrentes: revisar sin sobrescribir');
    assert.ok((await batch(targets, begun.transaction)).every(d => d === null), 'Hay destinos existentes: no repetir la carga');
    const loadedAt = new Date().toISOString();
    const docs = prepared.docs.map(d => validateDividendDates({ ...d, loaded_at: loadedAt }));
    // Las lecturas en la transacción protegen las identidades. Solo se escriben las fechas nuevas.
    const writes = docs.map(d => dividendCreate(d, aFirestore));
    assert.ok(writes.length <= 500); assert.ok(Buffer.byteLength(JSON.stringify({ writes })) < 8_000_000);
    const planFile = resolve(directory, `plan-${stamp()}.json`);
    await writeFile(planFile, JSON.stringify({ preparedFile: resolve(input), loadedAt, creates: docs.length, verifications: prepared.protected.length,
      targets: docs.map(d => `assets/${d.isin}/fundamentals/dividends`), docs, writes }, null, 2) + '\n', { flag: 'wx' });
    phase = 'creación del complemento';
    const committed = await api(':commit', { writes, transaction: begun.transaction });
    committedSuccessfully = true;
    // Registrar inmediatamente el resultado; no volver a aplicar ante una respuesta incierta.
    const receipt = resolve(directory, `commit-${stamp()}.json`);
    await writeFile(receipt, JSON.stringify({ planFile, commitTime: committed.commitTime, results: committed.writeResults?.length }, null, 2) + '\n', { flag: 'wx' });
    assert.equal(committed.writeResults?.length, writes.length);
    phase = 'lectura posterior';
    const actual = await batch(docs.map(d => `assets/${d.isin}/fundamentals/dividends`));
    actual.forEach((d, i) => { const value = documentoAObjeto(d); delete value._id; assert.deepEqual(value, docs[i]); });
    const after = await batch(checks);
    assert.deepEqual(after.map(d => ({ name: d.name, updateTime: d.updateTime, fieldsSha256: digest(d.fields) })), prepared.protected);
    const file = resolve(directory, `resultado-${stamp()}.json`);
    await writeFile(file, JSON.stringify({ planFile, receipt, commitTime: committed.commitTime, created: docs.length, verified: actual.length,
      protectedUnchanged: after.length, modified: 0, deleted: 0, calls }, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ created: docs.length, verified: actual.length, protectedUnchanged: after.length, modified: 0, deleted: 0, file }, null, 2));
    } finally {
      if (!committedSuccessfully) await api(':rollback', { transaction: begun.transaction }).catch(() => {});
    }
  }
} catch {
  console.error('Operación no completada. Revisar el inventario, la preparación y cualquier recibo antes de repetir; no se sobrescriben destinos ni se muestran credenciales.');
  console.error(JSON.stringify({ phase, calls }));
  process.exitCode = 1;
}

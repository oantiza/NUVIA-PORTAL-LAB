// Autorización del fundador 03-09-2026. prepare es solo lectura; apply requiere
// plan revalidado en transacción. Sin borrados ni activación del catálogo antiguo.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { tokenGcloud, URL_BASE, NOMBRE_BASE, documentoAObjeto } from './mercado-alfa/firestore-rest.mjs';
import { sourcePaths, planIdentidades } from './mercado-alfa/identidades.mjs';
const [command, input] = process.argv.slice(2);
if (!['prepare', 'apply'].includes(command)) throw new Error('Uso: prepare candidatos.json | apply plan.json');
const folder = resolve('output/identidades-pendientes');
if (!input || !resolve(input).startsWith(folder + sep)) throw new Error('Entrada fuera de la carpeta de esta migración');
const token = tokenGcloud(), calls = [];
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function request(action, body) {
  const allowed = command === 'prepare' ? ['batchGet'] : ['batchGet', 'beginTransaction', 'commit', 'rollback'];
  if (!allowed.includes(action)) throw new Error('Acción no permitida');
  const response = await fetch(`${URL_BASE}:${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  calls.push({ action, status: response.status });
  if (!response.ok) throw new Error(`Base propia: ${action} HTTP ${response.status}`);
  return response.json();
}
async function read(paths, transaction) {
  const response = await request('batchGet', { documents: paths.map(p => `${NOMBRE_BASE}/${p}`), ...(transaction ? { transaction } : {}) });
  const found = {}, missing = [];
  for (const item of response) {
    const name = item.found?.name || item.missing;
    if (!name) continue;
    const path = name.slice(NOMBRE_BASE.length + 1);
    if (!paths.includes(path) || (path in found) || missing.includes(path)) throw new Error('Respuesta cruzada o duplicada');
    if (item.found) found[path] = item.found; else missing.push(path);
  }
  if (Object.keys(found).length + missing.length !== paths.length) throw new Error('Lectura incompleta');
  return { found, missing };
}
await mkdir(folder, { recursive: true });
let transaction, commitSent = false;
try {
  const data = JSON.parse(await readFile(resolve(input), 'utf8'));
  if (command === 'prepare') {
    const entries = data.results.map(r => r.candidate);
    const { found: sources, missing } = await read(sourcePaths);
    if (missing.length) throw new Error('Faltan documentos de origen');
    const at = new Date().toISOString(), plan = planIdentidades(sources, entries, at);
    const targets = await read(plan.creates.map(c => c.path));
    if (Object.keys(targets.found).length) throw new Error('Ya existen destinos; no se sobrescriben');
    const prepared = { schema: 'nuvia-identity-migration.v1', project: 'nuvia-family-wealth', preparedAt: at, sources, entries, writesSha256: digest(plan.writes) };
    const file = resolve(folder, `plan-${stamp()}.json`);
    await writeFile(file, JSON.stringify(prepared, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ file, creates: plan.creates.length, updates: 1, sourceDocumentsBackedUp: sourcePaths.length, writes: 0, catalogRetained: true }));
  } else {
    if (data.schema !== 'nuvia-identity-migration.v1' || data.project !== 'nuvia-family-wealth') throw new Error('Plan no válido');
    const plan = planIdentidades(data.sources, data.entries, data.preparedAt);
    if (digest(plan.writes) !== data.writesSha256) throw new Error('Plan alterado');
    transaction = (await request('beginTransaction', { options: { readWrite: {} } })).transaction;
    if (!transaction) throw new Error('Falta transacción');
    const old = await read(sourcePaths, transaction);
    for (const path of sourcePaths) if (!old.found[path] || old.found[path].updateTime !== data.sources[path].updateTime
      || !isDeepStrictEqual(old.found[path].fields, data.sources[path].fields)) throw new Error('El origen ha cambiado; preparar otra vez');
    const targets = await read(plan.creates.map(c => c.path), transaction);
    if (Object.keys(targets.found).length) throw new Error('Hay destinos existentes; no repetir');
    commitSent = true;
    const result = await request('commit', { writes: plan.writes, transaction });
    transaction = null;
    if (result.writeResults?.length !== 17) throw new Error('Resultado incierto; comprobar antes de reintentar');
    const all = await read([...sourcePaths, ...plan.creates.map(c => c.path)]);
    for (const c of plan.creates) {
      const { _id, ...actual } = documentoAObjeto(all.found[c.path]);
      if (!isDeepStrictEqual(actual, c.value)) throw new Error('El destino no coincide con la preparación');
    }
    for (const path of sourcePaths.filter(p => p !== 'catalog_manifest/public')) {
      if (!isDeepStrictEqual(all.found[path]?.fields, data.sources[path].fields)
        || all.found[path]?.updateTime !== data.sources[path].updateTime) throw new Error('Un origen ha cambiado tras la carga');
    }
    const { _id, ...manifest } = documentoAObjeto(all.found['catalog_manifest/public']);
    if (!isDeepStrictEqual(manifest, plan.manifest)) throw new Error('Manifiesto distinto');
    const file = resolve(folder, `resultado-${stamp()}.json`);
    await writeFile(file, JSON.stringify({ planFile: resolve(input), commitTime: result.commitTime, created: 16, updated: 1, deleted: 0,
      verified: true, originalsUnchanged: sourcePaths.length - 1, paths: plan.creates.map(c => c.path), catalogRetained: true, calls }, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ file, commitTime: result.commitTime, created: 16, updated: 1, deleted: 0, verified: true }));
  }
} catch (error) {
  if (transaction && !commitSent) await request('rollback', { transaction }).catch(() => {});
  console.error(commitSent ? 'Se envió el commit: revisar la base antes de repetir. ' + error.message : error.message);
  process.exitCode = 1;
}

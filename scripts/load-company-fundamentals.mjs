// Carga puntual del fundador: prepare no escribe en Firestore; apply crea solo
// assets/{ISIN}/fundamentals/current, con precondición de inexistencia.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { creaClienteEodhd } from './mercado-alfa/eodhd.mjs';
import { tokenGcloud, URL_BASE, NOMBRE_BASE, PROYECTO_ALFA, documentoAObjeto, aFirestore } from './mercado-alfa/firestore-rest.mjs';
import { prepareEntry, createWrite, validateEntry } from '../company-analysis/alfa/ingestion.mjs';
import { catalogoActual } from '../js/nuvia-identidades.js';

const directory = resolve('output/carga-fundamentales');
const [command, input] = process.argv.slice(2);
if (!['prepare', 'apply'].includes(command)) throw new Error('Uso: prepare | apply archivo-preparado.json');
const token = tokenGcloud();
const calls = [];
async function request(url, body) {
  const method = body === undefined ? 'GET' : 'POST';
  const read = method === 'GET' && url.startsWith(URL_BASE + '/') || method === 'POST' && url === URL_BASE + ':batchGet';
  if (!read && !(command === 'apply' && method === 'POST' && url === URL_BASE + ':commit')) throw new Error('Operación no autorizada');
  const response = await fetch(url, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  calls.push({ method, path: url.replace(URL_BASE, ''), status: response.status });
  if (!response.ok) throw new Error(`HTTP ${response.status} en la base propia`);
  return response.json();
}
async function currentAssets() {
  const manifest = documentoAObjeto(await request(URL_BASE + '/catalog_manifest/public'));
  if (!Number.isInteger(manifest.chunks) || manifest.chunks < 1 || manifest.chunks > 100) throw new Error('Manifiesto inesperado');
  const items = [];
  for (let i = 0; i < manifest.chunks; i++) items.push(...documentoAObjeto(await request(URL_BASE + '/catalog_chunks/' + String(i).padStart(3, '0'))).items);
  const stocks = catalogoActual(items).filter(item => item.instrument_type === 'STOCK');
  if (stocks.some(item => !/^[A-Z0-9]{12}$/.test(item.asset_id)) || stocks.length > 150) throw new Error('Catálogo de acciones inesperado');
  const result = await request(URL_BASE + ':batchGet', { documents: stocks.map(item => NOMBRE_BASE + '/assets/' + item.asset_id) });
  if (result.some(item => !item.found)) throw new Error('El catálogo contiene fichas no disponibles');
  const assets = result.map(item => {
    const d = documentoAObjeto(item.found);
    return { asset_id: d.asset_id, isin: d.isin, display_name: d.display_name, eodhd_symbol: d.eodhd_symbol, currency: d.currency };
  }).sort((a, b) => a.eodhd_symbol.localeCompare(b.eodhd_symbol));
  return { manifest, assets };
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(directory, { recursive: true });
try {
  if (command === 'prepare') {
    const { manifest, assets } = await currentAssets();
    const startedAt = new Date().toISOString();
    const eodhd = creaClienteEodhd({ token: process.env.EODHD_API_KEY, reintentos: 1,
      fetchFn: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(25000) }) });
    const entries = [], skipped = [], failures = [];
    for (const asset of assets) {
      try {
        const raw = await eodhd.fundamentales(asset.eodhd_symbol);
        const entry = prepareEntry(asset, raw, { catalogObservedAt: startedAt, downloadedAt: new Date().toISOString() });
        if (entry.state !== 'matched') { skipped.push({ symbol: asset.eodhd_symbol, reason: entry.state, candidates: entry.identityCandidates }); continue; }
        entries.push(entry);
        console.log(`Preparada ${asset.eodhd_symbol}: ${entries.length} fichas sin campos personales ni estimaciones.`);
      } catch (error) {
        const reason = /^EODHD [A-Z0-9_./%-]+: HTTP \d+$/.test(error.message) ? error.message : 'Respuesta no disponible o no válida; no incorporada';
        failures.push({ symbol: asset.eodhd_symbol, reason });
        console.log(`Pendiente ${asset.eodhd_symbol}: ${reason}`);
      }
    }
    const prepared = { schema: 'nuvia-fundamentals-load.v1', project: PROYECTO_ALFA, startedAt, preparedAt: new Date().toISOString(),
      manifestUpdatedAt: manifest.updated_at, catalogAssets: assets, entries, skipped, failures,
      payloadSha256: digest(entries), providerCreditsCounted: eodhd.llamadas(), calls };
    const file = resolve(directory, 'preparado-' + stamp() + '.json');
    await writeFile(file, JSON.stringify(prepared, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ file, prepared: entries.length, skipped, failures, providerCreditsCounted: eodhd.llamadas(), writes: 0 }, null, 2));
  } else {
    if (!input || !resolve(input).startsWith(directory + sep)) throw new Error('El archivo debe estar en output/carga-fundamentales');
    const prepared = JSON.parse(await readFile(resolve(input), 'utf8'));
    if (prepared.schema !== 'nuvia-fundamentals-load.v1' || prepared.project !== PROYECTO_ALFA || !prepared.entries.length
      || prepared.entries.length > 150 || digest(prepared.entries) !== prepared.payloadSha256) throw new Error('Preparación no válida');
    const { assets } = await currentAssets();
    for (const entry of prepared.entries) {
      validateEntry(entry);
      const asset = assets.find(item => item.asset_id === entry.assetId);
      if (!asset || asset.isin !== entry.isin || asset.eodhd_symbol !== entry.symbol || asset.currency !== entry.quoteCurrency) throw new Error('El catálogo ha cambiado; revisar antes de cargar');
    }
    const paths = prepared.entries.map(entry => NOMBRE_BASE + '/assets/' + entry.assetId + '/fundamentals/current');
    if (new Set(paths).size !== paths.length) throw new Error('Destinos duplicados');
    const previous = await request(URL_BASE + ':batchGet', { documents: paths });
    if (previous.length !== paths.length || previous.some(item => !item.missing)) throw new Error('Hay documentos existentes: esta carga no sobrescribe');
    const loadedAt = new Date().toISOString();
    const writes = prepared.entries.map(entry => createWrite(entry, loadedAt, { baseName: NOMBRE_BASE, encode: aFirestore }));
    if (Buffer.byteLength(JSON.stringify({ writes })) > 8_000_000 || writes.some(write => Buffer.byteLength(JSON.stringify(write.update)) > 900_000)) throw new Error('Carga demasiado grande para el lote atómico');
    const planFile = resolve(directory, 'plan-creacion-' + stamp() + '.json');
    await writeFile(planFile, JSON.stringify({ project: PROYECTO_ALFA, preparedFile: resolve(input), loadedAt, paths, payloadSha256: prepared.payloadSha256, operation: 'create-only', previousAllMissing: true }, null, 2) + '\n', { flag: 'wx' });
    // Una sola operación atómica: nunca sobrescribe, borra o modifica el padre.
    const result = await request(URL_BASE + ':commit', { writes });
    if (result.writeResults?.length !== writes.length) throw new Error('Respuesta de carga incierta; comprobar antes de reintentar');
    const verified = await request(URL_BASE + ':batchGet', { documents: paths });
    const loaded = verified.filter(item => item.found).map(item => documentoAObjeto(item.found));
    const expected = new Map(prepared.entries.map(entry => [entry.assetId, entry]));
    if (loaded.length !== paths.length || loaded.some(doc => !isDeepStrictEqual(expected.get(doc.asset_id), doc.entry))) throw new Error('La lectura posterior no coincide; no repetir la carga');
    const file = resolve(directory, 'resultado-' + stamp() + '.json');
    await writeFile(file, JSON.stringify({ project: PROYECTO_ALFA, loadedAt, commitTime: result.commitTime, created: loaded.length,
      verified: loaded.length, preparedFile: resolve(input), planFile, paths, calls }, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ created: loaded.length, verified: loaded.length, commitTime: result.commitTime, file }, null, 2));
  }
} catch (error) {
  console.error(error.message?.startsWith('HTTP ') ? error.message : String(error.message || 'Operación no completada').replace(/https?:\/\/\S+/g, '[URL omitida]'));
  process.exitCode = 1;
}

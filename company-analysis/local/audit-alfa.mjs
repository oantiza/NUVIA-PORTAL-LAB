// Diagnóstico opt-in. Solo GET al proyecto propio. No descarga del proveedor,
// no escribe en Firebase y no cambia la vista local ni la selección de la alfa.
import { mkdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { loadCompanies } from './data.mjs';
import { compareCoverage } from './coverage.mjs';
import { URL_DOCUMENTOS, documentoAObjeto } from '../../js/nuvia-datos.js';

if (!process.argv.includes('--read-alfa')) throw new Error('Requiere --read-alfa para consultar la alfa en solo lectura.');
const at = new Date().toISOString();
const asOf = at.slice(0, 10);
const requests = [];
async function getDocument(path) {
  if (!/^(catalog_manifest\/public|catalog_chunks\/\d{3}|assets\/[A-Z0-9]{12})$/.test(path)) throw new Error('Ruta fuera del diagnóstico');
  const response = await fetch(`${URL_DOCUMENTOS}/${path}`, {
    method: 'GET', redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  requests.push({ path, method: 'GET', status: response.status });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}; diagnóstico incompleto, no se interpreta como ausencia de datos.`);
  const document = await response.json();
  const data = documentoAObjeto(document);
  if (!data) throw new Error(`${path}: documento inválido`);
  return { data, updateTime: document.updateTime };
}
const before = await getDocument('catalog_manifest/public');
if (!Number.isInteger(before.data.chunks) || before.data.chunks < 1 || before.data.chunks > 30) throw new Error('Manifiesto fuera de límites');
const catalog = [];
for (let index = 0; index < before.data.chunks; index++) {
  const { data } = await getDocument(`catalog_chunks/${String(index).padStart(3, '0')}`);
  if (!Array.isArray(data.items)) throw new Error('Trozo de catálogo sin instrumentos');
  catalog.push(...data.items);
}
if (catalog.length !== before.data.total || new Set(catalog.map(a => a.asset_id)).size !== catalog.length) throw new Error('Catálogo incompleto o duplicado');
const stocks = catalog.filter(asset => asset.instrument_type === 'STOCK');
const assets = [];
// Grupos pequeños para limitar concurrencia y consumo. El GET nunca prueba escritura.
for (let index = 0; index < stocks.length; index += 4) {
  const batch = await Promise.all(stocks.slice(index, index + 4).map(async item => {
    const { data, updateTime } = await getDocument(`assets/${item.asset_id}`);
    if (data.asset_id !== item.asset_id || data.instrument_type !== 'STOCK') throw new Error('Ficha distinta del catálogo');
    return { asset_id: data.asset_id, isin: data.isin, eodhd_symbol: data.eodhd_symbol,
      display_name: data.display_name, currency: data.currency, history: data.history,
      source: data.source, updateTime, fields: Object.keys(data).sort() };
  }));
  assets.push(...batch);
}
const after = await getDocument('catalog_manifest/public');
if (before.updateTime !== after.updateTime || !isDeepStrictEqual(before.data, after.data)) throw new Error('El manifiesto cambió durante la lectura: repetir, no mezclar versiones.');
const local = await loadCompanies();
const comparison = compareCoverage(assets, local.companies, asOf);
const report = { at, asOf, manifest: before.data, manifestUpdateTime: before.updateTime,
  scope: 'Solo lectura; control de manifiesto antes/después, no transacción atómica de todas las fichas.',
  catalogCount: catalog.length, stockCount: stocks.length, localCount: local.companies.length,
  localReadIssues: local.issues, ...comparison, assets, requests };
const directory = new URL('../../output/fundamentales-contraste/', import.meta.url);
await mkdir(directory, { recursive: true });
// Evidencia fechada y no publicable; no sobrescribe un diagnóstico anterior.
const file = new URL(`contraste-${at.replace(/[:.]/g, '-')}.json`, directory);
await writeFile(file, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ evidence: file.pathname, at, catalog: catalog.length, stocks: stocks.length,
  local: local.companies.length, counts: comparison.counts, unlinkedLocal: comparison.unlinkedLocal,
  mismatches: comparison.matches.filter(m => m.status !== 'matched'), requests: requests.length }, null, 2));

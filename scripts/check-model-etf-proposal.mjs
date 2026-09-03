// Simulación local de las dos altas pendientes de las carteras modelo.
// Lee el CSV y el catálogo público; no modifica archivos, precios ni base.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { leeCsv, validaUniverso } from './mercado-alfa/universo.mjs';
import { CARTERAS_MODELO, disponibilidadModelo } from '../js/nuvia-modelos.js';
import { URL_DOCUMENTOS, creaClienteMaestra } from '../js/nuvia-datos.js';

export const ETF_PROPUESTOS = Object.freeze([
  Object.freeze({ asset_id: 'IE00B4L5Y983', eodhd_symbol: 'IWDA.AS', instrument_type: 'ETF', clase: 'EQUITY',
    grupo: 'etf', nombre: 'iShares Core MSCI World UCITS ETF USD (Acc)', divisa: 'EUR', incluir: 'si' }),
  Object.freeze({ asset_id: 'IE00B3XXRP09', eodhd_symbol: 'VUSA.AS', instrument_type: 'ETF', clase: 'EQUITY',
    grupo: 'etf', nombre: 'Vanguard S&P 500 UCITS ETF', divisa: 'EUR', incluir: 'si' }),
]);

const csv = leeCsv(await readFile(new URL('../universo/universo-alfa.csv', import.meta.url), 'utf8'));
const missingRows = ETF_PROPUESTOS.filter(etf => !csv.filas.some(row => row.asset_id === etf.asset_id));
for (const etf of ETF_PROPUESTOS) {
  const existing=csv.filas.find(row=>row.asset_id===etf.asset_id);
  if(existing) for(const key of Object.keys(etf)) assert.equal(existing[key],etf[key], 'Fila distinta de la autorización');
}
const virtual = { cabecera: csv.cabecera, filas: [...csv.filas,
  ...missingRows.map((row, index) => ({ ...row, _linea: csv.filas.length + index + 2 }))] };
const result = validaUniverso(virtual);
assert.deepEqual(result.errores, []);
const included = new Set(result.incluidas.map(row => row.asset_id));
const reads = [];
const client = creaClienteMaestra({ almacen: null, fetchFn: async (url, options = {}) => {
  const address = String(url), method = options.method || 'GET';
  assert.ok(method === 'GET' && address.startsWith(URL_DOCUMENTOS + '/')
    || method === 'POST' && address === URL_DOCUMENTOS + ':batchGet', 'Solo lectura');
  const response = await fetch(address, { ...options, credentials: 'omit', signal: AbortSignal.timeout(20000) });
  reads.push({ method, path: address.replace(URL_DOCUMENTOS, ''), status: response.status });
  return response;
} });
const ids = [...new Set(CARTERAS_MODELO.flatMap(model => model.posiciones.map(position => position.asset_id)))];
const presence = await client.enCatalogo(ids), manifest = await client.manifiesto();
const simulatedPresence = { ...presence, ...Object.fromEntries(ETF_PROPUESTOS.map(row => [row.asset_id, true])) };
const models = CARTERAS_MODELO.map(model => ({ name: model.nombre,
  ...disponibilidadModelo(model, simulatedPresence) }));
assert.ok(models.every(model => model.completa && model.verificada));
console.log(JSON.stringify({ state: !missingRows.length && ETF_PROPUESTOS.every(row=>presence[row.asset_id]) ? 'included-and-available' : 'proposal-valid', currentRows: csv.filas.length,
  currentDatabaseTotal: manifest.total, proposedIncludedInCsv: result.incluidas.length,
  modelComponentsPresentInBaseButNotIncludedInCsv: ids.filter(id => presence[id] && !included.has(id)),
  additions: ETF_PROPUESTOS,
  models: models.map(({ name, completa, verificada, disponibles, total, faltan }) =>
    ({ name, completa, verificada, disponibles, total, missing: faltan.length })),
  reads, databaseWrites: 0, filesModified: 0 }, null, 2));

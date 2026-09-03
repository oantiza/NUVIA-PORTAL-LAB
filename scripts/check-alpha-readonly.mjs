// Diagnóstico de la base propia: solo GET y batchGet (lectura), sin SDK ni credenciales.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { URL_DOCUMENTOS, documentoAObjeto, creaClienteMaestra } from '../js/nuvia-datos.js';
import { CARTERAS_MODELO, disponibilidadModelo } from '../js/nuvia-modelos.js';

const requests = [];
async function readOnly(url, options = {}) {
  const address = String(url), method = options.method || 'GET';
  const permitted = method === 'GET' && address.startsWith(URL_DOCUMENTOS + '/')
    || method === 'POST' && address === URL_DOCUMENTOS + ':batchGet';
  if (!permitted) throw new Error('El diagnóstico no permite esta operación');
  const response = await fetch(address, { ...options, credentials: 'omit', signal: AbortSignal.timeout(20_000) });
  requests.push({ method, path: address.replace(URL_DOCUMENTOS, ''), status: response.status });
  return response;
}
const client = creaClienteMaestra({ almacen: null, fetchFn: readOnly });
const manifest = await client.manifiesto();
const items = [];
for (let index = 0; index < manifest.chunks; index++) {
  const response = await readOnly(`${URL_DOCUMENTOS}/catalog_chunks/${String(index).padStart(3, '0')}`);
  if (!response.ok) throw new Error(`No se ha podido leer el fragmento ${index}: ${response.status}`);
  items.push(...documentoAObjeto(await response.json()).items);
}
const ids = [...new Set(CARTERAS_MODELO.flatMap(model => model.posiciones.map(p => p.asset_id)))];
const presence = await client.enCatalogo(ids);
const models = CARTERAS_MODELO.map(model => ({ name: model.nombre, ...disponibilidadModelo(model, presence) }));
const histories = [];
for (const model of CARTERAS_MODELO.filter(model => model.posiciones.every(p => presence[p.asset_id]))) {
  try {
    const data = await client.seriesRebasadas(model.posiciones.map(p => p.asset_id));
    histories.push({ name: model.nombre, first: data.dates[0], last: data.dates.at(-1), points: data.dates.length,
      series: data.series.length, finite: data.series.every(series => series.values.length === data.dates.length && series.values.every(value => Number.isFinite(value) && value > 0)) });
  } catch (error) { histories.push({ name: model.nombre, error: error.message }); }
}
const counts = {};
for (const item of items) counts[item.instrument_type] = (counts[item.instrument_type] || 0) + 1;
const report = { checkedAt: new Date().toISOString(), manifest, count: items.length, uniqueIds: new Set(items.map(item => item.asset_id)).size, counts, models, histories, requests };
const output = resolve('output/cierre-alfa');
await mkdir(output, { recursive: true });
const file = resolve(output, `base-solo-lectura-${report.checkedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(file, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, requests: requests.length, file }, null, 2));

// Plan puro de la carga autorizada el 03-09-2026. No hace red ni escrituras.
import assert from 'node:assert/strict';
import { aFirestore, documentoAObjeto, NOMBRE_BASE } from './firestore-rest.mjs';
import { proyectaActivo, clavesProhibidasEn, catalogo } from './proyecta.mjs';
import { claveOrden } from './universo.mjs';

export const MODEL_ETFS = Object.freeze([
  Object.freeze({ asset_id: 'IE00B4L5Y983', eodhd_symbol: 'IWDA.AS', instrument_type: 'ETF', clase: 'EQUITY', grupo: 'etf', nombre: 'iShares Core MSCI World UCITS ETF USD (Acc)', divisa: 'EUR', incluir: 'si' }),
  Object.freeze({ asset_id: 'IE00B3XXRP09', eodhd_symbol: 'VUSA.AS', instrument_type: 'ETF', clase: 'EQUITY', grupo: 'etf', nombre: 'Vanguard S&P 500 UCITS ETF', divisa: 'EUR', incluir: 'si' }),
]);
export const ETF_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
export const CATALOG_PATHS = ['catalog_manifest/public', ...['000','001','002','003'].map(id => `catalog_chunks/${id}`)];
export const ETF_TARGETS = MODEL_ETFS.flatMap(row => [`assets/${row.asset_id}`, ...ETF_YEARS.map(year => `assets/${row.asset_id}/series/${year}`), `assets/${row.asset_id}/holdings/latest`]);
export const ETF_FIELDS = ['General::Code','General::Type','General::Name','General::Exchange','General::CurrencyCode','General::UpdatedAt',
  'ETF_Data::ISIN','ETF_Data::Index_Name','ETF_Data::Ongoing_Charge','ETF_Data::Asset_Allocation',
  'ETF_Data::World_Regions','ETF_Data::Sector_Weights','ETF_Data::Top_10_Holdings','ETF_Data::Holdings_Count'];
export const cleanDocument = doc => { const { _id, ...value } = documentoAObjeto(doc); return value; };
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;

function checkKeys(object, keys) {
  assert.ok(object && typeof object === 'object' && !Array.isArray(object));
  assert.ok(Object.keys(object).every(key => keys.includes(key)), 'Campo fuera de la selección autorizada');
}

export function projectModelEtf(input, at) {
  const row = MODEL_ETFS.find(row => row.asset_id === input.isin);
  assert.ok(row, 'Instrumento fuera de alcance');
  assert.equal(input.symbol, row.eodhd_symbol);
  assert.ok(Number.isFinite(Date.parse(input.fetchedAt)) && Date.parse(input.fetchedAt) <= Date.parse(at));
  let payload = input.fundamentals;
  if (Object.hasOwn(payload,'General::Code')) {
    checkKeys(payload,ETF_FIELDS);
    payload = { General:{}, ETF_Data:{} };
    for(const [field,value] of Object.entries(input.fundamentals)) {
      const [section,key]=field.split('::');payload[section][key]=value;
    }
  }
  checkKeys(payload, ['General','ETF_Data']);
  for (const key of ['General','ETF_Data']) checkKeys(payload[key], ETF_FIELDS.filter(field => field.startsWith(key+'::')).map(field => field.split('::')[1]));
  const general = payload.General, data = payload.ETF_Data;
  assert.equal(data.ISIN, row.asset_id); assert.equal(general.Code, row.eodhd_symbol.split('.')[0]);
  assert.equal(general.Exchange, 'AS'); assert.equal(general.Type, 'ETF'); assert.equal(general.CurrencyCode, 'EUR');
  assert.ok(day(general.UpdatedAt) && general.UpdatedAt <= at.slice(0,10));
  assert.ok(Array.isArray(input.prices) && input.prices.length >= 1000, 'Historia insuficiente');
  let previous = '';
  for (const price of input.prices) {
    assert.ok(day(price.date) && price.date > previous && price.date >= '2021-09-03' && price.date <= at.slice(0,10));
    assert.ok(typeof price.adjusted_close === 'number' && Number.isFinite(price.adjusted_close) && price.adjusted_close > 0);
    previous = price.date;
  }
  assert.equal(input.prices[0].date, '2021-09-03');
  const top = data.Top_10_Holdings;
  if (top && typeof top === 'object') for (const holding of Object.values(top)) {
    checkKeys(holding, ['Code','Exchange','Name','Sector','Industry','Country','Region','Assets_%']);
    assert.ok(typeof holding.Code === 'string' && holding.Code.length > 0, 'La posición debe identificar un instrumento');
    assert.ok(typeof holding['Assets_%'] === 'string' || typeof holding['Assets_%'] === 'number');
    assert.ok(Number.isFinite(Number(holding['Assets_%'])) && Number(holding['Assets_%']) >= 0 && Number(holding['Assets_%']) <= 100);
  }
  const result = proyectaActivo({ fila: row, eod: input.prices, fundamentales: payload, fetchedAt: input.fetchedAt, updatedAt: at });
  assert.deepEqual(result.errores, []); assert.ok(result.asset);
  assert.deepEqual(result.series.map(series => series.year), ETF_YEARS);
  const points = result.series.flatMap(series => series.points);
  assert.equal(points.length, input.prices.length);
  points.forEach((point, index) => assert.equal(point.value, input.prices[index].adjusted_close, 'No cambiar los precios recibidos'));
  if (result.holdings) {
    result.holdings.as_of_date = null;
    result.asset.quality.warnings.push('La fuente no informa la fecha específica de las posiciones; no se sustituye por el último cierre de cotización.');
  }
  assert.deepEqual(clavesProhibidasEn(result), []);
  return result;
}

export function modelEtfPlan(sources, inputs, at) {
  assert.ok(Number.isFinite(Date.parse(at))); assert.equal(inputs.length, 2);
  assert.deepEqual(inputs.map(input => input.isin).sort(), MODEL_ETFS.map(row => row.asset_id).sort());
  assert.deepEqual(Object.keys(sources).sort(), [...CATALOG_PATHS].sort());
  for (const path of CATALOG_PATHS) {
    assert.equal(sources[path]?.name, `${NOMBRE_BASE}/${path}`); assert.ok(sources[path]?.updateTime);
  }
  const manifest = cleanDocument(sources[CATALOG_PATHS[0]]);
  assert.equal(manifest.total, 698); assert.equal(manifest.chunks, 4);
  const items = CATALOG_PATHS.slice(1).flatMap(path => {
    const chunk = cleanDocument(sources[path]); assert.equal(chunk.n, chunk.items.length); return chunk.items;
  });
  assert.equal(items.length, 698); assert.equal(new Set(items.map(item => item.asset_id)).size, 698);
  assert.ok(items.every(item => !MODEL_ETFS.some(row => row.asset_id === item.asset_id)));
  const projected = inputs.map(input => projectModelEtf(input, at));
  const newItems = catalogo(projected.map(item => item.asset), at).chunks.flatMap(chunk => chunk.items);
  const all = [...items, ...newItems].sort((a,b) => claveOrden(a).localeCompare(claveOrden(b)));
  const creates = projected.flatMap(result => [
    { path: `assets/${result.asset.asset_id}`, value: result.asset },
    ...result.series.map(series => ({ path: `assets/${series.asset_id}/series/${series.year}`, value: series })),
    ...(result.holdings ? [{ path: `assets/${result.asset.asset_id}/holdings/latest`, value: result.holdings }] : []),
  ]);
  const changes = CATALOG_PATHS.slice(1).map((path,index) => ({ path,
    value: { ...cleanDocument(sources[path]), items: all.slice(index*200, (index+1)*200), n: all.slice(index*200, (index+1)*200).length } }));
  const latest = projected.map(result => result.asset.history.last_date);
  changes.push({ path: CATALOG_PATHS[0], value: { ...manifest, total: 700, updated_at: at,
    prices_last_date: [manifest.prices_last_date,...latest].filter(Boolean).sort().at(-1),
    prices_last_date_min: [manifest.prices_last_date_min,...latest].filter(Boolean).sort()[0] } });
  const previous = new Map(items.map(item => [item.asset_id, item]));
  for (const item of all.filter(item => previous.has(item.asset_id))) assert.deepEqual(item, previous.get(item.asset_id));
  const writes = [...creates.map(({path,value}) => ({ update: { name: `${NOMBRE_BASE}/${path}`, fields: aFirestore(value).mapValue.fields }, currentDocument: { exists: false } })),
    ...changes.map(({path,value}) => ({ update: { name: `${NOMBRE_BASE}/${path}`, fields: aFirestore(value).mapValue.fields }, currentDocument: { updateTime: sources[path].updateTime } }))];
  assert.ok(creates.every(item => ETF_TARGETS.includes(item.path)));
  assert.ok(writes.length <= 21 && Buffer.byteLength(JSON.stringify(writes)) < 8_000_000);
  return { creates, changes, writes };
}

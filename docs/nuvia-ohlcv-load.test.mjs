import test from 'node:test';
import assert from 'node:assert/strict';
import { bundle, createWrites, identity, compareCloses, digest } from '../scripts/mercado-alfa/ohlcv-load.mjs';
import { camposDe } from '../scripts/mercado-alfa/firestore-rest.mjs';
const entry={assetId:'ES0144580Y14',isin:'ES0144580Y14',symbol:'IBE.MC',quoteCurrency:'EUR'};
const point={date:'2026-09-02',open:20,high:21,low:19,close:20,adjusted_close:19.1234564,volume:0};
const input={prices:[point],fetchedAt:'2026-09-04T01:00:00Z'};
const series=[{asset_id:entry.isin,currency:'EUR',year:2026,n:1,first_date:point.date,last_date:point.date,points:[{date:point.date,value:19.123456}]}];
test('OHLCV carga: solo creaciones dentro de las rutas nuevas y manifiesto coherente',()=>{
  const docs=bundle(entry,input),writes=createWrites(entry,input);
  assert.equal(writes.length,2);assert.equal(docs[1].value.n,1);
  assert.equal(docs[1].value.years[0].sha256,digest(docs[0].value));
  assert.equal(docs[0].value.revision,docs[1].value.revision);
  for(const [i,w] of writes.entries()) {
    assert.deepEqual(Object.keys(w).sort(),['currentDocument','update']);
    assert.deepEqual(w.currentDocument,{exists:false});
    assert.match(w.update.name,/\/assets\/ES0144580Y14\/(ohlcv\/2026|ohlcv_manifest\/current)$/);
    assert.deepEqual(camposDe(w.update.fields),docs[i].value);
  }
});
test('OHLCV carga: redondeo existente, discrepancia y fecha desaparecida',()=>{
  assert.deepEqual(compareCloses([point],series,entry),{compared:1,differences:0,examples:[]});
  assert.equal(compareCloses([{...point,adjusted_close:19.123457}],series,entry).differences,1);
  assert.equal(compareCloses([],series,entry).examples[0].downloaded,null);
  assert.throws(()=>compareCloses([point],[{...series[0],currency:'USD'}],entry));
});
test('OHLCV carga: identidad, moneda y tipo de activo acreditados',()=>{
  const asset={asset_id:entry.isin,isin:entry.isin,eodhd_symbol:entry.symbol,currency:'EUR',instrument_type:'STOCK',
    source:{system:'EODHD',symbol:entry.symbol,currency_check:{value:'EUR'}},history:{first_date:'2021-01-04',last_date:point.date}};
  identity(entry,asset);
  for(const patch of [{instrument_type:'ETF'},{isin:'ES0105046017'},{eodhd_symbol:'IBE.US'},{currency:'USD'},{source:{system:'EODHD'}}]) assert.throws(()=>identity(entry,{...asset,...patch}));
});
test('OHLCV carga: descarta campos ajenos, preserva entradas y rechaza precios o fechas inválidos',()=>{
  const dirty={...input,prices:[{...point,personalName:'no almacenar'}]},copy=structuredClone(dirty);
  assert.equal(bundle(entry,dirty)[0].value.points[0].personalName,undefined);assert.deepEqual(dirty,copy);
  for(const patch of [{date:'2020-12-31'},{date:'2026-09-04'},{open:null},{volume:-1}]) assert.throws(()=>createWrites(entry,{...input,prices:[{...point,...patch}]}));
  assert.throws(()=>createWrites(entry,{...input,prices:[]}));
  assert.throws(()=>createWrites({...entry,isin:'../other'},input));
});

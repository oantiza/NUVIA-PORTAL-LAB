import test from 'node:test';
import assert from 'node:assert/strict';
import {readOhlcv} from '../company-analysis/src/alfa/ohlcv.js';
import {bundle,digest} from '../scripts/mercado-alfa/ohlcv-load.mjs';
import {technicalOhlcv} from '../company-analysis/alfa/ohlcv.mjs';
import {BASE,wire} from './fixtures/fundamentales-remote.mjs';
const entry={assetId:'ES0144580Y14',isin:'ES0144580Y14',symbol:'IBE.MC',quoteCurrency:'EUR'};
const prices=Array.from({length:60},(_,i)=>({date:new Date(Date.UTC(2025,11,i+1)).toISOString().slice(0,10),
  open:100,high:110,low:90,close:100,adjusted_close:10,volume:i===0?null:i===1?0:1000}));
function fixture({e=entry,alter=()=>{},missing,controller}={}) {
  const docs=bundle(e,{prices,fetchedAt:'2026-09-04T00:00:00Z'}),calls=[];let manifestReads=0;
  const fetchFn=async(url,options)=>{
    calls.push({url,options}); assert.equal(options.method,'GET');assert.equal(options.headers,undefined);
    assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');
    const path=url.slice(BASE.length+1),row=docs.find(d=>d.path===path); assert.ok(row,'Solo rutas conocidas');
    const doc=structuredClone(row.value);if(path.endsWith('/current')) manifestReads++;
    alter(doc,{path,manifestReads,docs});
    return {ok:true,status:missing&&path.endsWith(missing)?404:200,json:async()=>{controller?.abort();return wire(path,doc);}};
  };return {fetchFn,calls,docs};
}
test('OHLCV lector: GET solo de la identidad elegida y misma revisión, datos originales intactos',async()=>{
  const f=fixture(),data=await readOhlcv(entry,f);
  assert.equal(f.calls.length,4);assert.deepEqual(data.raw,prices);
  assert.equal(data.points[0].value,10);assert.equal(data.raw[0].close,100);
  assert.equal(data.raw[0].volume,null);assert.equal(data.raw[1].volume,0);
  assert.equal(data.revision,f.docs[0].value.revision);
});
test('OHLCV lector: no acepta identidad, procedencia, años, cobertura, cifras ni campos ajenos',async()=>{
  for(const alter of [
    d=>{d.isin='ES0000000000';},d=>{d.currency='USD';},d=>{d.source.volume_basis='raw';},
    d=>{if(d.years)d.years[0].year=2024;},d=>{d.n++;},d=>{if(d.points)d.points[0].low=111;},
    d=>{if(d.points)d.points[0].personalName='no mostrar';},d=>{if(d.points)d.points[0].volume='0';},
    d=>{if(d.points)d.points[0].date='2025-02-30';},d=>{d.revision='f'.repeat(64);},
    d=>{d.source.extra='no';},d=>{if(d.years)d.years=[];},
  ]) await assert.rejects(readOhlcv(entry,fixture({alter})),{code:'ohlcv'});
});
test('OHLCV lector: detecta huella anual, hash conjunto y manifiesto cambiado durante la lectura',async()=>{
  await assert.rejects(readOhlcv(entry,fixture({alter:d=>{if(d.points)d.points[0].volume=99;}})),/huella/);
  const f=fixture();
  for(const d of f.docs)d.value.revision='a'.repeat(64);
  const m=f.docs.at(-1).value;
  for(const y of m.years)y.sha256=digest(f.docs.find(d=>d.value.year===y.year).value);
  await assert.rejects(readOhlcv(entry,f),/revisión conjunta/);
  await assert.rejects(readOhlcv(entry,fixture({alter:(d,{manifestReads,path})=>{if(path.endsWith('/current')&&manifestReads===2)d.n++;}})),/cambiado/);
});
test('OHLCV lector: ausencia, fallo, identidad incorrecta y cancelación no entregan series parciales',async()=>{
  for(const missing of ['/current','/2026'])await assert.rejects(readOhlcv(entry,fixture({missing})),{code:'ohlcv'});
  await assert.rejects(readOhlcv({...entry,assetId:'../outside'},fixture()),{code:'ohlcv'});
  const controller=new AbortController();await assert.rejects(readOhlcv(entry,{...fixture({controller}),signal:controller.signal}),{name:'AbortError'});
  await assert.rejects(readOhlcv(entry,{fetchFn:async()=>{throw new Error('offline');}}),/offline/);
});
test('OHLCV lector: alias de Ferrovial aprobado, sin consultar la identidad antigua',async()=>{
  const e={...entry,isin:'NL0015001FS8',assetId:'NL0015001FS8',symbol:'FER.MC'},f=fixture({e});
  await readOhlcv({...e,isin:'ES0118900010',assetId:'ES0118900010'},f);
  assert.ok(f.calls.every(c=>!c.url.includes('ES0118900010')));
});
test('OHLCV técnico: ATR, medias y velas comparten escala ajustada, volumen y originales no cambian',()=>{
  const a=technicalOhlcv(prices);
  assert.equal(a.latest.value,10);assert.equal(a.latest.sma50,10);assert.equal(a.latest.atr,2);
  assert.equal(a.latest.rawHigh,110);assert.equal(a.latest.candle.high,11);assert.equal(a.latest.factor,.1);
  assert.equal(a.rows[0].volume,null);assert.equal(a.rows[1].volume,0);assert.equal(a.rows[12].atr,null);
  assert.equal(a.rows[13].atr,2);assert.equal(a.latest.volume,1000);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_ETFS, CATALOG_PATHS, modelEtfPlan, projectModelEtf } from '../scripts/mercado-alfa/model-etfs.mjs';
import { aFirestore, NOMBRE_BASE } from '../scripts/mercado-alfa/firestore-rest.mjs';
const at='2026-09-03T17:00:00Z';
function fixture() {
  const prices=[];
  for(let date=new Date('2021-09-03');date<=new Date('2026-09-02');date.setUTCDate(date.getUTCDate()+1)) {
    if(date.getUTCDay()%6!==0) prices.push({date:date.toISOString().slice(0,10),adjusted_close:Number((100+prices.length/100).toFixed(2))});
  }
  const inputs=MODEL_ETFS.map(row=>({isin:row.asset_id,symbol:row.eodhd_symbol,fetchedAt:at,prices:structuredClone(prices),fundamentals:{
    General:{Code:row.eodhd_symbol.split('.')[0],Type:'ETF',Name:row.nombre,Exchange:'AS',CurrencyCode:'EUR',UpdatedAt:'2026-09-02'},
    ETF_Data:{ISIN:row.asset_id,Index_Name:'Índice de prueba',Ongoing_Charge:'0.20',Holdings_Count:'10',
      Asset_Allocation:{'Stock US':{'Net_Assets_%':'100'}},World_Regions:{'United States':{'Equity_%':'100'}},
      Sector_Weights:{Technology:{'Equity_%':'100'}},Top_10_Holdings:{'TEST.US':{Code:'TEST',Exchange:'US',Name:'Instrumento ficticio',Country:'USA',Sector:'Technology','Assets_%':'5'}}}
  }}));
  const items=Array.from({length:698},(_,index)=>({asset_id:'XX'+String(index).padStart(10,'0'),display_name:'Prueba '+index,grupo:'acciones'}));
  const sources={};
  for(const [index,path] of CATALOG_PATHS.entries()) {
    const value=index===0?{total:698,chunks:4,updated_at:at,prices_last_date:'2026-09-02',prices_last_date_min:'2026-08-27',identity_aliases:{XX0000000000:'XX0000001000'}}
      :{items:items.slice((index-1)*200,index*200),n:items.slice((index-1)*200,index*200).length,extra:'campo preservado'};
    sources[path]={name:`${NOMBRE_BASE}/${path}`,updateTime:at,fields:aFirestore(value).mapValue.fields};
  }
  return {sources,inputs};
}
test('alta exacta: 16 creaciones, cinco actualizaciones versionadas, sin cambiar fuentes ni alias',()=>{
  const f=fixture(),before=structuredClone(f),plan=modelEtfPlan(f.sources,f.inputs,at);
  assert.equal(plan.creates.length,16);assert.equal(plan.changes.length,5);assert.equal(plan.writes.length,21);
  assert.equal(new Set(plan.writes.map(write=>write.update.name)).size,21);
  assert.ok(plan.writes.slice(0,16).every(write=>write.currentDocument.exists===false));
  assert.ok(plan.writes.slice(16).every(write=>write.currentDocument.updateTime===at));
  const manifest=plan.changes.find(item=>item.path==='catalog_manifest/public').value;
  assert.equal(manifest.total,700);assert.deepEqual(manifest.identity_aliases,{XX0000000000:'XX0000001000'});
  assert.ok(plan.creates.filter(item=>item.path.endsWith('holdings/latest')).every(item=>item.value.as_of_date===null));
  assert.equal(plan.changes.slice(0,4).flatMap(item=>item.value.items).length,700);
  assert.deepEqual(f,before);
});
test('rechaza otra identidad, mercado o divisa y fuentes con datos ajenos',()=>{
  for(const change of [input=>input.isin='IE0000000001',input=>input.fundamentals.ETF_Data.ISIN='IE0000000001',
    input=>input.fundamentals.General.CurrencyCode='USD',input=>input.fundamentals.General.Exchange='LSE',
    input=>input.fundamentals.General.Officers={name:'No permitido'},input=>input.fundamentals.ETF_Data.Top_10_Holdings['TEST.US'].email='no']) {
    const input=fixture().inputs[0];change(input);assert.throws(()=>projectModelEtf(input,at));
  }
});
test('fechas imposibles, duplicadas, futuras y precios nulos/negativos no se silencian',()=>{
  for(const change of [input=>input.prices[1].date='2021-02-30',input=>input.prices[1].date=input.prices[0].date,
    input=>input.prices.at(-1).date='2027-01-01',input=>input.prices[1].adjusted_close=null,
    input=>input.prices[1].adjusted_close=-1,input=>input.prices[1].adjusted_close=100.123456789]) {
    const input=fixture().inputs[0];change(input);assert.throws(()=>projectModelEtf(input,at));
  }
});
test('no planifica sobre un catálogo distinto, incompleto o con el ETF ya presente',()=>{
  for(const change of [f=>f.sources[CATALOG_PATHS[0]].fields.total={integerValue:'700'},
    f=>delete f.sources[CATALOG_PATHS[1]],f=>f.inputs.push(f.inputs[0]),
    f=>f.sources[CATALOG_PATHS[1]].fields.items.arrayValue.values[0].mapValue.fields.asset_id={stringValue:MODEL_ETFS[0].asset_id}]) {
    const f=fixture();change(f);assert.throws(()=>modelEtfPlan(f.sources,f.inputs,at));
  }
});
test('posiciones no informadas no se inventan y conservan las catorce altas de activos/series',()=>{
  const f=fixture();for(const input of f.inputs)input.fundamentals.ETF_Data.Top_10_Holdings='NA';
  const plan=modelEtfPlan(f.sources,f.inputs,at);assert.equal(plan.creates.length,14);assert.equal(plan.writes.length,19);
});
test('respuesta selectiva plana y anidada producen exactamente el mismo plan',()=>{
  const f=fixture(),expected=modelEtfPlan(f.sources,f.inputs,at);
  for(const input of f.inputs) input.fundamentals=Object.fromEntries(Object.entries(input.fundamentals)
    .flatMap(([section,fields])=>Object.entries(fields).map(([key,value])=>[section+'::'+key,value])));
  assert.deepEqual(modelEtfPlan(f.sources,f.inputs,at),expected);
});

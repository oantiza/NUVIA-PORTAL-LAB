// Solo lectura de los cuatro modelos públicos; no consulta carteras personales.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { creaClienteMaestra, URL_DOCUMENTOS } from '../js/nuvia-datos.js';
import { CARTERAS_MODELO } from '../js/nuvia-modelos.js';
import { serieCartera } from '../js/nuvia-constructor.js';
import { metricasDesdeSerie, correlacionesDesdeSeries, estableceCorrelaciones } from '../js/nuvia-cartera.js';
import { activosParaFrontera, puntoCarteraFrontera, ahorroDeSeries, filasComparacionMetodos } from '../js/nuvia-analisis.js';
import { calculaMetodosIndependientes } from '../docs/fixtures/model-methods.mjs';

const requests = [];
const client = creaClienteMaestra({ almacen:null, fetchFn:async(url,options={}) => {
  const method = options.method || 'GET';
  assert.ok(method === 'GET' && String(url).startsWith(URL_DOCUMENTOS+'/') || method === 'POST' && url === URL_DOCUMENTOS+':batchGet');
  const response = await fetch(url,{...options,credentials:'omit',signal:AbortSignal.timeout(20000)});
  requests.push({method,path:String(url).replace(URL_DOCUMENTOS,''),status:response.status}); return response;
} });
const models=[];
for (const model of CARTERAS_MODELO) {
  const payload=await client.seriesRebasadas(model.posiciones.map(p=>p.asset_id));
  assert.equal(payload.series.length,model.posiciones.length);
  const pesos=Object.fromEntries(model.posiciones.map(p=>[p.asset_id,p.peso/100]));
  const before=JSON.stringify({payload,pesos});
  const expected=calculaMetodosIndependientes(payload.series,pesos);
  const metrics=metricasDesdeSerie(serieCartera(payload.series,pesos));
  estableceCorrelaciones(correlacionesDesdeSeries(payload.series.map(s=>({id:s.asset_id,niveles:s.values}))));
  const point=puntoCarteraFrontera(activosParaFrontera(payload.series,pesos),pesos);
  const ahorro=ahorroDeSeries(payload.series,pesos);
  for (const [actual,independent] of [[metrics.rentabilidadAnualizada,expected.historial.rentabilidad],[metrics.volatilidad,expected.historial.volatilidad],
    [point.rentabilidad,expected.modelo.rentabilidad],[point.volatilidad,expected.modelo.volatilidad],[ahorro.volatilidad,point.volatilidad]]) {
    assert.ok(Number.isFinite(actual) && Math.abs(actual-independent)<.0002,`${model.nombre}: ${actual} vs ${independent}`);
  }
  assert.equal(JSON.stringify({payload,pesos}),before);
  models.push({name:model.nombre,first:payload.dates[0],last:payload.dates.at(-1),closes:payload.dates.length,
    returns:metrics.observaciones,rows:filasComparacionMetodos(metrics,point),independent:expected,
    seriesSha256:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),state:'verified'});
}
estableceCorrelaciones(null);
const report={checkedAt:new Date().toISOString(),state:'verified',models,requests,remoteWrites:0};
await mkdir('output/coherencia-metodos',{recursive:true});
const file=`output/coherencia-metodos/contraste-${report.checkedAt.replace(/[:.]/g,'-')}.json`;
await writeFile(file,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,requests:requests.length,file},null,2));

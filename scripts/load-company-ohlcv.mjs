// prepare: solo lecturas. apply: creación atómica por empresa, nunca upsert.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { entradaActual } from '../js/nuvia-identidades.js';
import { tokenGcloud, URL_BASE, NOMBRE_BASE, camposDe } from './mercado-alfa/firestore-rest.mjs';
import { FROM, TO, YEARS, digest, fingerprint, identity, targets, compareCloses, bundle, createWrites } from './mercado-alfa/ohlcv-load.mjs';
import { inspectOhlcv } from '../company-analysis/alfa/ohlcv.mjs';

const [mode, input] = process.argv.slice(2);
assert.ok(['prepare','apply','verify'].includes(mode));
const root = resolve(import.meta.dirname, '..'), directory = resolve(root,'output/carga-ohlcv');
const index = JSON.parse(await readFile(resolve(root,'company-analysis/public/data/fundamentals.json'),'utf8'));
const entries = index.entries.map(entradaActual).map(({assetId,isin,symbol,quoteCurrency}) => ({assetId,isin,symbol,quoteCurrency}));
assert.equal(entries.length,73); assert.equal(new Set(entries.map(e=>e.isin)).size,73);
const catalogs = ['catalog_manifest/public',...['000','001','002','003'].map(id=>`catalog_chunks/${id}`)];
const protectedPaths = [...catalogs,...entries.flatMap(e=>[
  `assets/${e.isin}`,`assets/${e.isin}/fundamentals/current`,...YEARS.map(y=>`assets/${e.isin}/series/${y}`)])];
const allTargets = entries.flatMap(targets), allowed = new Set([...protectedPaths,...allTargets]);
const stamp = () => new Date().toISOString().replace(/[:.]/g,'-');
const calls = []; let phase='inicio', commits=0, created=0;
await mkdir(directory,{recursive:true});
const save = async (name,value) => { const file=resolve(directory,`${name}-${stamp()}.json`);
  await writeFile(file,JSON.stringify(value)+'\n',{flag:'wx'}); return file; };
try {
  const token=tokenGcloud();
  async function api(suffix, body) {
    assert.ok(suffix===':batchGet' || mode==='apply' && [':beginTransaction',':commit',':rollback'].includes(suffix));
    const r=await fetch(URL_BASE+suffix,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(60000)});
    calls.push({suffix,status:r.status}); assert.ok(r.ok,`Firestore HTTP ${r.status}`); return r.json();
  }
  async function batch(paths, transaction) {
    assert.ok(paths.every(p=>allowed.has(p))); const out=[];
    for(let i=0;i<paths.length;i+=30) {
      const part=paths.slice(i,i+30), rows=await api(':batchGet',{documents:part.map(p=>`${NOMBRE_BASE}/${p}`),...(transaction?{transaction}:{})});
      const map=new Map(rows.map(d=>[d.found?.name||d.missing,d.found||null])); assert.equal(map.size,part.length);
      for(const p of part) {assert.ok(map.has(`${NOMBRE_BASE}/${p}`));out.push(map.get(`${NOMBRE_BASE}/${p}`));}
    } return out;
  }
  if(mode==='prepare') {
    phase='inventario y huellas';
    const before=await batch(protectedPaths), source=new Map(protectedPaths.map((p,i)=>[p,before[i]]));
    assert.ok(catalogs.every(p=>source.get(p)));
    const inventory=await batch(allTargets), collisions=allTargets.filter((p,i)=>inventory[i]);
    const inputs=[], rows=[];
    for(const [i,entry] of entries.entries()) {
      phase=`preparación ${entry.symbol}`;
      const asset=camposDe(source.get(`assets/${entry.isin}`)?.fields); identity(entry,asset);
      const key=process.env.EODHD_API_KEY; assert.ok(key,'Falta credencial EODHD');
      const url=new URL(`https://eodhd.com/api/eod/${entry.symbol}`);
      Object.entries({api_token:key,fmt:'json',from:FROM,to:TO,period:'d',order:'a'}).forEach(([k,v])=>url.searchParams.set(k,v));
      const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
      assert.ok(response.ok,`Proveedor HTTP ${response.status}`);
      const inspected=inspectOhlcv(await response.json());
      const value={prices:inspected.points,fetchedAt:new Date().toISOString()};
      // Solo precios públicos por lista blanca en los archivos locales de preparación.
      await save(`fuente-${entry.symbol}`,value); inputs.push(value);
      const series=YEARS.map(y=>source.get(`assets/${entry.isin}/series/${y}`)).map(d=>d?camposDe(d.fields):null);
      const comparison=compareCloses(value.prices,series,entry);
      const dates=value.prices.map(p=>p.date);
      const expectedYears=YEARS.filter(y=>y>=Number(asset.history.first_date.slice(0,4))&&y<=Number(asset.history.last_date.slice(0,4)));
      const historyComplete=expectedYears.every(y=>series[YEARS.indexOf(y)]) && comparison.compared>0;
      const valid=inspected.issues.length===0 && historyComplete && comparison.differences===0 && dates.length>0
        && dates.every(d=>d>=FROM&&d<=TO);
      let documents=0;
      if(valid) {documents=bundle(entry,value).length; createWrites(entry,value);}
      rows.push({symbol:entry.symbol,isin:entry.isin,state:valid?'ready':'review',observations:dates.length,
        first:dates[0],last:dates.at(-1),issues:inspected.issues.slice(0,8),issueCount:inspected.issues.length,
        historyComplete,...comparison,documents});
      if((i+1)%10===0 || i===entries.length-1) console.log(JSON.stringify({prepared:i+1,total:entries.length,review:rows.filter(r=>r.state==='review').length}));
    }
    const prepared={schema:'nuvia-ohlcv-load.v1',preparedAt:new Date().toISOString(),entries,entriesSha256:digest(entries),inputs,
      inputsSha256:digest(inputs),protectedPaths,protected:before.map(fingerprint),collisions,rows};
    const file=await save('preparado',prepared);
    const summary={file,companies:rows.length,ready:rows.filter(r=>r.state==='ready').length,collisions,
      observations:rows.reduce((n,r)=>n+r.observations,0),creates:rows.reduce((n,r)=>n+r.documents,0),
      preservedDocuments:before.filter(Boolean).length,remoteWrites:0,rows};
    console.log(JSON.stringify({...summary,rows:rows.filter(r=>r.state!=='ready'),report:await save('dry-run',summary)},null,2));
  } else {
    phase='validación del archivo preparado';
    assert.ok(input && resolve(input).startsWith(directory+sep));
    const prepared=JSON.parse(await readFile(resolve(input),'utf8'));
    assert.equal(prepared.schema,'nuvia-ohlcv-load.v1');assert.deepEqual(prepared.entries,entries);
    assert.equal(prepared.entriesSha256,digest(entries));assert.equal(prepared.inputsSha256,digest(prepared.inputs));
    assert.equal(prepared.inputs.length,73);assert.deepEqual(prepared.protectedPaths,protectedPaths);
    assert.deepEqual(prepared.collisions,[]); assert.equal(prepared.rows.length,73);
    assert.ok(prepared.rows.every(r=>r.state==='ready' && r.differences===0 && r.issueCount===0));
    if(mode==='apply') assert.ok(Date.now()-Date.parse(prepared.preparedAt)>=0 && Date.now()-Date.parse(prepared.preparedAt)<86400000,'Preparación caducada');
    const before=await batch(protectedPaths);
    assert.deepEqual(before.map(fingerprint),prepared.protected,'Documentos protegidos cambiaron desde la preparación');
    const sources=new Map(protectedPaths.map((p,i)=>[p,before[i]]));
    const plans=entries.map((entry,i)=>{
      identity(entry,camposDe(sources.get(`assets/${entry.isin}`)?.fields));
      const series=YEARS.map(y=>sources.get(`assets/${entry.isin}/series/${y}`)).map(d=>d?camposDe(d.fields):null);
      const comparison=compareCloses(prepared.inputs[i].prices,series,entry);
      assert.ok(comparison.compared>0);assert.equal(comparison.differences,0);
      return bundle(entry,prepared.inputs[i]);
    });
    if(mode==='apply') {
      assert.ok((await batch(allTargets)).every(d=>d===null),'Destino existente: no sobrescribir ni repetir sin revisar');
      for(const [i,entry] of entries.entries()) {
        phase=`creación ${entry.symbol}`;
        const transaction=(await api(':beginTransaction',{options:{readWrite:{}}})).transaction;
        assert.ok(transaction); let committed=false;
        try {
          const relevant=protectedPaths.filter(p=>p===`assets/${entry.isin}`||p.startsWith(`assets/${entry.isin}/`)||catalogs.includes(p));
          const snapshot=await batch(relevant,transaction);
          assert.deepEqual(snapshot.map(fingerprint),relevant.map(p=>prepared.protected[protectedPaths.indexOf(p)]));
          assert.ok((await batch(targets(entry),transaction)).every(d=>d===null));
          const writes=createWrites(entry,prepared.inputs[i]);
          const receipt=await api(':commit',{transaction,writes}); committed=true;commits++;created+=writes.length;
          await save(`recibo-${entry.symbol}`,{preparedFile:resolve(input),symbol:entry.symbol,commitTime:receipt.commitTime,
            results:receipt.writeResults?.length,paths:plans[i].map(d=>d.path),revision:plans[i][0].value.revision});
          assert.equal(receipt.writeResults?.length,writes.length);
          const after=await batch(plans[i].map(d=>d.path));
          after.forEach((d,j)=>{assert.ok(d);assert.deepEqual(camposDe(d.fields),plans[i][j].value);});
          console.log(JSON.stringify({committed:commits,total:73,symbol:entry.symbol,created}));
        } finally {if(!committed) await api(':rollback',{transaction}).catch(()=>{});}
      }
    }
    phase='verificación completa';
    const expected=plans.flat(), after=await batch(expected.map(d=>d.path));
    after.forEach((d,i)=>{assert.ok(d);assert.deepEqual(camposDe(d.fields),expected[i].value);});
    const preserved=await batch(protectedPaths); assert.deepEqual(preserved.map(fingerprint),prepared.protected);
    const result={state:'verified',mode,preparedFile:resolve(input),companies:73,documentsVerified:after.length,
      observations:prepared.inputs.reduce((n,v)=>n+v.prices.length,0),existingDocumentsUnchanged:preserved.filter(Boolean).length,
      absentProtectedPathsUnchanged:preserved.filter(d=>!d).length,created,commits,deleted:0,updated:0,checkedAt:new Date().toISOString()};
    console.log(JSON.stringify({...result,report:await save('resultado',result)},null,2));
  }
} catch(error) {
  // Nunca volcar errores de fetch/credenciales, respuesta del proveedor o cuerpo de commits.
  const report={state:'not-completed',phase,reason:error.code||error.name,commits,created,calls,
    diagnostic:error.code==='ERR_ASSERTION'?error.message.slice(0,350):'Revisar operación sin revelar credenciales',
    notice:'No hay reintentos de commit ni rollback destructivo. Revisar recibos y destinos antes de continuar.'};
  console.error(JSON.stringify({...report,report:await save('incidencia',report)},null,2));process.exitCode=1;
}

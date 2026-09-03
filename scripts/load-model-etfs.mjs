// Carga puntual autorizada. prepare solo lee; apply crea dos ETF y actualiza catálogo.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { tokenGcloud, URL_BASE, NOMBRE_BASE } from './mercado-alfa/firestore-rest.mjs';
import { MODEL_ETFS, ETF_FIELDS, ETF_TARGETS, CATALOG_PATHS, cleanDocument, modelEtfPlan } from './mercado-alfa/model-etfs.mjs';

const [mode,input] = process.argv.slice(2);
assert.ok(['prepare','apply'].includes(mode), 'Uso: prepare | apply archivo-preparado.json');
const directory = resolve('output/carga-etf-modelos');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g,'-');
const fingerprint = doc => ({ name:doc.name, updateTime:doc.updateTime, sha256:digest(doc.fields) });
const allowed = new Set([...CATALOG_PATHS,...ETF_TARGETS]);
const calls = []; let phase = 'inicio', providerRequests = 0;
await mkdir(directory,{recursive:true});
try {
  const token = tokenGcloud();
  async function api(path,body) {
    const get = body === undefined;
    const parent = MODEL_ETFS.some(row => path === `assets/${row.asset_id}:listCollectionIds`);
    assert.ok(get ? allowed.has(path) : path === ':batchGet' || parent
      || mode === 'apply' && [':beginTransaction',':commit',':rollback'].includes(path));
    const url = path.startsWith(':') ? URL_BASE+path : URL_BASE+'/'+path;
    const response = await fetch(url,{ method:get?'GET':'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      ...(get?{}:{body:JSON.stringify(body)}), redirect:'error', signal:AbortSignal.timeout(30000) });
    calls.push({path,method:get?'GET':'POST',status:response.status});
    if (!response.ok) throw new Error(`Base propia HTTP ${response.status}`);
    return response.json();
  }
  async function batch(paths,transaction) {
    assert.ok(paths.every(path=>allowed.has(path)));
    const docs=[];
    for(let offset=0;offset<paths.length;offset+=180) {
      const part=paths.slice(offset,offset+180);
      const response=await api(':batchGet',{documents:part.map(path=>`${NOMBRE_BASE}/${path}`),...(transaction?{transaction}:{})});
      const map=new Map(response.map(item=>[item.found?.name||item.missing,item.found||null]));
      assert.equal(map.size,part.length);
      for(const path of part) { assert.ok(map.has(`${NOMBRE_BASE}/${path}`)); docs.push(map.get(`${NOMBRE_BASE}/${path}`)); }
    }
    return docs;
  }
  function protectedPaths(sources) {
    const manifest=cleanDocument(sources[CATALOG_PATHS[0]]);
    const ids=CATALOG_PATHS.slice(1).flatMap(path=>cleanDocument(sources[path]).items.map(item=>item.asset_id));
    ids.push(...Object.values(manifest.identity_aliases||{}));
    assert.ok(ids.every(id=>/^[A-Z0-9]{12}$/.test(id)));
    const paths=[...new Set(ids)].sort().map(id=>`assets/${id}`);
    paths.forEach(path=>allowed.add(path)); return paths;
  }
  async function noOrphans() {
    for(const row of MODEL_ETFS) {
      const result=await api(`assets/${row.asset_id}:listCollectionIds`,{pageSize:100});
      assert.ok(!result.nextPageToken); assert.deepEqual(result.collectionIds||[],[], 'Subcolecciones existentes: revisar');
    }
    assert.ok((await batch(ETF_TARGETS)).every(doc=>doc===null), 'No sobrescribir destinos');
  }
  async function provider(symbol,endpoint,params) {
    const key=process.env.EODHD_API_KEY; assert.ok(key,'Falta credencial del proveedor');
    const url=new URL(`https://eodhd.com/api/${endpoint}/${symbol}`);
    Object.entries({...params,api_token:key,fmt:'json'}).forEach(([key,value])=>url.searchParams.set(key,value));
    providerRequests++;
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw new Error(`Proveedor HTTP ${response.status}`);
    return response.json();
  }
  if(mode==='prepare') {
    phase='inventario de destinos';
    const sourceDocs=await batch(CATALOG_PATHS); assert.ok(sourceDocs.every(Boolean));
    const sources=Object.fromEntries(CATALOG_PATHS.map((path,index)=>[path,sourceDocs[index]]));
    const oldPaths=protectedPaths(sources), oldDocs=await batch(oldPaths); assert.ok(oldDocs.every(Boolean));
    await noOrphans();
    let inputs=[];
    if(input) {
      assert.ok(resolve(input).startsWith(directory+sep));
      inputs=JSON.parse(await readFile(resolve(input),'utf8'));
    } else for(const row of MODEL_ETFS) {
      phase=`descarga selectiva ${row.eodhd_symbol}`;
      const fundamentals=await provider(row.eodhd_symbol,'fundamentals',{filter:ETF_FIELDS.join(',')});
      const prices=await provider(row.eodhd_symbol,'eod',{from:'2021-09-03',to:new Date().toISOString().slice(0,10),period:'d',order:'a'});
      inputs.push({isin:row.asset_id,symbol:row.eodhd_symbol,fundamentals,prices,fetchedAt:new Date().toISOString()});
    }
    phase='validación de proyección';
    if(!input) await writeFile(resolve(directory,`fuente-${stamp()}.json`),JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
    const at=new Date().toISOString(), plan=modelEtfPlan(sources,inputs,at);
    const prepared={schema:'nuvia-model-etfs-load.v1',preparedAt:at,sources,inputs,protected:oldDocs.map(fingerprint),
      inputsSha256:digest(inputs),planSha256:digest(plan),providerRequests,calls};
    const file=resolve(directory,`preparado-${stamp()}.json`);
    await writeFile(file,JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});
    const summary={file,creates:plan.creates.map(item=>item.path),updates:plan.changes.map(item=>item.path),
      preservedAssets:oldDocs.length,holdings:plan.creates.filter(item=>item.path.endsWith('/holdings/latest')).map(item=>({path:item.path,rows:item.value.holdings.length,date:item.value.as_of_date})),
      histories:plan.creates.filter(item=>/^assets\/[A-Z0-9]{12}$/.test(item.path)).map(item=>({isin:item.value.isin,...item.value.history,quality:item.value.quality})),providerRequests,remoteWrites:0};
    await writeFile(resolve(directory,`dry-run-${stamp()}.json`),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify(summary,null,2));
  } else {
    phase='validación de lote autorizado';
    assert.ok(input&&resolve(input).startsWith(directory+sep));
    const prepared=JSON.parse(await readFile(resolve(input),'utf8'));
    assert.equal(prepared.schema,'nuvia-model-etfs-load.v1');
    assert.equal(digest(prepared.inputs),prepared.inputsSha256);
    const plan=modelEtfPlan(prepared.sources,prepared.inputs,prepared.preparedAt);
    assert.equal(digest(plan),prepared.planSha256);
    assert.ok(Date.now()-Date.parse(prepared.preparedAt)>=0&&Date.now()-Date.parse(prepared.preparedAt)<86400000,'Preparación caducada');
    const oldPaths=protectedPaths(prepared.sources), oldDocs=await batch(oldPaths);
    assert.ok(oldDocs.every(Boolean)); assert.deepEqual(oldDocs.map(fingerprint),prepared.protected,'Fichas antiguas modificadas: revisar');
    await noOrphans();
    const begun=await api(':beginTransaction',{options:{readWrite:{}}}); assert.ok(begun.transaction);
    let committed=false;
    try {
      phase='lecturas transaccionales';
      const current=await batch(CATALOG_PATHS,begun.transaction);
      assert.ok(current.every(Boolean));
      assert.deepEqual(current.map(fingerprint),CATALOG_PATHS.map(path=>fingerprint(prepared.sources[path])),'Catálogo modificado: revisar');
      assert.ok((await batch(ETF_TARGETS,begun.transaction)).every(doc=>doc===null));
      const planFile=resolve(directory,`plan-${stamp()}.json`);
      await writeFile(planFile,JSON.stringify({preparedFile:resolve(input),...plan},null,2)+'\n',{flag:'wx'});
      phase='commit único sin reintento';
      const receipt=await api(':commit',{writes:plan.writes,transaction:begun.transaction}); committed=true;
      const receiptFile=resolve(directory,`commit-${stamp()}.json`);
      await writeFile(receiptFile,JSON.stringify({planFile,commitTime:receipt.commitTime,results:receipt.writeResults?.length},null,2)+'\n',{flag:'wx'});
      assert.equal(receipt.writeResults?.length,plan.writes.length);
      phase='verificación posterior';
      const expected=[...plan.creates,...plan.changes], after=await batch(expected.map(item=>item.path));
      after.forEach((doc,index)=>{assert.ok(doc);assert.deepEqual(cleanDocument(doc),expected[index].value);});
      const preserved=await batch(oldPaths); assert.ok(preserved.every(Boolean));
      assert.deepEqual(preserved.map(fingerprint),prepared.protected,'Cambios concurrentes en fichas protegidas: no atribuir sin investigar');
      const result={state:'verified',commitTime:receipt.commitTime,created:plan.creates.length,catalogDocumentsUpdated:plan.changes.length,
        verified:after.length,existingAssetsUnchanged:preserved.length,deleted:0,receiptFile,planFile,calls};
      const file=resolve(directory,`resultado-${stamp()}.json`);await writeFile(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
      console.log(JSON.stringify({...result,calls:calls.length,file},null,2));
    } finally { if(!committed) await api(':rollback',{transaction:begun.transaction}).catch(()=>{}); }
  }
} catch(error) {
  console.error(JSON.stringify({state:'not-completed',phase,reason:error.code||error.name,
    ...(phase==='validación de proyección'&&error.code==='ERR_ASSERTION'?{diagnostic:error.message.slice(0,800)}:{}),calls,
    notice:'Revisar preparación y recibos antes de repetir; no se muestran credenciales ni se reintenta el commit.'}));
  process.exitCode=1;
}

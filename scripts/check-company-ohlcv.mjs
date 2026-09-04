// Verificación pública de lectura: sin credenciales, escrituras remotas ni proveedor directo.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {entradaActual} from '../js/nuvia-identidades.js';
import {readOhlcv} from '../company-analysis/src/alfa/ohlcv.js';
import {technicalOhlcv} from '../company-analysis/alfa/ohlcv.mjs';
const root=resolve(import.meta.dirname,'..');
const index=JSON.parse(await readFile(resolve(root,'company-analysis/public/data/fundamentals.json'),'utf8'));
const entries=index.entries.map(entradaActual),rows=[];let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<entries.length) {
    const e=entries[cursor++];
    try {
      const data=await readOhlcv(e,{signal:AbortSignal.timeout(30000)}),a=technicalOhlcv(data.raw);
      rows.push({symbol:e.symbol,isin:e.isin,state:'verified',n:data.raw.length,first:data.raw[0].date,last:data.lastDate,
        close:a.latest.value,atr14:a.latest.atr,volume:a.latest.volume,revision:data.revision});
    } catch(error) {rows.push({symbol:e.symbol,isin:e.isin,state:'error',code:error.code||error.name});}
  }
}));
rows.sort((a,b)=>a.symbol.localeCompare(b.symbol));
const report={checkedAt:new Date().toISOString(),companies:entries.length,verified:rows.filter(r=>r.state==='verified').length,
  observations:rows.reduce((n,r)=>n+(r.n||0),0),remoteWrites:0,rows};
const folder=resolve(root,'output/cierre-alfa/ohlcv');await mkdir(folder,{recursive:true});
const file=resolve(folder,`reader-${report.checkedAt.replace(/[:.]/g,'-')}.json`);
await writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,rows:rows.filter(r=>r.state!=='verified'),file},null,2));
if(report.verified!==entries.length)process.exitCode=1;

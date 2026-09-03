/** Solo lee archivos del portal. No accede a red, base de datos ni proveedores. */
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const root=resolve(process.argv[2] || '.');
const files=(await readdir(root)).filter(f=>f.endsWith('.html') && !f.startsWith('_'));
const sources=new Map(await Promise.all(files.map(async f=>[f,await readFile(resolve(root,f),'utf8')])));
const base=new URL('https://nuvia.local/');
let links=0, anchors=0, dynamic=0, resultAnchors=0;
const constructor=await readFile(resolve(root,'js/nuvia-constructor.js'),'utf8');
const errors=[];
for(const [file,raw] of sources){
  const html=raw.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[\s\S]*?<\/script>/gi,'');
  for(const [tag,href] of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/gi)){
    if(href.includes('{{')){dynamic++;continue;}
    const url=new URL(href.replaceAll('&amp;','&'),new URL(file,base));
    if(url.origin!==base.origin)continue;
    links++;
    const target=decodeURIComponent(url.pathname.slice(1)) || 'index.html';
    const absolute=resolve(root,target);
    if(!absolute.startsWith(root+sep)){errors.push(`${file}: ruta fuera del portal ${href}`);continue;}
    try{await access(absolute);}catch{errors.push(`${file}: destino inexistente ${href}`);continue;}
    if(url.hash){
      anchors++;
      const id=decodeURIComponent(url.hash.slice(1));
      const dest=sources.get(target) || '';
      if(![...dest.matchAll(/\bid="([^"]+)"/g)].some(m=>m[1]===id)) {
        if(file==='cartera.html' && target===file && /^fase-0[2-5]$/.test(id)
          && tag.includes('data-result-anchor') && tag.includes('aria-disabled="true"')
          && constructor.includes(`idFase('${id.slice(-2)}')`)) resultAnchors++;
        else errors.push(`${file}: ancla inexistente ${href}`);
      }
    }
  }
}
console.log(`${files.length} páginas; ${links} enlaces internos; ${anchors} anclas (${resultAnchors} ligadas al cálculo); ${dynamic} enlaces de plantilla reservados a pruebas de interfaz.`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('Destinos locales y anclas estáticas: OK');

// Isolated regression browser; no user browser, remote data or form submissions.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {inspectFieldAlignment} from './check-field-alignment.mjs';
const root=resolve('.'), output=resolve('output/field-alignment');
const widths=(process.argv[2]||'1440,1280,1180,1024,900,820,768').split(',').map(Number);
const routes=process.argv[3]?.split(',') || [...(await readdir(root)).filter(p=>p.endsWith('.html')),
  'academia.html?tab=calculadora','academia.html?tab=fundamentos','cartera.html?vista=models'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://local.test').pathname);
  if(!p.startsWith(root+sep))throw Error();res.setHeader('Content-Type',mime[extname(p)]||'application/octet-stream');res.end(await readFile(p));
}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base=`http://127.0.0.1:${server.address().port}`, browser=await chromium.launch({headless:true}), results=[];
try {
  await mkdir(output,{recursive:true});
  const page=await browser.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const record=async(width,route,state='inicial')=>{
    await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
    const result=await inspectFieldAlignment(page);
    results.push({width,route,state,...result});
    console.log(`${result.problems.length?'FAIL':'OK'} ${width} ${route} ${state}: ${result.rows.length} filas, ${result.problems.length} desalineadas`);
    for(const p of result.problems)console.log(JSON.stringify(p));
  };
  for(const width of widths)for(const route of routes){
    await page.setViewportSize({width,height:1000});
    await page.goto(`${base}/${route}`);await page.evaluate(()=>document.fonts.ready);
    // Let local template rendering and ResizeObservers settle; no external waits.
    await page.waitForTimeout(500);
    await record(width,route);
    if(route==='vivienda.html') {
      for(const name of ['Variable','Mixta','Fija','Ofertas','Compra o alquiler','Amortización','Presupuesto']) {
        await page.getByRole('button',{name,exact:true}).click(); await record(width,route,name);
      }
    }
    if(route==='jubilacion.html') {
      await page.getByRole('button',{name:'No, necesito una estimación',exact:true}).click();
      await record(width,route,'sin certificado');
      await page.getByRole('combobox',{name:'Tipo de renta formalizada con la EPSV',exact:true}).selectOption('temporary');
      await record(width,route,'renta temporal');
      await page.getByRole('spinbutton',{name:'Subida anual estimada de la pensión',exact:true}).fill('99');
      await record(width,route,'error de formulario');
    }
    if(route==='sistema-visual.html') {
      // Synthetic stress case in this isolated page only: multi-line labels and
      // unequal helper lengths must not change the baseline of adjacent inputs.
      await page.locator('label[for=sample-amount]').evaluate(el=>el.textContent='Etiqueta de prueba deliberadamente extensa para comprobar que cuatro líneas completas no desplazan el campo respecto de los demás');
      await record(width,route,'etiqueta extensa');
    }
  }
  await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));
  if(results.some(r=>r.problems.length))process.exitCode=1;
} finally {await browser.close();await new Promise(ok=>server.close(ok));}

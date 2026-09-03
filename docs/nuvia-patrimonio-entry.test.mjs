import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root=resolve(process.argv[2]||'.');
const read=file=>readFileSync(resolve(root,file),'utf8');
const html=read('temas.html');
const code=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code,'Controlador local de temas presente');
function controller(search='') {
  let redirected=null, title=null;
  const location={search,href:'https://example.test/temas.html'+search,replace:href=>{redirected=href;}};
  const window={location,history:{replaceState:(_state,_title,url)=>{location.search=url.search;}},scrollTo:()=>{},__nuviaSincronizarTema:id=>{title=id;}};
  class DCLogic { props={temaInicial:'patrimonio'}; setState(state){Object.assign(this.state,state);} }
  const Component=runInNewContext(code+'; Component',{DCLogic,window,URL,URLSearchParams});
  const c=new Component(); c.componentDidMount();
  return {c,redirected,title};
}
for(const query of ['', '?topic=patrimonio', '?topic=desconocido']) {
  const {c,title}=controller(query), result=c.renderVals();
  assert.equal(result.esPortada,true,query+' muestra la entrada');
  assert.equal(result.esJubilacion,false);
  assert.equal(result.esRecursos,false);
  assert.equal(result.mostrarSelector,false);
  assert.equal(title,'patrimonio');
}
const retirement=controller('?topic=jubilacion');
assert.equal(retirement.c.renderVals().esJubilacion,true);
assert.equal(retirement.c.renderVals().mostrarRegresoPatrimonio,true);
const wellbeing=controller('?topic=bienestar');
assert.equal(wellbeing.c.renderVals().esBienestar,true);
assert.equal(wellbeing.c.renderVals().mostrarSelector,false);
assert.equal(wellbeing.c.renderVals().mostrarRegresoPatrimonio,false);
const planning=controller('?topic=planificacion-patrimonial');
assert.equal(planning.c.renderVals().esPlanificacion,true);
assert.equal(planning.c.renderVals().recursos.length,3);
assert.equal(planning.c.renderVals().pildoras.length,4);
assert.ok(planning.c.renderVals().pildoras.every(p=>!p.nombre.includes('Bienestar')));
for (const [key,target] of [['vivienda','vivienda.html'],['vivienda-coste-vida','vivienda.html'],['fiscalidad','fiscalidad.html'],['mis-impuestos','fiscalidad.html']]) {
  assert.equal(controller('?topic='+key).redirected,target,'Alias '+key);
}
retirement.c.ir('planificacion-patrimonial'); retirement.c.componentDidUpdate();
assert.equal(retirement.c.renderVals().esPlanificacion,true,'Cambio mediante selector preservado');
assert.match(html,/<h1[^>]*id="tema-titulo">Patrimonio<\/h1>/);
const cards=[...html.matchAll(/<article[^>]*data-patrimonio-area="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
assert.deepEqual(cards.map(m=>m[1]),['vivienda','impuestos','jubilacion','planificacion']);
const targets=['vivienda.html','fiscalidad.html','jubilacion.html','temas.html?topic=planificacion-patrimonial'];
cards.forEach((card,i)=>assert.ok(card[2].includes(`href="${targets[i]}"`)));
assert.equal(cards.filter(m=>m[2].includes('nv-tag--pending')).length,1);
assert.match(cards[3][2],/Todavía no hay un cuestionario/);
assert.doesNotMatch(cards.map(m=>m[2]).join(''),/<input|<form|<textarea/);
assert.match(read('index.html'),/class="home26-plate__cta" href="temas.html">Accede a Patrimonio/);
assert.doesNotMatch(html.match(/<meta name="description"[^>]+>/)[0],/bienestar/i);
console.log('Patrimonio 5A-1: portada, cuatro ámbitos, disponibilidad, vistas y alias conservados.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root=resolve(process.argv[2]||'.');
const read=file=>readFileSync(resolve(root,file),'utf8');
const markets=read('mercados.html'), portfolio=read('cartera.html');
const entry=markets.match(/<nav class="markets-space-nav"[\s\S]*?<\/nav>/)?.[0];
assert.ok(entry,'Entrada del espacio presente');
assert.match(markets,/<h1[^>]*>Economía y Finanzas<\/h1>/);
assert.match(entry,/aria-label="Ámbitos de Economía y Finanzas"/);
assert.equal((entry.match(/data-economia-area=/g)||[]).length,2);
assert.match(entry,/href="mercados.html#actualidad" data-economia-area="mercados"/);
assert.match(entry,/href="cartera.html" data-economia-area="cartera"/);
assert.doesNotMatch(entry,/<input\b|<form\b|<textarea\b|href="[^\"]*companies/);
assert.match(markets,/id="actualidad" class="markets-area-views"/);
assert.match(markets,/aria-describedby="markets-views-label"/);
for(const name of ['description','og:description','twitter:description']) {
  const meta=markets.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`));
  assert.ok(meta?.[1].includes('Economía y Finanzas en NUVIA:'),name);
}
assert.match(portfolio,/Dentro de Economía y Finanzas, explora/);
assert.match(portfolio,/class="nuvia-analysis-availability">[^<]*algunas requieren acceso autorizado/);
for(const [id,href] of [['portfolio','cartera.html?vista=portfolio#laboratorio'],['models','cartera.html?vista=models#carteras-modelo'],['companies','cartera.html?vista=companies#suite-nuvia']]) {
  assert.ok(portfolio.includes(`id="vista-${id}" href="${href}"`),id);
}
assert.match(portfolio,/data-src="company-analysis\/index.html\?embedded=web2"/);
const code=markets.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code,'Controlador de vistas conservado');
function controller(query='',actions=[]) {
  const document={title:''};
  class DCLogic { setState(state){Object.assign(this.state,state);} }
  const Component=runInNewContext(code+'; Component',{DCLogic,document,URLSearchParams,window:{location:{search:query,reload:()=>actions.push('reload'),assign:url=>actions.push(url)},history:{replaceState:(_state,_title,url)=>actions.push(url)},scrollTo:()=>{}}});
  const c=new Component(); c.componentDidMount();
  assert.equal(document.title,'NUVIA · Economía y Finanzas');
  return c;
}
for(const [query,view] of [['','portada'],['portada','portada'],['informes','informes'],['cotizaciones','cotizaciones'],['diario','portada'],['archivo','informes'],['semanal','cotizaciones'],['desconocido','portada']]) {
  const c=controller('?vista='+query);
  assert.equal(c.state.vista,view,query);
  c.renderVals(); // Las tres vistas y los alias siguen pudiendo producir contenido.
}
const c=controller();
for(const view of ['informes','cotizaciones','portada']) {c.ir(view);assert.equal(c.state.vista,view);c.renderVals();}
for(const view of ['informes','cotizaciones']) {
  const actions=[], current=controller('',actions);
  current.ir(view); current.renderVals().abrirActualidad({preventDefault:()=>actions.push('prevent')});
  assert.deepEqual(actions,['prevent','mercados.html#actualidad','reload'],'El acceso recupera el arranque editorial, no la plantilla sin hidratar');
  const queryActions=[], withQuery=controller('?vista='+view,queryActions);
  withQuery.renderVals().abrirActualidad({preventDefault:()=>queryActions.push('prevent')});
  assert.deepEqual(queryActions,[],'Desde otra URL se conserva la navegación nativa');
  withQuery.renderVals().vistas[0].abrir();
  assert.deepEqual(queryActions,['mercados.html'],'La pestaña de noticias también recupera el contenido fechado');
}
assert.match(code,/\['portada', 'Noticias y contexto'\]/);
console.log('Economía 5A-2: dos ámbitos, tres vistas y alias, metadatos y empresas dentro de Cartera.');

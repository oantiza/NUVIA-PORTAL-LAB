import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reglaNumerica, errorNumerico, erroresRelacion } from '../js/nuvia-formularios.js';
import { destinoPendiente, senalaDestinosPendientes, sincronizaAtajos } from '../js/nuvia-estados.js';
const error = (v, c = {}) => errorNumerico(v, reglaNumerica(c));
test('vacío no es cero; importe opcional de cartera sí admite vacío', () => {
  assert.ok(error('')); assert.equal(error('0'), '');
  assert.equal(error('', {id:'importe-cartera'}), '');
  assert.equal(error('', {id:'modelos-importe-cartera'}), '');
});
test('rechaza negativos monetarios, infinitos y números inválidos', () => {
  for (const v of ['-1','Infinity','NaN','1e309','texto']) assert.ok(error(v));
  assert.ok(errorNumerico('',reglaNumerica(),true));
});
test('límites explícitos e intervalos enteros; paso no es redondeo obligatorio', () => {
  for (const v of ['0','41','2.5']) assert.ok(error(v,{name:'years',min:'1',max:'40'}));
  assert.equal(error('40',{name:'years',min:'1',max:'40'}),'');
  assert.equal(error('125.55',{name:'initialCapital',step:'1000'}),'');
});
test('hipótesis negativas válidas; límites singulares y porcentajes', () => {
  for (const name of ['expectedReturn','inflationRate','homeAppreciation']) {
    assert.equal(error('-2',{name}), ''); assert.ok(error('-100',{name}));
  }
  assert.ok(error('-3',{name:'expectedReturn',min:'-2',max:'12'}));
  assert.equal(error('-100',{name:'annualIncrease'}),'');
  assert.ok(error('101',{name:'taxRate'}));
  assert.ok(error('1000000000001',{name:'initialCapital'}));
});
test('denominadores monetarios positivos; saldos nulos válidos', () => {
  for (const name of ['purchasePrice','annualHouseholdIncome','repaymentBalance']) assert.ok(error('0',{name}));
  assert.equal(error('0',{name:'cashValue'}),'');
});
test('relaciones incoherentes en vivienda, jubilación y ofertas', () => {
  const invalid={purchasePrice:10,downPayment:11,years:5,fixedYears:6,repaymentBalance:10,repaymentAmount:11,age:65,targetAge:65,epsvPre:10,epsvPreReturn:11,epsvPost:10,epsvPostReturn:11,'a|years':5,'a|fixedYears':6};
  assert.equal(Object.keys(erroresRelacion(invalid)).length,7);
  assert.deepEqual(erroresRelacion({purchasePrice:10,downPayment:10,age:65,targetAge:66}),{});
  assert.deepEqual(erroresRelacion({downPayment:10}),{});
  assert.deepEqual(erroresRelacion({'a|years':10,'a|fixedYears':25,'a|kind':'Fija'}),{});
});
test('Jubilación invalida planes ante cambios, reinicios y errores', () => {
  const html=readFileSync(new URL('../jubilacion.html',import.meta.url),'utf8');
  const code=html.match(/<script[^>]+type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  class DCLogic {setState(s){this.state={...this.state,...s};}}
  const C=vm.runInNewContext(code+';Component',{DCLogic,Intl,URLSearchParams,location:{search:''},setTimeout:()=>{}});
  const c=new C(); c.state={s:c.defaults(),errores:[],plan:{old:true}};
  c.upd('age',70);assert.equal(c.state.plan,null);
  for(const action of ['vaciarPatrimonio','cargarDFB','restablecer']) {
    c.state.plan=null; const fn=c.renderVals()[action]; c.state.plan={old:true}; fn();assert.equal(c.state.plan,null,action);
  }
  c.state={s:{...c.defaults(),age:111},errores:[],plan:null};
  const v=c.renderVals();c.state.plan={old:true};v.calcular();assert.equal(c.state.plan,null);assert.ok(c.state.errores.length);
});
test('destinos pendientes y alias, sin bloquear herramientas disponibles', () => {
  for(const path of ['cartera.html?vista=companies','cartera.html?vista=technical','cartera.html?vista=fundamental']) assert.equal(destinoPendiente(new URL(path,'https://local.test/sub/')),false,path);
  // Decision del fundador (03-09-2026): «Bienestar» y «Planificacion patrimonial»
  // estan publicadas y NO se marcan como pendientes.
  for(const path of ['temas.html?topic=bienestar','temas.html?topic=planificacion-patrimonial','cartera.html?vista=portfolio','cartera.html?vista=models','vivienda.html','temas.html','academia.html?tab=calculadora']) assert.equal(destinoPendiente(new URL(path,'https://local.test/sub/')),false,path);
});

function entornoEnlaces(hrefs) {
  const targets=new Map();
  const ownerDocument={createElement:()=>({remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}}),getElementById:id=>targets.get(id)};
  const links=hrefs.map(href=>({attrs:{href},children:[],getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},querySelector(selector){return this.children.find(c=>'.'+c.className===selector);},append(e){e.parent=this;this.children.push(e);}}));
  return {targets,links,root:{ownerDocument,querySelectorAll:()=>links}};
}
test('la marca pendiente es idempotente y no altera enlaces externos',()=>{
  const {root,links}=entornoEnlaces(['cartera.html?vista=companies','https://otro.test/cartera.html?vista=companies','vivienda.html']);
  for(let i=0;i<3;i++)senalaDestinosPendientes(root,'https://nuvia.test/portal/index.html');
  assert.equal(links[0].children.length,0,'Fundamentales recuperados: no se añade un estado editorial obsoleto');
  assert.equal(links[1].children.length,0);assert.equal(links[2].children.length,0);
});
test('retira marcas antiguas en destinos recuperados y anclas sin tocar estados externos',()=>{
  const {root,links}=entornoEnlaces(['cartera.html?vista=companies','cartera.html?vista=technical','cartera.html?vista=fundamental','#main','https://otro.test/cartera.html?vista=companies']);
  for (const link of links) {
    const mark=root.ownerDocument.createElement('small'); mark.className='nv-link-pending'; link.append(mark);
  }
  for(let i=0;i<3;i++)senalaDestinosPendientes(root,'https://nuvia.test/portal/cartera.html?vista=companies');
  for (const link of links.slice(0,4)) assert.equal(link.children.length,0);
  assert.equal(links[4].children.length,1,'No se modifica el estado editorial de enlaces externos');
});
test('atajos: desactivados sin resultado, activos al existir, desactivados con error',()=>{
  const {root,links,targets}=entornoEnlaces(['#fase-02']);
  sincronizaAtajos(root);sincronizaAtajos(root);
  assert.equal(links[0].attrs['aria-disabled'],'true');assert.equal(links[0].children.length,1);
  targets.set('fase-02',{closest:()=>null});sincronizaAtajos(root);
  assert.equal(links[0].attrs['aria-disabled'],undefined);assert.equal(links[0].children.length,0);
  targets.set('fase-02',{closest:()=>({})});sincronizaAtajos(root);
  assert.equal(links[0].attrs['aria-disabled'],'true');assert.equal(links[0].children.length,1);
});

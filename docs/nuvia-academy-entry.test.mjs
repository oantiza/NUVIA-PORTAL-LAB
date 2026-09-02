import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(process.argv[2]||'.');
const academy=readFileSync(resolve(root,'academia.html'),'utf8');
const course=readFileSync(resolve(root,'curso.html'),'utf8');
class DCLogic {props={};setState(s){Object.assign(this.state,s);}}
const component=html=>runInNewContext(html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1]+'; Component',{DCLogic,Intl,URLSearchParams,React:{createElement:(type,props)=>({type,props})},window:{location:{search:'',hash:''}}});
const Academy=component(academy), Course=component(course);
assert.match(academy,/document.title = 'NUVIA · Academia NUVIA'/);
assert.doesNotMatch(academy,/Academia Nuvia|seguimiento del progreso/);
assert.equal((academy.match(/id="ruta-aprendizaje"/g)||[]).length,1);
const route=academy.match(/<section id="ruta-aprendizaje"[\s\S]*?<\/section>/)[0];
assert.equal((route.match(/class="ac-learning-step"/g)||[]).length,3);
for(const tab of ['fundamentos','activos','calculadora','glosario']) assert.ok(route.includes(`href="academia.html?tab=${tab}"`));
assert.doesNotMatch(route,/<form\b|<input\b|<iframe\b/);
assert.match(route,/sin orden obligatorio ni prueba de nivel/);
for(const tab of ['inicio','cursos','esenciales','fundamentos','activos','calculadora','glosario']) {
  const a=new Academy(); a.state.tab=tab;
  assert.equal(a.renderVals().mostrarRegreso,tab!=='inicio',tab);
}
for(const html of [academy,course]) assert.ok(html.includes('href="academia.html#ruta-aprendizaje"'));
assert.match(academy,/los capítulos 2 a 5 ofrecen vídeos y apuntes/);
assert.match(course,/&quot;estadoProgreso&quot;: \{[^}]*&quot;default&quot;: &quot;nuevo&quot;/);
assert.doesNotMatch(course,/Tu progreso se guarda|guardar el capítulo como completado/);
const c=new Course();
assert.equal(c.renderVals().progresoTexto,'0 %');
assert.equal(c.renderVals().pasos.length,5);
assert.match(c.renderVals().notaSeguimiento,/No se guarda el progreso/);
c.renderVals().marcarVideo();
assert.equal(c.renderVals().progresoTexto,'20 %');
assert.equal(new Course().renderVals().progresoTexto,'0 %');
for(let i=1;i<5;i++) {
  c.renderVals().capitulos[i].abrir();
  assert.equal(c.renderVals().esCapituloUno,false);
  assert.equal(c.renderVals().pasos.length,2);
  assert.match(c.renderVals().notaSeguimiento,/sin seguimiento/);
  assert.match(c.renderVals().textoCierre,/No hay actividades marcables/);
}
c.renderVals().capitulos[0].abrir();
assert.equal(c.renderVals().progresoTexto,'0 %');
for(const chapter of c.capitulosData()) assert.ok(existsSync(resolve(root,chapter.pdf)),chapter.pdf);
console.log('Academia 5A-4: recorrido opcional, siete vistas, regreso, cinco PDF existentes y progreso temporal sin marcas ficticias.');

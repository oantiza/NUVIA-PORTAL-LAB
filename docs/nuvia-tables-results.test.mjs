import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(process.argv[2]||'.');
const read=file=>readFileSync(resolve(root,file),'utf8');
const tokens=read('estilos/nuvia-tokens.css'),css=read('estilos/nuvia-components.css'),pages=read('estilos/nuvia-pages.css');
assert.match(tokens,/--nv-table-text:\s*var\(--nv-body-sm\)/);
assert.match(tokens,/--nv-table-reading-width:\s*720px/);
assert.match(tokens,/--nv-result-value:\s*var\(--nv-title-sm\)/);
assert.match(tokens,/--nv-result-value-compact:\s*var\(--nv-body-lg\)/);
assert.match(tokens,/--nv-result-label:\s*var\(--nv-body-sm\)/);
assert.match(pages,/\.jub-results__hero\s*\{[^}]*display: grid;[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(pages,/\.jub-results__hero\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.doesNotMatch(pages,/\.jub-figure__value--xl\s*\{[^}]*var\(--nv-display/);
assert.match(css,/\.nv-table\.nv-sim-tabla :is\(th, td\):nth-child\(3\) \{ text-align: left;/);
assert.match(css,/overscroll-behavior-inline: contain/);
assert.doesNotMatch(pages,/\.markets-lab__col-volume\s*\{\s*display:\s*none/);
assert.match(pages,/\.viv-table__body\s*\{\s*overflow: visible/);
assert.match(pages,/\.viv-table__head\s*\{\s*position: sticky/);
assert.match(pages,/\.viv-table__data\s*\{\s*min-width: var\(--nv-table-reading-width\)/);
assert.match(pages,/\.nv-lab-resumen__valor\s*\{[^}]*font-size: var\(--nv-result-value\)/);
const housing=read('vivienda.html');
assert.match(housing,/class="viv-table__data" role="table"/);
assert.equal((housing.match(/role="columnheader"/g)||[]).length,6);
for(const key of ['year','inicial','capital','intereses','final','tipo']) assert.ok(housing.includes(`{{ f.${key} }}`),'Se conserva el dato '+key);
for(const [file,className] of [['vivienda.html','nv-table-scroll viv-table__scroll'],['mercados.html','markets-lab__table-scroll'],['guia-ahorro.html','gt-tabla-envoltorio'],['guia-sucesiones.html','gt-tabla-envoltorio']]) {
  const html=read(file);
  assert.ok(html.includes(`class="${className}" role="region" tabindex="0"`),`${file}: región accesible`);
  assert.match(html,/con teclado, enfócala y usa las flechas/);
}
const market=read('mercados.html');
assert.match(market,/<caption[^>]*>Cotizaciones ilustrativas/);
assert.equal((market.match(/<th scope="col">/g)||[]).length,7);
for(const key of ['precio','variacion','anual','peso','volumen','sector'])assert.ok(market.includes(`{{ cotizacion.${key} }}`));
for(const file of ['js/nuvia-simulador.js','js/nuvia-constructor.js','js/nuvia-analisis.js']) {
  for(const line of read(file).split('\n').filter(l=>l.includes("el('div', { class: 'nv-sim-tabla-scroll'"))) {
    assert.ok(line.includes("role: 'region', tabindex: '0', 'aria-label':"),`${file}: tabla desplazable nombrada`);
  }
}
const sample=read('sistema-visual.html');
for(const text of ['1.234,56 €','−0,75 %','0,00 €','No disponible'])assert.ok(sample.includes(text));
console.log('Tablas 4B-3: columnas, teclado, semántica, cifras y roles comunes protegidos.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve(process.argv[2]||'.');
const read=f=>readFileSync(resolve(root,f),'utf8');
const academy=read('academia.html'), css=read('estilos/nuvia-pages.css');
const compound=academy.split('class="ac-compound-chart"')[1].split('id="ac-compound-help"')[0];
assert.equal((compound.match(/class="ac-compound-chart__[xy] /g)||[]).length,5);
assert.doesNotMatch(compound,/<text\b|<span[^>]*>\s*<svg/);
for(const binding of ['chartMax','chartMid','chartFin','lineaBruto','lineaAportado','areaBruto','areaAportado']) assert.ok(compound.includes(`{{ ${binding} }}`),binding);
for(const name of ['initialCapital','periodicContribution','contributionFrequency','years','expectedReturn','inflationRate','taxRate','annualIncrease']) {
  assert.ok(academy.includes(`for="ac-${name}"`),`Etiqueta ${name}`);
  assert.ok(academy.includes(`id="ac-${name}" name="${name}"`),`Control ${name}`);
}
assert.match(academy,/class="nv-chart-scroll" role="region" tabindex="0"/);
assert.match(academy,/class="ac-x71" role="region" tabindex="0"/);
assert.match(css,/\.ac-history-chart \{ min-width: 736px;/);
assert.match(css,/\.ac-history-chart text \{ font-size: var\(--nv-label\)/);
assert.match(css,/\.nuvia-design-lab main \.ac-x21 \.gu-title-hero \{ color:var\(--nv-text-on-dark\)/);
assert.doesNotMatch(academy,/Qué elegir: recomendación final|Para la mayoría: acumular con fondos/);
assert.match(academy,/La evolución histórica y la fiscalidad describen aspectos distintos; no determinan qué activo debe elegir una persona/);
const shell=read('nuvia-site-unified.js');
assert.match(shell,/attributeFilter: \['class', 'aria-current'\]/);
assert.ok(shell.includes('[data-nuvia-toggle-group="true"] > button'));
console.log('Revisión 4B-5: gráficos, ocho etiquetas, desplazamiento e interpretación neutral protegidos.');

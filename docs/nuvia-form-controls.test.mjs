import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUTTONS, FIELDS } from '../scripts/check-form-controls.mjs';

const root=resolve(process.argv[2] || '.');
const read=file=>readFileSync(resolve(root,file),'utf8');
const tokens=read('estilos/nuvia-tokens.css');
const components=read('estilos/nuvia-components.css');
const pages=read('estilos/nuvia-pages.css');
const showcase=read('estilos/sistema-visual.css');
assert.match(tokens,/--nv-control-height:\s*44px;/);
assert.match(tokens,/--nv-control-font:\s*var\(--nv-body-sm\);/);
assert.match(tokens,/--nv-control-border:\s*var\(--nv-text-muted\);/);
assert.match(tokens,/--nv-control-radius:\s*var\(--nv-radius-md\);/);
assert.match(components,/min-height:\s*var\(--nv-control-height\)/);
assert.match(components,/\.nv-field__box select:focus-visible\s*\{[^}]*box-shadow:\s*none !important/);
assert.match(components,/\.nv-field__box:has\(\[aria-invalid="true"\]\)/);
assert.match(components,/\.nv-field__box:has\(\[readonly\]\)/);
assert.match(components,/\.nv-field__box:has\(:disabled\)/);
assert.match(components,/\.nv-field__error\s*\{\s*color:\s*var\(--nv-control-error\)/);
for (const selector of BUTTONS.split(', ').slice(1)) {
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const block=pages.match(new RegExp(`${escaped} \\{([^}]*)}`))?.[1];
  assert.ok(block,`${selector}: mantiene su variante`);
  assert.doesNotMatch(block,/font-size|font-weight|border-radius|padding|line-height/,`${selector}: la base procede del componente común`);
}
assert.doesNotMatch(pages,/\.curso-btn-quiz\.is-disabled\s*\{/,'El estado nativo es la única fuente de presentación desactivada');
assert.doesNotMatch(pages.match(/\.gu-cta\s*\{([^}]*)}/)?.[1] || '',/font-size|padding/,'Las acciones de la guía no sobrescriben el botón común');
assert.doesNotMatch(showcase,/\.nv-system\s+(?:button|input|select|:focus-visible)/,'La muestra no sobrescribe los controles reales');
assert.ok(FIELDS.includes('.gt-campo input'));
const html=read('sistema-visual.html');
assert.match(html,/id="sample-invalid"[^>]*aria-invalid="true"[^>]*aria-describedby="sample-error"/);
assert.match(html,/id="sample-readonly"[^>]*readonly/);
assert.match(html,/id="sample-disabled"[^>]*disabled/);
assert.equal((html.match(/<button[^>]*disabled>/g)||[]).length,5);
// La validación real del curso sigue siendo nativa y mantiene su evento.
assert.match(read('curso.html'),/onClick="\{\{ comprobarQuiz \}\}" disabled="\{\{ quizIncompleto \}\}"/);
console.log('Controles 4B-2: medidas, estilos compartidos y estados nativos protegidos.');

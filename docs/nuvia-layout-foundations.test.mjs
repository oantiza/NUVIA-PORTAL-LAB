import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const tokens = read('estilos/nuvia-tokens.css');
const components = read('estilos/nuvia-components.css');
const pages = read('estilos/nuvia-pages.css');
const showcase = read('estilos/sistema-visual.css');
const rules = (css, selector) => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter((m) => m[1].trim() === selector).map((m) => m[2]);

assert.match(tokens, /--nv-container:\s*1240px;/);
assert.match(tokens, /--nv-reading:\s*760px;/);
assert.match(tokens, /--nv-page-gutter:\s*var\(--nv-space-12\);/);
assert.match(tokens, /--nv-space-7:\s*28px;/);
assert.match(tokens, /--nv-section-space-compact:\s*var\(--nv-space-12\);/);
assert.match(tokens, /@media\s*\(max-width:\s*1120px\)[\s\S]*?--nv-page-gutter:\s*var\(--nv-space-7\);/);
assert.match(tokens, /@media\s*\(max-width:\s*1319px\)[\s\S]*?--nv-header-gutter:\s*var\(--nv-space-7\);/);
assert.match(tokens, /--nv-section-space:\s*var\(--nv-space-16\);/);

const container = rules(components, '.nv-container');
assert.equal(container.length, 1, 'Un único ancho general, sin sobrescritura de tableta');
assert.match(container[0], /width:\s*min\(var\(--nv-container\), calc\(100% - 2 \* var\(--nv-page-gutter\)\)\);/);
assert.equal(rules(components, '.nv-section').length, 1, 'La sección normal no debe anular la variante compacta');
assert.match(rules(components, '.nv-section')[0], /padding-block:\s*var\(--nv-section-space\);/);
assert.match(rules(components, '.nv-section--tight')[0], /padding-block:\s*var\(--nv-section-space-compact\);/);
assert.doesNotMatch(showcase, /(?:^|\n)\s*\.nv-(?:container|section(?:--[\w-]+)?|section-heading(?:\s+[^{}]+)?)\s*\{/,
  'El escaparate no duplica la estructura de los componentes');

const hero = rules(pages, '.nuvia-analysis-hero__inner');
assert.equal(hero.length, 1, 'El hero de Cartera comparte las medidas sin otra geometría de tableta');
assert.match(hero[0], /width:\s*min\(var\(--nv-container\), calc\(100% - 2 \* var\(--nv-page-gutter\)\)\);/);
assert.match(hero[0], /padding:\s*var\(--nv-space-16\) 0 var\(--nv-space-8\);/);
assert.match(rules(components, '.nuvia-site-header__inner')[0], /var\(--nv-header-gutter\)/);
assert.match(rules(components, '.nuvia-site-footer__inner')[0], /var\(--nv-page-gutter\)/);

console.log(`Fundamentos de disposición 4A-2: anchos, espacios y reglas únicas verificados en ${root}.`);

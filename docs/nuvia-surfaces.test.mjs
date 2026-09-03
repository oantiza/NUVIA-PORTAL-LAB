import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { VISUAL_ARCHETYPES, SURFACE_CONTRACT, PALETTE_SAMPLES } from '../scripts/nuvia-visual-contract.mjs';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const tokens = read('estilos/nuvia-tokens.css');
const components = read('estilos/nuvia-components.css');
const pages = read('estilos/nuvia-pages.css');
const showcase = read('estilos/sistema-visual.css');
const rules = (css, selector) => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter((m) => m[1].trim() === selector).map((m) => m[2]).join('\n');

const canonicalPages = readdirSync(root).filter((file) => file.endsWith('.html') && !file.startsWith('_')).sort();
assert.deepEqual(Object.keys(VISUAL_ARCHETYPES).sort(), canonicalPages, 'Cada página canónica debe tener arquetipo; documentar nuevas excepciones');
for (const page of canonicalPages) {
  assert.ok(['institucional', 'espacio', 'herramienta', 'editorial'].includes(VISUAL_ARCHETYPES[page].type));
}
for (const [role, palette] of Object.entries({
  'page': 'cloud', 'technical': 'mist', 'editorial': 'paper-light',
  'editorial-strong': 'paper', 'deep': 'navy-900',
})) assert.ok(tokens.includes(`--nv-surface-${role}: var(--nv-${palette});`), `El rol ${role} conserva la paleta aprobada`);
assert.match(tokens, /--nv-surface-institutional:\s*radial-gradient\(circle at 88% 8%, rgba\(124, 154, 68, \.18\), transparent 28rem\),\s*linear-gradient\(135deg, var\(--nv-navy-950\), var\(--nv-navy-800\)\);/);
for (const [css, selector] of [[components, '.nv-hero--institutional'], [pages, '.nuvia-analysis-hero'], [showcase, '.nv-guide-hero']]) {
  assert.match(rules(css, selector), /background:\s*var\(--nv-surface-institutional\);/, `${selector}: usar el fondo institucional común`);
  assert.doesNotMatch(rules(css, selector), /#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i, 'No añadir colores directos en las aperturas consolidadas');
}
assert.equal(rules(pages, '.nuvia-analysis-hero::before'), '', 'No superponer otro degradado a la apertura común');
for (const [css, selector] of [[pages, '.nuvia-route-cartera main'], [pages, '.nuvia-design-lab'], [pages, '.nuvia-design-lab main'], [showcase, '.nv-system']]) {
  assert.match(rules(css, selector), /background:\s*var\(--nv-surface-page\);/, `${selector}: lienzo común`);
}
assert.match(rules(components, '.nv-hero--institutional::after'), /var\(--nv-line-institutional\)/);
assert.match(rules(showcase, '.nv-guide-hero::after'), /var\(--nv-line-institutional\)/);
assert.match(rules(pages, '.lecturas-hero'), /background:\s*var\(--nv-surface\)/);
assert.doesNotMatch(rules(pages, '.lecturas-hero'), /gradient/);
assert.ok(SURFACE_CONTRACT.length >= 10, 'Mantener controles sobre superficies y excepciones');
const samplePage = read('sistema-visual.html');
for (const [name, token, hex] of PALETTE_SAMPLES) {
  const article = samplePage.match(new RegExp(`<article class="nv-swatch nv-swatch--${name}">([\\s\\S]*?)</article>`));
  assert.ok(article?.[1].includes(hex), `Muestra ${name}: conservar etiqueta y clase explícitas`);
  assert.ok(rules(showcase, `.nv-swatch--${name} .nv-swatch__color`).includes(`background: var(--nv-${token});`), `Muestra ${name}: asignar color real`);
  assert.match(tokens, new RegExp(`--nv-${token}:\\s*${hex};`, 'i'), `Muestra ${name}: el color debe coincidir con la etiqueta`);
}
console.log(`Superficies 4A-3: ${canonicalPages.length} páginas clasificadas; roles y excepciones verificados en ${root}.`);

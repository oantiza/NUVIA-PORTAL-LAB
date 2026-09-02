import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
/* Alfa (Entrega 2b): dist/ no lleva company-analysis/ salvo NUVIA_EMPRESAS=1.
   Sin el módulo no hay nada que comprobar; el árbol de trabajo sí lo tiene. */
if (!existsSync(resolve(root, 'company-analysis/index.html'))) {
  console.log('Privacidad del módulo de empresas: company-analysis/ no está en este árbol (alfa: fuera de la publicación); se omite.');
  process.exit(0);
}
const companyIndex = read('company-analysis/index.html');
const hasSource = existsSync(resolve(root, 'company-analysis/src/theme.css'));
const builtAssets = hasSource ? [] : readdirSync(resolve(root, 'company-analysis/assets'));
const theme = hasSource
  ? `${read('company-analysis/src/theme.css')}\n${read('company-analysis/src/theme-b.css')}`
  : builtAssets.filter((file) => file.endsWith('.css')).map((file) => read(`company-analysis/assets/${file}`)).join('\n');
const chartAndSummary = hasSource
  ? `${read('company-analysis/src/components/CandleChart.jsx')}\n${read('company-analysis/src/views/tabs/ResumenTab.jsx')}`
  : builtAssets.filter((file) => file.endsWith('.js')).map((file) => read(`company-analysis/assets/${file}`)).join('\n');
const fonts = read('estilos/nuvia-fonts.css');

assert.doesNotMatch(companyIndex, /fonts\.(?:googleapis|gstatic)\.com/i,
  'El módulo de empresas no debe solicitar tipografías a Google');
if (hasSource) {
  assert.match(companyIndex, /href="\.\.\/estilos\/nuvia-fonts\.css"/,
    'El módulo debe enlazar las familias autoalojadas compartidas');
} else {
  assert.match(theme, /@font-face[^}]+font-family:\s*['"]?Fraunces/s,
    'La compilación debe integrar Fraunces en sus estilos');
  assert.match(theme, /@font-face[^}]+font-family:\s*['"]?Inter/s,
    'La compilación debe integrar Inter en sus estilos');
}
assert.match(fonts, /font-family:\s*'Fraunces'/);
assert.match(fonts, /font-family:\s*'Inter'/);
assert.doesNotMatch(theme + chartAndSummary, /Roboto Flex/,
  'La copia debe usar Inter, disponible localmente, y no una familia remota');
assert.doesNotMatch(chartAndSummary, /translateCompanyDescription|translate\.googleapis/i,
  'La descripción no debe enviarse a un traductor no documentado');
assert.match(chartAndSummary, /Descripción original facilitada por el proveedor/,
  'La interfaz debe identificar de forma honesta el texto original');

console.log(`Módulo de empresas: fuentes locales y descripción sin traducción externa en ${root}.`);

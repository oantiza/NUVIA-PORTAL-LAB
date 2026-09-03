import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const tokens = read('estilos/nuvia-tokens.css');
const pages = read('estilos/nuvia-pages.css');

// No se admiten excepciones fluidas en los dos roles consolidados en 4A-1.
const compactValues = [...tokens.matchAll(/--nv-display-md:\s*([^;]+);/g)].map((m) => m[1]);
assert.deepEqual(compactValues, ['44px', 'var(--nv-title-lg)']);
assert.match(tokens, /@media\s*\(max-width:\s*1319px\)\s*{\s*:root\s*{\s*--nv-display-md:\s*var\(--nv-title-lg\)/);
assert.match(tokens, /@media\s*\(max-width:\s*1120px\)\s*{\s*:root\s*{\s*--nv-section-title:\s*var\(--nv-title-md\)/);
assert.match(tokens, /--nv-section-title:\s*var\(--nv-title-lg\)/);
assert.match(tokens, /--nv-title-lg:\s*36px;/);
assert.match(tokens, /--nv-title-md:\s*28px;/);

const phase = pages.match(/\.nv-lab-fase__cabecera h2\s*{([^}]+)}/)?.[1];
assert.ok(phase, 'Existe la regla de título de fase');
assert.match(phase, /font-size:\s*var\(--nv-section-title\)/);
assert.match(phase, /font-family:\s*var\(--nv-font-serif\)/);
assert.doesNotMatch(phase, /clamp\(|\d(?:\.\d+)?vw/);

// El hero de portada no se redefine para arreglar las páginas interiores.
assert.match(tokens, /--nv-display-lg:\s*clamp\(44px, 4vw, 60px\);/);
assert.match(tokens, /--nv-display-xl:\s*clamp\(52px, 5vw, 72px\);/);
console.log(`Fundamentos tipográficos 4A-1: roles compactos, secciones y portada verificados en ${root}.`);

/* ============================================================================
   NUVIA · OPTIMIZAR LOGOTIPOS
   ----------------------------------------------------------------------------
   Las páginas apuntan por defecto a los PNG máster, que son los que están en el
   repositorio. Funciona siempre, pero el de cabecera pesa 700 KB y se muestra a
   164 px: se está enviando 25 veces más píxel del necesario, en 15 páginas.

   Este script genera dos WebP al triple del tamaño de presentación —nítidos en
   pantallas de alta densidad— y reescribe las referencias.

       node scripts/optimizar-logos.mjs          # optimiza
       node scripts/optimizar-logos.mjs --volver # vuelve a los PNG máster

   Es reversible y no toca los máster: son la fuente.

   Se ejecuta aparte, no dentro del build, porque genera ficheros que hay que
   commitear. Si se olvida, no pasa nada: las páginas siguen usando los PNG.
   ========================================================================== */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(process.cwd());
const BRAND = 'src/assets/brand';
const volver = process.argv.includes('--volver');

/* Cabecera y pie. El ancho es tres veces el de presentación (54 px de alto en
   cabecera → 164 de ancho; 153 px de ancho en pie). */
const PIEZAS = [
  { master: 'nuvia-family-wealth-horizontal-transparent.png', webp: 'logo-horizontal.webp', ancho: 492 },
  { master: 'nuvia-family-wealth-horizontal-reversed.png', webp: 'logo-horizontal-reversed.webp', ancho: 459 },
];

/* Familia en uso: se deduce de las páginas, no se codifica aquí. */
const paginas = (await readdir(root)).filter((f) => f.endsWith('.html'));
const familias = new Set();
for (const p of paginas) {
  const s = await readFile(resolve(root, p), 'utf8');
  for (const m of s.matchAll(new RegExp(`${BRAND}/([a-z0-9-]+)/`, 'g'))) familias.add(m[1]);
}

if (familias.size !== 1) {
  console.error(`\n  Las páginas usan ${familias.size} familias de logotipos distintas: ${[...familias].join(', ')}`);
  console.error('  Unifícalas antes:  node scripts/cambiar-familia-logo.mjs <carpeta>\n');
  process.exit(1);
}

const familia = [...familias][0];
const dir = resolve(root, BRAND, familia);

/* ── Volver a los máster ────────────────────────────────────────────────── */

if (volver) {
  let n = 0;
  for (const p of paginas) {
    const ruta = resolve(root, p);
    let s = await readFile(ruta, 'utf8');
    const antes = s;
    for (const { master, webp } of PIEZAS) s = s.split(`${BRAND}/${familia}/${webp}`).join(`${BRAND}/${familia}/${master}`);
    if (s !== antes) { await writeFile(ruta, s, 'utf8'); n += 1; }
  }
  console.log(`\n  Revertido a los PNG máster en ${n} páginas.`);
  console.log('  Los WebP siguen en disco; bórralos si no los quieres.\n');
  process.exit(0);
}

/* ── Optimizar ──────────────────────────────────────────────────────────── */

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('\n  Falta sharp:  npm i -D sharp\n');
  process.exit(1);
}

const informe = [];
for (const { master, webp, ancho } of PIEZAS) {
  const src = join(dir, master);
  if (!existsSync(src)) {
    console.error(`\n  No existe ${BRAND}/${familia}/${master}\n`);
    process.exit(1);
  }
  const out = join(dir, webp);
  const meta = await sharp(src).metadata();
  const alto = Math.round((meta.height * ancho) / meta.width);
  await sharp(src).resize(ancho, alto).webp({ quality: 88, effort: 6 }).toFile(out);
  informe.push({
    webp,
    antes: (await stat(src)).size,
    despues: (await stat(out)).size,
    dim: `${ancho}×${alto}`,
  });
}

let paginasTocadas = 0;
for (const p of paginas) {
  const ruta = resolve(root, p);
  let s = await readFile(ruta, 'utf8');
  const antes = s;
  for (const { master, webp } of PIEZAS) s = s.split(`${BRAND}/${familia}/${master}`).join(`${BRAND}/${familia}/${webp}`);
  if (s !== antes) { await writeFile(ruta, s, 'utf8'); paginasTocadas += 1; }
}

const ahorro = informe.reduce((a, i) => a + (i.antes - i.despues), 0);

console.log('');
console.log(`  Familia     ${familia}`);
informe.forEach((i) =>
  console.log(`    ${i.webp.padEnd(30)} ${(i.antes / 1024).toFixed(0).padStart(5)} KB → ${(i.despues / 1024).toFixed(1).padStart(6)} KB  (${i.dim})`)
);
console.log(`  Páginas     ${paginasTocadas}`);
console.log(`  Ahorro      ${(ahorro / 1024).toFixed(0)} KB por página · ~${((ahorro * paginasTocadas) / 1048576).toFixed(1)} MB en el sitio`);
console.log('');
console.log('  No olvides commitear los .webp generados.');
console.log('  Comprueba con:  npm run validate');
console.log('');

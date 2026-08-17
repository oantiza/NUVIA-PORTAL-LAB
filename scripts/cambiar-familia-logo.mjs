/* ============================================================================
   NUVIA · CAMBIAR LA FAMILIA DE LOGOTIPOS
   ----------------------------------------------------------------------------
   La familia actual está aprobada pero declarada candidata: puede cambiar.
   Sin esto, sustituirla significa editar a mano las mismas cuatro rutas en 15
   páginas y regenerar dos WebP acordándose de los tamaños. Con esto es:

       node scripts/cambiar-familia-logo.mjs nombre-de-la-carpeta

   Hace tres cosas:
     1. Comprueba que la familia destino existe y trae las piezas necesarias.
     2. Reescribe favicons, apple-touch-icon y los dos logotipos en todas las
        páginas, de golpe: no puede quedarse a medias.
     3. Regenera los WebP optimizados a su tamaño real de presentación.

   Añade --seco para ver qué haría sin tocar nada.
   ========================================================================== */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(process.cwd());
const BRAND = 'src/assets/brand';

/* Piezas que cada familia debe traer para poder sustituir a la actual. */
const REQUERIDAS = [
  'nuvia-favicon-32.png',
  'nuvia-favicon-48.png',
  'nuvia-apple-touch-icon-180.png',
  'nuvia-family-wealth-horizontal-transparent.png',
  'nuvia-family-wealth-horizontal-reversed.png',
];

/* Los dos logotipos derivados y su anchura. Tres veces el tamaño de
   presentación: nítidos en pantallas de alta densidad sin pasarse de peso. */
const DERIVADOS = [
  { origen: 'nuvia-family-wealth-horizontal-transparent.png', salida: 'logo-horizontal.webp', ancho: 474 },
  { origen: 'nuvia-family-wealth-horizontal-reversed.png', salida: 'logo-horizontal-reversed.webp', ancho: 372 },
];

const seco = process.argv.includes('--seco');
const destino = process.argv.find((a) => !a.startsWith('-') && !a.includes('node') && !a.includes('.mjs'));

if (!destino) {
  const familias = (await readdir(resolve(root, BRAND), { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  console.error('\n  Uso: node scripts/cambiar-familia-logo.mjs <carpeta> [--seco]\n');
  console.error('  Familias disponibles en src/assets/brand:');
  familias.forEach((f) => console.error(`    · ${f}`));
  console.error('');
  process.exit(1);
}

const dirDestino = resolve(root, BRAND, destino);
if (!existsSync(dirDestino)) {
  console.error(`\n  No existe ${BRAND}/${destino}\n`);
  process.exit(1);
}

const faltan = REQUERIDAS.filter((f) => !existsSync(join(dirDestino, f)));
if (faltan.length) {
  console.error(`\n  A ${destino} le faltan piezas obligatorias:`);
  faltan.forEach((f) => console.error(`    ✗ ${f}`));
  console.error('\n  No se sustituye nada: una familia incompleta dejaría páginas rotas.\n');
  process.exit(1);
}

/* ── 1 · Reescribir las rutas en todas las páginas ───────────────────────── */

const paginas = (await readdir(root)).filter((f) => f.endsWith('.html'));
let tocadas = 0;
let sustituciones = 0;

for (const pagina of paginas) {
  const ruta = resolve(root, pagina);
  const antes = await readFile(ruta, 'utf8');
  const despues = antes.replace(
    new RegExp(`(${BRAND}/)[a-z0-9-]+(/)`, 'g'),
    (_m, a, b) => `${a}${destino}${b}`
  );
  if (antes === despues) continue;
  sustituciones += (antes.match(new RegExp(`${BRAND}/[a-z0-9-]+/`, 'g')) ?? []).length;
  tocadas += 1;
  if (!seco) await writeFile(ruta, despues, 'utf8');
}

/* ── 2 · Regenerar los WebP optimizados ─────────────────────────────────── */

const informe = [];
if (!seco) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('\n  aviso: sharp no está instalado, no se regeneran los WebP.');
    console.warn('         npm i -D sharp && node scripts/cambiar-familia-logo.mjs ' + destino);
  }
  if (sharp) {
    for (const { origen, salida, ancho } of DERIVADOS) {
      const src = join(dirDestino, origen);
      const out = join(dirDestino, salida);
      const meta = await sharp(src).metadata();
      const alto = Math.round((meta.height * ancho) / meta.width);
      await sharp(src).resize(ancho, alto).webp({ quality: 88, effort: 6 }).toFile(out);
      const pesoOrigen = (await stat(src)).size;
      const pesoSalida = (await stat(out)).size;
      informe.push(
        `    ${salida.padEnd(30)} ${(pesoOrigen / 1024).toFixed(0).padStart(5)} KB → ` +
        `${(pesoSalida / 1024).toFixed(1).padStart(6)} KB  (${ancho}×${alto})`
      );
    }
  }
}

/* ── 3 · Informe ────────────────────────────────────────────────────────── */

console.log('');
console.log(`  Familia         ${destino}`);
console.log(`  Páginas         ${tocadas} de ${paginas.length}${seco ? '  (simulacro, no se ha escrito nada)' : ''}`);
console.log(`  Rutas           ${sustituciones}`);
if (informe.length) {
  console.log('  Derivados');
  informe.forEach((l) => console.log(l));
}
console.log('');
console.log('  Comprueba con:  npm run validate');
console.log('');

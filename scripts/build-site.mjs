/* ============================================================================
   NUVIA · BUILD
   ----------------------------------------------------------------------------
   Genera dist/ con lo que realmente se publica.

   Cambios respecto a la versión anterior:

     · Copia SOLO los assets referenciados. Antes copiaba src/assets entero:
       41,5 MB de los que 29,9 MB no los usaba ninguna página.
     · Publica estilos/ (tokens + componentes + páginas) y js/vendor/ (React
       autoalojado). Deja de publicar nuvia-site-unified.css, tema-claro.css y
       nuvia-design-system.css, que ya no los enlaza nadie.
     · Publica sistema-visual.html, la muestra del sistema de diseño, que antes
       no salía del repositorio.
     · Informa del peso final y deja constancia de lo que ha dejado fuera.
   ========================================================================== */

import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';

const root = resolve(process.cwd());
const output = resolve(root, 'dist');

const paginas = [
  'index.html',
  'academia.html',
  'cartera.html',
  'curso.html',
  'fiscalidad.html',
  'guia-fiscal.html',
  'guia-impuestos.html',
  'guia-planificacion.html',
  'guia-sucesiones.html',
  'guia-ahorro.html',
  'guia-calendario.html',
  'jubilacion.html',
  'lecturas.html',
  'mercados.html',
  'temas.html',
  'vivienda.html',
  'sistema-visual.html',   // se publica con noindex: es la referencia del sistema
];

const ficherosRaiz = [
  'support.js',
  'web2-integration.js',
  'web2-core-bridge.js',
  'nuvia-site-unified.js',        // sigue haciendo falta: rutas y desplegables
  'favicon.svg',
];

/* Directorios que se copian enteros. src/assets ya NO está aquí: se resuelve
   por referencias más abajo. _archivo tampoco: son originales que no se
   publican. */
const directorios = ['estilos', 'js', '_ds', 'core', 'data'];

async function pesoDe(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? await pesoDe(p) : (await stat(p)).size;
  }
  return total;
}

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

async function listarArchivos(dir) {
  const salida = [];
  if (!existsSync(dir)) return salida;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) salida.push(...await listarArchivos(p));
    else salida.push(p);
  }
  return salida;
}

/* ── 1 · Limpiar ────────────────────────────────────────────────────────── */

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

/* ── 2 · Páginas y ficheros de raíz ─────────────────────────────────────── */

for (const f of [...paginas, ...ficherosRaiz]) {
  const origen = resolve(root, f);
  if (!existsSync(origen)) {
    console.warn(`  aviso: ${f} no existe, se omite`);
    continue;
  }
  await cp(origen, resolve(output, f));
}

/* ── 3 · Directorios completos ──────────────────────────────────────────── */

for (const d of directorios) {
  const origen = resolve(root, d);
  if (!existsSync(origen)) continue;
  await cp(origen, resolve(output, d), { recursive: true });
}

/* ── 3b · Módulo de análisis de empresas ────────────────────────────────────
   Se compila aparte (`npm run build:company-analysis`) y se publica bajo
   /company-analysis. cartera.html lo carga en un iframe.
   ─────────────────────────────────────────────────────────────────────────── */

const companyBuild = resolve(root, 'company-analysis', 'build');
if (existsSync(companyBuild)) {
  await cp(companyBuild, resolve(output, 'company-analysis'), { recursive: true });
} else {
  console.warn('  aviso: company-analysis/build no existe. Ejecuta antes');
  console.warn('         npm run build:company-analysis');
}

/* ── 4 · Assets: solo lo referenciado ───────────────────────────────────────
   Se lee todo el texto publicable y se copia únicamente lo que aparece en él.
   Esto es lo que quita ~30 MB de cada despliegue.
   ─────────────────────────────────────────────────────────────────────────── */

let texto = '';
for (const f of [...paginas, ...ficherosRaiz]) {
  const p = resolve(root, f);
  if (existsSync(p)) texto += await readFile(p, 'utf8');
}
for (const d of ['estilos', 'data', 'core']) {
  for (const p of await listarArchivos(resolve(root, d))) {
    if (/\.(css|js|json|html)$/.test(p)) texto += await readFile(p, 'utf8');
  }
}

const todos = await listarArchivos(resolve(root, 'src/assets'));
const usados = [];
const noUsados = [];

for (const p of todos) {
  const rel = relative(root, p).split('\\').join('/');
  const nombre = rel.split('/').pop();
  (texto.includes(rel) || texto.includes(nombre) ? usados : noUsados).push(p);
}

for (const p of usados) {
  const destino = resolve(output, relative(root, p));
  await mkdir(dirname(destino), { recursive: true });
  await cp(p, destino);
}

/* Deja constancia de lo excluido: sin esto, "faltan imágenes" es un misterio. */
let pesoFuera = 0;
for (const p of noUsados) pesoFuera += (await stat(p)).size;

await writeFile(
  resolve(output, 'assets-excluidos.txt'),
  [
    '# Assets presentes en el repositorio pero NO publicados,',
    '# porque ninguna página, hoja de estilos o fichero de datos los referencia.',
    `# ${noUsados.length} ficheros · ${mb(pesoFuera)}`,
    '',
    ...noUsados.map((p) => relative(root, p).split('\\').join('/')).sort(),
  ].join('\n'),
  'utf8'
);

/* ── 5 · Informe ────────────────────────────────────────────────────────── */

const pesoFinal = await pesoDe(output);

console.log('');
console.log(`  Páginas publicadas   ${paginas.length}`);
console.log(`  Assets incluidos     ${usados.length}`);
console.log(`  Assets excluidos     ${noUsados.length} (${mb(pesoFuera)}) → dist/assets-excluidos.txt`);
console.log(`  Peso de dist/        ${mb(pesoFinal)}`);
console.log('');

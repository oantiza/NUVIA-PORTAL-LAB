import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const base = 'https://oantiza.github.io/NUVIA-PORTAL-LAB/';
const pages = new Map([
  ['index.html', 'NUVIA · Entender tu dinero'],
  ['academia.html', 'NUVIA · Academia NUVIA'],
  ['cartera.html', 'NUVIA · Cartera y analítica'],
  ['curso.html', 'NUVIA · Dinero con criterio'],
  ['fiscalidad.html', 'NUVIA · Mis impuestos'],
  ['guia-ahorro.html', 'NUVIA · Fiscalidad del ahorro'],
  ['guia-calendario.html', 'NUVIA · Calendario fiscal'],
  ['guia-fiscal.html', 'NUVIA · Fiscalidad y rescate de la EPSV'],
  ['guia-planificacion.html', 'NUVIA · Planificación de la jubilación'],
  ['guia-sucesiones.html', 'NUVIA · Sucesiones y donaciones'],
  ['jubilacion.html', 'NUVIA · Jubilación'],
  ['lecturas.html', 'NUVIA · Lecturas con Criterio'],
  ['mercados.html', 'NUVIA · Economía y Finanzas'],
  ['que-es-nuvia.html', 'NUVIA · Qué es NUVIA'],
  ['temas.html', 'NUVIA · Patrimonio'],
  ['vivienda.html', 'NUVIA · Vivienda y coste de vida'],
]);

const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(urls.length, pages.size, 'El sitemap contiene una URL por página canónica');
assert.equal(new Set(urls).size, urls.length, 'El sitemap no contiene duplicados');

for (const [file, title] of pages) {
  const html = await readFile(resolve(root, file), 'utf8');
  const canonical = file === 'index.html' ? base : base + file;
  assert.ok(html.includes(`<title>${title}</title>`), `${file}: título público canónico`);
  assert.match(html, /<meta name="description" content="[^"]{50,}">/, `${file}: descripción suficiente`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: canonical oficial`);
  assert.doesNotMatch(html, /<meta\s+name="robots"[^>]*noindex/i, `${file}: la página pública es indexable`);
  assert.ok(urls.includes(canonical), `${file}: incluida en sitemap.xml`);
}

for (const excluded of ['guia-impuestos.html', 'sistema-visual.html', '_plantilla.html']) {
  assert.ok(!urls.some((url) => url.endsWith('/' + excluded)), `${excluded}: excluida del sitemap`);
}

const company = await readFile(resolve(root, 'company-analysis/index.html'), 'utf8');
assert.match(company, /<meta name="robots" content="noindex, nofollow">/,
  'El módulo embebido de empresas no compite como página pública independiente');

const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${base}sitemap.xml`), 'robots.txt declara el sitemap oficial');
await access(resolve(root, 'robots.txt'));
console.log(`Metadatos: ${pages.size} páginas canónicas, sitemap y exclusiones verificados.`);

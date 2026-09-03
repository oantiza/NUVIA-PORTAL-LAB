import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const breadcrumb = (file) => read(file).match(/<nav class="nv-breadcrumb"[\s\S]*?<\/nav>/)?.[0] || '';
const pages = ['vivienda.html', 'fiscalidad.html', 'jubilacion.html', 'guia-ahorro.html', 'guia-calendario.html', 'guia-sucesiones.html', 'guia-fiscal.html', 'guia-planificacion.html'];
for (const file of pages) {
  assert.ok(breadcrumb(file).includes('<a href="temas.html">Patrimonio</a>'), `${file}: espacio padre explícito`);
  assert.doesNotMatch(breadcrumb(file), /Temas clave/);
}
assert.match(breadcrumb('cartera.html'), /href="mercados.html">Economía y Finanzas<\/a>/);
assert.match(breadcrumb('academia.html'), /aria-current="page">Academia NUVIA<\/span>/);
assert.match(breadcrumb('curso.html'), /href="academia.html">Academia NUVIA<\/a>/);
assert.doesNotMatch(breadcrumb('curso.html'), /<details|lecturas.html/);
assert.doesNotMatch(breadcrumb('lecturas.html'), /Academia|academia.html|<details/);
assert.match(breadcrumb('lecturas.html'), /aria-current="page">Lecturas con Criterio<\/span>/);

const readings = read('lecturas.html');
const cards = [...readings.matchAll(/<article class="lecturas-card"([^>]*)>([\s\S]*?)<\/article>/g)];
assert.equal(cards.length, 4, 'Se conservan las cuatro lecturas');
for (const [, attributes, content] of cards) {
  assert.doesNotMatch(attributes, /role="button"|tabindex=/, 'No anidar controles en otro botón');
  const title = content.match(/class="lecturas-card__title">([^<]+)</)[1];
  assert.ok(content.includes(`aria-label="Abrir ficha de ${title}"`), 'El botón identifica el libro');
  assert.match(content, /<button class="lecturas-summary-button"[^>]*aria-haspopup="dialog"[^>]*aria-controls="lecturas-book-dialog"/);
  assert.match(content, /class="lecturas-store-link"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
}
assert.ok(readings.includes("lastCard?.querySelector('.lecturas-summary-button')?.focus()"), 'El cierre devuelve el foco al control nativo');
const css = read('estilos/nuvia-pages.css');
const cover = css.match(/\.lecturas-card__cover\s*\{([^}]*)}/)[1];
assert.match(cover, /grid-template-rows:\s*minmax\(0, 1fr\)/);
assert.match(cover, /grid-template-columns:\s*minmax\(0, 1fr\)/);
const image = css.match(/\.lecturas-card__cover img\s*\{([^}]*)}/)[1];
assert.match(image, /min-height:\s*0/);
assert.match(image, /object-fit:\s*contain/);
console.log('Navegación y Lecturas 4B-1: jerarquía, cuatro fichas nativas e imágenes sin recorte protegidas.');

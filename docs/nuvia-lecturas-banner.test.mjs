import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const asset = 'src/assets/home/lecturas-con-criterio-canva-family-wealth.png';
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const section = home.match(/<section\b[^>]*id="lecturas-con-criterio"[\s\S]*?<\/section>/)?.[0];
assert.ok(section?.includes(`src="${asset}"`), 'El banner debe usar la exportación aprobada de Canva');
assert.ok(section.includes('href="lecturas.html"'), 'El banner conserva el acceso a Lecturas');
assert.ok(section.includes('alt="Lecturas con Criterio. Historias sencillas de interés duradero. Explorar Lecturas. NUVIA Family Wealth."'), 'El texto de la imagen debe tener alternativa accesible');
assert.ok(section.includes('aria-label="Abrir Lecturas con Criterio:'), 'El enlace debe tener un nombre accesible');
assert.ok(section.includes('width="2879" height="546"'), 'Se reserva la proporción del PNG original');
assert.doesNotMatch(section, /class="home-lecturas__(copy|title|subtitle|cta|rule)"/, 'No duplicar el texto que ya incluye Canva');
assert.ok(!section.includes('lecturas-con-criterio-banner-approved.jpeg'), 'No reintroducir la imagen con letras deformadas');
assert.equal(home.split(asset).length - 1, 1, 'La imagen solo aparece una vez');
const page = await readFile(resolve(root, 'lecturas.html'), 'utf8');
assert.ok(!page.includes(asset), 'No sustituir la cabecera interior de Lecturas');
assert.match(page, /class="nv-hero nv-hero--institutional lecturas-hero"/, 'Se conserva la cabecera azul');
const bytes = await readFile(resolve(root, asset));
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '18f5a90078e319c791d2c2e53b1f61c7917840cf1d51355d713b4508690b3496',
  'Debe usarse el PNG íntegro aprobado con FAMILY WEALTH');
assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
assert.equal(bytes.readUInt32BE(16), 2879, 'No sustituir el export por una miniatura');
assert.equal(bytes.readUInt32BE(20), 546);
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
const imageRule = css.match(/\.home-lecturas__art\s*\{([^}]+)\}/)?.[1];
assert.ok(imageRule?.includes('height: auto'), 'La imagen no debe recortarse ni deformarse');
assert.ok(!imageRule.includes('filter:'), 'No se alteran los colores del archivo original');
console.log(`OK Banner Lecturas: Canva FAMILY WEALTH íntegro, enlace y proporción en ${root}`);

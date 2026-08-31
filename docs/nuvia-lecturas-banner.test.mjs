import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const asset = 'src/assets/home/lecturas-con-criterio-fondo-compacto-family-wealth.webp';
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const section = home.match(/<section\b[^>]*id="lecturas-con-criterio"[\s\S]*?<\/section>/)?.[0];
assert.ok(section?.includes(`src="${asset}"`), 'El banner debe usar el paisaje limpio de Lecturas');
assert.ok(section.includes('href="lecturas.html"'), 'El banner conserva el acceso a Lecturas');
assert.ok(section.includes('alt="" aria-hidden="true"'), 'El fondo es decorativo; el título es texto accesible');
assert.ok(section.includes('aria-label="Abrir Lecturas con Criterio:'), 'El enlace debe tener un nombre accesible');
assert.ok(section.includes('width="2120" height="404"'), 'Se reserva la proporción del paisaje');
assert.match(section, /class="home-lecturas__title">Lecturas con Criterio<\/span>/, 'El título debe ser texto HTML nítido');
assert.match(section, /class="home-lecturas__subtitle">Historias de interés duradero<\/span>/, 'El lema debe ser texto HTML correcto');
assert.match(section, /class="home-lecturas__cta">Explorar lecturas <span/, 'El acceso debe decir Explorar lecturas');
assert.equal((section.match(/class="home-lecturas__copy"/g) ?? []).length, 1, 'Solo una capa de texto');
assert.ok(!section.includes('lecturas-con-criterio-banner-approved.jpeg'), 'No reintroducir la imagen con letras deformadas');
assert.equal(home.split(asset).length - 1, 1, 'La imagen solo aparece una vez');
const page = await readFile(resolve(root, 'lecturas.html'), 'utf8');
assert.ok(!page.includes(asset), 'No sustituir la cabecera interior de Lecturas');
assert.match(page, /class="nv-hero nv-hero--institutional lecturas-hero"/, 'Se conserva la cabecera azul');
const bytes = await readFile(resolve(root, asset));
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '1f5b0c628e45a1ded050a2ae4b840b30de8fc4d058cb0ecbf2110f70f002ccd1',
  'Debe usarse el paisaje limpio, sin letras defectuosas');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
const imageRule = css.match(/\.home-lecturas__art\s*\{([^}]+)\}/)?.[1];
assert.ok(imageRule?.includes('height: auto'), 'La imagen no debe recortarse ni deformarse');
assert.ok(!imageRule.includes('filter:'), 'No se alteran los colores del archivo original');
console.log(`OK Banner Lecturas: fondo limpio, textos nítidos, enlace y proporción en ${root}`);

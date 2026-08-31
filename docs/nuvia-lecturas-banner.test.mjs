import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const asset = 'src/assets/home/lecturas-con-criterio-banner-approved.jpeg';
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const section = home.match(/<section\b[^>]*id="lecturas-con-criterio"[\s\S]*?<\/section>/)?.[0];
assert.ok(section?.includes(`src="${asset}"`), 'El banner aprobado debe aparecer en Lecturas de Inicio');
assert.ok(section.includes('href="lecturas.html"'), 'El banner conserva el acceso a Lecturas');
assert.ok(section.includes('alt="Lecturas con Criterio.'), 'La imagen conserva un texto alternativo');
assert.ok(section.includes('width="4724" height="896"'), 'Se reserva la proporción original');
assert.ok(!section.includes('home-lecturas__copy'), 'No deben superponerse títulos ni botones duplicados');
assert.equal(home.split(asset).length - 1, 1, 'La imagen solo aparece una vez');
const page = await readFile(resolve(root, 'lecturas.html'), 'utf8');
assert.ok(!page.includes(asset), 'No sustituir la cabecera interior de Lecturas');
assert.match(page, /class="nv-hero nv-hero--institutional lecturas-hero"/, 'Se conserva la cabecera azul');
const bytes = await readFile(resolve(root, asset));
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  'ada84aad9f73b3bb913c87bd40ccf5d52fad9ce1e7d4f427e3d8f5599cba5e1a',
  'Debe usarse la imagen exacta aportada por el usuario');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
const imageRule = css.match(/\.home-lecturas__art\s*\{([^}]+)\}/)?.[1];
assert.ok(imageRule?.includes('height: auto'), 'La imagen no debe recortarse ni deformarse');
assert.ok(!imageRule.includes('filter:'), 'No se alteran los colores del archivo original');
console.log(`OK Banner Lecturas: ubicación, enlace, proporción e imagen íntegra en ${root}`);

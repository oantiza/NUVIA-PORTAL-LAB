import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Se ejecuta sobre el código fuente y sobre dist para evitar que el banner
// vuelva a quedarse solo en el proyecto de Remotion.
const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const asset = 'src/assets/education/nuvia-academy/nuvia-academy-banner-approved-v2.jpeg';
const expectedHash = '58405702998e4e388432c83f75d55ff6ecbeaf920bf40b51075c863e9018200b';
const html = await readFile(resolve(root, 'academia.html'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const bytes = await readFile(resolve(root, asset));
const header = html.match(/<section\b[^>]*id="academy"[\s\S]*?<\/section>/)?.[0];
assert.ok(header, 'Academia debe conservar su cabecera y ancla');
assert.ok(header.includes('id="academy-title"'), 'Debe conservarse el título accesible');
assert.ok(header.includes('{{ pestanas }}') && header.includes('{{ p.abrir }}'), 'Las pestañas deben seguir conectadas');
assert.ok(header.includes('nv-hero--institutional'), 'Academia debe conservar la cabecera azul');
assert.ok(!html.includes(asset), 'El banner no debe estar en la cabecera ni en otras vistas de Academia');
assert.ok(!html.includes('data-academy-intro'), 'No se debe reintroducir la entradilla');
const homeAcademy = home.match(/<section\b[^>]*id="academia"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeAcademy?.includes(`src="${asset}"`), 'El banner debe estar en el bloque Academia de Inicio');
assert.equal(home.split(asset).length - 1, 1, 'El banner debe aparecer una sola vez');
assert.ok(homeAcademy.includes('width="3552" height="1184"'), 'Debe reservarse la proporción 3:1');
assert.ok(homeAcademy.includes('alt="Academy. Saber es patrimonio.'), 'La imagen necesita texto alternativo');
assert.ok(homeAcademy.includes('href="academia.html"'), 'El banner debe seguir enlazando a Academia');
const homeHero = home.match(/<section\b[^>]*id="inicio"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeHero?.includes('hero-family-finance-compact.webp'), 'El hero fotográfico principal no debe sustituirse');
assert.ok(!homeHero.includes(asset), 'El banner no debe ocupar el hero principal');

// Inicio comparte el fondo azul grisáceo; las tarjetas mantienen sus superficies.
for (const id of ['que-es-nuvia', 'mercados', 'noticia', 'patrimonio',
  'familia-salud', 'academia', 'lecturas-con-criterio']) {
  const tag = home.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>`))?.[0];
  assert.ok(tag?.includes('nv-section'), `${id}: sección de Inicio conservada`);
  assert.doesNotMatch(tag, /nv-section--(?:white|paper|technical|deep)|style=/,
    `${id}: no reintroducir fondos alternos en Inicio`);
}
const tokens = await readFile(resolve(root, 'estilos/nuvia-tokens.css'), 'utf8');
assert.match(tokens, /--nv-bg:\s*var\(--nv-cloud\)/, 'Se conserva el tono de fondo elegido');

const patrimonio = home.match(/<section\b[^>]*id="patrimonio"[\s\S]*?<\/section>/)?.[0];
assert.ok(patrimonio?.includes('id="titulo-patrimonio"'), 'Patrimonio conserva su título accesible');
assert.ok(patrimonio.includes('class="home-patrimonio"'), 'Patrimonio usa el banner fotográfico');
assert.ok(!patrimonio.includes('class="home-topic"'), 'Las tarjetas anteriores no se duplican');
assert.equal((patrimonio.match(/class="home-patrimonio__link"/g) ?? []).length, 3,
  'El banner contiene los tres accesos');
for (const page of ['vivienda', 'fiscalidad', 'jubilacion']) {
  assert.ok(patrimonio.includes(`href="${page}.html"`), `Patrimonio conserva el acceso a ${page}`);
}
const patrimonioAsset = 'src/assets/home/patrimonio-family-home-20260831.jpeg';
assert.ok(patrimonio.includes(`src="${patrimonioAsset}"`), 'Se usa la fotografía aportada');
assert.equal(createHash('sha256').update(await readFile(resolve(root, patrimonioAsset))).digest('hex'),
  '266084da5a5427255a715ef8070df66e00054f21dc795a17bc6beba6cc82be75',
  'La fotografía se conserva sin editar');

assert.ok(!home.includes('data-macro-id='), 'La franja de indicadores no debe aparecer en Inicio');
assert.ok(home.includes('home-macro__cta') && home.includes('home-daily'), 'Se conservan el acceso a Mercados y la noticia del día');
const markets = await readFile(resolve(root, 'mercados.html'), 'utf8');
for (const id of ['inflation-spain', 'euribor', 'ecb-rate', 'gdp-spain', 'unemployment-spain']) {
  assert.ok(markets.includes(`data-macro-id="${id}"`), `Mercados conserva ${id}`);
}

for (const page of ['academia', 'curso', 'fiscalidad', 'guia-ahorro', 'guia-calendario',
  'guia-fiscal', 'guia-planificacion', 'guia-sucesiones', 'jubilacion',
  'mercados', 'temas', 'vivienda']) {
  const pageHtml = await readFile(resolve(root, `${page}.html`), 'utf8');
  assert.match(pageHtml, /<section[^>]*class="[^"]*nv-hero--institutional/, `${page}: cabecera institucional azul`);
}
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
assert.match(home, /class="nv-eyebrow home-intro__eyebrow">El proyecto<\/p>/,
  'El proyecto usa el rótulo de color homogéneo');
assert.match(css, /\.home-intro__eyebrow\s*\{\s*color:\s*var\(--nv-text-muted\);\s*\}/,
  'El proyecto y su filete comparten el color de los siguientes rótulos');
assert.ok(!css.includes('.nuvia-design-lab :is(.nv-hero--institutional, .nv-hero--editorial)'),
  'No se deben reintroducir las sobreescrituras claras de las cabeceras');
assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash,
  'El archivo publicado debe coincidir exactamente con la imagen aprobada');
console.log(`OK Inicio y cabeceras: banner Academy, indicadores, navegación e imagen original en ${root}`);

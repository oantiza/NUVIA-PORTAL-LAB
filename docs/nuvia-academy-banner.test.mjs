import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
const tokens = await readFile(resolve(root, 'estilos/nuvia-tokens.css'), 'utf8');

const section = (id) => home.match(new RegExp(`<section\\b[^>]*id="${id}"[\\s\\S]*?<\\/section>`))?.[0];
const exactAccess = [
  ['mercados', 'mercados.html', 'Accede a Economía y Finanzas'],
  ['patrimonio', 'temas.html?topic=planificacion-patrimonial', 'Accede a Patrimonio'],
  ['familia-salud', 'temas.html?topic=bienestar', 'Accede a Familia, Salud y Bienestar'],
  ['academia', 'academia.html', 'Entrar'],
];

for (const [id, href, label] of exactAccess) {
  const block = section(id);
  assert.ok(block, `${id}: la sección existe`);
  assert.equal((block.match(/<a\b/g) ?? []).length, 1, `${id}: un único acceso`);
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const arrow = label === 'Entrar' ? '' : ' <span aria-hidden="true">→<\\/span>';
  assert.match(block, new RegExp(`<a\\b[^>]*href="${escapedHref}"[^>]*>${escapedLabel}${arrow}<\\/a>`),
    `${id}: texto y destino exactos`);
}

const readingsAccess = section('lecturas-con-criterio');
assert.ok(readingsAccess, 'lecturas-con-criterio: la sección existe');
assert.equal((readingsAccess.match(/<a\b/g) ?? []).length, 1, 'lecturas-con-criterio: un único acceso');
assert.match(readingsAccess, /<a class="home-lecturas" href="lecturas\.html" aria-label="Entrar">/,
  'lecturas-con-criterio: texto accesible y destino exactos');

const hero = section('inicio');
assert.ok(hero?.includes('class="nv-hero nv-hero--photo home-hero"'), 'El hero conserva su componente');
assert.ok(hero.includes('Información clara,<br>decisiones con propósito.'), 'El hero conserva el titular');
assert.ok(hero.includes('{{ barraPilares }}') && hero.includes('home-pillars'), 'El hero conserva la franja configurable');
assert.match(css.slice(css.indexOf('HOME 2026')), /\.home-hero__art\s*\{\s*object-position:\s*78% 50%;\s*\}/,
  'El único ajuste del hero es su encuadre');
const heroVeilRule = css.match(/\.home-hero__veil\s*\{\s*background:([\s\S]*?)\n\}/)?.[1];
assert.ok(heroVeilRule?.includes('linear-gradient(0deg, rgba(28, 58, 94, .55) 0%'),
  'El degradado inferior del hero termina en azul oscuro');
assert.ok(!/linear-gradient\(0deg,\s*var\(--nv-(?:bg|cloud)\)/.test(heroVeilRule),
  'El hero no conserva una franja clara en su base');

const project = section('que-es-nuvia');
assert.ok(project?.includes('class="nv-section home26-project-section"'),
  'El proyecto elimina la franja vacía posterior al hero');
assert.ok(project?.includes('class="home26-project"'), 'El proyecto usa la composición a dos columnas');
assert.equal((project.match(/class="home26-project__body"/g) ?? []).length, 1, 'Una sola zona de lectura');
assert.equal((project.match(/class="home26-project__item"/g) ?? []).length, 3, 'Los tres valores permanecen');

for (const [id, variant] of [
  ['mercados', 'home26-plate--bleed'],
  ['patrimonio', 'home26-plate--light home26-plate--reverse'],
  ['familia-salud', 'home26-plate'],
]) assert.ok(section(id)?.includes(variant), `${id}: variante editorial asignada`);
assert.ok(section('familia-salud').includes('home26-plate__badge">En preparación'), 'Bienestar declara su estado');
assert.doesNotMatch(home, /home26-plate__caption|imagen decorativa/i, 'Se retiran los pies de lámina repetidos');
assert.doesNotMatch(section('mercados'), /Lámina 01/i, 'Economía elimina la referencia de lámina');

const summary = section('sumario');
assert.ok(summary?.includes('nv-section--technical'), 'El sumario usa la superficie técnica');
assert.equal((summary.match(/class="home26-index__item"/g) ?? []).length, 8, 'El sumario contiene ocho materias');
for (const href of [
  'vivienda.html', 'mercados.html', 'jubilacion.html', 'cartera.html',
  'fiscalidad.html', 'temas.html?topic=bienestar',
  'temas.html?topic=planificacion-patrimonial', 'academia.html?tab=esenciales',
]) assert.ok(summary.includes(`href="${href}"`), `Sumario conserva ${href}`);

const academy = section('academia');
assert.doesNotMatch(academy, /nv-section-heading|titulo-academia|<h2\b/,
  'Academia elimina la cabecera exterior y su espacio');
assert.match(academy, /class="nv-eyebrow home26-showcase__label">Formación<\/p>/,
  'Academia recupera únicamente su rótulo compacto');
const academyBanner = academy.match(/<div class="home-academia">[\s\S]*?<\/div>/)?.[0];
assert.ok(academyBanner, 'Academia conserva su banner');
assert.doesNotMatch(academyBanner, /<h[1-6]\b|<p\b/, 'Academia no superpone título ni descripción');
assert.match(academyBanner, /class="home-feature-access home-academia__cta"[^>]*>Entrar<\/a>/,
  'Academia conserva Entrar');

const readings = section('lecturas-con-criterio');
assert.doesNotMatch(readings, /nv-section-heading|titulo-lecturas|<h2\b/,
  'Lecturas elimina la cabecera exterior y su espacio');
assert.match(readings, /class="nv-eyebrow home26-showcase__label">Sección editorial<\/p>/,
  'Lecturas recupera únicamente su rótulo compacto');
const readingsBanner = readings.match(/<a class="home-lecturas"[\s\S]*?<\/a>/)?.[0];
assert.ok(readingsBanner, 'Lecturas conserva su banner');
assert.doesNotMatch(readingsBanner, /<h[1-6]\b|<p\b/, 'Lecturas no superpone título ni descripción');
assert.match(readingsBanner, /href="lecturas\.html" aria-label="Entrar"/,
  'Lecturas conserva Entrar como nombre accesible del banner');
assert.doesNotMatch(readingsBanner, /home-feature-access|home-lecturas__cta/,
  'Lecturas no duplica el acceso integrado visualmente en el banner');

assert.doesNotMatch(home, /\sstyle=/i, 'Inicio no contiene estilos en línea');
assert.doesNotMatch(home, /data-macro-id=|data-daily-news|data-daily-impact|id="noticia"/,
  'Inicio no incorpora cifras ni indicadores dinámicos');
assert.doesNotMatch(home, /nv-section--(?:white|paper)/, 'Inicio no usa fondos blancos o papel alternos');
assert.match(css, /\.home26-plate--light\s*\{\s*background:\s*var\(--nv-cloud\);\s*\}/,
  'La lámina clara conserva el fondo nube');
assert.match(css, /\.home26-band\s*\{[\s\S]*?background:\s*var\(--nv-mist\);/,
  'Las franjas usan el fondo técnico');
assert.match(tokens, /--nv-bg:\s*var\(--nv-mist\)/, 'El fondo global usa la bruma azul solicitada');

const homeCss = css.slice(css.indexOf('HOME 2026'));
assert.ok(homeCss.length > 0, 'El bloque HOME 2026 está al final de la hoja');
assert.match(homeCss, /\.home26-project-section\s*\{\s*padding-top:\s*var\(--nv-space-12\);\s*\}/,
  'El proyecto conserva un espacio moderado respecto al hero');
assert.doesNotMatch(css, /linear-gradient\(0deg,\s*var\(--nv-bg\)/,
  'El hero no crea una franja clara en su fundido inferior');
assert.doesNotMatch(homeCss, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'HOME 2026 solo usa colores mediante tokens');
assert.match(homeCss, /@media\s*\(max-width:\s*1024px\)/, 'Existe el ajuste de tablet a 1024 px');
assert.doesNotMatch(homeCss, /@media\s*\(max-width:\s*(?:[0-9]{1,3})px\)/, 'No se crea una versión móvil');
for (const id of ['mercados', 'patrimonio', 'familia-salud']) {
  assert.match(section(id), /class="[^"]*nv-container[^"]*home26-plate/,
    `${id}: comparte el contenedor fijo y centrado de Academia y Lecturas`);
}
assert.equal((home.match(/class="nv-container home26-plate-label-wrap"/g) || []).length, 3,
  'Los tres rótulos se sitúan fuera y encima de sus respectivas láminas');
for (const label of ['Resumen estratégico', 'Decisiones de fondo', 'Vida y equilibrio']) {
  assert.match(home, new RegExp(`class="nv-container home26-plate-label-wrap">\\s*<p class="nv-eyebrow home26-plate-label">${label}<`),
    `El rótulo exterior muestra ${label}`);
}
assert.doesNotMatch(home, /home26-(?:plate-label|showcase__label)[^>]*>[^<]*·\s*0[1-5]</,
  'Los cinco encabezados editoriales no muestran numeración');
assert.match(homeCss, /\.home26-plate-label-wrap\s*\{[\s\S]*?margin-top:\s*calc\(var\(--nv-space-12\) \+ var\(--nv-space-1\)\);[\s\S]*?margin-bottom:\s*var\(--nv-space-6\);/,
  'Los tres bloques conservan una separación ligeramente más amplia y homogénea');
assert.match(homeCss, /\.home26-plate__cta:focus-visible\s*\{[\s\S]*?outline:/, 'Las tres láminas tienen foco visible');
assert.match(homeCss, /\.home26-plate__cta\s*\{[\s\S]*?border:\s*1px solid var\(--nv-green-300\);[\s\S]*?border-radius:\s*var\(--nv-radius-pill\);/,
  'Los tres accesos recuperan la forma redondeada y el filete verde');
assert.match(css, /\.home-feature-access:focus-visible\s*\{[\s\S]*?outline:/, 'Academia y Lecturas tienen foco visible');
assert.match(css, /\.home-feature-access\s*\{[\s\S]*?min-height:\s*44px;[\s\S]*?font-size:\s*var\(--nv-body\);/,
  'Entrar de Academia conserva 16 px y área de 44 px');
assert.match(css, /\.home-lecturas:focus-visible\s*\{[\s\S]*?outline:/,
  'El banner completo de Lecturas tiene foco visible');
assert.match(css, /\.home-academia\s*\{[\s\S]*?border-radius:\s*0;/,
  'Academia usa esquinas cuadradas');
assert.match(css, /\.home-lecturas\s*\{[\s\S]*?border-radius:\s*0;/,
  'Lecturas usa esquinas cuadradas');
assert.match(homeCss, /\.home26-showcase__label\s*\{[\s\S]*?color:\s*var\(--nv-text-link\);/,
  'Los dos rótulos usan el verde accesible del sistema');
assert.match(homeCss, /\.home26-showcase__label\s*\{\s*margin:\s*0 0 var\(--nv-space-5\);/,
  'Los dos rótulos conservan un poco más de aire respecto a sus banners');
assert.match(homeCss, /\.home26-showcase\s*\{\s*padding-top:\s*var\(--nv-space-12\);\s*\}/,
  'Los rótulos aprovechan el espacio superior de los banners');
assert.match(home, /class="home26-band home26-band--compact"[\s\S]*?id="lecturas-con-criterio"/,
  'El espacio entre Academia y Lecturas usa la franja compacta');
assert.match(homeCss, /\.home26-band--compact\s*\{\s*height:\s*var\(--nv-space-6\);\s*\}/,
  'La distancia entre Academia y Lecturas se reduce unos cuarenta píxeles');

const definedTokens = new Set([...tokens.matchAll(/--([a-z0-9-]+)\s*:/gi)].map((match) => `--${match[1]}`));
for (const match of homeCss.matchAll(/var\((--[a-z0-9-]+)/gi)) {
  assert.ok(definedTokens.has(match[1]), `Token existente: ${match[1]}`);
}

const assets = new Map([
  ['src/assets/home/hero-family-finance-compact.webp', 'f143b8f10ec4326b462a481599a8ea26fd3fe5738f535f11cab7aa4ef7c33aa7'],
  ['src/assets/markets/secondary-news/wall-street-records.jpg', '4b0a025883086aab03b5f2c105b79f38dbacd1a23a7ae518260f6c83032f5cce'],
  ['src/assets/home/patrimonio-family-home-young-family-natural-20260901.png', '05af952813c6f00ce8f8afa416d24060b8a1a7571f721f3391b7307f65577103'],
  ['src/assets/home/wellbeing-life-balance-banner-v2.webp', '7af9d0ab2c2b0af67f9b7bc3665a40d3028bf8c87f6f4d88571ebd73f1ef6941'],
  ['src/assets/education/nuvia-academy/nuvia-academy-banner-2026.jpeg', 'b3a1f474a2cdf4fa2e082b051d2da1721c9507b3a4a57c137adfaa2b440c2912'],
  ['src/assets/home/lecturas-con-criterio-banner-2026.png', 'd6b51984f6cdf724f7e7351dde748c5cd16af4ee57d3e55bc3e39371bde85003'],
]);
for (const [asset, expected] of assets) {
  assert.ok(home.includes(`src="${asset}"`), `Inicio conserva ${asset}`);
  const hash = createHash('sha256').update(await readFile(resolve(root, asset))).digest('hex');
  assert.equal(hash, expected, `${asset}: hash intacto`);
}

const academyPage = await readFile(resolve(root, 'academia.html'), 'utf8');
const academyHero = academyPage.match(/<section\b[^>]*id="academy"[\s\S]*?<\/section>/)?.[0];
assert.ok(academyHero?.includes('nv-hero--institutional'), 'Academia interior conserva su cabecera');
assert.ok(academyHero.includes('{{ pestanas }}') && academyHero.includes('{{ p.abrir }}'), 'Las pestañas de Academia siguen conectadas');
assert.ok(!academyPage.includes('data-academy-intro'), 'No reaparece la entradilla de Academia');

const markets = await readFile(resolve(root, 'mercados.html'), 'utf8');
for (const id of ['inflation-spain', 'euribor', 'ecb-rate', 'gdp-spain', 'unemployment-spain']) {
  assert.ok(markets.includes(`data-macro-id="${id}"`), `Mercados conserva ${id}`);
}

console.log(`OK Home 2026: composición, accesos, fondos, foco e imágenes en ${root}`);

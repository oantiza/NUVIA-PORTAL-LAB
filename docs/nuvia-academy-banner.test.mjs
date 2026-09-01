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
  ['lecturas-con-criterio', 'lecturas.html', 'Entrar'],
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

const hero = section('inicio');
assert.ok(hero?.includes('class="nv-hero nv-hero--photo home-hero"'), 'El hero conserva su componente');
assert.ok(hero.includes('Información clara,<br>decisiones con propósito.'), 'El hero conserva el titular');
assert.ok(hero.includes('{{ barraPilares }}') && hero.includes('home-pillars'), 'El hero conserva la franja configurable');
assert.match(css.slice(css.indexOf('HOME 2026')), /\.home-hero__art\s*\{\s*object-position:\s*78% 50%;\s*\}/,
  'El único ajuste del hero es su encuadre');

const project = section('que-es-nuvia');
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

const summary = section('sumario');
assert.ok(summary?.includes('nv-section--technical'), 'El sumario usa la superficie técnica');
assert.equal((summary.match(/class="home26-index__item"/g) ?? []).length, 8, 'El sumario contiene ocho materias');
for (const href of [
  'vivienda.html', 'mercados.html', 'jubilacion.html', 'cartera.html',
  'fiscalidad.html', 'temas.html?topic=bienestar',
  'temas.html?topic=planificacion-patrimonial', 'academia.html?tab=esenciales',
]) assert.ok(summary.includes(`href="${href}"`), `Sumario conserva ${href}`);

const academy = section('academia');
const academyBanner = academy.match(/<div class="home-academia">[\s\S]*?<\/div>/)?.[0];
assert.ok(academyBanner, 'Academia conserva su banner');
assert.doesNotMatch(academyBanner, /<h[1-6]\b|<p\b/, 'Academia no superpone título ni descripción');
assert.match(academyBanner, /class="home-feature-access home-academia__cta"[^>]*>Entrar<\/a>/,
  'Academia conserva Entrar');

const readings = section('lecturas-con-criterio');
const readingsBanner = readings.match(/<div class="home-lecturas">[\s\S]*?<\/div>/)?.[0];
assert.ok(readingsBanner, 'Lecturas conserva su banner');
assert.doesNotMatch(readingsBanner, /<h[1-6]\b|<p\b/, 'Lecturas no superpone título ni descripción');
assert.match(readingsBanner, /class="home-feature-access home-lecturas__cta"[^>]*>Entrar<\/a>/,
  'Lecturas conserva Entrar');

assert.doesNotMatch(home, /\sstyle=/i, 'Inicio no contiene estilos en línea');
assert.doesNotMatch(home, /data-macro-id=|data-daily-news|data-daily-impact|id="noticia"/,
  'Inicio no incorpora cifras ni indicadores dinámicos');
assert.doesNotMatch(home, /nv-section--(?:white|paper)/, 'Inicio no usa fondos blancos o papel alternos');
assert.match(css, /\.home26-plate--light\s*\{\s*background:\s*var\(--nv-cloud\);\s*\}/,
  'La lámina clara conserva el fondo nube');
assert.match(css, /\.home26-band\s*\{[\s\S]*?background:\s*var\(--nv-mist\);/,
  'Las franjas usan el fondo técnico');
assert.match(tokens, /--nv-bg:\s*var\(--nv-cloud\)/, 'El fondo global sigue siendo nube');

const homeCss = css.slice(css.indexOf('HOME 2026'));
assert.ok(homeCss.length > 0, 'El bloque HOME 2026 está al final de la hoja');
assert.doesNotMatch(homeCss, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'HOME 2026 solo usa colores mediante tokens');
assert.match(homeCss, /@media\s*\(max-width:\s*1024px\)/, 'Existe el ajuste de tablet a 1024 px');
assert.doesNotMatch(homeCss, /@media\s*\(max-width:\s*(?:[0-9]{1,3})px\)/, 'No se crea una versión móvil');
for (const id of ['mercados', 'patrimonio', 'familia-salud']) {
  assert.match(section(id), /class="[^"]*nv-container[^"]*home26-plate/,
    `${id}: comparte el contenedor fijo y centrado de Academia y Lecturas`);
}
assert.match(homeCss, /\.home26-plate \+ \.home26-plate\s*\{\s*margin-top:\s*var\(--nv-space-5\);\s*\}/,
  'Las tres láminas quedan separadas por aproximadamente medio centímetro');
assert.match(homeCss, /\.home26-plate__cta:focus-visible\s*\{[\s\S]*?outline:/, 'Las tres láminas tienen foco visible');
assert.match(css, /\.home-feature-access:focus-visible\s*\{[\s\S]*?outline:/, 'Academia y Lecturas tienen foco visible');
assert.match(css, /\.home-feature-access\s*\{[\s\S]*?min-height:\s*44px;[\s\S]*?font-size:\s*var\(--nv-body\);/,
  'Entrar conserva 16 px y área de 44 px');

const definedTokens = new Set([...tokens.matchAll(/--([a-z0-9-]+)\s*:/gi)].map((match) => `--${match[1]}`));
for (const match of homeCss.matchAll(/var\((--[a-z0-9-]+)/gi)) {
  assert.ok(definedTokens.has(match[1]), `Token existente: ${match[1]}`);
}

const assets = new Map([
  ['src/assets/home/hero-family-finance-compact.webp', 'f143b8f10ec4326b462a481599a8ea26fd3fe5738f535f11cab7aa4ef7c33aa7'],
  ['src/assets/markets/secondary-news/wall-street-records.jpg', '4b0a025883086aab03b5f2c105b79f38dbacd1a23a7ae518260f6c83032f5cce'],
  ['src/assets/home/patrimonio-family-home-20260831.jpeg', '266084da5a5427255a715ef8070df66e00054f21dc795a17bc6beba6cc82be75'],
  ['src/assets/home/wellbeing-life-balance-banner-v2.webp', '7af9d0ab2c2b0af67f9b7bc3665a40d3028bf8c87f6f4d88571ebd73f1ef6941'],
  ['src/assets/education/nuvia-academy/nuvia-academy-banner-approved-v2.jpeg', '58405702998e4e388432c83f75d55ff6ecbeaf920bf40b51075c863e9018200b'],
  ['src/assets/home/lecturas-con-criterio-fondo-compacto-family-wealth.webp', '1f5b0c628e45a1ded050a2ae4b840b30de8fc4d058cb0ecbf2110f70f002ccd1'],
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

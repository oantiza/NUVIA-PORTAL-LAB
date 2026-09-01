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
assert.match(homeAcademy, /<h2 id="titulo-academia">ACADEMIA<\/h2>/, 'El título exterior usa el nombre solicitado');
assert.match(homeAcademy, /class="home-feature-access home-academia__cta"[^>]*>Entrar<\/a>/,
  'Academia usa el acceso editorial discreto');
assert.equal((homeAcademy.match(/<a\b/g) ?? []).length, 1, 'Academia tiene un único enlace');
assert.doesNotMatch(homeAcademy, /home-section-banner__pill|Entrar en la Academia|Accede a Academia/,
  'Se retiran los formatos de acceso anteriores');
const homeHero = home.match(/<section\b[^>]*id="inicio"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeHero?.includes('hero-family-finance-compact.webp'), 'El hero fotográfico principal no debe sustituirse');
assert.ok(!homeHero.includes(asset), 'El banner no debe ocupar el hero principal');
assert.doesNotMatch(homeHero, /nv-hero__actions|Conoce el proyecto|Ver los mercados hoy/,
  'El hero no reintroduce los dos botones retirados ni su contenedor');

// Inicio comparte el fondo azul grisáceo; las tarjetas mantienen sus superficies.
for (const id of ['que-es-nuvia', 'mercados', 'patrimonio',
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
assert.ok(patrimonio.includes('home-section-banner--editorial'), 'Patrimonio usa la variante editorial');
assert.ok(!patrimonio.includes('class="home-topic"'), 'Las tarjetas anteriores no se duplican');
assert.equal((patrimonio.match(/class="home-section-banner__pill"/g) ?? []).length, 1,
  'Patrimonio contiene un único acceso de sección');
assert.match(patrimonio, /href="temas\.html\?topic=planificacion-patrimonial"[^>]*>Accede a Patrimonio/,
  'Patrimonio conduce a su espacio general con el texto unificado');
const patrimonioAsset = 'src/assets/home/patrimonio-family-home-20260831.jpeg';
assert.ok(patrimonio.includes(`src="${patrimonioAsset}"`), 'Se usa la fotografía aportada');
assert.equal(createHash('sha256').update(await readFile(resolve(root, patrimonioAsset))).digest('hex'),
  '266084da5a5427255a715ef8070df66e00054f21dc795a17bc6beba6cc82be75',
  'La fotografía se conserva sin editar');

const bienestar = home.match(/<section\b[^>]*id="familia-salud"[\s\S]*?<\/section>/)?.[0];
assert.ok(bienestar?.includes('home-section-banner--editorial'), 'Bienestar usa la variante editorial elegida');
const economia = home.match(/<section\b[^>]*id="mercados"[\s\S]*?<\/section>/)?.[0];
assert.ok(economia?.includes('home-section-banner--editorial'), 'Economía comparte el banner editorial');
assert.equal((economia.match(/<a\b/g) ?? []).length, 1, 'Economía tiene un único acceso');
assert.ok(economia.includes('href="mercados.html"'), 'Economía conserva su destino');
assert.match(economia, /class="home-section-banner__pill">Accede a Economía y Finanzas/,
  'Economía usa el texto de acceso unificado');
const economiaAsset = 'src/assets/markets/secondary-news/wall-street-records.jpg';
assert.ok(economia.includes(`src="${economiaAsset}"`), 'Economía usa la fotografía local elegida');
assert.equal(createHash('sha256').update(await readFile(resolve(root, economiaAsset))).digest('hex'),
  '4b0a025883086aab03b5f2c105b79f38dbacd1a23a7ae518260f6c83032f5cce', 'Fotografía de Economía intacta');
for (const [section, summary] of [
  [economia, 'Inflación, tipos de interés, empleo y actividad económica. Información para entender el contexto de los mercados y su relación con la economía familiar.'],
  [patrimonio, 'Vivienda, presupuesto familiar, impuestos y jubilación. Conceptos y herramientas para comprender cómo se organiza el patrimonio a lo largo de la vida.'],
  [bienestar, 'Vida familiar, salud y equilibrio cotidiano. Un espacio en preparación para explorar los hábitos, las relaciones y la conciliación entre trabajo y descanso.'],
]) {
  const exterior = section.slice(0, section.indexOf('<article'));
  assert.ok(exterior.includes(`<p>${summary}</p>`), 'Resumen exterior junto al título, sin estilos distintos de Academia');
  assert.match(exterior, /<div class="nv-section-heading">\s*<div>[\s\S]*?<\/div>\s*<p>[^<]+<\/p>\s*<\/div>/,
    'El resumen comparte la estructura de la cabecera de Academia');
  assert.equal(section.split(summary).length - 1, 1, 'Resumen exterior sin duplicar');
}
for (const [section, titleId, eyebrow] of [
  [economia, 'titulo-mercados', 'Resumen estratégico'],
  [patrimonio, 'titulo-patrimonio', 'Decisiones de fondo'],
  [bienestar, 'titulo-familia-salud', 'En preparación'],
]) {
  const banner = section.match(/<article\b[\s\S]*?<\/article>/)?.[0];
  assert.ok(section.indexOf(`id="${titleId}"`) < section.indexOf('<article'), 'Título fuera y antes del banner');
  assert.ok(section.includes(eyebrow) && !banner.includes(eyebrow), 'Rótulo fuera del banner');
  assert.ok(!banner.includes('<h2'), 'El banner no repite el título de sección');
  assert.ok(banner.includes('home-section-banner__copy'), 'La descripción permanece dentro');
}
assert.ok(!bienestar.includes('home-section-banner__tags'), 'Bienestar no muestra las etiquetas retiradas');
assert.equal((bienestar.match(/<a\b/g) ?? []).length, 1, 'Bienestar conserva solo un enlace');
assert.match(bienestar, /class="home-section-banner__pill">Accede a Familia, Salud y Bienestar/,
  'Bienestar usa el texto de acceso unificado');
assert.ok(bienestar.includes('href="temas.html?topic=bienestar"'), 'Se conserva el acceso a temas de bienestar');
const bienestarAsset = 'src/assets/home/wellbeing-life-balance-banner-v2.webp';
assert.ok(bienestar.includes(`src="${bienestarAsset}"`), 'Se conserva la imagen de bienestar');
assert.equal(createHash('sha256').update(await readFile(resolve(root, bienestarAsset))).digest('hex'),
  '7af9d0ab2c2b0af67f9b7bc3665a40d3028bf8c87f6f4d88571ebd73f1ef6941', 'Imagen de bienestar intacta');

assert.ok(!home.includes('data-macro-id='), 'La franja de indicadores no debe aparecer en Inicio');
assert.ok(economia.includes('home-section-banner__pill'), 'El acceso a Mercados usa el mismo botón que los otros banners');
assert.doesNotMatch(home, /id="noticia"|home-daily|data-daily-news|data-daily-impact/,
  'La noticia del día y sus ganchos dinámicos no reaparecen en Inicio');
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
const editorialVeil = css.match(/\.home-section-banner--editorial::before\s*\{([^}]+)\}/)?.[1];
assert.ok(editorialVeil, 'El aclarado se limita a los banners editoriales');
assert.match(editorialVeil, /--nv-navy-950\) 82%, transparent\) 0%/, 'Se conserva el contraste izquierdo');
assert.match(editorialVeil, /--nv-navy-900\) 72%, transparent\) 40%/, 'La transición comienza antes de la mitad');
assert.match(editorialVeil, /--nv-navy-950\) 38%, transparent\) 68%/, 'El degradado libera la zona fotográfica');
assert.match(editorialVeil, /--nv-navy-950\) 16%, transparent\) 100%/, 'El extremo derecho deja ver claramente la fotografía');
assert.match(css, /\.home-section-banner__pill\s*\{[\s\S]*?min-height:\s*54px;[\s\S]*?font-size:\s*var\(--nv-body\);/,
  'Los tres accesos comparten el formato amplio de la referencia');
assert.match(css, /\.home-section-banner--editorial \.home-section-banner__title\s*\{\s*font-family: var\(--nv-font-sans\);\s*font-size: clamp\(30px, 2\.6vw, 36px\);/,
  'Títulos editoriales en sans serif, de 30 a 36 px');
assert.match(home, /class="nv-eyebrow home-intro__eyebrow">El proyecto<\/p>/,
  'El proyecto usa el rótulo de color homogéneo');
assert.match(css, /\.home-intro__eyebrow\s*\{\s*color:\s*var\(--nv-text-muted\);\s*\}/,
  'El proyecto y su filete comparten el color de los siguientes rótulos');
assert.ok(!css.includes('.nuvia-design-lab :is(.nv-hero--institutional, .nv-hero--editorial)'),
  'No se deben reintroducir las sobreescrituras claras de las cabeceras');
assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash,
  'El archivo publicado debe coincidir exactamente con la imagen aprobada');
console.log(`OK Inicio y cabeceras: banner Academy, indicadores, navegación e imagen original en ${root}`);

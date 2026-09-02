import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const homeAsset = 'src/assets/home/lecturas-con-criterio-banner-sin-boton.webp';
const heroAsset = 'src/assets/home/lecturas-con-criterio-fondo-compacto-family-wealth.webp';
const retiredAsset = 'src/assets/home/lecturas-con-criterio-canva-family-wealth.png';
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const section = home.match(/<section\b[^>]*id="lecturas-con-criterio"[\s\S]*?<\/section>/)?.[0];
assert.ok(section?.includes(`src="${homeAsset}"`), 'Inicio usa el banner aportado por el usuario');
assert.ok(section.includes('href="lecturas.html"'), 'El banner conserva el acceso a Lecturas');
assert.doesNotMatch(section, /nv-section-heading|titulo-lecturas|<h2\b/,
  'El banner sustituye la cabecera exterior y elimina su espacio');
assert.match(section, /<a class="home-lecturas" href="lecturas\.html" aria-label="Entrar en Lecturas con Criterio">/,
  'El banner completo es el acceso editorial con nombre accesible Entrar');
assert.equal((section.match(/<a\b/g) ?? []).length, 1, 'Lecturas tiene un único enlace');
assert.match(section, /class="home-feature-access home-lecturas__cta">Entrar<\/span>/,
  'Lecturas comparte el acceso HTML de Academia');
assert.ok(section.includes('alt="Lecturas con Criterio. Historias sencillas de interés duradero."'),
  'La imagen enlazada tiene alternativa informativa');
assert.ok(section.includes('width="2120" height="404"'), 'Se reserva la proporción exacta del banner sin botón');
assert.ok(!section.includes('lecturas-con-criterio-banner-approved.jpeg'), 'No reintroducir la imagen con letras deformadas');
assert.ok(!section.includes(retiredAsset), 'No reintroducir el PNG con el antiguo botón dibujado');
assert.equal(home.split(homeAsset).length - 1, 1, 'La imagen solo aparece una vez');
const homeBannerBytes = await readFile(resolve(root, homeAsset));
assert.equal(createHash('sha256').update(homeBannerBytes).digest('hex'),
  '59768e8b2f5a5ac19001c4a3d6cf9cd7b4e2568c7b5758f03eb0015a81dda02a',
  'El banner aportado debe conservarse sin editar');
const page = await readFile(resolve(root, 'lecturas.html'), 'utf8');
assert.ok(page.includes('estilos/nuvia-pages.css?v=lecturas-sin-degradado-20260901'), 'La cabecera debe cargar los estilos nuevos sin reutilizar la caché anterior');
const hero = page.match(/<section\b[^>]*id="lecturas"[\s\S]*?<\/section>/)?.[0];
assert.ok(hero?.includes(`src="${heroAsset}"`), 'La cabecera interior usa el paisaje limpio sin botón');
assert.equal(page.split(heroAsset).length - 1, 1, 'Una sola imagen de paisaje en la página de Lecturas');
assert.ok(!hero.includes(retiredAsset), 'No reintroducir el botón integrado del PNG anterior');
assert.doesNotMatch(hero, /Explorar Lecturas|href="#seleccion-lecturas"|<button\b/i, 'No hay CTA ni enlace de banner en la cabecera');
assert.ok(hero.includes('class="lecturas-hero__banner"'), 'El fondo ocupa el ancho de la página, fuera del contenedor');
assert.ok(!hero.includes('nv-hero--institutional'), 'La petición sustituye el fondo azul solo en Lecturas');
assert.ok(!page.includes('lecturas-con-criterio-escena-compacta.webp'), 'Se retira la escena anterior con Wealth Management');
assert.match(hero, /<h1 id="lecturas-title">Lecturas con Criterio<\/h1>/, 'Un título HTML visible y accesible con escala controlable');
assert.ok(hero.includes('<p>Historias sencillas de interés duradero</p>'), 'Se conserva el lema sin botón');
assert.equal((page.match(/<h1\b/g) ?? []).length, 1, 'Un único título principal');
assert.ok(hero.includes('aria-labelledby="lecturas-title"'));
assert.ok(hero.includes('aria-label="Ruta de navegación"'), 'Se conserva la navegación de contexto');
assert.ok(page.includes('id="seleccion-lecturas"'), 'Se conserva el ancla de los libros para enlaces existentes');
assert.equal((page.match(/class="lecturas-card"/g) ?? []).length, 4, 'Las cuatro fichas permanecen intactas');
assert.ok(hero.includes('width="2120" height="404" fetchpriority="high"'), 'Paisaje original prioritario y con proporción reservada');
assert.ok(hero.includes('class="nv-container lecturas-hero__content"'), 'Solo el texto se alinea con el contenedor común');
const heroBytes = await readFile(resolve(root, heroAsset));
assert.equal(createHash('sha256').update(heroBytes).digest('hex'),
  '1f5b0c628e45a1ded050a2ae4b840b30de8fc4d058cb0ecbf2110f70f002ccd1',
  'El paisaje Family Wealth debe estar limpio, sin el CTA rasterizado');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
assert.match(css, /\.lecturas-hero h1\s*\{[\s\S]*?font-size:\s*var\(--nv-display-md\);/,
  'Solo el título interior de Lecturas usa una escala ligeramente menor');
const imageRule = css.match(/\.home-lecturas__art\s*\{([^}]+)\}/)?.[1];
assert.ok(imageRule?.includes('height: auto'), 'La imagen no debe recortarse ni deformarse');
assert.ok(!imageRule.includes('filter:'), 'No se alteran los colores del archivo original');
const homeBannerRule = css.match(/\.home-lecturas\s*\{([^}]+)\}/)?.[1];
assert.ok(homeBannerRule?.includes('aspect-ratio: 2879 / 546'), 'La caja conserva la proporción panorámica del banner');
assert.match(css, /\.home-lecturas:focus-visible\s*\{[\s\S]*?outline:/, 'El banner enlazado tiene foco visible');
const heroRule = css.match(/\.lecturas-hero\s*\{([^}]+)\}/)?.[1];
assert.ok(heroRule?.includes('background: var(--nv-surface)'), 'La cabecera usa la superficie común');
const tokens = await readFile(resolve(root, 'estilos/nuvia-tokens.css'), 'utf8');
assert.match(tokens, /--nv-surface:\s*var\(--nv-white\);/, 'La superficie de Lecturas sigue siendo blanca');
assert.match(tokens, /--nv-white:\s*#ffffff;/i, 'No alterar el blanco aprobado');
const heroImageRule = css.match(/\.lecturas-hero__art\s*\{([^}]+)\}/)?.[1];
assert.ok(heroImageRule?.includes('width: auto') && heroImageRule.includes('height: 100%'), 'El paisaje mantiene su proporción sin escalar con el ancho de pantalla');
const bannerRule = css.match(/\.lecturas-hero__banner\s*\{([^}]+)\}/)?.[1];
assert.ok(bannerRule?.includes('width: 100%') && bannerRule.includes('height: 235px'), 'Fondo a ancho completo sin aumentar los 235 px de altura');
assert.ok(!bannerRule.includes('max-width:'), 'No limitar el fondo al ancho del contenido');
const titleRule = css.match(/\.lecturas-hero h1\s*\{([^}]+)\}/)?.[1];
assert.ok(titleRule?.includes('font-size: var(--nv-display-md)'), 'El título interior usa la escala reducida solicitada');
const booksRule = css.match(/\.lecturas-hero \+ #seleccion-lecturas\s*\{([^}]+)\}/)?.[1];
assert.ok(booksRule?.includes('padding-top: var(--nv-space-6)'), 'Los libros aparecen cerca de la cabecera compacta');
assert.ok(!css.includes('.lecturas-hero__scene'), 'No quedan reglas que reduzcan u oculten la antigua escena en tablet');
assert.doesNotMatch(css, /\.lecturas-hero__banner::after\s*\{/, 'El banner interior no lleva velo degradado');
assert.doesNotMatch(css, /\.lecturas-hero__art\s*\{[^}]*mask-image:/s, 'La imagen interior no lleva máscara degradada');
console.log(`OK Lecturas: acceso unificado en Inicio y cabecera interior compacta en ${root}`);

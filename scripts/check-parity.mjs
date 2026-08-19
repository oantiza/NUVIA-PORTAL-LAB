import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const required = [
  'core/index.html',
  'core/reports/reports_manifest.json',
  'core/downloads/nuvia-academy/capitulo-01-pon-orden-a-tu-dinero.pdf',
  'data/daily-content.json',
  'company-analysis/index.html',
  'company-analysis/src/App.jsx',
  'web2-integration.js',
  'web2-core-bridge.js',
];

await Promise.all(required.map((entry) => access(resolve(root, entry))));
const integration = await readFile(resolve(root, 'web2-integration.js'), 'utf8');
const web2Home = await readFile(resolve(root, 'index.html'), 'utf8');
const marketsPage = await readFile(resolve(root, 'mercados.html'), 'utf8');
const portfolioPage = await readFile(resolve(root, 'cartera.html'), 'utf8');
const topicsPage = await readFile(resolve(root, 'temas.html'), 'utf8');
const taxPage = await readFile(resolve(root, 'fiscalidad.html'), 'utf8');
const taxGuidePage = await readFile(resolve(root, 'guia-impuestos.html'), 'utf8');
const readingsPage = await readFile(resolve(root, 'lecturas.html'), 'utf8');
const coreBridge = await readFile(resolve(root, 'web2-core-bridge.js'), 'utf8');
const expectedRoutes = [
  'portfolioPreview',
  'mis-impuestos',
  'vivienda-coste-vida',
  'retirement-simulator',
  'retirement-fiscal-guide',
  'retirement-planning-guide',
  'educationGuide',
  'lecturasConCriterio',
  'daily-report',
  'archive',
  'weekly',
];
const expectedCourseVideos = [
  '8bkXWpsZ1YI',
  'WtoHCXogKiw',
  '-afhqOyS-UQ',
  'yRWuM64CAe8',
  'idMdu9nTRmM',
];
for (const route of expectedRoutes) {
  if (!integration.includes(route)) throw new Error(`Falta la ruta funcional: ${route}`);
}

const expectedHomeLinks = [
  'href="vivienda.html"',
  'href="fiscalidad.html"',
  'href="mercados.html?vista=archivo"',
  'href="lecturas.html"',
];
for (const link of expectedHomeLinks) {
  if (!web2Home.includes(link)) throw new Error(`Falta el acceso de portada: ${link}`);
}
/* Acepta `defer` y la ruta con o sin `./`: la portada ahora la carga diferida,
   que no bloquea el parseo. Lo que importa es que la integración esté. */
if (!/<script[^>]*\ssrc="\.?\/?web2-integration\.js(?:\?[^"]+)?"[^>]*><\/script>/.test(web2Home)) {
  throw new Error('La portada no carga la integración de contenido diario y mercados');
}
if (!/<a href="mercados\.html"[^>]*>Mercados<\/a>/.test(web2Home)) {
  throw new Error('El acceso principal de Mercados no abre la página de mercados');
}
if (/<a href="#noticia"[^>]*>Noticia del día<\/a>/.test(web2Home)) {
  throw new Error('La navegación principal todavía muestra el acceso Noticia del día');
}
if (!integration.includes('image.src = news.imageUrl')) {
  throw new Error('La integración diaria no actualiza la imagen editorial');
}
for (const cover of [
  'la-psicologia-del-dinero.jpg',
  'el-inversor-inteligente.webp',
  'un-paso-por-delante-wall-street.webp',
  'pensar-rapido-pensar-despacio.webp',
]) {
  const occurrences = readingsPage.split(`src/assets/lecturas/${cover}`).length - 1;
  if (occurrences !== 1) {
    throw new Error(`El libro debe aparecer exactamente una vez en Lecturas con Criterio: ${cover}`);
  }
}
/* La clase pasó de .lecturas-feature-card a .lecturas-card en la migración.
   La comprobación es la misma: cuatro fichas, una por libro. */
if ((readingsPage.match(/class="lecturas-card"/g) || []).length !== 4) {
  throw new Error('Lecturas con Criterio debe mostrar un libro en cada uno de sus cuatro bloques');
}
if (/onclick=["']location\.href/i.test(web2Home)) {
  throw new Error('La portada contiene botones de navegación que el renderizador no conserva');
}

/* Paso 18: la vista de cartera dejó el iframe del núcleo y pasó a ser una
   sección propia servida por la página, con el simulador de js/nuvia-simulador.js. */
if (!portfolioPage.includes('id="laboratorio"')) {
  throw new Error('La página de cartera no contiene la sección propia del laboratorio');
}
if (!portfolioPage.includes('js/nuvia-simulador.js')) {
  throw new Error('La página de cartera no monta el simulador propio');
}
if (portfolioPage.includes('portfolioPreview=1')) {
  throw new Error('La página de cartera no debe seguir incrustando la suite del núcleo');
}
if (!portfolioPage.includes('id="simulador"')) {
  throw new Error('Falta el punto de montaje del simulador con su aviso sin JavaScript');
}
if (!/data-src=["']company-analysis\/index\.html(?:\?[^"']*)?["']/.test(portfolioPage)) {
  throw new Error('La vista Análisis y valoración de empresas no integra la copia independiente de NUVIA');
}
/* Antes esto se comprobaba en temas.html, pero vivía dentro de un
   <sc-if value="{{ false }}"> que nunca se renderizaba: el contrato validaba
   código muerto. Ahora se comprueba en la navegación común de la portada,
   que es donde el acceso existe de verdad. */
if (!web2Home.includes('cartera.html?vista=companies')) {
  throw new Error('Falta el acceso a la vista de análisis de empresas');
}
if (!/href="cartera\.html"/.test(web2Home)) {
  throw new Error('Falta el acceso a la vista de cartera');
}
for (const [title, guide] of [
  ['Calendario fiscal', 'calendar'],
  ['Fiscalidad del ahorro', 'savings'],
  ['Sucesiones y donaciones', 'inheritance'],
]) {
  if (!taxPage.includes(`'${title}': '${guide}'`)) {
    throw new Error(`Falta el acceso a la guía fiscal: ${guide}`);
  }
  if (!taxGuidePage.includes(`${guide}: {`)) {
    throw new Error(`Falta la presentación Web 2 de la guía fiscal: ${guide}`);
  }
}
if (!taxGuidePage.includes("'&embedded=web2'")) {
  throw new Error('La presentación de guías fiscales no integra el contenido funcional del núcleo');
}
if (!coreBridge.includes("params.get('embedded') === 'web2'") || !coreBridge.includes("type: 'resize'") || !coreBridge.includes("params.get('suiteTab')")) {
  throw new Error('El puente de la suite analítica no prepara el modo integrado o su altura dinámica');
}

/* Diseño de portada.

   Antes esto comprobaba cadenas de estilo inline literales —'background:#1C3A5E',
   'font-size:56px; line-height:1.08', 'padding:100px 48px 48px'— como contrato.
   El efecto real era el contrario del buscado: el guardarraíl impedía sacar los
   estilos del markup, así que la portada no podía sistematizarse sin romper la
   validación.

   Ahora se comprueba lo que de verdad importa: que la portada siga usando el
   héroe fotográfico del sistema, su titular y el banner editorial. El aspecto
   lo garantizan los tokens; esto garantiza la estructura. */
const marcadoresPortada = [
  'nv-hero nv-hero--photo home-hero',
  'Información clara,<br>decisiones con propósito.',
  'class="home-lecturas"',
  'data-daily-news="title"',
];
for (const marcador of marcadoresPortada) {
  if (!web2Home.includes(marcador)) {
    throw new Error(`La portada ya no respeta su estructura de diseño: ${marcador}`);
  }
}

const daily = JSON.parse(await readFile(resolve(root, 'data/daily-content.json'), 'utf8'));
if (!daily.dailyEconomicNews?.title || !Array.isArray(daily.dailyMacroIndicators) || daily.dailyMacroIndicators.length < 5) {
  throw new Error('El contenido diario sincronizado está incompleto');
}
for (const indicator of daily.dailyMacroIndicators) {
  if (!marketsPage.includes(`data-macro-id="${indicator.id}"`)) {
    throw new Error(`Mercados no incluye una tarjeta para el indicador: ${indicator.id}`);
  }
}

const manifest = JSON.parse(await readFile(resolve(root, 'core/reports/reports_manifest.json'), 'utf8'));
if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error('El archivo de informes diarios está vacío');
}
await Promise.all(manifest.map(({ filename }) => access(resolve(root, 'core/reports', filename))));

const coreIndex = await readFile(resolve(root, 'core/index.html'), 'utf8');
if (!coreIndex.includes('../web2-core-bridge.js')) {
  throw new Error('El núcleo no incluye el enlace de regreso a Web 2');
}
const suiteLoaderMatch = coreIndex.match(/PortfolioAnalyticsSuite-Web2-([a-f0-9]{8,})\.js/i);
if (!suiteLoaderMatch) {
  throw new Error('El núcleo no activa un cargador versionado de la navegación Web 2');
}

const assetFiles = await readdir(resolve(root, 'core/assets'));
for (const prefix of ['PortfolioAnalyticsSuite-', 'TechnicalAnalysisModule-', 'FundamentalAnalysisModule-']) {
  if (!assetFiles.some((filename) => filename.startsWith(prefix) && filename.endsWith('.js'))) {
    throw new Error(`Falta el módulo analítico real: ${prefix}`);
  }
}
await access(resolve(root, 'core/assets', suiteLoaderMatch[0]));
/* Paso 18: la página de cartera ya no escucha suite-tab-change (no incrusta la
   suite del núcleo); el puente del núcleo lo conserva para otros anfitriones. */
if (!coreBridge.includes('suite-tab-change')) {
  throw new Error('El puente del núcleo perdió la sincronización de pestañas de la suite');
}
const courseBundles = await Promise.all(
  assetFiles
    .filter((filename) => filename.startsWith('FinancialCourseChapterOne-') && filename.endsWith('.js'))
    .map((filename) => readFile(resolve(root, 'core/assets', filename), 'utf8')),
);
const courseBundle = courseBundles.join('\n');
for (const videoId of expectedCourseVideos) {
  if (!courseBundle.includes(videoId)) throw new Error(`Falta el vídeo de Academia Nuvia: ${videoId}`);
}

console.log(`Paridad funcional preparada: ${required.length} recursos, ${manifest.length} informes, ${expectedRoutes.length} rutas críticas, ${expectedHomeLinks.length} accesos y ${expectedCourseVideos.length} vídeos.`);

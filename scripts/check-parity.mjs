import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const required = [
  'core/index.html',
  'core/reports/reports_manifest.json',
  'core/downloads/nuvia-academy/capitulo-01-pon-orden-a-tu-dinero.pdf',
  'data/daily-content.json',
  'web2-integration.js',
  'web2-core-bridge.js',
];

await Promise.all(required.map((entry) => access(resolve(root, entry))));
const integration = await readFile(resolve(root, 'web2-integration.js'), 'utf8');
const web2Home = await readFile(resolve(root, 'index.html'), 'utf8');
const portfolioPage = await readFile(resolve(root, 'cartera.html'), 'utf8');
const topicsPage = await readFile(resolve(root, 'temas.html'), 'utf8');
const taxPage = await readFile(resolve(root, 'fiscalidad.html'), 'utf8');
const taxGuidePage = await readFile(resolve(root, 'guia-impuestos.html'), 'utf8');
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
  'href="temas.html?topic=ahorro-inversion"',
  'href="vivienda.html"',
  'href="fiscalidad.html"',
  'href="mercados.html?vista=archivo"',
  'href="lecturas.html"',
];
for (const link of expectedHomeLinks) {
  if (!web2Home.includes(link)) throw new Error(`Falta el acceso de portada: ${link}`);
}
if (/onclick=["']location\.href/i.test(web2Home)) {
  throw new Error('La portada contiene botones de navegación que el renderizador no conserva');
}

if (!portfolioPage.includes("suiteSrc: 'core/index.html?portfolioPreview=1&embedded=web2&web2Suite=5&suiteTab=' + vista")) {
  throw new Error('La página de cartera no integra la suite analítica real del núcleo');
}
for (const suiteView of ['portfolio', 'technical', 'fundamental']) {
  if (!topicsPage.includes(`cartera.html?vista=${suiteView}`)) {
    throw new Error(`Falta el acceso a la vista analítica: ${suiteView}`);
  }
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

const cloudDesignMarkers = [
  'background:#1C3A5E',
  'padding:100px 48px 48px; min-height:460px',
  'font-size:56px; line-height:1.08',
  'Información clara,<br>decisiones con propósito.',
  'background:linear-gradient(95deg, rgba(28,58,94,.94)',
  'aspect-ratio:2879/546',
];
for (const marker of cloudDesignMarkers) {
  if (!web2Home.includes(marker)) throw new Error(`La portada ya no respeta el diseño Cloud Design: ${marker}`);
}

const daily = JSON.parse(await readFile(resolve(root, 'data/daily-content.json'), 'utf8'));
if (!daily.dailyEconomicNews?.title || !Array.isArray(daily.dailyMacroIndicators) || daily.dailyMacroIndicators.length < 5) {
  throw new Error('El contenido diario sincronizado está incompleto');
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
if (!coreIndex.includes('PortfolioAnalyticsSuite-Web2.js')) {
  throw new Error('El núcleo no activa la navegación Web 2 de la suite analítica');
}

const assetFiles = await readdir(resolve(root, 'core/assets'));
for (const prefix of ['PortfolioAnalyticsSuite-', 'TechnicalAnalysisModule-', 'FundamentalAnalysisModule-']) {
  if (!assetFiles.some((filename) => filename.startsWith(prefix) && filename.endsWith('.js'))) {
    throw new Error(`Falta el módulo analítico real: ${prefix}`);
  }
}
await access(resolve(root, 'core/assets/PortfolioAnalyticsSuite-Web2.js'));
const courseBundles = await Promise.all(
  assetFiles
    .filter((filename) => filename.startsWith('FinancialCourseChapterOne-') && filename.endsWith('.js'))
    .map((filename) => readFile(resolve(root, 'core/assets', filename), 'utf8')),
);
const courseBundle = courseBundles.join('\n');
for (const videoId of expectedCourseVideos) {
  if (!courseBundle.includes(videoId)) throw new Error(`Falta el vídeo de Academy: ${videoId}`);
}

console.log(`Paridad funcional preparada: ${required.length} recursos, ${manifest.length} informes, ${expectedRoutes.length} rutas críticas, ${expectedHomeLinks.length} accesos y ${expectedCourseVideos.length} vídeos.`);

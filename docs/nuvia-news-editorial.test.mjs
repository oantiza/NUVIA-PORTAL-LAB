import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { eligibleNews } from '../scripts/news-editorial.mjs';

const root = resolve(process.argv[2] || '.');
const read = (path) => readFile(resolve(root, path), 'utf8');
const payload = JSON.parse(await read('data/daily-content.json'));
const integration = await read('web2-integration.js');
const markets = await read('mercados.html');
const styles = await read('estilos/nuvia-pages.css');
const updater = await read('scripts/update-daily-news.mjs').catch(() => '');

const allowedSources = new Set(['EL PAÍS Economía', 'Expansión']);
const iso = (value, label) => {
  assert.equal(typeof value, 'string', `${label} debe existir en formato ISO`);
  const date = new Date(value);
  assert.ok(!Number.isNaN(date.valueOf()), `${label} no es una fecha ISO válida`);
  assert.ok(date.valueOf() <= Date.now() + 15 * 60_000, `${label} no puede estar en el futuro`);
  return date;
};
const validateItem = (item, label) => {
  assert.ok(item?.title?.trim(), `${label}: falta título`);
  assert.ok(item?.summary?.trim(), `${label}: falta resumen`);
  assert.ok(item?.category?.trim(), `${label}: falta categoría`);
  assert.ok(allowedSources.has(item?.sourceName), `${label}: fuente no inventariada`);
  assert.match(item?.sourceUrl || '', /^https:\/\//, `${label}: la URL de fuente debe usar HTTPS`);
  assert.equal(eligibleNews({ title: item.title, sourceName: item.sourceName, url: item.sourceUrl,
    publishedAt: new Date(item.sourcePublishedAtIso || item.publishedAtIso) }, new Date(item.sourcePublishedAtIso || item.publishedAtIso)), true,
    `${label}: fuente y dominio deben corresponder`);
  assert.equal(item.contextMode, 'automatic-topic-context', `${label}: debe declarar el origen del contexto`);
  assert.match(item.summary, /Titular de .*medio de origen/, `${label}: no inventa un resumen del artículo`);
  iso(item?.sourcePublishedAtIso || item?.publishedAtIso, `${label}: publicación`);
  assert.equal(item?.imageUrl, 'src/assets/social/nuvia-social-source-generated-v1.png',
    `${label}: debe usar el activo editorial propio de NUVIA`);
  assert.match(item?.imageProvenance || '', /Activo editorial propio de NUVIA/,
    `${label}: falta documentar la procedencia de la imagen`);
};

assert.ok(['ok', 'degraded', 'failed'].includes(payload.editorialUpdate?.status),
  'La actualización editorial debe declarar ok, degraded o failed');
iso(payload.editorialUpdate?.lastAttemptAt, 'Último intento editorial');
if (payload.editorialUpdate.status !== 'failed') iso(payload.editorialUpdate?.lastSuccessAt, 'Último éxito editorial');
assert.equal(payload.editorialUpdate?.selectionMode, 'automatic', 'La selección actual debe identificarse como automática');

validateItem(payload.dailyEconomicNews, 'Noticia principal');
iso(payload.dailyEconomicNews?.selectedAt, 'Selección de la noticia principal');
assert.equal(payload.dailyEconomicNews?.impactPoints?.length, 3, 'La noticia principal debe incluir tres claves');

assert.equal(payload.secondaryEconomicNews?.length, 3, 'Deben existir exactamente tres noticias breves');
payload.secondaryEconomicNews.forEach((item, index) => validateItem(item, `Noticia breve ${index + 1}`));

const urls = [payload.dailyEconomicNews.sourceUrl, ...payload.secondaryEconomicNews.map((item) => item.sourceUrl)];
const titles = [payload.dailyEconomicNews, ...payload.secondaryEconomicNews]
  .map((item) => item.title.toLocaleLowerCase('es-ES'));
assert.equal(new Set(urls).size, 4, 'Las cuatro noticias deben tener URL distinta');
assert.equal(new Set(titles).size, 4, 'Las cuatro noticias deben tener titular distinto');

assert.match(integration, /sourcePublishedAtIso/, 'La interfaz debe calcular la actualidad desde la publicación real');
assert.match(integration, /editorialUpdate/, 'La interfaz debe mostrar el estado del intento editorial');
assert.match(integration, /no resumen ni verifican los artículos/, 'El contexto automático no se presenta como resumen verificado');
assert.match(markets, /data-news-update-status/, 'Mercados debe reservar un estado visible de actualización');
assert.match(markets, /data-daily-news="date"[^>]*datetime=/, 'La fecha principal debe usar un elemento time con datetime');
assert.match(markets, /src\/assets\/social\/nuvia-social-source-generated-v1\.png/,
  'El contenido de reserva debe usar el activo editorial propio');
assert.doesNotMatch(markets, /daily-news-current|secondary-news-current/,
  'El contenido de reserva no debe rehospedar fotografías de prensa');
assert.doesNotMatch(markets, /informes diarios/i,
  'Mercados no debe prometer informes diarios mientras la sección esté en preparación');
assert.doesNotMatch(integration, /Datos oficiales revisados a diario/,
  'Los indicadores no deben prometer una revisión diaria que el sistema no acredita');
assert.doesNotMatch(styles, /\.markets-lead-news h3[^}]*line-clamp/s,
  'El titular principal no puede recortarse con line-clamp');
if (updater) {
  assert.doesNotMatch(updater, /fetchCandidateImage|og:image|twitter:image/,
    'La actualización no debe descargar ni rehospedar imágenes de prensa');
  assert.match(updater, /consultorio/,
    'La selección debe excluir consultorios personales');
}

console.log(`Sistema editorial verificado en ${root}.`);

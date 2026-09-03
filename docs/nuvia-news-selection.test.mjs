import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleNews, newsAttribution, CONTEXT_NOTICE } from '../scripts/news-editorial.mjs';

const now = new Date('2026-09-03T10:00:00Z');
const item = overrides => ({ title: 'El empleo en España', sourceName: 'EL PAÍS Economía', url: 'https://elpais.com/economia/2026-09-03/empleo.html', publishedAt: new Date('2026-09-03T09:00:00Z'), ...overrides });
test('solo titulares ya publicados y dentro de las últimas 72 horas', () => {
  assert.equal(eligibleNews(item(), now), true);
  for (const publishedAt of [new Date('invalid'), new Date('2026-09-03T10:00:01Z'), new Date('2026-08-31T09:59:59Z')]) assert.equal(eligibleNews(item({ publishedAt }), now), false);
  assert.equal(eligibleNews(item({ publishedAt: new Date('2026-08-31T10:00:00Z') }), now), true);
});
test('URL HTTPS del medio correspondiente, sin credenciales ni dominios parecidos', () => {
  for (const url of ['http://elpais.com/a', 'https://elpais.com.evil.test/a', 'https://user:pass@elpais.com/a', 'javascript:alert(1)', 'https://expansion.com/a']) assert.equal(eligibleNews(item({ url }), now), false);
  assert.equal(eligibleNews(item({ sourceName: 'Expansión', url: 'https://www.expansion.com/mercados/a.html' }), now), true);
  assert.equal(eligibleNews(item({ sourceName: 'Desconocido' }), now), false);
});
test('la atribución no inventa un resumen ni afirma haber leído el artículo', () => {
  assert.equal(newsAttribution('EL PAÍS Economía'), 'Titular de EL PAÍS Economía. Consulta la noticia completa en el medio de origen.');
  assert.match(CONTEXT_NOTICE, /no resume ni verifica el artículo/);
});

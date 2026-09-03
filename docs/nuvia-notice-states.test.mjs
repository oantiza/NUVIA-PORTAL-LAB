/* Contrato de mensajes. Ejecuta la integración existente en un DOM mínimo,
   con respuesta sintética: no lee datos reales ni abre ninguna conexión. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = resolve(process.argv[2] || '.');
const read = file => readFileSync(resolve(root, file), 'utf8');
const source = read('web2-integration.js');
const markets = read('mercados.html');
const sample = read('sistema-visual.html');
assert.match(markets, /data-news-update-status[^>]*role="status"[^>]*aria-atomic="true"/);
assert.match(markets, /markets-lab__table-subtitle" role="status" aria-atomic="true"/);
assert.doesNotMatch(markets, /'Hoy'|Hoy ·|Indicadores macroeconómicos actualizados/);
assert.equal((markets.match(/Esta selección es estática; no es una agenda actualizada/g) || []).length, 2);
assert.match(markets, /limpiarFiltrosMercado: \(\) => \{\s*this.setState\(\{ busquedaMercado: '', sectorMercado: 'Todos' \}\)/);
assert.match(read('temas.html'), /nv-tag nv-tag--pending tm-card__tag/);
assert.match(read('estilos/nuvia-components.css'), /\.nv-note,\s*\.nv-notice\s*\{/);
assert.match(read('estilos/nuvia-tokens.css'), /--nv-notice-text: var\(--nv-body-sm\)/);
for (const state of ['loading','unavailable','empty','pending','partial','error','available','unverified']) {
  assert.ok(sample.includes(`data-notice-state="${state}"`), `Muestra ${state}`);
}
const samples = sample.split('class="nv-notice-samples"')[1].split('class="nv-card-grid"')[0];
assert.doesNotMatch(samples, /role="(?:status|alert)"|aria-busy|aria-live/, 'Las muestras estáticas no anuncian estados reales');

const selectedAt = '2026-08-20T10:00:00.000Z';
const publishedAt = '2026-08-19T10:00:00.000Z';
const fixture = (status='ok', lastSuccessAt=selectedAt) => ({
  dailyEconomicNews: { title:'Titular de prueba', sourcePublishedAtIso:publishedAt, selectionDate:'19 de agosto de 2026', sourceName:'Fuente de prueba' },
  editorialUpdate: { status, lastSuccessAt, lastAttemptAt:'2026-08-21T14:00:00.000Z' },
  dailyMacroIndicators: [], secondaryEconomicNews: [],
});

async function exercise(payload, failure) {
  const status = { dataset:{}, textContent:'Selección sin comprobar' };
  const title = { textContent:'Titular de reserva' };
  const date = { textContent:'Fecha de reserva', dateTime:'reserva' };
  const fields = new Map([
    ['[data-news-update-status]', status],
    ['[data-daily-news="title"]', title],
    ['[data-daily-news="date"]', date],
  ]);
  let finishFetch, calls=0, settled;
  const result = new Promise(resolveDone => { settled=resolveDone; });
  runInNewContext(source, {
    Date, Intl, console:{warn:()=>{}},
    document: { readyState:'complete', querySelector:s=>fields.get(s)||null, querySelectorAll:()=>[], getElementById:()=>null },
    window: { location:{pathname:'/mercados.html'}, setTimeout:fn=>fn() },
    fetch: (url, options) => {
      assert.equal(url, './data/daily-content.json');
      assert.equal(options.cache, 'no-cache');
      calls++;
      return new Promise((resolveFetch, rejectFetch) => {
        finishFetch=()=>{
          if (failure==='network') rejectFetch(new Error('Simulado'));
          else resolveFetch({ ok:failure!=='http', status:503, json:async()=>{
            if (failure==='json') throw new Error('JSON simulado inválido');
            return payload;
          } });
          // Deja finalizar la cadena async de hydrateDailyContent.
          setImmediate(settled);
        };
      });
    },
  });
  assert.equal(status.dataset.noticeState,'loading');
  assert.match(status.textContent,/Comprobando/);
  finishFetch();
  await result;
  assert.equal(calls,1,'No se crean reintentos o nuevas conexiones');
  assert.notEqual(status.dataset.noticeState,'loading','El estado de carga termina');
  return {status,title,date};
}

const ok = await exercise(fixture());
assert.equal(ok.status.dataset.noticeState,'available');
assert.match(ok.status.textContent,/20 ago 2026/);
assert.doesNotMatch(ok.status.textContent,/21 ago|actualizada|1970/);
assert.equal(ok.date.dateTime,publishedAt,'No se cambia publicación por intento o éxito');
assert.equal(ok.title.textContent,'Titular de prueba');
const partial = await exercise(fixture('degraded'));
assert.equal(partial.status.dataset.noticeState,'partial');
assert.match(partial.status.textContent,/Actualización parcial/);
const failed = await exercise(fixture('failed'));
assert.equal(failed.status.dataset.noticeState,'error');
assert.match(failed.status.textContent,/No se ha podido actualizar/);
assert.doesNotMatch(failed.status.textContent,/pendiente/i);
for (const payload of [fixture('unknown'), fixture('ok',''), fixture('ok','inválida'), {...fixture(),editorialUpdate:undefined}]) {
  const r = await exercise(payload);
  assert.equal(r.status.dataset.noticeState,'unverified');
  assert.doesNotMatch(r.status.textContent,/1970|actualizada/);
}
for (const failure of ['network','http','json']) {
  const r = await exercise(fixture(),failure);
  assert.equal(r.status.dataset.noticeState,'error');
  assert.equal(r.title.textContent,'Titular de reserva');
  assert.equal(r.date.dateTime,'reserva');
}
const absent = await exercise({...fixture(), dailyEconomicNews:undefined});
assert.equal(absent.status.dataset.noticeState,'partial');
assert.match(absent.status.textContent,/no incluye una noticia principal/);
assert.equal(absent.title.textContent,'Titular de reserva');
console.log('Avisos 4B-4: 11 respuestas sintéticas, carga, fechas, reserva y semántica verificadas sin red.');

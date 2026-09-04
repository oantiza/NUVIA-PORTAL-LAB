// Regresión independiente del módulo compilado. API propia simulada en memoria;
// no consulta servicios externos ni usa el navegador o la sesión del usuario.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import { BASE, wire, fixtureDocuments, fixtureDividendDates } from '../docs/fixtures/fundamentales-remote.mjs';
import { entradaActual } from '../js/nuvia-identidades.js';
import { earningsWindow } from '../company-analysis/alfa/earnings-window.mjs';
import { technicalAnalysis } from '../company-analysis/alfa/technical.mjs';
import {bundle} from './mercado-alfa/ohlcv-load.mjs';
import {technicalOhlcv} from '../company-analysis/alfa/ohlcv.mjs';

const root = resolve('company-analysis/build');
const output = resolve('output/cierre-alfa/fundamentales');
const extendedPdf = process.argv.includes('--pdf-extended');
const pdf = process.argv.includes('--pdf') || extendedPdf;
const snapshot = JSON.parse(await readFile(resolve('company-analysis/public/data/fundamentals.json'), 'utf8'));
snapshot.entries = snapshot.entries.map(entradaActual);
const iberdrola = snapshot.entries.find(e => e.symbol === 'IBE.MC');
// Serie sintética, solo en memoria: nunca se escribe en la base ni en el catálogo.
const pricePoints = [];
for (let day = new Date('2021-01-04T00:00:00Z'); day <= new Date('2026-09-02T00:00:00Z'); day.setUTCDate(day.getUTCDate() + 1)) {
  if ([0, 6].includes(day.getUTCDay())) continue;
  pricePoints.push({ date: day.toISOString().slice(0, 10), value: 100 + pricePoints.length * .02 + Math.sin(pricePoints.length / 15) });
}
const ohlcvPoints = pricePoints.map((p,i)=>({date:p.date,open:p.value*10,high:p.value*10+10,low:p.value*10-10,
  close:p.value*10,adjusted_close:p.value,volume:i===0?null:i===1?0:100000+i}));
const ohlcvFixtures = new Map(snapshot.entries.map(e=>[e.isin,bundle(e,{prices:ohlcvPoints,fetchedAt:'2026-09-04T00:00:00Z'})]));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local.test').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + sep)) throw new Error('Fuera del módulo');
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 1280, 1024, 820, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
    const requests = [], errors = [], reads = [], localDataReads = [];
    let mode = 'normal', releaseHeld, heldStarted;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.href.startsWith(`${BASE}/assets/`)) {
        const request = route.request();
        assert.equal(request.method(), 'GET');
        assert.equal(request.headers().authorization, undefined);
        assert.equal(request.headers().cookie, undefined);
        assert.equal(request.headers().referer, undefined);
        reads.push(url.href);
        const path = url.href.slice(BASE.length + 1), isin = path.split('/')[1];
        const entry = snapshot.entries.find(e => e.isin === isin);
        assert.ok(entry, `Petición fuera del índice: ${path}`);
        assert.ok(path === `assets/${isin}` || path === `assets/${isin}/fundamentals/current` || path === `assets/${isin}/fundamentals/dividends` || /^assets\/[A-Z0-9]+\/series\/\d{4}$/.test(path) || ohlcvFixtures.get(isin).some(d=>d.path===path));
        if (['offline', 'brokenBackup', 'missingBackup', 'heldBackup'].includes(mode)) return route.abort();
        if(path.includes('/ohlcv')) {
          if(mode==='ohlcvOffline')return route.fulfill({status:503,json:{}});
          if(mode==='ohlcvMissing')return route.fulfill({status:404,json:{}});
          const value=structuredClone(ohlcvFixtures.get(isin).find(d=>d.path===path).value);
          if(mode==='ohlcvInvalid' && value.points)value.points[0].volume=999;
          if(mode==='heldOhlcv' && path.endsWith('/2026')) {
            heldStarted();await new Promise(resolve=>{releaseHeld=resolve;});
          }
          return route.fulfill({status:200,json:wire(path,value)}).catch(()=>{});
        }
        if (path.includes('/series/')) {
          if (mode === 'pricesOffline') return route.fulfill({ status: 503, json: {} });
          if (mode === 'pricesMissing') return route.fulfill({ status: 404, json: {} });
          const year = Number(path.split('/').at(-1));
          const points = pricePoints.filter(p => p.date.startsWith(String(year)));
          const value = { asset_id: entry.assetId, currency: entry.quoteCurrency, year, n: points.length, first_date: points[0].date, last_date: points.at(-1).date, points };
          if (mode === 'pricesInvalid') value.asset_id = 'NL0000000002';
          if (mode === 'heldPrices' && year === 2026) {
            heldStarted(); await new Promise(resolve => { releaseHeld = resolve; });
          }
          return route.fulfill({ status: 200, json: wire(path, value) }).catch(() => {});
        }
        if (path.endsWith('/dividends')) {
          if (mode === 'datesOffline') return route.fulfill({ status: 503, json: {} });
          if (mode === 'datesMissing') return route.fulfill({ status: 404, json: {} });
          const dates = fixtureDividendDates(entry, mode === 'datesNull' ? { exDividendDate: null, availability: 'notReported' } : {});
          if (mode === 'datesInvalid') dates.isin = 'NL0000000002';
          if (mode === 'heldDates') {
            dates.exDividendDate = '2031-01-17';
            heldStarted(); await new Promise(resolve => { releaseHeld = resolve; });
          }
          return route.fulfill({ status: 200, json: wire(path, dates) }).catch(() => {});
        }
        const docs = fixtureDocuments(entry, ['ANA.MC', 'AENA.MC', 'FER.MC'].includes(entry.symbol) ? iberdrola.company : entry.company);
        Object.assign(docs.asset, {
          updated_at: '2026-09-03T08:00:00Z',
          source: { system: 'EODHD', symbol: entry.symbol, fetched_at: '2026-09-03T07:00:00Z' },
          history: { first_date: pricePoints[0].date, last_date: pricePoints.at(-1).date },
        });
        if (mode === 'missing') docs.fundamental = null;
        const value = path.endsWith('/current') ? docs.fundamental : docs.asset;
        if (mode === 'held' && entry.symbol === 'IBE.MC' && path.endsWith('/current')) {
          heldStarted(); await new Promise(resolve => { releaseHeld = resolve; });
          return route.fulfill({ status: 200, json: wire(path, value) }).catch(() => {}); // petición ya cancelada al cambiar de empresa
        }
        return route.fulfill({ status: value ? 200 : 404, json: value ? wire(path, value) : {} });
      }
      if (url.origin !== base) { requests.push(url.origin); return route.abort(); }
      if (url.pathname.startsWith('/data/')) {
        localDataReads.push(url.pathname);
        assert.notEqual(url.pathname, '/data/fundamentals.json', 'No descarga la instantánea completa');
        if (url.pathname.startsWith('/data/backups/')) {
          assert.equal(route.request().method(), 'GET');
          assert.equal(route.request().headers().cookie, undefined);
          assert.equal(route.request().headers().referer, undefined);
          if (mode === 'brokenBackup') return route.fulfill({ status: 200, json: { schema: 'incorrecto' } });
          if (mode === 'missingBackup') return route.fulfill({ status: 404, json: {} });
          if (mode === 'heldBackup') {
            heldStarted(); await new Promise(resolve => { releaseHeld = resolve; });
            return route.continue().catch(() => {});
          }
        }
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/index.html`);
    await page.getByRole('button', { name: /IBE.MC/ }).waitFor();
    assert.deepEqual(reads, [], 'Abrir sin elegir no consulta cifras');
    assert.deepEqual(localDataReads, ['/data/company-index.json']);
    await page.getByRole('searchbox').fill('IBE.MC');
    await page.getByRole('button', { name: /IBE.MC/ }).click();
    await page.getByRole('heading', { name: 'Iberdrola S.A.', exact: true }).waitFor();
    await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
    await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
    assert.equal(reads.length, 3, 'Solo ficha, fundamentales y complemento de la empresa elegida');
    assert.deepEqual(localDataReads, ['/data/company-index.json'], 'Base correcta: sin respaldo');
    await page.getByRole('tab', { name: 'Informe', exact: true }).click();
    await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('all');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('table').count(), 4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Desborde a ${width}`);
    const text = await page.locator('main').innerText();
    assert.doesNotMatch(text, /NaN|Infinity|PER estimado|BPA previsto|Dividendo anual estimado/);
    assert.match(text, /Margen neto/);
    assert.equal(await page.getByRole('columnheader', { name: 'Presentación declarada', exact: true }).count(), 3);
    const filingExplanations = page.locator('p').filter({ hasText: 'Presentación: fecha declarada por el proveedor, sin verificación documental individual.' });
    assert.equal(await filingExplanations.count(), 3);
    assert.equal(await filingExplanations.evaluateAll(nodes => nodes.every(node => !node.closest('.alpha-table') && node.scrollWidth <= node.clientWidth + 1)), true, 'La explicación no queda dentro del desplazamiento horizontal');
    assert.match(text, /Fechas de dividendos/); assert.match(text, /Posterior a la consulta/);
    assert.match(text, /No informada/); assert.match(text, /Fuente de estas fechas: EODHD/);
    assert.equal(await page.locator('.alpha-dividend-grid > div').count(), 2);
    await page.locator('.alpha-dividend-dates').screenshot({ path: resolve(output, `fechas-${width}.png`) });
    const collisions = await page.locator('.alpha-charts svg').evaluateAll(charts => charts.flatMap(chart => {
      const labels = [...chart.querySelectorAll('text')].map(text => text.getBoundingClientRect());
      return labels.flatMap((box, index) => index && labels[index - 1].right > box.left + 1 ? ['Etiquetas de ejercicios solapadas'] : []);
    }));
    assert.deepEqual(collisions, [], `Gráficos a ${width}`);
    await page.screenshot({ path: resolve(output, `informe-${width}.png`), fullPage: true });
    // Las tablas conservan el contenido al cambiar el número de ejercicios.
    const allRows = await page.locator('table').first().locator('tbody tr').count();
    await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('5');
    assert.equal(await page.locator('table').first().locator('tbody tr').count(), Math.min(5, allRows));
    assert.equal(await page.locator('.alpha-earnings tbody tr').count(), earningsWindow(iberdrola.company.earnings, 5).rows.length, 'BPA por periodo, no por cantidad de comunicados');
    await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('10');
    assert.equal(await page.locator('.alpha-earnings tbody tr').count(), earningsWindow(iberdrola.company.earnings, 10).rows.length);
    await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('5');
    if (pdf && width === 1440) {
      await page.getByRole('tab', { name: 'Resumen', exact: true }).click();
      // PDF del motor de impresión real: también desde Resumen incluye el informe.
      await page.pdf({ path: resolve(output, 'INFORME_PRUEBA_IBERDROLA.pdf'), preferCSSPageSize: true, printBackground: true });
      assert.ok((await stat(resolve(output, 'INFORME_PRUEBA_IBERDROLA.pdf'))).size > 10000);
      if (extendedPdf) {
        for (const limit of ['10', 'all']) {
          await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption(limit);
          await page.pdf({ path: resolve(output, `PRUEBA_IBERDROLA_${limit}.pdf`), preferCSSPageSize: true, printBackground: true });
        }
        await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('5');
      }
    }
    await page.getByRole('searchbox', { name: 'Nombre, ticker o ISIN' }).fill('ES0118900010');
    assert.equal(reads.length, 3, 'Buscar no descarga más fundamentales ni fechas');
    await page.getByRole('button', { name: /FER.MC/ }).click();
    await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
    assert.match(await page.locator('.alpha-company').innerText(), /NL0015001FS8/);
    assert.match(await page.locator('.alpha-company').innerText(), /canje de 1 acción por 1/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Ferrovial: desborde a ${width}`);
    await page.locator('.alpha-company').screenshot({ path: resolve(output, `ferrovial-${width}.png`) });
    await page.getByRole('searchbox', { name: 'Nombre, ticker o ISIN' }).fill('ANA.MC');
    await page.getByRole('button', { name: /ANA.MC/ }).click();
    await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Informe', exact: true }).click();
    assert.equal(await page.locator('table').count(), 4, 'Se recupera la ficha ausente en la copia local');
    await page.getByRole('searchbox', { name: 'Nombre, ticker o ISIN' }).fill('ES0105046017');
    await page.getByRole('button', { name: /AENA.MC/ }).click();
    await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
    await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
    assert.match(await page.locator('.alpha-company').innerText(), /ES0105046017/);
    assert.match(await page.locator('.alpha-company').innerText(), /desdoblamiento de 1 acción en 10/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Aena: desborde a ${width}`);
    await page.locator('.alpha-company').screenshot({ path: resolve(output, `aena-${width}.png`) });
    mode = 'missing';
    await page.getByRole('button', { name: 'Volver a consultar la base' }).click();
    await page.getByText('No hay fundamentales cargados para esta identidad en la base propia', { exact: true }).waitFor();
    assert.equal(reads.length, 14);
    if (width === 1440) {
      mode = 'offline';
      await page.getByRole('searchbox').fill('IBE.MC');
      await page.getByRole('button', { name: /IBE.MC/ }).click();
      await page.getByText('Respaldo local · Sin verificar en la base.', { exact: true }).waitFor();
      assert.equal(localDataReads.filter(p => p.startsWith('/data/backups/')).length, 1);
      assert.ok(localDataReads.at(-1).startsWith(`/data/backups/${iberdrola.isin}.`));
      for (const failedMode of ['brokenBackup', 'missingBackup']) {
        mode = failedMode;
        await page.getByRole('button', { name: /Volver a consultar la base|Reintentar consulta/ }).click();
        await page.getByRole('alert').filter({ hasText: failedMode === 'brokenBackup' ? 'no coincide con su versión' : 'No se ha podido cargar el respaldo local' }).waitFor();
        assert.equal(await page.locator('table').count(), 0, 'No presenta un respaldo corrupto o ausente');
      }
      mode = 'normal';
      await page.getByRole('button', { name: 'Reintentar consulta', exact: true }).click();
      await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
      mode = 'offline';
      await page.getByRole('searchbox').fill('ANA.MC');
      await page.getByRole('button', { name: /ANA.MC/ }).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('table').count(), 0, 'Sin respaldo: no muestra cifras de la empresa anterior');
      mode = 'normal';
      await page.getByRole('button', { name: 'Reintentar consulta' }).click();
      await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
      mode = 'held';
      const started = new Promise(resolve => { heldStarted = resolve; });
      await page.getByRole('searchbox').fill('IBE.MC');
      await page.getByRole('button', { name: /IBE.MC/ }).click();
      await started;
      await page.getByText('Consultando los fundamentales en la base propia…', { exact: true }).waitFor();
      assert.equal(await page.locator('table').count(), 0);
      mode = 'normal';
      await page.getByRole('searchbox').fill('ANA.MC');
      await page.getByRole('button', { name: /ANA.MC/ }).click();
      await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
      releaseHeld();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('.alpha-company h2').innerText(), snapshot.entries.find(e => e.symbol === 'ANA.MC').name);
      // El fallo, ausencia o identidad cruzada de fechas nunca oculta las cuentas.
      mode = 'normal';
      await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
      await page.getByRole('tab', { name: 'Informe', exact: true }).click();
      for (const [scenario, message] of [
        ['datesOffline', 'No se han podido consultar las fechas.'],
        ['datesMissing', 'No hay un complemento de fechas cargado'],
        ['datesInvalid', 'Las fechas recibidas no corresponden a esta empresa.'],
        ['datesNull', 'No informada'],
      ]) {
        mode = scenario;
        const beforeDates = reads.length;
        await page.getByRole('button', { name: 'Volver a consultar las fechas', exact: true }).click();
        await page.locator('.alpha-dividend-dates').getByText(message, { exact: false }).first().waitFor();
        assert.equal(reads.length, beforeDates + 1, 'Reintento de fechas: solo un GET');
        assert.equal(await page.locator('table').count(), 4, 'El complemento no retira las cuentas');
        if (scenario === 'datesNull') assert.equal(await page.locator('.alpha-dividend-grid dd').filter({ hasText: /^No informada$/ }).count(), 2);
      }
      mode = 'heldDates';
      const datesStarted = new Promise(resolve => { heldStarted = resolve; });
      await page.getByRole('button', { name: 'Volver a consultar las fechas', exact: true }).click();
      await datesStarted;
      await page.getByText('Consultando las fechas de dividendos…', { exact: true }).waitFor();
      assert.equal(await page.locator('table').count(), 4, 'La espera de fechas no oculta fundamentales');
      assert.equal(await page.locator('.alpha-dividend-dates time').count(), 0, 'No conserva fechas antiguas al reintentar');
      mode = 'normal';
      await page.getByRole('searchbox').fill('IBE.MC');
      await page.getByRole('button', { name: /IBE.MC/ }).click();
      await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
      releaseHeld();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.match(await page.locator('.alpha-company').innerText(), /IBE.MC/);
      assert.equal(await page.locator('.alpha-dividend-dates time[datetime="2031-01-17"]').count(), 0, 'No muestra las fechas de la selección anterior');
      await page.getByRole('searchbox').fill('ANA.MC');
      await page.getByRole('button', { name: /ANA.MC/ }).click();
      await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
      assert.match(await page.locator('.alpha-company').innerText(), /ANA.MC/);
      // Una descarga local tardía tampoco debe reemplazar a la siguiente empresa.
      mode = 'heldBackup';
      const backupStarted = new Promise(resolve => { heldStarted = resolve; });
      await page.getByRole('searchbox').fill('IBE.MC');
      await page.getByRole('button', { name: /IBE.MC/ }).click();
      await backupStarted;
      mode = 'normal';
      await page.getByRole('searchbox').fill('ANA.MC');
      await page.getByRole('button', { name: /ANA.MC/ }).click();
      await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
      releaseHeld();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('.alpha-company h2').innerText(), snapshot.entries.find(e => e.symbol === 'ANA.MC').name);
    }
    if (extendedPdf && width === 1440) {
      mode = 'normal';
      await page.getByRole('searchbox').fill('TSK.MC');
      await page.getByRole('button', { name: /TSK.MC/ }).click();
      assert.equal(await page.locator('.alpha-company h2').innerText(), 'TSK Electrónica y Electricidad, S.A.');
      await page.getByText('Consulta desde la base propia.', { exact: true }).waitFor();
      await page.getByText('Fuente de estas fechas: EODHD.', { exact: true }).waitFor();
      await page.getByRole('combobox', { name: 'Ejercicios' }).selectOption('all');
      await page.pdf({ path: resolve(output, 'PRUEBA_TSK_all.pdf'), preferCSSPageSize: true, printBackground: true });
    }
    if (process.argv.includes('--pdf-tecnico') && width === 1440) {
      await page.getByRole('tab', { name: 'Técnico', exact: true }).click();
      await page.locator('[data-testid="technical-source"]').waitFor();
      await page.pdf({ path: resolve(output, 'PRUEBA_TECNICO.pdf'), preferCSSPageSize: true, printBackground: true });
      assert.equal(await page.locator('.alpha-technical-print').evaluateAll(images => images.length===5 && images.every(img => img.naturalWidth > 0)), true, 'Los cinco gráficos se capturan para impresión');
      assert.equal(await page.locator('.alpha-technical-methods').getAttribute('open'), null, 'La impresión restaura el estado del desplegable');
      await page.getByRole('tab', { name: 'Resumen', exact: true }).click();
    }
    // Técnico es independiente de los fundamentales: incluso sin ficha contable.
    mode = 'missing';
    await page.getByRole('button', { name: /Volver a consultar la base|Reintentar consulta/ }).click();
    await page.getByText('No hay fundamentales cargados para esta identidad en la base propia', { exact: true }).waitFor();
    assert.equal(await page.getByRole('tab').count(), 4);
    const beforePrices = reads.length;
    await page.getByRole('tab', { name: 'Técnico', exact: true }).click();
    await page.locator('[data-testid="technical-source"]').waitFor();
    assert.equal(reads.length, beforePrices + 8, 'Solo manifiesto, seis años OHLCV y relectura de versión');
    assert.equal(await page.locator('.alpha-technical-chart').count(), 5);
    const kpiProblems = await page.locator('.alpha-technical .kpi').evaluateAll(cards => cards.flatMap(card => {
      const problems = [], value = card.querySelector('.v'), label = card.querySelector('.k');
      const vs = getComputedStyle(value), ls = getComputedStyle(label), cs = getComputedStyle(card);
      if (vs.fontSize !== '22px' || vs.fontWeight !== '500') problems.push('Cifra fuera de escala');
      if (ls.fontSize !== '14px' || ls.textTransform !== 'none' || ls.fontWeight !== '500') problems.push('Etiqueta desproporcionada');
      if (cs.minHeight !== '0px' || cs.paddingTop !== '12px') problems.push('Tarjeta con altura o espaciado excesivo');
      for (const el of [card,value,label]) if (el.scrollWidth > el.clientWidth + 1) problems.push('KPI recortado');
      return problems;
    }));
    assert.deepEqual(kpiProblems, [], `KPI compactos, completos y legibles a ${width}px`);
    assert.ok(await page.locator('.alpha-technical-chart canvas').count() >= 5);
    assert.equal(await page.getByRole('button',{name:'Velas ajustadas',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Línea de cierre',exact:true}).click();
    assert.match(await page.locator('.alpha-technical-chart').first().innerText(),/Evolución del cierre ajustado/);
    await page.getByRole('button',{name:'Velas ajustadas',exact:true}).click();
    assert.doesNotMatch(await page.locator('.alpha-technical').innerText(), /NaN|Infinity/);
    const expectedTechnical = technicalAnalysis(pricePoints);
    const expectedOhlcv=technicalOhlcv(ohlcvPoints);
    assert.equal(await page.locator('.alpha-technical .kpi').filter({has:page.getByText('ATR (14)',{exact:true})}).locator('.v').innerText(),expectedOhlcv.latest.atr.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}));
    const displayPercent = value => `${value > 0 ? '+' : ''}${(value * 100).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    for (const [label, value] of [
      ['Volatilidad 30d (anual.)', expectedTechnical.volatility],
      ['Precio vs SMA 200', expectedTechnical.latest.value / expectedTechnical.latest.sma200 - 1],
      ['12 meses', expectedTechnical.performance.find(p => p.label === '12 meses').value],
    ]) {
      const card = page.locator('.alpha-technical .kpi').filter({ has: page.getByText(label, { exact: true }) });
      assert.equal(await card.locator('.v').innerText(), displayPercent(value), `${label}: conversión de fracción a porcentaje`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Técnico: desborde a ${width}`);
    await page.locator('.alpha-technical-chart').first().screenshot({ path: resolve(output, `tecnico-precios-${width}.png`) });
    await page.locator('.alpha-technical-grid').screenshot({ path: resolve(output, `tecnico-indicadores-${width}.png`) });
    const oneYear = await page.locator('.alpha-technical-data tbody tr').count();
    await page.getByRole('button', { name: '5 años', exact: true }).click();
    assert.ok(await page.locator('.alpha-technical-data tbody tr').count() > oneYear * 4);
    await page.getByRole('button', { name: '6 meses', exact: true }).click();
    assert.ok(await page.locator('.alpha-technical-data tbody tr').count() < oneYear);
    await page.getByRole('button', { name: 'Bandas de Bollinger', exact: true }).click();
    await page.locator('.alpha-technical-chart .chart-legend').getByText('Banda superior', { exact: true }).waitFor();
    assert.equal(reads.length, beforePrices + 8, 'Los controles locales no vuelven a descargar precios');
    await page.locator('.alpha-technical-data summary').click();
    assert.equal(await page.getByRole('region', { name: 'Datos del análisis técnico' }).getAttribute('tabindex'), '0');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'La tabla desplaza dentro de su contenedor');
    if (width === 1440) {
      for(const [scenario,message] of [['ohlcvOffline','No se han podido consultar los precios.'],['ohlcvMissing','No hay un historial OHLCV'],['ohlcvInvalid','huella de integridad']]) {
        mode=scenario;
        await page.getByRole('button',{name:'Volver a consultar los precios',exact:true}).click();
        await page.locator('.alpha-technical').getByRole('alert').filter({hasText:message}).waitFor();
        assert.equal(await page.locator('.alpha-technical-chart').count(),0,'Error explícito, sin mezclar silenciosamente con cierres anteriores');
      }
      // La serie anterior permanece disponible incluso si falla OHLCV.
      await page.getByRole('combobox',{name:'Serie de datos'}).selectOption('legacy');
      await page.locator('[data-testid="technical-source"]').waitFor();
      assert.equal(await page.locator('.alpha-technical-chart').count(),3);
      for (const [scenario, message] of [
        ['pricesOffline', 'No se han podido consultar los precios.'],
        ['pricesMissing', 'Falta el documento de precios de'],
        ['pricesInvalid', 'El documento anual de precios no corresponde'],
      ]) {
        mode = scenario;
        await page.getByRole('button', { name: 'Volver a consultar los precios', exact: true }).click();
        await page.locator('.alpha-technical').getByRole('alert').filter({ hasText: message }).waitFor();
        assert.equal(await page.locator('.alpha-technical-chart').count(), 0, 'El reintento no muestra precios anteriores como nuevos');
      }
      mode = 'normal';
      await page.getByRole('button', { name: 'Volver a consultar los precios', exact: true }).click();
      await page.locator('[data-testid="technical-source"]').waitFor();
      mode = 'heldPrices';
      const pricesStarted = new Promise(resolve => { heldStarted = resolve; });
      await page.getByRole('button', { name: 'Volver a consultar los precios', exact: true }).click();
      await pricesStarted;
      await page.getByRole('tab', { name: 'Técnico', exact: true }).focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.getByRole('tab', { name: 'Fundamentales', exact: true }).getAttribute('aria-selected'), 'true');
      releaseHeld();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('.alpha-technical').count(), 0, 'Una consulta técnica cancelada no reaparece sobre otra pestaña');
      mode = 'normal';
      await page.getByRole('tab',{name:'Técnico',exact:true}).click();
      await page.locator('[data-testid="technical-source"]').waitFor();
      mode='heldOhlcv';
      const ohlcvStarted=new Promise(resolve=>{heldStarted=resolve;});
      await page.getByRole('button',{name:'Volver a consultar los precios',exact:true}).click();
      await ohlcvStarted;
      mode='normal';
      await page.getByRole('searchbox').fill('AENA.MC');
      await page.getByRole('button',{name:/AENA.MC/}).click();
      await page.getByRole('tab',{name:'Técnico',exact:true}).click();
      await page.locator('[data-testid="technical-source"]').waitFor();
      releaseHeld();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.match(await page.locator('.alpha-company').innerText(),/AENA.MC/);
      assert.equal(await page.locator('.alpha-technical-chart').count(),5);
    }
    assert.deepEqual(errors, [], `Errores JS a ${width}`);
    assert.deepEqual(requests, [], `Peticiones externas a ${width}`);
    console.log(`OK módulo ${width}px: fundamentales, fechas y técnico con cinco gráficos, velas/línea, ATR, volumen, periodos, Bollinger y tabla; cero desbordes, errores o red externa. ${width === 1440 ? 'Respaldo, dos series, reintento, cancelación y aislamiento comprobados.' : ''}`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(ok => server.close(ok));
}

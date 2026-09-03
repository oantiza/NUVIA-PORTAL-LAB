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

const root = resolve('company-analysis/build');
const output = resolve('output/cierre-alfa/fundamentales');
const extendedPdf = process.argv.includes('--pdf-extended');
const pdf = process.argv.includes('--pdf') || extendedPdf;
const snapshot = JSON.parse(await readFile(resolve('company-analysis/public/data/fundamentals.json'), 'utf8'));
snapshot.entries = snapshot.entries.map(entradaActual);
const iberdrola = snapshot.entries.find(e => e.symbol === 'IBE.MC');
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
        assert.ok(path === `assets/${isin}` || path === `assets/${isin}/fundamentals/current` || path === `assets/${isin}/fundamentals/dividends`);
        if (['offline', 'brokenBackup', 'missingBackup', 'heldBackup'].includes(mode)) return route.abort();
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
    assert.deepEqual(errors, [], `Errores JS a ${width}`);
    assert.deepEqual(requests, [], `Peticiones externas a ${width}`);
    console.log(`OK fundamentales ${width}px: informe, selector, fechas, base simulada, identidades migradas, ausencia; cero desbordes, errores o red externa. ${width === 1440 ? 'Respaldo, reintento, cancelación y aislamiento de fechas comprobados.' : ''}`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(ok => server.close(ok));
}

// Consulta explícita y acotada. No hay modo apply, credenciales de base ni escrituras remotas.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectAlphaCompany } from '../company-analysis/alfa/project.mjs';
import { COMPANY_FIELDS } from '../company-analysis/alfa/contract.mjs';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { readCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';

const general = ['Code', 'Exchange', 'ISIN', 'Type', 'Name', 'CurrencyCode', 'UpdatedAt'];
export const REVISION_FIELDS = [...general.map(key => `General::${key}`),
  ...Object.keys(COMPANY_FIELDS).flatMap(key => [`Financials::${key}::currency_symbol`, `Financials::${key}::yearly`])];

export function projectRevision(payload, entry) {
  assert.ok(payload && typeof payload === 'object' && !Array.isArray(payload));
  assert.deepEqual(Object.keys(payload).sort(), [...REVISION_FIELDS].sort(), 'Respuesta filtrada inesperada');
  const raw = { General: Object.fromEntries(general.map(key => [key, payload[`General::${key}`]])), Financials: {} };
  assert.equal(raw.General.ISIN, entry.isin); assert.equal(entry.assetId, entry.isin);
  assert.equal(`${raw.General.Code}.${raw.General.Exchange}`, entry.symbol);
  assert.equal(raw.General.CurrencyCode, entry.quoteCurrency); assert.equal(raw.General.Type, 'Common Stock');
  for (const key of Object.keys(COMPANY_FIELDS)) {
    const yearly = payload[`Financials::${key}::yearly`];
    assert.ok(yearly && typeof yearly === 'object' && !Array.isArray(yearly));
    raw.Financials[key] = { currency_symbol: payload[`Financials::${key}::currency_symbol`], yearly };
  }
  const company = projectAlphaCompany(raw, entry.symbol);
  assert.ok(company, 'No se proyectó la identidad');
  return company;
}

export function compareAnnualSnapshots(stored, fresh) {
  assert.equal(stored.symbol, fresh.symbol); assert.equal(stored.identity.isin, fresh.identity.isin);
  return Object.entries(COMPANY_FIELDS).map(([key, fields]) => {
    const before = stored.statements[key], after = fresh.statements[key];
    const periods = [...new Set([...before.rows.slice(-2), ...after.rows.slice(-2)].map(row => row.period))].sort();
    return { statement: key, storedLatest: before.rows.at(-1)?.period ?? null, providerLatest: after.rows.at(-1)?.period ?? null,
      storedHeaderCurrency: before.currency, providerHeaderCurrency: after.currency,
      rows: periods.map(period => {
        const a = before.rows.find(row => row.period === period), b = after.rows.find(row => row.period === period);
        const select = row => row ? Object.fromEntries(['period', 'reportedAt', 'currency', 'scale', ...fields].map(field => [field, row[field] ?? null])) : null;
        const changes = a && b ? ['reportedAt', 'currency', ...fields].filter(field => a[field] !== b[field]).map(field => ({ field, before: a[field], after: b[field] })) : [];
        return { period, stored: select(a), provider: select(b), changes, state: !a ? 'new-in-provider' : !b ? 'not-in-provider' : changes.length ? 'changed' : 'unchanged' };
      }) };
  });
}

async function run() {
  assert.ok(process.env.EODHD_API_KEY, 'Falta la credencial del proveedor en el entorno');
  assert.equal(process.argv.length, 2, 'Sin argumentos: este programa solo diagnostica');
  const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
  const entries = ['LOG.MC', 'RI.PA'].map(symbol => index.entries.find(entry => entry.symbol === symbol));
  assert.ok(entries.every(Boolean));
  const allowed = new Set(entries.flatMap(entry => [`${FUNDAMENTALS_BASE}/assets/${entry.isin}`, `${FUNDAMENTALS_BASE}/assets/${entry.isin}/fundamentals/current`]));
  const report = { startedAt: new Date().toISOString(), fields: REVISION_FIELDS, companies: [], failures: [], providerRequests: 0, databaseReads: 0, remoteWrites: 0 };
  for (const entry of entries) {
    try {
      const stored = await readCompany(entry, { fetchFn: (url, options) => {
        assert.ok(allowed.has(url)); assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit'); assert.equal(options.headers, undefined);
        report.databaseReads++;
        return fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
      } });
      assert.equal(stored.state, 'ready'); assert.equal(stored.origin, 'database');
      const url = new URL(`https://eodhd.com/api/fundamentals/${entry.symbol}`);
      url.searchParams.set('filter', REVISION_FIELDS.join(',')); url.searchParams.set('fmt', 'json');
      url.searchParams.set('api_token', process.env.EODHD_API_KEY);
      report.providerRequests++;
      const response = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(25000) });
      assert.ok(response.ok);
      const payload = await response.json(), fetchedAt = new Date().toISOString();
      const fresh = projectRevision(payload, entry);
      report.companies.push({ symbol: entry.symbol, isin: entry.isin, fetchedAt, loadedAt: stored.loadedAt,
        storedSource: stored.company.source, providerUpdated: fresh.source.providerUpdated,
        filteredResponseSha256: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
        statements: compareAnnualSnapshots(stored.company, fresh) });
    } catch {
      report.failures.push({ symbol: entry.symbol, reason: 'Identidad, formato o lectura no confirmados; sin respaldo ni cambio de datos.' });
    }
  }
  report.completedAt = new Date().toISOString();
  const directory = resolve('output/metadatos-fuentes'); await mkdir(directory, { recursive: true });
  const file = resolve(directory, `proveedor-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ file, companies: report.companies.length, failures: report.failures, providerRequests: report.providerRequests,
    databaseReads: report.databaseReads, remoteWrites: 0 }, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await run(); }
  catch { console.error('Diagnóstico no completado; no se exponen URLs, credenciales ni respuestas sin sanear.'); process.exitCode = 1; }
}

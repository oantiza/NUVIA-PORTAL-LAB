// Auditoría explícita de SOLO LECTURA. No forma parte de la compilación.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';
import { inspectCompany } from '../company-analysis/alfa/metadata.mjs';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';

const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
const allowed = new Set(index.entries.flatMap(entry => [`${FUNDAMENTALS_BASE}/assets/${entry.isin}`, `${FUNDAMENTALS_BASE}/assets/${entry.isin}/fundamentals/current`]));
let reads = 0;
async function readOnly(url, options) {
  assert.ok(allowed.has(url)); assert.equal(options.method, 'GET');
  assert.equal(options.credentials, 'omit'); assert.equal(options.headers, undefined);
  reads++;
  return fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
}
const report = { startedAt: new Date().toISOString(), completedAt: null, expected: index.entries.length, companies: [], failures: [], reads: 0, remoteWrites: 0 };
for (let i = 0; i < index.entries.length; i += 6) {
  const results = await Promise.all(index.entries.slice(i, i + 6).map(async entry => {
    try {
      const result = await readCompany(entry, { fetchFn: readOnly });
      assert.equal(result.state, 'ready'); assert.equal(result.origin, 'database');
      return { company: inspectCompany(result.company, report.startedAt.slice(0, 10)) };
    } catch { return { failure: { symbol: entry.symbol, reason: 'Lectura o contrato no confirmado; no se usa respaldo.' } }; }
  }));
  for (const result of results) result.company ? report.companies.push(result.company) : report.failures.push(result.failure);
}
report.completedAt = new Date().toISOString(); report.reads = reads;
const states = report.companies.flatMap(c => Object.values(c.statements));
const sum = field => states.reduce((total, state) => total + state[field].length, 0);
report.summary = {
  ready: report.companies.length, statements: states.length,
  annualRows: states.reduce((n, s) => n + s.rows, 0),
  missingCurrency: sum('missingCurrency'), missingScale: sum('missingScale'), missingFilingDate: sum('missingFilingDate'),
  emptyRows: sum('emptyRows'), differingQuoteCurrencyRows: sum('differsFromQuote'), differingStatementCurrencyRows: sum('differsFromStatement'),
  futureAnnualDates: sum('futureDates'), companiesWithDifferentCloses: report.companies.filter(c => c.latestClosesDiffer).map(c => c.symbol),
  earnings: report.companies.reduce((n, c) => n + c.earnings.count, 0),
  earningsMissingCurrency: report.companies.reduce((n, c) => n + (c.earnings.currencies.notReported || 0), 0),
  futureEarningsDates: report.companies.reduce((n, c) => n + c.earnings.futureDates.length, 0),
};
const directory = resolve('output/auditoria-metadatos'); await mkdir(directory, { recursive: true });
const path = resolve(directory, `lectura-${report.startedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report.summary, failures: report.failures, reads, remoteWrites: 0, report: path }, null, 2));
if (report.failures.length) process.exitCode = 1;

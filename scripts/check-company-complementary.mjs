// Solo lectura: base pública propia + archivos locales del índice actual.
// No consulta proveedor ni cuentas, no conserva listas nominales ni cambia datos.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { readCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';
import { inspectComplementary } from '../company-analysis/alfa/complementary-audit.mjs';

const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
const allowed = new Set(index.entries.flatMap(e => [`${FUNDAMENTALS_BASE}/assets/${e.isin}`, `${FUNDAMENTALS_BASE}/assets/${e.isin}/fundamentals/current`]));
let reads = 0;
async function readOnly(url, options) {
  assert.ok(allowed.has(url)); assert.equal(options.method, 'GET');
  assert.equal(options.credentials, 'omit'); assert.equal(options.headers, undefined);
  reads++;
  return fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
}
const report = { startedAt: new Date().toISOString(), completedAt: null, companies: [], reads: 0, remoteWrites: 0, providerRequests: 0 };
for (let offset = 0; offset < index.entries.length; offset += 6) {
  const results = await Promise.all(index.entries.slice(offset, offset + 6).map(async entry => {
    const result = { symbol: entry.symbol, isin: entry.isin };
    let company;
    try {
      const remote = await readCompany(entry, { fetchFn: readOnly });
      assert.equal(remote.state, 'ready'); assert.equal(remote.origin, 'database');
      company = remote.company;
      result.remote = { state: 'ready',
        hasDividendDates: Object.hasOwn(company, 'dividendDates'),
        hasInstitutionList: Object.hasOwn(company, 'institutions') || Object.hasOwn(company, 'Holders'),
        aggregateFields: Object.keys(company.shares).sort(),
        loadedAt: remote.loadedAt,
      };
    } catch { result.remote = { state: 'unverified' }; }
    try {
      const raw = JSON.parse(await readFile(resolve('output/mercado-alfa/crudo', `${entry.symbol}.fundamentals.json`), 'utf8'));
      result.archive = inspectComplementary(raw, entry, report.startedAt.slice(0, 10));
      if (result.archive.state === 'matched') {
        result.archive.rawSha256 = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
        result.archive.samePayloadAsRemote = company ? result.archive.rawSha256 === company.source.rawSha256 : null;
        result.archive.downloadedAt = null; // La fecha de modificación no acredita la descarga.
      }
    } catch (error) { result.archive = { state: error.code === 'ENOENT' ? 'missing' : 'unreadable' }; }
    return result;
  }));
  report.companies.push(...results);
}
const archives = report.companies.map(c => c.archive).filter(a => a.state === 'matched');
report.completedAt = new Date().toISOString(); report.reads = reads;
report.summary = {
  expected: index.entries.length, ready: report.companies.filter(c => c.remote.state === 'ready').length,
  remoteWithDividendDates: report.companies.filter(c => c.remote.hasDividendDates).length,
  remoteWithInstitutionList: report.companies.filter(c => c.remote.hasInstitutionList).length,
  matchedArchives: archives.length, missingArchives: report.companies.filter(c => c.archive.state === 'missing').length,
  otherArchiveIssues: report.companies.filter(c => !['matched', 'missing'].includes(c.archive.state)).map(c => ({ symbol: c.symbol, state: c.archive.state })),
  samePayloadAsRemote: archives.filter(a => a.samePayloadAsRemote).length,
  dividendDates: Object.fromEntries(['pastOrToday', 'future', 'missing', 'invalid'].map(state => [state, archives.filter(a => a.dividendDate.state === state).length])),
  exDividendDates: Object.fromEntries(['pastOrToday', 'future', 'missing', 'invalid'].map(state => [state, archives.filter(a => a.exDividendDate.state === state).length])),
  archivesWithInstitutions: archives.filter(a => a.institutions.objectRows > 0).length,
  invalidInstitutionContainers: archives.filter(a => a.institutions.containerState === 'invalid').length,
  institutionalRows: archives.reduce((n, a) => n + a.institutions.objectRows, 0),
  namesExported: false,
};
const directory = resolve('output/paridad-complementaria'); await mkdir(directory, { recursive: true });
const path = resolve(directory, `lectura-${report.startedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report.summary, reads, remoteWrites: 0, providerRequests: 0, report: path }, null, 2));
if (report.summary.ready !== report.summary.expected) process.exitCode = 1;

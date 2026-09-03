// Solo lectura. La respuesta vive en memoria; el informe solo conserva recuentos.
// Nunca guarda ni publica nombres, contactos, ejecutivos o transacciones.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { inspectComplementary } from '../company-analysis/alfa/complementary-audit.mjs';
import { entradaActual } from '../js/nuvia-identidades.js';

const general = ['Code', 'Exchange', 'ISIN', 'Type', 'UpdatedAt'];
export const INSTITUTION_FIELDS = [...general.map(key => `General::${key}`), 'Holders::Institutions'];
export function countInstitutionCoverage(payload, entry, asOf) {
  assert.ok(payload && typeof payload === 'object' && !Array.isArray(payload));
  assert.deepEqual(Object.keys(payload).sort(), [...INSTITUTION_FIELDS].sort());
  const raw = { General: Object.fromEntries(general.map(key => [key, payload[`General::${key}`]])),
    Holders: { Institutions: payload['Holders::Institutions'] === 'NA' ? null : payload['Holders::Institutions'] } };
  const audit = inspectComplementary(raw, entry, asOf);
  assert.equal(audit.state, 'matched');
  return { symbol: entry.symbol, isin: entry.isin, providerUpdated: audit.providerUpdated,
    sourceMarker: payload['Holders::Institutions'] === 'NA' ? 'NA' : null, institutions: audit.institutions };
}

async function run() {
  assert.equal(process.argv.length, 2, 'Solo diagnóstico, sin argumentos');
  assert.ok(process.env.EODHD_API_KEY, 'Credencial del proveedor no disponible');
  const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
  const report = { startedAt: new Date().toISOString(), fields: INSTITUTION_FIELDS, companies: [], failures: [], providerRequests: 0, remoteWrites: 0, namesExported: false };
  for (const entry of index.entries.map(entradaActual)) {
    try {
      const url = new URL(`https://eodhd.com/api/fundamentals/${entry.symbol}`);
      url.searchParams.set('filter', INSTITUTION_FIELDS.join(',')); url.searchParams.set('fmt', 'json');
      url.searchParams.set('api_token', process.env.EODHD_API_KEY);
      report.providerRequests++;
      const response = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(25000) });
      assert.ok(response.ok);
      // No serializar la respuesta ni mensajes de excepción que puedan contenerla.
      report.companies.push(countInstitutionCoverage(await response.json(), entry, new Date().toISOString().slice(0, 10)));
    } catch {
      report.failures.push({ symbol: entry.symbol, reason: 'Lectura, identidad o formato no confirmados; no se interpreta como ausencia.' });
    }
  }
  report.completedAt = new Date().toISOString();
  report.summary = { expected: index.entries.length, verified: report.companies.length,
    withRows: report.companies.filter(c => c.institutions.objectRows > 0).length,
    readableEmpty: report.companies.filter(c => c.institutions.containerState === 'readable' && c.institutions.sourceRows === 0).length,
    notReported: report.companies.filter(c => c.institutions.containerState === 'missing').length,
    invalid: report.companies.filter(c => c.institutions.containerState === 'invalid').length,
    rows: report.companies.reduce((n, c) => n + c.institutions.objectRows, 0) };
  const directory = resolve('output/cierre-alfa'); await mkdir(directory, { recursive: true });
  const file = resolve(directory, `instituciones-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report.summary, failures: report.failures, providerRequests: report.providerRequests, remoteWrites: 0, namesExported: false }, null, 2));
  if (report.failures.length || report.summary.invalid) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch(() => { console.error('Diagnóstico no completado. Sin datos crudos ni credenciales en la salida.'); process.exitCode = 1; });
}

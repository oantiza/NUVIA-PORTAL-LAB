// Control acotado del proveedor. No persiste nombres, respuestas ni datos personales.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const controls = [{ symbol: 'AAPL.US', market: 'US' }, { symbol: 'VOD.LSE', market: 'Europe' }];
export function summarizeInstitutions(value) {
  if (value === 'NA' || value === null || value === undefined) return { state: 'not-reported', rows: 0 };
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  const rows = Object.values(value); assert.ok(rows.every(row => row && typeof row === 'object' && !Array.isArray(row)));
  return { state: rows.length ? 'rows' : 'empty', rows: rows.length,
    datedRows: rows.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date)).length,
    percentageRows: rows.filter(row => Number.isFinite(Number(row.totalShares))).length };
}
async function run() {
  assert.equal(process.argv.length, 2); assert.ok(process.env.EODHD_API_KEY);
  const report = { startedAt: new Date().toISOString(), controls: [], providerRequests: 0,
    remoteWrites: 0, namesExported: false, responsesStored: false };
  for (const control of controls) {
    const url = new URL(`https://eodhd.com/api/fundamentals/${control.symbol}`);
    url.searchParams.set('filter', 'Holders::Institutions'); url.searchParams.set('fmt', 'json');
    url.searchParams.set('api_token', process.env.EODHD_API_KEY); report.providerRequests++;
    const response = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(25000) });
    assert.ok(response.ok); const summary = summarizeInstitutions(await response.json());
    report.controls.push({ symbol: control.symbol, market: control.market, ...summary });
  }
  report.completedAt = new Date().toISOString(); const directory = resolve('output/cierre-alfa');
  await mkdir(directory, { recursive: true });
  const file = resolve(directory, `instituciones-control-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ file, controls: report.controls, providerRequests: report.providerRequests,
    remoteWrites: 0, namesExported: false, responsesStored: false }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch(() => { console.error('Control no completado; sin respuestas ni datos nominales guardados.'); process.exitCode = 1; });
}

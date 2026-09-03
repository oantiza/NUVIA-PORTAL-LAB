// Diagnóstico histórico de dos emisores. Solo GET al proveedor; no accede a la base.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const income = ['totalRevenue', 'costOfRevenue', 'grossProfit', 'ebit', 'ebitda',
  'depreciationAndAmortization', 'reconciledDepreciation', 'operatingIncome',
  'totalOperatingExpenses', 'sellingGeneralAdministrative'];
const cashflow = ['totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashFlow', 'depreciation'];
const balance = ['cash', 'cashAndEquivalents', 'shortTermDebt', 'longTermDebt',
  'longTermDebtTotal', 'shortLongTermDebt', 'shortLongTermDebtTotal', 'netDebt'];
export const BRIDGE_PLANS = [
  { symbol: 'LOG.MC', isin: 'ES0105027009', rows: ['2024-09-30', '2025-09-30'].flatMap(period => [
    { statement: 'Income_Statement', period, fields: income },
    { statement: 'Cash_Flow', period, fields: cashflow },
  ]) },
  { symbol: 'RI.PA', isin: 'FR0000120693', rows: [{ statement: 'Balance_Sheet', period: '2026-06-30', fields: balance }] },
];
const identityFields = ['Code', 'Exchange', 'ISIN', 'Type'];
const rowPath = row => `Financials::${row.statement}::yearly::${row.period}`;
export const bridgeFilters = plan => [...identityFields.map(k => `General::${k}`), ...plan.rows.map(rowPath)];
function number(value) {
  if (value === null || value === undefined || value === '' || value === 'NA') return null;
  assert.ok(typeof value === 'number' || typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value), 'Cifra inválida');
  const n = Number(value); assert.ok(Number.isFinite(n), 'Cifra no finita'); return n;
}
export function projectBridge(payload, plan) {
  assert.ok(payload && typeof payload === 'object' && !Array.isArray(payload));
  assert.deepEqual(Object.keys(payload).sort(), bridgeFilters(plan).sort(), 'Respuesta no filtrada');
  assert.equal(payload['General::ISIN'], plan.isin);
  assert.equal(`${payload['General::Code']}.${payload['General::Exchange']}`, plan.symbol);
  assert.equal(payload['General::Type'], 'Common Stock');
  return { symbol: plan.symbol, isin: plan.isin, rows: plan.rows.map(row => {
    const raw = payload[rowPath(row)];
    if (raw === null) return { statement: row.statement, period: row.period, state: 'missing', values: null };
    assert.ok(raw && typeof raw === 'object' && !Array.isArray(raw));
    assert.equal(raw.date, row.period, 'Periodo distinto');
    return { statement: row.statement, period: row.period, state: 'present',
      values: Object.fromEntries(row.fields.map(key => [key, number(raw[key])])) };
  }) };
}
export function arithmeticChecks(company) {
  return company.rows.flatMap(row => {
    if (!row.values) return [];
    const v = row.values;
    const check = (field, components, coefficients) => {
      const values = components.map(k => v[k]);
      const expected = values.every(n => typeof n === 'number' && Number.isFinite(n))
        ? values.reduce((sum, n, i) => sum + n * coefficients[i], 0) : null;
      const observed = v[field];
      return { statement: row.statement, period: row.period, field, components, expected, observed,
        difference: expected !== null && typeof observed === 'number' ? observed - expected : null,
        note: 'Solo relación aritmética entre campos del proveedor; no acredita correspondencia con el emisor.' };
    };
    if (row.statement === 'Income_Statement') return [check('grossProfit', ['totalRevenue', 'costOfRevenue'], [1, -1]),
      check('ebitda', ['ebit', 'depreciationAndAmortization'], [1, 1])];
    if (row.statement === 'Cash_Flow') return [check('freeCashFlow', ['totalCashFromOperatingActivities', 'capitalExpenditures'], [1, -1])];
    return [check('netDebt', ['shortTermDebt', 'longTermDebtTotal', 'cash'], [1, 1, -1]),
      check('netDebt', ['shortLongTermDebtTotal', 'cash'], [1, -1])];
  });
}
async function run() {
  assert.equal(process.argv.length, 2, 'Diagnóstico sin argumentos ni modo de escritura');
  assert.ok(process.env.EODHD_API_KEY);
  const report = { startedAt: new Date().toISOString(), providerRequests: 0, databaseReads: 0, remoteWrites: 0, companies: [], failures: [] };
  for (const plan of BRIDGE_PLANS) {
    try {
      const url = new URL(`https://eodhd.com/api/fundamentals/${plan.symbol}`);
      url.searchParams.set('filter', bridgeFilters(plan).join(','));
      url.searchParams.set('api_token', process.env.EODHD_API_KEY); url.searchParams.set('fmt', 'json');
      report.providerRequests++;
      const response = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(25000) });
      assert.ok(response.ok);
      const company = projectBridge(await response.json(), plan);
      report.companies.push({ ...company, checks: arithmeticChecks(company),
        projectionSha256: createHash('sha256').update(JSON.stringify(company)).digest('hex') });
    } catch { report.failures.push({ symbol: plan.symbol, reason: 'Lectura, identidad, fecha o formato no confirmados; no se sustituye el dato.' }); }
  }
  report.completedAt = new Date().toISOString();
  const directory = resolve('output/metadatos-fuentes'); await mkdir(directory, { recursive: true });
  const file = resolve(directory, `puente-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ file, companies: report.companies.length, failures: report.failures, providerRequests: report.providerRequests, remoteWrites: 0 }));
  if (report.failures.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await run(); } catch { console.error('Diagnóstico no completado; sin exponer respuestas ni credenciales.'); process.exitCode = 1; }
}

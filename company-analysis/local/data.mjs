// Solo desarrollo local. No importa clientes, credenciales ni SDK de proveedores.
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { financialNumber } from '../src/lib/financial.js';

export const RAW_DIRECTORY = fileURLToPath(new URL('../../output/mercado-alfa/crudo/', import.meta.url));
export const SYMBOL = /^[A-Z0-9_-]+\.[A-Z0-9_-]+$/i;
const statementFields = {
  Income_Statement: ['totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome', 'ebitda'],
  Balance_Sheet: ['totalAssets', 'totalLiab', 'totalStockholderEquity', 'cash', 'netDebt', 'shortLongTermDebtTotal'],
  Cash_Flow: ['totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashFlow', 'dividendsPaid'],
};
const statementLabels = { Income_Statement: 'Cuenta de resultados', Balance_Sheet: 'Balance', Cash_Flow: 'Flujos de caja' };
const historicalMetrics = ['RevenueTTM', 'GrossProfitTTM', 'PERatio',
  'OperatingMarginTTM', 'ProfitMargin', 'ReturnOnEquityTTM', 'ReturnOnAssetsTTM',
  'QuarterlyRevenueGrowthYOY', 'QuarterlyEarningsGrowthYOY'];
const multiples = ['PriceSalesTTM', 'PriceBookMRQ', 'EnterpriseValueRevenue', 'EnterpriseValueEbitda'];
const text = value => typeof value === 'string' && value.trim() ? value.trim() : null;
const currency = value => /^[A-Z]{3}$/.test(value || '') ? value : null;
export function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}
const numbers = (source, fields) => Object.fromEntries(fields.map(key => [key, financialNumber(source?.[key])]));

// Lista positiva, no eliminación de unas pocas claves: los campos nuevos del
// proveedor quedan fuera por defecto. No incluye estimaciones, consenso ni URLs.
export function projectCompany(raw, symbol) {
  if (!SYMBOL.test(symbol) || raw?.General?.Type !== 'Common Stock') return null;
  const general = raw.General;
  const expected = `${general.Code}.${general.Exchange}`;
  if (expected.toUpperCase() !== symbol.toUpperCase() || !text(general.Name)) return null;
  const statements = {};
  const warnings = [];
  if (/[ÃÂ�]/.test(general.Name)) warnings.push('El nombre del proveedor contiene posibles errores de codificación; se conserva sin reinterpretarlo.');
  if (!dateOnly(general.UpdatedAt)) warnings.push('La fecha de actualización del proveedor no está disponible.');
  for (const [name, fields] of Object.entries(statementFields)) {
    const source = raw.Financials?.[name];
    const rows = Object.entries(source?.yearly || {})
      .filter(([key, row]) => dateOnly(key) && row && typeof row === 'object')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, row]) => ({ period, reportedAt: dateOnly(row.filing_date), ...numbers(row, fields) }));
    statements[name] = { currency: currency(source?.currency_symbol), rows };
    if (!rows.length) warnings.push(`${statementLabels[name]}: sin ejercicios anuales disponibles.`);
    if (!statements[name].currency) warnings.push(`${statementLabels[name]}: divisa del estado no informada; no se infiere de la cotización.`);
  }
  return {
    schema: 'nuvia-company-local.v1', symbol,
    identity: { name: text(general.Name), isin: text(general.ISIN), ticker: text(general.Code),
      exchange: text(general.Exchange), sector: text(general.Sector), industry: text(general.Industry),
      country: text(general.CountryName), quoteCurrency: currency(general.CurrencyCode) },
    metrics: numbers(raw.Highlights, historicalMetrics),
    multiples: numbers(raw.Valuation, multiples),
    shares: numbers(raw.SharesStats, ['SharesOutstanding', 'PercentInstitutions', 'PercentInsiders']),
    statements,
    source: { provider: 'EODHD', mode: 'Copia local; sin actualización automática',
      providerUpdated: dateOnly(general.UpdatedAt), latestPeriod: Object.values(statements)
        .flatMap(s => s.rows.map(row => row.period)).sort().at(-1) || null },
    warnings,
  };
}

export async function loadCompanies(directory = RAW_DIRECTORY) {
  let files;
  try { files = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return { companies: [], issues: ['No se encuentra la caché local. No se ha descargado nada.'] }; throw error; }
  const companies = [], issues = [];
  for (const file of files.filter(f => f.isFile() && f.name.endsWith('.fundamentals.json'))) {
    const symbol = file.name.replace(/\.fundamentals\.json$/, '');
    if (!SYMBOL.test(symbol)) continue;
    try {
      const raw = JSON.parse(await readFile(resolve(directory, file.name), 'utf8'));
      if (raw?.General?.Type !== 'Common Stock') continue;
      const company = projectCompany(raw, symbol);
      if (company) companies.push(company);
      else issues.push(`${symbol}: identidad incompatible; archivo no incluido.`);
    } catch { issues.push(`${symbol}: archivo ilegible; no se ha sustituido por datos inventados.`); }
  }
  companies.sort((a, b) => a.identity.name.localeCompare(b.identity.name, 'es') || a.symbol.localeCompare(b.symbol));
  return { companies, issues };
}

export function catalogOf({ companies, issues }) {
  return { items: companies.map(c => ({ symbol: c.symbol, ...c.identity,
    latestPeriod: c.source.latestPeriod, hasStatements: Object.values(c.statements).some(s => s.rows.length > 0) })), issues };
}

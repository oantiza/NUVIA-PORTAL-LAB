// Offline: transforma solo una copia cuyos bytes e identidad se han comprobado.
import { createHash } from 'node:crypto';
import { dateOnly, projectCompany, SYMBOL } from './data.mjs';
import { matchIdentity } from './coverage.mjs';
import { CONTRACT_VERSION, RATIO_FIELDS, validateRecord, dataLimitations } from './contract.mjs';
import { financialNumber } from '../src/lib/financial.js';

const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const missing = value => value === undefined || value === null || value === '';
const mappings = {
  income: { block: 'Income_Statement', fields: {
    revenue: 'totalRevenue', gross_profit: 'grossProfit', operating_income: 'operatingIncome',
    net_income: 'netIncome', ebitda: 'ebitda',
  } },
  balance: { block: 'Balance_Sheet', fields: {
    assets: 'totalAssets', liabilities: 'totalLiab', equity: 'totalStockholderEquity',
    cash: 'cash', net_debt: 'netDebt', total_debt: 'shortLongTermDebtTotal',
  } },
  cash_flow: { block: 'Cash_Flow', fields: {
    operating_cash_flow: 'totalCashFromOperatingActivities', capex: 'capitalExpenditures',
    free_cash_flow: 'freeCashFlow', dividends_paid: 'dividendsPaid',
  } },
};
const ratios = {
  pe_ttm: ['Highlights', 'PERatio'], price_sales_ttm: ['Valuation', 'PriceSalesTTM'],
  price_book_mrq: ['Valuation', 'PriceBookMRQ'], ev_revenue: ['Valuation', 'EnterpriseValueRevenue'],
  ev_ebitda: ['Valuation', 'EnterpriseValueEbitda'], operating_margin_ttm: ['Highlights', 'OperatingMarginTTM'],
  net_margin_ttm: ['Highlights', 'ProfitMargin'], roe_ttm: ['Highlights', 'ReturnOnEquityTTM'],
  roa_ttm: ['Highlights', 'ReturnOnAssetsTTM'], revenue_growth_yoy: ['Highlights', 'QuarterlyRevenueGrowthYOY'],
  earnings_growth_yoy: ['Highlights', 'QuarterlyEarningsGrowthYOY'],
};

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** No recibe fechas de precios, ficheros meta ni una escala por defecto. */
export function normalizeSample({ rawBytes, asset, symbol, observedOn, maxPeriods = 5 }) {
  if (!dateOnly(observedOn)) throw new Error('Fecha explícita de observación requerida');
  if (!SYMBOL.test(symbol || '')) throw new Error('Símbolo con mercado requerido');
  if (!Number.isInteger(maxPeriods) || maxPeriods < 1 || maxPeriods > 5) throw new Error('Muestra limitada a 1–5 ejercicios por estado');
  const result = { symbol, asset_id: asset?.asset_id || null, status: 'rejected',
    publication_status: 'blocked', raw_sha256: null, records: [], rejected: [], issues: [],
    coverage: {}, limitations: [] };
  const reject = (code, context = {}) => result.rejected.push({ code, ...context });
  const issue = (code, context = {}) => result.issues.push({ code, ...context });
  if (!asset) { reject('not_in_catalog_snapshot'); return result; }
  if (rawBytes === null || rawBytes === undefined) { reject('local_file_missing'); return result; }
  if (!(rawBytes instanceof Uint8Array)) throw new Error('Se requieren los bytes originales del archivo');
  result.raw_sha256 = sha256(rawBytes);
  let raw;
  try { raw = JSON.parse(Buffer.from(rawBytes).toString('utf8')); }
  catch { reject('invalid_json'); return result; }
  if (!object(raw)) { reject('invalid_root'); return result; }
  const company = projectCompany(raw, symbol);
  if (!company) { reject('invalid_local_identity_or_type'); return result; }
  const identity = matchIdentity(asset, [company]);
  result.identity = identity;
  if (identity.status !== 'matched') { reject(identity.status); return result; }
  for (const warning of company.warnings) issue('source_warning', { message: warning });
  if (/bank|insurance|financial/i.test(`${company.identity.sector} ${company.identity.industry}`)) issue('sector_review_required');
  const updated = raw.General.UpdatedAt;
  if (!missing(updated) && (!dateOnly(updated) || updated > observedOn)) {
    reject('invalid_provider_date'); return result;
  }
  const source = { provider: 'EODHD', symbol, provider_updated_on: dateOnly(updated),
    downloaded_at: null, raw_sha256: result.raw_sha256 };
  const common = { schema_version: CONTRACT_VERSION, asset_id: asset.asset_id, symbol, source };
  const number = (value, context) => {
    const parsed = financialNumber(value);
    if (parsed === null) issue(missing(value) ? 'missing_number' : 'invalid_number', context);
    return parsed;
  };
  const accept = (record, context) => {
    const errors = validateRecord(record, observedOn);
    if (errors.length) { reject('contract_validation', { ...context, errors }); return; }
    result.records.push(record);
  };
  for (const [statement, { block, fields }] of Object.entries(mappings)) {
    const yearly = raw.Financials?.[block]?.yearly;
    if (!object(yearly)) {
      issue('annual_statement_missing', { statement });
      result.coverage[statement] = { available: 0, selected: 0, omitted_by_limit: 0 };
      continue;
    }
    const entries = Object.entries(yearly).sort(([a], [b]) => b.localeCompare(a));
    const selected = entries.slice(0, maxPeriods);
    result.coverage[statement] = { available: entries.length, selected: selected.length,
      omitted_by_limit: entries.length - selected.length };
    for (const [period, row] of selected) {
      const context = { statement, period };
      if (!object(row)) { reject('invalid_annual_row', context); continue; }
      if (!dateOnly(period) || period > observedOn) { reject('invalid_period', context); continue; }
      if (!missing(row.date) && row.date !== period) { reject('period_date_conflict', context); continue; }
      if (missing(row.date)) issue('row_date_missing', context);
      if (!missing(row.filing_date) && (!dateOnly(row.filing_date)
        || row.filing_date > observedOn || row.filing_date < period)) {
        reject('invalid_filing_date', context); continue;
      }
      if (missing(row.filing_date)) issue('filing_date_missing', context);
      // A currency in another year or in the block header is not evidence for this row.
      const currency = typeof row.currency_symbol === 'string' && /^[A-Z]{3}$/.test(row.currency_symbol)
        ? row.currency_symbol : null;
      if (currency === null) issue(missing(row.currency_symbol) ? 'row_currency_missing' : 'row_currency_invalid', context);
      if (currency && currency !== raw.Financials[block].currency_symbol) issue('row_header_currency_difference', context);
      if (currency && currency !== asset.currency) issue('statement_quote_currency_difference', context);
      accept({ ...common, kind: 'annual', statement, period_end: period,
        filed_on: dateOnly(row.filing_date), currency, scale: null,
        values: Object.fromEntries(Object.entries(fields)
          .map(([field, rawField]) => [field, number(row[rawField], { ...context, field })])),
      }, context);
    }
  }
  // observed_on is reading this archive, not a fresh valuation/market observation.
  accept({ ...common, kind: 'ratios', observed_on: observedOn,
    values: Object.fromEntries(Object.entries(ratios).map(([field, [block, rawField]]) => [field, {
      value: number(raw[block]?.[rawField], { field }), unit: RATIO_FIELDS[field], period_end: null,
    }])),
  }, { kind: 'ratios' });
  result.limitations = [...new Set(result.records.flatMap(dataLimitations))];
  result.status = result.records.length ? 'review_only' : 'rejected';
  return result;
}

/** Exige catálogo sin duplicados; no selecciona silenciosamente una ficha ambigua. */
export function assertCatalogSnapshot(evidence) {
  if (!object(evidence) || !Array.isArray(evidence.assets) || !evidence.assets.length
    || !dateOnly(evidence.asOf) || typeof evidence.at !== 'string'
    || !Number.isFinite(Date.parse(evidence.at)) || evidence.at.slice(0, 10) !== evidence.asOf) {
    throw new Error('Evidencia de catálogo local inválida');
  }
  const ids = new Set(), symbols = new Set();
  for (const asset of evidence.assets) {
    if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(asset?.asset_id || '') || !SYMBOL.test(asset?.eodhd_symbol || '')) {
      throw new Error('Identidad de catálogo inválida');
    }
    const symbol = asset.eodhd_symbol.toUpperCase();
    if (ids.has(asset.asset_id) || symbols.has(symbol)) throw new Error('Identidad de catálogo duplicada o ambigua');
    ids.add(asset.asset_id); symbols.add(symbol);
  }
}

import { idsEquivalentes } from '../../../js/nuvia-identidades.js';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const textOrNull = value => value == null || typeof value === 'string';
const numberOrNull = value => value == null || typeof value === 'number' && Number.isFinite(value);
const fields = {
  Income_Statement: ['totalRevenue', 'grossProfit', 'ebitda', 'operatingIncome', 'netIncome'],
  Balance_Sheet: ['totalAssets', 'totalLiab', 'totalStockholderEquity', 'cash', 'netDebt', 'shortLongTermDebtTotal'],
  Cash_Flow: ['totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashFlow', 'dividendsPaid'],
};
function validCompany(company) {
  if (!record(company) || !record(company.identity) || !Object.values(company.identity).every(textOrNull)
    || !record(company.source) || !Object.values(company.source).every(textOrNull)
    || !Array.isArray(company.warnings) || !company.warnings.every(warning => typeof warning === 'string')) return false;
  for (const key of ['metrics', 'multiples', 'shares']) {
    if (!record(company[key]) || !Object.values(company[key]).every(numberOrNull)) return false;
  }
  if (company.snapshotMetrics != null && (!record(company.snapshotMetrics) || !Object.values(company.snapshotMetrics).every(numberOrNull))) return false;
  if (company.earnings != null && (!Array.isArray(company.earnings) || !company.earnings.every(row => record(row)
    && [row.period, row.reportedAt, row.currency].every(textOrNull) && numberOrNull(row.actual)))) return false;
  return Object.entries(fields).every(([key, numericFields]) => Array.isArray(company.statements?.[key]?.rows)
    && company.statements[key].rows.every(row => record(row) && typeof row.period === 'string'
      && [row.reportedAt, row.currency].every(textOrNull) && numericFields.every(field => numberOrNull(row[field]))));
}
export async function readSnapshot({ fetchFn = fetch, signal } = {}) {
  const response = await fetchFn('./data/fundamentals.json', { signal, credentials: 'omit', cache: 'no-cache' });
  if (!response.ok) throw new Error('No se ha podido cargar la instantánea de fundamentales. Puedes reintentar.');
  const snapshot = await response.json();
  if (snapshot?.schema !== 'nuvia-company-alpha.v1' || !Array.isArray(snapshot.entries)
    || snapshot.entries.some(e => !e || typeof e.symbol !== 'string' || typeof e.name !== 'string' || typeof e.isin !== 'string'
      || !textOrNull(e.quoteCurrency) || !Array.isArray(e.identityCandidates)
      || !e.identityCandidates.every(candidate => record(candidate) && [candidate.symbol, candidate.isin].every(textOrNull))
      || (e.company != null && !validCompany(e.company)))) {
    throw new Error('El archivo de fundamentales no tiene el formato esperado.');
  }
  return snapshot;
}

import { companyDisplayName } from '../../alfa/display-name.mjs';
export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function searchCompanies(entries, query) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter(e => words.every(word => normalizeSearch(`${companyDisplayName(e)} ${e.symbol} ${idsEquivalentes(e.isin).join(' ')}`).includes(word)));
}

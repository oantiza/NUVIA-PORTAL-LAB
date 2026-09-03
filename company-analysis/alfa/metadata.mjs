// Diagnóstico descriptivo: nunca convierte cifras, completa divisas ni bloquea fichas.
import { COMPANY_FIELDS } from './contract.mjs';

export const SCALE_NOTICE = 'El modelo de datos de esta copia no incorpora escalas contables acreditadas. Se conservan las cifras recibidas sin conversión; esto no implica que el documento original carezca de unidades.';
const LEGACY_SCALE_NOTICE = 'Las escalas contables no constan en estos archivos. Se muestran las cifras originales sin conversión ni atribución de unidad monetaria.';
export const filingMatchesClose = row => Boolean(row.reportedAt && row.reportedAt === row.period);
export function displayWarnings(company) {
  return company.warnings.map(warning => warning === LEGACY_SCALE_NOTICE ? SCALE_NOTICE : warning);
}

const counts = values => {
  const result = new Map();
  for (const value of values) {
    const key = value || 'notReported';
    result.set(key, (result.get(key) || 0) + 1);
  }
  return Object.fromEntries(result);
};

export function inspectStatement(statement, fields, quoteCurrency, asOf) {
  const rows = statement.rows;
  const selected = rows.slice(-5);
  return {
    rows: rows.length, first: rows[0]?.period || null, last: rows.at(-1)?.period || null,
    declaredCurrency: statement.currency,
    currencies: counts(rows.map(row => row.currency)),
    latestFiveCurrencies: counts(selected.map(row => row.currency)),
    missingCurrency: rows.filter(row => !row.currency).map(row => row.period),
    missingScale: rows.filter(row => row.scale == null).map(row => row.period),
    missingFilingDate: rows.filter(row => !row.reportedAt).map(row => row.period),
    filingDatesEqualClose: rows.filter(filingMatchesClose).map(row => row.period),
    emptyRows: rows.filter(row => fields.every(field => row[field] == null)).map(row => row.period),
    differsFromQuote: rows.filter(row => row.currency && quoteCurrency && row.currency !== quoteCurrency).map(row => ({ period: row.period, currency: row.currency })),
    differsFromStatement: rows.filter(row => row.currency && statement.currency && row.currency !== statement.currency).map(row => ({ period: row.period, currency: row.currency })),
    futureDates: rows.filter(row => row.period > asOf || row.reportedAt > asOf).map(row => ({ period: row.period, reportedAt: row.reportedAt })),
  };
}

export function inspectCompany(company, asOf) {
  const statements = Object.fromEntries(Object.entries(COMPANY_FIELDS).map(([key, fields]) => [key,
    inspectStatement(company.statements[key], fields, company.identity.quoteCurrency, asOf)]));
  const closes = Object.values(statements).map(s => s.last).filter(Boolean);
  const earnings = company.earnings || [];
  const byPeriod = new Map();
  for (const row of earnings) {
    if (!row.period) continue;
    if (!byPeriod.has(row.period)) byPeriod.set(row.period, []);
    byPeriod.get(row.period).push(row);
  }
  return {
    symbol: company.symbol, isin: company.identity.isin, quoteCurrency: company.identity.quoteCurrency,
    source: { ...company.source }, statements,
    latestClosesDiffer: new Set(closes).size > 1,
    earnings: { count: earnings.length, currencies: counts(earnings.map(e => e.currency)),
      missingPeriod: earnings.filter(e => !e.period).length,
      missingPublication: earnings.filter(e => !e.reportedAt).length,
      futureDates: earnings.filter(e => e.period > asOf || e.reportedAt > asOf).map(e => ({ period: e.period, reportedAt: e.reportedAt })),
      repeatedPeriods: [...byPeriod].filter(([, rows]) => rows.length > 1).map(([period, rows]) => ({ period, observations: rows.length })),
    },
  };
}

export function statementNotes(statement) {
  const rows = statement.rows;
  const notes = [];
  if (rows.some(row => !row.currency)) notes.push('Moneda sin informar en parte del histórico: la coincidencia de este rótulo no acredita que esos ejercicios compartan divisa.');
  if (new Set(rows.map(row => row.currency).filter(Boolean)).size > 1) notes.push('Este estado contiene distintas monedas declaradas. Los gráficos las separan; las cifras no se han convertido.');
  if (statement.currency && rows.some(row => row.currency && row.currency !== statement.currency)) notes.push(`La cabecera del proveedor declara ${statement.currency}, pero hay ejercicios con otra moneda. Se conserva la moneda de cada fila, sin heredar la cabecera.`);
  if (rows.some(filingMatchesClose)) notes.push('* La presentación declarada coincide con el cierre en los registros marcados. Se conserva la fecha recibida, sin darla por acreditada como presentación oficial.');
  return notes;
}

export function chartCaption(currency) {
  return currency
    ? `Moneda declarada: ${currency}. Cifras originales; una misma moneda no acredita una escala homogénea entre ejercicios.`
    : 'Moneda no informada. Cifras originales con moneda y escala sin acreditar: no se puede asegurar su comparabilidad entre ejercicios.';
}

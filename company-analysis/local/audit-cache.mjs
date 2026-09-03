import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadCompanies, RAW_DIRECTORY } from './data.mjs';
import { auditRawPeriods } from './coverage.mjs';
const local = await loadCompanies();
const at = new Date().toISOString();
const companies = [];
for (const company of local.companies) {
  const raw = JSON.parse(await readFile(resolve(RAW_DIRECTORY, `${company.symbol}.fundamentals.json`), 'utf8'));
  companies.push({ symbol: company.symbol, ...auditRawPeriods(raw) });
}
const directory = new URL('../../output/fundamentales-contraste/', import.meta.url);
await mkdir(directory, { recursive: true });
const result = { at, source: 'Solo archivos locales; sin red ni escrituras de base', companies };
const file = new URL(`periodos-${at.replace(/[:.]/g, '-')}.json`, directory);
await writeFile(file, JSON.stringify(result, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ evidence: file.pathname, companies: companies.length,
  rows: companies.reduce((sum, c) => sum + c.rows, 0),
  missingFilingDates: companies.reduce((sum, c) => sum + c.missingFilingDate, 0),
  missingRowCurrencies: companies.reduce((sum, c) => sum + c.missingRowCurrency, 0),
  dateConflicts: companies.filter(c => c.inconsistentDates.length).length,
  currencyDifferences: companies.filter(c => c.currencyDifferences.length).map(c => ({ symbol: c.symbol,
    rows: c.currencyDifferences.length, currencies: [...new Set(c.currencyDifferences.map(r => r.rowCurrency))] })) }, null, 2));

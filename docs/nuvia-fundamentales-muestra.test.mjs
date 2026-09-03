import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { normalizeSample, assertCatalogSnapshot } from '../company-analysis/local/normalize.mjs';
import { ANNUAL_FIELDS, RATIO_FIELDS, validateRecord } from '../company-analysis/local/contract.mjs';

const observedOn = '2026-09-03';
const asset = { asset_id: 'ES0144580Y14', isin: 'ES0144580Y14', eodhd_symbol: 'IBE.MC', currency: 'EUR' };
const period = '2025-12-31';
function raw() {
  const metadata = { date: period, filing_date: '2026-02-28', currency_symbol: 'EUR' };
  return {
    General: { Type: 'Common Stock', Code: 'IBE', Exchange: 'MC', ISIN: asset.isin,
      Name: 'Empresa de prueba', CurrencyCode: 'EUR', UpdatedAt: '2026-09-01' },
    Financials: {
      Income_Statement: { currency_symbol: 'EUR', yearly: { [period]: { ...metadata,
        totalRevenue: '100', grossProfit: '60', operatingIncome: '0', netIncome: '-20', ebitda: '10' } } },
      Balance_Sheet: { currency_symbol: 'EUR', yearly: { [period]: { ...metadata,
        totalAssets: '400', totalLiab: '300', totalStockholderEquity: '100', cash: '5',
        netDebt: '65', shortLongTermDebtTotal: '70' } } },
      Cash_Flow: { currency_symbol: 'EUR', yearly: { [period]: { ...metadata,
        totalCashFromOperatingActivities: '90', capitalExpenditures: '-10', freeCashFlow: null, dividendsPaid: '0' } } },
    },
    Highlights: { PERatio: 0, OperatingMarginTTM: 0.15, ProfitMargin: -0.2,
      ReturnOnEquityTTM: 0.1, ReturnOnAssetsTTM: 0.05, QuarterlyRevenueGrowthYOY: 0.2, QuarterlyEarningsGrowthYOY: -0.1 },
    Valuation: { PriceSalesTTM: '2', PriceBookMRQ: '3', EnterpriseValueRevenue: '4', EnterpriseValueEbitda: '5' },
  };
}
const bytes = value => Buffer.from(JSON.stringify(value));
const run = (input = raw(), overrides = {}) => normalizeSample({ rawBytes: bytes(input), asset,
  symbol: asset.eodhd_symbol, observedOn, ...overrides });
const annual = (result, statement = 'income') => result.records.find(r => r.kind === 'annual' && r.statement === statement);
const row = (input, block = 'Income_Statement') => input.Financials[block].yearly[period];

test('mapea todos los estados; cero y signo se conservan, FCF ausente no se calcula', () => {
  const result = run();
  assert.equal(result.status, 'review_only');
  assert.equal(result.publication_status, 'blocked');
  assert.equal(result.records.length, 4);
  assert.deepEqual(annual(result).values, { revenue: 100, gross_profit: 60, operating_income: 0, net_income: -20, ebitda: 10 });
  assert.deepEqual(annual(result, 'balance').values, { assets: 400, liabilities: 300, equity: 100, cash: 5, net_debt: 65, total_debt: 70 });
  assert.deepEqual(annual(result, 'cash_flow').values, { operating_cash_flow: 90, capex: -10, free_cash_flow: null, dividends_paid: 0 });
  for (const r of result.records) {
    assert.deepEqual(validateRecord(r, observedOn), []);
    if (r.kind === 'annual') assert.deepEqual(Object.keys(r.values), ANNUAL_FIELDS[r.statement]);
  }
});
test('huella calculada sobre bytes reales y normalización sin mutar el origen', () => {
  const input = bytes(raw()), original = Buffer.from(input);
  const result = normalizeSample({ rawBytes: input, asset, symbol: 'IBE.MC', observedOn });
  const hash = createHash('sha256').update(original).digest('hex');
  assert.equal(result.raw_sha256, hash);
  assert.ok(result.records.every(r => r.source.raw_sha256 === hash));
  assert.deepEqual(input, original);
});
test('monedas por ejercicio no heredan cabecera, cotización ni otro año', () => {
  const input = raw();
  row(input).currency_symbol = 'USD';
  row(input, 'Balance_Sheet').currency_symbol = null;
  input.Financials.Balance_Sheet.yearly['2024-12-31'] = { date: '2024-12-31', currency_symbol: 'EUR' };
  const result = run(input);
  assert.equal(annual(result).currency, 'USD');
  assert.equal(annual(result, 'balance').currency, null);
  assert.ok(result.issues.some(i => i.code === 'row_header_currency_difference'));
  row(input).currency_symbol = 'ESP';
  assert.equal(annual(run(input)).currency, 'ESP'); // No conversión histórica implícita.
  row(input).currency_symbol = 'usd';
  assert.equal(annual(run(input)).currency, null);
});
test('no finge escala, descarga ni periodo TTM a partir de otras fechas', () => {
  const input = raw();
  input.meta = { fetched_at: '2026-09-02T23:00:00Z', scale: 1 };
  const result = run(input);
  for (const r of result.records) {
    assert.equal(r.source.downloaded_at, null);
    assert.equal(r.source.provider_updated_on, '2026-09-01');
    if (r.kind === 'annual') assert.equal(r.scale, null);
  }
  const r = result.records.find(r => r.kind === 'ratios');
  assert.equal(r.observed_on, observedOn);
  assert.equal(r.values.pe_ttm.value, 0);
  assert.equal(r.values.operating_margin_ttm.value, 0.15);
  assert.deepEqual(Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, v.unit])), RATIO_FIELDS);
  assert.ok(Object.values(r.values).every(v => v.period_end === null));
});
test('rechaza identidades incompatibles y tipos no admitidos sin producir registros', () => {
  for (const [key, value, code] of [
    ['ISIN', 'NL0015001FS8', 'isin_conflict'], ['ISIN', null, 'unconfirmed'],
    ['Exchange', 'OTC', 'invalid_local_identity_or_type'], ['CurrencyCode', 'USD', 'currency_conflict'],
    ['Type', 'ETF', 'invalid_local_identity_or_type'],
  ]) {
    const input = raw(); input.General[key] = value;
    const result = run(input);
    assert.equal(result.records.length, 0);
    assert.equal(result.rejected[0].code, code);
  }
  assert.equal(run(raw(), { asset: { ...asset, isin: 'NL0015001FS8' } }).rejected[0].code, 'asset_identity_conflict');
  assert.equal(run(raw(), { asset: { ...asset, eodhd_symbol: 'IBE.OTC' } }).rejected[0].code, 'listing_conflict');
});
test('archivo ausente, emisor fuera del catálogo y JSON roto quedan separados', () => {
  assert.equal(run(raw(), { rawBytes: null }).rejected[0].code, 'local_file_missing');
  assert.equal(run(raw(), { asset: null }).rejected[0].code, 'not_in_catalog_snapshot');
  assert.equal(run(raw(), { rawBytes: Buffer.from('{') }).rejected[0].code, 'invalid_json');
  assert.equal(run([]).rejected[0].code, 'invalid_root');
});
test('no puede tomar sin aviso la primera ficha duplicada del catálogo', () => {
  const evidence = { asOf: observedOn, at: '2026-09-03T00:02:53.007Z', assets: [asset] };
  assert.doesNotThrow(() => assertCatalogSnapshot(evidence));
  assert.throws(() => assertCatalogSnapshot({ ...evidence, assets: [asset, asset] }), /duplicada/);
  assert.throws(() => assertCatalogSnapshot({ ...evidence, assets: [asset, { ...asset, asset_id: 'NL0015001FS8' }] }), /ambigua/);
  assert.throws(() => assertCatalogSnapshot({ ...evidence, at: 'invalid' }), /inválida/);
});
test('fechas anuales incoherentes o futuras se rechazan, no se sustituyen', () => {
  for (const [key, value, code] of [
    ['date', '2024-12-31', 'period_date_conflict'], ['date', '2025-02-30', 'period_date_conflict'],
    ['filing_date', '2027-01-01', 'invalid_filing_date'], ['filing_date', '2026-02-30', 'invalid_filing_date'],
    ['filing_date', '2024-12-31', 'invalid_filing_date'],
  ]) {
    const input = raw(); row(input)[key] = value;
    const result = run(input);
    assert.equal(annual(result), undefined);
    assert.ok(result.rejected.some(i => i.code === code));
  }
  const input = raw(); input.Financials.Income_Statement.yearly = { '2027-12-31': { date: '2027-12-31' } };
  assert.equal(annual(run(input)), undefined);
  for (const date of ['2027-01-01', '2026-02-30']) {
    input.General.UpdatedAt = date;
    assert.equal(run(input).records.length, 0);
  }
});
test('fechas realmente ausentes permanecen nulas y se señalan', () => {
  const input = raw(); delete input.General.UpdatedAt;
  delete row(input).filing_date; delete row(input).date;
  const result = run(input);
  assert.equal(annual(result).filed_on, null);
  assert.equal(annual(result).source.provider_updated_on, null);
  assert.ok(result.issues.some(i => i.code === 'row_date_missing'));
  assert.ok(result.limitations.some(i => i.includes('proveedor desconocida')));
});
test('números inválidos no pasan a cero y quedan registrados por campo', () => {
  for (const value of ['', 'NA', 'Infinity', '1,234', 'NaN', true, {}, []]) {
    const input = raw(); row(input).totalRevenue = value;
    const result = run(input);
    assert.equal(annual(result).values.revenue, null);
    assert.ok(result.issues.some(i => i.field === 'revenue' && /number$/.test(i.code)));
  }
});
test('lista positiva excluye opiniones, credenciales y futuros bloques del proveedor', () => {
  const input = raw();
  input.General.api_key = 'SECRET_MARKER';
  input.AnalystRatings = { TargetPrice: 99, StrongBuy: 9 };
  input.Highlights.WallStreetTargetPrice = 99;
  input.Earnings = { Trend: { prediction: 'SECRET_MARKER' } };
  row(input).recommendation = 'SECRET_MARKER';
  const result = run(input), serialized = JSON.stringify(result);
  for (const forbidden of ['SECRET_MARKER', 'AnalystRatings', 'TargetPrice', 'recommendation', 'api_key', 'Earnings']) {
    assert.ok(!serialized.includes(forbidden), forbidden);
  }
});
test('selección de hasta cinco ejercicios explicita omisiones; no rellena filas vacías', () => {
  const input = raw();
  input.Financials.Income_Statement.yearly = Object.fromEntries(Array.from({ length: 8 }, (_, i) => {
    const date = `${2025 - i}-12-31`; return [date, { date }];
  }));
  const result = run(input);
  assert.deepEqual(result.coverage.income, { available: 8, selected: 5, omitted_by_limit: 3 });
  assert.equal(result.records.filter(r => r.statement === 'income').length, 5);
  assert.ok(result.limitations.some(i => i.includes('sin cifras')));
  assert.equal(run(input, { maxPeriods: 1 }).coverage.income.selected, 1);
  assert.throws(() => run(input, { maxPeriods: 6 }), /limitada/);
});
test('bancos se señalan para revisión técnica, sin excluirlos ni darles una nota', () => {
  const input = raw(); input.General.Industry = 'Banks';
  const result = run(input);
  assert.ok(result.issues.some(i => i.code === 'sector_review_required'));
  assert.equal(result.records.length, 4);
  assert.equal(result.rating, undefined);
});
test('sin estados no se inventa serie anual; fila malformada queda en cuarentena', () => {
  const input = raw(); delete input.Financials;
  const result = run(input);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].kind, 'ratios');
  assert.equal(result.issues.filter(i => i.code === 'annual_statement_missing').length, 3);
  const malformed = raw(); malformed.Financials.Income_Statement.yearly[period] = [];
  assert.ok(run(malformed).rejected.some(i => i.code === 'invalid_annual_row'));
});
test('generador acotado fuera del sitio, sin cliente de red y con escritura exclusiva', async () => {
  const generator = await readFile(new URL('../company-analysis/local/sample.mjs', import.meta.url), 'utf8');
  const normalizer = await readFile(new URL('../company-analysis/local/normalize.mjs', import.meta.url), 'utf8');
  for (const code of [generator, normalizer]) {
    assert.doesNotMatch(code, /\bfetch\s*\(|from\s+['"](?:https?|firebase|@google-cloud)/);
  }
  assert.match(generator, /mkdtemp/);
  assert.match(generator, /flag: 'wx'/);
  assert.match(generator, /output\/fundamentales-muestra/);
  assert.match(generator, /live_rechecked: false/);
  const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(ignore, /^output\/$/m);
});

// Contrato positivo compartido por la carga y la lectura. Sin dependencias de servidor.
export const FUNDAMENTALS_SCHEMA = 'nuvia-fundamentals-company.v1';
export const COMPANY_FIELDS = {
  Income_Statement: ['totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome', 'ebitda'],
  Balance_Sheet: ['totalAssets', 'totalLiab', 'totalStockholderEquity', 'cash', 'netDebt', 'shortLongTermDebtTotal'],
  Cash_Flow: ['totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashFlow', 'dividendsPaid'],
};
function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Campos fuera del contrato de carga');
}
const numeric = value => value === null || typeof value === 'number' && Number.isFinite(value);
const text = value => value === null || typeof value === 'string';
const date = value => value === null || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function numbers(value, allowed) { keys(value, allowed); if (!Object.values(value).every(numeric)) throw new Error('Valor numérico no válido'); }
function validate(entry, historicalBackup) {
  keys(entry, ['assetId', 'symbol', 'name', 'isin', 'quoteCurrency', 'state', 'company', 'identityCandidates']);
  if (!/^[A-Z0-9]{12}$/.test(entry.assetId) || entry.isin !== entry.assetId || entry.state !== 'matched'
    || typeof entry.name !== 'string' || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol) || !text(entry.quoteCurrency)) throw new Error('Identidad no resuelta');
  const c = entry.company;
  keys(c, ['schema', 'symbol', 'identity', 'metrics', 'multiples', 'shares', 'statements', 'source', 'warnings', 'snapshotMetrics', 'earnings']);
  if (c.schema !== 'nuvia-company-local.v1') throw new Error('Esquema no válido');
  keys(c.identity, ['name', 'isin', 'ticker', 'exchange', 'sector', 'industry', 'country', 'quoteCurrency']);
  if (c.identity.isin !== entry.isin || c.symbol !== entry.symbol || c.identity.quoteCurrency !== entry.quoteCurrency
    || `${c.identity.ticker}.${c.identity.exchange}` !== entry.symbol || !c.identity.name) throw new Error('La identidad no coincide con el catálogo');
  if (!Object.values(c.identity).every(text)) throw new Error('Identidad no válida');
  numbers(c.metrics, ['RevenueTTM', 'GrossProfitTTM', 'PERatio', 'OperatingMarginTTM', 'ProfitMargin', 'ReturnOnEquityTTM', 'ReturnOnAssetsTTM', 'QuarterlyRevenueGrowthYOY', 'QuarterlyEarningsGrowthYOY']);
  numbers(c.multiples, ['PriceSalesTTM', 'PriceBookMRQ', 'EnterpriseValueRevenue', 'EnterpriseValueEbitda']);
  numbers(c.shares, ['SharesOutstanding', 'PercentInstitutions', 'PercentInsiders']);
  numbers(c.snapshotMetrics, ['MarketCapitalization', 'EarningsShare', 'DividendShare', 'DividendYield', 'BookValue', 'EnterpriseValue', 'PayoutRatio']);
  keys(c.statements, Object.keys(COMPANY_FIELDS));
  for (const [name, allowed] of Object.entries(COMPANY_FIELDS)) {
    const statement = c.statements[name];
    keys(statement, ['currency', 'rows']);
    if (!text(statement.currency) || !Array.isArray(statement.rows)) throw new Error('Estado no válido');
    for (const row of statement.rows) {
      keys(row, ['period', 'reportedAt', 'currency', 'scale', ...allowed]);
      if (!allowed.every(key => numeric(row[key])) || row.scale !== null || !row.period || !date(row.period)
        || !date(row.reportedAt) || !text(row.currency)) throw new Error('Cifra, fecha o escala no válida');
    }
  }
  if (!Array.isArray(c.earnings)) throw new Error('BPA no válido');
  for (const row of c.earnings) {
    keys(row, ['period', 'reportedAt', 'currency', 'actual']);
    if (!numeric(row.actual) || !date(row.period) || !date(row.reportedAt) || !text(row.currency)) throw new Error('BPA no válido');
  }
  keys(c.source, ['provider', 'mode', 'providerUpdated', 'latestPeriod', 'downloadedAt', 'rawSha256', 'hashBasis']);
  if (c.source.provider !== 'EODHD' || !(Number.isFinite(Date.parse(c.source.downloadedAt)) || historicalBackup && c.source.downloadedAt === null)
    || !/^[a-f0-9]{64}$/.test(c.source.rawSha256) || !Object.values(c.source).every(text)) throw new Error('Procedencia no válida');
  if (!Array.isArray(c.warnings) || !c.warnings.every(v => typeof v === 'string')) throw new Error('Avisos no válidos');
  if (!Array.isArray(entry.identityCandidates)) throw new Error('Identidad no válida');
  for (const candidate of entry.identityCandidates) {
    keys(candidate, ['symbol', 'isin']);
    if (![candidate.symbol, candidate.isin].every(text)) throw new Error('Identidad no válida');
  }
  if (new TextEncoder().encode(JSON.stringify(entry)).length > 600_000) throw new Error('Ficha demasiado grande para esta carga');
  return entry;
}

// La base exige fecha de descarga acreditada; un respaldo histórico conserva
// su ausencia explícita. No se inventa una fecha para volver a empaquetarlo.
export const validateEntry = entry => validate(entry, false);
export const validateBackupEntry = entry => validate(entry, true);

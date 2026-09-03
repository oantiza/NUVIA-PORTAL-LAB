// Propuesta v1 para revisión. Validador local, no migración ni cliente de base.
import { dateOnly, SYMBOL } from './data.mjs';
export const CONTRACT_VERSION = 'nuvia-fundamentals-draft.v1';
export const ANNUAL_FIELDS = {
  income: ['revenue', 'gross_profit', 'operating_income', 'net_income', 'ebitda'],
  balance: ['assets', 'liabilities', 'equity', 'cash', 'net_debt', 'total_debt'],
  cash_flow: ['operating_cash_flow', 'capex', 'free_cash_flow', 'dividends_paid'],
};
// Fracciones y porcentajes son unidades diferentes; no se convierten dos veces.
export const RATIO_FIELDS = {
  pe_ttm: 'multiple', price_sales_ttm: 'multiple', price_book_mrq: 'multiple',
  ev_revenue: 'multiple', ev_ebitda: 'multiple', operating_margin_ttm: 'fraction',
  net_margin_ttm: 'fraction', roe_ttm: 'fraction', roa_ttm: 'fraction',
  revenue_growth_yoy: 'fraction', earnings_growth_yoy: 'fraction',
};
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const finiteOrNull = value => value === null || (typeof value === 'number' && Number.isFinite(value));
function exactKeys(value, keys, path, errors) {
  if (!object(value)) { errors.push(`${path}: objeto requerido`); return false; }
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${path}.${key}: campo no permitido`);
  for (const key of keys) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: campo requerido (null si se desconoce)`);
  return true;
}

/** Verifica forma e invariantes. No significa licencia, aprobación ni calidad acreditada. */
export function validateRecord(record, asOf) {
  const errors = [];
  if (!dateOnly(asOf)) return ['Fecha explícita de validación requerida'];
  const common = ['schema_version', 'asset_id', 'symbol', 'kind', 'source'];
  const annual = record?.kind === 'annual';
  const extra = annual ? ['statement', 'period_end', 'filed_on', 'currency', 'scale', 'values']
    : ['observed_on', 'values'];
  if (!exactKeys(record, [...common, ...extra], 'record', errors)) return errors;
  if (record.schema_version !== CONTRACT_VERSION) errors.push('schema_version: no admitida');
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(record.asset_id || '')) errors.push('asset_id: formato ISIN no válido');
  if (!SYMBOL.test(record.symbol || '')) errors.push('symbol: requiere mercado');
  if (!['annual', 'ratios'].includes(record.kind)) errors.push('kind: no admitido');
  const sourceKeys = ['provider', 'symbol', 'provider_updated_on', 'downloaded_at', 'raw_sha256'];
  if (exactKeys(record.source, sourceKeys, 'source', errors)) {
    if (record.source.provider !== 'EODHD' || record.source.symbol !== record.symbol) errors.push('source: origen/identidad incompatibles');
    const day = record.source.provider_updated_on;
    if (day !== null && (!dateOnly(day) || day > asOf)) errors.push('source.provider_updated_on: fecha no válida');
    const downloaded = record.source.downloaded_at;
    if (downloaded !== null && (typeof downloaded !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(downloaded)
      || !dateOnly(downloaded.slice(0, 10)) || !Number.isFinite(Date.parse(downloaded)) || downloaded.slice(0, 10) > asOf)) errors.push('source.downloaded_at: fecha no válida');
    if (!/^[a-f0-9]{64}$/.test(record.source.raw_sha256 || '')) errors.push('source.raw_sha256: huella requerida');
  }
  if (annual) {
    if (!Object.hasOwn(ANNUAL_FIELDS, record.statement || '')) errors.push('statement: no admitido');
    if (!dateOnly(record.period_end) || record.period_end > asOf) errors.push('period_end: fecha no válida o futura');
    if (record.filed_on !== null && (!dateOnly(record.filed_on) || record.filed_on > asOf || record.filed_on < record.period_end)) errors.push('filed_on: fecha incoherente');
    if (record.currency !== null && !/^[A-Z]{3}$/.test(record.currency)) errors.push('currency: formato no válido');
    if (![null, 1, 1000, 1000000].includes(record.scale)) errors.push('scale: no admitida');
    const keys = Object.hasOwn(ANNUAL_FIELDS, record.statement || '') ? ANNUAL_FIELDS[record.statement] : [];
    if (exactKeys(record.values, keys, 'values', errors)) for (const key of keys) {
      if (!finiteOrNull(record.values[key])) errors.push(`values.${key}: solo número finito o null`);
    }
  } else if (record.kind === 'ratios') {
    if (!dateOnly(record.observed_on) || record.observed_on > asOf) errors.push('observed_on: fecha no válida');
    if (exactKeys(record.values, Object.keys(RATIO_FIELDS), 'values', errors)) {
      for (const [key, unit] of Object.entries(RATIO_FIELDS)) {
        const metric = record.values[key];
        if (!exactKeys(metric, ['value', 'unit', 'period_end'], `values.${key}`, errors)) continue;
        if (!finiteOrNull(metric.value)) errors.push(`values.${key}.value: solo número finito o null`);
        if (metric.unit !== unit) errors.push(`values.${key}.unit: se requiere ${unit}`);
        if (metric.period_end !== null && (!dateOnly(metric.period_end) || metric.period_end > record.observed_on)) errors.push(`values.${key}.period_end: fecha no válida`);
      }
    }
  }
  return errors;
}

/** Bloqueos de uso de un estado monetario. No autoriza publicar un registro válido. */
export function dataLimitations(record) {
  const issues = [];
  if (record?.kind === 'annual') {
    if (!record.currency) issues.push('Moneda no acreditada para este ejercicio.');
    if (!record.scale) issues.push('Escala monetaria no acreditada.');
    if (object(record.values) && Object.values(record.values).every(value => value === null)) issues.push('Ejercicio sin cifras disponibles.');
  }
  if (!record?.source?.provider_updated_on) issues.push('Fecha del proveedor desconocida.');
  if (!record?.source?.downloaded_at) issues.push('Fecha de descarga específica de fundamentales desconocida.');
  return issues;
}

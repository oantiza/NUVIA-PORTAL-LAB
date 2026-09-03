// Instantánea de datos propios. Proyección positiva; ningún SDK, secreto o escritura remota.
import { projectCompany, dateOnly } from '../local/data.mjs';
import { matchIdentity } from '../local/coverage.mjs';
import { financialNumber } from '../src/lib/financial.js';
import { SCALE_NOTICE } from './metadata.mjs';

export const SNAPSHOT_SCHEMA = 'nuvia-company-alpha.v1';
const currency = value => /^[A-Z]{3}$/.test(value || '') ? value : null;

export function projectAlphaCompany(raw, symbol) {
  const company = projectCompany(raw, symbol);
  if (!company) return null;
  company.snapshotMetrics = Object.fromEntries(['MarketCapitalization', 'EarningsShare', 'DividendShare', 'DividendYield', 'BookValue'].map(key => [key, financialNumber(raw.Highlights?.[key])]));
  company.snapshotMetrics.EnterpriseValue = financialNumber(raw.Valuation?.EnterpriseValue);
  company.snapshotMetrics.PayoutRatio = financialNumber(raw.SplitsDividends?.PayoutRatio);
  // Solo BPA publicado: el fundador excluye PER, BPA y dividendos estimados (03-09-2026).
  company.earnings = Object.values(raw.Earnings?.History || {}).filter(e => e && financialNumber(e.epsActual) !== null)
    .map(e => ({ period: dateOnly(e.date), reportedAt: dateOnly(e.reportDate), currency: currency(e.currency), actual: financialNumber(e.epsActual) }))
    .sort((a, b) => (b.reportedAt || b.period || '').localeCompare(a.reportedAt || a.period || ''));
  for (const [name, statement] of Object.entries(company.statements)) {
    statement.rows = statement.rows.map(row => {
      const original = raw.Financials[name].yearly[row.period];
      return { ...row, currency: currency(original.currency_symbol), scale: null };
    });
  }
  // Fecha del empaquetado no equivale a descarga ni actualización del fundamental.
  company.source.downloadedAt = null;
  company.source.mode = 'Instantánea de archivos propios; sin actualización automática';
  company.warnings.push(SCALE_NOTICE);
  const closes = Object.values(company.statements).map(s => s.rows.at(-1)?.period).filter(Boolean);
  if (new Set(closes).size > 1) company.warnings.push('Los últimos cierres de resultados, balance y flujos no coinciden. Se mantienen separados; no representan un mismo ejercicio combinado.');
  if (Object.values(company.statements).some(s => s.rows.some(r => !r.currency))) {
    company.warnings.push('Hay ejercicios sin moneda declarada. No se sustituye por la divisa de cotización ni por la de otro ejercicio.');
  }
  if (/bank|insurance|financial/i.test(`${company.identity.sector} ${company.identity.industry}`)) {
    company.warnings.push('Entidad financiera: las métricas y estados requieren interpretación sectorial; no equivalen a una plantilla industrial.');
  }
  return company;
}

export function buildAlphaSnapshot({ assets, rawBySymbol, catalogObservedAt, preparedAt }) {
  if (!Array.isArray(assets) || !dateOnly(catalogObservedAt?.slice(0, 10)) || !dateOnly(preparedAt?.slice(0, 10))) throw new Error('Catálogo o fechas no válidos');
  const companies = Object.entries(rawBySymbol).map(([symbol, raw]) => projectAlphaCompany(raw, symbol)).filter(Boolean);
  for (const company of companies) {
    if (Object.values(company.statements).some(s => s.rows.some(r => r.period > preparedAt.slice(0, 10) || r.reportedAt > preparedAt.slice(0, 10)))) {
      company.warnings.push('El archivo contiene fechas posteriores a la preparación de esta copia. Consulta los cierres y fechas originales antes de interpretar la serie como histórica.');
    }
  }
  const seen = new Set();
  const entries = assets.map(asset => {
    if (!asset.asset_id || seen.has(asset.asset_id)) throw new Error('Identidad de catálogo ausente o duplicada');
    seen.add(asset.asset_id);
    const match = matchIdentity(asset, companies);
    return {
      assetId: asset.asset_id, symbol: asset.eodhd_symbol, name: asset.display_name,
      isin: asset.isin || asset.asset_id, quoteCurrency: asset.currency,
      state: match.status,
      company: match.status === 'matched' ? companies.find(c => c.symbol === asset.eodhd_symbol) : null,
      identityCandidates: match.candidates,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es') || a.symbol.localeCompare(b.symbol));
  return { schema: SNAPSHOT_SCHEMA, provider: 'EODHD', catalogObservedAt, preparedAt, entries };
}

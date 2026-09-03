// Lector de una muestra archivada. Sin red, SDK ni escritura.
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { dateOnly, projectCompany } from './data.mjs';
import { matchIdentity } from './coverage.mjs';
import { assertCatalogSnapshot, normalizeSample, sha256 } from './normalize.mjs';
import { validateRecord } from './contract.mjs';

const fields = {
  income: { revenue: 'Ingresos', gross_profit: 'Beneficio bruto', operating_income: 'Resultado operativo', net_income: 'Beneficio neto', ebitda: 'EBITDA' },
  balance: { assets: 'Activos', liabilities: 'Pasivos', equity: 'Patrimonio neto', cash: 'Efectivo', net_debt: 'Deuda neta', total_debt: 'Deuda total' },
  cash_flow: { operating_cash_flow: 'Flujo operativo', capex: 'Capex', free_cash_flow: 'Flujo de caja libre', dividends_paid: 'Dividendos pagados' },
};
const labels = { income: 'Cuenta de resultados', balance: 'Balance', cash_flow: 'Flujos de caja' };
const ratioLabels = { pe_ttm: 'PER (TTM)', price_sales_ttm: 'Precio / Ventas (TTM)', price_book_mrq: 'Precio / Valor contable (último trimestre)',
  ev_revenue: 'EV / Ventas', ev_ebitda: 'EV / EBITDA', operating_margin_ttm: 'Margen operativo (TTM)', net_margin_ttm: 'Margen neto (TTM)',
  roe_ttm: 'ROE (TTM)', roa_ttm: 'ROA (TTM)', revenue_growth_yoy: 'Ingresos trimestrales: variación interanual', earnings_growth_yoy: 'Beneficio trimestral: variación interanual' };
const unavailable = reason => ({ state: 'unavailable', publication_status: 'blocked', reason,
  message: 'La muestra no está disponible o no supera la verificación. No se sustituye por datos del archivo anterior. Revisa los archivos locales y reinicia la prueba.' });

function cell(value, currency, scale) {
  if (value === null) return { value: null, state: 'missing', reason: 'La fuente no proporciona este dato.' };
  const reasons = [];
  if (!currency) reasons.push('Moneda no acreditada');
  if (!scale) reasons.push('Escala no acreditada');
  if (reasons.length) return { value: null, state: 'blocked', reason: reasons.join(' · ') };
  const units = value * scale;
  return Number.isFinite(units) ? { value: units, state: 'reported', reason: 'Importe según metadatos de la copia, expresado en unidades de su moneda.' }
    : { value: null, state: 'blocked', reason: 'El importe excede la precisión admitida.' };
}

/** Proyección positiva: ningún importe bloqueado se entrega al navegador. */
export function buildReview(sample, evidence) {
  assertCatalogSnapshot(evidence);
  const generatedOn = sample?.generated_at?.slice(0, 10);
  if (sample?.schema !== 'nuvia-local-review-sample.v1' || sample.publication_status !== 'blocked'
    || !dateOnly(generatedOn) || !Array.isArray(sample.records) || !sample.records.length
    || sample.catalog_evidence?.observed_at !== evidence.at || sample.catalog_evidence?.live_rechecked !== false) throw new Error('Muestra incompatible');
  const grouped = new Map(), unique = new Set();
  for (const record of sample.records) {
    if (validateRecord(record, generatedOn).length) throw new Error('Contrato inválido');
    const asset = evidence.assets.find(a => a.asset_id === record.asset_id);
    if (!asset || asset.eodhd_symbol !== record.symbol || (asset.isin && asset.isin !== record.asset_id)) throw new Error('Identidad incompatible');
    const key = [record.symbol, record.kind, record.statement || '', record.period_end || 'snapshot'].join('|');
    if (unique.has(key)) throw new Error('Registro duplicado o instantánea ambigua');
    unique.add(key);
    if (!grouped.has(record.symbol)) grouped.set(record.symbol, { asset, records: [] });
    grouped.get(record.symbol).records.push(record);
  }
  const companies = [...grouped.values()].map(({ asset, records }) => {
    const first = records[0].source;
    if (records.some(r => !isDeepStrictEqual(r.source, first))) throw new Error('Fuentes mezcladas');
    const warnings = [];
    if (!first.downloaded_at) warnings.push('No consta la fecha de descarga específica de estos fundamentales.');
    if (!first.provider_updated_on) warnings.push('La fecha de actualización del proveedor no consta.');
    if (records.some(r => r.kind === 'annual' && !r.scale)) warnings.push('Importes pendientes: no se ha acreditado su escala. No se muestran como cantidades monetarias.');
    if (records.some(r => r.kind === 'annual' && !r.currency)) warnings.push('Hay ejercicios sin moneda acreditada; no se hereda de otros años ni de la cotización.');
    if (/bank|insurance|financial/i.test(`${asset.sector || ''} ${asset.industry || ''}`)) warnings.push('Entidad financiera: pertinencia e interpretación sectorial de las métricas pendientes de revisión.');
    if (/[ÃÂ�]/.test(asset.display_name || '')) warnings.push('El nombre de la fuente presenta posibles errores de codificación; pendiente de confirmar.');
    const statements = Object.entries(fields).map(([key, measures]) => ({ key, label: labels[key],
      fields: Object.entries(measures).map(([key, label]) => ({ key, label })),
      rows: records.filter(r => r.kind === 'annual' && r.statement === key).sort((a, b) => b.period_end.localeCompare(a.period_end))
        .map(r => ({ period: r.period_end, filedOn: r.filed_on, currency: r.currency, scale: r.scale,
          cells: Object.fromEntries(Object.keys(measures).map(key => [key, cell(r.values[key], r.currency, r.scale)])) })),
    }));
    if (new Set(statements.map(s => s.rows[0]?.period).filter(Boolean)).size > 1) warnings.push('Los últimos cierres de resultados, balance y caja no coinciden. No representan un único ejercicio combinado.');
    for (const s of statements) if (new Set(s.rows.map(r => r.currency).filter(Boolean)).size > 1) warnings.push(`${s.label}: hay monedas distintas entre ejercicios; no se comparan como una sola serie.`);
    const ratios = records.find(r => r.kind === 'ratios');
    return { symbol: asset.eodhd_symbol, assetId: asset.asset_id, name: asset.display_name || asset.eodhd_symbol,
      quoteCurrency: asset.currency || null, providerUpdatedOn: first.provider_updated_on, downloadedAt: first.downloaded_at,
      warnings, statements, ratios: ratios ? { observedOn: ratios.observed_on,
        items: Object.entries(ratioLabels).map(([key, label]) => ({ key, label, ...ratios.values[key] })) } : null };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es') || a.symbol.localeCompare(b.symbol));
  return { state: 'ready', publication_status: 'blocked', generatedOn, catalogObservedOn: evidence.asOf,
    companies, recordCount: sample.records.length };
}

const sampleDirectory = new URL('../../output/fundamentales-muestra/2026-09-03-SrbBSW/', import.meta.url);
const evidencePath = 'output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json';

/** Carpeta fija revisada: no acepta rutas del navegador ni elige el último archivo. */
export async function loadReviewSample({ read = readFile, now = new Date() } = {}) {
  try {
    const manifest = JSON.parse(await read(new URL('integridad.json', sampleDirectory), 'utf8'));
    const saved = {};
    for (const name of ['muestra.json', 'revision.json']) {
      const bytes = await read(new URL(name, sampleDirectory));
      if (sha256(bytes) !== manifest.files?.[name]) throw new Error('Huella incompatible');
      saved[name] = JSON.parse(bytes.toString('utf8'));
    }
    const sample = saved['muestra.json'];
    const created = new Date(sample.generated_at);
    if (!Number.isFinite(created.getTime()) || created > now || created.toISOString() !== sample.generated_at) throw new Error('Fecha incompatible');
    if (sample.catalog_evidence?.path !== evidencePath) throw new Error('Referencia de catálogo incompatible');
    const catalogBytes = await read(new URL(`../../${evidencePath}`, import.meta.url));
    if (sha256(catalogBytes) !== sample.catalog_evidence.sha256) throw new Error('Catálogo cambiado');
    const evidence = JSON.parse(catalogBytes.toString('utf8'));
    assertCatalogSnapshot(evidence);
    if (evidence.at > sample.generated_at) throw new Error('Catálogo posterior a muestra');
    // Reconstruir desde la fuente evita aceptar una muestra modificada junto a su manifiesto.
    for (const symbol of new Set(sample.records.map(r => r.symbol))) {
      const asset = evidence.assets.find(a => a.eodhd_symbol === symbol);
      if (!asset) throw new Error('Símbolo fuera del catálogo');
      const rawBytes = await read(new URL(`../../output/mercado-alfa/crudo/${symbol}.fundamentals.json`, import.meta.url));
      const regenerated = normalizeSample({ rawBytes, asset, symbol, observedOn: sample.generated_at.slice(0, 10) });
      if (!isDeepStrictEqual(regenerated.records, sample.records.filter(r => r.symbol === symbol))) throw new Error('Datos distintos de la fuente');
      const company = projectCompany(JSON.parse(rawBytes.toString('utf8')), symbol);
      if (!company || matchIdentity(asset, [company]).status !== 'matched') throw new Error('Identidad no confirmada');
      asset.sector = company.identity.sector; asset.industry = company.identity.industry;
    }
    return buildReview(sample, evidence);
  } catch (error) {
    return unavailable(error.code === 'ENOENT' ? 'missing_files' : 'verification_failed');
  }
}

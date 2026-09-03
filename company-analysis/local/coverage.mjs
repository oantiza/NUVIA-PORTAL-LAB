import { dateOnly } from './data.mjs';

const canonical = value => typeof value === 'string' ? value.trim().toUpperCase() : '';

/** Nunca se cruza por nombre o ticker sin mercado ni se acepta un ISIN distinto. */
export function matchIdentity(asset, companies) {
  if (asset.isin && canonical(asset.isin) !== canonical(asset.asset_id)) return { status: 'asset_identity_conflict', candidates: [] };
  const symbol = canonical(asset.eodhd_symbol);
  const isin = canonical(asset.isin || asset.asset_id);
  const candidates = companies.filter(c => (symbol && canonical(c.symbol) === symbol)
    || (isin && canonical(c.identity.isin) === isin));
  const evidence = candidates.map(c => ({ symbol: c.symbol, isin: c.identity.isin }));
  if (!candidates.length) return { status: 'missing', candidates: evidence };
  if (candidates.length > 1) return { status: 'ambiguous', candidates: evidence };
  const candidate = candidates[0];
  if (!isin || !canonical(candidate.identity.isin)) return { status: 'unconfirmed', candidates: evidence };
  if (canonical(candidate.identity.isin) !== isin) return { status: 'isin_conflict', candidates: evidence };
  if (!symbol || canonical(candidate.symbol) !== symbol) return { status: 'listing_conflict', candidates: evidence };
  if (canonical(candidate.identity.quoteCurrency) !== canonical(asset.currency) || !asset.currency) return { status: 'currency_conflict', candidates: evidence };
  return { status: 'matched', candidates: evidence };
}

/** Audita metadatos por ejercicio sin trasladar importes crudos al informe. */
export function auditRawPeriods(raw) {
  const rows = [];
  for (const [statement, block] of Object.entries(raw.Financials || {})) {
    for (const [period, row] of Object.entries(block?.yearly || {})) {
      if (!row || typeof row !== 'object') continue;
      rows.push({ statement, period, rowDate: row.date || null, filedOn: row.filing_date || null,
        blockCurrency: block.currency_symbol || null, rowCurrency: row.currency_symbol || null });
    }
  }
  return { rows: rows.length, missingFilingDate: rows.filter(r => !r.filedOn).length,
    inconsistentDates: rows.filter(r => r.rowDate && r.rowDate !== r.period),
    currencyDifferences: rows.filter(r => r.rowCurrency && r.rowCurrency !== r.blockCurrency),
    missingRowCurrency: rows.filter(r => !r.rowCurrency).length };
}

export function auditCompany(company, asOf) {
  if (!dateOnly(asOf)) throw new Error('Fecha de revisión no válida');
  const statements = Object.fromEntries(Object.entries(company.statements).map(([name, statement]) => {
    const latest = statement.rows.at(-1);
    const measureKeys = Object.keys(latest || {}).filter(key => !['period', 'reportedAt'].includes(key));
    const emptyRows = statement.rows.filter(row => Object.entries(row)
      .filter(([key]) => !['period', 'reportedAt'].includes(key)).every(([, value]) => value === null));
    return [name, { currency: statement.currency, years: statement.rows.length,
      latestPeriod: latest?.period || null, latestFiling: latest?.reportedAt || null,
      ageDays: latest ? Math.floor((Date.parse(asOf) - Date.parse(latest.period)) / 86400000) : null,
      futurePeriods: statement.rows.filter(row => row.period > asOf).map(row => row.period),
      futureFilings: statement.rows.filter(row => row.reportedAt && row.reportedAt > asOf).map(row => row.reportedAt),
      missingLatest: measureKeys.filter(key => latest[key] === null), emptyPeriods: emptyRows.map(row => row.period),
      missingFilingCount: statement.rows.filter(row => !row.reportedAt).length,
    }];
  }));
  return { symbol: company.symbol, name: company.identity.name, isin: company.identity.isin,
    sector: company.identity.sector, industry: company.identity.industry,
    quoteCurrency: company.identity.quoteCurrency, source: company.source, warnings: company.warnings,
    statements, missingMetrics: Object.entries(company.metrics).filter(([, value]) => value === null).map(([key]) => key),
    missingMultiples: Object.entries(company.multiples).filter(([, value]) => value === null).map(([key]) => key),
    // Indicación técnica de revisión sectorial, nunca una calificación financiera.
    sectorReview: /bank|insurance|financial/i.test(`${company.identity.sector} ${company.identity.industry}`),
  };
}

export function compareCoverage(assets, companies, asOf) {
  const seen = new Set();
  for (const asset of assets) {
    if (!asset.asset_id || seen.has(asset.asset_id)) throw new Error('Identidad de catálogo ausente o duplicada');
    seen.add(asset.asset_id);
  }
  const matches = assets.map(asset => ({ asset_id: asset.asset_id, name: asset.display_name,
    symbol: asset.eodhd_symbol, isin: asset.isin, ...matchIdentity(asset, companies) }));
  const linked = new Set(matches.flatMap(match => match.candidates.map(c => c.symbol)));
  const counts = {};
  for (const match of matches) counts[match.status] = (counts[match.status] || 0) + 1;
  return { counts, matches, unlinkedLocal: companies.filter(c => !linked.has(c.symbol))
    .map(c => ({ symbol: c.symbol, isin: c.identity.isin, name: c.identity.name })),
    localAudit: companies.map(c => auditCompany(c, asOf)) };
}

// Correspondencias documentadas y autorizadas por el fundador el 03-09-2026.
// Resuelven referencias; nunca ajustan cantidades, pesos ni precios.
export const CAMBIOS_IDENTIDAD = Object.freeze([
  Object.freeze({ old: 'ES0105046009', current: 'ES0105046017', symbol: 'AENA.MC', effective: '2025-06-19',
    note: 'Aena cambió de ISIN el 19-06-2025 por un desdoblamiento de 1 acción en 10. Los precios históricos ya están ajustados por el proveedor; no se aplica otro ajuste.',
    source: 'https://www.bolsasymercados.es/dam/descargas/regulacion/renta-variable/bolsa-madrid/notas/2025/split-aena-aviso.pdf' }),
  Object.freeze({ old: 'ES0118900010', current: 'NL0015001FS8', symbol: 'FER.MC', effective: '2023-06-16',
    note: 'Ferrovial cambió de ISIN el 16-06-2023 por la fusión con canje de 1 acción por 1. La serie del proveedor incluye historia anterior a la sucesión; el nombre de origen puede conservar la denominación antigua.',
    source: 'https://www.ice.com/publicdocs/liffe/corporate_actions/2023/CA-2023-199-Lo.pdf' }),
]);
export const cambioIdentidad = id => CAMBIOS_IDENTIDAD.find(c => c.old === id || c.current === id) || null;
export const idActual = id => cambioIdentidad(id)?.current || id;
export const idsEquivalentes = id => { const c = cambioIdentidad(id); return c ? [c.old, c.current] : [id]; };

export function filaActual(row) {
  const c = cambioIdentidad(row.asset_id);
  return c && row.asset_id === c.old && row.instrument_type === 'STOCK' && row.eodhd_symbol === c.symbol && row.divisa === 'EUR'
    ? { ...row, asset_id: c.current } : row;
}

export function catalogoActual(items) {
  const seen = new Set();
  return items.flatMap(item => {
    const c = cambioIdentidad(item.asset_id);
    const next = c && (!item.isin || idsEquivalentes(c.current).includes(item.isin))
      && item.instrument_type === 'STOCK' && item.ticker === c.symbol.split('.')[0]
      ? { ...item, asset_id: c.current, isin: c.current } : item;
    if (seen.has(next.asset_id)) return [];
    seen.add(next.asset_id); return [next];
  });
}

export function entradaActual(entry) {
  const c = cambioIdentidad(entry.assetId);
  if (!c || entry.assetId !== c.old || entry.isin !== c.old || entry.symbol !== c.symbol || entry.quoteCurrency !== 'EUR') return entry;
  // No reasignar un respaldo de la identidad antigua a la nueva.
  return { ...entry, assetId: c.current, isin: c.current, company: null, state: 'missing',
    identityCandidates: [{ symbol: c.symbol, isin: c.current }] };
}

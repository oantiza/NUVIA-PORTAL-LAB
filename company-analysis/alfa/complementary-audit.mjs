// Solo diagnóstico. No proyecta datos hacia la web ni hacia la base.
const record = value => value && typeof value === 'object' && !Array.isArray(value);
export function dateStatus(value, asOf) {
  if (value == null || value === '') return { state: 'missing', date: null };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) return { state: 'invalid', date: null };
  return { state: value > asOf ? 'future' : 'pastOrToday', date: value };
}
const finite = value => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(Number(value));
export function inspectComplementary(raw, entry, asOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || dateStatus(asOf, asOf).state === 'invalid') throw new Error('Fecha de observación no válida');
  if (raw?.General?.ISIN !== entry.isin || `${raw?.General?.Code}.${raw?.General?.Exchange}` !== entry.symbol || raw.General.Type !== 'Common Stock') {
    return { state: 'identityMismatch' };
  }
  const institutions = raw.Holders?.Institutions;
  const records = Object.values(record(institutions) || Array.isArray(institutions) ? institutions : {});
  const rows = records.filter(record);
  const validDate = row => ['pastOrToday', 'future'].includes(dateStatus(row.date, asOf).state);
  // No se exporta name, datos de contacto, identificadores de personas ni transacciones.
  return {
    state: 'matched', providerUpdated: dateStatus(raw.General.UpdatedAt, asOf),
    dividendDate: dateStatus(raw.SplitsDividends?.DividendDate, asOf),
    exDividendDate: dateStatus(raw.SplitsDividends?.ExDividendDate, asOf),
    institutions: {
      containerState: institutions == null ? 'missing' : record(institutions) || Array.isArray(institutions) ? 'readable' : 'invalid',
      sourceRows: records.length, objectRows: rows.length,
      namedRows: rows.filter(row => typeof row.name === 'string' && row.name.trim()).length,
      datedRows: rows.filter(validDate).length,
      futureDatedRows: rows.filter(row => dateStatus(row.date, asOf).state === 'future').length,
      percentageRows: rows.filter(row => finite(row.totalShares)).length,
      shareCountRows: rows.filter(row => finite(row.currentShares)).length,
      dates: [...new Set(rows.map(row => dateStatus(row.date, asOf).date).filter(Boolean))].sort(),
      // La mera pertenencia a Institutions no certifica la naturaleza jurídica.
      namesExported: false, legalNatureVerified: false,
    },
  };
}

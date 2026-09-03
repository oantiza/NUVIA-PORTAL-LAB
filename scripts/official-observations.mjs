// Lectura numérica estricta: un hueco de una fuente oficial nunca equivale a cero.
export function officialNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function eurostatObservations(payload) {
  const index = payload?.dimension?.time?.category?.index;
  if (!index || !payload?.value) return [];
  return Object.entries(index)
    .map(([period, position]) => ({ period, value: officialNumber(payload.value[String(position)]) }))
    .filter(row => row.value !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function ecbObservations(header, rows) {
  const timeColumn = header.indexOf('TIME_PERIOD'), valueColumn = header.indexOf('OBS_VALUE');
  if (timeColumn < 0 || valueColumn < 0) return [];
  return rows.map(row => ({ period: row[timeColumn], value: officialNumber(row[valueColumn]) }))
    .filter(row => row.period && row.value !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
}

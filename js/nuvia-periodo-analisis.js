/** Presentación del historial utilizado; no altera series ni calcula fechas. */
function fechaIso(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function periodoAnalizado(dates) {
  if (!Array.isArray(dates) || dates.length < 2) return null;
  if (!dates.every((date, index) => fechaIso(date) && (index === 0 || date > dates[index - 1]))) return null;
  return { desde: dates[0], hasta: dates.at(-1), cierres: dates.length };
}

const fechaVisible = iso => iso.split('-').reverse().join('/');
export function fuenteDelAnalisis(dates, observaciones) {
  const periodo = periodoAnalizado(dates);
  const detalle = periodo
    ? `Historial utilizado: del ${fechaVisible(periodo.desde)} al ${fechaVisible(periodo.hasta)}.`
    : 'Periodo del historial no disponible.';
  const recuento = Number.isInteger(observaciones) && observaciones >= 0
    ? ` ${observaciones} ${observaciones === 1 ? 'observación' : 'observaciones'}.` : '';
  return `Datos de cierre, base de datos NUVIA, en euros. ${detalle}${recuento}`;
}

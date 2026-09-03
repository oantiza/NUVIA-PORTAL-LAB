// Validador puro: este módulo también se ejecuta en el navegador.
const dateOnly = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// El proveedor no acredita cuatro publicaciones por ejercicio. Filtrar por el
// periodo comunicado, no por su fecha de publicación ni por cantidad de filas.
export function earningsWindow(earnings = [], limit = 5) {
  if (!['5', '10', 'all'].includes(String(limit))) throw new Error('Ventana de BPA no válida');
  const dated = earnings.filter(row => dateOnly(row.period));
  const undated = earnings.filter(row => !dateOnly(row.period));
  dated.sort((a, b) => b.period.localeCompare(a.period) || (b.reportedAt || '').localeCompare(a.reportedAt || ''));
  const through = dated[0]?.period || null;
  let after = null;
  if (through && limit !== 'all') {
    const [year, month, day] = through.split('-').map(Number);
    const first = new Date(0);
    first.setUTCFullYear(year - Number(limit), month, 0);
    first.setUTCDate(Math.min(day, first.getUTCDate()));
    after = first.toISOString().slice(0, 10);
  }
  return { rows: [...dated.filter(row => !after || row.period > after), ...undated],
    after, through, undated: undated.length, total: earnings.length };
}

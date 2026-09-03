// Interpretación estricta: vacío, NA, booleano e infinito no son cero.
export function financialNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function marginPercent(profit, revenue) {
  const a = financialNumber(profit), b = financialNumber(revenue);
  if (a === null || b === null || b === 0) return null;
  const result = a / b * 100;
  return Number.isFinite(result) ? result : null;
}

// Oráculo de prueba independiente: no importa fórmulas del producto.
import assert from 'node:assert/strict';

export function calculaMetodosIndependientes(series, pesos) {
  const usadas = series.filter(s => pesos[s.asset_id] > 0);
  assert.equal(usadas.length, Object.values(pesos).filter(w => w > 0).length);
  assert.ok(usadas.length > 0);
  const n = usadas[0].values.length;
  assert.ok(n >= 3);
  assert.ok(usadas.every(s => s.values.length === n && s.values.every(v => Number.isFinite(v) && v > 0)));
  const total = usadas.reduce((sum, s) => sum + pesos[s.asset_id], 0);
  const weights = usadas.map(s => pesos[s.asset_id] / total);
  const levels = usadas.map(s => s.values.map(v => v / s.values[0]));
  const returns = levels.map(values => values.slice(1).map((v, i) => v / values[i] - 1));
  const annual = values => (values.at(-1) / values[0]) ** (252 / (n - 1)) - 1;
  const deviation = values => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1) * 252);
  };
  const buyHold = Array.from({ length: n }, (_, t) => levels.reduce((sum, values, i) => sum + weights[i] * values[t], 0));
  const dailyFixed = Array.from({ length: n - 1 }, (_, t) => returns.reduce((sum, values, i) => sum + weights[i] * values[t], 0));
  const vols = returns.map(deviation);
  // sd(sum(w*r)) equivale a sqrt(w' Cov w); contraste sin el camino de Pearson del producto.
  return {
    historial: { rentabilidad: annual(buyHold), volatilidad: deviation(buyHold.slice(1).map((v, i) => v / buyHold[i] - 1)) },
    modelo: { rentabilidad: levels.reduce((sum, values, i) => sum + weights[i] * annual(values), 0), volatilidad: deviation(dailyFixed) },
    rebalanceoDiario: { rentabilidad: dailyFixed.reduce((capital, r) => capital * (1 + r), 1) ** (252 / (n - 1)) - 1 },
    sinDiversificar: vols.reduce((sum, vol, i) => sum + vol * weights[i], 0),
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serieCartera } from '../js/nuvia-constructor.js';
import { metricasDesdeSerie, correlacionesDesdeSeries, estableceCorrelaciones } from '../js/nuvia-cartera.js';
import { activosParaFrontera, puntoCarteraFrontera, ahorroDeSeries, filasComparacionMetodos, TEXTO_HISTORIAL, TEXTO_FRONTERA, textoAhorro } from '../js/nuvia-analisis.js';
import { calculaMetodosIndependientes } from './fixtures/model-methods.mjs';
import { separaVerticalmente } from '../js/nuvia-etiquetas.js';

const cerca = (actual, esperado) => assert.ok(Math.abs(actual - esperado) < 0.0002, `${actual} frente a ${esperado}`);
function fixture() {
  return { pesos: { A: .25, B: .25, C: .25, D: .25 }, series: [0,1,2,3].map((asset, i) => {
    const values = [100];
    for (let t = 1; t <= 756; t++) values.push(values.at(-1) * (1 + (i < 2 ? .002 : .0001) + Math.sin(t * (i + 1)) * (i < 2 ? .03 : .003)));
    return { asset_id: 'ABCD'[asset], values };
  }) };
}

test('cuatro activos: cada método coincide con su cálculo independiente, no entre sí', () => {
  const { series, pesos } = fixture(), before = structuredClone({ series, pesos });
  const expected = calculaMetodosIndependientes(series, pesos);
  const actual = metricasDesdeSerie(serieCartera(series, pesos));
  estableceCorrelaciones(correlacionesDesdeSeries(series.map(s => ({ id:s.asset_id, niveles:s.values }))));
  try {
    const point = puntoCarteraFrontera(activosParaFrontera(series, pesos), pesos);
    const ahorro = ahorroDeSeries(series, pesos);
    cerca(actual.rentabilidadAnualizada, expected.historial.rentabilidad);
    cerca(actual.volatilidad, expected.historial.volatilidad);
    cerca(point.rentabilidad, expected.modelo.rentabilidad);
    cerca(point.volatilidad, expected.modelo.volatilidad);
    cerca(ahorro.volatilidad, point.volatilidad);
    cerca(ahorro.sinDiversificar, expected.sinDiversificar);
    assert.ok(Math.abs(actual.rentabilidadAnualizada - point.rentabilidad) > .01);
    assert.ok(Math.abs(actual.volatilidad - point.volatilidad) > .005);
    // La diferencia debe superar holgadamente la tolerancia de redondeo del motor.
    assert.ok(Math.abs(point.rentabilidad - expected.rebalanceoDiario.rentabilidad) > .001);
    assert.deepEqual(filasComparacionMetodos(actual, point).map(f => [f.rentabilidad, f.volatilidad]),
      [[actual.rentabilidadAnualizada, actual.volatilidad], [point.rentabilidad, point.volatilidad]]);
    assert.deepEqual({ series, pesos }, before);
  } finally { estableceCorrelaciones(null); }
});

test('los métodos pueden coincidir: no se fuerza una diferencia', () => {
  const { series } = fixture(); series[1].values = [...series[0].values];
  const pair = series.slice(0,2), pesos = { A:.5, B:.5 };
  estableceCorrelaciones(correlacionesDesdeSeries(pair.map(s => ({ id:s.asset_id, niveles:s.values }))));
  try {
    const m = metricasDesdeSerie(serieCartera(pair, pesos));
    const p = puntoCarteraFrontera(activosParaFrontera(pair,pesos),pesos);
    cerca(m.rentabilidadAnualizada,p.rentabilidad); cerca(m.volatilidad,p.volatilidad);
  } finally { estableceCorrelaciones(null); }
});

test('comparador conserva pérdidas y ceros; los datos ausentes no se rellenan', () => {
  assert.deepEqual(filasComparacionMetodos({rentabilidadAnualizada:-.1,volatilidad:0},{rentabilidad:0,volatilidad:.05})
    .map(f => [f.rentabilidad,f.volatilidad]), [[-.1,0],[0,.05]]);
  assert.ok(filasComparacionMetodos(null,{rentabilidad:NaN,volatilidad:Infinity})
    .every(f => f.rentabilidad === null && f.volatilidad === null));
});

test('la interfaz declara ambos métodos y pasa las métricas reales a la comparación', () => {
  const constructor = readFileSync(new URL('../js/nuvia-constructor.js',import.meta.url),'utf8');
  const analysis = readFileSync(new URL('../js/nuvia-analisis.js',import.meta.url),'utf8');
  assert.match(constructor,/nv-cons__nota.*TEXTO_HISTORIAL/);
  assert.match(analysis,/grupoFrontera\(\{\s*series, pesos, interactiva: esSuscriptor, nombreDe, tasaSinRiesgo, metricas/);
  assert.match(analysis,/filasComparacionMetodos\(metricas, puntoActual\)/);
  assert.match(analysis,/Dos métodos, los mismos datos/);
  assert.match(TEXTO_HISTORIAL,/sin rebalanceo/);
  assert.match(TEXTO_FRONTERA,/4\.000 mezclas/);
  assert.match(TEXTO_FRONTERA,/media ponderada/);
  assert.match(TEXTO_FRONTERA,/No es la rentabilidad realizada/);
  assert.match(textoAhorro({volatilidad:.064,sinDiversificar:.08,ahorro:.016}),/pesos constantes/);
  assert.doesNotMatch(TEXTO_FRONTERA,/cualquier otra mezcla quedó por debajo/);
});

test('los rótulos próximos se separan sin mover los puntos de la frontera', () => {
  const posiciones = [300,188,187], before = [...posiciones];
  const alturas = separaVerticalmente(posiciones,24,44,338);
  const orden = [...alturas].sort((a,b)=>a-b);
  assert.ok(orden.every((y,i)=>y>=44 && y<=338 && (!i || y-orden[i-1]>=24)));
  assert.deepEqual(posiciones,before);
  const code=readFileSync(new URL('../js/nuvia-analisis.js',import.meta.url),'utf8');
  assert.match(code,/separaVerticalmente\(rotulos\.map\(r => r\.deseada\), 24/);
});

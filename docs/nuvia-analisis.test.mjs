/**
 * Batería del análisis ampliado del nivel registrado (paso 32).
 *
 * Sin red ni DOM: se prueban los helpers puros de js/nuvia-analisis.js —
 * el formato de posiciones para los módulos de concentración, la selección
 * de fondos para el solapamiento, el ahorro por diversificar sobre series
 * sintéticas y los textos (llanos, con la calidad declarada y sin consejo).
 *
 *   node docs/nuvia-analisis.test.mjs
 */
import {
  etiquetaClave, posicionesParaAnalisis, idsDeFondos,
  ahorroDeSeries, textoAhorro, textoCalidad, carteraDesdeHoldings,
  NOTA_ANALISIS_CERRADO, FUENTE_ANALISIS,
} from '../js/nuvia-analisis.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

console.log('— Formatos de entrada —');
{
  const posiciones = [
    { activo: { asset_id: 'A', instrument_type: 'FUND' }, bruto: 60 },
    { activo: { asset_id: 'B', instrument_type: 'STOCK' }, bruto: 20 },
    { activo: { asset_id: 'C', instrument_type: 'ETF' }, bruto: 20 },
    { activo: { asset_id: 'D', instrument_type: 'FUND' }, bruto: 10 }, // fuera de pesos
  ];
  const pesos = { A: 0.6, B: 0.2, C: 0.2 };
  const paraAnalisis = posicionesParaAnalisis(posiciones, pesos);
  comprueba('Solo entran las posiciones con peso, en formato asset_id + weight_percent 0–100',
    paraAnalisis.length === 3 && paraAnalisis[0].weight_percent === 60
    && paraAnalisis.every((p) => Object.keys(p).sort().join(',') === 'asset_id,weight_percent'));
  comprueba('Sin pesos, no hay nada que analizar', posicionesParaAnalisis(posiciones, null).length === 0);
  comprueba('Fondos y ETF son los únicos con desglose que comparar',
    idsDeFondos(posiciones).join(',') === 'A,C,D');
}

console.log('\n— Etiquetas de clave —');
comprueba('technology → Technology (aseada, sin traducir: nunca se inventa)',
  etiquetaClave('technology') === 'Technology');
comprueba('north_america → North america', etiquetaClave('north_america') === 'North america');
comprueba('Clave vacía → «—»', etiquetaClave('') === '—');

console.log('\n— Ahorro por diversificar (series sintéticas) —');
{
  // Dos series que suben y bajan EN CONTRA la una de la otra: diversificar ahorra mucho.
  const n = 120;
  const contra = [];
  const a = [100]; const b = [100];
  for (let t = 1; t < n; t += 1) {
    const paso = (t % 2 === 0) ? 0.01 : -0.009;
    a.push(Number((a[t - 1] * (1 + paso)).toFixed(6)));
    b.push(Number((b[t - 1] * (1 - paso)).toFixed(6)));
  }
  const series = [{ asset_id: 'A', values: a }, { asset_id: 'B', values: b }];
  const pesos = { A: 0.5, B: 0.5 };
  const r = ahorroDeSeries(series, pesos);
  comprueba('Con dos series opuestas, la volatilidad conjunta es mucho menor que la media',
    r && r.volatilidad < r.sinDiversificar * 0.35, r && `vol=${r.volatilidad} sin=${r.sinDiversificar}`);
  comprueba('El ahorro es la diferencia entre ambas', r && Math.abs(r.ahorro - (r.sinDiversificar - r.volatilidad)) < 1e-9);

  // La misma serie dos veces (ρ=1): diversificar no ahorra nada.
  const iguales = [{ asset_id: 'A', values: a }, { asset_id: 'B', values: a }];
  const r2 = ahorroDeSeries(iguales, pesos);
  comprueba('Con dos series idénticas el ahorro es ~0', r2 && Math.abs(r2.ahorro) < 1e-3, r2 && `ahorro=${r2.ahorro}`);

  comprueba('Con una sola posición no hay diversificación que medir',
    ahorroDeSeries([{ asset_id: 'A', values: a }], { A: 1 }) === null);
  comprueba('Serie plana (σ indefinida en el par) → null, nunca se inventa',
    ahorroDeSeries([{ asset_id: 'A', values: a }, { asset_id: 'B', values: new Array(n).fill(100) }], pesos) === null);

  const texto = textoAhorro(r);
  comprueba('La lectura del ahorro lleva las tres cifras y explica la diferencia',
    texto.includes('%') && texto.includes('diversificar') && texto.includes('diferencia'));
}

console.log('\n— Desgloses reales de producción → forma del módulo de solapamiento —');
{
  // Documento REAL de get_asset_holdings en producción (paso 32).
  const real = {
    as_of_date: '2026-06-30',
    asset_id: 'ES0162332037',
    holdings: [
      { holding_name: 'Apple Inc', holding_weight: 5.25, holding_weight_unit: 'percent', identifiers: { isin: 'US0378331005', ticker: 'AAPL' }, country: 'US', raw_source: { name: 'APPLE INC', weight: 5.25 } },
      { holding_name: 'Euro Fx Future Sept 26', holding_weight: 8.81004, holding_weight_unit: 'percent', identifiers: {}, raw_source: { name: 'EURO FX FUTURE', weight: 8.81004 } },
    ],
  };
  const c = carteraDesdeHoldings(real);
  comprueba('La forma real (holding_name/holding_weight/identifiers) se traduce a name/isin/ticker/weight_pct',
    c && c.holdings.length === 2
    && c.holdings[0].name === 'Apple Inc' && c.holdings[0].isin === 'US0378331005'
    && c.holdings[0].ticker === 'AAPL' && c.holdings[0].weight_pct === 5.25
    && c.holdings[1].name === 'Euro Fx Future Sept 26' && c.holdings[1].isin === undefined);
  comprueba('La forma corta ya correcta pasa tal cual',
    carteraDesdeHoldings({ holdings: [{ name: 'Apple', isin: 'US0378331005', weight_pct: 50 }] })
      .holdings[0].weight_pct === 50);
  comprueba('Sin nombre por ningún lado, la fila se descarta',
    carteraDesdeHoldings({ holdings: [{ holding_weight: 10, holding_weight_unit: 'percent', identifiers: {} }] }) === null);
  comprueba('Peso en una unidad que no es porcentaje → se descarta, nunca se convierte a ojo',
    carteraDesdeHoldings({ holdings: [{ holding_name: 'X', holding_weight: 0.05, holding_weight_unit: 'fraction' }] }) === null);
  comprueba('Si falta holding_name, vale el nombre de raw_source',
    carteraDesdeHoldings({ holdings: [{ raw_source: { name: 'APPLE INC' }, holding_weight: 5 }] })
      .holdings[0].name === 'APPLE INC');
  comprueba('Documento nulo o sin filas útiles → null (sin datos, se declara)',
    carteraDesdeHoldings(null) === null && carteraDesdeHoldings({ holdings: [] }) === null);
}

console.log('\n— Calidad del dato, declarada (bases §2) —');
comprueba('lookthrough → desglose real', textoCalidad({ calidad: 'lookthrough' }).includes('desglose real'));
comprueba('estimated → lo dice tal cual', textoCalidad({ calidad: 'estimated' }).includes('estimación por heurística'));
comprueba('mixed → declara el % estimado', textoCalidad({ calidad: 'mixed', pesoEstimado: 40 }).includes('40'));
comprueba('none → nada que declarar (la sección lo dice aparte)', textoCalidad({ calidad: 'none' }) === null);

console.log('\n— Textos del bloque —');
comprueba('El aviso sin sesión describe qué se abre, sin empujar a nadie',
  NOTA_ANALISIS_CERRADO.includes('sesión iniciada') && NOTA_ANALISIS_CERRADO.includes('análisis ampliado')
  && !/regístrate|hazte|no te pierdas|aprovecha/i.test(NOTA_ANALISIS_CERRADO));
comprueba('La fuente cita la base de datos NUVIA y la ventana del historial',
  FUENTE_ANALISIS.includes('base de datos NUVIA') && FUENTE_ANALISIS.includes('3 años'));
comprueba('Ningún texto aconseja (sin mejor/recomendado/óptimo/conviene/deberías/ideal)',
  ![NOTA_ANALISIS_CERRADO, FUENTE_ANALISIS, textoCalidad({ calidad: 'estimated' })]
    .some((t) => /mejor|recomendad|óptim|conviene|deberías|ideal para/i.test(t || '')));

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: análisis ampliado del nivel registrado (paso 32).');

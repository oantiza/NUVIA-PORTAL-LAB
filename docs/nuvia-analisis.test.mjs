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
  activosParaFrontera, filasProyeccion, puntosAbanico, puntosMapaRiesgo,
  tramoEficiente, contribucionesRiesgo, paresDestacados, fraseCorrelacion,
  caminoSuave, envolventeConcava, suavizaEsquinas, puntosSenalados, perfilesReferencia,
  perfilCarteraSupuestos,
  NOTA_ANALISIS_CERRADO, FUENTE_ANALISIS, NOTA_ANALISIS_SUSCRIPTOR,
  TEXTO_FRONTERA, TEXTO_PROYECCION, TEXTO_CORRELACIONES,
} from '../js/nuvia-analisis.js';
import { proyeccionMonteCarlo } from '../js/nuvia-cartera.js';

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

console.log('\n— Frontera y proyección (paso 33) —');
{
  const n = 260;
  const serie = (paso) => {
    const o = [100];
    for (let t = 1; t < n; t += 1) o.push(Number((o[t - 1] * (1 + paso * ((t % 3) - 1))).toFixed(6)));
    return o;
  };
  const series = [
    { asset_id: 'A', values: serie(0.01) },
    { asset_id: 'B', values: serie(0.008) },
    { asset_id: 'C', values: serie(0.012) }, // sin peso: fuera
  ];
  const activos = activosParaFrontera(series, { A: 0.5, B: 0.5 });
  comprueba('Solo entran los activos con peso, con su rentabilidad anualizada',
    activos.length === 2 && activos.every((a) => Number.isFinite(a.rentabilidad))
    && activos.map((a) => a.id).join(',') === 'A,B');
  comprueba('Sin pesos, no hay frontera que montar', activosParaFrontera(series, null).length === 0);

  const proyeccion = proyeccionMonteCarlo({ rentabilidad: 0.04, volatilidad: 0.12, anos: 10 });
  const filas = filasProyeccion(proyeccion);
  comprueba('La tabla de la proyección enseña los años 1, 3, 5 y 10',
    filas.map((f) => f.ano).join(',') === '1,3,5,10');
  comprueba('Con horizonte corto, solo los años que existen',
    filasProyeccion(proyeccionMonteCarlo({ rentabilidad: 0.04, volatilidad: 0.12, anos: 4 }))
      .map((f) => f.ano).join(',') === '1,3');
  comprueba('Sin proyección → sin filas, nunca se inventa', filasProyeccion(null).length === 0);
}

console.log('\n— Textos del bloque —');
comprueba('El aviso sin sesión describe qué se abre, sin empujar a nadie',
  NOTA_ANALISIS_CERRADO.includes('sesión iniciada') && NOTA_ANALISIS_CERRADO.includes('análisis ampliado')
  && !/regístrate|hazte|no te pierdas|aprovecha/i.test(NOTA_ANALISIS_CERRADO));
comprueba('La fuente cita la base de datos NUVIA y la ventana del historial',
  FUENTE_ANALISIS.includes('base de datos NUVIA') && FUENTE_ANALISIS.includes('3 años'));
comprueba('La proyección se declara simulación y niega ser previsión',
  TEXTO_PROYECCION.includes('no es una previsión') && TEXTO_PROYECCION.includes('supuestos'));
comprueba('La frontera se declara historial, no futuro',
  TEXTO_FRONTERA.includes('historial') && TEXTO_FRONTERA.includes('no el futuro'));
comprueba('La nota del suscriptor dice que aún no puede contratarse',
  NOTA_ANALISIS_SUSCRIPTOR.includes('aún no abierto'));
comprueba('Ningún texto aconseja (sin mejor/recomendado/óptimo/conviene/deberías/ideal)',
  ![NOTA_ANALISIS_CERRADO, FUENTE_ANALISIS, NOTA_ANALISIS_SUSCRIPTOR, TEXTO_FRONTERA,
    TEXTO_PROYECCION, TEXTO_CORRELACIONES, textoCalidad({ calidad: 'estimated' })]
    .some((t) => /mejor|recomendad|óptim|conviene|deberías|ideal para/i.test(t || '')));

console.log('\n— El abanico de la proyección (paso 40) —');
{
  const proyeccion = proyeccionMonteCarlo({ rentabilidad: 0.05, volatilidad: 0.12 });
  const ab = puntosAbanico(proyeccion);
  comprueba('El abanico ancla el año 0 en la base y trae una senda por percentil',
    ab && ab.anos[0] === 0 && ab.p5[0] === 100 && ab.p50[0] === 100 && ab.p95[0] === 100
    && ab.anos.length === proyeccion.anos.length + 1
    && ab.p5.length === ab.anos.length && ab.p95.length === ab.anos.length);
  comprueba('En cada año el percentil 5 queda por debajo de la mediana y esta del 95',
    ab.anos.every((_, i) => ab.p5[i] <= ab.p50[i] && ab.p50[i] <= ab.p95[i]));
  comprueba('Sin proyección no hay abanico', puntosAbanico(null) === null);
}

console.log('\n— El mapa riesgo/rentabilidad (paso 41) —');
{
  const sube = Array.from({ length: 60 }, (_, i) => 1 + i * 0.002);
  const plano = Array.from({ length: 60 }, () => 1);
  const series = [
    { asset_id: 'A', values: sube },
    { asset_id: 'B', values: plano },
    { asset_id: 'C', values: [1] },
    { asset_id: 'FUERA', values: sube },
  ];
  const { puntos, sinMetrica } = puntosMapaRiesgo(series, { A: 0.5, B: 0.3, C: 0.2 });
  comprueba('Cada activo del cálculo sale con su volatilidad y su rentabilidad',
    puntos.length === 2 && puntos.every((p) => Number.isFinite(p.volatilidad) && Number.isFinite(p.rentabilidad)));
  comprueba('El activo sin historial queda declarado, no dibujado a ciegas',
    sinMetrica.length === 1 && sinMetrica[0] === 'C');
  comprueba('El activo fuera de los pesos no entra en el mapa',
    !puntos.some((p) => p.id === 'FUERA'));
  comprueba('Sin series no revienta', puntosMapaRiesgo(null, {}).puntos.length === 0);
}

console.log('\n— El tramo eficiente de la frontera (Fase 7) —');
{
  const cruda = [
    { volatilidad: 0.10, rentabilidad: 0.05 },
    { volatilidad: 0.08, rentabilidad: 0.04 },
    { volatilidad: 0.12, rentabilidad: 0.09 },
    { volatilidad: 0.14, rentabilidad: 0.07 }, /* más riesgo y menos rentabilidad: fuera */
    { volatilidad: 0.16, rentabilidad: 0.11 },
  ];
  const tramo = tramoEficiente(cruda);
  comprueba('La línea siempre sube: más riesgo solo entra si rentó más',
    tramo.every((p, i) => i === 0
      || (p.volatilidad > tramo[i - 1].volatilidad && p.rentabilidad > tramo[i - 1].rentabilidad)));
  comprueba('El punto dominado (más riesgo, menos rentabilidad) queda fuera',
    !tramo.some((p) => p.volatilidad === 0.14) && tramo.length === 4);
  comprueba('Sin puntos no revienta', tramoEficiente(null).length === 0);
}

console.log('\n— La envolvente cóncava de la frontera (el arco limpio del clásico) —');
{
  const dientes = [
    { volatilidad: 0.04, rentabilidad: 0.05 },
    { volatilidad: 0.05, rentabilidad: 0.075 }, /* diente: se sale del arco */
    { volatilidad: 0.06, rentabilidad: 0.08 },
    { volatilidad: 0.08, rentabilidad: 0.10 },
    { volatilidad: 0.10, rentabilidad: 0.105 },
  ];
  const arco = envolventeConcava(dientes);
  const pend = (a, b) => (b.rentabilidad - a.rentabilidad) / (b.volatilidad - a.volatilidad);
  comprueba('La pendiente del arco siempre decrece: cóncavo como la frontera real',
    arco.length >= 3 && arco.every((p, i) => i < 2 || pend(arco[i - 1], p) < pend(arco[i - 2], arco[i - 1])));
  comprueba('Ningún punto muestreado queda por encima del arco',
    dientes.every((p) => {
      const i = arco.findIndex((q, k) => k < arco.length - 1
        && arco[k].volatilidad <= p.volatilidad && p.volatilidad <= arco[k + 1].volatilidad);
      if (i < 0) return true;
      const [a, b] = [arco[i], arco[i + 1]];
      const t = (p.volatilidad - a.volatilidad) / ((b.volatilidad - a.volatilidad) || 1);
      return p.rentabilidad <= a.rentabilidad + t * (b.rentabilidad - a.rentabilidad) + 1e-9;
    }));
  comprueba('Los dos extremos del tramo se conservan',
    arco[0].volatilidad === 0.04 && arco[arco.length - 1].volatilidad === 0.10);
  comprueba('Sin puntos no revienta', envolventeConcava(null).length === 0);
}

console.log('\n— Los puntos señalados de la frontera (encargo 21-08) —');
{
  const eficiente = [
    { volatilidad: 0.04, rentabilidad: 0.045 },
    { volatilidad: 0.06, rentabilidad: 0.08 },  /* Sharpe (0.08-0.019)/0.06 ≈ 1.02, el mayor */
    { volatilidad: 0.10, rentabilidad: 0.10 },
  ];
  const s = puntosSenalados(eficiente);
  comprueba('La de menor riesgo es la de menor volatilidad', s.menorRiesgo.volatilidad === 0.04);
  comprueba('La de mayor Sharpe descuenta la tasa sin riesgo', s.mayorSharpe.volatilidad === 0.06);
  comprueba('Sin puntos no hay señalados', puntosSenalados([]) === null && puntosSenalados(null) === null);
}

console.log('\n— Los perfiles de referencia del mapa riesgo-retorno (encargo 21-08) —');
{
  const perfiles = perfilesReferencia();
  comprueba('Cinco perfiles, del 10 % al 90 % de renta variable',
    perfiles.length === 5 && perfiles[0].rv === 10 && perfiles[4].rv === 90);
  comprueba('A más renta variable, más riesgo y más rentabilidad estimada (con estos supuestos)',
    perfiles.every((p, i) => i === 0
      || (p.volatilidad > perfiles[i - 1].volatilidad && p.rentabilidad > perfiles[i - 1].rentabilidad)));
  comprueba('Cada perfil arriesga menos que la renta variable pura y más que la fija pura',
    perfiles.every((p) => p.volatilidad < 0.16 && p.volatilidad > 0.055 * 0.5));
  const cartera = perfilCarteraSupuestos([
    { activo: { asset_id: 'RV', economic_asset_class: 'EQUITY' } },
    { activo: { asset_id: 'RF', economic_asset_class: 'FIXED_INCOME' } },
  ], { RV: 0.6, RF: 0.4 });
  comprueba('La cartera 60/40 usa la misma base de supuestos que los perfiles',
    cartera?.rentabilidad === 0.0548 && cartera?.volatilidad === 0.0996);
  comprueba('Una clase fuera del modelo no se dibuja con una base incompleta',
    perfilCarteraSupuestos([
      { activo: { asset_id: 'M', economic_asset_class: 'MIXED' } },
    ], { M: 1 }) === null);
}

console.log('\n— El redondeo de esquinas (Chaikin) —');
{
  const esquina = [{ x: 0, y: 100 }, { x: 50, y: 20 }, { x: 100, y: 10 }];
  const redondeada = suavizaEsquinas(esquina, 3);
  comprueba('Los extremos no se mueven',
    redondeada[0].x === 0 && redondeada[0].y === 100
    && redondeada[redondeada.length - 1].x === 100 && redondeada[redondeada.length - 1].y === 10);
  comprueba('La esquina se puebla de puntos intermedios', redondeada.length > 10);
  comprueba('El camino sigue avanzando siempre hacia la derecha',
    redondeada.every((p, i) => i === 0 || p.x >= redondeada[i - 1].x));
  comprueba('Con dos puntos no hay esquina que redondear',
    suavizaEsquinas([{ x: 0, y: 0 }, { x: 1, y: 1 }], 3).length === 2);
}

console.log('\n— La curva suave (referencia: laboratorio clásico) —');
{
  const suave = caminoSuave([{ x: 0, y: 100 }, { x: 50, y: 60 }, { x: 100, y: 40 }, { x: 150, y: 35 }]);
  comprueba('Con varios puntos la curva usa tramos Bézier',
    suave.startsWith('M0.0,100.0') && suave.includes(' C'));
  comprueba('Con dos puntos es una recta', /^M.+ L[^C]+$/.test(caminoSuave([{ x: 0, y: 0 }, { x: 10, y: 5 }])));
  comprueba('Con menos de dos puntos no hay camino',
    caminoSuave([{ x: 1, y: 1 }]) === '' && caminoSuave(null) === '');
  comprueba('Un punto sin coordenada finita se descarta',
    caminoSuave([{ x: 0, y: 0 }, { x: NaN, y: 3 }, { x: 10, y: 5 }]).split('C').length === 1);
}

console.log('\n— El abanico con cuartiles (referencia: clásico a dos tonos) —');
{
  const proyeccion = proyeccionMonteCarlo({ rentabilidad: 0.05, volatilidad: 0.12 });
  const ab = puntosAbanico(proyeccion);
  comprueba('Las sendas de cuartiles existen y quedan dentro de la banda ancha',
    ab.p25 && ab.p75 && ab.anos.every((_, i) => ab.p5[i] <= ab.p25[i] && ab.p25[i] <= ab.p50[i]
      && ab.p50[i] <= ab.p75[i] && ab.p75[i] <= ab.p95[i]));
  comprueba('Una proyección vieja sin cuartiles no revienta: la banda interior se omite',
    puntosAbanico({ base: 100, anos: [{ ano: 1, p5: 90, p50: 100, p95: 110 }] }).p25 === null);
}

console.log('\n— Cuánto riesgo pone cada posición (Fase 7) —');
{
  const alza = Array.from({ length: 90 }, (_, i) => 100 * (1 + 0.002 * i) * (1 + 0.03 * Math.sin(i / 4)));
  const calma = Array.from({ length: 90 }, (_, i) => 100 * (1 + 0.0004 * i) * (1 + 0.004 * Math.sin(i / 5)));
  const series = [{ asset_id: 'MOVIDO', values: alza }, { asset_id: 'TRANQUILO', values: calma }];
  const c = contribucionesRiesgo(series, { MOVIDO: 0.5, TRANQUILO: 0.5 });
  comprueba('Las contribuciones existen y suman ~100',
    c && Math.abs(c.reduce((s, x) => s + x.porcentaje, 0) - 100) < 0.5,
    c && c.map((x) => `${x.id} ${x.porcentaje}`).join(' · '));
  comprueba('A igual peso, el activo que más se mueve pone más riesgo',
    c && c[0].id === 'MOVIDO' && c[0].porcentaje > 50);
  comprueba('Con una sola posición no hay reparto que hacer',
    contribucionesRiesgo(series.slice(0, 1), { MOVIDO: 1 }) === null);
  comprueba('Serie plana (σ indefinida) → null, nunca se inventa',
    contribucionesRiesgo([series[0], { asset_id: 'PLANO', values: Array(90).fill(100) }],
      { MOVIDO: 0.5, PLANO: 0.5 }) === null);
}

console.log('\n— Pares destacados y frase de la correlación (Fase 7) —');
{
  const rho = {
    A: { B: 0.9, C: 0.1, D: -0.4 },
    B: { A: 0.9, C: 0.5, D: 0.2 },
    C: { A: 0.1, B: 0.5, D: 0.3 },
    D: { A: -0.4, B: 0.2, C: 0.3 },
  };
  const { pares, altos, bajos } = paresDestacados(['A', 'B', 'C', 'D'], rho, 2);
  comprueba('Salen todos los pares una sola vez', pares.length === 6);
  comprueba('Los altos son los que más se mueven a la vez',
    altos[0].valor === 0.9 && altos.length === 2);
  comprueba('Los bajos empiezan por el de sentido más contrario',
    bajos[0].valor === -0.4);
  comprueba('Altos y bajos no repiten par',
    !altos.some((p) => bajos.some((q) => p.a === q.a && p.b === q.b)));
  comprueba('La frase acompaña a la cifra sin juzgarla',
    fraseCorrelacion(0.9) === 'casi siempre a la vez'
    && fraseCorrelacion(0.6) === 'a menudo a la vez'
    && fraseCorrelacion(0) === 'poca relación'
    && fraseCorrelacion(-0.5) === 'en sentido contrario'
    && fraseCorrelacion(NaN) === 'sin datos comunes');
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: análisis ampliado del nivel registrado (paso 32).');

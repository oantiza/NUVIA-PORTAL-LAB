/**
 * Batería de verificación de la lógica pura de js/nuvia-constructor.js (paso 20).
 *
 *   node docs/nuvia-constructor.test.mjs
 */
import {
  MAX_POSICIONES, agregaPosicion, quitaPosicion, cambiaPeso,
  pesosNormalizados, serieCartera, fechaCorta, textoContador, NOTA_NIVEL,
  lecturasDeMetricas, fechaDelMinimo,
} from '../js/nuvia-constructor.js';
import { metricasDesdeSerie } from '../js/nuvia-cartera.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

const activo = (id, nombre = id) => ({ asset_id: id, display_name: nombre, instrument_type: 'STOCK' });

console.log('— Posiciones —');
{
  let pos = [];
  for (const id of ['A', 'B', 'C', 'D', 'E']) pos = agregaPosicion(pos, activo(id)).posiciones;
  comprueba('Se admiten 5 posiciones', pos.length === 5);
  const sexto = agregaPosicion(pos, activo('F'));
  comprueba('La sexta se rechaza con motivo «limite»', sexto.posiciones.length === MAX_POSICIONES && sexto.motivo === 'limite');
  const repe = agregaPosicion(pos, activo('A'));
  comprueba('Un activo repetido se rechaza con motivo «repetido»', repe.posiciones.length === 5 && repe.motivo === 'repetido');
  pos = quitaPosicion(pos, 'C');
  comprueba('Quitar una posición deja las otras cuatro', pos.length === 4 && !pos.some((p) => p.activo.asset_id === 'C'));
  pos = cambiaPeso(pos, 'A', 60);
  comprueba('Cambiar un peso solo toca esa posición', pos.find((p) => p.activo.asset_id === 'A').bruto === 60
    && pos.find((p) => p.activo.asset_id === 'B').bruto !== 60);
}

console.log('\n— Normalización de pesos —');
{
  const pos = [
    { activo: activo('A'), bruto: 60 },
    { activo: activo('B'), bruto: 20 },
    { activo: activo('C'), bruto: 20 },
  ];
  const w = pesosNormalizados(pos);
  comprueba('60/20/20 → 0,6/0,2/0,2', Math.abs(w.A - 0.6) < 1e-12 && Math.abs(w.B - 0.2) < 1e-12);
  const w2 = pesosNormalizados(pos, ['A', 'B']);
  comprueba('Excluido un activo sin datos, el resto se renormaliza (60/20 → 75/25)',
    Math.abs(w2.A - 0.75) < 1e-12 && Math.abs(w2.B - 0.25) < 1e-12 && w2.C === undefined);
  comprueba('Todos los pesos a cero → null, nunca un reparto inventado',
    pesosNormalizados([{ activo: activo('A'), bruto: 0 }]) === null);
}

console.log('\n— Serie de la cartera —');
{
  const series = [
    { asset_id: 'A', values: [100, 110, 120] },
    { asset_id: 'B', values: [100, 90, 80] },
  ];
  const niveles = serieCartera(series, { A: 0.5, B: 0.5 });
  comprueba('Mitad sube +10, mitad baja −10 → cartera plana', niveles.every((v) => Math.abs(v - 1) < 1e-12),
    niveles.join(', '));
  const soloA = serieCartera(series, { A: 1 });
  comprueba('Peso 100 % en un activo reproduce su serie', Math.abs(soloA[2] - 1.2) < 1e-12);
  comprueba('Series de longitudes distintas → null, no un cálculo a medias',
    serieCartera([{ asset_id: 'A', values: [100, 110] }, { asset_id: 'B', values: [100] }], { A: 0.5, B: 0.5 }) === null);
  comprueba('Sin ninguna serie de los pesos pedidos → null', serieCartera(series, { Z: 1 }) === null);
}

console.log('\n— Enlace con las métricas del visitante —');
{
  // 3 años de subida diaria constante hasta duplicar: rentabilidad total 100 %.
  const n = 756;
  const factor = 2 ** (1 / (n - 1));
  const values = Array.from({ length: n }, (_, t) => 100 * factor ** t);
  const niveles = serieCartera([{ asset_id: 'A', values }], { A: 1 });
  const m = metricasDesdeSerie(niveles, { periodosPorAno: 252 });
  comprueba('Serie que duplica en 3 años → rentabilidad total 100 %', Math.abs(m.rentabilidadTotal - 1) < 1e-9);
  comprueba('…y anualizada ≈ 26 % (2^(1/3) − 1)', Math.abs(m.rentabilidadAnualizada - (2 ** (1 / 3) - 1)) < 1e-3,
    `anualizada=${m.rentabilidadAnualizada}`);
  comprueba('Subida monótona → máxima caída 0', m.maximaCaida === 0);
}

console.log('\n— Límite comunicado (paso 21) —');
comprueba('El contador dice cuántas posiciones hay y cuál es el tope', textoContador(3) === 'Posiciones: 3 de 5');
comprueba('La nota de nivel explica el porqué del tope', NOTA_NIVEL.includes('se lee con claridad'));
comprueba('…y qué añade la cuenta gratuita', NOTA_NIVEL.includes('cuenta gratuita')
  && NOTA_NIVEL.includes('guardado en la nube') && NOTA_NIVEL.includes('carteras sin tope'));
comprueba('…y hasta dónde llega la suscripción', NOTA_NIVEL.includes('20 posiciones'));
comprueba('Dice honestamente que el registro aún no está abierto', NOTA_NIVEL.includes('fase posterior'));
comprueba('La nota describe sin aconsejar (sin «mejor/recomendado/óptimo/conviene/deberías/ideal»)',
  !/mejor|recomendad|óptim|conviene|deberías|ideal/i.test(NOTA_NIVEL));

console.log('\n— Lecturas en lenguaje llano (paso 22) —');
{
  const niveles = [1, 1.1, 0.935, 1.2];
  const fechas = ['2023-09-01', '2024-03-01', '2025-03-15', '2026-08-14'];
  const m = { rentabilidadTotal: 0.2, rentabilidadAnualizada: 0.0627, volatilidad: 0.124, maximaCaida: -0.15 };
  const l = lecturasDeMetricas(m, { niveles, fechas });
  comprueba('La rentabilidad se traduce a euros: 10.000 € → 12.000 €', l.rentabilidad.includes('12.000'),
    l.rentabilidad);
  comprueba('…y recuerda que el pasado no asegura el futuro', l.rentabilidad.includes('El pasado no asegura el futuro'));
  comprueba('La volatilidad lleva su cifra dentro de la frase («en torno a un 12,4 %»)',
    l.volatilidad.includes('en torno a un 12,4 %'));
  comprueba('La caída lleva su cifra y la fecha del punto más bajo', l.caida.includes('15,0 %')
    && l.caida.includes('punto más bajo: 15-03-2025'), l.caida);
  comprueba('fechaDelMinimo encuentra el valle correcto', fechaDelMinimo(niveles, fechas) === '15-03-2025');
  comprueba('Longitudes descuadradas → sin fecha, nunca una inventada', fechaDelMinimo(niveles, fechas.slice(1)) === null);

  const sinCaida = lecturasDeMetricas({ ...m, maximaCaida: 0 }, { niveles: [1, 1.1, 1.2], fechas: fechas.slice(1) });
  comprueba('Sin caídas → se dice, sin cifra forzada', sinCaida.caida.includes('no llegó a caer'));
  const vacio = lecturasDeMetricas(undefined);
  comprueba('Sin métricas → «no hay datos suficientes» en las tres lecturas',
    [vacio.rentabilidad, vacio.volatilidad, vacio.caida].every((t) => t.includes('No hay datos suficientes')));
  comprueba('Las lecturas describen sin aconsejar (filtro de lenguaje de bases §2)',
    ![l.rentabilidad, l.volatilidad, l.caida].some((t) => /mejor|recomendad|óptim|conviene|deberías|ideal/i.test(t)));
}

console.log('\n— Fechas —');
comprueba('2026-08-15 → 15-08-2026', fechaCorta('2026-08-15') === '15-08-2026');
comprueba('Fecha ilegible → null, no una fecha inventada', fechaCorta('ayer') === null && fechaCorta(null) === null);

if (fallos) {
  console.error(`\n${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nBatería completa: todo en orden.');

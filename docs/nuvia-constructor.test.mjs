/**
 * Batería de verificación de la lógica pura de js/nuvia-constructor.js (paso 20).
 *
 *   node docs/nuvia-constructor.test.mjs
 */
import {
  MAX_POSICIONES, agregaPosicion, quitaPosicion, cambiaPeso,
  pesosNormalizados, serieCartera, fechaCorta,
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

console.log('\n— Fechas —');
comprueba('2026-08-15 → 15-08-2026', fechaCorta('2026-08-15') === '15-08-2026');
comprueba('Fecha ilegible → null, no una fecha inventada', fechaCorta('ayer') === null && fechaCorta(null) === null);

if (fallos) {
  console.error(`\n${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nBatería completa: todo en orden.');

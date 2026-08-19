/**
 * Verificación del módulo de solapamiento y look-through · NUVIA
 * ---------------------------------------------------------------------------
 * Ejecutar:  node docs/nuvia-solapamiento.test.mjs
 *
 * Cubre la verificación del paso 13 de la guía: dos ETF del mismo índice
 * deben dar solapamiento cercano al 100 %; dos de sectores distintos,
 * cercano a 0. Las carteras son sintéticas pero con la estructura real que
 * sirve `get_asset_holdings`. El contraste con carteras reales de ETF se
 * hace aparte y no se versiona aquí.
 */

import {
  normalizaNombre,
  solapamiento,
  matrizSolapamiento,
  lookThroughCartera,
} from '../js/nuvia-solapamiento.js';

let fallos = 0;
const comprueba = (nombre, condicion, detalle = '') => {
  const ok = Boolean(condicion);
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK ' : 'FALLO'}  ${nombre}${detalle ? `  · ${detalle}` : ''}`);
};

/* ── Carteras sintéticas con estructura de get_asset_holdings ───────────── */

// Índice de 10 valores, pesos decrecientes (suman 100).
const PESOS_INDICE = [18, 15, 13, 11, 10, 9, 8, 7, 5, 4];
const indice = (nombreGestora) => ({
  holdings: PESOS_INDICE.map((peso, i) => ({
    name: `Compania ${i + 1} (${nombreGestora})`.replace(` (${nombreGestora})`, ''),
    isin: `US00000000${i}0`,
    weight_pct: peso,
  })),
});

// Mismo índice replicado por otra gestora: mismos ISIN, pesos casi iguales
// (pequeñas diferencias de réplica y un resto en liquidez).
const etfA = indice('A');
const etfB = {
  holdings: PESOS_INDICE.map((peso, i) => ({
    name: `Company ${i + 1} Inc`,
    isin: `US00000000${i}0`,
    weight_pct: peso + (i % 2 === 0 ? 0.4 : -0.4),
  })),
};

// Sector distinto: diez valores sin ningún ISIN en común.
const etfSectorial = {
  holdings: PESOS_INDICE.map((peso, i) => ({
    name: `Energetica ${i + 1}`,
    isin: `ES11111111${i}0`,
    weight_pct: peso,
  })),
};

/* ── Verificación del paso 13 ───────────────────────────────────────────── */

const mismoIndice = solapamiento(etfA, etfB);
comprueba('Dos ETF del mismo índice → cercano a 100 %', mismoIndice.porcentaje > 95,
  `${mismoIndice.porcentaje.toFixed(1)} %`);

const sectoresDistintos = solapamiento(etfA, etfSectorial);
comprueba('Dos ETF de sectores distintos → 0 %', sectoresDistintos.porcentaje === 0,
  `${sectoresDistintos.porcentaje} %`);

const consigoMismo = solapamiento(etfA, etfA);
comprueba('Un fondo consigo mismo → 100 %', Math.abs(consigoMismo.porcentaje - 100) < 1e-9,
  `${consigoMismo.porcentaje} %`);

comprueba('Las posiciones comunes vienen ordenadas de mayor a menor',
  mismoIndice.comunes.length === 3
  && mismoIndice.comunes[0].peso >= mismoIndice.comunes[1].peso
  && mismoIndice.comunes[1].peso >= mismoIndice.comunes[2].peso);

/* ── Robustez del casado y la normalización ─────────────────────────────── */

comprueba('normalizaNombre: «Telefónica, S.A.» casa con «TELEFONICA S.A.»',
  normalizaNombre('Telefónica, S.A.') === normalizaNombre('TELEFONICA S.A.'));
comprueba('normalizaNombre: «S.A.» y «SA» NO casan (igual que el original: el ISIN manda)',
  normalizaNombre('Telefónica, S.A.') !== normalizaNombre('TELEFONICA SA'));

// Sin ISIN, el casado va por nombre normalizado con grafías distintas.
const porNombreA = { holdings: [{ name: 'Telefónica, S.A.', weight_pct: 60 }, { name: 'Iberdrola SA', weight_pct: 40 }] };
const porNombreB = { holdings: [{ name: 'TELEFONICA S.A.', weight_pct: 50 }, { name: 'Repsol', weight_pct: 50 }] };
const porNombre = solapamiento(porNombreA, porNombreB);
comprueba('Casado por nombre cuando falta el ISIN', Math.abs(porNombre.porcentaje - 50) < 1e-9,
  `${porNombre.porcentaje} % (min(60, 50) de Telefónica)`);

// Pesos que no suman 100 se normalizan antes de comparar.
const sinNormalizar = solapamiento(
  { holdings: [{ name: 'X', isin: 'XX0000000001', weight_pct: 49 }] },
  { holdings: [{ name: 'X', isin: 'XX0000000001', weight_pct: 98 }] }
);
comprueba('Los pesos se normalizan a 100 antes del mínimo',
  Math.abs(sinNormalizar.porcentaje - 100) < 1e-9, `${sinNormalizar.porcentaje} %`);

// Misma posición repetida en el desglose: se agrega, no se duplica.
const duplicada = solapamiento(
  { holdings: [
    { name: 'X', isin: 'XX0000000001', weight_pct: 30 },
    { name: 'X bis', isin: 'XX0000000001', weight_pct: 30 },
    { name: 'Y', isin: 'XX0000000002', weight_pct: 40 },
  ] },
  { holdings: [{ name: 'X', isin: 'XX0000000001', weight_pct: 100 }] }
);
comprueba('Posiciones duplicadas por ISIN se agregan', Math.abs(duplicada.porcentaje - 60) < 1e-9,
  `${duplicada.porcentaje} %`);

comprueba('Fondo sin desglose → 0 y sin comunes, nunca un valor inventado',
  solapamiento(null, etfA).porcentaje === 0 && solapamiento({ holdings: [] }, etfA).comunes.length === 0);

/* ── Matriz de pares ────────────────────────────────────────────────────── */

const matriz = matrizSolapamiento([
  { id: 'A', cartera: etfA },
  { id: 'B', cartera: etfB },
  { id: 'SECT', cartera: etfSectorial },
  { id: 'SIN', cartera: null },
]);
comprueba('Matriz: diagonal = 100', matriz.porcentaje.A.A === 100 && matriz.porcentaje.SECT.SECT === 100);
comprueba('Matriz: simétrica', matriz.porcentaje.A.B === matriz.porcentaje.B.A);
comprueba('Matriz: el fondo sin desglose queda en sinDatos, fuera de la matriz',
  matriz.sinDatos.includes('SIN') && matriz.porcentaje.SIN === undefined);

/* ── Look-through ───────────────────────────────────────────────────────── */

const lt = lookThroughCartera([
  { id: 'A', nombre: 'ETF Índice A', peso: 60, cartera: etfA },
  { id: 'B', nombre: 'ETF Índice B', peso: 30, cartera: etfB },
  { id: 'SIN', nombre: 'Fondo opaco', peso: 10, cartera: null },
]);

// La mayor posición del índice pesa 18 % en A (60 %) y ~18,4/101→18,2 % en B (30 %).
const primera = lt.filas[0];
comprueba('Look-through: la primera fila agrega la misma posición desde ambos fondos',
  primera.enFondos === 2 && primera.desdeFondos.join(',') === 'A,B');
comprueba('Look-through: contribución ponderada correcta (≈ 16,3 %)',
  primera.peso > 15.5 && primera.peso < 17, `${primera.peso} %`);
comprueba('Look-through: cobertura = 90 % y aviso del fondo opaco',
  lt.pesoCubierto === 90 && lt.fondosCubiertos === 2 && lt.avisos.length === 1
  && lt.avisos[0].includes('Fondo opaco'));

// La suma de todas las filas debe rondar la cobertura (90 %), nunca superarla.
const sumaFilas = lt.filas.reduce((s, f) => s + f.peso, 0);
comprueba('Look-through: la suma de filas no supera la cobertura',
  sumaFilas <= lt.pesoCubierto + 1e-6, `${sumaFilas.toFixed(2)} % ≤ ${lt.pesoCubierto} %`);

/* ───────────────────────────────────────────────────────────────────────── */

console.log(fallos === 0 ? '\nBatería completa: todo en orden.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);

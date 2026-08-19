/**
 * Verificación del módulo de cálculo de cartera · NUVIA
 * ---------------------------------------------------------------------------
 * Ejecutar:  node docs/nuvia-cartera.test.mjs
 *
 * Cubre la verificación del paso 12 de la guía de implementación (correlaciones
 * reales) y los casos de contraste del paso 8 (idénticas → 1, invertida → −1,
 * ruido → ~0). Es el embrión de la batería del paso 17.
 *
 * Las series «reales» del caso Telefónica+BBVA+Santander son sintéticas pero
 * con la estructura del caso real: tres valores del mismo sector y mercado con
 * correlación ~0,8 entre pares. El contraste con datos de mercado de verdad se
 * hace aparte, contra get_price_series, y no se versiona aquí.
 */

import {
  CLASES,
  correlacion,
  correlacionesDesdeSeries,
  estableceCorrelaciones,
  volatilidadCartera,
  volatilidadSinDiversificar,
  analizaCartera,
} from './nuvia-cartera.js';

let fallos = 0;
const comprueba = (nombre, condicion, detalle = '') => {
  const ok = Boolean(condicion);
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK ' : 'FALLO'}  ${nombre}${detalle ? `  · ${detalle}` : ''}`);
};

/* Generador determinista (LCG + Box-Muller): misma serie en cada ejecución. */
function gaussiana(semilla) {
  let s = semilla >>> 0;
  const uniforme = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s + 0.5) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(uniforme())) * Math.cos(2 * Math.PI * uniforme());
}

/** Serie de niveles a partir de retornos diarios. */
const niveles = (retornos, base = 100) => {
  const out = [base];
  for (const r of retornos) out.push(out[out.length - 1] * (1 + r));
  return out;
};

const N = 756; // ~3 años de sesiones

/* ── Casos de contraste del paso 8 ──────────────────────────────────────── */

const rnd = gaussiana(42);
const retornosBase = Array.from({ length: N }, () => rnd() * 0.012);
const serieA = niveles(retornosBase);
const serieInvertida = niveles(retornosBase.map((r) => -r));
const rndRuido = gaussiana(2024);
const serieRuido = niveles(Array.from({ length: N }, () => rndRuido() * 0.012));

const contraste = correlacionesDesdeSeries([
  { id: 'A', niveles: serieA },
  { id: 'COPIA', niveles: serieA },
  { id: 'INVERTIDA', niveles: serieInvertida },
  { id: 'RUIDO', niveles: serieRuido },
]);

comprueba('Diagonal = 1', contraste.ids.every((id) => contraste.rho[id][id] === 1));
comprueba(
  'Ningún valor fuera de [−1, 1]',
  contraste.ids.every((a) => contraste.ids.every((b) => {
    const v = contraste.rho[a][b];
    return v === undefined || (v >= -1 && v <= 1);
  }))
);
comprueba('Series idénticas → 1', contraste.rho.A.COPIA === 1, `ρ = ${contraste.rho.A.COPIA}`);
comprueba('Serie invertida → ≈ −1', contraste.rho.A.INVERTIDA < -0.99, `ρ = ${contraste.rho.A.INVERTIDA}`);
comprueba('Ruido independiente → ≈ 0', Math.abs(contraste.rho.A.RUIDO) < 0.1, `ρ = ${contraste.rho.A.RUIDO}`);

/* ── El simulador por clases no cambia (regresión) ──────────────────────── */

estableceCorrelaciones(contraste); // con matriz registrada, las clases siguen igual

comprueba('ρ bolsa–renta fija sigue siendo 0,05', correlacion('EQUITY', 'FIXED_INCOME') === 0.05);
comprueba('ρ misma clase sigue siendo 0,75', correlacion('EQUITY', 'EQUITY') === 0.75);

const cartera6040 = [
  { clase: 'EQUITY', peso: 60 },
  { clase: 'FIXED_INCOME', peso: 40 },
];
// Valor de referencia calculado con la versión anterior del módulo.
comprueba('Volatilidad 60/40 por clases, igual que antes', volatilidadCartera(cartera6040) === 0.0996,
  `σ = ${volatilidadCartera(cartera6040)}`);

/* ── Paso 12 · Telefónica + BBVA + Santander ────────────────────────────── */
// Tres valores del mismo mercado: retornos con un factor común fuerte
// (ρ teórica entre pares ≈ 0,88, lo habitual entre grandes valores de una
// misma bolsa) y volatilidad anual ~24 %.

const rndFactor = gaussiana(7);
const factorComun = Array.from({ length: N }, () => rndFactor() * 0.0142);
const banco = (semilla) => {
  const propio = gaussiana(semilla);
  return niveles(factorComun.map((f) => f + propio() * 0.00524));
};

const matrizBancos = correlacionesDesdeSeries([
  { id: 'TEF', niveles: banco(101) },
  { id: 'BBVA', niveles: banco(202) },
  { id: 'SAN', niveles: banco(303) },
]);

const pares = [matrizBancos.rho.TEF.BBVA, matrizBancos.rho.TEF.SAN, matrizBancos.rho.BBVA.SAN];
comprueba('Bancos: ρ real alta entre pares (> 0,8)', pares.every((v) => v > 0.8),
  `ρ = ${pares.join(' · ')}`);

// Sin matriz registrada, un par de activos concretos NO tiene ρ: undefined.
estableceCorrelaciones(null);
const sinMatriz = analizaCartera([
  { id: 'TEF', peso: 34, volatilidad: 0.24 },
  { id: 'BBVA', peso: 33, volatilidad: 0.24 },
  { id: 'SAN', peso: 33, volatilidad: 0.24 },
]);
comprueba('Sin matriz, cartera de activos concretos → undefined (no se inventa ρ)',
  sinMatriz.volatilidad === undefined);

// ANTES: el supuesto por clase — ρ = 0,75 entre dos activos de la misma clase
// (assumedAssetClassCorrelation), expresado como matriz para el mismo caso.
const sigma = matrizBancos.volatilidades;
estableceCorrelaciones({
  ids: ['TEF', 'BBVA', 'SAN'],
  rho: {
    TEF: { TEF: 1, BBVA: 0.75, SAN: 0.75 },
    BBVA: { TEF: 0.75, BBVA: 1, SAN: 0.75 },
    SAN: { TEF: 0.75, BBVA: 0.75, SAN: 1 },
  },
  volatilidades: sigma,
});
const porClaseAntes = analizaCartera([
  { id: 'TEF', peso: 34 },
  { id: 'BBVA', peso: 33 },
  { id: 'SAN', peso: 33 },
]);

// AHORA: correlaciones reales.
estableceCorrelaciones(matrizBancos);
const conMatriz = analizaCartera([
  { id: 'TEF', peso: 34 },
  { id: 'BBVA', peso: 33 },
  { id: 'SAN', peso: 33 },
]);

const ahorroAntes = porClaseAntes.ahorroPorDiversificar / porClaseAntes.volatilidadSinDiversificar;
const ahorroAhora = conMatriz.ahorroPorDiversificar / conMatriz.volatilidadSinDiversificar;
comprueba(
  'TEF+BBVA+SAN: mucho menos ahorro por diversificar que con el supuesto por clase',
  ahorroAhora < ahorroAntes * 0.6,
  `antes ${(ahorroAntes * 100).toFixed(1)} % de la σ sin diversificar · ahora ${(ahorroAhora * 100).toFixed(1)} %`
);
comprueba('σ de los bancos sale de la matriz (≈ 24 % anual)',
  conMatriz.volatilidadSinDiversificar > 0.2 && conMatriz.volatilidadSinDiversificar < 0.3,
  `σ media = ${conMatriz.volatilidadSinDiversificar}`);

/* ── Nunca inventar: par ausente de la matriz ───────────────────────────── */

const conDesconocido = volatilidadCartera([
  { id: 'TEF', peso: 50 },
  { id: 'ACTIVO_SIN_HISTORICO', peso: 50, volatilidad: 0.2 },
]);
comprueba('Par sin correlación en la matriz → undefined, nunca una ρ inventada',
  conDesconocido === undefined);

const sinVol = volatilidadSinDiversificar([{ id: 'ACTIVO_SIN_HISTORICO', peso: 100 }]);
comprueba('Posición sin σ conocida → undefined', sinVol === undefined);

estableceCorrelaciones(null);

/* ───────────────────────────────────────────────────────────────────────── */

console.log(fallos === 0 ? '\nBatería completa: todo en orden.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);

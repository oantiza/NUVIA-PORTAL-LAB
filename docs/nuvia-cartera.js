/**
 * Cálculo de cartera · NUVIA
 * ---------------------------------------------------------------------------
 * Adaptado de la plataforma OAA (oantiza/BDB-ACTIVOS):
 *   src/core/portfolioRiskModel.ts · src/core/quantConfig.ts · src/core/frontier.ts
 *
 * Simplificaciones respecto al original:
 *   - Sin TypeScript: el portal no tiene paso de compilación para esta sección.
 *   - Sin catálogo de activos: se trabaja por CLASE de activo, no por ISIN.
 *     El visitante mueve porcentajes, no elige fondos concretos.
 *   - Frontera por Monte Carlo sobre 4 clases en vez de N activos: basta para
 *     ilustrar la idea y se calcula en milisegundos en el navegador.
 *
 * LIMITACIÓN CONOCIDA — ver docs/BASES_ANALISIS_CARTERA.md, sección 7.
 * La correlación se asume por clase de activo (0,75 entre dos de la misma).
 * Con valores concretos eso es falso: Telefónica y BBVA se mueven mucho más
 * juntos que un valor español y uno japonés. Para el simulador con valores
 * reales hacen falta correlaciones entre pares, que existen en la base de
 * datos propia.
 *
 * Todo son funciones puras: entran pesos, salen números. Sin red, sin backend,
 * sin autenticación.
 */

/** Tasa libre de riesgo anual (€STR aproximado). Igual que quantConfig.ts. */
export const TASA_SIN_RIESGO = 0.019;

/**
 * Las cuatro clases que maneja el simulador, con supuestos de mercado.
 * Rentabilidad y volatilidad son estimaciones de largo plazo, no previsiones.
 * PENDIENTE DE VALIDACIÓN PROFESIONAL — ver sección 8 de las bases.
 */
export const CLASES = {
  EQUITY: {
    id: 'EQUITY',
    nombre: 'Renta variable',
    descripcion: 'Acciones y fondos de bolsa',
    rentabilidad: 0.070,
    volatilidad: 0.160,
  },
  FIXED_INCOME: {
    id: 'FIXED_INCOME',
    nombre: 'Renta fija',
    descripcion: 'Bonos de Estados y empresas',
    rentabilidad: 0.032,
    volatilidad: 0.055,
  },
  MONEY_MARKET: {
    id: 'MONEY_MARKET',
    nombre: 'Monetario',
    descripcion: 'Letras y depósitos a corto plazo',
    rentabilidad: 0.020,
    volatilidad: 0.008,
  },
  REAL_ASSET: {
    id: 'REAL_ASSET',
    nombre: 'Activos reales',
    descripcion: 'Inmobiliario cotizado y oro',
    rentabilidad: 0.050,
    volatilidad: 0.130,
  },
};

/**
 * Correlación supuesta entre dos clases de activo.
 * Copiado literal de assumedAssetClassCorrelation() en portfolioRiskModel.ts:
 * es el corazón del cálculo y el que hace visible la diversificación.
 */
export function correlacion(a, b) {
  if (a === b) return 0.75;
  const esBolsa = (c) => c === 'EQUITY';
  const esRentaFija = (c) => c === 'FIXED_INCOME' || c === 'MONEY_MARKET';
  if ((esBolsa(a) && esRentaFija(b)) || (esRentaFija(a) && esBolsa(b))) return 0.05;
  if (esRentaFija(a) && esRentaFija(b)) return 0.6;
  if (esBolsa(a) && esBolsa(b)) return 0.7;
  return 0.3;
}

const redondea = (v) => Number(v.toFixed(4));

/**
 * Volatilidad de la cartera. Raíz de la suma doble de covarianzas:
 *   σ² = Σᵢ Σⱼ wᵢ wⱼ ρᵢⱼ σᵢ σⱼ
 * Es lo que hace que el conjunto arriesgue menos que la suma de sus partes.
 *
 * @param {Array<{clase:string, peso:number}>} posiciones  pesos en % (suman 100)
 */
export function volatilidadCartera(posiciones) {
  const conPeso = posiciones.filter((p) => Number.isFinite(p.peso) && p.peso > 0);
  const total = conPeso.reduce((s, p) => s + p.peso, 0);
  if (total <= 0) return undefined;

  const norm = conPeso.map((p) => ({
    clase: p.clase,
    peso: p.peso / total,
    vol: CLASES[p.clase].volatilidad,
  }));

  let varianza = 0;
  for (const i of norm) {
    for (const j of norm) {
      const rho = i.clase === j.clase ? 1 : correlacion(i.clase, j.clase);
      varianza += i.peso * j.peso * rho * i.vol * j.vol;
    }
  }
  return redondea(Math.sqrt(Math.max(varianza, 0)));
}

/** Rentabilidad esperada: media ponderada simple. */
export function rentabilidadCartera(posiciones) {
  const conPeso = posiciones.filter((p) => Number.isFinite(p.peso) && p.peso > 0);
  const total = conPeso.reduce((s, p) => s + p.peso, 0);
  if (total <= 0) return undefined;
  const r = conPeso.reduce(
    (s, p) => s + (p.peso / total) * CLASES[p.clase].rentabilidad, 0
  );
  return redondea(r);
}

/** Ratio de Sharpe: rentabilidad por unidad de riesgo. */
export function sharpe(rentabilidad, volatilidad, sinRiesgo = TASA_SIN_RIESGO) {
  if (!Number.isFinite(rentabilidad) || !Number.isFinite(volatilidad) || volatilidad <= 0) {
    return undefined;
  }
  return redondea((rentabilidad - sinRiesgo) / volatilidad);
}

/**
 * Volatilidad que tendría la cartera SIN efecto diversificación, es decir
 * si las clases se movieran todas a la vez (ρ = 1). La diferencia con la
 * volatilidad real es exactamente lo que aporta diversificar.
 *
 * Este cálculo no está en la plataforma: es propio del simulador, porque
 * ahí el objetivo es medir y aquí es explicar.
 */
export function volatilidadSinDiversificar(posiciones) {
  const conPeso = posiciones.filter((p) => Number.isFinite(p.peso) && p.peso > 0);
  const total = conPeso.reduce((s, p) => s + p.peso, 0);
  if (total <= 0) return undefined;
  const v = conPeso.reduce(
    (s, p) => s + (p.peso / total) * CLASES[p.clase].volatilidad, 0
  );
  return redondea(v);
}

/** Resumen completo de una cartera. */
export function analizaCartera(posiciones) {
  const rent = rentabilidadCartera(posiciones);
  const vol = volatilidadCartera(posiciones);
  const volSin = volatilidadSinDiversificar(posiciones);
  return {
    rentabilidad: rent,
    volatilidad: vol,
    sharpe: sharpe(rent, vol),
    volatilidadSinDiversificar: volSin,
    ahorroPorDiversificar: vol != null && volSin != null ? redondea(volSin - vol) : undefined,
  };
}

/* ── Frontera eficiente ──────────────────────────────────────────────────── */

/** Generador reproducible: la misma nube en cada carga. */
function aleatorio(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Nube de carteras aleatorias y su frontera eficiente.
 * Versión reducida de computeFrontier() de frontier.ts: Monte Carlo sobre las
 * cuatro clases, quedándose con la mejor rentabilidad de cada tramo de riesgo.
 */
export function frontera({ muestras = 4000, tramos = 28, semilla = 42 } = {}) {
  const claves = Object.keys(CLASES);
  const rnd = aleatorio(semilla);
  const nube = [];

  for (let n = 0; n < muestras; n += 1) {
    const brutos = claves.map(() => rnd());
    const suma = brutos.reduce((s, v) => s + v, 0) || 1;
    const posiciones = claves.map((clase, i) => ({ clase, peso: (brutos[i] / suma) * 100 }));
    const vol = volatilidadCartera(posiciones);
    const rent = rentabilidadCartera(posiciones);
    if (vol == null || rent == null) continue;
    nube.push({ volatilidad: vol, rentabilidad: rent, pesos: posiciones });
  }

  // Frontera: la cartera de mayor rentabilidad dentro de cada tramo de riesgo.
  const min = Math.min(...nube.map((p) => p.volatilidad));
  const max = Math.max(...nube.map((p) => p.volatilidad));
  const ancho = (max - min) / tramos;
  const mejores = [];
  for (let t = 0; t < tramos; t += 1) {
    const desde = min + t * ancho;
    const hasta = desde + ancho;
    const enTramo = nube.filter((p) => p.volatilidad >= desde && p.volatilidad < hasta);
    if (!enTramo.length) continue;
    mejores.push(enTramo.reduce((a, b) => (b.rentabilidad > a.rentabilidad ? b : a)));
  }

  return { nube, frontera: mejores.sort((a, b) => a.volatilidad - b.volatilidad) };
}

/* ── Formato ─────────────────────────────────────────────────────────────── */

/** Porcentaje en formato español, con el menos tipográfico (U+2212). */
export function pct(valor, decimales = 1) {
  if (valor == null || !Number.isFinite(valor)) return '—';
  const s = (valor * 100).toFixed(decimales).replace('.', ',');
  return `${s.startsWith('-') ? s.replace('-', '\u2212') : s} %`;
}

/** Número con coma decimal. */
export function num(valor, decimales = 2) {
  if (valor == null || !Number.isFinite(valor)) return '—';
  const s = valor.toFixed(decimales).replace('.', ',');
  return s.startsWith('-') ? s.replace('-', '\u2212') : s;
}

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
 * CORRELACIONES — ver docs/BASES_ANALISIS_CARTERA.md, sección 7, y la guía
 * de implementación, pasos 8 y 12. El módulo trabaja en dos modos:
 *
 *   - Por CLASE de activo (simulador del visitante): ρ se asume por clase,
 *     como siempre. Es una simplificación deliberada y documentada.
 *   - Por ACTIVO concreto: ρ sale de una matriz de correlaciones REALES,
 *     calculada con correlacionesDesdeSeries() a partir de las series de
 *     `get_price_series` (Pearson sobre retornos diarios, ventana 3 años)
 *     y registrada con estableceCorrelaciones(). Si a una pareja de activos
 *     le falta correlación real, el cálculo devuelve undefined: nunca se
 *     inventa una ρ ni se degrada en silencio al supuesto por clase.
 *
 * Todo son funciones puras salvo el registro de la matriz (estableceCorrelaciones),
 * que es el único estado del módulo. Sin red, sin backend, sin autenticación:
 * las series se piden fuera y se le pasan a este módulo ya descargadas.
 */

/** Valor de compatibilidad para cálculos internos basados en supuestos.
 * El Sharpe visible de una cartera real NO usa esta constante: cruza sus
 * tres años con la serie diaria oficial del €STR publicada por el BCE. */
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

/* ── Correlaciones ───────────────────────────────────────────────────────── */

/** Días de mercado por año, para anualizar la volatilidad de retornos diarios. */
export const DIAS_MERCADO = 252;

/**
 * Matriz de correlaciones reales registrada, o null si no hay ninguna.
 * Es el único estado del módulo. La registra la capa que llama a
 * `get_price_series`; este módulo solo la lee.
 */
let matrizActiva = null;

/**
 * Calcula la matriz de correlaciones reales a partir de series de niveles.
 * Implementa el paso 8 de la guía: niveles → retornos diarios → Pearson
 * por pares sobre las fechas comunes.
 *
 * @param {Array<{id:string, niveles:number[]}>} series
 *   Una entrada por activo. `niveles` son los precios/niveles ya ALINEADOS
 *   por fecha entre activos (así los devuelve `get_price_series`: mismo
 *   índice ⇒ misma fecha). Rebasados o no da igual: los retornos son
 *   invariantes a la escala.
 * @param {{periodosPorAno?:number}} [opciones]
 *   `periodosPorAno` anualiza la volatilidad: 252 (por defecto) para series
 *   diarias, 52 para semanales, 12 para mensuales. La correlación no depende
 *   de esto; solo la σ.
 * @returns {{ids:string[], rho:Object, volatilidades:Object, observaciones:Object}}
 *   `rho[a][b]` es la correlación de Pearson (diagonal = 1).
 *   `volatilidades[id]` es la volatilidad ANUALIZADA de cada activo,
 *   subproducto del mismo cálculo (desviación típica diaria × √252); la usa
 *   volatilidadCartera() como σ real cuando la posición no trae la suya.
 *   `observaciones[a][b]` es el nº de retornos comunes usados en cada par.
 */
export function correlacionesDesdeSeries(series, { periodosPorAno = DIAS_MERCADO } = {}) {
  const limpias = (series || []).filter(
    (s) => s && s.id && Array.isArray(s.niveles) && s.niveles.length >= 2
  );
  const retornos = limpias.map((s) => {
    const r = new Array(s.niveles.length - 1).fill(NaN);
    for (let t = 1; t < s.niveles.length; t += 1) {
      const prev = s.niveles[t - 1];
      const cur = s.niveles[t];
      if (Number.isFinite(prev) && Number.isFinite(cur) && prev > 0) {
        r[t - 1] = cur / prev - 1;
      }
    }
    return { id: s.id, r };
  });

  const ids = retornos.map((s) => s.id);
  const rho = {};
  const volatilidades = {};
  const observaciones = {};
  for (const id of ids) { rho[id] = {}; observaciones[id] = {}; }

  for (let i = 0; i < retornos.length; i += 1) {
    const a = retornos[i];
    // Volatilidad anualizada del activo, sobre sus retornos válidos.
    const propios = a.r.filter(Number.isFinite);
    if (propios.length >= 2) {
      const media = propios.reduce((s, v) => s + v, 0) / propios.length;
      const varPeriodo = propios.reduce((s, v) => s + (v - media) ** 2, 0) / (propios.length - 1);
      volatilidades[a.id] = redondea(Math.sqrt(varPeriodo * periodosPorAno));
    }

    for (let j = i; j < retornos.length; j += 1) {
      const b = retornos[j];
      if (i === j) {
        rho[a.id][a.id] = 1;
        observaciones[a.id][a.id] = propios.length;
        continue;
      }
      // Pearson sobre los retornos en que AMBOS activos tienen dato.
      const xs = [];
      const ys = [];
      const n = Math.min(a.r.length, b.r.length);
      for (let t = 0; t < n; t += 1) {
        if (Number.isFinite(a.r[t]) && Number.isFinite(b.r[t])) {
          xs.push(a.r[t]);
          ys.push(b.r[t]);
        }
      }
      observaciones[a.id][b.id] = xs.length;
      observaciones[b.id][a.id] = xs.length;
      if (xs.length < 2) continue; // sin datos comunes: el par queda SIN correlación
      const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
      const my = ys.reduce((s, v) => s + v, 0) / ys.length;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let t = 0; t < xs.length; t += 1) {
        sxy += (xs[t] - mx) * (ys[t] - my);
        sxx += (xs[t] - mx) ** 2;
        syy += (ys[t] - my) ** 2;
      }
      if (sxx <= 0 || syy <= 0) continue; // serie plana: correlación indefinida
      const r = Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
      rho[a.id][b.id] = redondea(r);
      rho[b.id][a.id] = redondea(r);
    }
  }

  return { ids, rho, volatilidades, observaciones };
}

/**
 * Serie de caídas (drawdown) de una serie de niveles.
 * Portado literal de calculateUnderwaterSeries() en underwater.ts:
 *   dd_t = V_t / max_{s≤t}(V_s) − 1
 * Un valor no finito da NaN en ese punto, pero el pico se conserva.
 */
export function serieDeCaidas(niveles) {
  if (!niveles || niveles.length === 0) return [];
  const caidas = new Array(niveles.length).fill(0);
  let pico = -Infinity;
  for (let i = 0; i < niveles.length; i += 1) {
    const v = niveles[i];
    if (Number.isFinite(v)) {
      if (v > pico) pico = v;
      caidas[i] = pico > 0 ? v / pico - 1 : 0;
    } else {
      caidas[i] = NaN;
    }
  }
  return caidas;
}

/**
 * Métricas de la tabla del visitante (guía, paso 16) a partir de una serie
 * de niveles: rentabilidad del periodo (total y anualizada), volatilidad
 * anualizada y máxima caída — la peor caída de pico a valle, la métrica más
 * intuitiva para un particular.
 *
 * @param {number[]} niveles  serie de niveles ya alineada (get_price_series)
 * @param {{periodosPorAno?:number}} [opciones]  252 diaria · 52 semanal · 12 mensual
 * @returns {{rentabilidadTotal:number, rentabilidadAnualizada:number,
 *   volatilidad:number, maximaCaida:number, observaciones:number}|undefined}
 *   `maximaCaida` es negativa o cero (p. ej. −0,24 = caída del 24 %).
 *   Con menos de 2 niveles válidos no hay métrica: undefined, nada inventado.
 */
export function metricasDesdeSerie(niveles, { periodosPorAno = DIAS_MERCADO } = {}) {
  const validos = (niveles || []).filter(Number.isFinite);
  if (validos.length < 2 || validos[0] <= 0) return undefined;

  const retornos = [];
  for (let t = 1; t < validos.length; t += 1) {
    if (validos[t - 1] > 0) retornos.push(validos[t] / validos[t - 1] - 1);
  }
  const media = retornos.reduce((s, v) => s + v, 0) / retornos.length;
  const varianza = retornos.reduce((s, v) => s + (v - media) ** 2, 0) / (retornos.length - 1);

  const total = validos[validos.length - 1] / validos[0] - 1;
  const anos = retornos.length / periodosPorAno;
  const caidas = serieDeCaidas(validos);

  return {
    rentabilidadTotal: redondea(total),
    rentabilidadAnualizada: redondea((1 + total) ** (1 / anos) - 1),
    volatilidad: redondea(Math.sqrt(Math.max(varianza, 0) * periodosPorAno)),
    maximaCaida: redondea(Math.min(...caidas.filter(Number.isFinite))),
    observaciones: retornos.length,
  };
}

/**
 * Registra (o retira, con null) la matriz de correlaciones reales que
 * usará `correlacion()` para activos concretos.
 */
export function estableceCorrelaciones(matriz) {
  matrizActiva = matriz || null;
}

/** La matriz registrada, por si la interfaz quiere pintarla. */
export function correlacionesActivas() {
  return matrizActiva;
}

/**
 * Correlación entre dos posiciones.
 *
 * - Entre CLASES de activo: supuesto por clase, copiado literal de
 *   assumedAssetClassCorrelation() en portfolioRiskModel.ts. Sigue siendo
 *   el corazón del simulador del visitante.
 * - Entre ACTIVOS concretos (cualquier identificador que no sea una clase):
 *   lectura de la matriz real registrada. Si no hay matriz o al par le
 *   faltan datos, devuelve undefined — nunca se inventa una correlación
 *   (guía, paso 8) ni se degrada en silencio al supuesto por clase.
 */
export function correlacion(a, b) {
  const sonClases = a in CLASES && b in CLASES;
  if (!sonClases) {
    const real = matrizActiva?.rho?.[a]?.[b];
    return Number.isFinite(real) ? real : undefined;
  }
  if (a === b) return 0.75;
  const esBolsa = (c) => c === 'EQUITY';
  const esRentaFija = (c) => c === 'FIXED_INCOME' || c === 'MONEY_MARKET';
  if ((esBolsa(a) && esRentaFija(b)) || (esRentaFija(a) && esBolsa(b))) return 0.05;
  if (esRentaFija(a) && esRentaFija(b)) return 0.6;
  if (esBolsa(a) && esBolsa(b)) return 0.7;
  return 0.3;
}

const redondea = (v) => Number(v.toFixed(4));

/** Identificador de una posición: el id del activo o, si no hay, su clase. */
const claveDe = (p) => p.id ?? p.clase;

/**
 * Volatilidad anual de una posición, por orden de preferencia:
 * la traiga ella misma → la real de la matriz registrada → la de su clase.
 */
const volDe = (p) => {
  if (Number.isFinite(p.volatilidad)) return p.volatilidad;
  const real = matrizActiva?.volatilidades?.[p.id];
  if (Number.isFinite(real)) return real;
  return CLASES[p.clase]?.volatilidad;
};

/**
 * Volatilidad de la cartera. Raíz de la suma doble de covarianzas:
 *   σ² = Σᵢ Σⱼ wᵢ wⱼ ρᵢⱼ σᵢ σⱼ
 * Es lo que hace que el conjunto arriesgue menos que la suma de sus partes.
 *
 * ρ sale de `correlacion()`: por clase en el simulador, real en cartera de
 * activos concretos. Si a algún par o posición le faltan datos (ρ o σ),
 * devuelve undefined en vez de calcular con cifras inventadas.
 *
 * @param {Array<{clase?:string, id?:string, peso:number, volatilidad?:number}>}
 *   posiciones  pesos en % (suman 100). Con `id`, la posición se trata como
 *   activo concreto; sin él, como clase de activo.
 */
export function volatilidadCartera(posiciones) {
  const conPeso = posiciones.filter((p) => Number.isFinite(p.peso) && p.peso > 0);
  const total = conPeso.reduce((s, p) => s + p.peso, 0);
  if (total <= 0) return undefined;

  const norm = [];
  for (const p of conPeso) {
    const vol = volDe(p);
    if (!Number.isFinite(vol)) return undefined; // posición sin σ conocida
    norm.push({ clave: claveDe(p), peso: p.peso / total, vol });
  }

  let varianza = 0;
  for (const i of norm) {
    for (const j of norm) {
      const rho = i.clave === j.clave ? 1 : correlacion(i.clave, j.clave);
      if (!Number.isFinite(rho)) return undefined; // par sin correlación conocida
      varianza += i.peso * j.peso * rho * i.vol * j.vol;
    }
  }
  return redondea(Math.sqrt(Math.max(varianza, 0)));
}

/**
 * Rentabilidad esperada: media ponderada simple. Cada posición puede traer
 * su propia rentabilidad anual; si no, se usa la de su clase.
 */
export function rentabilidadCartera(posiciones) {
  const conPeso = posiciones.filter((p) => Number.isFinite(p.peso) && p.peso > 0);
  const total = conPeso.reduce((s, p) => s + p.peso, 0);
  if (total <= 0) return undefined;
  let r = 0;
  for (const p of conPeso) {
    const rent = Number.isFinite(p.rentabilidad)
      ? p.rentabilidad
      : CLASES[p.clase]?.rentabilidad;
    if (!Number.isFinite(rent)) return undefined;
    r += (p.peso / total) * rent;
  }
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
  let v = 0;
  for (const p of conPeso) {
    const vol = volDe(p);
    if (!Number.isFinite(vol)) return undefined;
    v += (p.peso / total) * vol;
  }
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
 * Versión reducida de computeFrontier() de frontier.ts: Monte Carlo de pesos,
 * quedándose con la mejor rentabilidad de cada tramo de riesgo y filtrando
 * después a una frontera monótona creciente en rentabilidad (guía, paso 15).
 *
 * Dos modos (guía, pasos 12 y 15):
 *   - Sin `activos`: sobre las cuatro CLASES, como siempre (visitante).
 *   - Con `activos`: sobre posiciones reales. Cada activo es
 *     { id, rentabilidad, volatilidad? } — la σ puede venir en el propio
 *     activo o de la matriz registrada (estableceCorrelaciones), y la ρ de
 *     cada par sale SIEMPRE de esa matriz. Si a algún activo le falta σ o
 *     rentabilidad, o a algún par le falta ρ, no se calcula nada y el
 *     problema se devuelve en `sinDatos` — nunca se inventa una cifra.
 */
export function frontera({ muestras = 4000, tramos = 28, semilla = 42, activos = null } = {}) {
  const conActivos = Array.isArray(activos) && activos.length > 0;
  const base = conActivos
    ? activos.map((a) => ({ id: a.id, rentabilidad: a.rentabilidad, volatilidad: a.volatilidad }))
    : Object.keys(CLASES).map((clase) => ({ clase }));

  if (conActivos) {
    const sinDatos = [];
    for (const a of base) {
      if (!Number.isFinite(volDe(a))) sinDatos.push(`${a.id}: sin volatilidad`);
      if (!Number.isFinite(a.rentabilidad)) sinDatos.push(`${a.id}: sin rentabilidad`);
    }
    for (let i = 0; i < base.length; i += 1) {
      for (let j = i + 1; j < base.length; j += 1) {
        if (!Number.isFinite(correlacion(base[i].id, base[j].id))) {
          sinDatos.push(`${base[i].id}–${base[j].id}: sin correlación`);
        }
      }
    }
    if (sinDatos.length) return { nube: [], frontera: [], sinDatos };
  }

  const rnd = aleatorio(semilla);
  const nube = [];

  for (let n = 0; n < muestras; n += 1) {
    const brutos = base.map(() => rnd());
    const suma = brutos.reduce((s, v) => s + v, 0) || 1;
    const posiciones = base.map((activo, i) => ({ ...activo, peso: (brutos[i] / suma) * 100 }));
    const vol = volatilidadCartera(posiciones);
    const rent = rentabilidadCartera(posiciones);
    if (vol == null || rent == null) continue;
    nube.push({ volatilidad: vol, rentabilidad: rent, pesos: posiciones });
  }

  if (!nube.length) return { nube: [], frontera: [], sinDatos: [] };

  // Frontera: la cartera de mayor rentabilidad dentro de cada tramo de riesgo.
  const min = Math.min(...nube.map((p) => p.volatilidad));
  const max = Math.max(...nube.map((p) => p.volatilidad));
  const ancho = (max - min) / tramos || 1;
  const mejores = [];
  for (let t = 0; t < tramos; t += 1) {
    const desde = min + t * ancho;
    const hasta = desde + ancho;
    const enTramo = nube.filter((p) => p.volatilidad >= desde && p.volatilidad < hasta);
    if (!enTramo.length) continue;
    mejores.push(enTramo.reduce((a, b) => (b.rentabilidad > a.rentabilidad ? b : a)));
  }

  // Monótona: más riesgo solo aparece en la frontera si paga más rentabilidad.
  mejores.sort((a, b) => a.volatilidad - b.volatilidad);
  const monotona = [];
  let mejorRentabilidad = -Infinity;
  for (const punto of mejores) {
    if (punto.rentabilidad > mejorRentabilidad) {
      monotona.push(punto);
      mejorRentabilidad = punto.rentabilidad;
    }
  }

  return { nube, frontera: monotona, sinDatos: [] };
}

/* ── Proyección por simulación de Montecarlo (guía, paso 33) ─────────────── */

/**
 * Proyección del valor de 100 unidades por simulación de Montecarlo, con los
 * supuestos a la vista: una rentabilidad anual y una volatilidad anual dadas
 * (típicamente las históricas de 3 años de la combinación). Es una simulación
 * bajo esos supuestos, no una previsión.
 *
 * Modelo: pasos mensuales lognormales con deriva ln(1+r)/12 y desviación
 * σ/√12; normales por Box–Muller sobre el mismo generador reproducible de la
 * frontera (misma semilla → misma proyección, también en las baterías).
 * La rentabilidad de entrada es la anualizada (geométrica), así que la deriva
 * del logaritmo es ln(1+r) tal cual — sin corrección −σ²/2, que sería para
 * una media aritmética—: la mediana simulada reproduce (1+r)^años.
 *
 * @param {{rentabilidad:number, volatilidad:number, anos?:number,
 *   iteraciones?:number, semilla?:number}} opciones
 * @returns {{anos:Array<{ano:number, p5:number, p50:number, p95:number}>,
 *   iteraciones:number, base:number}|null}  percentiles del valor simulado al
 *   cierre de cada año (base 100). Sin rentabilidad o volatilidad válidas →
 *   null: nunca se inventa una cifra.
 */
export function proyeccionMonteCarlo({
  rentabilidad, volatilidad, anos = 10, iteraciones = 4000, semilla = 42,
} = {}) {
  if (!Number.isFinite(rentabilidad) || !Number.isFinite(volatilidad)
    || volatilidad < 0 || rentabilidad <= -1 || anos < 1) return null;

  const pasosPorAno = 12;
  const deriva = Math.log(1 + rentabilidad) / pasosPorAno;
  const sigma = volatilidad / Math.sqrt(pasosPorAno);
  const rnd = aleatorio(semilla);

  // Normales estándar por Box–Muller, de dos en dos.
  let guardada = null;
  const normal = () => {
    if (guardada != null) { const v = guardada; guardada = null; return v; }
    let u = 0;
    while (u === 0) u = rnd(); // evita ln(0)
    const v = rnd();
    const radio = Math.sqrt(-2 * Math.log(u));
    guardada = radio * Math.sin(2 * Math.PI * v);
    return radio * Math.cos(2 * Math.PI * v);
  };

  const porAno = Array.from({ length: anos }, () => new Array(iteraciones));
  for (let i = 0; i < iteraciones; i += 1) {
    let logValor = Math.log(100);
    for (let a = 0; a < anos; a += 1) {
      for (let p = 0; p < pasosPorAno; p += 1) {
        logValor += deriva + sigma * normal();
      }
      porAno[a][i] = Math.exp(logValor);
    }
  }

  const percentil = (valores, q) => {
    const orden = [...valores].sort((x, y) => x - y);
    return orden[Math.min(orden.length - 1, Math.max(0, Math.round(q * (orden.length - 1))))];
  };

  return {
    base: 100,
    iteraciones,
    anos: porAno.map((valores, a) => ({
      ano: a + 1,
      p5: redondea(percentil(valores, 0.05)),
      p25: redondea(percentil(valores, 0.25)),
      p50: redondea(percentil(valores, 0.5)),
      p75: redondea(percentil(valores, 0.75)),
      p95: redondea(percentil(valores, 0.95)),
    })),
  };
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

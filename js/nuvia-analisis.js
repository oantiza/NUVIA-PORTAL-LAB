/**
 * NUVIA — análisis ampliado del nivel registrado (paso 32, Fase 4).
 *
 * Con la sesión iniciada, la cartera montada en el constructor se analiza
 * además por: ahorro por diversificar (sobre el historial real ya cargado),
 * concentración sectorial y geográfica (fichas de `get_asset_detail`, con la
 * calidad del dato declarada) y solapamiento entre fondos y ETF
 * (`get_asset_holdings_batch`, y si el lote no responde, fondo a fondo con
 * `get_asset_holdings`). Todo se calcula en el navegador con los
 * módulos ya portados en la Fase 2; aquí solo se orquesta y se pinta.
 *
 * Sin sesión, el bloque se limita a decir que este análisis existe y con qué
 * se abre. Lenguaje: describe, nunca prescribe; cuando falta un dato se dice
 * tal cual y nunca se inventa una cifra.
 *
 * Paso 33: el nivel registrado suma la frontera estática con su combinación
 * marcada; el suscriptor (aún sin contratación abierta) la versión
 * interactiva, la proyección por Montecarlo y la matriz de correlaciones.
 */

import {
  correlacionesDesdeSeries, estableceCorrelaciones, frontera,
  metricasDesdeSerie, proyeccionMonteCarlo, pct, num,
  sharpe, volatilidadCartera, rentabilidadCartera,
} from './nuvia-cartera.js';
import { concentracionSectorial, concentracionGeografica } from './nuvia-concentracion.js';
import { grupoMapa } from './nuvia-mapa.js';
import { matrizSolapamiento } from './nuvia-solapamiento.js';
import {
  etiquetaSector, etiquetaRegion, nombreCorto, marcasEje, separaVerticalmente,
} from './nuvia-etiquetas.js';

export const NOTA_ANALISIS_CERRADO = 'Con la sesión iniciada, esta misma '
  + 'cartera se analiza también por concentración, solapamiento entre fondos '
  + 'y ahorro por diversificar. Es el análisis ampliado de la cuenta gratuita.';

export const FUENTE_ANALISIS = 'Fichas y desgloses de la base de datos NUVIA '
  + 'a su último cierre; el ahorro por diversificar sale del mismo historial '
  + 'de 3 años de la tabla de métricas.';

/** Qué añade el nivel suscriptor, dicho al registrado sin empujar (paso 33).
 *  La suscripción aún no puede contratarse y se dice tal cual. */
export const NOTA_ANALISIS_SUSCRIPTOR = 'El nivel suscriptor —aún no abierto '
  + 'a contratación— añade sobre esta misma cartera la frontera interactiva '
  + '(recorrerla y ver el reparto de cada punto), una proyección por '
  + 'simulación y la matriz de correlaciones, con hasta 20 posiciones.';

/** Qué es la frontera, en llano y sin previsión (bases §2). */
export const TEXTO_FRONTERA = 'La curva une, a cada nivel de riesgo, la mezcla '
  + 'de estos mismos activos que más rentó en el historial de 3 años; cualquier '
  + 'otra mezcla quedó por debajo de la curva. Describe ese historial, no el futuro.';

/** Qué es la proyección: simulación con supuestos a la vista, nunca previsión. */
export const TEXTO_PROYECCION = 'Simulación de 4.000 trayectorias a pasos '
  + 'mensuales, partiendo de 100 y usando como supuestos la rentabilidad y la '
  + 'volatilidad históricas de esta combinación (las de la tabla de métricas). '
  + 'Entre el valor del 5 % y el del 95 % quedan nueve de cada diez '
  + 'trayectorias simuladas. Es una simulación con esos supuestos, '
  + 'no es una previsión.';

/** Cómo leer la matriz de correlaciones, sin jerga suelta. */
export const TEXTO_CORRELACIONES = 'Correlación de Pearson sobre los retornos '
  + 'diarios comunes de 3 años: 1 significa moverse a la vez, 0 sin relación, '
  + '−1 en sentido contrario. Un par sin datos comunes queda sin cifra.';

/* ── Helpers puros (probados en docs/nuvia-analisis.test.mjs) ── */

/** Etiqueta legible de una clave de sector o región de la maestra. No se
 *  traduce: se muestra la clave tal y como la sirve la base, solo aseada. */
export function etiquetaClave(clave) {
  const texto = String(clave || '').replace(/_/g, ' ').trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '—';
}

/** Posiciones en el formato de los módulos de concentración:
 *  [{asset_id, weight_percent}] con pesos normalizados 0–100. */
export function posicionesParaAnalisis(posiciones, pesos) {
  if (!pesos) return [];
  return (posiciones || [])
    .filter((p) => p.activo?.asset_id && pesos[p.activo.asset_id] != null)
    .map((p) => ({ asset_id: p.activo.asset_id, weight_percent: pesos[p.activo.asset_id] * 100 }));
}

/** Ids de las posiciones que son fondos o ETF: las únicas con desglose que
 *  comparar. Una acción directa no tiene cartera por dentro. */
export function idsDeFondos(posiciones) {
  return (posiciones || [])
    .filter((p) => ['FUND', 'ETF'].includes(String(p.activo?.instrument_type || '').toUpperCase()))
    .map((p) => p.activo.asset_id);
}

/**
 * Ahorro por diversificar sobre el historial real: volatilidad de la
 * combinación frente a la que tendría si todo se moviera a la vez (ρ = 1).
 * Si a algún activo o par le faltan datos, devuelve null: nunca se inventa.
 *
 * @param {Array<{asset_id:string, values:number[]}>} series  de get_price_series
 * @param {Object} pesos  {asset_id: fracción 0–1} (pesosNormalizados)
 */
export function ahorroDeSeries(series, pesos) {
  if (!pesos) return null;
  const conPeso = (series || []).filter((s) => pesos[s.asset_id] != null);
  if (conPeso.length < 2) return null; // con una sola posición no hay diversificación que medir
  const { rho, volatilidades } = correlacionesDesdeSeries(
    conPeso.map((s) => ({ id: s.asset_id, niveles: s.values })));
  let varianza = 0;
  let sinDiversificar = 0;
  for (const a of conPeso) {
    const volA = volatilidades[a.asset_id];
    if (!Number.isFinite(volA)) return null;
    sinDiversificar += pesos[a.asset_id] * volA;
    for (const b of conPeso) {
      const volB = volatilidades[b.asset_id];
      const r = a.asset_id === b.asset_id ? 1 : rho[a.asset_id]?.[b.asset_id];
      if (!Number.isFinite(volB) || !Number.isFinite(r)) return null;
      varianza += pesos[a.asset_id] * pesos[b.asset_id] * r * volA * volB;
    }
  }
  const volatilidad = Math.sqrt(Math.max(varianza, 0));
  return {
    volatilidad: Number(volatilidad.toFixed(4)),
    sinDiversificar: Number(sinDiversificar.toFixed(4)),
    ahorro: Number((sinDiversificar - volatilidad).toFixed(4)),
  };
}

/** Lectura llana del ahorro: la cifra y qué significa, sin aconsejar. */
export function textoAhorro(a) {
  if (!a) return null;
  return `Estos activos, juntos, se han movido con una volatilidad del `
    + `${pct(a.volatilidad)}. Si subieran y bajaran todos a la vez habría sido `
    + `del ${pct(a.sinDiversificar)}: la diferencia, `
    + `${pct(a.ahorro)}, es lo que ha aportado diversificar en esta combinación.`;
}

/**
 * Cartera de un fondo en la forma que espera el módulo de solapamiento,
 * a partir del documento REAL de `get_asset_holdings` en producción:
 *   { holdings: [{ holding_name, holding_weight, holding_weight_unit,
 *                  identifiers: { isin?, ticker? }, ... }] }
 * También acepta la forma corta { holdings: [{ name, isin?, ticker?,
 * weight_pct }] } tal cual. Una fila sin nombre o sin peso en porcentaje se
 * descarta: nunca se inventa. Sin filas útiles devuelve null (sin datos).
 */
export function carteraDesdeHoldings(doc) {
  const filas = Array.isArray(doc?.holdings) ? doc.holdings : [];
  const holdings = [];
  for (const h of filas) {
    const nombre = h.name ?? h.holding_name ?? h.raw_source?.name ?? null;
    let peso = null;
    if (Number.isFinite(h.weight_pct)) peso = h.weight_pct;
    else if (Number.isFinite(h.holding_weight)
      && (h.holding_weight_unit == null || h.holding_weight_unit === 'percent')) {
      peso = h.holding_weight;
    }
    if (nombre == null || !Number.isFinite(peso)) continue;
    holdings.push({
      name: nombre,
      isin: h.isin ?? h.identifiers?.isin ?? undefined,
      ticker: h.ticker ?? h.identifiers?.ticker ?? undefined,
      weight_pct: peso,
    });
  }
  return holdings.length ? { holdings } : null;
}

/** Frase que declara la calidad del dato de concentración (bases §2). */
export function textoCalidad(resultado) {
  if (!resultado || resultado.calidad === 'none') return null;
  if (resultado.calidad === 'lookthrough') {
    return 'Con desglose real de la base de datos NUVIA.';
  }
  if (resultado.calidad === 'estimated') {
    return 'Todo el reparto es una estimación por heurística, no un desglose real; se dice tal cual.';
  }
  return `Desglose real en su mayor parte; un ${pct((resultado.pesoEstimado || 0) / 100, 0)} del peso está estimado por heurística.`;
}

/**
 * Activos de la frontera: id y rentabilidad anualizada de su propia serie
 * (la σ y la ρ de cada par salen de la matriz registrada). Solo entran los
 * que están en el cálculo (tienen peso); sin métrica propia, la rentabilidad
 * queda ausente y `frontera()` lo declarará en `sinDatos`.
 */
export function activosParaFrontera(series, pesos) {
  if (!pesos) return [];
  return (series || [])
    .filter((s) => pesos[s.asset_id] != null)
    .map((s) => ({
      id: s.asset_id,
      rentabilidad: metricasDesdeSerie(s.values)?.rentabilidadAnualizada,
    }));
}

/** Filas de la proyección para la tabla: los años señalados que existan. */
export function filasProyeccion(proyeccion, senalados = [1, 3, 5, 10]) {
  if (!proyeccion) return [];
  return proyeccion.anos.filter((fila) => senalados.includes(fila.ano));
}

/**
 * Puntos del abanico de la proyección (paso 40): las tres sendas de
 * percentiles año a año, con el año 0 anclado en la base. Pura y probada;
 * null sin proyección.
 */
export function puntosAbanico(proyeccion) {
  if (!proyeccion?.anos?.length) return null;
  const base = proyeccion.base ?? 100;
  const conCuartiles = proyeccion.anos.every((f) => Number.isFinite(f.p25) && Number.isFinite(f.p75));
  return {
    anos: [0, ...proyeccion.anos.map((f) => f.ano)],
    p5: [base, ...proyeccion.anos.map((f) => f.p5)],
    p25: conCuartiles ? [base, ...proyeccion.anos.map((f) => f.p25)] : null,
    p50: [base, ...proyeccion.anos.map((f) => f.p50)],
    p75: conCuartiles ? [base, ...proyeccion.anos.map((f) => f.p75)] : null,
    p95: [base, ...proyeccion.anos.map((f) => f.p95)],
  };
}

/**
 * Puntos del mapa riesgo/rentabilidad (paso 41): cada activo en el
 * cálculo con su volatilidad y su rentabilidad anualizada del historial
 * real. Pura y probada; el activo sin métrica queda fuera y declarado.
 */
export function puntosMapaRiesgo(series, pesos) {
  const dentro = (series || []).filter((s) => pesos?.[s.asset_id] != null);
  const puntos = [];
  const sinMetrica = [];
  for (const s of dentro) {
    const m = metricasDesdeSerie(s.values);
    if (m && Number.isFinite(m.volatilidad) && Number.isFinite(m.rentabilidadAnualizada)) {
      puntos.push({ id: s.asset_id, volatilidad: m.volatilidad, rentabilidad: m.rentabilidadAnualizada });
    } else {
      sinMetrica.push(s.asset_id);
    }
  }
  return { puntos, sinMetrica };
}

/**
 * Tramo eficiente de la frontera (Fase 7): ordenada por riesgo y quedándose
 * solo con los puntos que rentan más que todo lo anterior. Así la línea sube
 * siempre —de la mezcla más tranquila a la que más rentó— y desaparece el
 * garabato del tramo donde más riesgo dio menos rentabilidad, que no enseña
 * nada. Pura y probada.
 */
export function tramoEficiente(puntos) {
  const orden = [...(puntos || [])]
    .filter((p) => Number.isFinite(p?.volatilidad) && Number.isFinite(p?.rentabilidad))
    .sort((a, b) => a.volatilidad - b.volatilidad);
  const tramo = [];
  let tope = -Infinity;
  for (const p of orden) {
    if (p.rentabilidad > tope) { tramo.push(p); tope = p.rentabilidad; }
  }
  return tramo;
}

/**
 * Cuánto movimiento de la combinación puso cada posición (Fase 7): la
 * contribución de cada activo a la varianza de la cartera, en porcentaje del
 * total. Suma 100; una cifra negativa significa que esa posición amortiguó
 * el movimiento del conjunto en ese historial. Si a algún activo o par le
 * faltan datos devuelve null: nunca se inventa. Pura y probada.
 */
export function contribucionesRiesgo(series, pesos) {
  if (!pesos) return null;
  const conPeso = (series || []).filter((s) => pesos[s.asset_id] != null);
  if (conPeso.length < 2) return null;
  const { rho, volatilidades } = correlacionesDesdeSeries(
    conPeso.map((s) => ({ id: s.asset_id, niveles: s.values })));
  let varianza = 0;
  const brutas = [];
  for (const a of conPeso) {
    const volA = volatilidades[a.asset_id];
    if (!Number.isFinite(volA)) return null;
    let fila = 0;
    for (const b of conPeso) {
      const volB = volatilidades[b.asset_id];
      const r = a.asset_id === b.asset_id ? 1 : rho[a.asset_id]?.[b.asset_id];
      if (!Number.isFinite(volB) || !Number.isFinite(r)) return null;
      fila += pesos[b.asset_id] * r * volA * volB;
    }
    brutas.push({ id: a.asset_id, bruta: pesos[a.asset_id] * fila });
    varianza += pesos[a.asset_id] * fila;
  }
  if (!(varianza > 0)) return null;
  return brutas
    .map(({ id, bruta }) => ({ id, porcentaje: Number(((bruta / varianza) * 100).toFixed(1)) }))
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

/**
 * Los pares de la matriz de correlaciones que merecen contarse aparte
 * (Fase 7): los que más se movieron a la vez y los de menor relación (o en
 * sentido contrario). Pura y probada.
 */
export function paresDestacados(ids, rho, cuantos = 3) {
  const pares = [];
  for (let i = 0; i < (ids || []).length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const valor = rho?.[ids[i]]?.[ids[j]];
      if (Number.isFinite(valor)) pares.push({ a: ids[i], b: ids[j], valor });
    }
  }
  const orden = [...pares].sort((x, y) => y.valor - x.valor);
  const altos = orden.slice(0, cuantos);
  const bajos = orden.slice(cuantos).slice(-cuantos).reverse();
  return { pares, altos, bajos };
}

/**
 * Envolvente cóncava del tramo eficiente (Fase 7): la frontera muestreada
 * por Montecarlo sale con dientes de sierra; la curva real es un arco liso.
 * Se queda con los vértices superiores (pendiente siempre decreciente), de
 * modo que ningún punto muestreado queda por encima y el dibujo es el arco
 * limpio del laboratorio clásico. Pura y probada.
 */
export function envolventeConcava(puntos) {
  const orden = [...(puntos || [])]
    .filter((p) => Number.isFinite(p?.volatilidad) && Number.isFinite(p?.rentabilidad))
    .sort((a, b) => a.volatilidad - b.volatilidad);
  /* Dos muestras con la misma volatilidad: se queda la que más rentó. */
  const limpio = [];
  for (const p of orden) {
    const ultimo = limpio[limpio.length - 1];
    if (ultimo && Math.abs(ultimo.volatilidad - p.volatilidad) < 1e-12) {
      if (p.rentabilidad > ultimo.rentabilidad) limpio[limpio.length - 1] = p;
    } else {
      limpio.push(p);
    }
  }
  const pendiente = (a, b) => (b.rentabilidad - a.rentabilidad) / (b.volatilidad - a.volatilidad);
  const casco = [];
  for (const p of limpio) {
    while (casco.length >= 2
      && pendiente(casco[casco.length - 2], casco[casco.length - 1]) <= pendiente(casco[casco.length - 1], p)) {
      casco.pop();
    }
    casco.push(p);
  }
  return casco;
}

/**
 * Redondeo de esquinas (Chaikin): cada esquina de la polilínea se sustituye
 * por dos puntos a un cuarto y tres cuartos del tramo, varias veces, con los
 * extremos fijos. Una polilínea cóncava sigue cóncava y los codos pasan a
 * ser arcos, que es como dibuja el laboratorio clásico. Pura y probada.
 */
export function suavizaEsquinas(puntos, iteraciones = 4) {
  let pts = [...(puntos || [])].filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  for (let k = 0; k < iteraciones; k += 1) {
    if (pts.length < 3) break;
    const salida = [pts[0]];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i]; const b = pts[i + 1];
      salida.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      salida.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    salida.push(pts[pts.length - 1]);
    pts = salida;
  }
  return pts;
}

/**
 * Camino SVG suave por los puntos dados (Catmull-Rom a Bézier), como la
 * curva del laboratorio clásico: una línea que se lee de un vistazo, sin
 * quiebros. Recibe [{x, y}] en coordenadas de pantalla. Pura y probada.
 */
export function caminoSuave(puntos) {
  const pts = (puntos || []).filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) return `${d} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Los dos puntos señalados de la frontera (encargo de Óscar, 21-08): la
 * mezcla de menor volatilidad y la de mayor Sharpe del historial. Son
 * hechos del cálculo, no un juicio: «la que menos se movió» y «la que más
 * rentó por unidad de riesgo». Pura y probada; null sin puntos.
 */
export function puntosSenalados(eficiente) {
  const puntos = (eficiente || []).filter((p) => Number.isFinite(p?.volatilidad) && Number.isFinite(p?.rentabilidad));
  if (!puntos.length) return null;
  const menorRiesgo = puntos.reduce((m, p) => (p.volatilidad < m.volatilidad ? p : m));
  const mayorSharpe = puntos.reduce((m, p) => {
    const sp = sharpe(p.rentabilidad, p.volatilidad);
    const sm = sharpe(m.rentabilidad, m.volatilidad);
    return Number.isFinite(sp) && (!Number.isFinite(sm) || sp > sm) ? p : m;
  });
  return { menorRiesgo, mayorSharpe };
}

/**
 * Perfiles de referencia para el mapa riesgo-retorno (encargo de Óscar,
 * 21-08): mezclas de renta variable y renta fija globales a distintas
 * proporciones, calculadas con los supuestos publicados en la página
 * (CLASES y sus correlaciones). Idénticos para cualquiera que mire; no
 * describen a ningún lector. Pura y probada.
 */
export function perfilesReferencia(proporciones = [10, 30, 50, 70, 90]) {
  return proporciones
    .map((rv) => {
      const posiciones = [
        { clase: 'EQUITY', peso: rv },
        { clase: 'FIXED_INCOME', peso: 100 - rv },
      ];
      return {
        rv,
        volatilidad: volatilidadCartera(posiciones),
        rentabilidad: rentabilidadCartera(posiciones),
      };
    })
    .filter((p) => Number.isFinite(p.volatilidad) && Number.isFinite(p.rentabilidad));
}

/** La correlación de un par, dicha en llano. Pura y probada. */
export function fraseCorrelacion(valor) {
  if (!Number.isFinite(valor)) return 'sin datos comunes';
  if (valor >= 0.8) return 'casi siempre a la vez';
  if (valor >= 0.5) return 'a menudo a la vez';
  if (valor >= 0.2) return 'algo a la vez';
  if (valor > -0.2) return 'poca relación';
  return 'en sentido contrario';
}

/* ── Montaje ── */

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

const NS_SVG = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, texto) {
  const nodo = document.createElementNS(NS_SVG, tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

/* ── Piezas comunes de los gráficos (Fase 7): un gráfico enseña una idea ── */

/** Un grupo del análisis: título claro y, debajo, qué enseña. */
function grupo(titulo, lectura) {
  const bloque = el('div', { class: 'nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, titulo));
  if (lectura) bloque.append(el('p', { class: 'nv-analisis__lectura' }, lectura));
  return bloque;
}

/** Decimales de las marcas de un eje en %: enteros si el paso lo permite. */
function decimalesDe(paso) {
  return paso >= 0.0095 ? 0 : 1;
}

/**
 * Ejes cartesianos con rejilla y marcas redondas, para los gráficos de
 * dispersión. Dibuja sobre el svg y devuelve las escalas { x, y }.
 */
function dibujaEjes(svg, {
  W, H, izq, der, arriba, abajo, ejeX, ejeY, tituloX, tituloY,
  formatoX = (v) => pct(v, decimalesDe(ejeX.paso)),
  formatoY = (v) => pct(v, decimalesDe(ejeY.paso)),
}) {
  const x = (v) => izq + ((v - ejeX.min) / ((ejeX.max - ejeX.min) || 1)) * (W - izq - der);
  const y = (v) => H - abajo - ((v - ejeY.min) / ((ejeY.max - ejeY.min) || 1)) * (H - abajo - arriba);
  for (const v of ejeY.marcas) {
    const yy = y(v).toFixed(1);
    svg.append(svgEl('line', { x1: izq, y1: yy, x2: W - der, y2: yy, class: 'nv-grafico__rejilla' }));
    svg.append(svgEl('text', { x: izq - 8, y: (y(v) + 5).toFixed(1), 'text-anchor': 'end', class: 'nv-grafico__eje' }, formatoY(v)));
  }
  for (const v of ejeX.marcas) {
    const xx = x(v).toFixed(1);
    svg.append(svgEl('line', { x1: xx, y1: arriba, x2: xx, y2: H - abajo, class: 'nv-grafico__rejilla' }));
    svg.append(svgEl('text', { x: xx, y: H - abajo + 20, 'text-anchor': 'middle', class: 'nv-grafico__eje' }, formatoX(v)));
  }
  /* Las dos líneas de eje, como en el clásico: el marco que ordena. */
  svg.append(svgEl('line', { x1: izq, y1: arriba, x2: izq, y2: H - abajo, class: 'nv-grafico__eje-linea' }));
  svg.append(svgEl('line', { x1: izq, y1: H - abajo, x2: W - der, y2: H - abajo, class: 'nv-grafico__eje-linea' }));
  if (tituloX) {
    svg.append(svgEl('text', {
      x: (izq + W - der) / 2, y: H - 8, 'text-anchor': 'middle', class: 'nv-grafico__eje-titulo',
    }, tituloX));
  }
  if (tituloY) {
    const cy = (arriba + H - abajo) / 2;
    svg.append(svgEl('text', {
      x: 16, y: cy, transform: `rotate(-90 16 ${cy})`, 'text-anchor': 'middle', class: 'nv-grafico__eje-titulo',
    }, tituloY));
  }
  return { x, y };
}

/** Leyenda de un gráfico: marca de color y qué significa, en HTML legible. */
function leyenda(items) {
  const ul = el('ul', { class: 'nv-leyenda' });
  for (const item of items) {
    const li = el('li', { class: 'nv-leyenda__item' });
    li.append(
      el('span', { class: `nv-leyenda__marca ${item.clase}`, 'aria-hidden': 'true' }),
      el('span', {}, item.texto),
    );
    ul.append(li);
  }
  return ul;
}

/** El panel crema del laboratorio clásico: el gráfico vive dentro, con su
 *  leyenda de cifras separada por un filete. */
function panelGrafico(...hijos) {
  const panel = el('div', { class: 'nv-grafico__panel' });
  panel.append(...hijos.filter(Boolean));
  return panel;
}

/** La fila de cifras al pie del panel, como en el clásico:
 *  «● Tu combinación: …». Recibe [{clase, nombre, texto}]. */
function filaDeCifras(items) {
  const fila = el('ul', { class: 'nv-grafico__cifras' });
  for (const item of items) {
    const li = el('li', { class: 'nv-grafico__cifra' });
    li.append(
      el('span', { class: `nv-leyenda__marca ${item.clase}`, 'aria-hidden': 'true' }),
      el('strong', {}, item.nombre),
      el('span', {}, ` ${item.texto}`),
    );
    fila.append(li);
  }
  return fila;
}

/** Fila nombre + cifra + barra, la pieza de todas las listas con peso. */
function filaConBarra(nombre, cifra, anchoPct, { negativa = false } = {}) {
  const item = el('li', { class: 'nv-analisis__fila' });
  item.append(
    el('span', { class: 'nv-analisis__clave' }, nombre),
    el('span', { class: 'nv-analisis__peso' }, cifra),
  );
  const barra = el('span', {
    class: `nv-analisis__barra${negativa ? ' nv-analisis__barra--contraria' : ''}`,
    'aria-hidden': 'true',
  });
  barra.style.width = `${Math.min(100, Math.max(2, Math.abs(anchoPct)))}%`;
  item.append(barra);
  return item;
}

const cacheDetalles = new Map(); // asset_id -> promesa de ficha (o null)
const cacheHoldings = new Map(); // clave ids ordenados -> promesa {id: doc|null}

function detalleDe(datos, id) {
  if (!cacheDetalles.has(id)) {
    const promesa = datos.detalleActivo(id).catch(() => null);
    cacheDetalles.set(id, promesa);
  }
  return cacheDetalles.get(id);
}

const cacheHoldingsUno = new Map(); // asset_id -> promesa de doc|null

function holdingsUno(datos, id) {
  if (!cacheHoldingsUno.has(id)) {
    const promesa = datos.llama('get_asset_holdings', { asset_id: id }).catch(() => null);
    promesa.then((r) => { if (r === null) cacheHoldingsUno.delete(id); });
    cacheHoldingsUno.set(id, promesa);
  }
  return cacheHoldingsUno.get(id);
}

function holdingsDe(datos, ids) {
  const clave = [...ids].sort().join('|');
  if (!cacheHoldings.has(clave)) {
    const promesa = datos.llama('get_asset_holdings_batch', { asset_ids: ids })
      .then((r) => r?.holdings || {})
      .catch(async () => {
        /* En producción el batch responde 401 para las sesiones del portal:
         * se piden los desgloses fondo a fondo (como mucho 5, dentro del
         * límite de 30 por minuto). Si tampoco responde ninguno, null. */
        const docs = await Promise.all(ids.map((id) => holdingsUno(datos, id)));
        if (docs.every((d) => d == null)) return null;
        const porId = {};
        ids.forEach((id, i) => { porId[id] = docs[i] || null; });
        return porId;
      });
    promesa.then((r) => { if (r === null) cacheHoldings.delete(clave); });
    cacheHoldings.set(clave, promesa);
  }
  return cacheHoldings.get(clave);
}

/**
 * Dibuja la frontera en un SVG sencillo: nube gris, línea de la frontera y
 * — si hay métricas — la combinación del usuario marcada. En el nivel
 * suscriptor añade un control para recorrer la frontera y ver el reparto
 * de cada punto (la parte interactiva, guía paso 1).
 */
function grupoFrontera({ series, pesos, metricas, interactiva, nombreDe }) {
  const bloque = grupo('Todas las mezclas posibles y su frontera', TEXTO_FRONTERA);

  const activos = activosParaFrontera(series, pesos);
  if (activos.length < 2) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Con una sola posición en el cálculo no hay combinaciones que dibujar.'));
    return bloque;
  }
  const matriz = correlacionesDesdeSeries(
    (series || []).filter((s) => pesos[s.asset_id] != null)
      .map((s) => ({ id: s.asset_id, niveles: s.values })));
  estableceCorrelaciones(matriz);
  const f = frontera({ activos });
  if (f.sinDatos.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      `Faltan datos para dibujarla (${f.sinDatos.slice(0, 3).join('; ')}); nunca se inventa.`));
    return bloque;
  }
  const eficiente = tramoEficiente(f.frontera);

  /* El dibujo del clásico: la curva suave sola sobre el panel crema, los dos
     ejes como marco y las cifras al pie. Sin nube ni rejilla: una idea. */
  const W = 760; const H = 380; const izq = 74; const der = 30; const arriba = 26; const abajo = 62;
  const puntos = eficiente.concat(metricas ? [{ volatilidad: metricas.volatilidad, rentabilidad: metricas.rentabilidadAnualizada }] : []);
  /* Aire alrededor del dato, como en el clásico: nada pegado a los ejes. */
  let vMin = Math.min(...puntos.map((p) => p.volatilidad));
  let vMax = Math.max(...puntos.map((p) => p.volatilidad));
  let rMin = Math.min(...puntos.map((p) => p.rentabilidad));
  let rMax = Math.max(...puntos.map((p) => p.rentabilidad));
  const aireV = ((vMax - vMin) || Math.abs(vMax) || 0.01) * 0.12;
  const aireR = ((rMax - rMin) || Math.abs(rMax) || 0.01) * 0.12;
  vMin = Math.max(0, vMin - aireV); vMax += aireV;
  rMin -= aireR; rMax += aireR;
  const x = (v) => izq + ((v - vMin) / ((vMax - vMin) || 1)) * (W - izq - der);
  const y = (r) => H - abajo - ((r - rMin) / ((rMax - rMin) || 1)) * (H - abajo - arriba);

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'nv-frontera',
    role: 'img',
    'aria-label': 'La frontera de estos activos: '
      + `riesgo entre ${pct(vMin)} y ${pct(vMax)}, rentabilidad anual entre ${pct(rMin)} y ${pct(rMax)}`
      + (metricas ? `; tu combinación, con riesgo ${pct(metricas.volatilidad)} y rentabilidad ${pct(metricas.rentabilidadAnualizada)}.` : '.'),
  });
  /* El marco: dos ejes con sus extremos en cifra, sin más ruido. */
  svg.append(svgEl('line', { x1: izq, y1: arriba, x2: izq, y2: H - abajo, class: 'nv-grafico__eje-linea' }));
  svg.append(svgEl('line', { x1: izq, y1: H - abajo, x2: W - der, y2: H - abajo, class: 'nv-grafico__eje-linea' }));
  svg.append(
    svgEl('text', { x: izq, y: H - abajo + 20, class: 'nv-grafico__eje' }, pct(vMin)),
    svgEl('text', { x: W - der, y: H - abajo + 20, 'text-anchor': 'end', class: 'nv-grafico__eje' }, pct(vMax)),
    svgEl('text', { x: izq - 8, y: H - abajo + 4, 'text-anchor': 'end', class: 'nv-grafico__eje' }, pct(rMin)),
    svgEl('text', { x: izq - 8, y: arriba + 10, 'text-anchor': 'end', class: 'nv-grafico__eje' }, pct(rMax)),
    svgEl('text', { x: (izq + W - der) / 2, y: H - 10, 'text-anchor': 'middle', class: 'nv-grafico__eje-titulo' }, 'Riesgo (cuánto se movió al año) →'),
  );
  const cyTitulo = (arriba + H - abajo) / 2;
  svg.append(svgEl('text', {
    x: 18, y: cyTitulo, transform: `rotate(-90 18 ${cyTitulo})`, 'text-anchor': 'middle', class: 'nv-grafico__eje-titulo',
  }, 'Rentabilidad anual ↑'));

  /* La curva, suave y gruesa como en el clásico: el arco limpio de la
     envolvente cóncava, con las esquinas redondeadas. */
  const arco = suavizaEsquinas(
    envolventeConcava(eficiente).map((p) => ({ x: x(p.volatilidad), y: y(p.rentabilidad) })));
  svg.append(svgEl('path', {
    d: arco.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    class: 'nv-frontera__linea', fill: 'none',
  }));
  /* Los tres puntos que pidió Óscar: tu combinación, la mezcla de mayor
     Sharpe y la de menor volatilidad del historial. Nada más. */
  const senalados = puntosSenalados(eficiente);
  const rotulo = (cx, cy, texto, dy = 5) => {
    const anclaIzq = cx > W - der - 150;
    svg.append(svgEl('text', {
      x: (anclaIzq ? cx - 13 : cx + 13).toFixed(1),
      y: (cy + dy).toFixed(1),
      'text-anchor': anclaIzq ? 'end' : 'start',
      class: 'nv-grafico__rotulo',
    }, texto));
  };
  if (senalados) {
    const mr = senalados.menorRiesgo;
    svg.append(svgEl('circle', {
      cx: x(mr.volatilidad).toFixed(1), cy: y(mr.rentabilidad).toFixed(1), r: 6, class: 'nv-frontera__tranquila',
    }));
    rotulo(x(mr.volatilidad), y(mr.rentabilidad), 'Menor riesgo', -12);
    const ms = senalados.mayorSharpe;
    svg.append(svgEl('circle', {
      cx: x(ms.volatilidad).toFixed(1), cy: y(ms.rentabilidad).toFixed(1), r: 6.5, class: 'nv-frontera__sharpe',
    }));
    rotulo(x(ms.volatilidad), y(ms.rentabilidad), 'Mayor Sharpe', -12);
  }
  if (metricas) {
    const cx = x(metricas.volatilidad); const cy = y(metricas.rentabilidadAnualizada);
    svg.append(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 7, class: 'nv-frontera__mi-punto' }));
    rotulo(cx, cy, 'Tu combinación');
  }

  const cifras = [];
  if (metricas) {
    cifras.push({
      clase: 'nv-leyenda__marca--punto',
      nombre: 'Tu combinación:',
      texto: `riesgo ${pct(metricas.volatilidad)} · rentabilidad anual ${pct(metricas.rentabilidadAnualizada)}`,
    });
  }
  if (senalados) {
    cifras.push({
      clase: 'nv-leyenda__marca--sharpe',
      nombre: 'Mayor Sharpe:',
      texto: `riesgo ${pct(senalados.mayorSharpe.volatilidad)} · rentabilidad anual ${pct(senalados.mayorSharpe.rentabilidad)}`,
    });
    cifras.push({
      clase: 'nv-leyenda__marca--tranquila',
      nombre: 'Menor riesgo:',
      texto: `riesgo ${pct(senalados.menorRiesgo.volatilidad)} · rentabilidad anual ${pct(senalados.menorRiesgo.rentabilidad)}`,
    });
  }
  bloque.append(panelGrafico(svg, filaDeCifras(cifras)));
  bloque.append(el('p', { class: 'nv-cons__nota' },
    'El Sharpe es la rentabilidad obtenida por cada unidad de riesgo, descontada la tasa sin riesgo: '
    + '«mayor Sharpe» señala la mezcla del historial que más rentó por cada punto de movimiento, y '
    + '«menor riesgo», la que menos se movió. Describen ese historial, no el futuro.'));
  if (!metricas) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Tu combinación no tiene historial común suficiente para marcarla.'));
  }

  /* El reparto de las dos mezclas señaladas, plegado (nivel completo). */
  if (interactiva && senalados) {
    const pliegue = el('details', { class: 'nv-analisis__despliegue' });
    pliegue.append(el('summary', {}, 'Ver el reparto de esas dos mezclas'));
    for (const [titulo, punto] of [['La de mayor Sharpe', senalados.mayorSharpe], ['La de menor riesgo', senalados.menorRiesgo]]) {
      pliegue.append(el('p', { class: 'nv-analisis__subtitulo-lista' },
        `${titulo} — se movió un ${pct(punto.volatilidad)} al año y rentó un ${pct(punto.rentabilidad)} anual:`));
      const visibles = [...(punto.pesos || [])].sort((a, b) => b.peso - a.peso).filter((w) => w.peso >= 0.5).slice(0, 8);
      const resto = 100 - visibles.reduce((s, w) => s + w.peso, 0);
      const lista = el('ul', { class: 'nv-analisis__filas' });
      for (const w of visibles) {
        lista.append(filaConBarra(nombreDe?.[w.id] || w.id, pct(w.peso / 100, 0), w.peso));
      }
      if (resto >= 0.5) lista.append(filaConBarra('Resto de posiciones', pct(resto / 100, 0), resto));
      pliegue.append(lista);
    }
    bloque.append(pliegue);
  }
  return bloque;
}

/**
 * De dónde sale el riesgo (Fase 7): la parte del movimiento de la
 * combinación que puso cada posición, en barras. El «gráfico de riesgos»
 * en su forma legible: una posición, una barra, una cifra.
 */
function grupoRiesgoPorPosicion({ series, pesos, nombreDe }) {
  const contribuciones = contribucionesRiesgo(series, pesos);
  if (!contribuciones) return null;
  const bloque = grupo('Cuánto riesgo pone cada posición',
    'De cada 100 unidades de movimiento de esta combinación en el historial de 3 años, '
    + 'las que puso cada posición. Pesa el tamaño de la posición, lo que se movió por su '
    + 'cuenta y cuánto acompañó al resto.');
  const lista = el('ul', { class: 'nv-analisis__filas' });
  const tope = Math.max(...contribuciones.map((c) => Math.abs(c.porcentaje)), 1);
  for (const c of contribuciones) {
    lista.append(filaConBarra(nombreDe?.[c.id] || c.id, pct(c.porcentaje / 100, 0),
      (Math.abs(c.porcentaje) / tope) * 100, { negativa: c.porcentaje < 0 }));
  }
  bloque.append(lista);
  if (contribuciones.some((c) => c.porcentaje < 0)) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Una cifra negativa significa que esa posición amortiguó el movimiento del conjunto en ese historial.'));
  }
  bloque.append(el('p', { class: 'nv-cons__nota' }, 'Describe el historial, no el futuro.'));
  return bloque;
}

/** Grupo de proyección del suscriptor: simulación con los supuestos a la vista. */
function grupoProyeccion(metricas) {
  const bloque = grupo('Proyección por simulación (Montecarlo)',
    'Partiendo de 100, se simulan 4.000 caminos con la rentabilidad y la volatilidad '
    + 'del historial como supuestos. La banda ancha recoge nueve de cada diez caminos '
    + 'simulados; la oscura, la mitad central; la línea es la mediana.');
  const proyeccion = metricas
    ? proyeccionMonteCarlo({ rentabilidad: metricas.rentabilidadAnualizada, volatilidad: metricas.volatilidad })
    : null;
  if (!proyeccion) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Sin métricas de la combinación no hay nada que simular; nunca se inventa.'));
    return bloque;
  }

  /* El abanico de percentiles (paso 40): la banda del 5 al 95 y la mediana. */
  const ab = puntosAbanico(proyeccion);
  if (ab) {
    /* A todo el ancho de la tarjeta (encargo de Óscar, 21-08). */
    const W = 1080; const H = 380; const izq = 70; const der = 185; const arriba = 18; const abajo = 50;
    const n = ab.anos.length;
    const ejeY = marcasEje(Math.min(...ab.p5), Math.max(...ab.p95), 5);
    const x = (i) => izq + (i / ((n - 1) || 1)) * (W - izq - der);
    const y = (v) => H - abajo - ((v - ejeY.min) / ((ejeY.max - ejeY.min) || 1)) * (H - arriba - abajo);
    const camino = (vs) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`,
      class: 'nv-abanico',
      role: 'img',
      'aria-label': `Abanico de la simulación a ${ab.anos[n - 1]} años: al final, percentil 5 en ${num(ab.p5[n - 1], 0)}, mediana en ${num(ab.p50[n - 1], 0)} y percentil 95 en ${num(ab.p95[n - 1], 0)}, partiendo de ${num(proyeccion.base, 0)}.`,
    });
    for (const v of ejeY.marcas) {
      const yy = y(v).toFixed(1);
      svg.append(svgEl('line', { x1: izq, y1: yy, x2: W - der, y2: yy, class: 'nv-grafico__rejilla' }));
      svg.append(svgEl('text', { x: izq - 8, y: (y(v) + 5).toFixed(1), 'text-anchor': 'end', class: 'nv-grafico__eje' }, num(v, 0)));
    }
    const bandaDe = (arriba95, abajo5) => arriba95.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
      + ' ' + [...abajo5].reverse().map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join(' ') + ' Z';
    svg.append(svgEl('path', { d: bandaDe(ab.p95, ab.p5), class: 'nv-abanico__banda' }));
    /* La banda interior de cuartiles, a dos tonos como en el clásico. */
    if (ab.p25 && ab.p75) svg.append(svgEl('path', { d: bandaDe(ab.p75, ab.p25), class: 'nv-abanico__banda-interior' }));
    const yBase = y(proyeccion.base);
    svg.append(svgEl('line', { x1: izq, y1: yBase, x2: W - der, y2: yBase, class: 'nv-evolucion__cien' }));
    svg.append(svgEl('path', { d: camino(ab.p50), class: 'nv-abanico__mediana', fill: 'none' }));
    /* Rótulos del final, separados para que ninguno pise a otro. */
    const finales = [
      [ab.p95, `Percentil 95 · ${num(ab.p95[n - 1], 0)}`],
      [ab.p50, `Mediana · ${num(ab.p50[n - 1], 0)}`],
      [ab.p5, `Percentil 5 · ${num(ab.p5[n - 1], 0)}`],
    ];
    const yRotulos = separaVerticalmente(finales.map(([vs]) => y(vs[n - 1]) + 5), 18, arriba + 12, H - abajo - 4);
    finales.forEach(([, etiqueta], i) => {
      svg.append(svgEl('text', { x: W - der + 10, y: yRotulos[i].toFixed(1), class: 'nv-grafico__rotulo' }, etiqueta));
    });
    for (const a of [0, 5, 10].filter((v) => v <= ab.anos[n - 1])) {
      const i = ab.anos.indexOf(a);
      if (i >= 0) svg.append(svgEl('text', { x: x(i), y: H - abajo + 20, 'text-anchor': i === 0 ? 'start' : 'middle', class: 'nv-grafico__eje' }, `año ${a}`));
    }
    bloque.append(panelGrafico(svg, filaDeCifras([
      { clase: 'nv-leyenda__marca--banda', nombre: 'Banda ancha:', texto: 'nueve de cada diez caminos simulados (percentiles 5–95)' },
      ...(ab.p25 && ab.p75 ? [{ clase: 'nv-leyenda__marca--banda-interior', nombre: 'Banda oscura:', texto: 'la mitad central (percentiles 25–75)' }] : []),
      { clase: 'nv-leyenda__marca--mediana', nombre: 'Mediana:', texto: `termina en ${num(ab.p50[n - 1], 0)}` },
    ])));
  }

  const tabla = el('table', { class: 'nv-table nv-analisis__matriz' });
  tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Percentiles del valor simulado de 100'));
  const thead = el('thead');
  const trh = el('tr');
  for (const t of ['Al cierre del año', 'Percentil 5', 'Mediana', 'Percentil 95']) {
    trh.append(el('th', { scope: 'col' }, t));
  }
  thead.append(trh);
  const tbody = el('tbody');
  for (const fila of filasProyeccion(proyeccion)) {
    const tr = el('tr');
    tr.append(el('th', { scope: 'row' }, String(fila.ano)));
    tr.append(el('td', {}, num(fila.p5, 0)), el('td', {}, num(fila.p50, 0)), el('td', {}, num(fila.p95, 0)));
    tbody.append(tr);
  }
  tabla.append(thead, tbody);
  const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
  envoltorio.append(tabla);
  bloque.append(envoltorio);
  bloque.append(el('p', { class: 'nv-cons__nota' }, TEXTO_PROYECCION));
  return bloque;
}

/**
 * Grupo del mapa riesgo/rentabilidad (paso 41): cada activo del cálculo
 * como punto (volatilidad, rentabilidad anualizada) del historial real,
 * con la cartera marcada. Nivel registrado en adelante.
 */
function grupoMapaRiesgo({ metricas }) {
  const bloque = grupo('Mapa riesgo-retorno frente a perfiles de referencia',
    'Tu combinación (con su historial real de 3 años) frente a cinco mezclas de '
    + 'referencia de renta variable y renta fija globales, calculadas con los '
    + 'supuestos publicados en esta página. Son puntos de comparación fijos, '
    + 'idénticos para cualquiera; no describen a ningún lector.');
  const perfiles = perfilesReferencia();
  if (!perfiles.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Sin supuestos de las clases no hay perfiles que dibujar; nunca se inventa.'));
    return bloque;
  }
  const todos = metricas
    ? perfiles.concat([{ volatilidad: metricas.volatilidad, rentabilidad: metricas.rentabilidadAnualizada }])
    : perfiles;
  const W = 760; const H = 420; const izq = 78; const der = 24; const arriba = 26; const abajo = 66;
  const ejeX = marcasEje(Math.min(0, ...todos.map((p) => p.volatilidad)), Math.max(...todos.map((p) => p.volatilidad)), 6);
  const ejeY = marcasEje(Math.min(0, ...todos.map((p) => p.rentabilidad)), Math.max(...todos.map((p) => p.rentabilidad)), 6);
  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'nv-frontera',
    role: 'img',
    'aria-label': 'Mapa riesgo-retorno: perfiles de referencia '
      + perfiles.map((p) => `${p.rv} % de renta variable (volatilidad ${pct(p.volatilidad)}, rentabilidad ${pct(p.rentabilidad)})`).join('; ')
      + (metricas ? `; tu combinación: volatilidad ${pct(metricas.volatilidad)}, rentabilidad anual ${pct(metricas.rentabilidadAnualizada)}.` : '.'),
  });
  const { x, y } = dibujaEjes(svg, {
    W, H, izq, der, arriba, abajo, ejeX, ejeY,
    tituloX: 'Cuánto se mueve al año (volatilidad) →',
    tituloY: 'Rentabilidad anual ↑',
  });

  /* La línea discontinua que une los perfiles, y un rombo por perfil. */
  svg.append(svgEl('polyline', {
    points: perfiles.map((p) => `${x(p.volatilidad).toFixed(1)},${y(p.rentabilidad).toFixed(1)}`).join(' '),
    class: 'nv-perfiles__linea', fill: 'none',
  }));
  perfiles.forEach((p, i) => {
    const cx = x(p.volatilidad); const cy = y(p.rentabilidad);
    svg.append(svgEl('rect', {
      x: (cx - 5.5).toFixed(1), y: (cy - 5.5).toFixed(1), width: 11, height: 11,
      transform: `rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})`, class: 'nv-perfiles__rombo',
    }));
    /* El rótulo alterna abajo y arriba para que dos vecinos no se pisen. */
    svg.append(svgEl('text', {
      x: cx.toFixed(1), y: (i % 2 ? cy - 14 : cy + 26).toFixed(1), 'text-anchor': 'middle', class: 'nv-grafico__eje',
    }, `${p.rv} % bolsa`));
  });
  if (metricas) {
    const cx = x(metricas.volatilidad); const cy = y(metricas.rentabilidadAnualizada);
    svg.append(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 8, class: 'nv-frontera__mi-punto' }));
    const anclaIzq = cx > W - der - 150;
    svg.append(svgEl('text', {
      x: (anclaIzq ? cx - 14 : cx + 14).toFixed(1), y: (cy - 10).toFixed(1),
      'text-anchor': anclaIzq ? 'end' : 'start', class: 'nv-grafico__rotulo',
    }, 'Tu combinación'));
  }

  const cifras = [];
  if (metricas) {
    cifras.push({
      clase: 'nv-leyenda__marca--punto',
      nombre: 'Tu combinación:',
      texto: `se movió ${pct(metricas.volatilidad)} · rentó ${pct(metricas.rentabilidadAnualizada)} anual (historial de 3 años)`,
    });
  }
  cifras.push({
    clase: 'nv-leyenda__marca--rombo',
    nombre: 'Perfiles de referencia:',
    texto: 'del 10 % al 90 % de renta variable, con los supuestos de esta página',
  });
  bloque.append(panelGrafico(svg, filaDeCifras(cifras)));
  if (!metricas) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Tu combinación no tiene historial común suficiente para marcarla.'));
  }
  bloque.append(el('p', { class: 'nv-cons__nota' },
    'Los perfiles salen de los supuestos publicados más abajo (estimaciones de largo plazo, '
    + 'pendientes de validación profesional); tu combinación, de su historial real. '
    + 'Son puntos de referencia, no una propuesta.'));
  return bloque;
}

/** Tinte de una celda de correlación: cuanto más se mueven a la vez, más color. */
function tinteCorrelacion(v) {
  if (!Number.isFinite(v)) return '';
  if (v >= 0.7) return ' nv-cor--alta';
  if (v >= 0.4) return ' nv-cor--media';
  if (v <= -0.2) return ' nv-cor--contraria';
  return '';
}

/** Fila de un par: los dos nombres, la cifra, la frase en llano y una barra. */
function filaPar(nombreA, nombreB, cifra, frase, anchoPct, { negativa = false } = {}) {
  const item = el('li', { class: 'nv-analisis__fila' });
  item.append(
    el('span', { class: 'nv-analisis__clave' }, `${nombreA} y ${nombreB}`),
    el('span', { class: 'nv-analisis__peso' }, `${cifra} · ${frase}`),
  );
  const barra = el('span', {
    class: `nv-analisis__barra${negativa ? ' nv-analisis__barra--contraria' : ''}`,
    'aria-hidden': 'true',
  });
  barra.style.width = `${Math.min(100, Math.max(2, Math.abs(anchoPct)))}%`;
  item.append(barra);
  return item;
}

/** Grupo de correlaciones del suscriptor: los pares que cuentan, en llano,
 *  y la matriz completa plegada para quien quiera el detalle. */
function grupoCorrelaciones(series, pesos, nombreDe) {
  const bloque = grupo('Qué posiciones se mueven a la vez', TEXTO_CORRELACIONES);
  const enCalculo = (series || []).filter((s) => pesos[s.asset_id] != null);
  if (enCalculo.length < 2) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Con una sola posición en el cálculo no hay pares que correlacionar.'));
    return bloque;
  }
  const { ids, rho } = correlacionesDesdeSeries(
    enCalculo.map((s) => ({ id: s.asset_id, niveles: s.values })));
  const { pares, altos, bajos } = paresDestacados(ids, rho, 3);
  if (!pares.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Ningún par tiene historial común suficiente; nunca se inventa una correlación.'));
    return bloque;
  }
  const nombre = (id) => nombreCorto(nombreDe?.[id] || id, 34);
  const pintaPares = (titulo, lista) => {
    if (!lista.length) return;
    bloque.append(el('p', { class: 'nv-analisis__subtitulo-lista' }, titulo));
    const ul = el('ul', { class: 'nv-analisis__filas' });
    for (const par of lista) {
      ul.append(filaPar(nombre(par.a), nombre(par.b), num(par.valor, 2),
        fraseCorrelacion(par.valor), Math.abs(par.valor) * 100, { negativa: par.valor < 0 }));
    }
    bloque.append(ul);
  };
  if (pares.length <= 4) {
    pintaPares('Cada par, con su correlación:', [...pares].sort((a, b) => b.valor - a.valor));
  } else {
    pintaPares('Los pares que más se movieron a la vez:', altos);
    pintaPares('Los de menos relación (o en sentido contrario):', bajos);
  }

  /* La matriz completa, para quien quiera el detalle. */
  if (ids.length > 2) {
    const pliegue = el('details', { class: 'nv-analisis__despliegue' });
    pliegue.append(el('summary', {}, `Ver la matriz completa (${ids.length} × ${ids.length})`));
    const tabla = el('table', { class: 'nv-table nv-analisis__matriz' });
    tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Correlaciones entre las posiciones de la cartera'));
    const thead = el('thead');
    const trh = el('tr');
    trh.append(el('th', { scope: 'col' }, ''));
    for (const id of ids) trh.append(el('th', { scope: 'col' }, nombreCorto(nombreDe?.[id] || id, 16)));
    thead.append(trh);
    const tbody = el('tbody');
    for (const a of ids) {
      const tr = el('tr');
      tr.append(el('th', { scope: 'row' }, nombreCorto(nombreDe?.[a] || a, 24)));
      for (const b of ids) {
        const v = rho[a]?.[b];
        tr.append(el('td', { class: `nv-analisis__celda${a === b ? '' : tinteCorrelacion(v)}` },
          a === b ? '—' : (Number.isFinite(v) ? num(v, 2) : '—')));
      }
      tbody.append(tr);
    }
    tabla.append(thead, tbody);
    const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
    envoltorio.append(tabla);
    pliegue.append(envoltorio);
    bloque.append(pliegue);
  }
  return bloque;
}

function tablaReparto(titulo, lectura, resultado, etiqueta = etiquetaClave, maxFilas = 6) {
  const bloque = grupo(titulo, lectura);
  if (!resultado || resultado.calidad === 'none' || !resultado.filas.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' }, 'Sin renta variable que desglosar en esta cartera.'));
    return bloque;
  }
  const visibles = resultado.filas.slice(0, maxFilas);
  const lista = el('ul', { class: 'nv-analisis__filas' });
  for (const fila of visibles) {
    lista.append(filaConBarra(etiqueta(fila.clave), pct(fila.peso / 100, 1), fila.peso));
  }
  bloque.append(lista);
  if (resultado.filas.length > maxFilas) {
    const resto = resultado.filas.slice(maxFilas);
    bloque.append(el('p', { class: 'nv-cons__nota' },
      `Y ${resto.length} más, con un ${pct(resto.reduce((s, f) => s + f.peso, 0) / 100, 1)} entre todas.`));
  }
  const calidad = textoCalidad(resultado);
  if (calidad) bloque.append(el('p', { class: 'nv-analisis__calidad' }, calidad));
  return bloque;
}

/**
 * Pinta el análisis ampliado dentro de `raiz` (un nodo vacío que el
 * constructor crea en cada recálculo; si llega tarde y el nodo ya no está en
 * el documento, lo pintado no se ve y no pasa nada).
 */
export async function montaAnalisis(raiz, { posiciones, pesos, series, datos, registrada, nivel, metricas }) {
  if (!raiz) return;
  raiz.textContent = '';
  if (!pesos) return;

  const nivelEfectivo = nivel || (registrada ? 'registrada' : 'visitante');
  if (nivelEfectivo === 'visitante') {
    raiz.append(el('p', { class: 'nv-analisis__cerrado' }, NOTA_ANALISIS_CERRADO));
    return;
  }
  const esSuscriptor = nivelEfectivo === 'suscriptor';

  const nombreDe = {};
  for (const p of posiciones) nombreDe[p.activo.asset_id] = p.activo.display_name || p.activo.asset_id;

  raiz.append(el('h3', { class: 'nv-cons__subtitulo' },
    esSuscriptor ? 'Análisis completo (suscripción)' : 'Análisis ampliado (tu cuenta)'));

  /* Ahorro por diversificar: sale de las series ya cargadas, sin más red. */
  const ahorro = ahorroDeSeries(series, pesos);
  const grupoAhorro = grupo('Lo que aportó diversificar');
  grupoAhorro.append(el('p', { class: 'nv-cons__nota' }, ahorro
    ? textoAhorro(ahorro)
    : 'Con una sola posición en el cálculo, o sin historial común suficiente, no hay diversificación que medir.'));
  raiz.append(grupoAhorro);

  /* De dónde sale el riesgo (Fase 7): una posición, una barra, una cifra. */
  const riesgoPorPosicion = grupoRiesgoPorPosicion({ series, pesos, nombreDe });
  if (riesgoPorPosicion) raiz.append(riesgoPorPosicion);

  /* Frontera (paso 33): estática con la cartera marcada para el registrado,
     con recorrido interactivo para el suscriptor. Sin red: series ya cargadas. */
  raiz.append(grupoFrontera({ series, pesos, metricas, interactiva: esSuscriptor, nombreDe }));

  /* Mapa riesgo-retorno frente a perfiles de referencia (Fase 7). */
  raiz.append(grupoMapaRiesgo({ metricas }));

  /* Solo suscriptor: proyección por simulación y matriz de correlaciones. */
  if (esSuscriptor) {
    raiz.append(grupoProyeccion(metricas));
    raiz.append(grupoCorrelaciones(series, pesos, nombreDe));
  }

  const cargando = el('p', { class: 'nv-cons__nota', role: 'status' }, 'Consultando fichas y desgloses…');
  raiz.append(cargando);

  /* Concentración: fichas de la maestra, con la calidad del dato declarada. */
  const posAnalisis = posicionesParaAnalisis(posiciones, pesos);
  const ids = posAnalisis.map((p) => p.asset_id);
  const fichas = await Promise.all(ids.map((id) => detalleDe(datos, id)));
  const activos = fichas.filter(Boolean).map((f) => ({
    asset_id: f.asset_id,
    display_name: f.identity?.display_name,
    category: f.category,
    economic_asset_class: f.economic_asset_class,
    currency: f.identity?.currency,
    region: f.identity?.region,
    pms_exposure: f.pms_exposure,
    exposure_detail: f.exposure_detail,
  }));
  const sinFicha = ids.filter((id, i) => !fichas[i]);

  cargando.remove();

  raiz.append(tablaReparto('En qué sectores está la renta variable',
    'El peso de cada sector dentro de la parte de renta variable de la combinación.',
    concentracionSectorial(posAnalisis, activos), etiquetaSector));
  /* Distribución geográfica con mapa (paso 42) + su tabla de regiones. */
  const repartoGeo = concentracionGeografica(posAnalisis, activos);
  const mapa = grupoMapa(repartoGeo);
  if (mapa) raiz.append(mapa);
  raiz.append(tablaReparto('En qué regiones está la renta variable',
    'El mismo reparto del mapa, región a región.',
    repartoGeo, etiquetaRegion));
  if (sinFicha.length) {
    raiz.append(el('p', { class: 'nv-cons__nota' },
      `Sin ficha disponible ahora mismo: ${sinFicha.join(', ')}. No entra en la concentración.`));
  }

  /* Solapamiento entre fondos y ETF. */
  const grupoSolape = grupo('Matriz de solapamiento',
    'El porcentaje de subyacentes comunes entre cada par de fondos y ETF, posición a '
    + 'posición: cuanto más oscuro el recuadro, más contenido comparten. La diagonal '
    + 'es cada fondo consigo mismo (100 %). Debajo, la lista dice qué fondo es cada número.');
  const fondos = idsDeFondos(posiciones).filter((id) => pesos[id] != null);
  if (fondos.length < 2) {
    grupoSolape.append(el('p', { class: 'nv-cons__nota' },
      'Con menos de dos fondos o ETF en la cartera no hay pares que comparar.'));
  } else {
    const docs = await holdingsDe(datos, fondos);
    if (!docs) {
      grupoSolape.append(el('p', { class: 'nv-cons__nota' },
        'No se han podido consultar los desgloses. Prueba de nuevo en unos segundos.'));
    } else {
      const matriz = matrizSolapamiento(fondos.map((id) => ({ id, cartera: carteraDesdeHoldings(docs[id]) })));
      const conDatos = matriz.ids.filter((id) => !matriz.sinDatos.includes(id));
      const sinDatos = matriz.sinDatos;
      if (conDatos.length < 2) {
        grupoSolape.append(el('p', { class: 'nv-cons__nota' },
          'Sin desglose disponible para comparar estos fondos; nunca se inventa un solapamiento.'));
      } else {
        /* La matriz de calor numerada (encargo de Óscar, 21-08): cuanto más
           oscuro, más contenido comparten; la diagonal es cada fondo consigo
           mismo (100 %). Debajo, la lista dice qué fondo es cada número. */
        const tinte = (v, diagonal) => {
          if (diagonal) return ' nv-solape--total';
          if (v >= 25) return ' nv-solape--alto';
          if (v >= 5) return ' nv-solape--medio';
          if (v > 0) return ' nv-solape--bajo';
          return ' nv-solape--cero';
        };
        const tabla = el('table', { class: 'nv-solape' });
        tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Solapamiento entre los fondos de la cartera, en porcentaje'));
        const thead = el('thead');
        const trh = el('tr');
        trh.append(el('th', { scope: 'col' }, ''));
        conDatos.forEach((_, j) => trh.append(el('th', { scope: 'col', class: 'nv-solape__eje' }, String(j + 1))));
        thead.append(trh);
        const tbody = el('tbody');
        conDatos.forEach((a, i) => {
          const tr = el('tr');
          tr.append(el('th', { scope: 'row', class: 'nv-solape__eje' }, String(i + 1)));
          conDatos.forEach((b, j) => {
            const v = i === j ? 100 : (matriz.porcentaje[a]?.[b] ?? 0);
            const td = el('td', { class: 'nv-solape__hueco' });
            td.append(el('span', { class: `nv-solape__celda${tinte(v, i === j)}` }, pct(v / 100, 0)));
            tr.append(td);
          });
          tbody.append(tr);
        });
        tabla.append(thead, tbody);
        const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
        envoltorio.append(tabla);
        const listaFondos = el('ol', { class: 'nv-mriesgo__lista' });
        conDatos.forEach((id, i) => {
          const item = el('li', { class: 'nv-mriesgo__item' });
          item.append(
            el('span', { class: 'nv-mriesgo__indice', 'aria-hidden': 'true' }, String(i + 1)),
            el('span', { class: 'nv-mriesgo__nombre' }, nombreDe[id] || id),
          );
          listaFondos.append(item);
        });
        grupoSolape.append(panelGrafico(envoltorio, listaFondos));
      }
      if (sinDatos.length) {
        grupoSolape.append(el('p', { class: 'nv-cons__nota' },
          `Sin desglose en la base: ${sinDatos.map((id) => nombreDe[id] || id).join(', ')}. Sus pares no se calculan.`));
      }
    }
  }
  raiz.append(grupoSolape);

  if (!esSuscriptor) {
    raiz.append(el('p', { class: 'nv-analisis__suscriptor' }, NOTA_ANALISIS_SUSCRIPTOR));
  }
  raiz.append(el('p', { class: 'nv-cons__fuente' }, FUENTE_ANALISIS));
}

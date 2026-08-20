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
export const TEXTO_FRONTERA = 'Cada punto gris es una mezcla de pesos probada '
  + 'con estos mismos activos: más a la derecha, más se movió; más arriba, más '
  + 'rentó. La línea une, a cada nivel de riesgo, la mezcla que más rentó en el '
  + 'historial de 3 años. Describe ese historial, no el futuro.';

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
  return {
    anos: [0, ...proyeccion.anos.map((f) => f.ano)],
    p5: [base, ...proyeccion.anos.map((f) => f.p5)],
    p50: [base, ...proyeccion.anos.map((f) => f.p50)],
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

  /* Escalas: dominio en marcas redondas, no en el dato justo. */
  const W = 760; const H = 420; const izq = 78; const der = 24; const arriba = 18; const abajo = 66;
  const puntos = f.nube.concat(metricas ? [{ volatilidad: metricas.volatilidad, rentabilidad: metricas.rentabilidadAnualizada }] : []);
  const ejeX = marcasEje(Math.min(...puntos.map((p) => p.volatilidad)), Math.max(...puntos.map((p) => p.volatilidad)), 6);
  const ejeY = marcasEje(Math.min(...puntos.map((p) => p.rentabilidad)), Math.max(...puntos.map((p) => p.rentabilidad)), 6);

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'nv-frontera',
    role: 'img',
    'aria-label': 'Nube de combinaciones de estos activos y su frontera: '
      + `riesgo entre ${pct(ejeX.min)} y ${pct(ejeX.max)}, rentabilidad anual entre ${pct(ejeY.min)} y ${pct(ejeY.max)}.`,
  });
  const { x, y } = dibujaEjes(svg, {
    W, H, izq, der, arriba, abajo, ejeX, ejeY,
    tituloX: 'Cuánto se movió al año (volatilidad) →',
    tituloY: 'Cuánto rentó al año ↑',
  });

  const salto = Math.max(1, Math.floor(f.nube.length / 450));
  for (let i = 0; i < f.nube.length; i += salto) {
    const p = f.nube[i];
    svg.append(svgEl('circle', { cx: x(p.volatilidad).toFixed(1), cy: y(p.rentabilidad).toFixed(1), r: 2.5, class: 'nv-frontera__punto' }));
  }
  svg.append(svgEl('polyline', {
    points: eficiente.map((p) => `${x(p.volatilidad).toFixed(1)},${y(p.rentabilidad).toFixed(1)}`).join(' '),
    class: 'nv-frontera__linea', fill: 'none',
  }));
  if (metricas) {
    const cx = x(metricas.volatilidad); const cy = y(metricas.rentabilidadAnualizada);
    svg.append(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 7, class: 'nv-frontera__mi-punto' }));
    const anclaIzq = cx > W - der - 150;
    svg.append(svgEl('text', {
      x: (anclaIzq ? cx - 12 : cx + 12).toFixed(1),
      y: (cy + 5).toFixed(1),
      'text-anchor': anclaIzq ? 'end' : 'start',
      class: 'nv-grafico__rotulo',
    }, 'Tu combinación'));
  }
  bloque.append(svg);

  bloque.append(leyenda([
    { clase: 'nv-leyenda__marca--nube', texto: 'Una mezcla posible de estos activos' },
    { clase: 'nv-leyenda__marca--linea', texto: 'La frontera: la mezcla que más rentó a cada nivel de riesgo' },
    ...(metricas ? [{ clase: 'nv-leyenda__marca--punto', texto: 'Tu combinación actual' }] : []),
  ]));
  if (!metricas) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Tu combinación no tiene historial común suficiente para marcarla.'));
  }

  if (!interactiva) return bloque;

  /* Parte interactiva del suscriptor: recorrer la frontera punto a punto. */
  const control = el('div', { class: 'nv-frontera__control' });
  const idControl = 'frontera-punto';
  control.append(el('label', { for: idControl, class: 'nv-frontera__etiqueta' },
    'Recorre la frontera y mira el reparto de cada punto:'));
  const rango = el('input', {
    type: 'range', id: idControl, min: '0',
    max: String(eficiente.length - 1), step: '1', value: String(Math.floor(eficiente.length / 2)),
  });
  const detalle = el('div', { class: 'nv-frontera__detalle', 'aria-live': 'polite' });
  let marcador = null;
  const pinta = () => {
    const p = eficiente[Number(rango.value)];
    if (!p) return;
    if (marcador) marcador.remove();
    marcador = svgEl('circle', {
      cx: x(p.volatilidad).toFixed(1), cy: y(p.rentabilidad).toFixed(1), r: 6, class: 'nv-frontera__elegido',
    });
    svg.append(marcador);
    detalle.textContent = '';
    detalle.append(el('p', { class: 'nv-frontera__resumen' },
      `Ese punto del historial se movió un ${pct(p.volatilidad)} al año y rentó un ${pct(p.rentabilidad)} anual. Su reparto:`));
    const visibles = [...p.pesos].sort((a, b) => b.peso - a.peso).filter((w) => w.peso >= 0.5).slice(0, 8);
    const resto = 100 - visibles.reduce((s, w) => s + w.peso, 0);
    const lista = el('ul', { class: 'nv-analisis__filas' });
    for (const w of visibles) {
      lista.append(filaConBarra(nombreDe?.[w.id] || w.id, pct(w.peso / 100, 0), w.peso));
    }
    if (resto >= 0.5) lista.append(filaConBarra('Resto de posiciones', pct(resto / 100, 0), resto));
    detalle.append(lista);
  };
  rango.addEventListener('input', pinta);
  control.append(rango, detalle);
  bloque.append(control);
  pinta();
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
    + 'del historial como supuestos. La banda verde recoge nueve de cada diez caminos '
    + 'simulados; la línea es la mediana.');
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
    const W = 760; const H = 320; const izq = 64; const der = 190; const arriba = 16; const abajo = 46;
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
    const banda = ab.p95.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
      + ' ' + [...ab.p5].reverse().map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join(' ') + ' Z';
    svg.append(svgEl('path', { d: banda, class: 'nv-abanico__banda' }));
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
    bloque.append(svg);
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
function grupoMapaRiesgo({ series, pesos, metricas, nombreDe }) {
  const bloque = grupo('Cada posición en el mapa de riesgo',
    'Cada número es una posición, sola: más a la derecha, más se movió; más arriba, '
    + 'más rentó en la ventana de 3 años. Debajo, la lista dice qué es cada número. '
    + 'Describe el historial, no el futuro.');
  const { puntos, sinMetrica } = puntosMapaRiesgo(series, pesos);
  if (!puntos.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Sin métricas de los activos no hay mapa que dibujar; nunca se inventa.'));
    return bloque;
  }
  const orden = [...puntos].sort((a, b) => a.volatilidad - b.volatilidad);
  const todos = metricas
    ? orden.concat([{ id: '__cartera__', volatilidad: metricas.volatilidad, rentabilidad: metricas.rentabilidadAnualizada }])
    : orden;
  const W = 760; const H = 420; const izq = 78; const der = 24; const arriba = 18; const abajo = 66;
  const ejeX = marcasEje(Math.min(...todos.map((p) => p.volatilidad)), Math.max(...todos.map((p) => p.volatilidad)), 6);
  const ejeY = marcasEje(Math.min(...todos.map((p) => p.rentabilidad)), Math.max(...todos.map((p) => p.rentabilidad)), 6);
  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'nv-frontera',
    role: 'img',
    'aria-label': 'Mapa riesgo y rentabilidad de estas posiciones: '
      + orden.map((p, i) => `${i + 1}: ${nombreDe?.[p.id] || p.id} (volatilidad ${pct(p.volatilidad)}, rentabilidad anual ${pct(p.rentabilidad)})`).join('; ')
      + (metricas ? `; la cartera junta: volatilidad ${pct(metricas.volatilidad)}, rentabilidad anual ${pct(metricas.rentabilidadAnualizada)}.` : '.'),
  });
  const { x, y } = dibujaEjes(svg, {
    W, H, izq, der, arriba, abajo, ejeX, ejeY,
    tituloX: 'Cuánto se movió al año (volatilidad) →',
    tituloY: 'Cuánto rentó al año ↑',
  });

  /* Los números se separan por columnas de 48 px para no pisarse; si el
     número se aparta de su punto, un trazo fino los une. */
  const cxs = orden.map((p) => x(p.volatilidad));
  const cys = orden.map((p) => y(p.rentabilidad));
  const yMarca = new Array(orden.length);
  const porColumna = new Map();
  orden.forEach((p, i) => {
    const col = Math.round(cxs[i] / 48);
    if (!porColumna.has(col)) porColumna.set(col, []);
    porColumna.get(col).push(i);
  });
  for (const indices of porColumna.values()) {
    const sep = separaVerticalmente(indices.map((i) => cys[i]), 24, arriba + 14, H - abajo - 12);
    indices.forEach((i, k) => { yMarca[i] = sep[k]; });
  }
  orden.forEach((p, i) => {
    if (Math.abs(yMarca[i] - cys[i]) > 12) {
      svg.append(svgEl('circle', { cx: cxs[i].toFixed(1), cy: cys[i].toFixed(1), r: 3, class: 'nv-mriesgo__activo' }));
      svg.append(svgEl('line', {
        x1: cxs[i].toFixed(1), y1: cys[i].toFixed(1), x2: cxs[i].toFixed(1), y2: yMarca[i].toFixed(1), class: 'nv-mriesgo__union',
      }));
    }
    svg.append(svgEl('circle', { cx: cxs[i].toFixed(1), cy: yMarca[i].toFixed(1), r: 11, class: 'nv-mriesgo__marca' }));
    svg.append(svgEl('text', {
      x: cxs[i].toFixed(1), y: (yMarca[i] + 4.5).toFixed(1), 'text-anchor': 'middle', class: 'nv-mriesgo__numero',
    }, String(i + 1)));
  });
  if (metricas) {
    const cx = x(metricas.volatilidad); const cy = y(metricas.rentabilidadAnualizada);
    svg.append(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 8, class: 'nv-frontera__mi-punto' }));
    const anclaIzq = cx > W - der - 150;
    svg.append(svgEl('text', {
      x: (anclaIzq ? cx - 13 : cx + 13).toFixed(1), y: (cy + 5).toFixed(1),
      'text-anchor': anclaIzq ? 'end' : 'start', class: 'nv-grafico__rotulo',
    }, 'Tu combinación'));
  }
  bloque.append(svg);

  const lista = el('ol', { class: 'nv-mriesgo__lista' });
  orden.forEach((p, i) => {
    const item = el('li', { class: 'nv-mriesgo__item' });
    item.append(
      el('span', { class: 'nv-mriesgo__indice', 'aria-hidden': 'true' }, String(i + 1)),
      el('span', { class: 'nv-mriesgo__nombre' }, nombreDe?.[p.id] || p.id),
      el('span', { class: 'nv-mriesgo__cifras' }, `se movió ${pct(p.volatilidad)} · rentó ${pct(p.rentabilidad)}`),
    );
    lista.append(item);
  });
  bloque.append(lista);
  if (metricas) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      `Tu combinación, junta, se movió un ${pct(metricas.volatilidad)} al año y rentó un ${pct(metricas.rentabilidadAnualizada)} anual.`));
  }
  if (sinMetrica.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      `Sin métrica del historial: ${sinMetrica.map((id) => nombreDe?.[id] || id).join(', ')}. Fuera del mapa.`));
  }
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

  /* Mapa riesgo/rentabilidad (paso 41): activos y cartera, historial real. */
  raiz.append(grupoMapaRiesgo({ series, pesos, metricas, nombreDe }));

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
  const grupoSolape = grupo('Solapamiento entre fondos',
    'El porcentaje de cartera que dos fondos comparten, posición a posición: cuanto '
    + 'más alto, más repetido está el mismo contenido dentro de la combinación.');
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
        /* Los pares con más solapamiento, en llano. */
        const paresSolape = [];
        for (let i = 0; i < conDatos.length; i += 1) {
          for (let j = i + 1; j < conDatos.length; j += 1) {
            paresSolape.push({
              a: conDatos[i], b: conDatos[j], valor: matriz.porcentaje[conDatos[i]]?.[conDatos[j]] ?? 0,
            });
          }
        }
        paresSolape.sort((p, q) => q.valor - p.valor);
        const destacadosSolape = paresSolape.slice(0, 3).filter((p) => p.valor > 0);
        if (!destacadosSolape.length) {
          grupoSolape.append(el('p', { class: 'nv-cons__nota' },
            'Ningún par comparte posiciones en el desglose disponible.'));
        } else {
          const ul = el('ul', { class: 'nv-analisis__filas' });
          for (const p of destacadosSolape) {
            ul.append(filaPar(nombreCorto(nombreDe[p.a] || p.a, 34), nombreCorto(nombreDe[p.b] || p.b, 34),
              pct(p.valor / 100, 1), 'compartido', p.valor));
          }
          grupoSolape.append(ul);
        }
        if (conDatos.length > 2) {
          const pliegue = el('details', { class: 'nv-analisis__despliegue' });
          pliegue.append(el('summary', {}, `Ver todos los pares (${conDatos.length} fondos)`));
          const tabla = el('table', { class: 'nv-table nv-analisis__matriz' });
          tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Solapamiento entre los fondos de la cartera'));
          const thead = el('thead');
          const trh = el('tr');
          trh.append(el('th', { scope: 'col' }, ''));
          for (const id of conDatos) trh.append(el('th', { scope: 'col' }, nombreCorto(nombreDe[id] || id, 16)));
          thead.append(trh);
          const tbody = el('tbody');
          for (const a of conDatos) {
            const tr = el('tr');
            tr.append(el('th', { scope: 'row' }, nombreCorto(nombreDe[a] || a, 24)));
            for (const b of conDatos) {
              tr.append(el('td', {}, a === b ? '—' : pct((matriz.porcentaje[a]?.[b] ?? 0) / 100, 1)));
            }
            tbody.append(tr);
          }
          tabla.append(thead, tbody);
          const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
          envoltorio.append(tabla);
          pliegue.append(envoltorio);
          grupoSolape.append(pliegue);
        }
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

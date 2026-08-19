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
import { matrizSolapamiento } from './nuvia-solapamiento.js';

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
export const TEXTO_FRONTERA = 'Cada punto gris es una combinación de pesos '
  + 'probada con estos mismos activos; la línea es la frontera: a cada nivel '
  + 'de riesgo, la mayor rentabilidad del historial de 3 años. Describe ese '
  + 'historial, no el futuro.';

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

/* ── Montaje ── */

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
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
  const bloque = el('div', { class: 'nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, 'Frontera de estas posiciones'));

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

  /* Escalas del dibujo. */
  const W = 560; const H = 300; const izq = 62; const abajo = 34; const arriba = 14; const der = 14;
  const puntos = f.nube.concat(metricas ? [{ volatilidad: metricas.volatilidad, rentabilidad: metricas.rentabilidadAnualizada }] : []);
  const vMin = Math.min(...puntos.map((p) => p.volatilidad));
  const vMax = Math.max(...puntos.map((p) => p.volatilidad));
  const rMin = Math.min(...puntos.map((p) => p.rentabilidad));
  const rMax = Math.max(...puntos.map((p) => p.rentabilidad));
  const x = (v) => izq + ((v - vMin) / ((vMax - vMin) || 1)) * (W - izq - der);
  const y = (r) => H - abajo - ((r - rMin) / ((rMax - rMin) || 1)) * (H - abajo - arriba);

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'nv-frontera');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Nube de combinaciones de estos activos y su frontera: '
    + `riesgo entre ${pct(vMin)} y ${pct(vMax)}, rentabilidad anual entre ${pct(rMin)} y ${pct(rMax)}.`);
  const nodoSvg = (tag, attrs, texto) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  };

  const salto = Math.max(1, Math.floor(f.nube.length / 450));
  for (let i = 0; i < f.nube.length; i += salto) {
    const p = f.nube[i];
    svg.append(nodoSvg('circle', { cx: x(p.volatilidad).toFixed(1), cy: y(p.rentabilidad).toFixed(1), r: 2, class: 'nv-frontera__punto' }));
  }
  svg.append(nodoSvg('polyline', {
    points: f.frontera.map((p) => `${x(p.volatilidad).toFixed(1)},${y(p.rentabilidad).toFixed(1)}`).join(' '),
    class: 'nv-frontera__linea', fill: 'none',
  }));
  if (metricas) {
    svg.append(nodoSvg('circle', {
      cx: x(metricas.volatilidad).toFixed(1), cy: y(metricas.rentabilidadAnualizada).toFixed(1),
      r: 5.5, class: 'nv-frontera__mi-punto',
    }));
  }
  /* Ejes: mínimo y máximo, sin más ruido. */
  svg.append(
    nodoSvg('text', { x: izq, y: H - 10, class: 'nv-frontera__eje' }, pct(vMin)),
    nodoSvg('text', { x: W - der, y: H - 10, 'text-anchor': 'end', class: 'nv-frontera__eje' }, pct(vMax)),
    nodoSvg('text', { x: 4, y: H - abajo, class: 'nv-frontera__eje' }, pct(rMin)),
    nodoSvg('text', { x: 4, y: arriba + 10, class: 'nv-frontera__eje' }, pct(rMax)),
    nodoSvg('text', { x: (izq + W - der) / 2, y: H - 10, 'text-anchor': 'middle', class: 'nv-frontera__eje' }, 'Riesgo (volatilidad anual) →'),
  );
  bloque.append(svg);

  bloque.append(el('p', { class: 'nv-cons__nota' }, TEXTO_FRONTERA
    + (metricas ? ' El punto grande es tu combinación actual.'
      : ' Tu combinación no tiene historial común suficiente para marcarla.')));

  if (!interactiva) return bloque;

  /* Parte interactiva del suscriptor: recorrer la frontera punto a punto. */
  const control = el('div', { class: 'nv-frontera__control' });
  const idControl = 'frontera-punto';
  control.append(el('label', { for: idControl, class: 'nv-frontera__etiqueta' },
    'Recorre la frontera y mira el reparto de cada punto:'));
  const rango = el('input', {
    type: 'range', id: idControl, min: '0',
    max: String(f.frontera.length - 1), step: '1', value: String(Math.floor(f.frontera.length / 2)),
  });
  const detalle = el('p', { class: 'nv-frontera__detalle', 'aria-live': 'polite' });
  let marcador = null;
  const pinta = () => {
    const p = f.frontera[Number(rango.value)];
    if (!p) return;
    if (marcador) marcador.remove();
    marcador = nodoSvg('circle', {
      cx: x(p.volatilidad).toFixed(1), cy: y(p.rentabilidad).toFixed(1), r: 5, class: 'nv-frontera__elegido',
    });
    svg.append(marcador);
    const reparto = [...p.pesos].sort((a, b) => b.peso - a.peso)
      .filter((w) => w.peso >= 0.5)
      .map((w) => `${nombreDe?.[w.id] || w.id} ${pct(w.peso / 100, 0)}`)
      .join(' · ');
    detalle.textContent = `Ese punto del historial: riesgo ${pct(p.volatilidad)}, `
      + `rentabilidad anual ${pct(p.rentabilidad)}. Reparto: ${reparto}.`;
  };
  rango.addEventListener('input', pinta);
  control.append(rango, detalle);
  bloque.append(control);
  pinta();
  return bloque;
}

/** Grupo de proyección del suscriptor: simulación con los supuestos a la vista. */
function grupoProyeccion(metricas) {
  const bloque = el('div', { class: 'nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, 'Proyección por simulación (Montecarlo)'));
  const proyeccion = metricas
    ? proyeccionMonteCarlo({ rentabilidad: metricas.rentabilidadAnualizada, volatilidad: metricas.volatilidad })
    : null;
  if (!proyeccion) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Sin métricas de la combinación no hay nada que simular; nunca se inventa.'));
    return bloque;
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

/** Grupo de la matriz de correlaciones del suscriptor. */
function grupoCorrelaciones(series, pesos, nombreDe) {
  const bloque = el('div', { class: 'nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, 'Matriz de correlaciones'));
  const enCalculo = (series || []).filter((s) => pesos[s.asset_id] != null);
  if (enCalculo.length < 2) {
    bloque.append(el('p', { class: 'nv-cons__nota' },
      'Con una sola posición en el cálculo no hay pares que correlacionar.'));
    return bloque;
  }
  const { ids, rho } = correlacionesDesdeSeries(
    enCalculo.map((s) => ({ id: s.asset_id, niveles: s.values })));
  const tabla = el('table', { class: 'nv-table nv-analisis__matriz' });
  tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Correlaciones entre las posiciones de la cartera'));
  const thead = el('thead');
  const trh = el('tr');
  trh.append(el('th', { scope: 'col' }, ''));
  for (const id of ids) trh.append(el('th', { scope: 'col' }, nombreDe?.[id] || id));
  thead.append(trh);
  const tbody = el('tbody');
  for (const a of ids) {
    const tr = el('tr');
    tr.append(el('th', { scope: 'row' }, nombreDe?.[a] || a));
    for (const b of ids) {
      const v = rho[a]?.[b];
      tr.append(el('td', {}, Number.isFinite(v) ? num(v, 2) : '—'));
    }
    tbody.append(tr);
  }
  tabla.append(thead, tbody);
  const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
  envoltorio.append(tabla);
  bloque.append(envoltorio);
  bloque.append(el('p', { class: 'nv-cons__nota' }, TEXTO_CORRELACIONES));
  return bloque;
}

function tablaReparto(titulo, resultado, maxFilas = 5) {
  const bloque = el('div', { class: 'nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, titulo));
  if (!resultado || resultado.calidad === 'none' || !resultado.filas.length) {
    bloque.append(el('p', { class: 'nv-cons__nota' }, 'Sin renta variable que desglosar en esta cartera.'));
    return bloque;
  }
  const lista = el('ul', { class: 'nv-analisis__filas' });
  for (const fila of resultado.filas.slice(0, maxFilas)) {
    const item = el('li', { class: 'nv-analisis__fila' });
    item.append(
      el('span', { class: 'nv-analisis__clave' }, etiquetaClave(fila.clave)),
      el('span', { class: 'nv-analisis__peso' }, pct(fila.peso / 100, 1)),
    );
    const barra = el('span', { class: 'nv-analisis__barra', 'aria-hidden': 'true' });
    barra.style.width = `${Math.min(100, Math.max(2, fila.peso))}%`;
    item.append(barra);
    lista.append(item);
  }
  bloque.append(lista);
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
  const grupoAhorro = el('div', { class: 'nv-analisis__grupo' });
  grupoAhorro.append(el('h4', { class: 'nv-analisis__titulo' }, 'Ahorro por diversificar'));
  grupoAhorro.append(el('p', { class: 'nv-cons__nota' }, ahorro
    ? textoAhorro(ahorro)
    : 'Con una sola posición en el cálculo, o sin historial común suficiente, no hay diversificación que medir.'));
  raiz.append(grupoAhorro);

  /* Frontera (paso 33): estática con la cartera marcada para el registrado,
     con recorrido interactivo para el suscriptor. Sin red: series ya cargadas. */
  raiz.append(grupoFrontera({ series, pesos, metricas, interactiva: esSuscriptor, nombreDe }));

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

  raiz.append(tablaReparto('Concentración sectorial (renta variable)', concentracionSectorial(posAnalisis, activos)));
  raiz.append(tablaReparto('Concentración geográfica (renta variable)', concentracionGeografica(posAnalisis, activos)));
  if (sinFicha.length) {
    raiz.append(el('p', { class: 'nv-cons__nota' },
      `Sin ficha disponible ahora mismo: ${sinFicha.join(', ')}. No entra en la concentración.`));
  }

  /* Solapamiento entre fondos y ETF. */
  const grupoSolape = el('div', { class: 'nv-analisis__grupo' });
  grupoSolape.append(el('h4', { class: 'nv-analisis__titulo' }, 'Solapamiento entre fondos'));
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
        grupoSolape.append(el('p', { class: 'nv-cons__nota' },
          'El solapamiento de un par es el porcentaje de cartera que ambos fondos comparten, posición a posición.'));
        const tabla = el('table', { class: 'nv-table nv-analisis__matriz' });
        tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Solapamiento entre los fondos de la cartera'));
        const thead = el('thead');
        const trh = el('tr');
        trh.append(el('th', { scope: 'col' }, ''));
        for (const id of conDatos) trh.append(el('th', { scope: 'col' }, nombreDe[id] || id));
        thead.append(trh);
        const tbody = el('tbody');
        for (const a of conDatos) {
          const tr = el('tr');
          tr.append(el('th', { scope: 'row' }, nombreDe[a] || a));
          for (const b of conDatos) {
            tr.append(el('td', {}, a === b ? '—' : pct((matriz.porcentaje[a]?.[b] ?? 0) / 100, 1)));
          }
          tbody.append(tr);
        }
        tabla.append(thead, tbody);
        const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
        envoltorio.append(tabla);
        grupoSolape.append(envoltorio);
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

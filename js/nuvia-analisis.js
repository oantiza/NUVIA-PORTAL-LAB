/**
 * NUVIA — análisis ampliado del nivel registrado (paso 32, Fase 4).
 *
 * Con la sesión iniciada, la cartera montada en el constructor se analiza
 * además por: ahorro por diversificar (sobre el historial real ya cargado),
 * concentración sectorial y geográfica (fichas de `get_asset_detail`, con la
 * calidad del dato declarada) y solapamiento entre fondos y ETF
 * (`get_asset_holdings_batch`). Todo se calcula en el navegador con los
 * módulos ya portados en la Fase 2; aquí solo se orquesta y se pinta.
 *
 * Sin sesión, el bloque se limita a decir que este análisis existe y con qué
 * se abre. Lenguaje: describe, nunca prescribe; cuando falta un dato se dice
 * tal cual y nunca se inventa una cifra.
 */

import { correlacionesDesdeSeries, pct } from './nuvia-cartera.js';
import { concentracionSectorial, concentracionGeografica } from './nuvia-concentracion.js';
import { matrizSolapamiento } from './nuvia-solapamiento.js';

export const NOTA_ANALISIS_CERRADO = 'Con la sesión iniciada, esta misma '
  + 'cartera se analiza también por concentración, solapamiento entre fondos '
  + 'y ahorro por diversificar. Es el análisis ampliado de la cuenta gratuita.';

export const FUENTE_ANALISIS = 'Fichas y desgloses de la base de datos NUVIA '
  + 'a su último cierre; el ahorro por diversificar sale del mismo historial '
  + 'de 3 años de la tabla de métricas.';

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

function holdingsDe(datos, ids) {
  const clave = [...ids].sort().join('|');
  if (!cacheHoldings.has(clave)) {
    const promesa = datos.llama('get_asset_holdings_batch', { asset_ids: ids })
      .then((r) => r?.holdings || {})
      .catch(() => null);
    promesa.then((r) => { if (r === null) cacheHoldings.delete(clave); });
    cacheHoldings.set(clave, promesa);
  }
  return cacheHoldings.get(clave);
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
export async function montaAnalisis(raiz, { posiciones, pesos, series, datos, registrada }) {
  if (!raiz) return;
  raiz.textContent = '';
  if (!pesos) return;

  if (!registrada) {
    raiz.append(el('p', { class: 'nv-analisis__cerrado' }, NOTA_ANALISIS_CERRADO));
    return;
  }

  raiz.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Análisis ampliado (tu cuenta)'));

  /* Ahorro por diversificar: sale de las series ya cargadas, sin más red. */
  const ahorro = ahorroDeSeries(series, pesos);
  const grupoAhorro = el('div', { class: 'nv-analisis__grupo' });
  grupoAhorro.append(el('h4', { class: 'nv-analisis__titulo' }, 'Ahorro por diversificar'));
  grupoAhorro.append(el('p', { class: 'nv-cons__nota' }, ahorro
    ? textoAhorro(ahorro)
    : 'Con una sola posición en el cálculo, o sin historial común suficiente, no hay diversificación que medir.'));
  raiz.append(grupoAhorro);

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
      const nombreDe = {};
      for (const p of posiciones) nombreDe[p.activo.asset_id] = p.activo.display_name || p.activo.asset_id;
      const matriz = matrizSolapamiento(fondos.map((id) => ({ id, cartera: docs[id] || null })));
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

  raiz.append(el('p', { class: 'nv-cons__fuente' }, FUENTE_ANALISIS));
}

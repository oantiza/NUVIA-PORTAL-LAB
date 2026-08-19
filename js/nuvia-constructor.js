/**
 * NUVIA — constructor de cartera del visitante (paso 20).
 *
 * Hasta 5 posiciones elegidas en el buscador (evento `nuvia:activo-elegido`),
 * con pesos que se normalizan al 100 % y recálculo al instante. Las métricas
 * salen del historial real de la maestra: una llamada a `get_price_series`
 * (diaria, 3 años) por conjunto de activos, cacheada; mover un peso no vuelve
 * a llamar a la red.
 *
 * Lenguaje llano, describe sin prescribir. Un activo sin historial suficiente
 * se dice tal cual y queda fuera del cálculo; nunca se inventa una cifra.
 */

import { maestra, etiquetaTipo } from './nuvia-datos.js';
import { metricasDesdeSerie, serieDeCaidas, pct, DIAS_MERCADO } from './nuvia-cartera.js';

export const MAX_POSICIONES = 5;
const PESO_INICIAL = 20;

/** Texto del contador, visible desde la primera posición (el límite se
 *  comunica antes, no después — bases §3). */
export function textoContador(n) {
  return `Posiciones: ${n} de ${MAX_POSICIONES}`;
}

/**
 * Nota de nivel, mostrada al llegar al tope. Describe qué añade cada nivel;
 * no aconseja. El registro llega en una fase posterior y se dice tal cual.
 */
export const NOTA_NIVEL = 'Este nivel de la página trabaja con hasta '
  + `${MAX_POSICIONES} posiciones: bastan para ver el efecto de combinar `
  + 'activos y la tabla se lee con claridad. Una cuenta gratuita, cuando el '
  + 'registro se abra en una fase posterior del portal, mantendrá las '
  + `${MAX_POSICIONES} posiciones por cartera y añadirá guardado en la nube, `
  + 'carteras sin tope y análisis más amplio; la suscripción ampliará el '
  + 'análisis y llegará a 20 posiciones.';

/* ── Lógica pura (probada en docs/nuvia-constructor.test.mjs) ── */

/** Añade un activo. Devuelve { posiciones, motivo } — motivo explica un rechazo. */
export function agregaPosicion(posiciones, activo) {
  if (!activo?.asset_id) return { posiciones, motivo: 'sin-id' };
  if (posiciones.some((p) => p.activo.asset_id === activo.asset_id)) {
    return { posiciones, motivo: 'repetido' };
  }
  if (posiciones.length >= MAX_POSICIONES) {
    return { posiciones, motivo: 'limite' };
  }
  return { posiciones: [...posiciones, { activo, bruto: PESO_INICIAL }], motivo: null };
}

export function quitaPosicion(posiciones, assetId) {
  return posiciones.filter((p) => p.activo.asset_id !== assetId);
}

export function cambiaPeso(posiciones, assetId, bruto) {
  return posiciones.map((p) => (p.activo.asset_id === assetId ? { ...p, bruto: Number(bruto) } : p));
}

/** Pesos normalizados a 1 entre los activos incluidos; null si no suma nada. */
export function pesosNormalizados(posiciones, idsIncluidos = null) {
  const incluidas = posiciones.filter((p) => !idsIncluidos || idsIncluidos.includes(p.activo.asset_id));
  const total = incluidas.reduce((s, p) => s + (Number.isFinite(p.bruto) && p.bruto > 0 ? p.bruto : 0), 0);
  if (total <= 0) return null;
  const out = {};
  for (const p of incluidas) out[p.activo.asset_id] = (Number.isFinite(p.bruto) && p.bruto > 0 ? p.bruto : 0) / total;
  return out;
}

/**
 * Serie de la cartera: combinación ponderada de las series rebasadas a 100.
 * Equivale a comprar cada activo con su peso al inicio y no tocar nada.
 * Devuelve niveles que arrancan en 1, o null si falta alguna serie.
 */
export function serieCartera(series, pesos) {
  const usadas = series.filter((s) => pesos[s.asset_id] != null);
  if (!usadas.length) return null;
  const n = usadas[0].values.length;
  if (!n || usadas.some((s) => s.values.length !== n)) return null;
  const niveles = new Array(n).fill(0);
  for (const s of usadas) {
    const w = pesos[s.asset_id];
    for (let t = 0; t < n; t += 1) niveles[t] += (w * s.values[t]) / 100;
  }
  return niveles;
}

/** '2026-08-15' → '15-08-2026' (para la nota de fuente). */
export function fechaCorta(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

const EUROS = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

/**
 * Lecturas en lenguaje llano de la tabla de métricas (paso 22): cada cifra
 * dentro de una frase que la traduce, no solo el número. Describen lo que
 * pasó; nunca aconsejan ni proyectan. Si falta el dato, se dice.
 */
export function lecturasDeMetricas(m, { niveles = null, fechas = null } = {}) {
  const sinDato = 'No hay datos suficientes para calcularla.';
  if (!m) return { rentabilidad: sinDato, volatilidad: sinDato, caida: sinDato };

  const rentabilidad = m.rentabilidadTotal != null
    ? `Cada 10.000 € al inicio habrían acabado en ${EUROS.format(Math.round(10000 * (1 + m.rentabilidadTotal)))} tres años después (${pct(m.rentabilidadAnualizada)} de media anual). El pasado no asegura el futuro.`
    : sinDato;

  const volatilidad = m.volatilidad != null
    ? `En un año normal, el valor de esta combinación se ha movido arriba o abajo en torno a un ${pct(m.volatilidad)}.`
    : sinDato;

  let caida = sinDato;
  if (m.maximaCaida != null) {
    if (m.maximaCaida === 0) {
      caida = 'En estos 3 años no llegó a caer por debajo de un máximo anterior.';
    } else {
      caida = `En el peor tramo, la cartera llegó a estar un ${pct(-m.maximaCaida)} por debajo de su máximo anterior`;
      const cuando = fechaDelMinimo(niveles, fechas);
      caida += cuando ? ` (punto más bajo: ${cuando}).` : '.';
      caida += ' Da idea del bache que habría tocado aguantar.';
    }
  }
  return { rentabilidad, volatilidad, caida };
}

/** Fecha del punto más bajo de la caída máxima, o null si no puede saberse. */
export function fechaDelMinimo(niveles, fechas) {
  if (!niveles?.length || !fechas || fechas.length !== niveles.length) return null;
  const caidas = serieDeCaidas(niveles);
  let indice = -1;
  let peor = 0;
  for (let t = 0; t < caidas.length; t += 1) {
    if (Number.isFinite(caidas[t]) && caidas[t] < peor) { peor = caidas[t]; indice = t; }
  }
  return indice >= 0 ? fechaCorta(fechas[indice]) : null;
}

/* ── Montaje ── */

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaConstructor(raiz, { cliente = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();

  let posiciones = [];
  const cacheSeries = new Map(); // clave (ids ordenados) -> promesa del payload
  let generacion = 0;

  raiz.textContent = '';
  const contador = el('p', { class: 'nv-cons__contador' });
  const lista = el('ul', { class: 'nv-cons__lista' });
  const estado = el('p', { class: 'nv-cons__estado', role: 'status' });
  const nivel = el('div', { class: 'nv-note nv-cons__nivel', hidden: '' });
  nivel.append(el('p', {}, NOTA_NIVEL));
  const resultados = el('div', { class: 'nv-cons__resultados', 'aria-live': 'polite' });
  raiz.append(contador, lista, estado, nivel, resultados);

  function seriesDelConjunto(ids) {
    const clave = [...ids].sort().join('|');
    if (!cacheSeries.has(clave)) {
      const promesa = datos.llama('get_price_series', {
        asset_ids: ids, frequency: 'DAILY', window: '3Y',
      });
      promesa.catch(() => cacheSeries.delete(clave));
      cacheSeries.set(clave, promesa);
    }
    return cacheSeries.get(clave);
  }

  function pintaLista() {
    lista.textContent = '';
    for (const p of posiciones) {
      const item = el('li', { class: 'nv-cons__fila' });
      const cabecera = el('div', { class: 'nv-cons__activo' });
      cabecera.append(
        el('span', { class: 'nv-cons__nombre' }, p.activo.display_name || p.activo.asset_id),
        el('span', { class: 'nv-tag nv-cons__tipo' }, etiquetaTipo(p.activo.instrument_type)),
      );
      const quitar = el('button', { type: 'button', class: 'nv-cons__quitar', 'aria-label': `Quitar ${p.activo.display_name || p.activo.asset_id}` }, '×');
      quitar.addEventListener('click', () => {
        posiciones = quitaPosicion(posiciones, p.activo.asset_id);
        pintaLista();
        recalcula();
      });
      cabecera.append(quitar);

      const idInput = `peso-${p.activo.asset_id}`;
      const control = el('div', { class: 'nv-cons__peso' });
      const etiqueta = el('label', { class: 'nv-visually-hidden', for: idInput }, `Peso de ${p.activo.display_name || p.activo.asset_id}`);
      const input = el('input', { type: 'range', id: idInput, min: '0', max: '100', step: '5', value: String(p.bruto) });
      const salida = el('output', { for: idInput, class: 'nv-cons__valor' });
      p._salida = salida;
      input.addEventListener('input', () => {
        posiciones = cambiaPeso(posiciones, p.activo.asset_id, input.value);
        recalcula();
      });
      control.append(etiqueta, input, salida);
      item.append(cabecera, control);
      lista.append(item);
    }
  }

  function filaMetrica(nombre, valor, lectura) {
    const tr = el('tr');
    tr.append(el('th', { scope: 'row' }, nombre), el('td', { class: 'nv-sim-cifra' }, valor), el('td', {}, lectura));
    return tr;
  }

  async function recalcula() {
    contador.textContent = posiciones.length ? textoContador(posiciones.length) : '';
    nivel.hidden = posiciones.length < MAX_POSICIONES;
    if (!posiciones.length) {
      estado.textContent = `Busca un activo arriba y elígelo para añadirlo aquí (hasta ${MAX_POSICIONES} posiciones).`;
      resultados.textContent = '';
      return;
    }
    const ids = posiciones.map((p) => p.activo.asset_id);
    const mia = ++generacion;
    let payload;
    try {
      const promesa = seriesDelConjunto(ids);
      estado.textContent = 'Consultando el historial…';
      payload = await promesa;
    } catch {
      if (mia !== generacion) return;
      estado.textContent = 'No se ha podido consultar el historial. Prueba de nuevo en unos segundos.';
      resultados.textContent = '';
      return;
    }
    if (mia !== generacion) return;

    const series = payload?.series || [];
    const idsConSerie = series.map((s) => s.asset_id);
    const excluidos = posiciones.filter((p) => !idsConSerie.includes(p.activo.asset_id));
    const pesos = pesosNormalizados(posiciones, idsConSerie);

    for (const p of posiciones) {
      if (p._salida) {
        p._salida.value = pesos && pesos[p.activo.asset_id] != null
          ? pct(pesos[p.activo.asset_id], 0)
          : 'fuera del cálculo';
      }
    }

    const partes = [];
    if (excluidos.length) {
      partes.push(`Sin historial suficiente en la base de datos: ${excluidos.map((p) => p.activo.display_name || p.activo.asset_id).join(', ')}. No entra en el cálculo.`);
    }
    estado.textContent = partes.join(' ');

    resultados.textContent = '';
    if (!pesos) {
      resultados.append(el('p', { class: 'nv-cons__nota' }, 'Sube algún peso para ver las métricas.'));
      return;
    }
    const niveles = serieCartera(series, pesos);
    const m = niveles ? metricasDesdeSerie(niveles, { periodosPorAno: DIAS_MERCADO }) : undefined;
    if (!m) {
      resultados.append(el('p', { class: 'nv-cons__nota' }, 'No hay historial común suficiente para calcular las métricas de esta combinación.'));
      return;
    }

    const tabla = el('table', { class: 'nv-table nv-sim-tabla' });
    tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Métricas históricas de la combinación elegida'));
    const thead = el('thead');
    const trh = el('tr');
    trh.append(el('th', { scope: 'col' }, 'Métrica'), el('th', { scope: 'col' }, 'Valor'), el('th', { scope: 'col' }, 'Cómo leerla'));
    thead.append(trh);
    const lecturas = lecturasDeMetricas(m, { niveles, fechas: payload?.dates || null });
    const tbody = el('tbody');
    tbody.append(
      filaMetrica('Rentabilidad (3 años)', pct(m.rentabilidadTotal), lecturas.rentabilidad),
      filaMetrica('Volatilidad (3 años)', pct(m.volatilidad), lecturas.volatilidad),
      filaMetrica('Máxima caída (3 años)', pct(m.maximaCaida), lecturas.caida),
    );
    tabla.append(thead, tbody);
    const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
    envoltorio.append(tabla);
    resultados.append(envoltorio);

    const fecha = fechaCorta(payload?.coverage?.last_date);
    resultados.append(el('p', { class: 'nv-cons__fuente' },
      `Datos de cierre${fecha ? ` del ${fecha}` : ''}, base de datos NUVIA. Ventana de 3 años, en euros. ${m.observaciones} observaciones.`));
  }

  document.addEventListener('nuvia:activo-elegido', (evento) => {
    const { posiciones: nuevas, motivo } = agregaPosicion(posiciones, evento.detail);
    if (motivo === 'limite') {
      estado.textContent = `La cartera ya tiene sus ${MAX_POSICIONES} posiciones. Quita alguna para probar otra combinación.`;
      nivel.hidden = false;
      return;
    }
    if (motivo === 'repetido') {
      estado.textContent = 'Ese activo ya está en la cartera.';
      return;
    }
    if (motivo) return;
    posiciones = nuevas;
    pintaLista();
    recalcula();
    raiz.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  recalcula();
  return { recalcula, cuantas: () => posiciones.length };
}

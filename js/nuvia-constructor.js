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

/**
 * Clases de activo de la maestra, con su etiqueta y color del sistema
 * (paso 23). Lo que no llega clasificado se enseña como «Sin clasificar»,
 * nunca se adivina.
 */
export const CLASES_VISUALES = {
  EQUITY: { etiqueta: 'Renta variable', color: 'var(--nv-cat-teal)' },
  FIXED_INCOME: { etiqueta: 'Renta fija', color: 'var(--nv-cat-purple)' },
  MONEY_MARKET: { etiqueta: 'Monetario', color: 'var(--nv-cat-cyan)' },
  REAL_ASSET: { etiqueta: 'Activos reales', color: 'var(--nv-cat-amber)' },
  MIXED: { etiqueta: 'Mixtos', color: 'var(--nv-cat-clay)' },
  ALTERNATIVE: { etiqueta: 'Alternativos', color: 'var(--nv-cat-slate)' },
  OTHER: { etiqueta: 'Otros', color: 'var(--nv-cat-slate)' },
  SIN_CLASIFICAR: { etiqueta: 'Sin clasificar', color: 'var(--nv-cat-slate)' },
};

export function claseVisual(clase) {
  return CLASES_VISUALES[String(clase || '').toUpperCase()] || CLASES_VISUALES.SIN_CLASIFICAR;
}

/**
 * Reparto por clase de activo: agrega los pesos normalizados por la clase
 * económica que declara la maestra para cada producto (sin mirar dentro de
 * los fondos: el look-through es de niveles superiores). Devuelve
 * [{clase, etiqueta, color, peso}] de mayor a menor, o null sin pesos.
 */
export function repartoPorClase(posiciones, pesos) {
  if (!pesos) return null;
  const acumulado = new Map();
  for (const p of posiciones) {
    const peso = pesos[p.activo.asset_id];
    if (peso == null) continue;
    const bruta = String(p.activo.economic_asset_class || '').toUpperCase();
    const clase = CLASES_VISUALES[bruta] ? bruta : 'SIN_CLASIFICAR';
    acumulado.set(clase, (acumulado.get(clase) || 0) + peso);
  }
  if (!acumulado.size) return null;
  return [...acumulado.entries()]
    .map(([clase, peso]) => ({ clase, ...claseVisual(clase), peso }))
    .sort((a, b) => b.peso - a.peso);
}

/* ── Guardado local (paso 24) ── */

export const MAX_CARTERAS = 4;
const CLAVE_CARTERAS = 'nuvia.carteras-visitante.v1';

/** Aviso del guardado, en lenguaje llano: comprensible sin saber qué es un
 *  navegador por dentro. */
export const AVISO_GUARDADO = 'Tus carteras se guardan solo en este navegador '
  + 'y en este dispositivo. Si borras los datos de navegación se pierden, y no '
  + 'aparecerán si abres la página en otro ordenador o en el móvil.';

/** Se guarda solo lo necesario para reconstruir la cartera; nada más. */
export function carteraParaGuardar(nombre, posiciones) {
  return {
    nombre: String(nombre || '').trim(),
    posiciones: posiciones.map((p) => ({
      activo: {
        asset_id: p.activo.asset_id,
        display_name: p.activo.display_name,
        instrument_type: p.activo.instrument_type,
        economic_asset_class: p.activo.economic_asset_class,
      },
      bruto: p.bruto,
    })),
  };
}

/**
 * Añade (o reemplaza, si el nombre coincide) una cartera a la lista.
 * Devuelve { lista, motivo }: 'limite' si no cabe, 'sin-posiciones' si no hay
 * nada que guardar, 'reemplazada' si pisó una con el mismo nombre.
 */
export function agregaCartera(lista, cartera) {
  if (!cartera.posiciones?.length) return { lista, motivo: 'sin-posiciones' };
  const nombre = cartera.nombre || `Cartera ${lista.length + 1}`;
  const definitiva = { ...cartera, nombre };
  const indice = lista.findIndex((c) => c.nombre === nombre);
  if (indice >= 0) {
    const nueva = [...lista];
    nueva[indice] = definitiva;
    return { lista: nueva, motivo: 'reemplazada' };
  }
  if (lista.length >= MAX_CARTERAS) return { lista, motivo: 'limite' };
  return { lista: [...lista, definitiva], motivo: null };
}

export function borraCartera(lista, indice) {
  return lista.filter((_, i) => i !== indice);
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

  /* ── Guardado local (paso 24) ── */
  const guardado = el('div', { class: 'nv-cons__guardado' });
  guardado.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Tus carteras en este navegador'));
  guardado.append(el('p', { class: 'nv-cons__aviso-guardado' }, AVISO_GUARDADO));
  const formulario = el('div', { class: 'nv-cons__guardar' });
  const campoNombre = el('div', { class: 'nv-field nv-cons__nombre-campo' });
  const etiquetaNombre = el('label', { for: 'nombre-cartera' }, 'Nombre para guardarla');
  const cajaNombre = el('div', { class: 'nv-field__box' });
  const inputNombre = el('input', { id: 'nombre-cartera', type: 'text', maxlength: '40', autocomplete: 'off', placeholder: 'Por ejemplo: Mi primera prueba' });
  cajaNombre.append(inputNombre);
  campoNombre.append(etiquetaNombre, cajaNombre);
  const botonGuardar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__boton-guardar' }, 'Guardar en este navegador');
  formulario.append(campoNombre, botonGuardar);
  const estadoGuardado = el('p', { class: 'nv-cons__estado', role: 'status' });
  const listaGuardadas = el('ul', { class: 'nv-cons__guardadas' });
  guardado.append(formulario, estadoGuardado, listaGuardadas);

  raiz.append(contador, lista, estado, nivel, resultados, guardado);

  function leeGuardadas() {
    try {
      const crudo = JSON.parse(localStorage.getItem(CLAVE_CARTERAS) || '[]');
      if (Array.isArray(crudo)) return crudo.filter((c) => c?.nombre && Array.isArray(c.posiciones));
    } catch { /* datos ilegibles: se parte de cero */ }
    return [];
  }

  function escribeGuardadas(carteras) {
    try { localStorage.setItem(CLAVE_CARTERAS, JSON.stringify(carteras)); } catch { /* sin persistencia */ }
  }

  function pintaGuardadas() {
    const carteras = leeGuardadas();
    listaGuardadas.textContent = '';
    for (const [indice, cartera] of carteras.entries()) {
      const item = el('li', { class: 'nv-cons__guardada' });
      item.append(
        el('span', { class: 'nv-cons__guardada-nombre' }, cartera.nombre),
        el('span', { class: 'nv-cons__guardada-detalle' },
          `${cartera.posiciones.length} ${cartera.posiciones.length === 1 ? 'posición' : 'posiciones'}`),
      );
      const cargar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__guardada-boton' }, 'Cargar');
      cargar.addEventListener('click', () => {
        posiciones = cartera.posiciones.map((p) => ({ activo: { ...p.activo }, bruto: Number(p.bruto) || 0 }));
        pintaLista();
        recalcula();
        estadoGuardado.textContent = `Cartera «${cartera.nombre}» cargada.`;
      });
      const borrar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__guardada-boton' }, 'Borrar');
      borrar.addEventListener('click', () => {
        escribeGuardadas(borraCartera(leeGuardadas(), indice));
        pintaGuardadas();
        estadoGuardado.textContent = `Cartera «${cartera.nombre}» borrada de este navegador.`;
      });
      item.append(cargar, borrar);
      listaGuardadas.append(item);
    }
    botonGuardar.textContent = `Guardar en este navegador (${carteras.length} de ${MAX_CARTERAS})`;
  }

  botonGuardar.addEventListener('click', () => {
    const { lista: nuevas, motivo } = agregaCartera(leeGuardadas(), carteraParaGuardar(inputNombre.value, posiciones));
    if (motivo === 'sin-posiciones') {
      estadoGuardado.textContent = 'No hay nada que guardar todavía: añade algún activo primero.';
      return;
    }
    if (motivo === 'limite') {
      estadoGuardado.textContent = `Este navegador guarda hasta ${MAX_CARTERAS} carteras. Borra alguna para guardar esta.`;
      return;
    }
    escribeGuardadas(nuevas);
    pintaGuardadas();
    const nombre = nuevas[nuevas.length - 1]?.nombre;
    estadoGuardado.textContent = motivo === 'reemplazada'
      ? `Cartera «${inputNombre.value.trim()}» actualizada.`
      : `Cartera guardada${nombre ? ` como «${nombre}»` : ''}.`;
    inputNombre.value = '';
  });

  pintaGuardadas();

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
    /* ── Reparto por clase de activo: un gráfico, una idea (paso 23) ── */
    const reparto = repartoPorClase(posiciones, pesos);
    if (reparto) {
      resultados.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Reparto por clase de activo'));
      const barra = el('div', {
        class: 'nv-sim-barra',
        role: 'img',
        'aria-label': `Reparto: ${reparto.map((r) => `${r.etiqueta} ${pct(r.peso, 0)}`).join(', ')}`,
      });
      const leyenda = el('ul', { class: 'nv-cons__leyenda' });
      for (const r of reparto) {
        const seg = el('span', { class: 'nv-sim-seg' });
        seg.style.background = r.color;
        seg.style.width = `${(r.peso * 100).toFixed(2)}%`;
        seg.title = `${r.etiqueta}: ${pct(r.peso, 0)}`;
        barra.append(seg);
        const item = el('li', { class: 'nv-cons__leyenda-item' });
        const punto = el('span', { class: 'nv-sim-punto', 'aria-hidden': 'true' });
        punto.style.background = r.color;
        item.append(punto, el('span', {}, `${r.etiqueta} · ${pct(r.peso, 0)}`));
        leyenda.append(item);
      }
      resultados.append(barra, leyenda);
      resultados.append(el('p', { class: 'nv-cons__nota-clase' },
        'Clase declarada de cada producto en la base de datos; los fondos mixtos cuentan como «Mixtos», sin mirar dentro.'));
      resultados.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Métricas de la combinación'));
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

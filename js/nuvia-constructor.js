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
import { metricasDesdeSerie, serieDeCaidas, pct, num, DIAS_MERCADO } from './nuvia-cartera.js';
import { montaAnalisis } from './nuvia-analisis.js';

/* El límite de posiciones depende del nivel de la sesión (paso 33). */

export const MAX_POSICIONES = 5;
export const MAX_POSICIONES_SUSCRIPTOR = 20;
const PESO_INICIAL = 20;

/** Límite de posiciones por nivel (bases §3): 20 para el suscriptor —por
 *  encima de 15–20 los gráficos dejan de comunicar—, 5 para el resto. */
export function maxPosiciones(nivel) {
  return nivel === 'suscriptor' ? MAX_POSICIONES_SUSCRIPTOR : MAX_POSICIONES;
}

/** Texto del contador, visible desde la primera posición (el límite se
 *  comunica antes, no después — bases §3). */
export function textoContador(n, limite = MAX_POSICIONES) {
  return `Posiciones: ${n} de ${limite}`;
}

/**
 * Nota de nivel, mostrada al llegar al tope. Describe qué añade cada nivel;
 * no aconseja. El registro ya está abierto (paso 28) y se dice dónde.
 */
export const NOTA_NIVEL = 'Este nivel de la página trabaja con hasta '
  + `${MAX_POSICIONES} posiciones: bastan para ver el efecto de combinar `
  + 'activos y la tabla se lee con claridad. Una cuenta gratuita —el registro '
  + 'está abierto en el bloque «Tu cuenta» de esta página— guarda las carteras '
  + 'en la nube, sin tope de carteras, y añade el análisis ampliado; la '
  + 'suscripción, cuando se abra, sumará el análisis completo y hasta '
  + `${MAX_POSICIONES_SUSCRIPTOR} posiciones.`;

/** Nota del tope del suscriptor: el límite de 20 se explica, no se esconde. */
export const NOTA_NIVEL_SUSCRIPTOR = 'Este es el tope de la herramienta: '
  + `${MAX_POSICIONES_SUSCRIPTOR} posiciones. Por encima de 15–20 los `
  + 'gráficos dejan de comunicar: una distribución con 25 porciones no se lee.';

/* ── Lógica pura (probada en docs/nuvia-constructor.test.mjs) ── */

/** Añade un activo. Devuelve { posiciones, motivo } — motivo explica un rechazo. */
export function agregaPosicion(posiciones, activo, limite = MAX_POSICIONES) {
  if (!activo?.asset_id) return { posiciones, motivo: 'sin-id' };
  if (posiciones.some((p) => p.activo.asset_id === activo.asset_id)) {
    return { posiciones, motivo: 'repetido' };
  }
  if (posiciones.length >= limite) {
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

/* ── Evolución de la combinación (encargo de Óscar, 20-08-2026): la línea
   en base 100 y, debajo, las caídas desde máximos. Todo sale del mismo
   historial real ya descargado; no hay ninguna llamada nueva a la red. ── */

/**
 * Prepara los puntos del gráfico de evolución: niveles (que arrancan en 1)
 * rebasados a 100, con sus fechas. Devuelve null si no hay al menos dos
 * puntos válidos o si fechas y niveles no casan: nada se inventa.
 */
export function puntosEvolucion(niveles, fechas) {
  if (!Array.isArray(niveles) || niveles.length < 2) return null;
  if (!Array.isArray(fechas) || fechas.length !== niveles.length) return null;
  const base = niveles.map((v) => (Number.isFinite(v) ? v * 100 : NaN));
  const validos = base.filter(Number.isFinite);
  if (validos.length < 2) return null;
  return { base, fechas, min: Math.min(...validos), max: Math.max(...validos) };
}

/**
 * Trazado SVG («d» de un <path>) de una serie de valores: x avanza por
 * índice, y escala entre min y max dentro de los márgenes dados. Los
 * valores no numéricos se saltan sin cortar la línea. Pura y probada.
 */
export function trazadoLinea(valores, { W, H, izq, der, arriba, abajo, min, max }) {
  const n = valores.length;
  const anchoX = W - izq - der;
  const altoY = H - arriba - abajo;
  const rango = (max - min) || 1;
  let d = '';
  for (let i = 0; i < n; i += 1) {
    const v = valores[i];
    if (!Number.isFinite(v)) continue;
    const x = izq + (i / ((n - 1) || 1)) * anchoX;
    const y = H - abajo - ((v - min) / rango) * altoY;
    d += `${d ? ' L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

/** El gráfico de evolución con su panel de caídas. Null si faltan datos. */
export function grupoEvolucion({ niveles, fechas }) {
  const p = puntosEvolucion(niveles, fechas);
  if (!p) return null;

  const ns = 'http://www.w3.org/2000/svg';
  const nodoSvg = (tag, attrs, texto) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  };
  const desde = fechaCorta(p.fechas[0]);
  const hasta = fechaCorta(p.fechas[p.fechas.length - 1]);
  const bloque = el('div', { class: 'nv-evolucion' });
  bloque.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Evolución de la combinación'));
  bloque.append(el('p', { class: 'nv-cons__nota-clase' },
    'La línea arranca en 100 al principio de la ventana y sigue, día a día, el valor de este reparto. Describe lo ocurrido, no lo que viene.'));

  /* La línea en base 100. */
  const W = 760; const H = 280; const izq = 64; const der = 18; const arriba = 14; const abajo = 30;
  const svg = nodoSvg('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'nv-evolucion__svg',
    role: 'img',
    'aria-label': `Evolución en base 100 del ${desde} al ${hasta}: entre ${num(p.min, 0)} y ${num(p.max, 0)}, terminando en ${num(p.base[p.base.length - 1], 0)}.`,
  });
  const escala = { W, H, izq, der, arriba, abajo, min: p.min, max: p.max };
  const yDe = (v) => H - abajo - ((v - p.min) / ((p.max - p.min) || 1)) * (H - arriba - abajo);
  const yaPintadas = [];
  for (const ref of [...new Set([100, p.min, p.max])].filter((v) => v >= p.min && v <= p.max)) {
    const yy = yDe(ref);
    svg.append(nodoSvg('line', { x1: izq, y1: yy, x2: W - der, y2: yy, class: ref === 100 ? 'nv-evolucion__cien' : 'nv-evolucion__rejilla' }));
    /* La etiqueta solo si no se pisa con otra ya puesta (mínimos pegados a 100). */
    if (yaPintadas.every((otra) => Math.abs(otra - yy) > 14)) {
      svg.append(nodoSvg('text', { x: izq - 6, y: yy + 5, 'text-anchor': 'end', class: 'nv-grafico__eje' }, num(ref, 0)));
      yaPintadas.push(yy);
    }
  }
  svg.append(nodoSvg('path', { d: trazadoLinea(p.base, escala), class: 'nv-evolucion__linea', fill: 'none' }));
  svg.append(nodoSvg('text', { x: izq, y: H - 8, class: 'nv-grafico__eje' }, desde || ''));
  svg.append(nodoSvg('text', { x: W - der, y: H - 8, 'text-anchor': 'end', class: 'nv-grafico__eje' }, hasta || ''));
  bloque.append(svg);

  /* Las caídas desde máximos, en el mismo eje temporal. */
  const caidas = serieDeCaidas(niveles).map((c) => (Number.isFinite(c) ? c * 100 : NaN));
  const cMin = Math.min(0, ...caidas.filter(Number.isFinite));
  const H2 = 150;
  const svg2 = nodoSvg('svg', {
    viewBox: `0 0 ${W} ${H2}`,
    class: 'nv-evolucion__svg',
    role: 'img',
    'aria-label': `Caídas desde máximos en el mismo periodo: la peor llegó al ${num(cMin, 1)} %.`,
  });
  const escala2 = { W, H: H2, izq, der, arriba: 12, abajo: 20, min: cMin, max: 0 };
  const yDe2 = (v) => H2 - 20 - ((v - cMin) / ((0 - cMin) || 1)) * (H2 - 12 - 20);
  for (const ref of [...new Set([0, cMin])]) {
    const yy = yDe2(ref);
    svg2.append(nodoSvg('line', { x1: izq, y1: yy, x2: W - der, y2: yy, class: 'nv-evolucion__rejilla' }));
    svg2.append(nodoSvg('text', { x: izq - 6, y: yy + 5, 'text-anchor': 'end', class: 'nv-grafico__eje' }, `${num(ref, 0)} %`));
  }
  const linea = trazadoLinea(caidas, escala2);
  if (linea) {
    const primeraX = izq.toFixed(1);
    const ultimaX = (W - der).toFixed(1);
    const suelo = yDe2(0).toFixed(1);
    svg2.append(nodoSvg('path', {
      d: `${linea} L${ultimaX},${suelo} L${primeraX},${suelo} Z`,
      class: 'nv-evolucion__caida-area',
    }));
    svg2.append(nodoSvg('path', { d: linea, class: 'nv-evolucion__caida-linea', fill: 'none' }));
  }
  bloque.append(el('p', { class: 'nv-cons__nota-clase' }, 'Caídas desde máximos: la distancia al máximo anterior en cada momento. El cero es estar en máximos.'));
  bloque.append(svg2);
  return bloque;
}

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

/* ── Guardado en la nube (paso 30) ──
 *  A la cuenta va lo mínimo: qué activos y con qué peso normalizado. Ni
 *  nombres, ni tipos, ni clases, ni métricas: nada de la base maestra. Al
 *  abrir se reconstruye desde la propia base, así que el dato guardado no
 *  puede quedar «viejo». */

export const AVISO_GUARDADO_NUBE = 'Estas carteras se guardan en tu cuenta: '
  + 'las verás al entrar desde cualquier navegador o dispositivo. Guardamos '
  + 'solo qué activos y con qué peso; los nombres y las cifras se traen de la '
  + 'base de datos NUVIA al abrir, nunca se quedan viejos aquí.';

/** Convierte las posiciones de pantalla en el mínimo que viaja a la cuenta:
 *  identificador y peso normalizado (0–100). Nada más. */
export function carteraNubeParaGuardar(nombre, posiciones, portfolioId = null) {
  const pesos = pesosNormalizados(posiciones) || {};
  const positions = posiciones
    .filter((p) => p.activo?.asset_id)
    .map((p) => ({
      asset_id: p.activo.asset_id,
      weight_percent: Math.round((pesos[p.activo.asset_id] || 0) * 100 * 1e6) / 1e6,
    }));
  return {
    ...(portfolioId ? { portfolio_id: portfolioId } : {}),
    name: String(nombre || '').trim() || 'Cartera',
    base_currency: 'EUR',
    positions,
  };
}

/* ── Migración de lo local a la cuenta (paso 31) ──
 *  Al registrarse, las carteras guardadas en el navegador (paso 24) pueden
 *  subirse a la cuenta. Solo con permiso explícito (un botón), nunca en
 *  silencio, y subiendo lo mismo que el resto: identificadores y pesos. */

/** Prepara la subida de las carteras locales: una carga por cartera, en el
 *  formato de la nube (solo ids+pesos). Descarta las que no tengan ninguna
 *  posición con peso. */
export function carterasLocalesParaNube(locales) {
  return (locales || [])
    .map((c) => ({ nombre: c.nombre, carga: carteraNubeParaGuardar(c.nombre, (c.posiciones || []).map((p) => ({ activo: p.activo || {}, bruto: Number(p.bruto) || 0 }))) }))
    .filter((x) => x.carga.positions.some((p) => p.weight_percent > 0));
}

/** Reconstruye las posiciones de pantalla a partir de lo guardado (ids+pesos)
 *  y de las fichas traídas de la maestra. Sin ficha, el activo se muestra por
 *  su identificador y sin clase: nunca se inventa un nombre. */
export function posicionesDesdeNube(positions, detalles = {}, limite = MAX_POSICIONES) {
  return (positions || []).slice(0, limite).map((p) => {
    const ficha = detalles[p.asset_id] || {};
    return {
      activo: {
        asset_id: p.asset_id,
        display_name: ficha.display_name || p.asset_id,
        instrument_type: ficha.instrument_type,
        economic_asset_class: ficha.economic_asset_class,
      },
      bruto: Number(p.weight_percent) || 0,
    };
  });
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
  let ofertaMigracionDescartada = false; // «ahora no» de la migración (paso 31)

  raiz.textContent = '';
  const contador = el('p', { class: 'nv-cons__contador' });
  const lista = el('ul', { class: 'nv-cons__lista' });
  const estado = el('p', { class: 'nv-cons__estado', role: 'status' });
  const nivel = el('div', { class: 'nv-note nv-cons__nivel', hidden: '' });
  const notaNivel = el('p', {}, NOTA_NIVEL);
  nivel.append(notaNivel);
  const resultados = el('div', { class: 'nv-cons__resultados', 'aria-live': 'polite' });

  /* ── Guardado: local (paso 24) o en la cuenta (paso 30) según la sesión ── */
  const guardadoRaiz = el('div', { class: 'nv-cons__guardado' });
  raiz.append(contador, lista, estado, nivel, resultados, guardadoRaiz);

  function esRegistrada() {
    try { return datos.sesionActual?.().tipo === 'registrada'; } catch { return false; }
  }

  function nivelActual() {
    try { return datos.nivelSesion?.() || (esRegistrada() ? 'registrada' : 'visitante'); } catch { return 'visitante'; }
  }

  const limiteActual = () => maxPosiciones(nivelActual());

  function cargaPosiciones(nuevas, mensaje, estadoNodo) {
    posiciones = nuevas;
    pintaLista();
    recalcula();
    if (estadoNodo) estadoNodo.textContent = mensaje;
  }

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

  /* Guardado local: para quien no ha iniciado sesión (paso 24). */
  function pintaGuardadoLocal() {
    guardadoRaiz.textContent = '';
    guardadoRaiz.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Tus carteras en este navegador'));
    guardadoRaiz.append(el('p', { class: 'nv-cons__aviso-guardado' }, AVISO_GUARDADO));
    const formulario = el('div', { class: 'nv-cons__guardar' });
    const campoNombre = el('div', { class: 'nv-field nv-cons__nombre-campo' });
    const cajaNombre = el('div', { class: 'nv-field__box' });
    const inputNombre = el('input', { id: 'nombre-cartera', type: 'text', maxlength: '40', autocomplete: 'off', placeholder: 'Por ejemplo: Mi primera prueba' });
    cajaNombre.append(inputNombre);
    campoNombre.append(el('label', { for: 'nombre-cartera' }, 'Nombre para guardarla'), cajaNombre);
    const botonGuardar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__boton-guardar' }, 'Guardar en este navegador');
    formulario.append(campoNombre, botonGuardar);
    const estadoGuardado = el('p', { class: 'nv-cons__estado', role: 'status' });
    const listaGuardadas = el('ul', { class: 'nv-cons__guardadas' });
    guardadoRaiz.append(formulario, estadoGuardado, listaGuardadas);

    function pinta() {
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
          cargaPosiciones(
            cartera.posiciones.map((p) => ({ activo: { ...p.activo }, bruto: Number(p.bruto) || 0 })),
            `Cartera «${cartera.nombre}» cargada.`, estadoGuardado);
        });
        const borrar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__guardada-boton' }, 'Borrar');
        borrar.addEventListener('click', () => {
          escribeGuardadas(borraCartera(leeGuardadas(), indice));
          pinta();
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
      pinta();
      const nombre = nuevas[nuevas.length - 1]?.nombre;
      estadoGuardado.textContent = motivo === 'reemplazada'
        ? `Cartera «${inputNombre.value.trim()}» actualizada.`
        : `Cartera guardada${nombre ? ` como «${nombre}»` : ''}.`;
      inputNombre.value = '';
    });

    pinta();
  }

  /* Guardado en la cuenta: para quien ha iniciado sesión (paso 30). Guarda
     solo identificadores y pesos; el resto se rehace al abrir. */
  function pintaGuardadoNube() {
    guardadoRaiz.textContent = '';
    guardadoRaiz.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Tus carteras, en tu cuenta'));
    guardadoRaiz.append(el('p', { class: 'nv-cons__aviso-guardado' }, AVISO_GUARDADO_NUBE));
    const formulario = el('div', { class: 'nv-cons__guardar' });
    const campoNombre = el('div', { class: 'nv-field nv-cons__nombre-campo' });
    const cajaNombre = el('div', { class: 'nv-field__box' });
    const inputNombre = el('input', { id: 'nombre-cartera', type: 'text', maxlength: '40', autocomplete: 'off', placeholder: 'Por ejemplo: Mi primera prueba' });
    cajaNombre.append(inputNombre);
    campoNombre.append(el('label', { for: 'nombre-cartera' }, 'Nombre para guardarla'), cajaNombre);
    const botonGuardar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__boton-guardar' }, 'Guardar en la cuenta');
    formulario.append(campoNombre, botonGuardar);
    const estadoGuardado = el('p', { class: 'nv-cons__estado', role: 'status' });
    const oferta = el('div', { class: 'nv-note nv-cons__migracion', hidden: '' });
    const listaGuardadas = el('ul', { class: 'nv-cons__guardadas' });
    guardadoRaiz.append(formulario, estadoGuardado, oferta, listaGuardadas);

    let ocupado = false;
    async function protege(boton, textoOcupado, accion) {
      if (ocupado) return;
      ocupado = true;
      const original = boton.textContent;
      boton.disabled = true;
      boton.textContent = textoOcupado;
      try { await accion(); }
      catch (e) { estadoGuardado.textContent = e?.message || 'No se ha podido completar la operación.'; }
      finally { ocupado = false; boton.disabled = false; boton.textContent = original; }
    }

    /* Oferta de migración (paso 31): si hay carteras en el navegador, ofrecer
       subirlas a la cuenta. Solo con un botón; nada se mueve en silencio. */
    function pintaOfertaMigracion() {
      const migrables = carterasLocalesParaNube(leeGuardadas());
      if (!migrables.length || ofertaMigracionDescartada) { oferta.hidden = true; oferta.textContent = ''; return; }
      oferta.hidden = false;
      oferta.textContent = '';
      const n = migrables.length;
      oferta.append(el('p', {}, `Tienes ${n} cartera${n === 1 ? '' : 's'} guardada${n === 1 ? '' : 's'} en este navegador. `
        + 'Puedes subirlas a tu cuenta para verlas desde cualquier sitio; se suben solo los activos y sus pesos, como el resto.'));
      const botones = el('div', { class: 'nv-cons__migracion-botones' });
      const subir = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Subir a mi cuenta');
      const ahoraNo = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Ahora no');
      subir.addEventListener('click', () => protege(subir, 'Subiendo…', migra));
      ahoraNo.addEventListener('click', () => { ofertaMigracionDescartada = true; pintaOfertaMigracion(); estadoGuardado.textContent = 'Tus carteras siguen guardadas en este navegador.'; });
      botones.append(subir, ahoraNo);
      oferta.append(botones);
    }

    async function migra() {
      const pendientes = carterasLocalesParaNube(leeGuardadas());
      const subidas = [];
      try {
        for (const { nombre, carga } of pendientes) {
          await datos.guardaCarteraNube(carga);
          subidas.push(nombre);
        }
      } catch (e) {
        escribeGuardadas(leeGuardadas().filter((c) => !subidas.includes(c.nombre)));
        await pinta();
        pintaOfertaMigracion();
        estadoGuardado.textContent = `Se subieron ${subidas.length}; el resto sigue en el navegador (${e?.message || 'error de red'}).`;
        return;
      }
      escribeGuardadas(leeGuardadas().filter((c) => !subidas.includes(c.nombre)));
      await pinta();
      pintaOfertaMigracion();
      estadoGuardado.textContent = subidas.length === 1
        ? 'Subida 1 cartera a tu cuenta. Ya no está solo en este navegador.'
        : `Subidas ${subidas.length} carteras a tu cuenta. Ya no están solo en este navegador.`;
    }

    async function abre(cartera) {
      const ids = [...new Set((cartera.positions || []).map((p) => p.asset_id))].slice(0, limiteActual());
      const fichas = await Promise.all(ids.map((id) => datos.detalleActivo(id).catch(() => null)));
      const detalles = {};
      fichas.forEach((f, i) => {
        if (f) detalles[ids[i]] = {
          display_name: f.identity?.display_name,
          instrument_type: f.instrument_type,
          economic_asset_class: f.economic_asset_class,
        };
      });
      cargaPosiciones(posicionesDesdeNube(cartera.positions, detalles, limiteActual()),
        `Cartera «${cartera.name}» cargada desde tu cuenta.`, estadoGuardado);
    }

    async function pinta() {
      listaGuardadas.textContent = '';
      estadoGuardado.textContent = 'Cargando tus carteras…';
      let carteras = [];
      try { carteras = await datos.listaCarterasNube(); }
      catch (e) { estadoGuardado.textContent = e?.message || 'No se han podido cargar tus carteras.'; return; }
      estadoGuardado.textContent = carteras.length ? '' : 'Aún no has guardado ninguna cartera en tu cuenta.';
      for (const cartera of carteras) {
        const n = (cartera.positions || []).length;
        const item = el('li', { class: 'nv-cons__guardada' });
        item.append(
          el('span', { class: 'nv-cons__guardada-nombre' }, cartera.name),
          el('span', { class: 'nv-cons__guardada-detalle' }, `${n} ${n === 1 ? 'posición' : 'posiciones'}`),
        );
        const cargar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__guardada-boton' }, 'Cargar');
        cargar.addEventListener('click', () => protege(cargar, 'Abriendo…', () => abre(cartera)));
        const borrar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cons__guardada-boton' }, 'Borrar');
        borrar.addEventListener('click', () => protege(borrar, 'Borrando…', async () => {
          await datos.borraCarteraNube(cartera.portfolio_id);
          await pinta();
          estadoGuardado.textContent = `Cartera «${cartera.name}» borrada de tu cuenta.`;
        }));
        item.append(cargar, borrar);
        listaGuardadas.append(item);
      }
      pintaOfertaMigracion();
    }

    botonGuardar.addEventListener('click', () => protege(botonGuardar, 'Guardando…', async () => {
      if (!posiciones.some((p) => p.activo?.asset_id && Number.isFinite(p.bruto) && p.bruto > 0)) {
        estadoGuardado.textContent = 'No hay nada que guardar todavía: añade algún activo primero.';
        return;
      }
      const carga = carteraNubeParaGuardar(inputNombre.value, posiciones);
      await datos.guardaCarteraNube(carga);
      inputNombre.value = '';
      await pinta();
      estadoGuardado.textContent = `Cartera guardada en tu cuenta como «${carga.name}».`;
    }));

    pinta();
  }

  function pintaGuardado() {
    if (esRegistrada()) pintaGuardadoNube();
    else pintaGuardadoLocal();
  }

  document.addEventListener('nuvia:sesion-cambiada', () => {
    pintaGuardado();
    recalcula(); // el análisis ampliado (paso 32) aparece o se cierra con la sesión
  });
  pintaGuardado();

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
    const limite = limiteActual();
    contador.textContent = posiciones.length ? textoContador(posiciones.length, limite) : '';
    nivel.hidden = posiciones.length < limite;
    notaNivel.textContent = nivelActual() === 'suscriptor' ? NOTA_NIVEL_SUSCRIPTOR : NOTA_NIVEL;
    if (!posiciones.length) {
      estado.textContent = `Busca un activo arriba y elígelo para añadirlo aquí (hasta ${limite} posiciones).`;
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

    /* Análisis ampliado del nivel registrado (paso 32): se pinta en un nodo
       propio al final; si el usuario mueve un peso, este nodo se descarta con
       el resto de resultados y el render tardío cae en un nodo suelto. */
    const pintaAnalisis = () => {
      const nodo = el('div', { class: 'nv-analisis' });
      resultados.append(nodo);
      montaAnalisis(nodo, {
        posiciones, pesos, series, datos,
        registrada: esRegistrada(), nivel: nivelActual(), metricas: m,
      });
    };

    const niveles = serieCartera(series, pesos);
    const m = niveles ? metricasDesdeSerie(niveles, { periodosPorAno: DIAS_MERCADO }) : undefined;
    if (!m) {
      resultados.append(el('p', { class: 'nv-cons__nota' }, 'No hay historial común suficiente para calcular las métricas de esta combinación.'));
      pintaAnalisis();
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

    const evolucion = grupoEvolucion({ niveles, fechas: payload?.dates || null });
    if (evolucion) resultados.append(evolucion);

    const fecha = fechaCorta(payload?.coverage?.last_date);
    resultados.append(el('p', { class: 'nv-cons__fuente' },
      `Datos de cierre${fecha ? ` del ${fecha}` : ''}, base de datos NUVIA. Ventana de 3 años, en euros. ${m.observaciones} observaciones.`));
    pintaAnalisis();
  }

  document.addEventListener('nuvia:activo-elegido', (evento) => {
    const { posiciones: nuevas, motivo } = agregaPosicion(posiciones, evento.detail, limiteActual());
    if (motivo === 'limite') {
      estado.textContent = `La cartera ya tiene sus ${limiteActual()} posiciones. Quita alguna para probar otra combinación.`;
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

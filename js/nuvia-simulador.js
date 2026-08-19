/**
 * NUVIA — simulador de cartera por clases (nivel visitante).
 *
 * Interfaz mínima sobre js/nuvia-cartera.js: el visitante reparte pesos entre
 * las cuatro clases de activo y ve al instante la tabla de métricas y el
 * reparto. Sin datos personales, sin persistencia, sin llamadas de red.
 *
 * Lenguaje: describe, nunca prescribe (bases §5). Si falta un dato, las
 * funciones de cálculo devuelven undefined y aquí se muestra «—»; nunca se
 * inventa una cifra.
 */

import { CLASES, analizaCartera, pct, num, TASA_SIN_RIESGO } from './nuvia-cartera.js';

/** Reparto de partida: un ejemplo neutro para que la pantalla no salga vacía. */
const REPARTO_INICIAL = {
  EQUITY: 40,
  FIXED_INCOME: 40,
  MONEY_MARKET: 15,
  REAL_ASSET: 5,
};

/** Nota de fuente del simulador por clases (guía, paso 26): aquí no hay
 *  datos de mercado en vivo; la fuente son los supuestos publicados. */
export const FUENTE_SIMULADOR = 'Fuente: supuestos propios de NUVIA — la tabla '
  + '«Los supuestos, a la vista» de esta página. Este simulador no usa datos '
  + 'de mercado en vivo.';

/** Color de categoría por clase (tokens del sistema de diseño). */
const COLOR_CLASE = {
  EQUITY: 'var(--nv-cat-teal)',
  FIXED_INCOME: 'var(--nv-cat-purple)',
  MONEY_MARKET: 'var(--nv-cat-cyan)',
  REAL_ASSET: 'var(--nv-cat-amber)',
};

/** Normaliza un mapa de pesos brutos a fracciones que suman 1 (o null si todo es 0). */
export function normalizaPesos(brutos) {
  const total = Object.values(brutos).reduce((s, v) => s + (Number.isFinite(v) && v > 0 ? v : 0), 0);
  if (total <= 0) return null;
  const out = {};
  for (const [clase, v] of Object.entries(brutos)) {
    out[clase] = Number.isFinite(v) && v > 0 ? v / total : 0;
  }
  return out;
}

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

/**
 * Monta el simulador dentro de `raiz` y devuelve un objeto con `recalcula()`
 * (útil en pruebas). Sustituye el contenido previo de `raiz` (el aviso
 * estático para navegadores sin JavaScript).
 */
export function montaSimulador(raiz) {
  if (!raiz) return null;
  const brutos = { ...REPARTO_INICIAL };

  raiz.textContent = '';

  /* ── Controles ── */
  const controles = el('div', { class: 'nv-sim-controles' });
  const entradas = {};
  for (const clase of Object.values(CLASES)) {
    const fila = el('div', { class: 'nv-sim-fila' });
    const idInput = `sim-peso-${clase.id.toLowerCase()}`;
    const etiqueta = el('label', { class: 'nv-sim-etiqueta', for: idInput });
    const punto = el('span', { class: 'nv-sim-punto', 'aria-hidden': 'true' });
    punto.style.background = COLOR_CLASE[clase.id];
    etiqueta.append(punto, el('span', { class: 'nv-sim-nombre' }, clase.nombre));
    etiqueta.append(el('span', { class: 'nv-sim-desc' }, clase.descripcion));

    const input = el('input', {
      type: 'range', id: idInput, min: '0', max: '100', step: '5',
      value: String(brutos[clase.id]),
    });
    const salida = el('output', { for: idInput, class: 'nv-sim-valor' });
    entradas[clase.id] = { input, salida };
    input.addEventListener('input', () => {
      brutos[clase.id] = Number(input.value);
      recalcula();
    });
    fila.append(etiqueta, input, salida);
    controles.append(fila);
  }

  /* ── Reparto (barra apilada + leyenda) ── */
  const barra = el('div', { class: 'nv-sim-barra', role: 'img' });
  const segmentos = {};
  for (const clase of Object.values(CLASES)) {
    const seg = el('span', { class: 'nv-sim-seg' });
    seg.style.background = COLOR_CLASE[clase.id];
    segmentos[clase.id] = seg;
    barra.append(seg);
  }

  /* ── Tabla de métricas ── */
  const tabla = el('table', { class: 'nv-table nv-sim-tabla' });
  const caption = el('caption', { class: 'nv-visually-hidden' }, 'Métricas estimadas de la combinación elegida');
  const thead = el('thead');
  const trh = el('tr');
  trh.append(el('th', { scope: 'col' }, 'Métrica'), el('th', { scope: 'col' }, 'Valor'), el('th', { scope: 'col' }, 'Cómo leerla'));
  thead.append(trh);
  const tbody = el('tbody');
  tabla.append(caption, thead, tbody);

  const region = el('div', { class: 'nv-sim-resultados', 'aria-live': 'polite' });
  const tablaScroll = el('div', { class: 'nv-sim-tabla-scroll' });
  tablaScroll.append(tabla);
  region.append(barra, tablaScroll);
  raiz.append(controles, region, el('p', { class: 'nv-cons__fuente' }, FUENTE_SIMULADOR));

  function filaMetrica(nombre, valor, lectura) {
    const tr = el('tr');
    tr.append(el('th', { scope: 'row' }, nombre), el('td', { class: 'nv-sim-cifra' }, valor), el('td', {}, lectura));
    return tr;
  }

  function recalcula() {
    const pesos = normalizaPesos(brutos);

    for (const clase of Object.values(CLASES)) {
      const peso = pesos ? pesos[clase.id] : 0;
      entradas[clase.id].salida.value = pct(peso, 0);
      const seg = segmentos[clase.id];
      seg.style.width = `${(peso * 100).toFixed(2)}%`;
      seg.title = `${clase.nombre}: ${pct(peso, 0)}`;
    }
    barra.setAttribute('aria-label', pesos
      ? `Reparto: ${Object.values(CLASES).map((c) => `${c.nombre} ${pct(pesos[c.id], 0)}`).join(', ')}`
      : 'Sin reparto: todos los pesos están a cero');

    tbody.textContent = '';
    if (!pesos) {
      const tr = el('tr');
      const td = el('td', { colspan: '3' }, 'Todos los pesos están a cero. Mueve algún control para ver las métricas.');
      tr.append(td);
      tbody.append(tr);
      return;
    }

    const posiciones = Object.entries(pesos)
      .filter(([, w]) => w > 0)
      .map(([clase, peso]) => ({ clase, peso }));
    const r = analizaCartera(posiciones);

    tbody.append(
      filaMetrica('Rentabilidad media anual estimada', pct(r.rentabilidad),
        'Con los supuestos de la tabla de esta página. Es una estimación de largo plazo, no una previsión.'),
      filaMetrica('Volatilidad anual estimada', pct(r.volatilidad),
        r.volatilidad != null
          ? `En un año normal, el valor de esta combinación puede moverse arriba o abajo en torno a un ${pct(r.volatilidad)}.`
          : 'No hay datos suficientes para estimarla.'),
      filaMetrica('Volatilidad sin diversificar', pct(r.volatilidadSinDiversificar),
        'La que tendría la combinación si todas las clases se movieran siempre a la vez.'),
      filaMetrica('Efecto de la diversificación', r.ahorroPorDiversificar != null ? pct(r.ahorroPorDiversificar) : '—',
        'Diferencia entre las dos volatilidades: lo que aporta combinar clases que no se mueven igual.'),
      filaMetrica('Ratio de Sharpe', num(r.sharpe),
        `Rentabilidad estimada por encima de la tasa sin riesgo (${pct(TASA_SIN_RIESGO)}) por cada unidad de volatilidad.`),
    );
  }

  recalcula();
  return { recalcula, normalizaPesos };
}

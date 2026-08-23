/**
 * NUVIA — distribución geográfica con mapa (paso 42, Fase 6).
 *
 * El mapa de continentes del laboratorio clásico, reconstruido en el nuevo
 * con datos reales: las filas de `concentracionGeografica` (peso de cartera
 * × exposición a renta variable × distribución del activo) se agregan por
 * continente y colorean las siluetas de siempre. La cifra va SIEMPRE al
 * lado del color —la información no depende solo del tono— y una región
 * que no casa con ningún continente se declara tal cual, nunca se pierde
 * en silencio.
 */

import { VIEWBOX_MAPA, SILUETAS } from './nuvia-mapa-siluetas.js';
import { num } from './nuvia-cartera.js';
import { etiquetaRegion } from './nuvia-etiquetas.js';

export const NOTA_MAPA = 'Cada continente lleva su color cuando hay exposición allí; '
  + 'los que están a cero quedan en gris. La cifra sobre el mapa permite comparar '
  + 'el peso: describe dónde está hoy la renta variable, nada más.';

/** Región de la concentración → continente del mapa. Incluye tanto las
 *  claves de la distribución estimada como las que sirven los desgloses
 *  reales de la base (p. ej. «iberia» o «middle_east», vistas en
 *  producción). Una clave que no esté aquí —como «other»— no se pinta:
 *  se declara «fuera del mapa», nunca se adivina. */
export const REGIONES_CONTINENTE = {
  united_states: 'america',
  canada: 'america',
  latin_america: 'america',
  north_america: 'america',
  eurozone: 'europa',
  europe_ex_euro: 'europa',
  united_kingdom: 'europa',
  europe: 'europa',
  developed_europe: 'europa',
  emerging_europe: 'europa',
  europe_emerging: 'europa',
  iberia: 'europa',
  spain: 'europa',
  portugal: 'europa',
  nordics: 'europa',
  switzerland: 'europa',
  africa_middle_east: 'africa',
  middle_east: 'africa',
  africa: 'africa',
  japan: 'asia',
  asia_developed: 'asia',
  asia_emerging: 'asia',
  asia: 'asia',
  china: 'asia',
  india: 'asia',
  oceania: 'oceania',
  australia: 'oceania',
};

export const ETIQUETAS_CONTINENTE = {
  america: 'América',
  europa: 'Europa',
  africa: 'África y O. Medio',
  asia: 'Asia',
  oceania: 'Oceanía',
};

const CONTINENTES = ['america', 'europa', 'africa', 'asia', 'oceania'];

/* Posición de las cifras sobre las siluetas originales del laboratorio B.
 * Son porcentajes del mismo dibujo y, por tanto, escalan con él. */
const POSICION_CIFRA = {
  america: ['20%', '33%'],
  europa: ['55%', '33.5%'],
  africa: ['50.4%', '57%'],
  asia: ['78.8%', '33.8%'],
  oceania: ['87.1%', '80%'],
};

/**
 * Agrega las filas de la concentración geográfica por continente.
 * Devuelve { pesos: {america,…}, sinContinente: [{clave, peso}] } o null
 * si no hay filas: sin dato no hay mapa, nada se inventa.
 */
export function exposicionPorContinente(filas) {
  if (!Array.isArray(filas) || !filas.length) return null;
  const pesos = Object.fromEntries(CONTINENTES.map((c) => [c, 0]));
  const sinContinente = [];
  for (const fila of filas) {
    const continente = REGIONES_CONTINENTE[String(fila.clave || '').toLowerCase()];
    if (continente) pesos[continente] += fila.peso || 0;
    else sinContinente.push(fila);
  }
  if (CONTINENTES.every((c) => pesos[c] <= 0) && !sinContinente.length) return null;
  return { pesos, sinContinente };
}

/** Tramo de color (0–4) para un peso en %: la escala del sistema. */
export function tramoDeColor(peso) {
  if (!(peso > 0)) return 0;
  if (peso < 10) return 1;
  if (peso < 25) return 2;
  if (peso < 50) return 3;
  return 4;
}

function el(tag, attrs = {}, texto) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (texto != null) e.textContent = texto;
  return e;
}

/**
 * El grupo del mapa: siluetas coloreadas + leyenda con la cifra de cada
 * continente. Recibe el resultado de `concentracionGeografica`.
 */
export function grupoMapa(reparto) {
  const agregado = exposicionPorContinente(reparto?.filas);
  if (!agregado) return null;

  const bloque = el('div', { class: 'nv-mapa nv-analisis__grupo' });
  bloque.append(el('h4', { class: 'nv-analisis__titulo' }, 'El mismo reparto, sobre el mapa'));
  bloque.append(el('p', { class: 'nv-analisis__lectura' }, NOTA_MAPA));

  const fuera = agregado.sinContinente.reduce((s, f) => s + f.peso, 0);
  if (fuera > 0) bloque.append(el('p', { class: 'nv-mapa__fuera' },
    `${num(fuera, 1)} % no aparece en el mapa porque la región no tiene un continente asignado.`));

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', VIEWBOX_MAPA);
  svg.setAttribute('class', 'nv-mapa__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mapa de continentes coloreado por exposición: '
    + CONTINENTES.map((c) => `${ETIQUETAS_CONTINENTE[c]} ${num(agregado.pesos[c], 1)} %`).join(', ') + '.');
  /* Cada continente con su propio color (encargo de Óscar, 21-08); la
     intensidad del tono sigue diciendo el peso. */
  for (const c of CONTINENTES) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', SILUETAS[c]);
    path.setAttribute('class', `nv-mapa__zona nv-mapa__zona--${c} nv-mapa__zona--n${tramoDeColor(agregado.pesos[c])}`);
    svg.append(path);
  }
  const dibujo = el('div', { class: 'nv-mapa__dibujo' });
  dibujo.append(svg);
  for (const c of CONTINENTES) {
    const [left, top] = POSICION_CIFRA[c];
    const cifra = el('span', {
      class: `nv-mapa__cifra${agregado.pesos[c] > 0 ? '' : ' nv-mapa__cifra--cero'}`,
      'aria-hidden': 'true',
    }, `${num(agregado.pesos[c], 1)} %`);
    cifra.style.left = left;
    cifra.style.top = top;
    dibujo.append(cifra);
  }
  bloque.append(dibujo);

  const leyenda = el('ul', { class: 'nv-mapa__leyenda' });
  for (const c of CONTINENTES) {
    const item = el('li', { class: 'nv-mapa__leyenda-item' });
    const punto = el('span', {
      class: `nv-mapa__punto nv-mapa__zona--${c} nv-mapa__zona--n${tramoDeColor(agregado.pesos[c])}`,
      'aria-hidden': 'true',
    });
    const cifra = agregado.pesos[c] > 0 ? `${num(agregado.pesos[c], 1)} %` : 'sin exposición';
    item.append(
      punto,
      el('span', { class: 'nv-mapa__nombre' }, ETIQUETAS_CONTINENTE[c]),
      el('strong', { class: 'nv-mapa__peso' }, cifra),
    );
    leyenda.append(item);
  }
  if (fuera > 0) {
    const item = el('li', { class: 'nv-mapa__leyenda-item' });
    item.append(
      el('span', { class: 'nv-mapa__punto nv-mapa__punto--fuera', 'aria-hidden': 'true' }),
      el('span', { class: 'nv-mapa__nombre' }, 'Fuera del mapa'),
      el('strong', { class: 'nv-mapa__peso' }, `${num(fuera, 1)} %`),
    );
    leyenda.append(item);
  }
  bloque.append(leyenda);

  if (agregado.sinContinente.length) bloque.append(el('p', { class: 'nv-cons__nota' },
    `Regiones fuera del dibujo: ${agregado.sinContinente
      .map((f) => `${etiquetaRegion(f.clave)} (${num(f.peso, 1)} %)`).join(', ')}.`));

  const lectura = el('p', { class: 'nv-analisis__conclusion' });
  lectura.append(
    el('strong', {}, 'El color dice dónde; la cifra dice cuánto.'),
    document.createTextNode(' El tamaño de un continente no representa su peso en la cartera.'),
  );
  bloque.append(lectura);
  return bloque;
}

/**
 * NUVIA — buscador de activos del laboratorio (paso 19).
 *
 * Campo único que busca por nombre, ticker o ISIN sobre el catálogo de la
 * base maestra (js/nuvia-datos.js → search_assets). Al elegir un resultado se
 * emite el evento `nuvia:activo-elegido` con el activo en `detail`; el
 * constructor de cartera (paso 20) escucha ese evento.
 *
 * Lenguaje: describe, nunca prescribe. Un error de red se dice tal cual;
 * nunca se muestran datos inventados.
 */

import { maestra, etiquetaTipo } from './nuvia-datos.js';

const RETARDO_MS = 300;
const MINIMO_CARACTERES = 2;

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaBuscador(raiz, { cliente = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();

  raiz.textContent = '';

  const campo = el('div', { class: 'nv-field nv-buscador__campo' });
  const etiqueta = el('label', { for: 'buscador-activos' }, 'Nombre, ticker o ISIN');
  const caja = el('div', { class: 'nv-field__box' });
  const entrada = el('input', {
    id: 'buscador-activos',
    type: 'search',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: 'Por ejemplo: telefonica, TEF o ES0178430E18',
    'aria-describedby': 'buscador-estado',
  });
  caja.append(entrada);
  campo.append(etiqueta, caja);

  const estado = el('p', { id: 'buscador-estado', class: 'nv-buscador__estado', role: 'status' });
  const lista = el('ul', { class: 'nv-buscador__resultados' });

  raiz.append(campo, estado, lista);

  let temporizador = null;
  let generacion = 0;

  function pinta(activos, consulta) {
    lista.textContent = '';
    if (!activos.length) {
      estado.textContent = `Sin resultados para «${consulta}» en el catálogo.`;
      return;
    }
    estado.textContent = activos.length === 1
      ? '1 resultado.'
      : `${activos.length} resultados.`;
    for (const activo of activos) {
      const item = el('li');
      const boton = el('button', { type: 'button', class: 'nv-buscador__resultado' });
      const nombre = el('span', { class: 'nv-buscador__nombre' }, activo.display_name || activo.asset_id);
      const detalle = el('span', { class: 'nv-buscador__detalle' },
        [activo.ticker, activo.isin, activo.currency].filter(Boolean).join(' · '));
      const tipo = el('span', { class: 'nv-tag nv-buscador__tipo' }, etiquetaTipo(activo.instrument_type));
      boton.append(nombre, detalle, tipo);
      boton.addEventListener('click', () => {
        raiz.dispatchEvent(new CustomEvent('nuvia:activo-elegido', { detail: activo, bubbles: true }));
      });
      item.append(boton);
      lista.append(item);
    }
  }

  async function busca() {
    const consulta = entrada.value.trim();
    if (consulta.length < MINIMO_CARACTERES) {
      lista.textContent = '';
      estado.textContent = '';
      return;
    }
    const mia = ++generacion;
    estado.textContent = 'Buscando…';
    try {
      const { activos } = await datos.buscaActivos(consulta);
      if (mia !== generacion) return; // llegó tarde: hay una búsqueda más nueva
      pinta(activos, consulta);
    } catch {
      if (mia !== generacion) return;
      lista.textContent = '';
      estado.textContent = 'No se ha podido consultar el catálogo. Prueba de nuevo en unos segundos.';
    }
  }

  entrada.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(busca, RETARDO_MS);
  });
  entrada.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      clearTimeout(temporizador);
      busca();
    }
  });

  return { busca };
}

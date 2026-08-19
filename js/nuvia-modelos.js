/**
 * NUVIA — carteras modelo temáticas (paso 38, Fase 5).
 *
 * Publicadas para cualquiera que abra la página, sin cuenta: cada una es una
 * composición FIJA de activos reales del catálogo, con su criterio de
 * construcción declarado y su fecha. Son la misma para cualquiera que la
 * mire y no se presentan como idóneas para nadie: son una publicación,
 * no es una propuesta.
 *
 * Por decisión de las bases (paso 38): **no hay botón que las copie a la
 * cartera del usuario ni enlace para contratarla** — eso cerraría el círculo
 * hacia la recomendación. Las métricas que se enseñan salen del historial
 * real de 3 años de la base de datos NUVIA, calculadas al abrirlas, igual
 * que en el constructor.
 */

import { maestra } from './nuvia-datos.js';
import { metricasDesdeSerie, pct, DIAS_MERCADO } from './nuvia-cartera.js';
import { pesosNormalizados, serieCartera, fechaCorta } from './nuvia-constructor.js';

/** Nota fija del bloque: qué es esto y qué no es. */
export const NOTA_MODELOS = 'Cada cartera modelo es una composición fija: '
  + 'la misma para cualquiera que la mire, con su criterio y su fecha '
  + 'declarados, y con los pesos a partes iguales. No es una propuesta ni '
  + 'dice nada de ningún lector: por eso no hay botón que la copie a tu '
  + 'cartera ni enlace para contratarla. Sus métricas salen del historial '
  + 'real de la base de datos NUVIA, calculadas al abrirlas.';

/**
 * Las carteras modelo. Composición fijada por criterio propio del portal
 * (bases §1) el 19-08-2026, con activos que existen en el catálogo y pesos
 * a partes iguales — una regla única para todas, sin ajustes por tema.
 */
export const CARTERAS_MODELO = [
  {
    clave: 'bolsa-mundial-indexada',
    nombre: 'Bolsa mundial indexada',
    tema: 'Fondos y ETF que replican índices de bolsa mundial y de EE. UU., '
      + 'sin gestor que elija valores.',
    criterio: 'Cuatro productos indexados de bolsa global presentes en el '
      + 'catálogo, fijados el 19-08-2026 por criterio propio del portal, '
      + 'a partes iguales.',
    posiciones: [
      { asset_id: 'IE00B4L5Y983', nombre: 'iShares Core MSCI World UCITS ETF USD (Acc)', peso: 25 },
      { asset_id: 'IE00B03HD191', nombre: 'Vanguard Global Stock Index Fund EUR Acc', peso: 25 },
      { asset_id: 'IE00B3XXRP09', nombre: 'Vanguard S&P 500 UCITS ETF', peso: 25 },
      { asset_id: 'IE00BYX5NX33', nombre: 'Fidelity MSCI World Index Fund EUR P Acc', peso: 25 },
    ],
  },
  {
    clave: 'grandes-cotizadas-espanolas',
    nombre: 'Grandes cotizadas españolas',
    tema: 'Cinco cotizadas españolas de gran capitalización, de sectores '
      + 'distintos entre sí (energía, textil, banca y telecomunicaciones).',
    criterio: 'Cinco cotizadas españolas de gran capitalización presentes en '
      + 'el catálogo, fijadas el 19-08-2026 por criterio propio del portal, '
      + 'a partes iguales.',
    posiciones: [
      { asset_id: 'ES0144580Y14', nombre: 'Iberdrola S.A.', peso: 20 },
      { asset_id: 'ES0148396007', nombre: 'Industria de Diseño Textil S.A. (Inditex)', peso: 20 },
      { asset_id: 'ES0113900J37', nombre: 'Banco Santander S.A.', peso: 20 },
      { asset_id: 'ES0113211835', nombre: 'Banco Bilbao Vizcaya Argentaria S.A.', peso: 20 },
      { asset_id: 'ES0178430E18', nombre: 'Telefónica S.A.', peso: 20 },
    ],
  },
  {
    clave: 'value-gestoras-independientes',
    nombre: 'Value de gestoras independientes',
    tema: 'Fondos de gestoras independientes españolas que invierten por '
      + 'análisis fundamental, en España y fuera.',
    criterio: 'Cuatro fondos de gestoras independientes españolas presentes '
      + 'en el catálogo, fijados el 19-08-2026 por criterio propio del '
      + 'portal, a partes iguales.',
    posiciones: [
      { asset_id: 'LU0563745743', nombre: 'Bestinver Tordesillas SICAV Iberia A', peso: 25 },
      { asset_id: 'LU1372006947', nombre: 'Cobas Selection Fund P Acc EUR', peso: 25 },
      { asset_id: 'LU1333148903', nombre: 'Azvalor International R', peso: 25 },
      { asset_id: 'LU1330191542', nombre: 'Magallanes European Equity R EUR', peso: 25 },
    ],
  },
  {
    clave: 'mitad-bolsa-mitad-bonos',
    nombre: 'Mitad bolsa mundial, mitad bonos en euros',
    tema: 'La mitad en bolsa mundial indexada y la otra mitad en fondos de '
      + 'bonos corporativos en euros.',
    criterio: 'Dos productos de bolsa mundial y dos fondos de bonos '
      + 'corporativos en euros presentes en el catálogo, fijados el '
      + '19-08-2026 por criterio propio del portal, a partes iguales.',
    posiciones: [
      { asset_id: 'IE00B4L5Y983', nombre: 'iShares Core MSCI World UCITS ETF USD (Acc)', peso: 25 },
      { asset_id: 'IE00B03HD191', nombre: 'Vanguard Global Stock Index Fund EUR Acc', peso: 25 },
      { asset_id: 'LU0113257694', nombre: 'Schroder ISF EURO Corporate Bond A Acc', peso: 25 },
      { asset_id: 'LU0132601682', nombre: 'Morgan Stanley Euro Corporate Bond Fund A', peso: 25 },
    ],
  },
];

/* ── Helpers puros (probados en docs/nuvia-modelos.test.mjs) ── */

/** Comprobación de forma de una cartera modelo: la regla única de todas. */
export function validaModelo(modelo) {
  const problemas = [];
  if (!modelo?.nombre) problemas.push('sin nombre');
  if (!modelo?.tema) problemas.push('sin tema');
  if (!/19-08-2026/.test(modelo?.criterio || '')) problemas.push('criterio sin fecha de fijación');
  if (!/criterio propio/.test(modelo?.criterio || '')) problemas.push('criterio sin declarar');
  const posiciones = modelo?.posiciones || [];
  if (posiciones.length < 3) problemas.push('menos de 3 posiciones');
  const suma = posiciones.reduce((s, p) => s + (Number(p.peso) || 0), 0);
  if (Math.abs(suma - 100) > 1e-9) problemas.push(`los pesos suman ${suma}, no 100`);
  const primero = posiciones[0]?.peso;
  if (!posiciones.every((p) => p.peso === primero)) problemas.push('los pesos no van a partes iguales');
  if (new Set(posiciones.map((p) => p.asset_id)).size !== posiciones.length) problemas.push('activos repetidos');
  return problemas;
}

/** Posiciones de un modelo en el formato del motor del constructor. */
export function posicionesDeModelo(modelo) {
  return (modelo?.posiciones || []).map((p) => ({
    activo: { asset_id: p.asset_id, display_name: p.nombre },
    bruto: p.peso,
  }));
}

/* ── Montaje ── */

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaModelos(raiz, { cliente = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();
  raiz.textContent = '';

  raiz.append(el('p', { class: 'nv-modelos__nota' }, NOTA_MODELOS));
  const lista = el('div', { class: 'nv-modelos__lista' });
  raiz.append(lista);

  const cacheSeries = new Map();
  function seriesDe(ids) {
    const clave = [...ids].sort().join('|');
    if (!cacheSeries.has(clave)) {
      const promesa = datos.llama('get_price_series', { asset_ids: ids, frequency: 'DAILY', window: '3Y' });
      promesa.catch(() => cacheSeries.delete(clave));
      cacheSeries.set(clave, promesa);
    }
    return cacheSeries.get(clave);
  }

  for (const modelo of CARTERAS_MODELO) {
    const tarjeta = el('article', { class: 'nv-card nv-modelos__tarjeta' });
    tarjeta.append(el('h3', { class: 'nv-modelos__nombre' }, modelo.nombre));
    tarjeta.append(el('p', { class: 'nv-modelos__tema' }, modelo.tema));
    tarjeta.append(el('p', { class: 'nv-modelos__criterio' }, modelo.criterio));

    const composicion = el('ul', { class: 'nv-modelos__composicion' });
    for (const p of modelo.posiciones) {
      composicion.append(el('li', {}, `${p.nombre} — ${p.peso} %`));
    }
    tarjeta.append(composicion);

    const boton = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Ver sus métricas (historial real)');
    const zona = el('div', { class: 'nv-modelos__metricas' });
    boton.addEventListener('click', async () => {
      boton.disabled = true;
      zona.textContent = 'Consultando el historial…';
      try {
        const ids = modelo.posiciones.map((p) => p.asset_id);
        const payload = await seriesDe(ids);
        const series = payload?.series || [];
        const idsConSerie = series.map((s) => s.asset_id);
        const posiciones = posicionesDeModelo(modelo);
        const pesos = pesosNormalizados(posiciones, idsConSerie);
        const excluidos = posiciones.filter((p) => !idsConSerie.includes(p.activo.asset_id));
        const niveles = pesos ? serieCartera(series, pesos) : null;
        const m = niveles ? metricasDesdeSerie(niveles, { periodosPorAno: DIAS_MERCADO }) : undefined;
        zona.textContent = '';
        if (!m) {
          zona.append(el('p', { class: 'nv-cons__nota' },
            'No hay historial común suficiente en la base para calcular las métricas de esta composición.'));
        } else {
          const tabla = el('table', { class: 'nv-table nv-modelos__tabla' });
          tabla.append(el('caption', { class: 'nv-visually-hidden' }, `Métricas históricas de «${modelo.nombre}»`));
          const tbody = el('tbody');
          const filaM = (nombre, valor) => {
            const tr = el('tr');
            tr.append(el('th', { scope: 'row' }, nombre), el('td', { class: 'nv-sim-cifra' }, valor));
            return tr;
          };
          tbody.append(
            filaM('Rentabilidad (3 años)', pct(m.rentabilidadTotal)),
            filaM('Volatilidad (3 años)', pct(m.volatilidad)),
            filaM('Máxima caída (3 años)', pct(m.maximaCaida)),
          );
          tabla.append(tbody);
          zona.append(tabla);
          if (excluidos.length) {
            zona.append(el('p', { class: 'nv-cons__nota' },
              `Sin historial suficiente en la base: ${excluidos.map((p) => p.activo.display_name).join(', ')}. No entra en el cálculo.`));
          }
          const fecha = fechaCorta(payload?.coverage?.last_date);
          zona.append(el('p', { class: 'nv-cons__fuente' },
            `Datos de cierre${fecha ? ` del ${fecha}` : ''}, base de datos NUVIA. Ventana de 3 años, en euros. ${m.observaciones} observaciones.`));
        }
      } catch {
        zona.textContent = 'No se ha podido consultar el historial. Prueba de nuevo en unos segundos.';
      } finally {
        boton.disabled = false;
      }
    });
    tarjeta.append(boton, zona);
    lista.append(tarjeta);
  }

  return { cuantas: () => CARTERAS_MODELO.length };
}

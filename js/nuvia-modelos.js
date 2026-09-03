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

/** Nota fija del bloque: qué es esto y qué no es. */
export const NOTA_MODELOS = 'Cada cartera modelo es una composición fija: '
  + 'la misma para cualquiera que la mire, con su criterio y su fecha '
  + 'declarados, y con los pesos a partes iguales. No es una propuesta ni '
  + 'dice nada de ningún lector: por eso no hay botón que la copie a tu '
  + 'cartera ni enlace para contratarla. Se conservan las composiciones originales; '
  + 'las referencias al catálogo en sus criterios corresponden a la fecha de fijación. '
  + 'La disponibilidad actual en la alfa se comprueba por separado. '
  + 'Al seleccionarla se abre el mismo '
  + 'análisis que en «Mi cartera», con el historial real de 3 años de la '
  + 'base de datos NUVIA. Si a alguna posición le falta historial, se dice cuál y queda fuera del cálculo.';

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
export function posicionesDeModelo(modelo, detalles = {}) {
  return (modelo?.posiciones || []).map((p) => ({
    activo: {
      asset_id: p.asset_id,
      display_name: detalles[p.asset_id]?.display_name || p.nombre,
      instrument_type: detalles[p.asset_id]?.instrument_type,
      economic_asset_class: detalles[p.asset_id]?.economic_asset_class,
    },
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

export function disponibilidadModelo(modelo, presentes) {
  const posiciones = modelo.posiciones;
  const faltan = posiciones.filter((p) => presentes?.[p.asset_id] === false);
  const conocidas = posiciones.filter((p) => typeof presentes?.[p.asset_id] === 'boolean').length;
  return {
    completa: posiciones.length > 0 && conocidas === posiciones.length && faltan.length === 0,
    verificada: conocidas === posiciones.length,
    disponibles: posiciones.filter((p) => presentes?.[p.asset_id] === true).length,
    total: posiciones.length, faltan,
  };
}

export function montaModelos(raiz, { cliente = null, alSeleccionar = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();
  raiz.textContent = '';
  raiz.append(el('p', { class: 'nv-modelos__nota' }, NOTA_MODELOS));
  const lista = el('div', { class: 'nv-modelos__lista' });
  const estado = el('p', { class: 'nv-modelos__estado', role: 'status' });
  const reintentar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-modelos__reintentar' }, 'Volver a comprobar disponibilidad');
  raiz.append(lista, estado, reintentar);

  let seleccionada = null;
  let seleccionando = null;
  let comprobando = false;
  let tarea = null;
  const botones = new Map();
  const tarjetas = new Map();
  const notas = new Map();
  const disponibilidad = new Map();
  const ids = [...new Set(CARTERAS_MODELO.flatMap((m) => m.posiciones.map((p) => p.asset_id)))];

  function pintaBotones() {
    for (const [clave, boton] of botones) {
      const d = disponibilidad.get(clave);
      // 03-09-2026, orden del fundador: no se bloquea nada sin consultarle. Solo se
      // apaga el boton cuando CONSTA que faltan instrumentos del universo (decision
      // suya del 02-09). Mientras se comprueba, o si la comprobacion falla, el
      // analisis sigue disponible.
      const faltanInstrumentos = d?.verificada === true && d.completa === false;
      boton.disabled = seleccionando !== null || faltanInstrumentos;
      boton.textContent = seleccionando === clave ? 'Preparando el análisis…'
        : faltanInstrumentos ? 'No disponible en la alfa'
          : seleccionada === clave ? 'Cartera seleccionada' : 'Analizar esta cartera';
      tarjetas.get(clave).classList.toggle('nv-modelos__tarjeta--activa', seleccionada === clave && !faltanInstrumentos);
    }
    reintentar.disabled = comprobando || seleccionando !== null;
  }

  function actualizaDisponibilidad() {
    if (tarea) return tarea;
    comprobando = true;
    pintaBotones();
    estado.textContent = 'Comprobando la disponibilidad de las cuatro composiciones…';
    tarea = (async () => {
      try {
        if (typeof datos.enCatalogo !== 'function') throw new Error('Sin comprobador de catálogo');
        const presentes = await datos.enCatalogo(ids, { refrescar: true });
        for (const modelo of CARTERAS_MODELO) {
          const d = disponibilidadModelo(modelo, presentes);
          disponibilidad.set(modelo.clave, d);
          notas.get(modelo.clave).textContent = !d.verificada
            ? 'No se han podido comprobar todos los instrumentos de esta composición. Puedes abrir el análisis igualmente; lo que falte se dirá.'
            : d.disponibles + ' de ' + d.total + ' instrumentos disponibles en el catálogo. '
              + (d.completa ? 'El historial se comprobará al abrir el análisis.'
                : 'Faltan: ' + d.faltan.map((p) => p.nombre + ' (' + p.asset_id + ')').join('; ') + '. No se sustituyen instrumentos.');
        }
        const verificadas = [...disponibilidad.values()].every((d) => d.verificada);
        const completas = [...disponibilidad.values()].filter((d) => d.completa).length;
        estado.textContent = verificadas
          ? completas + ' de ' + CARTERAS_MODELO.length + ' composiciones con todos sus instrumentos en el catálogo. Se conservan los pesos originales.'
          : 'No se ha podido comprobar el catálogo completo. El análisis sigue disponible; puedes volver a comprobarlo.';
        const dSel = seleccionada ? disponibilidad.get(seleccionada) : null;
        if (dSel && dSel.verificada === true && dSel.completa === false) {
          seleccionada = null;
          estado.textContent += ' La disponibilidad ha cambiado; el análisis que ya estaba abierto no se ha actualizado.';
        }
      } catch {
        for (const modelo of CARTERAS_MODELO) {
          disponibilidad.set(modelo.clave, disponibilidadModelo(modelo, null));
          notas.get(modelo.clave).textContent = 'Disponibilidad sin verificar. El análisis sigue disponible; lo que falte se dirá al abrirlo.';
        }
        estado.textContent = 'No se ha podido comprobar el catálogo. El análisis sigue disponible; puedes volver a comprobarlo.';
      } finally {
        comprobando = false;
        pintaBotones();
      }
    })();
    tarea.then(() => { tarea = null; }, () => { tarea = null; });
    return tarea;
  }

  for (const modelo of CARTERAS_MODELO) {
    const tarjeta = el('article', { class: 'nv-card nv-modelos__tarjeta' });
    tarjeta.append(el('h3', { class: 'nv-modelos__nombre' }, modelo.nombre));
    tarjeta.append(el('p', { class: 'nv-modelos__tema' }, modelo.tema));
    tarjeta.append(el('p', { class: 'nv-modelos__criterio' }, modelo.criterio));
    const composicion = el('ul', { class: 'nv-modelos__composicion' });
    for (const p of modelo.posiciones) composicion.append(el('li', {}, p.nombre + ' — ' + p.peso + ' %'));
    tarjeta.append(composicion);
    const notaId = 'disponibilidad-' + modelo.clave;
    const nota = el('p', { id: notaId, class: 'nv-modelos__nota nv-modelos__no-disponible' }, 'Comprobando disponibilidad…');
    const boton = el('button', { type: 'button', class: 'nv-btn nv-btn--soft', 'aria-describedby': notaId }, 'Analizar esta cartera');
    botones.set(modelo.clave, boton);
    tarjetas.set(modelo.clave, tarjeta);
    notas.set(modelo.clave, nota);
    boton.addEventListener('click', async () => {
      const previa = disponibilidad.get(modelo.clave);
      if (seleccionando !== null || (previa?.verificada === true && previa.completa === false)) return;
      seleccionando = modelo.clave;
      pintaBotones();
      try {
        await actualizaDisponibilidad();
        const ahora = disponibilidad.get(modelo.clave);
        if (ahora?.verificada === true && ahora.completa === false) return;
        const fichas = await Promise.all(modelo.posiciones.map((p) => datos.detalleActivo(p.asset_id)));
        const detalles = {};
        fichas.forEach((f, i) => {
          const id = modelo.posiciones[i].asset_id;
          if (!f || f.asset_id !== id || ![f.identity?.display_name, f.instrument_type, f.economic_asset_class]
            .every((campo) => typeof campo === 'string' && campo.trim())) {
            throw new Error('Ficha ausente, incompleta o de otro instrumento');
          }
          detalles[id] = { display_name: f.identity?.display_name, instrument_type: f.instrument_type, economic_asset_class: f.economic_asset_class };
        });
        const detalle = { modelo, posiciones: posicionesDeModelo(modelo, detalles) };
        if (typeof alSeleccionar === 'function') await alSeleccionar(detalle);
        else raiz.dispatchEvent(new CustomEvent('nuvia:modelo-elegido', { detail: detalle, bubbles: true }));
        seleccionada = modelo.clave;
      } catch {
        estado.textContent = 'No se ha podido preparar esta cartera con todas sus fichas. No se abre un análisis parcial. Prueba de nuevo en unos segundos.';
      } finally {
        seleccionando = null;
        pintaBotones();
      }
    });
    tarjeta.append(nota, boton);
    lista.append(tarjeta);
  }
  reintentar.addEventListener('click', actualizaDisponibilidad);
  const listo = actualizaDisponibilidad();
  return { cuantas: () => CARTERAS_MODELO.length, actualizar: actualizaDisponibilidad, listo };
}

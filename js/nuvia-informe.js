/**
 * NUVIA — informe genérico de compañía (paso 37, bases §5).
 *
 * Con la sesión iniciada, cualquier acción del catálogo tiene aquí su
 * informe: la MISMA plantilla para todas las compañías (qué es, tamaño y
 * valoración, cómo gana dinero, dividendo, comportamiento en mercado y
 * riesgos), construida solo con hechos de la base de datos NUVIA, cada uno
 * con su fecha y su fuente. Un dato que falta se muestra como «—»: nunca se
 * rellena ni se inventa.
 *
 * Reglas de las bases, §5: se describe la empresa, no se prescribe la
 * operación. Cero verbos de acción, cero precio objetivo propio (el PER
 * adelantado se cita como estimación del consenso, atribuida y fechada),
 * simetría obligatoria (la sección de riesgos sale de reglas fijas iguales
 * para todas las compañías), idéntico para cualquiera que lo pida, y
 * **sin firma personal**: no emite recomendaciones y no las emitirá.
 */

import { maestra } from './nuvia-datos.js';
import { pct, num } from './nuvia-cartera.js';
import { fechaCorta } from './nuvia-constructor.js';

export const NOTA_INFORME_CERRADO = 'Con la sesión iniciada, cualquier '
  + 'acción del catálogo tiene aquí su informe genérico: la misma plantilla '
  + 'para todas las compañías, hechos con su fecha y su fuente. No emite '
  + 'recomendaciones y va sin firma. El registro está abierto en el bloque '
  + '«Tu cuenta» de esta página.';

/* ── Formato (probado en docs/nuvia-informe.test.mjs) ── */

/** Múltiplo con una cifra decimal: 11,99 → «12,0×». Sin dato → «—». */
export function veces(v) {
  return Number.isFinite(v) ? `${num(v, 1)}×` : '—';
}

/** Importe grande en millones, con separador de miles es-ES. */
export function enMillones(v, divisa = 'EUR') {
  if (!Number.isFinite(v)) return '—';
  const cifra = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v / 1e6);
  return divisa === 'EUR' ? `${cifra} M€` : `${cifra} M ${divisa}`;
}

/** Importe por acción con dos decimales y su divisa. */
export function porAccion(v, divisa = 'EUR') {
  if (!Number.isFinite(v)) return '—';
  return `${num(v, 2)} ${divisa === 'EUR' ? '€' : divisa}`;
}

const fila = (etiqueta, valor) => ({ etiqueta, valor: valor ?? '—' });

/**
 * Las secciones del informe, con la MISMA plantilla para cualquier compañía
 * (bases §5: una plantilla constante es en sí misma una garantía de no
 * selección interesada). Cada fila existe siempre; sin dato, «—».
 */
export function seccionesInforme(ficha) {
  const f = ficha?.fundamentals_summary || {};
  const divisa = f.currency || ficha?.identity?.currency || 'EUR';
  const perfil = f.profile || {};
  const val = f.valuation || {};
  const renta = f.profitability || {};
  const accion = f.per_share || {};
  const div = f.dividends || {};
  const m = ficha?.metrics || {};
  const preview = ficha?.performance_preview || {};

  return [
    {
      titulo: 'Qué es',
      filas: [
        fila('Nombre', ficha?.identity?.display_name),
        fila('Ticker · ISIN', [ficha?.identity?.ticker, ficha?.identity?.isin].filter(Boolean).join(' · ') || '—'),
        fila('Sector', perfil.sector),
        fila('Industria', perfil.industry),
        fila('País', perfil.country),
        fila('Divisa de cotización', divisa),
      ],
    },
    {
      titulo: 'Tamaño y valoración',
      filas: [
        fila('Capitalización bursátil', enMillones(val.market_cap, divisa)),
        fila('Valor de empresa', enMillones(val.enterprise_value, divisa)),
        fila('PER (beneficios de los últimos 12 meses)', veces(val.pe_trailing)),
        fila('PER adelantado (estimación del consenso)', veces(val.pe_forward)),
        fila('PEG', veces(val.peg)),
        fila('Precio / valor contable', veces(val.price_book_mrq)),
        fila('Precio / ventas (12 meses)', veces(val.price_sales_ttm)),
        fila('Valor de empresa / EBITDA', veces(val.ev_ebitda)),
      ],
    },
    {
      titulo: 'Cómo gana dinero',
      filas: [
        fila('Margen operativo (12 meses)', pct(renta.operating_margin_ttm)),
        fila('Margen neto (12 meses)', pct(renta.profit_margin)),
        fila('Retorno sobre fondos propios (ROE)', pct(renta.return_on_equity_ttm)),
        fila('Retorno sobre activos (ROA)', pct(renta.return_on_assets_ttm)),
        fila('Beneficio por acción', porAccion(accion.eps, divisa)),
        fila('Valor contable por acción', porAccion(accion.book_value, divisa)),
        fila('Ventas por acción (12 meses)', porAccion(accion.revenue_ttm, divisa)),
      ],
    },
    {
      titulo: 'Dividendo',
      filas: [
        fila('Rentabilidad por dividendo', pct(div.yield_ratio)),
        fila('Parte del beneficio repartida (payout)', pct(div.payout_ratio, 0)),
        fila('Dividendo por acción', porAccion(accion.dividend, divisa)),
        fila('Próxima fecha ex-dividendo', fechaCorta(div.ex_dividend_date) || '—'),
      ],
    },
    {
      titulo: 'Comportamiento en mercado',
      filas: [
        fila('Rentabilidad anualizada (1 / 3 / 5 años)',
          `${pct(m.annualized_return_1y)} / ${pct(m.annualized_return_3y)} / ${pct(m.annualized_return_5y)}`),
        fila('Volatilidad anual (1 / 3 / 5 años)',
          `${pct(m.volatility_1y)} / ${pct(m.volatility_3y)} / ${pct(m.volatility_5y)}`),
        fila('Sharpe (3 años)', Number.isFinite(m.sharpe_3y) ? num(m.sharpe_3y, 2) : '—'),
        fila('Máxima caída de su historial', Number.isFinite(m.max_drawdown_hist)
          ? `${pct(m.max_drawdown_hist)}${m.max_drawdown_hist_date ? ` (fondo el ${fechaCorta(m.max_drawdown_hist_date)})` : ''}`
          : '—'),
        fila('Último precio cargado', Number.isFinite(preview.latest_value)
          ? `${porAccion(preview.latest_value, divisa)}${preview.latest_value_date ? ` (${fechaCorta(preview.latest_value_date)})` : ''}`
          : '—'),
      ],
    },
  ];
}

/**
 * Riesgos: simetría obligatoria (bases §5). Salen de reglas FIJAS aplicadas
 * a los datos —las mismas para todas las compañías—, así que ninguna empresa
 * recibe una sección de riesgos «a medida». Solo hechos con su cifra.
 */
export function riesgosInforme(ficha) {
  const f = ficha?.fundamentals_summary || {};
  const m = ficha?.metrics || {};
  const divisa = f.currency || ficha?.identity?.currency || 'EUR';
  const riesgos = [];

  const sector = f.profile?.sector || 'sector sin dato';
  const pais = f.profile?.country || 'país sin dato';
  riesgos.push(`Concentración: una sola compañía, de un solo sector (${sector}) y un solo país (${pais}). Nada dentro del valor diversifica ese riesgo.`);

  if (Number.isFinite(m.volatility_3y)) {
    riesgos.push(`Riesgo de mercado medido, no estimado: volatilidad anual del ${pct(m.volatility_3y)} a 3 años${Number.isFinite(m.volatility_1y) ? ` (${pct(m.volatility_1y)} en el último año)` : ''}.`);
  }
  if (Number.isFinite(m.max_drawdown_hist)) {
    riesgos.push(`La peor caída de su historial fue del ${pct(m.max_drawdown_hist)}${m.max_drawdown_hist_date ? `, tocando fondo el ${fechaCorta(m.max_drawdown_hist_date)}` : ''}. Ya ha pasado una vez.`);
  }
  if (Number.isFinite(f.profitability?.profit_margin) && f.profitability.profit_margin < 0) {
    riesgos.push(`En los últimos doce meses la compañía perdió dinero: margen neto del ${pct(f.profitability.profit_margin)}.`);
  }
  if (Number.isFinite(f.valuation?.pe_trailing) === false && Number.isFinite(f.per_share?.eps) && f.per_share.eps < 0) {
    riesgos.push(`Sin PER sobre beneficios pasados: el beneficio por acción de los últimos doce meses fue negativo (${porAccion(f.per_share.eps, divisa)}).`);
  }
  if (Number.isFinite(f.dividends?.payout_ratio) && f.dividends.payout_ratio > 1) {
    riesgos.push(`El dividendo declarado superó el beneficio del periodo (payout del ${pct(f.dividends.payout_ratio, 0)}): un reparto así no se sostiene solo con el beneficio.`);
  }
  if (divisa && divisa !== 'EUR') {
    riesgos.push(`Cotiza en ${divisa}: para una cartera en euros, el tipo de cambio añade una variación que no depende del negocio.`);
  }
  return riesgos;
}

/** Cuenta las cifras de la plantilla sin dato en la base, para declararlo. */
export function datosAusentes(secciones) {
  let n = 0;
  for (const s of secciones) for (const filaS of s.filas) if (String(filaS.valor).includes('—')) n += 1;
  return n;
}

/** Pie fijo del informe: qué es, de dónde sale y qué no es. */
export function pieInforme(ficha) {
  const f = ficha?.fundamentals_summary || {};
  const fechaFund = fechaCorta(f.as_of_date);
  const fuente = f.source ? String(f.source) : 'sin fuente declarada';
  return 'Informe genérico de la base de datos NUVIA: idéntico para '
    + 'cualquiera que lo pida y con la misma plantilla para todas las '
    + 'compañías. Describe hechos con su fecha; no emite recomendaciones, '
    + 'no fija precios objetivo y va sin firma. '
    + `Fundamentales${fechaFund ? ` a ${fechaFund}` : ''} (fuente: ${fuente}); `
    + 'métricas de mercado al último cierre cargado en la base. '
    + 'Nada de este informe tiene en cuenta la situación de ningún lector.';
}

/* ── Montaje ── */

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaInforme(raiz, { cliente = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();
  raiz.textContent = '';

  const cuerpo = el('div', { class: 'nv-informe__cuerpo' });
  raiz.append(cuerpo);

  const cacheFichas = new Map();
  function fichaDe(id) {
    if (!cacheFichas.has(id)) {
      const promesa = datos.detalleActivo(id);
      promesa.catch(() => cacheFichas.delete(id));
      cacheFichas.set(id, promesa);
    }
    return cacheFichas.get(id);
  }

  function esRegistrada() {
    try { return datos.sesionActual?.().tipo === 'registrada'; } catch { return false; }
  }

  function pintaInforme(destino, ficha) {
    destino.textContent = '';
    const articulo = el('article', { class: 'nv-informe__articulo' });
    articulo.append(el('h3', { class: 'nv-informe__nombre' },
      `${ficha.identity?.display_name || ficha.asset_id} — informe genérico`));
    const secciones = seccionesInforme(ficha);
    for (const seccion of secciones) {
      const bloque = el('section', { class: 'nv-informe__seccion' });
      bloque.append(el('h4', {}, seccion.titulo));
      const lista = el('dl', { class: 'nv-informe__filas' });
      for (const filaS of seccion.filas) {
        lista.append(el('dt', {}, filaS.etiqueta), el('dd', {}, String(filaS.valor)));
      }
      bloque.append(lista);
      articulo.append(bloque);
    }
    const riesgos = el('section', { class: 'nv-informe__seccion nv-informe__riesgos' });
    riesgos.append(el('h4', {}, 'Riesgos'));
    const listaRiesgos = el('ul');
    for (const r of riesgosInforme(ficha)) listaRiesgos.append(el('li', {}, r));
    riesgos.append(listaRiesgos);
    articulo.append(riesgos);
    const ausentes = datosAusentes(secciones);
    if (ausentes) {
      articulo.append(el('p', { class: 'nv-cons__nota' },
        `${ausentes} cifra(s) de la plantilla no están en la base y se muestran como «—»: no se rellenan.`));
    }
    articulo.append(el('p', { class: 'nv-cons__fuente' }, pieInforme(ficha)));
    destino.append(articulo);
  }

  function pintaAbierto() {
    cuerpo.textContent = '';
    cuerpo.append(el('p', { class: 'nv-cuenta__nota' },
      'Busca una acción del catálogo y aquí sale su informe: la misma '
      + 'plantilla para todas las compañías, hechos con su fecha y su '
      + 'fuente, y los riesgos siempre delante. No emite recomendaciones.'));

    const campo = el('div', { class: 'nv-field nv-informe__campo' });
    campo.append(el('label', { for: 'informe-buscar' }, 'Compañía (nombre, ticker o ISIN)'));
    const caja = el('div', { class: 'nv-field__box' });
    const entrada = el('input', { id: 'informe-buscar', type: 'search', autocomplete: 'off', spellcheck: 'false', placeholder: 'Telefónica, SAN, US0378331005…' });
    caja.append(entrada);
    campo.append(caja);
    const resultados = el('div', { class: 'nv-informe__resultados', role: 'listbox' });
    const estado = el('p', { class: 'nv-cons__nota', role: 'status' });
    const destino = el('div', { class: 'nv-informe__destino' });
    cuerpo.append(campo, resultados, estado, destino);

    let temporizador = null;
    let generacion = 0;
    entrada.addEventListener('input', () => {
      clearTimeout(temporizador);
      const consulta = entrada.value.trim();
      if (consulta.length < 2) { resultados.textContent = ''; estado.textContent = ''; return; }
      temporizador = setTimeout(async () => {
        const mia = ++generacion;
        estado.textContent = 'Buscando en el catálogo…';
        try {
          const { activos } = await datos.buscaActivos(consulta, { tipos: ['STOCK'], limite: 8 });
          if (mia !== generacion) return;
          resultados.textContent = '';
          estado.textContent = activos.length ? `${activos.length} resultado(s).` : 'Sin resultados entre las acciones del catálogo.';
          for (const activo of activos) {
            const boton = el('button', { type: 'button', class: 'nv-informe__resultado', role: 'option' },
              `${activo.display_name || activo.asset_id}${activo.ticker ? ` · ${activo.ticker}` : ''}`);
            boton.addEventListener('click', async () => {
              resultados.textContent = '';
              estado.textContent = 'Preparando el informe…';
              try {
                const ficha = await fichaDe(activo.asset_id);
                estado.textContent = '';
                pintaInforme(destino, ficha);
              } catch {
                estado.textContent = 'No se ha podido consultar la ficha. Prueba de nuevo en unos segundos.';
              }
            });
            resultados.append(boton);
          }
        } catch {
          if (mia !== generacion) return;
          estado.textContent = 'No se ha podido buscar. Prueba de nuevo en unos segundos.';
        }
      }, 350);
    });
  }

  function pinta() {
    if (esRegistrada()) pintaAbierto();
    else {
      cuerpo.textContent = '';
      cuerpo.append(el('p', { class: 'nv-informe__cerrado' }, NOTA_INFORME_CERRADO));
    }
  }

  document.addEventListener('nuvia:sesion-cambiada', pinta);
  pinta();
  return { pinta };
}

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
import { metricasDesdeSerie, serieDeCaidas, sharpe, pct, num, DIAS_MERCADO } from './nuvia-cartera.js';
import { montaAnalisis, perfilesReferencia } from './nuvia-analisis.js?v=20260823-6';

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

const DIA_MS = 86_400_000;
const URL_ESTR_LOCAL = new URL('../data/ecb-estr.json', import.meta.url);
let promesaEstr = null;

/**
 * Convierte el €STR diario del BCE en una tasa anual compuesta para la
 * misma ventana temporal que la cartera. Cada observación, expresada por el
 * BCE como porcentaje anual, se mantiene hasta la siguiente fecha publicada
 * y se capitaliza con la convención monetaria ACT/360.
 */
export function tasaSinRiesgoAnualTresAnos(observaciones, fechas) {
  if (!Array.isArray(observaciones) || !Array.isArray(fechas) || fechas.length < 2) return undefined;
  const desde = Date.parse(fechas[0]);
  const hasta = Date.parse(fechas.at(-1));
  if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta <= desde) return undefined;

  const serie = observaciones.map((o) => {
    const fecha = Array.isArray(o) ? o[0] : o?.fecha;
    const valor = Number(Array.isArray(o) ? o[1] : o?.valor);
    return { tiempo: Date.parse(fecha), valor };
  }).filter((o) => Number.isFinite(o.tiempo) && Number.isFinite(o.valor))
    .sort((a, b) => a.tiempo - b.tiempo);
  const previa = serie.filter((o) => o.tiempo <= desde).at(-1);
  if (!previa) return undefined;

  let tasa = previa.valor / 100;
  let cursor = desde;
  let factor = 1;
  for (const observacion of serie) {
    if (observacion.tiempo <= desde) continue;
    if (observacion.tiempo > hasta) break;
    const dias = (observacion.tiempo - cursor) / DIA_MS;
    factor *= 1 + (tasa * dias) / 360;
    tasa = observacion.valor / 100;
    cursor = observacion.tiempo;
  }
  factor *= 1 + (tasa * ((hasta - cursor) / DIA_MS)) / 360;
  const diasTotales = (hasta - desde) / DIA_MS;
  if (!(factor > 0) || !(diasTotales > 0)) return undefined;
  return factor ** (365.2425 / diasTotales) - 1;
}

/** Sharpe ex post: rentabilidad y volatilidad anualizadas de la cartera y
 * €STR compuesto, todo sobre el mismo historial común de tres años. */
export function sharpeHistoricoTresAnos(metricas, tasaSinRiesgo) {
  if (!Number.isFinite(tasaSinRiesgo)) return undefined;
  return sharpe(metricas?.rentabilidadAnualizada, metricas?.volatilidad, tasaSinRiesgo);
}

/** Una descarga por sesión. El parámetro diario evita que una caché del
 * navegador conserve el fichero de ayer tras la actualización automática. */
export function cargaEstrBce(fetchFn = (...args) => fetch(...args)) {
  if (!promesaEstr) {
    const url = new URL(URL_ESTR_LOCAL);
    url.searchParams.set('dia', new Date().toISOString().slice(0, 10));
    promesaEstr = fetchFn(url, { cache: 'no-store' }).then((respuesta) => {
      if (!respuesta.ok) throw new Error(`No se pudo cargar el €STR del BCE (${respuesta.status}).`);
      return respuesta.json();
    }).catch((error) => {
      promesaEstr = null;
      throw error;
    });
  }
  return promesaEstr;
}

/** Reduce el historial a un cierre por semana y conserva únicamente los
 * últimos tres años hasta la fecha más reciente disponible. La serie se
 * rebasa a 1 para que el gráfico arranque en 100. */
export function serieSemanalTresAnos(niveles, fechas) {
  if (!Array.isArray(niveles) || !Array.isArray(fechas) || niveles.length !== fechas.length) return null;
  const pares = niveles.map((nivel, i) => ({
    nivel,
    fecha: fechas[i],
    tiempo: Date.parse(fechas[i]),
  })).filter((p) => Number.isFinite(p.nivel) && Number.isFinite(p.tiempo))
    .sort((a, b) => a.tiempo - b.tiempo);
  if (pares.length < 2) return null;

  const ultima = new Date(pares.at(-1).tiempo);
  const inicio = new Date(ultima.getTime());
  inicio.setUTCFullYear(inicio.getUTCFullYear() - 3);
  const porSemana = new Map();
  for (const par of pares) {
    if (par.tiempo < inicio.getTime()) continue;
    const dia = new Date(par.tiempo);
    const desdeLunes = (dia.getUTCDay() + 6) % 7;
    dia.setUTCDate(dia.getUTCDate() - desdeLunes);
    const clave = dia.toISOString().slice(0, 10);
    porSemana.set(clave, par); // último cierre disponible de esa semana
  }
  const semanales = [...porSemana.values()];
  const base = semanales[0]?.nivel;
  if (semanales.length < 2 || !Number.isFinite(base) || base === 0) return null;
  return {
    niveles: semanales.map((p) => p.nivel / base),
    fechas: semanales.map((p) => p.fecha),
  };
}

/** Cinco perfiles comparables con los mismos nombres y colores que el mapa
 * riesgo-retorno. El porcentaje indica el peso de la cesta de bolsa mundial;
 * el resto corresponde a la cesta de bonos corporativos en euros. */
export const BENCHMARKS_EVOLUCION = perfilesReferencia().map(({ nombre, tono, rv }) => ({
  clave: tono,
  nombre,
  tono,
  rv,
}));

export const ACTIVOS_BENCHMARK = {
  bolsa: [
    'IE00B03HD191', // Vanguard Global Stock Index Fund EUR Acc
    'IE00BYX5NX33', // Fidelity MSCI World Index Fund EUR P Acc
  ],
  bonos: [
    'LU0113257694', // Schroder ISF EURO Corporate Bond A Acc
    'LU0132601682', // Morgan Stanley Euro Corporate Bond Fund A
  ],
};

export const IDS_BENCHMARK = [...ACTIVOS_BENCHMARK.bolsa, ...ACTIVOS_BENCHMARK.bonos];

/** Construye la serie histórica de un perfil con las referencias disponibles
 * en la respuesta: iguales pesos dentro de bolsa y dentro de bonos, y el
 * reparto entre ambas cestas indicado por `rv`. */
export function benchmarkDesdePayload(payload, perfil) {
  if (!perfil || !Array.isArray(payload?.series) || !Array.isArray(payload?.dates)) return null;
  const disponibles = new Map(payload.series.map((s) => [s.asset_id, s]));
  const bolsa = ACTIVOS_BENCHMARK.bolsa.filter((id) => disponibles.has(id));
  const bonos = ACTIVOS_BENCHMARK.bonos.filter((id) => disponibles.has(id));
  if (!bolsa.length || !bonos.length) return null;

  const proporcionBolsa = perfil.rv / 100;
  const pesos = {};
  bolsa.forEach((id) => { pesos[id] = proporcionBolsa / bolsa.length; });
  bonos.forEach((id) => { pesos[id] = (1 - proporcionBolsa) / bonos.length; });
  const niveles = serieCartera([...bolsa, ...bonos].map((id) => disponibles.get(id)), pesos);
  if (!niveles || niveles.length !== payload.dates.length) return null;
  return {
    ...perfil,
    niveles,
    fechas: payload.dates,
    usados: [...bolsa, ...bonos],
    excluidos: IDS_BENCHMARK.filter((id) => !disponibles.has(id)),
  };
}

function claveSemana(fecha) {
  const tiempo = Date.parse(fecha);
  if (!Number.isFinite(tiempo)) return null;
  const dia = new Date(tiempo);
  const desdeLunes = (dia.getUTCDay() + 6) % 7;
  dia.setUTCDate(dia.getUTCDate() - desdeLunes);
  return dia.toISOString().slice(0, 10);
}

/** Alinea cartera y benchmark por semana, conserva solo semanas presentes en
 * ambos y rebasa las dos series a 100 en la primera fecha común. */
export function alineaSeriesSemanales(cartera, benchmark) {
  if (!cartera || !benchmark) return null;
  const porSemana = (serie) => new Map(serie.fechas.map((fecha, i) => [
    claveSemana(fecha),
    { fecha, nivel: serie.niveles[i] },
  ]).filter(([clave, punto]) => clave && Number.isFinite(punto.nivel)));
  const mapaCartera = porSemana(cartera);
  const mapaBenchmark = porSemana(benchmark);
  const claves = [...mapaCartera.keys()].filter((clave) => mapaBenchmark.has(clave)).sort();
  if (claves.length < 2) return null;
  const baseCartera = mapaCartera.get(claves[0]).nivel;
  const baseBenchmark = mapaBenchmark.get(claves[0]).nivel;
  if (!Number.isFinite(baseCartera) || !Number.isFinite(baseBenchmark) || baseCartera === 0 || baseBenchmark === 0) return null;
  return {
    cartera: {
      fechas: claves.map((clave) => mapaCartera.get(clave).fecha),
      niveles: claves.map((clave) => mapaCartera.get(clave).nivel / baseCartera),
    },
    benchmark: {
      fechas: claves.map((clave) => mapaCartera.get(clave).fecha),
      niveles: claves.map((clave) => mapaBenchmark.get(clave).nivel / baseBenchmark),
    },
  };
}

/** Evolución semanal de la cartera, con comparación opcional frente a uno de
 * los cinco perfiles y panel de caídas de la propia cartera. */
export function grupoEvolucion({
  niveles, fechas, cargaBenchmark = null, seleccionInicial = '', alSeleccionar = null,
}) {
  const semanalOriginal = serieSemanalTresAnos(niveles, fechas);
  if (!semanalOriginal) return null;

  const ns = 'http://www.w3.org/2000/svg';
  const nodoSvg = (tag, attrs, texto) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  };
  const bloque = el('div', { class: 'nv-evolucion' });
  bloque.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Evolución de la combinación'));
  bloque.append(el('p', { class: 'nv-cons__nota-clase' },
    'Las líneas arrancan en 100 y muestran un cierre por semana durante los últimos 3 años. Describen lo ocurrido, no lo que viene.'));

  const comparador = el('div', { class: 'nv-evolucion__comparador' });
  const campo = el('label', { class: 'nv-evolucion__campo' });
  campo.append(el('span', { class: 'nv-evolucion__etiqueta' }, 'Comparar la evolución con'));
  const selector = el('select', { class: 'nv-select nv-evolucion__selector' });
  selector.append(el('option', { value: '' }, 'Ningún benchmark'));
  BENCHMARKS_EVOLUCION.forEach((perfil) => selector.append(el('option', {
    value: perfil.clave,
  }, `${perfil.nombre} · ${perfil.rv} % renta variable`)));
  selector.value = BENCHMARKS_EVOLUCION.some((p) => p.clave === seleccionInicial) ? seleccionInicial : '';
  campo.append(selector);
  const estado = el('p', { class: 'nv-evolucion__estado', role: 'status', 'aria-live': 'polite' });
  comparador.append(
    campo,
    el('p', { class: 'nv-evolucion__explicacion' },
      'Los cinco perfiles combinan una cesta de bolsa mundial con otra de bonos corporativos en euros. Se comparan solo las semanas comunes.'),
    estado,
  );
  bloque.append(comparador);
  const zona = el('div', { class: 'nv-evolucion__graficos' });
  bloque.append(zona);

  const pinta = (perfilBenchmark = null) => {
    zona.textContent = '';
    let semanal = semanalOriginal;
    let semanalBenchmark = null;
    if (perfilBenchmark) {
      const limiteDesde = Date.parse(semanalOriginal.fechas[0]);
      const limiteHasta = Date.parse(semanalOriginal.fechas.at(-1));
      const paresBenchmark = perfilBenchmark.fechas.map((fecha, i) => ({
        fecha,
        nivel: perfilBenchmark.niveles[i],
        tiempo: Date.parse(fecha),
      })).filter((punto) => Number.isFinite(punto.tiempo)
        && punto.tiempo >= limiteDesde && punto.tiempo <= limiteHasta);
      const brutoBenchmark = serieSemanalTresAnos(
        paresBenchmark.map((punto) => punto.nivel),
        paresBenchmark.map((punto) => punto.fecha),
      );
      const alineadas = alineaSeriesSemanales(semanalOriginal, brutoBenchmark);
      if (!alineadas) {
        estado.textContent = 'No hay semanas comunes suficientes para dibujar esa comparación.';
        perfilBenchmark = null;
      } else {
        semanal = alineadas.cartera;
        semanalBenchmark = alineadas.benchmark;
      }
    }

    const p = puntosEvolucion(semanal.niveles, semanal.fechas);
    const pb = semanalBenchmark ? puntosEvolucion(semanalBenchmark.niveles, semanalBenchmark.fechas) : null;
    if (!p) return;
    const minTotal = Math.min(p.min, pb?.min ?? p.min);
    const maxTotal = Math.max(p.max, pb?.max ?? p.max);
    const desde = fechaCorta(p.fechas[0]);
    const hasta = fechaCorta(p.fechas.at(-1));

    /* Evolución comparada, ambas series sobre el mismo eje y base 100. */
    const W = 1120; const H = 320; const izq = 64; const der = 18; const arriba = 14; const abajo = 30;
    const descripcionBenchmark = pb
      ? `; ${perfilBenchmark.nombre} termina en ${num(pb.base.at(-1), 0)}`
      : '';
    const svg = nodoSvg('svg', {
      viewBox: `0 0 ${W} ${H}`,
      class: 'nv-evolucion__svg',
      role: 'img',
      'aria-label': `Evolución en base 100 del ${desde} al ${hasta}: tu combinación termina en ${num(p.base.at(-1), 0)}${descripcionBenchmark}.`,
    });
    const escala = { W, H, izq, der, arriba, abajo, min: minTotal, max: maxTotal };
    const yDe = (v) => H - abajo - ((v - minTotal) / ((maxTotal - minTotal) || 1)) * (H - arriba - abajo);
    const yaPintadas = [];
    for (const ref of [...new Set([100, minTotal, maxTotal])].filter((v) => v >= minTotal && v <= maxTotal)) {
      const yy = yDe(ref);
      svg.append(nodoSvg('line', {
        x1: izq, y1: yy, x2: W - der, y2: yy,
        class: ref === 100 ? 'nv-evolucion__cien' : 'nv-evolucion__rejilla',
      }));
      if (yaPintadas.every((otra) => Math.abs(otra - yy) > 14)) {
        svg.append(nodoSvg('text', {
          x: izq - 6, y: yy + 5, 'text-anchor': 'end', class: 'nv-grafico__eje',
        }, num(ref, 0)));
        yaPintadas.push(yy);
      }
    }
    if (pb) svg.append(nodoSvg('path', {
      d: trazadoLinea(pb.base, escala),
      class: `nv-evolucion__benchmark nv-evolucion__benchmark--${perfilBenchmark.tono}`,
      fill: 'none',
    }));
    svg.append(nodoSvg('path', {
      d: trazadoLinea(p.base, escala), class: 'nv-evolucion__linea', fill: 'none',
    }));
    svg.append(nodoSvg('text', { x: izq, y: H - 8, class: 'nv-grafico__eje' }, desde || ''));
    svg.append(nodoSvg('text', {
      x: W - der, y: H - 8, 'text-anchor': 'end', class: 'nv-grafico__eje',
    }, hasta || ''));
    const panel = el('div', { class: 'nv-grafico__panel' });
    panel.append(svg);
    zona.append(panel);

    const leyenda = el('ul', { class: 'nv-evolucion__leyenda', 'aria-label': 'Leyenda de la evolución' });
    const itemLeyenda = (nombre, final, clase) => {
      const item = el('li', { class: 'nv-evolucion__leyenda-item' });
      item.append(
        el('span', { class: `nv-evolucion__muestra ${clase}`, 'aria-hidden': 'true' }),
        el('strong', {}, nombre),
        el('span', {}, `termina en ${num(final, 1)}`),
      );
      return item;
    };
    leyenda.append(itemLeyenda('Tu combinación', p.base.at(-1), 'nv-evolucion__muestra--cartera'));
    if (pb) leyenda.append(itemLeyenda(
      perfilBenchmark.nombre,
      pb.base.at(-1),
      `nv-evolucion__muestra--${perfilBenchmark.tono}`,
    ));
    zona.append(leyenda);

    /* Las caídas siguen describiendo la cartera elegida, no el benchmark. */
    const caidas = serieDeCaidas(semanal.niveles).map((c) => (Number.isFinite(c) ? c * 100 : NaN));
    const cMin = Math.min(0, ...caidas.filter(Number.isFinite));
    const H2 = 150;
    const svg2 = nodoSvg('svg', {
      viewBox: `0 0 ${W} ${H2}`,
      class: 'nv-evolucion__svg',
      role: 'img',
      'aria-label': `Caídas de tu combinación desde máximos: la peor llegó al ${num(cMin, 1)} %.`,
    });
    const escala2 = { W, H: H2, izq, der, arriba: 12, abajo: 20, min: cMin, max: 0 };
    const yDe2 = (v) => H2 - 20 - ((v - cMin) / ((0 - cMin) || 1)) * (H2 - 12 - 20);
    for (const ref of [...new Set([0, cMin])]) {
      const yy = yDe2(ref);
      svg2.append(nodoSvg('line', {
        x1: izq, y1: yy, x2: W - der, y2: yy, class: 'nv-evolucion__rejilla',
      }));
      svg2.append(nodoSvg('text', {
        x: izq - 6, y: yy + 5, 'text-anchor': 'end', class: 'nv-grafico__eje',
      }, `${num(ref, 0)} %`));
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
      svg2.append(nodoSvg('path', {
        d: linea, class: 'nv-evolucion__caida-linea', fill: 'none',
      }));
    }
    zona.append(el('p', { class: 'nv-cons__nota-clase' },
      'Caídas de tu combinación desde máximos: la distancia al máximo anterior en cada momento. El cero es estar en máximos.'));
    const panel2 = el('div', { class: 'nv-grafico__panel' });
    panel2.append(svg2);
    zona.append(panel2);
  };

  pinta();
  let solicitud = 0;
  const cambiaBenchmark = async () => {
    const clave = selector.value;
    if (typeof alSeleccionar === 'function') alSeleccionar(clave);
    const mia = ++solicitud;
    if (!clave) {
      estado.textContent = '';
      pinta();
      return;
    }
    const perfil = BENCHMARKS_EVOLUCION.find((p) => p.clave === clave);
    if (!perfil || typeof cargaBenchmark !== 'function') return;
    estado.textContent = `Preparando la comparación con ${perfil.nombre}…`;
    try {
      const benchmark = await cargaBenchmark(perfil);
      if (mia !== solicitud || !bloque.isConnected) return;
      if (!benchmark) {
        estado.textContent = `No hay historial suficiente para construir el benchmark ${perfil.nombre}.`;
        pinta();
        return;
      }
      estado.textContent = benchmark.excluidos?.length
        ? `${perfil.nombre}: ${benchmark.usados.length} referencias con historial; ${benchmark.excluidos.length} sin serie suficiente quedaron fuera.`
        : `${perfil.nombre}: cuatro referencias con historial, comparadas sobre las mismas semanas.`;
      pinta(benchmark);
    } catch {
      if (mia !== solicitud || !bloque.isConnected) return;
      estado.textContent = 'No se ha podido cargar ese benchmark. La evolución de la cartera sigue visible.';
      pinta();
    }
  };
  selector.addEventListener('change', cambiaBenchmark);
  if (selector.value) queueMicrotask(cambiaBenchmark);
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

function creaFase(numero, id, pregunta, titulo) {
  const seccion = el('section', { id, class: 'nv-lab-fase', 'aria-labelledby': `${id}-title` });
  const cabecera = el('header', { class: 'nv-lab-fase__cabecera' });
  const textos = el('div');
  textos.append(
    el('p', { class: 'nv-lab-fase__pregunta' }, pregunta),
    el('h2', { id: `${id}-title` }, titulo),
  );
  cabecera.append(el('span', { class: 'nv-lab-fase__numero', 'aria-hidden': 'true' }, numero), textos);
  const contenido = el('div', { class: 'nv-lab-fase__contenido' });
  seccion.append(cabecera, contenido);
  return { seccion, contenido };
}

function resumenCartera({ importe, metricas, posiciones }) {
  const resumen = el('div', { class: 'nv-lab-resumen', 'aria-label': 'Resumen de la cartera' });
  const datos = [
    ['Cambio medio anual', pct(metricas?.rentabilidadAnualizada)],
    ['Oscilación anual', pct(metricas?.volatilidad)],
    ['Posiciones con historial', String(posiciones)],
  ];
  if (importe) datos.unshift(['Importe de la cartera', EUROS.format(importe)]);
  for (const [etiqueta, valor] of datos) {
    const dato = el('div', { class: 'nv-lab-resumen__dato' });
    dato.append(
      el('span', { class: 'nv-lab-resumen__etiqueta' }, etiqueta),
      el('strong', { class: 'nv-lab-resumen__valor' }, valor),
    );
    resumen.append(dato);
  }
  return resumen;
}

function donutTiposActivo(partes) {
  if (!partes) return null;
  const bloque = el('div', { class: 'nv-donut' });
  bloque.append(
    el('h3', { class: 'nv-analisis__titulo' }, 'Distribución por tipo de activo'),
    el('p', { class: 'nv-analisis__lectura' },
      'Cada porción representa el peso normalizado de un tipo de activo en la cartera.'),
  );
  const cuerpo = el('div', { class: 'nv-donut__cuerpo' });
  const grafico = el('div', {
    class: 'nv-donut__grafico', role: 'img',
    'aria-label': `Distribución por tipo de activo: ${partes.map((p) => `${p.etiqueta} ${pct(p.peso, 1)}`).join(', ')}`,
  });
  let cursor = 0;
  const tramos = partes.map((p) => {
    const inicio = cursor;
    cursor += p.peso * 100;
    return `${p.color} ${inicio.toFixed(3)}% ${cursor.toFixed(3)}%`;
  });
  grafico.style.background = `conic-gradient(${tramos.join(', ')})`;
  const centro = el('span', { class: 'nv-donut__centro', 'aria-hidden': 'true' });
  centro.append(el('strong', {}, '100 %'), el('small', {}, 'cartera'));
  grafico.append(centro);

  const leyenda = el('ul', { class: 'nv-donut__leyenda' });
  partes.forEach((p) => {
    const item = el('li', { class: 'nv-donut__item' });
    const punto = el('span', { class: 'nv-donut__punto', 'aria-hidden': 'true' });
    punto.style.background = p.color;
    item.append(
      punto,
      el('span', { class: 'nv-donut__nombre', title: p.etiqueta }, p.etiqueta),
      el('strong', { class: 'nv-donut__peso' }, pct(p.peso, 1)),
    );
    leyenda.append(item);
  });
  cuerpo.append(grafico, leyenda);
  bloque.append(cuerpo);
  bloque.append(el('p', { class: 'nv-cons__nota-clase' },
    'Se usa el tipo declarado de cada producto; los fondos mixtos cuentan como «Mixtos», sin mirar dentro.'));
  return bloque;
}

export function montaConstructor(raiz, {
  cliente = null,
  posicionesIniciales = [],
  editable = true,
  destinoAnalisis = null,
  prefijoId = '',
  nivelAnalisis = null,
} = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();

  let posiciones = (posicionesIniciales || []).map((p) => ({
    activo: { ...(p.activo || {}) },
    bruto: Number(p.bruto) || 0,
  }));
  const cacheSeries = new Map(); // clave (ids ordenados) -> promesa del payload
  let generacion = 0;
  let benchmarkElegido = '';
  let ofertaMigracionDescartada = false; // «ahora no» de la migración (paso 31)

  raiz.textContent = '';
  const contador = el('p', { class: 'nv-cons__contador' });

  /* ── Importe opcional: solo para mostrar el capital por posición ──
   *  No se envía a ningún sitio ni se guarda: vive en la página. Sin él,
   *  la columna de capital queda en «—», nunca se inventa una cifra. */
  let importeCartera = null;
  const eur = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const importeCampo = el('div', { class: 'nv-cons__importe', hidden: '' });
  const idImporte = `${prefijoId ? `${prefijoId}-` : ''}importe-cartera`;
  const importeInput = el('input', {
    type: 'number', id: idImporte, min: '0', step: '1000',
    inputmode: 'decimal', placeholder: 'p. ej. 100 000',
  });
  importeInput.addEventListener('input', () => {
    const v = Number(importeInput.value);
    importeCartera = Number.isFinite(v) && v > 0 ? v : null;
    recalcula();
  });
  importeCampo.append(
    el('label', { for: idImporte }, 'Importe de la cartera (€)'),
    importeInput,
    el('span', { class: 'nv-cons__importe-nota' }, 'Opcional: solo sirve para mostrar el capital por posición y no sale de tu navegador.'),
  );

  const cabeceraLista = el('div', { class: 'nv-cons__cabecera', hidden: '', 'aria-hidden': 'true' });
  cabeceraLista.append(
    el('span', {}, 'Activo'),
    el('span', { class: 'nv-cons__cab-cifra' }, 'Peso'),
    el('span', { class: 'nv-cons__cab-cifra' }, 'Capital'),
    el('span', {}, ''),
  );

  const lista = el('ul', { class: 'nv-cons__lista' });
  const estado = el('p', { class: 'nv-cons__estado', role: 'status' });
  const nivel = el('div', { class: 'nv-note nv-cons__nivel', hidden: '' });
  const notaNivel = el('p', {}, NOTA_NIVEL);
  nivel.append(notaNivel);
  const resultados = el('div', { class: 'nv-cons__resultados', 'aria-live': 'polite' });

  /* ── Guardado: local (paso 24) o en la cuenta (paso 30) según la sesión ── */
  const guardadoRaiz = el('div', { class: 'nv-cons__guardado' });
  if (editable) raiz.append(contador, importeCampo, cabeceraLista, lista, estado, nivel, guardadoRaiz);
  else raiz.append(estado);
  const destinoResultados = destinoAnalisis || document.getElementById('analisis-dinamico');
  (destinoResultados || raiz).append(resultados);

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
    /* La lista, plegada para no comerse la página (encargo 21-08). */
    const listaGuardadas = el('ul', { class: 'nv-cons__guardadas' });
    const resumenGuardadas = el('summary', {}, 'Ver tus carteras guardadas');
    const pliegueGuardadas = el('details', { class: 'nv-analisis__despliegue nv-cons__pliegue' });
    pliegueGuardadas.append(resumenGuardadas, listaGuardadas);
    guardadoRaiz.append(formulario, estadoGuardado, pliegueGuardadas);

    function pinta() {
      const carteras = leeGuardadas();
      listaGuardadas.textContent = '';
      pliegueGuardadas.hidden = !carteras.length;
      resumenGuardadas.textContent = `Ver tus carteras guardadas (${carteras.length})`;
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
    /* La lista, plegada para no comerse la página (encargo 21-08). */
    const listaGuardadas = el('ul', { class: 'nv-cons__guardadas' });
    const resumenGuardadas = el('summary', {}, 'Ver tus carteras guardadas');
    const pliegueGuardadas = el('details', { class: 'nv-analisis__despliegue nv-cons__pliegue' });
    pliegueGuardadas.append(resumenGuardadas, listaGuardadas);
    guardadoRaiz.append(formulario, estadoGuardado, oferta, pliegueGuardadas);

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
      pliegueGuardadas.hidden = !carteras.length;
      resumenGuardadas.textContent = `Ver tus carteras guardadas (${carteras.length})`;
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
    if (editable) pintaGuardado();
    recalcula(); // el análisis ampliado (paso 32) aparece o se cierra con la sesión
  });
  if (editable) pintaGuardado();

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

  /* La lista se presenta como se enseñaría una cartera: activo, peso y
   *  capital en columnas, una posición bajo otra, con una barra fina que
   *  dibuja el peso. El peso se edita en su propia casilla. */
  function pintaLista() {
    lista.textContent = '';
    importeCampo.hidden = !posiciones.length;
    cabeceraLista.hidden = !posiciones.length;
    for (const p of posiciones) {
      const nombreActivo = p.activo.display_name || p.activo.asset_id;
      const item = el('li', { class: 'nv-cons__fila' });

      const cabecera = el('div', { class: 'nv-cons__activo' });
      cabecera.append(
        el('span', { class: 'nv-cons__nombre' }, nombreActivo),
        el('span', { class: 'nv-tag nv-cons__tipo' }, etiquetaTipo(p.activo.instrument_type)),
      );
      const barra = el('div', { class: 'nv-cons__peso-barra', 'aria-hidden': 'true' });
      const tramo = el('span', { class: 'nv-cons__peso-tramo' });
      barra.append(tramo);
      p._tramo = tramo;
      cabecera.append(barra);

      const idInput = `peso-${p.activo.asset_id}`;
      const peso = el('span', { class: 'nv-cons__peso' });
      const etiqueta = el('label', { class: 'nv-visually-hidden', for: idInput }, `Peso de ${nombreActivo}`);
      const input = el('input', {
        type: 'number', id: idInput, min: '0', max: '100', step: '1',
        inputmode: 'decimal', class: 'nv-cons__peso-campo', value: String(p.bruto),
      });
      input.addEventListener('input', () => {
        posiciones = cambiaPeso(posiciones, p.activo.asset_id, input.value);
        recalcula();
      });
      peso.append(etiqueta, input, el('span', { class: 'nv-cons__unidad', 'aria-hidden': 'true' }, '%'));

      const capital = el('span', { class: 'nv-cons__capital' }, '—');
      p._capital = capital;

      const quitar = el('button', { type: 'button', class: 'nv-cons__quitar', 'aria-label': `Quitar ${nombreActivo}` }, '×');
      quitar.addEventListener('click', () => {
        posiciones = quitaPosicion(posiciones, p.activo.asset_id);
        pintaLista();
        recalcula();
      });

      item.append(cabecera, peso, capital, quitar);
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
    let estrBce = null;
    try {
      const promesa = seriesDelConjunto(ids);
      estado.textContent = 'Consultando el historial…';
      [payload, estrBce] = await Promise.all([
        promesa,
        cargaEstrBce().catch(() => null),
      ]);
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
      const pesoNorm = pesos && pesos[p.activo.asset_id] != null ? pesos[p.activo.asset_id] : null;
      if (p._tramo) p._tramo.style.width = pesoNorm != null ? `${(pesoNorm * 100).toFixed(1)}%` : '0%';
      if (p._capital) {
        if (pesoNorm == null) p._capital.textContent = 'fuera del cálculo';
        else if (importeCartera) p._capital.textContent = eur(pesoNorm * importeCartera);
        else p._capital.textContent = '—';
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
    const fechasComunes = payload?.dates || null;
    const tasaSinRiesgo = tasaSinRiesgoAnualTresAnos(estrBce?.observaciones, fechasComunes);
    const sharpeTresAnos = sharpeHistoricoTresAnos(m, tasaSinRiesgo);
    const idFase = (numero) => `${prefijoId ? `${prefijoId}-` : ''}fase-${numero}`;
    const fase02 = creaFase('02', idFase('02'), '¿Qué contiene realmente?', 'Qué tienes');
    const fase03 = creaFase('03', idFase('03'), '¿Qué hizo el valor en el pasado?', 'Cuánto se mueve');
    const fase04 = creaFase('04', idFase('04'), '¿Dónde se repiten las mismas apuestas?', 'Apuestas repetidas');
    const fase05 = creaFase('05', idFase('05'), '¿Qué rangos ayudan a entender la incertidumbre?', 'Escenarios');
    resultados.append(fase02.seccion, fase03.seccion, fase04.seccion, fase05.seccion);

    const composicionGrid = el('div', { class: 'nv-lab-composicion' });
    const cajaActivos = el('article', { class: 'nv-lab-subcaja nv-lab-subcaja--donut' });
    const cajaSectores = el('article', { class: 'nv-lab-subcaja nv-lab-sectores' });
    const geografia = el('div', { class: 'nv-lab-geografia' });
    composicionGrid.append(cajaActivos, cajaSectores);
    fase02.contenido.append(composicionGrid, geografia);
    const cajaRiesgo = el('article', { class: 'nv-lab-subcaja' });
    fase03.contenido.append(cajaRiesgo);

    /* El donut muestra el reparto por tipo de activo: renta variable, renta
       fija, monetario, activos reales y las demás categorías declaradas. */
    const reparto = repartoPorClase(posiciones, pesos);
    const donut = donutTiposActivo(reparto);
    if (donut) cajaActivos.append(donut);

    /* Análisis ampliado del nivel registrado (paso 32): se pinta en un nodo
       propio al final; si el usuario mueve un peso, este nodo se descarta con
       el resto de resultados y el render tardío cae en un nodo suelto. */
    const pintaAnalisis = () => {
      const nodo = el('div', { class: 'nv-analisis' });
      fase03.contenido.append(nodo);
      montaAnalisis(nodo, {
        posiciones, pesos, series, datos,
        registrada: Boolean(nivelAnalisis) || esRegistrada(),
        nivel: nivelAnalisis || nivelActual(),
        metricas: m,
        tasaSinRiesgo,
        destinos: {
          composicion: fase02.contenido,
          sectores: cajaSectores,
          geografia,
          riesgo: fase03.contenido,
          solapes: fase04.contenido,
          escenarios: fase05.contenido,
        },
      });
    };

    if (!m) {
      cajaRiesgo.append(el('p', { class: 'nv-cons__nota' }, 'No hay historial común suficiente para calcular las métricas de esta combinación.'));
      pintaAnalisis();
      return;
    }

    cajaRiesgo.append(resumenCartera({
      importe: importeCartera,
      metricas: m,
      posiciones: Object.keys(pesos).length,
    }));
    cajaRiesgo.append(el('h3', { class: 'nv-cons__subtitulo' }, 'Métricas del historial común de 3 años'));

    const tabla = el('table', { class: 'nv-table nv-sim-tabla' });
    tabla.append(el('caption', { class: 'nv-visually-hidden' }, 'Métricas históricas de la combinación elegida'));
    const thead = el('thead');
    const trh = el('tr');
    trh.append(el('th', { scope: 'col' }, 'Métrica'), el('th', { scope: 'col' }, 'Valor'), el('th', { scope: 'col' }, 'Cómo leerla'));
    thead.append(trh);
    const lecturas = lecturasDeMetricas(m, { niveles, fechas: fechasComunes });
    const tbody = el('tbody');
    tbody.append(
      filaMetrica('Cambio acumulado (3 años)', pct(m.rentabilidadTotal), lecturas.rentabilidad),
      filaMetrica('Oscilación anual', pct(m.volatilidad), lecturas.volatilidad),
      filaMetrica('Mayor caída (3 años)', pct(m.maximaCaida), lecturas.caida),
      filaMetrica('Ratio de Sharpe (3 años)', num(sharpeTresAnos, 2),
        Number.isFinite(sharpeTresAnos)
          ? 'Rentabilidad anualizada de estos 3 años, menos el €STR compuesto del mismo periodo, por cada unidad de oscilación anualizada.'
          : 'No se ha podido cruzar el historial de la cartera con la serie diaria del €STR del BCE.'),
    );
    tabla.append(thead, tbody);
    const envoltorio = el('div', { class: 'nv-sim-tabla-scroll' });
    envoltorio.append(tabla);
    cajaRiesgo.append(envoltorio);

    const evolucion = grupoEvolucion({
      niveles,
      fechas: fechasComunes,
      seleccionInicial: benchmarkElegido,
      alSeleccionar: (clave) => { benchmarkElegido = clave; },
      cargaBenchmark: async (perfil) => benchmarkDesdePayload(
        await seriesDelConjunto(IDS_BENCHMARK),
        perfil,
      ),
    });
    if (evolucion) cajaRiesgo.append(evolucion);

    const fecha = fechaCorta(payload?.coverage?.last_date);
    cajaRiesgo.append(el('p', { class: 'nv-cons__fuente' },
      `Datos de cierre${fecha ? ` del ${fecha}` : ''}, base de datos NUVIA. Ventana de 3 años, en euros. ${m.observaciones} observaciones.`));
    if (Number.isFinite(tasaSinRiesgo)) {
      const fuenteBce = el('p', { class: 'nv-cons__fuente' });
      fuenteBce.append(
        'Tasa sin riesgo: ',
        el('a', {
          href: estrBce?.fuente_url || 'https://data.ecb.europa.eu/data/datasets/EST/EST.B.EU000A2X2A25.WT',
          target: '_blank', rel: 'noopener noreferrer',
        }, '€STR diario del Banco Central Europeo'),
        `, compuesto sobre la misma ventana (${pct(tasaSinRiesgo)} anual). `,
        `Última observación: ${fechaCorta(estrBce?.ultimo?.fecha) || '—'}, ${num(estrBce?.ultimo?.valor, 3)} %. `,
        'Actualización automática diaria.',
      );
      cajaRiesgo.append(fuenteBce);
    }
    pintaAnalisis();
  }

  if (editable) {
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
  }

  pintaLista();
  recalcula();
  return {
    recalcula,
    cuantas: () => posiciones.length,
    cargaPosiciones(nuevas) {
      posiciones = (nuevas || []).map((p) => ({
        activo: { ...(p.activo || {}) },
        bruto: Number(p.bruto) || 0,
      }));
      pintaLista();
      return recalcula();
    },
  };
}

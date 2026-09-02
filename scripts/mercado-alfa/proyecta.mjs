/**
 * NUVIA · alfa · proyección de las respuestas de EODHD al esquema propio
 * `nuvia-alfa-asset.v1` (docs/INFORME_PARA_CODEX_BASE_DATOS_ALFA_20260902.md §6).
 *
 * Todo son funciones puras: entran objetos (respuestas crudas, fila del CSV,
 * fechas) y salen documentos listos para Firestore. Sin red, sin disco, sin
 * reloj implícito. La batería está en docs/nuvia-mercado-alfa.test.mjs.
 *
 * Reglas fijas:
 *  - Lo desconocido es null, nunca {} ni 0.
 *  - No se copia ningún campo de valoración de terceros (MorningStar,
 *    Performance, Valuations_Growth, Highlights, objetivos de precio…).
 *  - Nada se publica sin divisa confirmada en EUR.
 */

import { DIVISA_ALFA, claveOrden, sinAcentos } from './universo.mjs';

export const SCHEMA_VERSION = 'nuvia-alfa-asset.v1';
export const METODO_METRICAS = 'log-returns diarios sobre adjusted_close; volatilidad = desviación típica muestral × √252; '
  + 'rentabilidad a 1 y 3 años por fecha natural (primer dato disponible dentro de 10 días desde la fecha objetivo); '
  + 'rentabilidad a 3 años anualizada geométricamente por años reales; caída máxima sobre el máximo previo en la ventana de 3 años';

/** Claves que jamás pueden aparecer en un documento publicable (marco §5). */
export const CLAVES_PROHIBIDAS = ['MorningStar', 'Performance', 'Valuations_Growth', 'Highlights', 'WallStreetTargetPrice',
  'rating', 'stars', 'rank', 'ranking', 'score', 'recommendation', 'Description'];

const DIAS_TOLERANCIA = 10;
/** Días sin dato nuevo a partir de los cuales un instrumento no se publica. */
export const DIAS_SIN_COTIZACION = 30;
const TAMANO_TROZO_CATALOGO = 200;

/* ───────────────────────── utilidades de fecha ───────────────────────── */

export function diaIso(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function fechaDe(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

/** Resta años a una fecha ISO respetando el día natural (28-02 si hace falta). */
export function restaAnios(iso, anios) {
  const d = fechaDe(iso);
  const objetivo = new Date(Date.UTC(d.getUTCFullYear() - anios, d.getUTCMonth(), d.getUTCDate()));
  if (objetivo.getUTCMonth() !== d.getUTCMonth()) objetivo.setUTCDate(0); // 29-02 → 28-02
  return diaIso(objetivo);
}

function diasEntre(isoA, isoB) {
  return Math.round((fechaDe(isoB) - fechaDe(isoA)) / 86_400_000);
}

/** Días laborables (lunes a viernes) entre dos fechas ISO, ambas incluidas. */
export function diasLaborables(isoA, isoB) {
  let n = 0;
  const fin = fechaDe(isoB);
  for (const d = fechaDe(isoA); d <= fin; d.setUTCDate(d.getUTCDate() + 1)) {
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6) n += 1;
  }
  return n;
}

/* ───────────────────────── precios ───────────────────────── */

/**
 * Filtra la respuesta de /api/eod a puntos válidos: fecha ISO y
 * adjusted_close numérico > 0, ordenados por fecha, sin repetidos.
 * @returns {Array<{date:string, value:number}>}
 */
export function puntosValidos(eod) {
  const porFecha = new Map();
  for (const fila of Array.isArray(eod) ? eod : []) {
    const fecha = String(fila?.date || '');
    const valor = Number(fila?.adjusted_close);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
    if (!Number.isFinite(valor) || valor <= 0) continue;
    porFecha.set(fecha, Number(valor.toFixed(6)));
  }
  return [...porFecha.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, value]) => ({ date, value }));
}

/**
 * Fusiona puntos nuevos sobre los cacheados (por fecha; el nuevo sustituye
 * al antiguo). Sirve para `descargar --solo-precios`.
 */
export function fusionaEod(cacheado, nuevo) {
  const porFecha = new Map();
  for (const fila of Array.isArray(cacheado) ? cacheado : []) if (fila?.date) porFecha.set(fila.date, fila);
  for (const fila of Array.isArray(nuevo) ? nuevo : []) if (fila?.date) porFecha.set(fila.date, fila);
  return [...porFecha.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Un documento por año natural con los puntos de ese año. */
export function seriesPorAnio(assetId, puntos) {
  const porAnio = new Map();
  for (const p of puntos) {
    const anio = p.date.slice(0, 4);
    if (!porAnio.has(anio)) porAnio.set(anio, []);
    porAnio.get(anio).push(p);
  }
  return [...porAnio.entries()].sort().map(([anio, pts]) => ({
    asset_id: assetId,
    year: Number(anio),
    currency: DIVISA_ALFA,
    first_date: pts[0].date,
    last_date: pts[pts.length - 1].date,
    n: pts.length,
    points: pts,
  }));
}

/** Primer punto con fecha ≥ objetivo, si está a menos de DIAS_TOLERANCIA días. */
function puntoDesde(puntos, objetivo) {
  const p = puntos.find((x) => x.date >= objetivo);
  if (!p) return null;
  if (diasEntre(objetivo, p.date) > DIAS_TOLERANCIA) return null;
  return p;
}

function desviacionMuestral(valores) {
  if (valores.length < 2) return null;
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  const var_ = valores.reduce((s, v) => s + (v - media) ** 2, 0) / (valores.length - 1);
  return Math.sqrt(var_);
}

function redondea(x, dec = 6) {
  return x == null ? null : Number(x.toFixed(dec));
}

/**
 * Métricas históricas sobre puntos válidos. Devuelve null en cada métrica que
 * la serie no cubre; nunca inventa.
 */
export function metricas(puntos) {
  const vacio = {
    as_of_date: null, return_1y: null, return_3y_annualized: null,
    volatility_1y: null, volatility_3y: null, max_drawdown_3y: null, method: METODO_METRICAS,
  };
  if (!puntos?.length) return vacio;
  const ultimo = puntos[puntos.length - 1];
  const asOf = ultimo.date;
  const salida = { ...vacio, as_of_date: asOf };

  const ventana = (anios) => {
    const inicio = puntoDesde(puntos, restaAnios(asOf, anios));
    if (!inicio) return null;
    const idx = puntos.indexOf(inicio);
    return puntos.slice(idx);
  };

  const v1 = ventana(1);
  if (v1 && v1.length >= 2) {
    salida.return_1y = redondea(ultimo.value / v1[0].value - 1);
    salida.volatility_1y = redondea(volatilidad(v1));
  }
  const v3 = ventana(3);
  if (v3 && v3.length >= 2) {
    const anios = diasEntre(v3[0].date, asOf) / 365.25;
    salida.return_3y_annualized = redondea((ultimo.value / v3[0].value) ** (1 / anios) - 1);
    salida.volatility_3y = redondea(volatilidad(v3));
    salida.max_drawdown_3y = redondea(caidaMaxima(v3));
  }
  return salida;
}

export function volatilidad(puntos) {
  const r = [];
  for (let i = 1; i < puntos.length; i += 1) r.push(Math.log(puntos[i].value / puntos[i - 1].value));
  const sd = desviacionMuestral(r);
  return sd == null ? null : sd * Math.sqrt(252);
}

export function caidaMaxima(puntos) {
  let maximo = -Infinity;
  let peor = 0;
  for (const p of puntos) {
    if (p.value > maximo) maximo = p.value;
    const caida = p.value / maximo - 1;
    if (caida < peor) peor = caida;
  }
  return peor;
}

/** Resumen del historial y calidad: INCOMPLETO si faltan > 5 % de sesiones en la ventana de 3 años. */
export function historialYCalidad(puntos) {
  if (!puntos?.length) {
    return {
      history: { first_date: null, last_date: null, observations: 0, years: 0 },
      quality: { status: 'INCOMPLETO', warnings: ['sin precios válidos'] },
    };
  }
  const primero = puntos[0].date;
  const ultimo = puntos[puntos.length - 1].date;
  const years = redondea(diasEntre(primero, ultimo) / 365.25, 2);
  const warnings = [];
  const inicio3 = restaAnios(ultimo, 3);
  const enVentana = puntos.filter((p) => p.date >= inicio3);
  const desde = enVentana.length ? (primero > inicio3 ? primero : inicio3) : primero;
  const esperadas = diasLaborables(desde, ultimo);
  if (primero > inicio3) warnings.push(`historial más corto que 3 años (empieza el ${primero})`);
  if (esperadas > 0 && enVentana.length < 0.95 * esperadas) {
    warnings.push(`faltan sesiones en la ventana de 3 años (${enVentana.length} de ~${esperadas})`);
  }
  return {
    history: { first_date: primero, last_date: ultimo, observations: puntos.length, years },
    quality: { status: warnings.length ? 'INCOMPLETO' : 'OK', warnings },
  };
}

/* ───────────────────────── ficha (ETF y acciones) ───────────────────────── */

export function normClave(texto) {
  return sinAcentos(texto).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function numero(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/** {clave: %} a partir de un bloque {Nombre: {"Equity_%": "12.3"}}; null si no hay nada válido. */
function pesosDe(bloque, campo = 'Equity_%') {
  if (!bloque || typeof bloque !== 'object') return null;
  const salida = {};
  for (const [nombre, valores] of Object.entries(bloque)) {
    const n = numero(valores?.[campo]);
    if (n != null && n > 0) salida[normClave(nombre)] = redondea(n, 3);
  }
  return Object.keys(salida).length ? salida : null;
}

/** Exposiciones de un ETF desde ETF_Data (fracciones 0–1 en asset_mix; % en regions y sectors). */
export function exposicionesEtf(etfData) {
  if (!etfData || typeof etfData !== 'object') return null;
  const aa = etfData.Asset_Allocation;
  let asset_mix = null;
  if (aa && typeof aa === 'object') {
    const neto = (k) => numero(aa[k]?.['Net_Assets_%']) ?? 0;
    const equity = neto('Stock US') + neto('Stock non-US');
    const bond = neto('Bond');
    const cash = neto('Cash');
    const other = neto('Other') + neto('NotClassified');
    if (equity + bond + cash + other > 0) {
      asset_mix = {
        equity: redondea(equity / 100, 4), fixed_income: redondea(bond / 100, 4),
        cash: redondea(cash / 100, 4), other: redondea(other / 100, 4),
      };
    }
  }
  const regions = pesosDe(etfData.World_Regions);
  const sectors = pesosDe(etfData.Sector_Weights);
  if (!asset_mix && !regions && !sectors) return null;
  return { source: 'EODHD', asset_mix, regions, sectors };
}

/** Las diez mayores posiciones de un ETF (Top_10_Holdings). null si no hay. */
export function holdingsEtf(etfData, asOfDate) {
  const top = etfData?.Top_10_Holdings;
  if (!top || typeof top !== 'object') return null;
  const holdings = [];
  for (const [simbolo, h] of Object.entries(top)) {
    const peso = numero(h?.['Assets_%']);
    if (peso == null) continue;
    holdings.push({
      name: h?.Name || simbolo,
      isin: null,
      ticker: h?.Code || simbolo.split('.')[0] || null,
      weight_pct: redondea(peso, 4),
      country: h?.Country || null,
      sector: h?.Sector || null,
    });
  }
  if (!holdings.length) return null;
  holdings.sort((a, b) => b.weight_pct - a.weight_pct);
  return {
    as_of_date: asOfDate,
    source: 'EODHD',
    holdings_count: numero(etfData.Holdings_Count),
    top10_weight: redondea(holdings.reduce((s, h) => s + h.weight_pct, 0), 4),
    holdings,
  };
}

/**
 * Gastos corrientes en % (0.20 = 0,20 %). EODHD mezcla unidades en
 * Ongoing_Charge: unos ETF vienen en porcentaje ("0.2000") y otros en
 * fracción ("0.0011" = 0,11 %). Por debajo de 0,02 se interpreta como
 * fracción y se pasa a porcentaje (ningún ETF cobra menos del 0,02 %).
 */
export function gastosCorrientes(bruto) {
  if (bruto == null || bruto === '') return {};
  const oc = numero(bruto);
  if (oc == null || oc < 0) return {};
  const pct = oc < 0.02 ? oc * 100 : oc;
  return { ongoing_charge: redondea(pct, 4) };
}

/** Región principal de un ETF (la de mayor peso en World_Regions) o null. */
function regionPrincipal(regions) {
  if (!regions) return null;
  return Object.entries(regions).sort((a, b) => b[1] - a[1])[0][0];
}

/* ───────────────────────── divisa ───────────────────────── */

/**
 * Divisa confirmada por EODHD: General.CurrencyCode de la ficha (ETF y
 * acciones) o la entrada de /api/search cuyo Code coincide con el símbolo
 * (fondos). Devuelve {method, value} o null si no se puede confirmar.
 */
export function divisaConfirmada({ fila, fundamentales, busqueda }) {
  const cc = fundamentales?.General?.CurrencyCode;
  if (typeof cc === 'string' && cc.trim()) return { method: 'fundamentals', value: cc.trim().toUpperCase() };
  if (Array.isArray(busqueda) && fila?.eodhd_symbol) {
    const [code, exchange] = fila.eodhd_symbol.split('.');
    const coincide = busqueda.find((b) => String(b?.Code || '').toUpperCase() === String(code).toUpperCase()
      && (!exchange || String(b?.Exchange || '').toUpperCase() === String(exchange).toUpperCase()))
      || busqueda.find((b) => String(b?.ISIN || '').toUpperCase() === String(fila.asset_id).toUpperCase());
    if (coincide?.Currency) return { method: 'search', value: String(coincide.Currency).trim().toUpperCase() };
  }
  return null;
}

/* ───────────────────────── activo completo ───────────────────────── */

/**
 * Proyecta un instrumento completo.
 * @param {Object} args
 * @param {Object} args.fila            línea del CSV (incluir=si)
 * @param {Array}  args.eod             respuesta de /api/eod (cruda, fusionada)
 * @param {Object} [args.fundamentales] respuesta de /api/fundamentals (solo ETF/STOCK)
 * @param {Array}  [args.busqueda]      respuesta de /api/search/{isin} (fondos, para la divisa)
 * @param {string} args.fetchedAt       ISO de la descarga
 * @param {string} args.updatedAt       ISO de la proyección
 * @returns {{asset:Object|null, series:Array, holdings:Object|null, errores:string[]}}
 */
export function proyectaActivo({ fila, eod, fundamentales = null, busqueda = null, fetchedAt, updatedAt }) {
  const errores = [];
  const tipo = fila.instrument_type;
  const puntos = puntosValidos(eod);
  if (!puntos.length) errores.push('sin precios válidos en EODHD');

  const divisa = divisaConfirmada({ fila, fundamentales, busqueda });
  if (!divisa) errores.push('divisa no confirmable en EODHD (sin ficha ni resultado de búsqueda)');
  else if (divisa.value !== DIVISA_ALFA) errores.push(`divisa en EODHD ${divisa.value}, distinta de ${DIVISA_ALFA}`);
  if (fila.divisa !== DIVISA_ALFA) errores.push(`divisa declarada ${fila.divisa}, distinta de ${DIVISA_ALFA}`);

  // Serie sin cotización reciente (instrumento retirado, fusionado o sin
  // valor liquidativo): no se publica, aunque tenga historial.
  if (puntos.length) {
    const ultimo = puntos[puntos.length - 1].date;
    const hoy = String(updatedAt || '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(hoy) && diasEntre(ultimo, hoy) > DIAS_SIN_COTIZACION) {
      errores.push(`sin cotización reciente en EODHD (último dato ${ultimo})`);
    }
  }
  if (errores.length) return { asset: null, series: [], holdings: null, errores };

  const general = fundamentales?.General && typeof fundamentales.General === 'object' ? fundamentales.General : null;
  const etfData = tipo === 'ETF' && fundamentales?.ETF_Data && typeof fundamentales.ETF_Data === 'object' ? fundamentales.ETF_Data : null;

  const { history, quality } = historialYCalidad(puntos);
  const warnings = [...quality.warnings];

  let display_name = fila.nombre;
  let ticker = null;
  let region = null;
  let sector = null;
  let category = null;
  let costs = {};
  let exposures = null;
  let holdings = null;
  let economic_asset_class = fila.clase || null;

  if (tipo === 'FUND') {
    exposures = exposicionesPorClase(economic_asset_class);
    warnings.push('sin desglose de regiones y sectores en la alfa (EODHD no lo publica para fondos europeos)');
  } else if (tipo === 'ETF') {
    display_name = general?.Name || fila.nombre;
    ticker = general?.Code || fila.eodhd_symbol.split('.')[0];
    category = etfData?.Index_Name || null;
    costs = gastosCorrientes(etfData?.Ongoing_Charge);
    exposures = exposicionesEtf(etfData);
    if (!economic_asset_class) economic_asset_class = claseDesdeMix(exposures?.asset_mix);
    region = regionPrincipal(exposures?.regions);
    holdings = holdingsEtf(etfData, history.last_date);
    if (!exposures) warnings.push('sin distribución en la ficha de EODHD');
    if (!holdings) warnings.push('sin posiciones en la ficha de EODHD');
  } else if (tipo === 'STOCK') {
    display_name = general?.Name || fila.nombre;
    ticker = general?.Code || fila.eodhd_symbol.split('.')[0];
    sector = general?.Sector || null;
    region = general?.CountryName || null;
    category = general?.Industry || null;
    if (!economic_asset_class) economic_asset_class = 'EQUITY';
    exposures = {
      source: 'eodhd-general',
      asset_mix: { equity: 1, fixed_income: 0, cash: 0, other: 0 },
      regions: region ? { [normClave(region)]: 100 } : null,
      sectors: sector ? { [normClave(sector)]: 100 } : null,
    };
    if (!general) warnings.push('sin ficha de EODHD; nombre del CSV');
  }

  if (!economic_asset_class) {
    errores.push('sin clase económica (ni en el CSV ni deducible de EODHD)');
    return { asset: null, series: [], holdings: null, errores };
  }

  const asset = {
    asset_id: fila.asset_id,
    isin: fila.asset_id,
    ticker,
    eodhd_symbol: fila.eodhd_symbol,
    instrument_type: tipo,
    economic_asset_class,
    display_name,
    currency: DIVISA_ALFA,
    region,
    sector,
    category,
    grupo: fila.grupo || null,
    costs,
    exposures,
    metrics: metricas(puntos),
    history,
    // El estado OK/INCOMPLETO refleja solo el historial de precios; los avisos
    // de ficha («sin desglose…») son informativos y no lo degradan.
    quality: { status: quality.status, warnings },
    source: {
      system: 'EODHD',
      symbol: fila.eodhd_symbol,
      fetched_at: fetchedAt,
      currency_check: { method: divisa.method, value: divisa.value, checked_at: fetchedAt },
    },
    schema_version: SCHEMA_VERSION,
    updated_at: updatedAt,
  };

  return { asset, series: seriesPorAnio(fila.asset_id, puntos), holdings, errores: [] };
}

/** asset_mix de un fondo solo cuando la clase del CSV es inequívoca; si no, null. */
export function exposicionesPorClase(clase) {
  const mapa = {
    EQUITY: { equity: 1, fixed_income: 0, cash: 0, other: 0 },
    FIXED_INCOME: { equity: 0, fixed_income: 1, cash: 0, other: 0 },
    MONEY_MARKET: { equity: 0, fixed_income: 0, cash: 1, other: 0 },
  };
  if (!mapa[clase]) return null;
  return { source: 'csv-clase', asset_mix: mapa[clase], regions: null, sectors: null };
}

function claseDesdeMix(mix) {
  if (!mix) return null;
  if (mix.equity >= 0.7) return 'EQUITY';
  if (mix.fixed_income >= 0.7) return 'FIXED_INCOME';
  if (mix.cash >= 0.7) return 'MONEY_MARKET';
  return 'MIXED';
}

/* ───────────────────────── catálogo ───────────────────────── */

/** Trozos del catálogo y manifiesto. Orden: grupo y nombre, nunca mérito. */
export function catalogo(assets, updatedAt) {
  const items = assets
    .map((a) => ({
      asset_id: a.asset_id, display_name: a.display_name, instrument_type: a.instrument_type,
      economic_asset_class: a.economic_asset_class, isin: a.isin, ticker: a.ticker, grupo: a.grupo,
    }))
    .sort((a, b) => (claveOrden(a) < claveOrden(b) ? -1 : 1));
  const chunks = [];
  for (let i = 0; i < items.length; i += TAMANO_TROZO_CATALOGO) {
    const trozo = items.slice(i, i + TAMANO_TROZO_CATALOGO);
    chunks.push({ id: String(chunks.length).padStart(3, '0'), items: trozo, n: trozo.length });
  }
  const fechas = assets.map((a) => a.history?.last_date).filter(Boolean).sort();
  const manifest = {
    total: items.length,
    chunks: chunks.length,
    updated_at: updatedAt,
    prices_last_date: fechas.length ? fechas[fechas.length - 1] : null,
    prices_last_date_min: fechas.length ? fechas[0] : null,
    universe: 'alfa',
    schema_version: SCHEMA_VERSION,
  };
  return { chunks, manifest };
}

/* ───────────────────────── control de mérito ───────────────────────── */

/** Devuelve la lista de rutas donde aparece alguna clave prohibida (vacía si el documento está limpio). */
export function clavesProhibidasEn(obj, ruta = '') {
  const encontradas = [];
  if (!obj || typeof obj !== 'object') return encontradas;
  for (const [k, v] of Object.entries(obj)) {
    const aqui = ruta ? `${ruta}.${k}` : k;
    if (CLAVES_PROHIBIDAS.some((p) => p.toLowerCase() === k.toLowerCase())) encontradas.push(aqui);
    if (v && typeof v === 'object') encontradas.push(...clavesProhibidasEn(v, aqui));
  }
  return encontradas;
}

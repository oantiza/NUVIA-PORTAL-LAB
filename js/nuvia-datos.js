/**
 * NUVIA — acceso de solo lectura a la base de datos propia de la alfa.
 *
 * Entrega 2b (02-09-2026): el laboratorio deja de consultar la base
 * profesional del fundador por funciones en la nube y pasa a leer Firestore
 * del proyecto propio `nuvia-family-wealth` por su API REST, **sin sesión**:
 * la alfa está en abierto, no hay cuentas ni datos de usuarios, y las
 * carteras se guardan solo en el navegador (nuvia-constructor.js).
 * Documentación: docs/PENDIENTE_ALFA_NUVIA_20260902.md §5 y
 * docs/INFORME_PARA_CODEX_BASE_DATOS_ALFA_20260902.md §8.
 *
 * Qué se conserva a propósito: el nombre `creaClienteMaestra`, su firma de
 * inyección (fetchFn, almacén, reloj) y TODOS los métodos que consumen los
 * módulos, para que nuvia-constructor.js, nuvia-analisis.js, nuvia-modelos.js
 * y nuvia-buscador.js no cambien. `llama()` queda como fachada: traduce los
 * nombres de las antiguas funciones a lecturas de Firestore y devuelve la
 * misma forma que devolvían.
 *
 * Nunca EODHD desde el navegador; nunca la base profesional; nunca Auth.
 */

export const PROYECTO = { id: 'nuvia-family-wealth' };

export const URL_DOCUMENTOS = `https://firestore.googleapis.com/v1/projects/${PROYECTO.id}/databases/(default)/documents`;

/** Clave antigua de sesión (proyecto anterior). Se borra al arrancar: un
 *  navegador que entró antes no debe conservar tokens de otro proyecto. */
export const CLAVE_SESION_ANTIGUA = 'nuvia.maestra-sesion.v1';
export const CLAVE_CATALOGO = 'nuvia.catalogo.v1';
export const PREFIJO_SERIES = 'nuvia.series.v1.';

/** Nivel único de la alfa: análisis completo para cualquiera; los escenarios
 *  del suscriptor siguen «no abiertos», como hasta ahora. */
export const NIVEL_ALFA = 'registrada';
export const ANIOS_VENTANA = 3;
/** Días de margen entre el inicio de la ventana y el primer dato de un
 *  activo para considerarlo con historial suficiente. */
export const TOLERANCIA_INICIO_DIAS = 20;
const TTL_BUSQUEDA_MS = 10 * 60_000;

function diasEntre(isoA, isoB) {
  return Math.round((Date.parse(`${isoB}T00:00:00Z`) - Date.parse(`${isoA}T00:00:00Z`)) / 86_400_000);
}

/** Marcador de suscripción por cuenta. Sin cuentas en la alfa no lo tiene
 *  nadie; se conserva para no tocar nuvia-cuenta.js. */
export const CLAVE_SUSCRIPCION = 'nuvia.suscripcion.v1';

/** Cuentas del administrador del portal (sin efecto en la alfa: no hay sesión). */
export const CORREOS_ADMIN = ['oantiza@gmail.com'];

export function esAdmin(correo) {
  return CORREOS_ADMIN.includes(String(correo || '').trim().toLowerCase());
}

export function leeSuscripcion(almacen, correo) {
  if (!almacen || !correo) return false;
  try {
    const mapa = JSON.parse(almacen.getItem(CLAVE_SUSCRIPCION) || 'null');
    return mapa?.[String(correo).trim().toLowerCase()]?.activa === true;
  } catch {
    return false;
  }
}

/** Etiqueta en castellano para los tipos de instrumento. */
export function etiquetaTipo(tipo) {
  const mapa = { STOCK: 'Acción', FUND: 'Fondo', ETF: 'ETF', INDEX: 'Índice' };
  return mapa[String(tipo || '').toUpperCase()] || String(tipo || '—');
}

/* ───────────────────────── helpers puros (probados) ───────────────────────── */

/** Texto sin acentos ni mayúsculas, para buscar. */
export function normaliza(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Valor tipado de Firestore → JavaScript. */
export function deFirestore(valor) {
  if (!valor || typeof valor !== 'object') return null;
  if ('nullValue' in valor) return null;
  if ('booleanValue' in valor) return valor.booleanValue;
  if ('integerValue' in valor) return Number(valor.integerValue);
  if ('doubleValue' in valor) return valor.doubleValue;
  if ('stringValue' in valor) return valor.stringValue;
  if ('timestampValue' in valor) return valor.timestampValue;
  if ('arrayValue' in valor) return (valor.arrayValue.values || []).map(deFirestore);
  if ('mapValue' in valor) return camposDe(valor.mapValue.fields);
  return null;
}

export function camposDe(fields) {
  const salida = {};
  for (const [k, v] of Object.entries(fields || {})) salida[k] = deFirestore(v);
  return salida;
}

/** Documento REST → objeto plano (o null si no hay documento). */
export function documentoAObjeto(doc) {
  if (!doc?.name || !doc.fields) return null;
  return camposDe(doc.fields);
}

/**
 * Búsqueda en memoria sobre el catálogo: por nombre, ISIN o ticker, sin
 * acentos ni mayúsculas. Devuelve la misma forma que devolvía search_assets.
 */
export function buscaEnCatalogo(items, consulta, { tipos = null, limite = 12 } = {}) {
  const q = normaliza(consulta);
  if (!q) return { activos: [], total: 0 };
  const palabras = q.split(/\s+/).filter(Boolean);
  const tiposOk = tipos ? new Set(tipos.map((t) => String(t).toUpperCase())) : null;
  const coincidencias = (items || []).filter((a) => {
    if (tiposOk && !tiposOk.has(String(a.instrument_type || '').toUpperCase())) return false;
    const texto = normaliza([a.display_name, a.isin, a.ticker, a.asset_id].filter(Boolean).join(' '));
    return palabras.every((p) => texto.includes(p));
  });
  // Coincidencia exacta de ISIN o ticker primero; después el orden del catálogo.
  const exacto = (a) => (normaliza(a.isin) === q || normaliza(a.ticker) === q ? 0 : 1);
  coincidencias.sort((a, b) => exacto(a) - exacto(b));
  return { activos: coincidencias.slice(0, limite), total: coincidencias.length };
}

/**
 * Ficha de Firestore → la forma que los módulos esperan de get_asset_detail.
 * `null` significa «sin datos» y así llega: el análisis no debe estimarlo.
 */
export function fichaParaModulos(doc) {
  if (!doc) return null;
  const ex = doc.exposures || null;
  return {
    asset_id: doc.asset_id,
    identity: {
      display_name: doc.display_name,
      currency: doc.currency,
      region: doc.region ?? null,
      isin: doc.isin,
      ticker: doc.ticker ?? null,
    },
    instrument_type: doc.instrument_type,
    economic_asset_class: doc.economic_asset_class,
    category: doc.category ?? null,
    sector: doc.sector ?? null,
    region: doc.region ?? null,
    currency: doc.currency,
    costs: doc.costs || {},
    metrics: doc.metrics || null,
    history: doc.history || null,
    quality: doc.quality || null,
    pms_exposure: ex?.asset_mix ? { equity: ex.asset_mix.equity ?? 0 } : null,
    exposure_detail: ex && (ex.sectors || ex.regions) ? { sectors: ex.sectors || null, equity_regions: ex.regions || null } : null,
    fundamentals_summary: null,
    performance_preview: null,
  };
}

/**
 * Alinea varias series diarias por fechas comunes (intersección) y las rebasa
 * a 100 en la primera fecha común. Devuelve exactamente la forma de
 * get_price_series: {dates, series:[{asset_id, values}]}. Un activo sin
 * puntos en la ventana queda fuera de `series` (el constructor lo interpreta
 * como «sin historial suficiente»).
 *
 * @param {Object<string, Array<{date:string, value:number}>>} porActivo
 * @param {{desde?:string, hasta?:string}} ventana  fechas ISO inclusivas
 */
export function alineaYRebasa(porActivo, { desde = null, hasta = null } = {}) {
  const ids = Object.keys(porActivo || {});
  const mapas = new Map();
  for (const id of ids) {
    const m = new Map();
    for (const p of porActivo[id] || []) {
      if (!p?.date || !Number.isFinite(p.value) || p.value <= 0) continue;
      if (desde && p.date < desde) continue;
      if (hasta && p.date > hasta) continue;
      m.set(p.date, p.value);
    }
    if (!m.size) continue;
    // Un activo que empieza mucho después del inicio de la ventana no
    // acorta la ventana de los demás: queda fuera, como «sin historial suficiente».
    if (desde) {
      const primera = [...m.keys()].sort()[0];
      if (diasEntre(desde, primera) > TOLERANCIA_INICIO_DIAS) continue;
    }
    mapas.set(id, m);
  }
  if (!mapas.size) return { dates: [], series: [] };
  let comunes = null;
  for (const m of mapas.values()) {
    const fechas = new Set(m.keys());
    comunes = comunes ? new Set([...comunes].filter((d) => fechas.has(d))) : fechas;
  }
  const dates = [...comunes].sort();
  if (!dates.length) return { dates: [], series: [] };
  const series = [];
  for (const [id, m] of mapas) {
    const base = m.get(dates[0]);
    series.push({ asset_id: id, values: dates.map((d) => Number((100 * m.get(d) / base).toFixed(6))) });
  }
  return { dates, series };
}

/** Años naturales que cubre la ventana de N años hasta hoy. */
export function aniosDeVentana(hoyIso, anios = ANIOS_VENTANA) {
  const fin = Number(String(hoyIso).slice(0, 4));
  const salida = [];
  for (let y = fin - anios; y <= fin; y += 1) salida.push(y);
  return salida;
}

function errorNoDisponible(nombre) {
  const e = new Error(`Función no disponible en la alfa: ${nombre}`);
  e.codigo = 'NO_DISPONIBLE_ALFA';
  return e;
}

/* ───────────────────────── cliente ───────────────────────── */

export function creaClienteMaestra({
  fetchFn = (...args) => fetch(...args),
  almacen = null,
  ahora = () => Date.now(),
  proyecto = PROYECTO,
} = {}) {
  const urlDocs = `https://firestore.googleapis.com/v1/projects/${proyecto.id}/databases/(default)/documents`;

  // Limpieza: tokens del proyecto anterior no deben quedarse en el navegador.
  if (almacen) { try { almacen.removeItem(CLAVE_SESION_ANTIGUA); } catch { /* sin persistencia */ } }

  function hoyIso() { return new Date(ahora()).toISOString().slice(0, 10); }

  async function pide(url, opciones = {}) {
    const res = await fetchFn(url, { headers: { 'Content-Type': 'application/json' }, ...opciones });
    let json = null;
    try { json = await res.json(); } catch { /* cuerpo no JSON */ }
    return { ok: res.ok, status: res.status, json };
  }

  /** Lee un documento; null si no existe. */
  async function lee(ruta) {
    const { ok, status, json } = await pide(`${urlDocs}/${ruta}`);
    if (status === 404) return null;
    if (!ok) {
      const error = new Error(json?.error?.message || `Error ${status} al consultar la base de datos.`);
      error.codigo = json?.error?.status || status;
      throw error;
    }
    return documentoAObjeto(json);
  }

  /** Lee varios documentos de una vez (batchGet). Devuelve {ruta: objeto|null}. */
  async function lote(rutas) {
    if (!rutas.length) return {};
    const prefijo = `projects/${proyecto.id}/databases/(default)/documents/`;
    const { ok, status, json } = await pide(`${urlDocs}:batchGet`, {
      method: 'POST', body: JSON.stringify({ documents: rutas.map((r) => prefijo + r) }),
    });
    if (!ok) {
      const error = new Error(json?.error?.message || `Error ${status} al consultar la base de datos.`);
      error.codigo = json?.error?.status || status;
      throw error;
    }
    const salida = {};
    for (const r of rutas) salida[r] = null;
    for (const item of Array.isArray(json) ? json : []) {
      if (item.found) salida[item.found.name.slice(prefijo.length)] = documentoAObjeto(item.found);
    }
    return salida;
  }

  /* ── Catálogo: manifiesto + trozos, una vez; caché por updated_at ── */

  let catalogoEnCurso = null;
  let catalogoMemoria = null;

  function leeCatalogoCache() {
    if (!almacen) return null;
    try {
      const c = JSON.parse(almacen.getItem(CLAVE_CATALOGO) || 'null');
      if (c && c.updated_at && Array.isArray(c.items)) return c;
    } catch { /* ilegible */ }
    return null;
  }

  async function catalogo() {
    if (catalogoMemoria) return catalogoMemoria;
    if (!catalogoEnCurso) {
      catalogoEnCurso = (async () => {
        const manifiesto = await lee('catalog_manifest/public');
        if (!manifiesto) throw Object.assign(new Error('El catálogo de la alfa aún no está publicado.'), { codigo: 'SIN_CATALOGO' });
        const cache = leeCatalogoCache();
        if (cache && cache.updated_at === manifiesto.updated_at) {
          catalogoMemoria = { manifiesto, items: cache.items };
          return catalogoMemoria;
        }
        const n = Number(manifiesto.chunks) || 0;
        const rutas = Array.from({ length: n }, (_, i) => `catalog_chunks/${String(i).padStart(3, '0')}`);
        const trozos = await lote(rutas);
        const items = rutas.flatMap((r) => trozos[r]?.items || []);
        if (almacen) { try { almacen.setItem(CLAVE_CATALOGO, JSON.stringify({ updated_at: manifiesto.updated_at, items })); } catch { /* sin espacio */ } }
        catalogoMemoria = { manifiesto, items };
        return catalogoMemoria;
      })();
      catalogoEnCurso.catch(() => { catalogoEnCurso = null; });
    }
    return catalogoEnCurso;
  }

  /** Manifiesto del catálogo (fecha de datos, total). */
  async function manifiesto() { return (await catalogo()).manifiesto; }

  /** ¿Están estos identificadores en el catálogo de la alfa? {id: boolean}. */
  async function enCatalogo(ids) {
    const { items } = await catalogo();
    const presentes = new Set(items.map((a) => a.asset_id));
    const salida = {};
    for (const id of ids || []) salida[id] = presentes.has(id);
    return salida;
  }

  const cacheBusquedas = new Map();

  function buscaActivos(consulta, { tipos = null, limite = 12 } = {}) {
    const clave = JSON.stringify([normaliza(consulta), tipos, limite]);
    const acierto = cacheBusquedas.get(clave);
    if (acierto && acierto.caducaEn > ahora()) return acierto.promesa;
    const promesa = catalogo().then(({ items }) => buscaEnCatalogo(items, consulta, { tipos, limite }));
    cacheBusquedas.set(clave, { promesa, caducaEn: ahora() + TTL_BUSQUEDA_MS });
    promesa.catch(() => cacheBusquedas.delete(clave));
    return promesa;
  }

  /* ── Fichas ── */

  const cacheFichas = new Map();

  function detalleActivo(assetId) {
    const id = String(assetId || '');
    if (!cacheFichas.has(id)) {
      const promesa = lee(`assets/${id}`).then((doc) => {
        if (!doc) { const e = new Error('Ese activo no está en la alfa.'); e.codigo = 'NOT_FOUND'; throw e; }
        return fichaParaModulos(doc);
      });
      promesa.catch(() => cacheFichas.delete(id));
      cacheFichas.set(id, promesa);
    }
    return cacheFichas.get(id);
  }

  /* ── Series: documentos por año; los años cerrados se cachean en el navegador ── */

  function leeSerieCache(id, anio) {
    if (!almacen) return null;
    try {
      const s = JSON.parse(almacen.getItem(`${PREFIJO_SERIES}${id}.${anio}`) || 'null');
      if (s && Array.isArray(s.points)) return s;
    } catch { /* ilegible */ }
    return null;
  }

  function guardaSerieCache(id, anio, serie) {
    if (!almacen) return;
    try { almacen.setItem(`${PREFIJO_SERIES}${id}.${anio}`, JSON.stringify(serie)); } catch { /* sin espacio */ }
  }

  async function seriesRebasadas(ids) {
    const hoy = hoyIso();
    const anioActual = Number(hoy.slice(0, 4));
    const anios = aniosDeVentana(hoy);
    const pendientes = [];
    const porActivo = {};
    for (const id of ids) {
      porActivo[id] = [];
      for (const anio of anios) {
        const cache = anio < anioActual ? leeSerieCache(id, anio) : null;
        if (cache) porActivo[id].push(...cache.points);
        else pendientes.push({ id, anio, ruta: `assets/${id}/series/${anio}` });
      }
    }
    if (pendientes.length) {
      const docs = await lote(pendientes.map((p) => p.ruta));
      for (const p of pendientes) {
        const serie = docs[p.ruta];
        if (!serie?.points) continue;
        porActivo[p.id].push(...serie.points);
        if (p.anio < anioActual) guardaSerieCache(p.id, p.anio, { points: serie.points });
      }
    }
    const desde = `${anioActual - ANIOS_VENTANA}${hoy.slice(4)}`;
    return alineaYRebasa(porActivo, { desde, hasta: hoy });
  }

  /* ── Desgloses ── */

  async function desgloseDe(id) {
    return lee(`assets/${id}/holdings/latest`);
  }

  async function desglosesDe(ids) {
    const rutas = ids.map((id) => `assets/${id}/holdings/latest`);
    const docs = await lote(rutas);
    const holdings = {};
    ids.forEach((id, i) => { holdings[id] = docs[rutas[i]] || null; });
    return { holdings };
  }

  /* ── Fachada con los nombres de las antiguas funciones ── */

  async function llama(nombre, datos = {}) {
    switch (nombre) {
      case 'search_assets': {
        const r = await buscaActivos(datos.query, { tipos: datos.types || null, limite: datos.limit || 12 });
        return { assets: r.activos, total_matches: r.total };
      }
      case 'get_asset_detail': return detalleActivo(datos.asset_id);
      case 'get_price_series': return seriesRebasadas(datos.asset_ids || []);
      case 'get_asset_holdings': return desgloseDe(datos.asset_id);
      case 'get_asset_holdings_batch': return desglosesDe(datos.asset_ids || []);
      default: throw errorNoDisponible(nombre);
    }
  }

  /* ── Sesión: no la hay. Los módulos preguntan; se les contesta lo mismo siempre. ── */

  async function sesion() { return { tipo: 'alfa' }; }
  function sesionActual() { return { tipo: 'alfa' }; }
  function nivelSesion() { return NIVEL_ALFA; }
  function cierraSesion() { return { tipo: 'alfa' }; }

  const noDisponible = (nombre) => async () => { throw errorNoDisponible(nombre); };

  return {
    llama, buscaActivos, sesion, sesionActual, nivelSesion, cierraSesion,
    creaCuenta: noDisponible('creaCuenta'),
    iniciaSesion: noDisponible('iniciaSesion'),
    recuperaContrasena: noDisponible('recuperaContrasena'),
    cambiaContrasena: noDisponible('cambiaContrasena'),
    pideCambioCorreo: noDisponible('pideCambioCorreo'),
    borraCuenta: noDisponible('borraCuenta'),
    guardaCarteraNube: noDisponible('guardaCarteraNube'),
    listaCarterasNube: noDisponible('listaCarterasNube'),
    leeCarteraNube: noDisponible('leeCarteraNube'),
    borraCarteraNube: noDisponible('borraCarteraNube'),
    detalleActivo, manifiesto, enCatalogo, seriesRebasadas,
  };
}

/** Cliente único del navegador (con caché de catálogo y series en localStorage). */
let clienteNavegador = null;
export function maestra() {
  if (!clienteNavegador) {
    clienteNavegador = creaClienteMaestra({
      almacen: typeof localStorage !== 'undefined' ? localStorage : null,
    });
  }
  return clienteNavegador;
}

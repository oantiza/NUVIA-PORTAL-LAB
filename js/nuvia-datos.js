/**
 * NUVIA — acceso de solo lectura a la base maestra (bases §6).
 *
 * El visitante obtiene una sesión anónima de Firebase (invisible para él) y
 * consulta las Cloud Functions de solo lectura de `bbdd-activos-financieros`:
 * search_assets, get_asset_detail, get_asset_holdings, get_price_series.
 * Nunca Firestore directo, nunca EODHD.
 *
 * Sin SDK: el protocolo de las funciones callable y de Identity Toolkit es
 * HTTP simple, y así la página estática no arrastra dependencias.
 *
 * `creaClienteMaestra` acepta inyección de fetch/almacén/reloj para poder
 * probar la lógica de sesión y caché sin red (docs/nuvia-datos.test.mjs).
 */

export const PROYECTO = {
  apiKey: 'AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg',
  region: 'europe-west1',
  id: 'bbdd-activos-financieros',
};

const CLAVE_SESION = 'nuvia.maestra-sesion.v1';
const MARGEN_CADUCIDAD_MS = 5 * 60_000; // renovar 5 min antes de caducar
const TTL_BUSQUEDA_MS = 10 * 60_000;

/** Etiqueta en castellano para los tipos de instrumento de la maestra. */
export function etiquetaTipo(tipo) {
  const mapa = {
    STOCK: 'Acción',
    FUND: 'Fondo',
    ETF: 'ETF',
    INDEX: 'Índice',
  };
  return mapa[String(tipo || '').toUpperCase()] || String(tipo || '—');
}

export function creaClienteMaestra({
  fetchFn = (...args) => fetch(...args),
  almacen = null,
  ahora = () => Date.now(),
  proyecto = PROYECTO,
} = {}) {
  const urlFuncion = (nombre) =>
    `https://${proyecto.region}-${proyecto.id}.cloudfunctions.net/${nombre}`;

  function leeSesion() {
    if (!almacen) return null;
    try {
      const s = JSON.parse(almacen.getItem(CLAVE_SESION) || 'null');
      if (s && s.idToken && s.refreshToken && s.caducaEn) return s;
    } catch { /* sesión ilegible: se crea una nueva */ }
    return null;
  }

  function guardaSesion(sesion) {
    if (!almacen) return;
    try { almacen.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch { /* sin persistencia */ }
  }

  async function pideJson(url, cuerpo, cabeceras = {}) {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabeceras },
      body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    });
    let json = null;
    try { json = await res.json(); } catch { /* cuerpo no JSON */ }
    return { ok: res.ok, status: res.status, json };
  }

  async function sesionNueva() {
    const { ok, json } = await pideJson(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${proyecto.apiKey}`, '{}');
    if (!ok || !json?.idToken) throw new Error('No se ha podido abrir la sesión de lectura.');
    return {
      idToken: json.idToken,
      refreshToken: json.refreshToken,
      caducaEn: ahora() + Number(json.expiresIn || 3600) * 1000,
    };
  }

  async function sesionRenovada(refreshToken) {
    const { ok, json } = await pideJson(
      `https://securetoken.googleapis.com/v1/token?key=${proyecto.apiKey}`,
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      { 'Content-Type': 'application/x-www-form-urlencoded' });
    if (!ok || !json?.id_token) return null; // la sesión caducada se sustituye por una nueva
    return {
      idToken: json.id_token,
      refreshToken: json.refresh_token || refreshToken,
      caducaEn: ahora() + Number(json.expires_in || 3600) * 1000,
    };
  }

  let sesionEnCurso = null;

  async function sesion() {
    const guardada = leeSesion();
    if (guardada && guardada.caducaEn - MARGEN_CADUCIDAD_MS > ahora()) return guardada;
    if (!sesionEnCurso) {
      sesionEnCurso = (async () => {
        let s = guardada ? await sesionRenovada(guardada.refreshToken) : null;
        if (!s) s = await sesionNueva();
        guardaSesion(s);
        return s;
      })();
      sesionEnCurso.finally(() => { sesionEnCurso = null; });
    }
    return sesionEnCurso;
  }

  /** Invoca una función callable y devuelve su `result`. Los errores llegan
   *  como excepción con el mensaje del servidor; nunca se inventa un dato. */
  async function llama(nombre, datos = {}) {
    const s = await sesion();
    const { ok, status, json } = await pideJson(urlFuncion(nombre), { data: datos }, {
      Authorization: `Bearer ${s.idToken}`,
    });
    if (!ok || json?.error) {
      const mensaje = json?.error?.message || `Error ${status} al consultar la base de datos.`;
      const error = new Error(mensaje);
      error.codigo = json?.error?.status || status;
      throw error;
    }
    return json?.result;
  }

  const cacheBusquedas = new Map(); // clave -> { promesa, caducaEn }

  /** Búsqueda en el catálogo por nombre, ticker o ISIN (search_assets). */
  function buscaActivos(consulta, { tipos = null, limite = 12 } = {}) {
    const clave = JSON.stringify([String(consulta || '').trim().toLowerCase(), tipos, limite]);
    const acierto = cacheBusquedas.get(clave);
    if (acierto && acierto.caducaEn > ahora()) return acierto.promesa;
    const promesa = llama('search_assets', {
      query: String(consulta || '').trim(),
      ...(tipos ? { types: tipos } : {}),
      limit: limite,
    }).then((r) => ({ activos: r?.assets || [], total: r?.total_matches ?? null }));
    cacheBusquedas.set(clave, { promesa, caducaEn: ahora() + TTL_BUSQUEDA_MS });
    promesa.catch(() => cacheBusquedas.delete(clave)); // los errores no se cachean
    return promesa;
  }

  return { llama, buscaActivos, sesion };
}

/** Cliente único del navegador (con persistencia de sesión en localStorage). */
let clienteNavegador = null;
export function maestra() {
  if (!clienteNavegador) {
    clienteNavegador = creaClienteMaestra({
      almacen: typeof localStorage !== 'undefined' ? localStorage : null,
    });
  }
  return clienteNavegador;
}

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
 *
 * Paso 28 (registro con datos mínimos): la misma sesión puede pasar de
 * anónima a registrada enlazando correo y contraseña — y nada más — con
 * `accounts:signUp` + idToken, que conserva el mismo usuario. Identity
 * Toolkit rechaza aquí la vía `accounts:update` («verify the new email»),
 * comprobado contra el proyecto real el 19-08-2026.
 */

export const PROYECTO = {
  apiKey: 'AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg',
  region: 'europe-west1',
  id: 'bbdd-activos-financieros',
};

const CLAVE_SESION = 'nuvia.maestra-sesion.v1';
const MARGEN_CADUCIDAD_MS = 5 * 60_000; // renovar 5 min antes de caducar
const TTL_BUSQUEDA_MS = 10 * 60_000;

/** Marcador de suscripción por cuenta. Lo escribirá la pasarela de pago
 *  (guía, paso 35); hasta entonces nadie lo tiene y el nivel suscriptor
 *  queda descrito pero cerrado. */
export const CLAVE_SUSCRIPCION = 'nuvia.suscripcion.v1';

/** Cuentas del administrador del portal: con la sesión iniciada reciben el
 *  nivel administrativo explícito, con todos los módulos de la interfaz y
 *  sin límites comerciales. La base maestra permanece en solo lectura. */
export const CORREOS_ADMIN = ['oantiza@gmail.com'];

/** ¿Es este correo una cuenta del administrador? Pura y probada. */
export function esAdmin(correo) {
  return CORREOS_ADMIN.includes(String(correo || '').trim().toLowerCase());
}

/** ¿Tiene suscripción activa esta cuenta? Pura y probada: silencio = no. */
export function leeSuscripcion(almacen, correo) {
  if (!almacen || !correo) return false;
  try {
    const mapa = JSON.parse(almacen.getItem(CLAVE_SUSCRIPCION) || 'null');
    return mapa?.[String(correo).trim().toLowerCase()]?.activa === true;
  } catch {
    return false;
  }
}

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

  const urlCuentas = (accion) =>
    `https://identitytoolkit.googleapis.com/v1/accounts:${accion}?key=${proyecto.apiKey}`;

  async function sesionNueva() {
    const { ok, json } = await pideJson(urlCuentas('signUp'), '{}');
    if (!ok || !json?.idToken) throw new Error('No se ha podido abrir la sesión de lectura.');
    return {
      tipo: 'anonima',
      idToken: json.idToken,
      refreshToken: json.refreshToken,
      caducaEn: ahora() + Number(json.expiresIn || 3600) * 1000,
    };
  }

  async function sesionRenovada(guardada) {
    const { ok, json } = await pideJson(
      `https://securetoken.googleapis.com/v1/token?key=${proyecto.apiKey}`,
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(guardada.refreshToken)}`,
      { 'Content-Type': 'application/x-www-form-urlencoded' });
    if (!ok || !json?.id_token) return null; // la sesión caducada se sustituye por una nueva
    return {
      tipo: guardada.tipo || 'anonima',
      ...(guardada.correo ? { correo: guardada.correo } : {}),
      idToken: json.id_token,
      refreshToken: json.refresh_token || guardada.refreshToken,
      caducaEn: ahora() + Number(json.expires_in || 3600) * 1000,
    };
  }

  let sesionEnCurso = null;

  async function sesion() {
    const guardada = leeSesion();
    if (guardada && guardada.caducaEn - MARGEN_CADUCIDAD_MS > ahora()) return guardada;
    if (!sesionEnCurso) {
      sesionEnCurso = (async () => {
        let s = guardada ? await sesionRenovada(guardada) : null;
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

  /* ── Cuenta con datos mínimos: correo y contraseña, nada más (paso 28) ── */

  /** Mensajes en llano para los códigos de Identity Toolkit. */
  function errorDeCuenta(json, status) {
    const codigo = String(json?.error?.message || '');
    let texto;
    if (codigo.startsWith('EMAIL_EXISTS')) {
      texto = 'Ya existe una cuenta con ese correo. Puedes iniciar sesión con él.';
    } else if (/^(INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD)/.test(codigo)) {
      texto = 'El correo o la contraseña no coinciden con ninguna cuenta.';
    } else if (codigo.startsWith('WEAK_PASSWORD')) {
      texto = 'La contraseña necesita al menos 6 caracteres.';
    } else if (/^(INVALID_EMAIL|MISSING_EMAIL)/.test(codigo)) {
      texto = 'Ese correo no parece una dirección válida.';
    } else if (codigo.startsWith('TOO_MANY_ATTEMPTS')) {
      texto = 'Demasiados intentos seguidos. Espera unos minutos antes de repetirlo.';
    } else if (codigo.startsWith('CREDENTIAL_TOO_OLD_LOGIN_AGAIN')) {
      texto = 'Por seguridad, esta operación pide una sesión reciente: cierra sesión, vuelve a entrar y repítela.';
    } else if (codigo.startsWith('OPERATION_NOT_ALLOWED')) {
      texto = 'El proveedor de cuentas no permite esa operación tal cual; si era un cambio de correo, llega por el enlace de verificación.';
    } else {
      texto = `No se ha podido completar la operación (${codigo || `error ${status}`}).`;
    }
    const error = new Error(texto);
    error.codigo = codigo || status;
    return error;
  }

  function guardaSesionRegistrada(json) {
    const s = {
      tipo: 'registrada',
      correo: json.email || '',
      idToken: json.idToken,
      refreshToken: json.refreshToken,
      caducaEn: ahora() + Number(json.expiresIn || 3600) * 1000,
    };
    guardaSesion(s);
    return { tipo: s.tipo, correo: s.correo };
  }

  /** Estado de la sesión tal y como debe contarse: tipo y, si la hay, correo. */
  function sesionActual() {
    const s = leeSesion();
    if (s?.tipo === 'registrada') return { tipo: 'registrada', correo: s.correo || '' };
    return { tipo: 'anonima' };
  }

  /** Nivel de la sesión para la interfaz: visitante, registrada, suscriptor
   *  o administrador. El administrador se reconoce antes que cualquier
   *  marcador comercial. */
  function nivelSesion() {
    const s = sesionActual();
    if (s.tipo !== 'registrada') return 'visitante';
    if (esAdmin(s.correo)) return 'admin';
    return leeSuscripcion(almacen, s.correo) ? 'suscriptor' : 'registrada';
  }

  /** Crea la cuenta enlazando correo y contraseña a la sesión de lectura ya
   *  abierta (mismo usuario antes y después; `accounts:signUp` con idToken). */
  async function creaCuenta(correo, contrasena) {
    const s = await sesion();
    const { ok, status, json } = await pideJson(urlCuentas('signUp'), {
      idToken: s.idToken,
      email: String(correo || '').trim(),
      password: String(contrasena || ''),
      returnSecureToken: true,
    });
    if (!ok || !json?.idToken) throw errorDeCuenta(json, status);
    return guardaSesionRegistrada(json);
  }

  /** Inicia sesión con una cuenta ya creada. */
  async function iniciaSesion(correo, contrasena) {
    const { ok, status, json } = await pideJson(urlCuentas('signInWithPassword'), {
      email: String(correo || '').trim(),
      password: String(contrasena || ''),
      returnSecureToken: true,
    });
    if (!ok || !json?.idToken) throw errorDeCuenta(json, status);
    return guardaSesionRegistrada(json);
  }

  /** Cierra la sesión: se olvida aquí mismo; la siguiente consulta abre una
   *  sesión de lectura anónima nueva. */
  function cierraSesion() {
    if (almacen) { try { almacen.removeItem(CLAVE_SESION); } catch { /* sin persistencia */ } }
    return { tipo: 'anonima' };
  }

  /** Pide a Firebase el correo de restablecimiento de contraseña. */
  async function recuperaContrasena(correo) {
    const { ok, status, json } = await pideJson(urlCuentas('sendOobCode'), {
      requestType: 'PASSWORD_RESET',
      email: String(correo || '').trim(),
    });
    if (!ok) throw errorDeCuenta(json, status);
    return { enviado: true };
  }

  /* ── Derechos sobre la cuenta (paso 34, RGPD) ── */

  /** Rectificación inmediata de la contraseña de la sesión iniciada. */
  async function cambiaContrasena(nueva) {
    const s = await sesion();
    const { ok, status, json } = await pideJson(urlCuentas('update'), {
      idToken: s.idToken,
      password: String(nueva || ''),
      returnSecureToken: true,
    });
    if (!ok || !json?.idToken) throw errorDeCuenta(json, status);
    return guardaSesionRegistrada(json);
  }

  /** Rectificación del correo: Firebase exige verificar el correo nuevo, así
   *  que se pide el enlace de verificación (VERIFY_AND_CHANGE_EMAIL) y el
   *  cambio se completa cuando el titular lo confirma. Autoservicio íntegro. */
  async function pideCambioCorreo(nuevoCorreo) {
    const s = await sesion();
    const { ok, status, json } = await pideJson(urlCuentas('sendOobCode'), {
      requestType: 'VERIFY_AND_CHANGE_EMAIL',
      idToken: s.idToken,
      newEmail: String(nuevoCorreo || '').trim(),
    });
    if (!ok) throw errorDeCuenta(json, status);
    return { enviado: true };
  }

  /** Supresión de la cuenta en el proveedor. Las carteras se borran antes,
   *  una a una, desde la capa de arriba; aquí solo cae la cuenta y se olvida
   *  la sesión local. */
  async function borraCuenta() {
    const s = await sesion();
    const { ok, status, json } = await pideJson(urlCuentas('delete'), { idToken: s.idToken });
    if (!ok) throw errorDeCuenta(json, status);
    cierraSesion();
    return { borrada: true };
  }

  /* ── Carteras en la nube (paso 30) ──
   *  Las funciones callable son app-owned y aisladas por UID: cada cuenta ve
   *  solo las suyas. Se guarda lo mínimo —qué activos y con qué peso—; el
   *  cálculo no se persiste, se rehace al abrir. */

  /** Guarda (o reemplaza, si trae portfolio_id) una cartera. Devuelve el
   *  resultado con el portfolio_id asignado. */
  function guardaCarteraNube(cartera) {
    return llama('save_portfolio', cartera);
  }

  /** Lista las carteras de la cuenta, ya ordenadas por fecha (más reciente
   *  primero). */
  async function listaCarterasNube() {
    const r = await llama('list_portfolios', {});
    return r?.portfolios || [];
  }

  /** Lee una cartera concreta (identificadores y pesos). */
  function leeCarteraNube(portfolioId) {
    return llama('get_portfolio', { portfolio_id: portfolioId });
  }

  /** Borra una cartera de la cuenta. Devuelve { ok }. */
  function borraCarteraNube(portfolioId) {
    return llama('delete_portfolio', { portfolio_id: portfolioId });
  }

  /** Ficha de un activo para reconstruir nombre, tipo y clase al abrir una
   *  cartera guardada (get_asset_detail). */
  function detalleActivo(assetId) {
    return llama('get_asset_detail', { asset_id: assetId });
  }

  return {
    llama, buscaActivos, sesion,
    sesionActual, nivelSesion, creaCuenta, iniciaSesion, cierraSesion, recuperaContrasena,
    cambiaContrasena, pideCambioCorreo, borraCuenta,
    guardaCarteraNube, listaCarterasNube, leeCarteraNube, borraCarteraNube, detalleActivo,
  };
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

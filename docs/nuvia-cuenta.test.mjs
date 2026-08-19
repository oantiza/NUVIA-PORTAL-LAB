/**
 * Batería de verificación del registro con datos mínimos (paso 28).
 *
 * Sin red: fetch falso que imita Identity Toolkit. Se comprueba que crear la
 * cuenta enlaza correo y contraseña a la sesión anónima ya abierta (mismo
 * usuario: el enlace viaja con el idToken anónimo), que iniciar y cerrar
 * sesión hacen lo que dicen, que la renovación de token conserva quién eres,
 * y que los errores de Firebase llegan en llano.
 *
 *   node docs/nuvia-cuenta.test.mjs
 */
import { creaClienteMaestra } from '../js/nuvia-datos.js';
import {
  NOTA_DATOS_MINIMOS, NOTA_QUE_APORTA,
  CONSENTIMIENTOS, leeConsentimientos, cambiaConsentimiento,
} from '../js/nuvia-cuenta.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

function almacenFalso() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    tamano: () => m.size,
  };
}

/** fetch falso de Identity Toolkit: altas anónimas, enlaces, login, oob. */
function fetchFalso({ errores = {} } = {}) {
  const llamadas = { altas: 0, enlaces: 0, logins: 0, oob: 0, renovaciones: 0, funciones: 0, cuerpos: [] };
  const fn = async (url, opciones) => {
    const respuesta = (json, ok = true, status = 200) => ({ ok, status, json: async () => json });
    const rechazo = (message) => respuesta({ error: { message, code: 400 } }, false, 400);
    const cuerpo = opciones?.body && opciones.body !== '{}' && !url.includes('securetoken')
      ? JSON.parse(opciones.body) : null;
    llamadas.cuerpos.push({ url, cuerpo });
    if (url.includes('accounts:signUp')) {
      if (cuerpo?.idToken) {
        llamadas.enlaces += 1;
        if (errores.enlace) return rechazo(errores.enlace);
        return respuesta({
          idToken: `token-enlazado-${llamadas.enlaces}`, refreshToken: 'refresco-reg',
          email: cuerpo.email, expiresIn: '3600', localId: 'uid-1',
        });
      }
      llamadas.altas += 1;
      return respuesta({ idToken: `token-anon-${llamadas.altas}`, refreshToken: 'refresco-anon', expiresIn: '3600', localId: 'uid-1' });
    }
    if (url.includes('accounts:signInWithPassword')) {
      llamadas.logins += 1;
      if (errores.login) return rechazo(errores.login);
      return respuesta({ idToken: 'token-login-1', refreshToken: 'refresco-login', email: cuerpo.email, expiresIn: '3600', localId: 'uid-1' });
    }
    if (url.includes('accounts:sendOobCode')) {
      llamadas.oob += 1;
      if (errores.oob) return rechazo(errores.oob);
      return respuesta({ email: cuerpo.email });
    }
    if (url.includes('securetoken')) {
      llamadas.renovaciones += 1;
      return respuesta({ id_token: `token-renovado-${llamadas.renovaciones}`, refresh_token: 'refresco-2', expires_in: '3600' });
    }
    llamadas.funciones += 1;
    return respuesta({ result: { assets: [], total_matches: 0 } });
  };
  return { fn, llamadas };
}

console.log('— Crear cuenta = enlazar a la sesión anónima (mismo usuario) —');
{
  let reloj = 1_000_000;
  const { fn, llamadas } = fetchFalso();
  const almacen = almacenFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen, ahora: () => reloj });

  comprueba('Sin sesión guardada, la cuenta se cuenta como anónima', cliente.sesionActual().tipo === 'anonima');

  await cliente.llama('search_assets', { query: 'a' }); // el visitante ya usó el buscador
  const s = await cliente.creaCuenta('prueba@nuvia.example', 'secreta9');
  comprueba('Devuelve tipo registrada y el correo', s.tipo === 'registrada' && s.correo === 'prueba@nuvia.example');
  const enlace = llamadas.cuerpos.find((c) => c.cuerpo?.idToken);
  comprueba('El alta viaja con el idToken de la sesión anónima (conserva el usuario)',
    llamadas.altas === 1 && llamadas.enlaces === 1 && enlace.cuerpo.idToken === 'token-anon-1');
  comprueba('sesionActual refleja la cuenta', cliente.sesionActual().correo === 'prueba@nuvia.example');

  await cliente.llama('search_assets', { query: 'b' });
  const ultima = llamadas.cuerpos.at(-1);
  comprueba('Las consultas siguientes usan el token registrado, sin alta nueva',
    llamadas.altas === 1 && llamadas.funciones === 2 && ultima.url.includes('cloudfunctions'));

  reloj += 3_600_000; // caduca el token
  await cliente.llama('search_assets', { query: 'c' });
  comprueba('La renovación de token conserva tipo y correo',
    llamadas.renovaciones === 1 && cliente.sesionActual().tipo === 'registrada'
    && cliente.sesionActual().correo === 'prueba@nuvia.example');

  const fuera = cliente.cierraSesion();
  comprueba('Cerrar sesión la olvida de verdad', fuera.tipo === 'anonima'
    && cliente.sesionActual().tipo === 'anonima' && almacen.tamano() === 0);
  await cliente.llama('search_assets', { query: 'd' });
  comprueba('Tras cerrar, la siguiente consulta abre una sesión anónima nueva', llamadas.altas === 2);
}

console.log('\n— Iniciar sesión y recuperar contraseña —');
{
  const { fn, llamadas } = fetchFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => 1 });
  const s = await cliente.iniciaSesion('  prueba@nuvia.example  ', 'secreta9');
  comprueba('Inicia sesión con signInWithPassword y recorta el correo',
    llamadas.logins === 1 && s.tipo === 'registrada' && s.correo === 'prueba@nuvia.example');

  await cliente.recuperaContrasena('prueba@nuvia.example');
  const oob = llamadas.cuerpos.find((c) => c.url.includes('sendOobCode'));
  comprueba('La recuperación pide el correo de restablecimiento (PASSWORD_RESET)',
    llamadas.oob === 1 && oob.cuerpo.requestType === 'PASSWORD_RESET');
}

console.log('\n— Errores en llano, nunca códigos a secas —');
{
  const casos = [
    ['enlace', 'EMAIL_EXISTS', 'Ya existe una cuenta'],
    ['enlace', 'WEAK_PASSWORD : Password should be at least 6 characters', 'al menos 6 caracteres'],
    ['enlace', 'INVALID_EMAIL', 'no parece una dirección válida'],
    ['login', 'INVALID_LOGIN_CREDENTIALS', 'no coinciden con ninguna cuenta'],
    ['login', 'EMAIL_NOT_FOUND', 'no coinciden con ninguna cuenta'],
    ['login', 'TOO_MANY_ATTEMPTS_TRY_LATER', 'Demasiados intentos'],
    ['oob', 'CODIGO_DESCONOCIDO', 'No se ha podido completar la operación'],
  ];
  for (const [donde, codigo, esperado] of casos) {
    const { fn } = fetchFalso({ errores: { [donde]: codigo } });
    const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => 1 });
    let mensaje = '';
    try {
      if (donde === 'enlace') await cliente.creaCuenta('a@b.c', 'x');
      else if (donde === 'login') await cliente.iniciaSesion('a@b.c', 'x');
      else await cliente.recuperaContrasena('a@b.c');
    } catch (e) { mensaje = e.message; }
    comprueba(`${codigo} → «${esperado}…»`, mensaje.includes(esperado), mensaje);
  }
  {
    const { fn } = fetchFalso({ errores: { login: 'INVALID_LOGIN_CREDENTIALS' } });
    const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => 1 });
    let seguia = null;
    try { await cliente.iniciaSesion('a@b.c', 'x'); } catch { seguia = cliente.sesionActual(); }
    comprueba('Un login fallido no toca la sesión de lectura', seguia?.tipo === 'anonima');
  }
}

console.log('\n— Los textos del bloque dicen lo mínimo y lo dicen claro —');
{
  comprueba('Declara los datos mínimos: correo y contraseña, nada más',
    NOTA_DATOS_MINIMOS.includes('correo y contraseña')
    && NOTA_DATOS_MINIMOS.includes('Sin teléfono, sin datos de patrimonio'));
  comprueba('Es honesto sobre el presente: iniciar sesión aún no cambia la página',
    NOTA_QUE_APORTA.includes('no cambia lo que ves'));
  comprueba('Describe sin aconsejar (sin «mejor/recomendado/óptimo/conviene/deberías/ideal»)',
    !/mejor|recomendad|óptim|conviene|deberías|ideal/i.test(NOTA_DATOS_MINIMOS + NOTA_QUE_APORTA));
}

console.log('\n— Consentimiento granular: lo opcional es opt-in (paso 29) —');
{
  const almacen = almacenFalso();
  const correo = 'Persona@Nuvia.Example';
  const inicial = leeConsentimientos(almacen, correo);
  comprueba('Lo necesario está siempre activo y marcado como tal',
    inicial.servicio.activo === true && inicial.servicio.necesario === true);
  comprueba('Lo opcional arranca apagado si nadie lo ha tocado',
    inicial.comunicaciones.activo === false && inicial.comportamiento.activo === false);
  comprueba('Sin decisión previa, lo opcional no trae fecha',
    inicial.comunicaciones.fecha === null);

  const d = cambiaConsentimiento(almacen, correo, 'comunicaciones', true, () => '2026-08-19T10:00:00Z');
  comprueba('Activar un opcional lo enciende y apunta la fecha',
    d.activo === true && d.fecha === '2026-08-19T10:00:00Z');
  const trasActivar = leeConsentimientos(almacen, correo);
  comprueba('…y queda persistido', trasActivar.comunicaciones.activo === true
    && trasActivar.comunicaciones.fecha === '2026-08-19T10:00:00Z');

  comprueba('El correo se normaliza (mayúsculas/minúsculas dan la misma cuenta)',
    leeConsentimientos(almacen, 'persona@nuvia.example').comunicaciones.activo === true);

  const revoca = cambiaConsentimiento(almacen, correo, 'comunicaciones', false, () => '2026-08-20T09:00:00Z');
  comprueba('Revocar apaga y vuelve a apuntar la fecha del cambio',
    revoca.activo === false && revoca.fecha === '2026-08-20T09:00:00Z'
    && leeConsentimientos(almacen, correo).comunicaciones.activo === false);

  comprueba('Lo necesario no se puede cambiar desde aquí (no es una elección)',
    cambiaConsentimiento(almacen, correo, 'servicio', false).motivo === 'necesario'
    && leeConsentimientos(almacen, correo).servicio.activo === true);
  comprueba('Una clave desconocida se rechaza',
    cambiaConsentimiento(almacen, correo, 'inventada', true).motivo === 'desconocido');

  comprueba('Las cuentas no comparten permisos',
    leeConsentimientos(almacen, 'otra@nuvia.example').comunicaciones.activo === false);

  const opcionales = CONSENTIMIENTOS.filter((c) => !c.necesario);
  comprueba('Hay al menos comunicaciones y análisis de uso como opcionales',
    opcionales.some((c) => c.clave === 'comunicaciones') && opcionales.some((c) => c.clave === 'comportamiento'));
  comprueba('Cada consentimiento explica su porqué antes de la casilla',
    CONSENTIMIENTOS.every((c) => typeof c.explica === 'string' && c.explica.length > 20));
  comprueba('El análisis de uso declara que apagado no registra nada',
    CONSENTIMIENTOS.find((c) => c.clave === 'comportamiento').explica.includes('no se registrará nunca'));
  comprueba('Los textos de consentimiento describen sin aconsejar',
    !CONSENTIMIENTOS.some((c) => /mejor|recomendad|óptim|conviene|deberías|ideal para/i.test(c.explica + c.nombre)));
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: registro con datos mínimos (paso 28) y consentimiento granular (paso 29).');

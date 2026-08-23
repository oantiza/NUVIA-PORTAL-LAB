/**
 * Batería de verificación de js/nuvia-datos.js (paso 19).
 *
 * Sin red: se inyecta un fetch falso y se comprueba la lógica de sesión
 * anónima (alta, caché, renovación) y la caché de búsquedas.
 *
 *   node docs/nuvia-datos.test.mjs
 */
import { creaClienteMaestra, etiquetaTipo, leeSuscripcion, esAdmin, CLAVE_SUSCRIPCION } from '../js/nuvia-datos.js';

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
  };
}

/** fetch falso: cuenta llamadas por host y responde según la URL. */
function fetchFalso({ resultadoBusqueda } = {}) {
  const llamadas = { alta: 0, renovacion: 0, funcion: 0, cuerposFuncion: [] };
  const fn = async (url, opciones) => {
    const respuesta = (json, ok = true, status = 200) => ({
      ok, status, json: async () => json,
    });
    if (url.includes('accounts:signUp')) {
      llamadas.alta += 1;
      return respuesta({ idToken: `token-alta-${llamadas.alta}`, refreshToken: 'refresco-1', expiresIn: '3600' });
    }
    if (url.includes('securetoken')) {
      llamadas.renovacion += 1;
      return respuesta({ id_token: `token-renovado-${llamadas.renovacion}`, refresh_token: 'refresco-2', expires_in: '3600' });
    }
    llamadas.funcion += 1;
    llamadas.cuerposFuncion.push(JSON.parse(opciones.body));
    if (url.endsWith('/falla_siempre')) {
      return respuesta({ error: { message: 'Necesitas iniciar sesion.', status: 'UNAUTHENTICATED' } }, false, 401);
    }
    return respuesta({ result: resultadoBusqueda ?? { assets: [{ asset_id: 'ES0178430E18', display_name: 'Telefonica' }], total_matches: 1 } });
  };
  return { fn, llamadas };
}

console.log('— Sesión anónima —');
{
  let reloj = 1_000_000;
  const { fn, llamadas } = fetchFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => reloj });
  await cliente.llama('search_assets', { query: 'a' });
  await cliente.llama('search_assets', { query: 'b' });
  comprueba('Dos llamadas seguidas comparten una sola alta de sesión', llamadas.alta === 1 && llamadas.funcion === 2,
    `altas=${llamadas.alta} funciones=${llamadas.funcion}`);
  comprueba('La llamada callable envía {data: …}', llamadas.cuerposFuncion[0].data.query === 'a');

  reloj += 3_600_000; // el token caducó
  await cliente.llama('search_assets', { query: 'c' });
  comprueba('Token caducado → se renueva con el refresh_token, sin alta nueva',
    llamadas.renovacion === 1 && llamadas.alta === 1);
}

{
  const { fn } = fetchFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => 1 });
  let mensaje = null;
  try { await cliente.llama('falla_siempre'); } catch (e) { mensaje = e.message; }
  comprueba('Un error del servidor llega como excepción con su mensaje, nunca como dato',
    mensaje === 'Necesitas iniciar sesion.');
}

console.log('\n— Caché de búsquedas —');
{
  let reloj = 1_000_000;
  const { fn, llamadas } = fetchFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen: almacenFalso(), ahora: () => reloj });
  const a = await cliente.buscaActivos('telefonica');
  await cliente.buscaActivos('telefonica');
  comprueba('La misma consulta dentro del TTL dispara una sola llamada', llamadas.funcion === 1);
  comprueba('El resultado expone activos y total', a.activos.length === 1 && a.total === 1);
  reloj += 11 * 60_000; // pasa el TTL de 10 minutos
  await cliente.buscaActivos('telefonica');
  comprueba('Pasado el TTL vuelve a consultarse', llamadas.funcion === 2);
  await cliente.buscaActivos('TELEFONICA  ');
  comprueba('Mayúsculas y espacios no rompen la clave de caché', llamadas.funcion === 2);
}

console.log('\n— Carteras en la nube (paso 30) —');
{
  const registro = { llamada: [] };
  const fnNube = async (url, opciones) => {
    const respuesta = (json, ok = true, status = 200) => ({ ok, status, json: async () => json });
    if (url.includes('accounts:signUp')) return respuesta({ idToken: 't', refreshToken: 'r', expiresIn: '3600' });
    const cuerpo = JSON.parse(opciones.body);
    const fn = url.split('/').pop();
    registro.llamada.push({ fn, data: cuerpo.data });
    if (fn === 'save_portfolio') return respuesta({ result: { portfolio_id: 'pid-9', portfolio: cuerpo.data, warnings: [] } });
    if (fn === 'list_portfolios') return respuesta({ result: { portfolios: [{ portfolio_id: 'pid-9', name: 'Nube', positions: [{ asset_id: 'A', weight_percent: 100 }] }], count: 1 } });
    if (fn === 'get_portfolio') return respuesta({ result: { portfolio_id: cuerpo.data.portfolio_id, name: 'Nube', positions: [{ asset_id: 'A', weight_percent: 100 }] } });
    if (fn === 'delete_portfolio') return respuesta({ result: { ok: true } });
    if (fn === 'get_asset_detail') return respuesta({ result: { asset_id: cuerpo.data.asset_id, instrument_type: 'STOCK', economic_asset_class: 'EQUITY', identity: { display_name: 'Alfa' } } });
    return respuesta({ result: {} });
  };
  const cliente = creaClienteMaestra({ fetchFn: fnNube, almacen: almacenFalso(), ahora: () => 1 });

  const guardada = await cliente.guardaCarteraNube({ name: 'Nube', base_currency: 'EUR', positions: [{ asset_id: 'A', weight_percent: 100 }] });
  comprueba('guardaCarteraNube llama a save_portfolio y devuelve el portfolio_id',
    registro.llamada.at(-1).fn === 'save_portfolio' && guardada.portfolio_id === 'pid-9');
  comprueba('El cuerpo guardado no arrastra datos maestros (solo asset_id y weight_percent)',
    registro.llamada.at(-1).data.positions.every((p) => Object.keys(p).sort().join(',') === 'asset_id,weight_percent'));

  const lista = await cliente.listaCarterasNube();
  comprueba('listaCarterasNube devuelve el array de portfolios', Array.isArray(lista) && lista[0].name === 'Nube');

  const leida = await cliente.leeCarteraNube('pid-9');
  comprueba('leeCarteraNube pide get_portfolio con el id', registro.llamada.at(-1).fn === 'get_portfolio'
    && registro.llamada.at(-1).data.portfolio_id === 'pid-9' && leida.positions[0].asset_id === 'A');

  const borrada = await cliente.borraCarteraNube('pid-9');
  comprueba('borraCarteraNube llama a delete_portfolio y devuelve ok', registro.llamada.at(-1).fn === 'delete_portfolio' && borrada.ok === true);

  const ficha = await cliente.detalleActivo('A');
  comprueba('detalleActivo trae nombre, tipo y clase para reconstruir al abrir',
    ficha.identity.display_name === 'Alfa' && ficha.instrument_type === 'STOCK' && ficha.economic_asset_class === 'EQUITY');
}

console.log('\n— Derechos sobre la cuenta (paso 34) —');
{
  const registro = [];
  const fnDerechos = async (url, opciones) => {
    const respuesta = (json, ok = true, status = 200) => ({ ok, status, json: async () => json });
    const cuerpo = JSON.parse(opciones.body);
    if (url.includes('accounts:signInWithPassword')) return respuesta({ idToken: 't1', refreshToken: 'r', email: cuerpo.email, expiresIn: '3600' });
    if (url.includes('accounts:update')) { registro.push({ accion: 'update', cuerpo }); return respuesta({ idToken: 't2', refreshToken: 'r2', email: 'ana@ejemplo.com', expiresIn: '3600' }); }
    if (url.includes('accounts:sendOobCode')) { registro.push({ accion: 'oob', cuerpo }); return respuesta({ email: cuerpo.newEmail }); }
    if (url.includes('accounts:delete')) { registro.push({ accion: 'delete', cuerpo }); return respuesta({}); }
    return respuesta({ result: {} });
  };
  const mapa = new Map();
  const almacen = { getItem: (k) => (mapa.has(k) ? mapa.get(k) : null), setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k) };
  const cliente = creaClienteMaestra({ fetchFn: fnDerechos, almacen, ahora: () => 1 });
  await cliente.iniciaSesion('ana@ejemplo.com', 'secreta9');

  await cliente.cambiaContrasena('nueva123');
  comprueba('cambiaContrasena pega en accounts:update con la contraseña y el idToken',
    registro.at(-1).accion === 'update' && registro.at(-1).cuerpo.password === 'nueva123' && registro.at(-1).cuerpo.idToken === 't1');
  comprueba('…y la sesión guarda los tokens nuevos sin perder tipo ni correo',
    cliente.sesionActual().tipo === 'registrada' && JSON.parse(mapa.get('nuvia.maestra-sesion.v1')).idToken === 't2');

  await cliente.pideCambioCorreo('  Ana.Nueva@Ejemplo.com ');
  comprueba('pideCambioCorreo pide el enlace VERIFY_AND_CHANGE_EMAIL con el correo nuevo',
    registro.at(-1).accion === 'oob' && registro.at(-1).cuerpo.requestType === 'VERIFY_AND_CHANGE_EMAIL'
    && registro.at(-1).cuerpo.newEmail === 'Ana.Nueva@Ejemplo.com' && registro.at(-1).cuerpo.idToken === 't2');

  const borrado = await cliente.borraCuenta();
  comprueba('borraCuenta pega en accounts:delete con el idToken y olvida la sesión local',
    registro.at(-1).accion === 'delete' && registro.at(-1).cuerpo.idToken === 't2'
    && borrado.borrada === true && cliente.sesionActual().tipo === 'anonima'
    && !mapa.has('nuvia.maestra-sesion.v1'));
}

console.log('\n— Etiquetas de tipo —');
comprueba('STOCK → Acción', etiquetaTipo('STOCK') === 'Acción');
comprueba('FUND → Fondo', etiquetaTipo('FUND') === 'Fondo');
comprueba('Tipo desconocido se muestra tal cual, no se inventa', etiquetaTipo('BOND') === 'BOND');
comprueba('Sin tipo → «—»', etiquetaTipo(null) === '—');

console.log('\n— Suscripción (marcador del paso 35, leído desde el paso 33) —');
{
  const mapa = new Map();
  const almacen = {
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => mapa.set(k, String(v)),
    removeItem: (k) => mapa.delete(k),
  };
  comprueba('Sin marcador, nadie es suscriptor (silencio = no)',
    leeSuscripcion(almacen, 'ana@ejemplo.com') === false);
  almacen.setItem(CLAVE_SUSCRIPCION, JSON.stringify({ 'ana@ejemplo.com': { activa: true, desde: '2026-08-19' } }));
  comprueba('Con marcador activo, la cuenta es suscriptora (correo normalizado)',
    leeSuscripcion(almacen, ' Ana@Ejemplo.com ') === true);
  comprueba('Otra cuenta no hereda la suscripción',
    leeSuscripcion(almacen, 'otro@ejemplo.com') === false);
  almacen.setItem(CLAVE_SUSCRIPCION, '{esto no es json');
  comprueba('Marcador ilegible → no suscriptor, sin romper',
    leeSuscripcion(almacen, 'ana@ejemplo.com') === false);
  comprueba('Sin almacén o sin correo → no', leeSuscripcion(null, 'a@b.c') === false && leeSuscripcion(almacen, '') === false);

  const cliente = creaClienteMaestra({ almacen, fetchFn: async () => ({ ok: true, status: 200, json: async () => ({}) }) });
  comprueba('nivelSesion: sin sesión registrada → visitante', cliente.nivelSesion() === 'visitante');

  /* Cuenta del administrador: nivel completo con la sesión iniciada,
     sin marcador de suscripción (la pasarela sigue aplazada). */
  comprueba('esAdmin: el correo del administrador, normalizado',
    esAdmin(' OAntiza@Gmail.com ') === true && esAdmin('otro@ejemplo.com') === false
    && esAdmin('') === false && esAdmin(null) === false);
  const sesionFalsa = (correo) => JSON.stringify({
    tipo: 'registrada', correo, idToken: 't', refreshToken: 'r', caducaEn: Date.now() + 3_600_000,
  });
  almacen.setItem('nuvia.maestra-sesion.v1', sesionFalsa('oantiza@gmail.com'));
  almacen.removeItem(CLAVE_SUSCRIPCION);
  comprueba('nivelSesion: la cuenta del administrador tiene nivel propio sin marcador',
    cliente.nivelSesion() === 'admin');
  almacen.setItem('nuvia.maestra-sesion.v1', sesionFalsa('otro@ejemplo.com'));
  comprueba('nivelSesion: cualquier otra cuenta sigue en registrada',
    cliente.nivelSesion() === 'registrada');
  almacen.removeItem('nuvia.maestra-sesion.v1');
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nBatería completa: todo en orden.');

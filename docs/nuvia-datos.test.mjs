/**
 * Batería de verificación de js/nuvia-datos.js (paso 19).
 *
 * Sin red: se inyecta un fetch falso y se comprueba la lógica de sesión
 * anónima (alta, caché, renovación) y la caché de búsquedas.
 *
 *   node docs/nuvia-datos.test.mjs
 */
import { creaClienteMaestra, etiquetaTipo } from '../js/nuvia-datos.js';

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

console.log('\n— Etiquetas de tipo —');
comprueba('STOCK → Acción', etiquetaTipo('STOCK') === 'Acción');
comprueba('FUND → Fondo', etiquetaTipo('FUND') === 'Fondo');
comprueba('Tipo desconocido se muestra tal cual, no se inventa', etiquetaTipo('BOND') === 'BOND');
comprueba('Sin tipo → «—»', etiquetaTipo(null) === '—');

if (fallos) {
  console.error(`\n${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nBatería completa: todo en orden.');

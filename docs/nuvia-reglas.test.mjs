/**
 * Reglas de Firestore de la alfa (firestore.rules), probadas contra el
 * proyecto real nuvia-family-wealth SIN credenciales, tal y como las ve el
 * navegador de cualquier visitante:
 *
 *   1. lectura pública de los datos de mercado (assets, catálogo, sync_runs);
 *   2. escritura denegada en todas partes;
 *   3. cualquier otra colección (users, lo que sea) denegada también en lectura.
 *
 * Necesita red, así que solo se ejecuta cuando se pide:
 *   NUVIA_REGLAS_EN_VIVO=1 node docs/nuvia-reglas.test.mjs
 * Sin la variable, se omite con aviso (no forma parte de `validate`).
 *
 * Nunca escribe nada de verdad: la escritura de prueba tiene que ser
 * rechazada por las reglas; si alguna vez no lo fuera, la batería falla y el
 * documento de prueba queda en `_prueba_reglas/{fecha}` para borrarlo a mano.
 */

const BASE = 'https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

if (process.env.NUVIA_REGLAS_EN_VIVO !== '1') {
  console.log('Reglas de Firestore: prueba en vivo omitida (define NUVIA_REGLAS_EN_VIVO=1 para ejecutarla).');
  process.exit(0);
}

async function estado(ruta, opciones = {}) {
  const res = await fetch(`${BASE}/${ruta}`, opciones);
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, codigo: json?.error?.status || null };
}

const lecturaPermitida = (r) => r.status === 200 || r.status === 404; // 404 = permitido pero no existe
const denegado = (r) => r.status === 403 && r.codigo === 'PERMISSION_DENIED';

const manif = await estado('catalog_manifest/public');
comprueba('Lectura pública del manifiesto del catálogo (200 o 404, nunca 403)', lecturaPermitida(manif), `HTTP ${manif.status}`);
const asset = await estado('assets/IE00B03HD191');
comprueba('Lectura pública de una ficha', lecturaPermitida(asset), `HTTP ${asset.status}`);
const serie = await estado('assets/IE00B03HD191/series/2025');
comprueba('Lectura pública de una serie (subcolección)', lecturaPermitida(serie), `HTTP ${serie.status}`);
const run = await estado('sync_runs/2026-09-02');
comprueba('Lectura pública de sync_runs', lecturaPermitida(run), `HTTP ${run.status}`);

const users = await estado('users/cualquiera');
comprueba('users/{uid} denegado en lectura (no existe la colección en la alfa)', denegado(users), `HTTP ${users.status}`);
const otra = await estado('_prueba_reglas/x');
comprueba('Cualquier otra colección denegada en lectura', denegado(otra), `HTTP ${otra.status}`);

const cuerpo = { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { prueba: { stringValue: 'reglas' } } }) };
const escAsset = await estado('assets/_prueba_reglas', cuerpo);
comprueba('Escritura en assets denegada', denegado(escAsset), `HTTP ${escAsset.status}`);
const escManif = await estado('catalog_manifest/public', cuerpo);
comprueba('Escritura en el manifiesto denegada', denegado(escManif), `HTTP ${escManif.status}`);
const escOtra = await estado(`_prueba_reglas/${new Date().toISOString().slice(0, 10)}`, cuerpo);
comprueba('Escritura en cualquier otra colección denegada', denegado(escOtra), `HTTP ${escOtra.status}`);
const borrado = await estado('assets/IE00B03HD191', { method: 'DELETE' });
comprueba('Borrado denegado', denegado(borrado), `HTTP ${borrado.status}`);

console.log(fallos ? `\n${fallos} fallo(s)` : '\nReglas de la alfa en vivo: lectura pública, escritura y otras colecciones denegadas.');
process.exit(fallos ? 1 : 0);

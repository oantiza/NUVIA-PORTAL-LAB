/** Pruebas aisladas: jamás utiliza un proyecto real ni credenciales del equipo. */
import assert from 'node:assert/strict';

export const PROYECTO_PRUEBA = 'demo-nuvia-reglas';

const CONTRATO = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /assets/{id} { allow read: if true; allow write: if false; }
    match /assets/{id}/{sub=**} { allow read: if true; allow write: if false; }
    match /catalog_chunks/{id} { allow read: if true; allow write: if false; }
    match /catalog_manifest/{id} { allow read: if true; allow write: if false; }
    match /sync_runs/{id} { allow read: if true; allow write: if false; }
    match /{document=**} { allow read, write: if false; }
  }
}`;

function normalizaReglas(texto) {
  return String(texto).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '').replace(/\s+/g, '');
}

/** Contrato estático estricto, NO un intérprete ni una prueba de permisos desplegados. */
export function compruebaContratoReglas(texto) {
  assert.equal(normalizaReglas(texto), normalizaReglas(CONTRATO),
    'Las reglas locales han cambiado: revisar expresamente el contrato y ejecutar la batería en emulador.');
}

export function origenEmulador(host) {
  // IP literal: ni DNS, ni credenciales, ni rutas, ni un destino tomado de Firebase.
  const texto = String(host || '');
  const match = /^127\.0\.0\.1:([1-9]\d{3,4})$/.exec(texto);
  if (!match || match[0] !== texto || Number(match[1]) > 65535 || Number(match[1]) < 1024) {
    throw new Error('Prueba aislada: FIRESTORE_EMULATOR_HOST debe ser 127.0.0.1:PUERTO (1024–65535).');
  }
  return `http://${texto}`;
}

/** Transporte acotado: proyecto demo fijo, rutas de documentos y sin redirecciones. */
export function creaTransporteEmulador({ host, fetchFn = fetch } = {}) {
  const origen = origenEmulador(host);
  const base = `/v1/projects/${PROYECTO_PRUEBA}/databases/(default)/documents`;

  async function pide(ruta, { method, objeto, admin = false }) {
    const headers = { 'Content-Type': 'application/json' };
    // Valor reservado del emulador; no es un token obtenido del equipo.
    if (admin) headers.Authorization = 'Bearer owner';
    const res = await fetchFn(`${origen}${ruta}`, {
      method, headers, redirect: 'error', signal: AbortSignal.timeout(10_000),
      ...(objeto === undefined ? {} : { body: JSON.stringify(objeto) }),
    });
    if (res.status >= 300 && res.status < 400) throw new Error('El emulador no puede redirigir peticiones.');
    let json;
    try { json = await res.json(); } catch { throw new Error(`Respuesta no JSON del emulador (HTTP ${res.status}).`); }
    return { status: res.status, codigo: json?.error?.status || null, json };
  }

  async function cargaReglas(texto) {
    const r = await pide(`/emulator/v1/projects/${PROYECTO_PRUEBA}:securityRules`, {
      method: 'PUT', admin: true,
      objeto: { rules: { files: [{ name: 'firestore.rules', content: texto }] } },
    });
    assert.equal(r.status, 200, 'No se han podido cargar las reglas en el emulador.');
    assert.ok(!(r.json.issues || []).some((i) => i.severity === 'ERROR'), 'El emulador ha rechazado las reglas.');
  }

  async function documento(ruta, { method = 'GET', objeto, admin = false } = {}) {
    const match = /^(assets|catalog_chunks|catalog_manifest|sync_runs|users|_prueba_reglas)(\/[A-Za-z0-9_-]+)+$/.exec(ruta);
    assert.ok(match && match[0] === ruta, 'Solo se aceptan rutas de documentos de prueba, nunca URL ni rutas de administración.');
    assert.equal(ruta.split('/').length % 2, 0, 'La ruta debe identificar un documento.');
    assert.ok(['GET', 'PATCH', 'DELETE'].includes(method), 'Operación no prevista en la prueba aislada.');
    return pide(`${base}/${ruta}`, { method, objeto, admin });
  }

  return { cargaReglas, documento };
}

/** Ejecuta las reglas reales en el emulador, con documentos ficticios independientes por ejecución. */
export async function pruebaReglasEnEmulador({ reglas, host, fetchFn = fetch, informa = console.log } = {}) {
  compruebaContratoReglas(reglas);
  const t = creaTransporteEmulador({ host, fetchFn });
  await t.cargaReglas(reglas);
  const id = `prueba-${crypto.randomUUID()}`;
  const cuerpo = { fields: { prueba: { stringValue: id } } };
  const publicas = [`assets/${id}`, `assets/${id}/series/2025`, `assets/${id}/holdings/latest`,
    `catalog_chunks/${id}`, `catalog_manifest/${id}`, `sync_runs/${id}`];
  const privadas = [`users/${id}`, `users/${id}/portfolios/ejemplo`, `_prueba_reglas/${id}`];
  const rutas = [...publicas, ...privadas];
  for (const ruta of rutas) {
    assert.equal((await t.documento(ruta, { method: 'PATCH', objeto: cuerpo, admin: true })).status, 200,
      `No se ha podido preparar el documento sintético ${ruta}.`);
  }

  let comprobaciones = 0;
  for (const ruta of publicas) {
    const r = await t.documento(ruta);
    assert.equal(r.status, 200, `Lectura pública denegada en ${ruta}.`);
    assert.equal(r.json.fields?.prueba?.stringValue, id, 'La lectura debe devolver el documento sintético preparado.');
    comprobaciones += 1;
  }
  for (const ruta of privadas) {
    const r = await t.documento(ruta);
    assert.equal(r.status, 403, `Se ha permitido leer ${ruta}.`);
    assert.equal(r.codigo, 'PERMISSION_DENIED');
    comprobaciones += 1;
  }
  for (const ruta of rutas) {
    for (const method of ['PATCH', 'DELETE']) {
      const r = await t.documento(ruta, { method, ...(method === 'PATCH' ? { objeto: cuerpo } : {}) });
      assert.equal(r.status, 403, `Se ha permitido ${method} en ${ruta}.`);
      assert.equal(r.codigo, 'PERMISSION_DENIED');
      comprobaciones += 1;
    }
    assert.equal((await t.documento(ruta, { admin: true })).json.fields?.prueba?.stringValue, id,
      'El documento sintético ha cambiado o se ha borrado.');
    comprobaciones += 1;
  }
  informa(`Emulador: ${comprobaciones} comprobaciones de permisos e integridad correctas en ${PROYECTO_PRUEBA}.`);
  informa('Esto verifica las reglas locales, no el estado de ningún despliegue.');
  return { comprobaciones };
}

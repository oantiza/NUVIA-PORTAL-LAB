/**
 * NUVIA · alfa · Firestore por API REST, sin SDK.
 *
 * - `aFirestore` / `deFirestore`: conversión entre objetos JavaScript y el
 *   formato tipado de la API (`{stringValue}`, `{mapValue}`…). Puras.
 * - `tokenGcloud`: token de acceso del propietario del proyecto, obtenido
 *   ejecutando `gcloud auth print-access-token` como proceso hijo. Nunca se
 *   escribe en disco ni se imprime.
 * - `commitLotes`: escritura por lotes (`documents:commit`), upsert.
 *
 * Proyecto único y fijo: nuvia-family-wealth. Ningún parámetro permite apuntar
 * a otro proyecto; es una decisión, no un olvido (acta, adenda D7).
 */

import { execFileSync } from 'node:child_process';

export const PROYECTO_ALFA = 'nuvia-family-wealth';
export const URL_BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO_ALFA}/databases/(default)/documents`;
export const NOMBRE_BASE = `projects/${PROYECTO_ALFA}/databases/(default)/documents`;
export const TAMANO_LOTE = 200;

/* ───────────────────────── conversión ───────────────────────── */

export function aFirestore(valor) {
  if (valor === null || valor === undefined) return { nullValue: null };
  if (typeof valor === 'boolean') return { booleanValue: valor };
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return { nullValue: null };
    return Number.isInteger(valor) ? { integerValue: String(valor) } : { doubleValue: valor };
  }
  if (typeof valor === 'string') return { stringValue: valor };
  if (Array.isArray(valor)) return { arrayValue: { values: valor.map(aFirestore) } };
  if (typeof valor === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(valor)) if (v !== undefined) fields[k] = aFirestore(v);
    return { mapValue: { fields } };
  }
  throw new Error(`Tipo no convertible a Firestore: ${typeof valor}`);
}

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

/** Documento REST a objeto plano, con `_id` (último segmento del nombre). */
export function documentoAObjeto(doc) {
  if (!doc?.name) return null;
  return { _id: doc.name.split('/').pop(), ...camposDe(doc.fields) };
}

/** Escritura de upsert para `documents:commit`. */
export function escrituraUpsert(ruta, objeto) {
  return { update: { name: `${NOMBRE_BASE}/${ruta}`, fields: aFirestore(objeto).mapValue.fields } };
}

/* ───────────────────────── credenciales ───────────────────────── */

export function tokenGcloud({ exec = execFileSync, plataforma = process.platform, entorno = process.env } = {}) {
  // Vía de escape para entornos sin gcloud (p. ej. un token obtenido a mano
  // en la misma sesión): nunca se escribe en fichero ni se imprime.
  if (entorno.NUVIA_ALFA_TOKEN) return String(entorno.NUVIA_ALFA_TOKEN).trim();
  const orden = plataforma === 'win32' ? 'gcloud.cmd' : 'gcloud';
  // En Windows, Node ≥ 20.12 exige shell para lanzar .cmd; los argumentos son fijos.
  const salida = exec(orden, ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: plataforma === 'win32' });
  const token = String(salida).trim();
  if (!token) throw new Error('gcloud no ha devuelto un token. Ejecuta antes: gcloud auth login');
  return token;
}

function cabeceras(token) {
  return {
    Authorization: `Bearer ${token}`,
    'x-goog-user-project': PROYECTO_ALFA,
    'Content-Type': 'application/json',
  };
}

/* ───────────────────────── lectura ───────────────────────── */

export async function leeDocumento(ruta, { token, fetchFn = fetch } = {}) {
  const res = await fetchFn(`${URL_BASE}/${ruta}`, { headers: cabeceras(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${ruta}: ${res.status} ${await res.text()}`);
  return documentoAObjeto(await res.json());
}

/** Ids (y campos pedidos) de todos los documentos de una colección raíz. */
export async function listaIds(coleccion, { token, fetchFn = fetch, campos = ['asset_id'] } = {}) {
  const salida = [];
  let pageToken = null;
  do {
    const url = new URL(`${URL_BASE}/${coleccion}`);
    url.searchParams.set('pageSize', '300');
    for (const c of campos) url.searchParams.append('mask.fieldPaths', c);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetchFn(url.toString(), { headers: cabeceras(token) });
    if (!res.ok) throw new Error(`LIST ${coleccion}: ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents || []) salida.push(documentoAObjeto(d));
    pageToken = json.nextPageToken || null;
  } while (pageToken);
  return salida;
}

/* ───────────────────────── escritura ───────────────────────── */

/**
 * Escribe por lotes. Con `dryRun` no llama a la red: solo cuenta.
 * @param {Array<{ruta:string, objeto:Object}>} documentos
 * @returns {{escritos:number, lotes:number}}
 */
export async function commitLotes(documentos, { token, fetchFn = fetch, dryRun = false, tamanoLote = TAMANO_LOTE, informa = () => {} } = {}) {
  let escritos = 0;
  let lotes = 0;
  for (let i = 0; i < documentos.length; i += tamanoLote) {
    const trozo = documentos.slice(i, i + tamanoLote);
    lotes += 1;
    if (dryRun) { escritos += trozo.length; informa(escritos, documentos.length); continue; }
    const writes = trozo.map((d) => escrituraUpsert(d.ruta, d.objeto));
    const res = await fetchFn(`${URL_BASE}:commit`, {
      method: 'POST', headers: cabeceras(token), body: JSON.stringify({ writes }),
    });
    if (!res.ok) throw new Error(`commit (lote ${lotes}): ${res.status} ${await res.text()}`);
    const json = await res.json();
    const n = (json.writeResults || []).length;
    if (n !== trozo.length) throw new Error(`commit (lote ${lotes}): ${n} resultados para ${trozo.length} escrituras`);
    escritos += n;
    informa(escritos, documentos.length);
  }
  return { escritos, lotes };
}

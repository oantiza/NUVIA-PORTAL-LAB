import { FUNDAMENTALS_SCHEMA, validateEntry } from '../../alfa/contract.mjs';
import { entradaActual } from '../../../js/nuvia-identidades.js';
import { readBackup } from './catalog.js';
import { validateDividendDates } from '../../alfa/dividend-dates.mjs';

const DOCUMENTS = 'projects/nuvia-family-wealth/databases/(default)/documents';
export const FUNDAMENTALS_BASE = `https://firestore.googleapis.com/v1/${DOCUMENTS}`;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function failure(code, message) { return Object.assign(new Error(message), { code }); }
function decode(value, depth = 0) {
  if (!record(value) || depth > 20) throw failure('format', 'Formato de datos no válido.');
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value || 'doubleValue' in value) {
    if ('integerValue' in value ? !/^-?\d+$/.test(value.integerValue) : typeof value.doubleValue !== 'number') throw failure('format', 'Cifra no válida.');
    const number = Number(value.integerValue ?? value.doubleValue);
    if (!Number.isFinite(number)) throw failure('format', 'Cifra no válida.');
    return number;
  }
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(item => decode(item, depth + 1));
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw failure('format', 'Campo no válido.');
    return [key, decode(item, depth + 1)];
  }));
  throw failure('format', 'Tipo de datos no válido.');
}
export async function getDocument(path, { fetchFn, signal }) {
  const response = await fetchFn(`${FUNDAMENTALS_BASE}/${path}`, {
    method: 'GET', signal, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
  });
  signal?.throwIfAborted();
  if (response.status === 404) return null;
  if (!response.ok) throw failure('network', 'No se ha podido consultar la base propia. Puedes reintentar.');
  const json = await response.json();
  signal?.throwIfAborted();
  if (json?.name !== `${DOCUMENTS}/${path}` || !record(json.fields)) throw failure('format', 'El documento recibido no corresponde a la consulta.');
  return decode({ mapValue: { fields: json.fields } });
}

// Solo dos documentos de la empresa elegida. Ni EODHD directo, ni cuentas, ni escrituras.
export async function readCompany(entry, { fetchFn = fetch, signal } = {}) {
  entry = entradaActual(entry);
  if (!/^[A-Z0-9]{12}$/.test(entry?.assetId) || entry.isin !== entry.assetId
    || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol)) throw failure('identity', 'Identificador de empresa no válido.');
  const path = `assets/${entry.assetId}`;
  const [asset, doc] = await Promise.all([
    getDocument(path, { fetchFn, signal }), getDocument(`${path}/fundamentals/current`, { fetchFn, signal }),
  ]);
  signal?.throwIfAborted();
  if (!asset || asset.asset_id !== entry.assetId || asset.isin !== entry.isin
    || asset.eodhd_symbol !== entry.symbol || asset.currency !== entry.quoteCurrency) {
    throw failure('identity', 'La identidad del índice y la del activo en la base no coinciden. No se han unido sus cifras.');
  }
  if (!doc) return { origin: 'database', state: 'missing', company: null };
  if (doc.asset_id !== entry.assetId || doc.isin !== entry.isin || doc.symbol !== entry.symbol
    || doc.entry?.isin !== entry.isin || doc.entry?.symbol !== entry.symbol || doc.entry?.quoteCurrency !== entry.quoteCurrency
    || doc.entry?.company?.identity?.isin !== entry.isin) throw failure('identity', 'Los identificadores del activo y de sus fundamentales no coinciden. No se han unido sus cifras.');
  try {
    if (doc.schema_version !== FUNDAMENTALS_SCHEMA || !Number.isFinite(Date.parse(doc.loaded_at))) throw new Error();
    validateEntry(doc.entry);
  } catch { throw failure('format', 'Los fundamentales recibidos no cumplen el formato previsto. Puedes reintentar.'); }
  return { origin: 'database', state: 'ready', company: doc.entry.company, loadedAt: doc.loaded_at };
}

export async function loadCompany(entry, options = {}) {
  entry = entradaActual(entry);
  try { return await readCompany(entry, options); }
  catch (error) {
    // Cancelación y discrepancia de identidad nunca se convierten en un respaldo.
    if (options.signal?.aborted || error.name === 'AbortError') throw error;
    if (error.code === 'identity') throw error;
    const company = entry.company || await readBackup(entry, options);
    options.signal?.throwIfAborted();
    if (!company) throw error;
    return { origin: 'fallback', state: 'ready', company,
      notice: 'No se ha podido verificar la ficha en la base propia. Estás viendo el respaldo local, que puede estar desactualizado.' };
  }
}

// Complemento independiente: una lectura, sin respaldo de fechas ni mezcla contable.
export async function readDividendDates(entry, { fetchFn = fetch, signal } = {}) {
  entry = entradaActual(entry);
  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(entry?.assetId) || entry.isin !== entry.assetId
    || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol)) throw failure('identity', 'Identificador de empresa no válido.');
  signal?.throwIfAborted();
  const doc = await getDocument(`assets/${entry.assetId}/fundamentals/dividends`, { fetchFn, signal });
  signal?.throwIfAborted();
  if (!doc) return { state: 'missing', dates: null };
  if (doc.asset_id !== entry.assetId || doc.isin !== entry.isin || doc.symbol !== entry.symbol) {
    throw failure('identity', 'Las fechas recibidas no corresponden a esta empresa. Sus fundamentales se mantienen sin cambios.');
  }
  try { validateDividendDates(doc); }
  catch { throw failure('format', 'Las fechas recibidas no cumplen el formato previsto. Sus fundamentales se mantienen sin cambios.'); }
  return { state: 'ready', dates: doc };
}

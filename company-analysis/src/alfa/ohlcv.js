import { getDocument } from './remote.js';
import { entradaActual } from '../../../js/nuvia-identidades.js';
import { validDay } from '../../alfa/technical.mjs';
import { inspectOhlcv } from '../../alfa/ohlcv.mjs';

const fail = message => { throw Object.assign(new Error(message), { code: 'ohlcv' }); };
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const canonical = v => JSON.stringify(stable(v));
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
const keys = (value, expected) => value && canonical(Object.keys(value).sort()) === canonical(expected.split(' ').sort());
function validateIdentity(d, e) {
  if (!d || d.asset_id !== e.isin || d.isin !== e.isin || d.symbol !== e.symbol || d.currency !== e.quoteCurrency) fail('La identidad o moneda del historial OHLCV no coincide con la empresa elegida.');
}
function validateManifest(m, e) {
  validateIdentity(m, e);
  if (!keys(m, 'schema_version asset_id isin symbol currency revision source requested_from requested_to first_date last_date n years')
    || m.schema_version !== 'nuvia-ohlcv-manifest.v1' || !/^[a-f0-9]{64}$/.test(m.revision)
    || !['requested_from','requested_to','first_date','last_date'].every(k => validDay(m[k]))
    || m.requested_from > m.first_date || m.first_date > m.last_date || m.last_date > m.requested_to
    || !Number.isInteger(m.n) || m.n < 1 || m.n > 3000) fail('Cobertura o versión OHLCV no válida.');
  const s = m.source;
  if (!keys(s, 'system endpoint fetched_at price_basis adjusted_close_basis volume_basis')
    || s.system !== 'EODHD' || s.endpoint !== 'eod' || !Number.isFinite(Date.parse(s.fetched_at))
    || s.price_basis !== 'unadjusted' || s.adjusted_close_basis !== 'splits-and-dividends'
    || s.volume_basis !== 'split-adjusted') fail('La procedencia o el tipo de ajuste OHLCV no está acreditado.');
  const firstYear = Number(m.first_date.slice(0,4)), lastYear = Number(m.last_date.slice(0,4));
  if (!Array.isArray(m.years) || m.years.length < 1 || m.years.length > 7
    || m.years.length !== lastYear - firstYear + 1
    || m.years.some((y,i) => !keys(y,'year n sha256') || y.year !== firstYear + i
      || !Number.isInteger(y.n) || y.n < 1 || y.n > 366 || !/^[a-f0-9]{64}$/.test(y.sha256))) fail('El índice anual OHLCV está incompleto o no es válido.');
}

// GET anónimos: no proveedor directo, credenciales, escrituras ni mezcla con /series/.
export async function readOhlcv(rawEntry, { fetchFn = fetch, signal } = {}) {
  const entry = entradaActual(rawEntry);
  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(entry?.isin) || entry.assetId !== entry.isin
    || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol) || entry.quoteCurrency !== 'EUR') fail('Identificador OHLCV no válido.');
  signal?.throwIfAborted();
  const options = {fetchFn,signal}, path = `assets/${entry.isin}`, manifestPath = `${path}/ohlcv_manifest/current`;
  const m = await getDocument(manifestPath, options);
  if (!m) fail('No hay un historial OHLCV para esta empresa. Puedes consultar la serie de cierres anteriores o reintentar.');
  validateManifest(m, entry);
  const docs = await Promise.all(m.years.map(y => getDocument(`${path}/ohlcv/${y.year}`,options)));
  const raw = [];
  for (const [i,d] of docs.entries()) {
    signal?.throwIfAborted();
    if (!d) fail(`Falta el documento OHLCV de ${m.years[i].year}. Puedes reintentar o consultar los cierres anteriores.`);
    validateIdentity(d,entry);
    if (!keys(d,'schema_version asset_id isin symbol currency year revision source n first_date last_date points')
      || d.schema_version !== 'nuvia-ohlcv.v1' || d.revision !== m.revision || canonical(d.source) !== canonical(m.source)
      || d.year !== m.years[i].year || d.n !== m.years[i].n || !Array.isArray(d.points) || d.points.length !== d.n
      || d.first_date !== d.points[0]?.date || d.last_date !== d.points.at(-1)?.date
      || d.points.some(p => !keys(p,'date open high low close adjusted_close volume') || !validDay(p.date) || Number(p.date.slice(0,4)) !== d.year)) fail('Documento anual OHLCV incompleto o de otra revisión.');
    const checked = inspectOhlcv(d.points);
    if (checked.issues.length || await hash(d) !== m.years[i].sha256) fail('Los precios OHLCV no coinciden con su huella de integridad o contienen cifras no válidas.');
    raw.push(...checked.points);
  }
  if (raw.length !== m.n || raw[0]?.date !== m.first_date || raw.at(-1)?.date !== m.last_date
    || inspectOhlcv(raw).issues.length) fail('El historial OHLCV no coincide con su cobertura declarada.');
  const meta = {isin:entry.isin,symbol:entry.symbol,currency:entry.quoteCurrency,fetchedAt:m.source.fetched_at};
  if (await hash({meta,points:raw}) !== m.revision) fail('La revisión conjunta OHLCV no coincide con los datos descargados.');
  const current = await getDocument(manifestPath,options);
  signal?.throwIfAborted();
  if (canonical(current) !== canonical(m)) fail('El historial OHLCV ha cambiado durante la consulta. Reintenta para leer una sola versión.');
  return {raw,points:raw.map(p => ({date:p.date,value:p.adjusted_close})),currency:m.currency,
    lastDate:m.last_date,fetchedAt:m.source.fetched_at,revision:m.revision};
}

import { getDocument } from './remote.js';
import { entradaActual } from '../../../js/nuvia-identidades.js';
import { validDay, yearsBefore } from '../../alfa/technical.mjs';
function fail(message) { throw Object.assign(new Error(message), { code: 'prices' }); }
function validateAsset(asset, entry) {
  if (!asset || asset.asset_id !== entry.assetId || asset.isin !== entry.isin || asset.eodhd_symbol !== entry.symbol
    || asset.currency !== entry.quoteCurrency || asset.source?.system !== 'EODHD' || asset.source?.symbol !== entry.symbol) fail('La identidad o procedencia de los precios no coincide con la empresa elegida.');
  if (!validDay(asset.history?.first_date) || !validDay(asset.history?.last_date) || asset.history.first_date > asset.history.last_date
    || !Number.isFinite(Date.parse(asset.updated_at)) || !Number.isFinite(Date.parse(asset.source.fetched_at))) fail('La fecha o cobertura del historial no está acreditada en la ficha.');
}
const revision = asset => JSON.stringify([asset.updated_at, asset.source?.fetched_at, asset.history]);
export async function readPrices(rawEntry, { fetchFn = fetch, signal } = {}) {
  const entry = entradaActual(rawEntry);
  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(entry?.assetId) || entry.isin !== entry.assetId
    || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol)) fail('Identificador de empresa no válido.');
  signal?.throwIfAborted();
  const options = { fetchFn, signal }, path = `assets/${entry.assetId}`;
  const asset = await getDocument(path, options);
  validateAsset(asset, entry);
  // Un año adicional prepara las medias antes del intervalo visible de cinco años.
  const start = [asset.history.first_date, yearsBefore(asset.history.last_date, 6)].sort().at(-1);
  const years = Array.from({ length: Number(asset.history.last_date.slice(0, 4)) - Number(start.slice(0, 4)) + 1 }, (_, i) => Number(start.slice(0, 4)) + i);
  const docs = await Promise.all(years.map(year => getDocument(`${path}/series/${year}`, options)));
  signal?.throwIfAborted();
  const points = docs.flatMap((doc, index) => {
    if (!doc) fail(`Falta el documento de precios de ${years[index]}. Puedes reintentar; las otras pestañas siguen disponibles.`);
    if (doc.asset_id !== entry.assetId || doc.currency !== entry.quoteCurrency || doc.year !== years[index]
      || !Array.isArray(doc.points) || !doc.points.length || doc.n !== doc.points.length
      || doc.first_date !== doc.points[0].date || doc.last_date !== doc.points.at(-1).date) fail('El documento anual de precios no corresponde a la consulta o está incompleto.');
    return doc.points.map((p, i) => {
      if (!validDay(p.date) || Number(p.date.slice(0, 4)) !== doc.year || p.date > asset.history.last_date
        || !Number.isFinite(p.value) || p.value <= 0 || i && p.date <= doc.points[i - 1].date) fail('El historial contiene una fecha o precio no válido; no se han rellenado ni corregido cifras.');
      return { date: p.date, value: p.value };
    });
  });
  const current = await getDocument(path, options);
  signal?.throwIfAborted(); validateAsset(current, entry);
  if (revision(current) !== revision(asset)) fail('Los precios han cambiado durante la consulta. Reintenta para obtener una única versión.');
  if (points.at(-1)?.date !== asset.history.last_date) fail('El último precio no coincide con la fecha declarada en la ficha.');
  return { points, currency: entry.quoteCurrency, lastDate: asset.history.last_date, fetchedAt: asset.source.fetched_at, loadedAt: asset.updated_at };
}

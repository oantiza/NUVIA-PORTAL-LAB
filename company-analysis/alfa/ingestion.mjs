// Contrato de carga positiva: solo información empresarial histórica/descriptiva.
import { createHash } from 'node:crypto';
import { buildAlphaSnapshot } from './project.mjs';

import { FUNDAMENTALS_SCHEMA, validateEntry } from './contract.mjs';
export { FUNDAMENTALS_SCHEMA, COMPANY_FIELDS, validateEntry } from './contract.mjs';
export function prepareEntry(asset, raw, { catalogObservedAt, downloadedAt }) {
  const result = buildAlphaSnapshot({ assets: [asset], rawBySymbol: { [asset.eodhd_symbol]: raw }, catalogObservedAt, preparedAt: downloadedAt }).entries[0];
  if (result.state !== 'matched') return result;
  result.company.source.downloadedAt = downloadedAt;
  result.company.source.mode = 'Instantánea de EODHD; actualización mediante carga autorizada';
  result.company.source.rawSha256 = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
  result.company.source.hashBasis = 'JSON de la respuesta antes de proyectar; no se conserva el original';
  return validateEntry(result);
}
export function documentFor(entry, loadedAt) {
  validateEntry(entry);
  return { schema_version: FUNDAMENTALS_SCHEMA, asset_id: entry.assetId, isin: entry.isin, symbol: entry.symbol,
    loaded_at: loadedAt, entry };
}
export function createWrite(entry, loadedAt, { baseName, encode }) {
  if (baseName !== 'projects/nuvia-family-wealth/databases/(default)/documents') throw new Error('Proyecto no autorizado');
  return { update: { name: `${baseName}/assets/${entry.assetId}/fundamentals/current`, fields: encode(documentFor(entry, loadedAt)).mapValue.fields }, currentDocument: { exists: false } };
}

export const INDEX_SCHEMA = 'nuvia-company-index.v1';
export const BACKUP_SCHEMA = 'nuvia-company-backup.v1';
const record = v => v && typeof v === 'object' && !Array.isArray(v);
function keys(v, allowed) {
  if (!record(v) || Object.keys(v).some(k => !allowed.includes(k))) throw new Error('El índice de empresas no tiene el formato esperado.');
}
export function validateIndex(index) {
  keys(index, ['schema', 'provider', 'catalogObservedAt', 'preparedAt', 'entries']);
  if (index.schema !== INDEX_SCHEMA || index.provider !== 'EODHD' || !Array.isArray(index.entries)
    || ![index.catalogObservedAt, index.preparedAt].every(d => typeof d === 'string' && Number.isFinite(Date.parse(d)))) throw new Error('El índice de empresas no tiene el formato esperado.');
  const ids = new Set(), symbols = new Set();
  for (const e of index.entries) {
    keys(e, ['assetId', 'symbol', 'name', 'isin', 'quoteCurrency', 'backupSha256']);
    if (!/^[A-Z0-9]{12}$/.test(e.assetId) || e.isin !== e.assetId || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(e.symbol)
      || typeof e.name !== 'string' || !e.name.trim() || e.quoteCurrency !== 'EUR'
      || !(e.backupSha256 === null || /^[a-f0-9]{64}$/.test(e.backupSha256))
      || ids.has(e.assetId) || symbols.has(e.symbol)) throw new Error('El índice de empresas no tiene el formato esperado.');
    ids.add(e.assetId); symbols.add(e.symbol);
  }
  return index;
}

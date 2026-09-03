import { validateIndex, BACKUP_SCHEMA } from '../../alfa/index-contract.mjs';
import { validateBackupEntry } from '../../alfa/contract.mjs';
const options = signal => ({ signal, method: 'GET', credentials: 'omit', cache: 'no-cache', redirect: 'error', referrerPolicy: 'no-referrer' });
const backupError = message => Object.assign(new Error(message), { code: 'backup' });
export async function readCompanyIndex({ fetchFn = fetch, signal } = {}) {
  const res = await fetchFn('./data/company-index.json', options(signal));
  signal?.throwIfAborted();
  if (!res.ok) throw new Error('No se ha podido cargar el índice de empresas. Puedes reintentar.');
  const data = await res.json();
  signal?.throwIfAborted();
  return validateIndex(data);
}
export async function readBackup(entry, { fetchFn = fetch, signal } = {}) {
  if (!entry.backupSha256) return null;
  // El índice no suministra una URL: se construye una ruta local fija validada.
  if (!/^[A-Z0-9]{12}$/.test(entry.assetId) || !/^[a-f0-9]{64}$/.test(entry.backupSha256)) throw backupError('Referencia de respaldo no válida.');
  const res = await fetchFn(`./data/backups/${entry.assetId}.${entry.backupSha256}.json`, options(signal));
  signal?.throwIfAborted();
  if (!res.ok) throw backupError('No se ha podido cargar el respaldo local. Puedes reintentar.');
  const bytes = await res.arrayBuffer();
  signal?.throwIfAborted();
  if (bytes.byteLength > 650000) throw backupError('Respaldo local no válido.');
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  signal?.throwIfAborted();
  if (hash !== entry.backupSha256) throw backupError('El respaldo local no coincide con su versión. Puedes reintentar.');
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.schema !== BACKUP_SCHEMA) throw new Error();
    validateBackupEntry(data.entry);
  } catch { throw backupError('El respaldo local no cumple el contrato de datos. Puedes reintentar.'); }
  const e = data.entry;
  if (e.assetId !== entry.assetId || e.isin !== entry.isin || e.symbol !== entry.symbol || e.quoteCurrency !== entry.quoteCurrency) throw backupError('La identidad del respaldo no coincide con la empresa.');
  return e.company;
}

// Empaqueta únicamente el artefacto saneado existente. Sin red ni reloj implícito.
import { createHash } from 'node:crypto';
import { entradaActual } from '../../js/nuvia-identidades.js';
import { validateBackupEntry } from './contract.mjs';
import { INDEX_SCHEMA, BACKUP_SCHEMA, validateIndex } from './index-contract.mjs';

export function packSnapshot(snapshot) {
  if (snapshot?.schema !== 'nuvia-company-alpha.v1' || !Array.isArray(snapshot.entries)) throw new Error('Instantánea no válida');
  const files = new Map();
  const entries = snapshot.entries.map(original => {
    const e = entradaActual(original);
    let backupSha256 = null;
    if (e.company) {
      validateBackupEntry(e);
      const content = JSON.stringify({ schema: BACKUP_SCHEMA, entry: e }) + '\n';
      backupSha256 = createHash('sha256').update(content).digest('hex');
      files.set(`data/backups/${e.assetId}.${backupSha256}.json`, content);
    }
    return { assetId: e.assetId, symbol: e.symbol, name: e.name, isin: e.isin, quoteCurrency: e.quoteCurrency, backupSha256 };
  });
  const index = validateIndex({ schema: INDEX_SCHEMA, provider: snapshot.provider,
    catalogObservedAt: snapshot.catalogObservedAt, preparedAt: snapshot.preparedAt, entries });
  files.set('data/company-index.json', JSON.stringify(index) + '\n');
  return { index, files };
}

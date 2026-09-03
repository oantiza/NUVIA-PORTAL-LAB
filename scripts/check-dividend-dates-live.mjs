// Comprobación pública en solo lectura. Sin credenciales ni cambios de permisos.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { URL_BASE, documentoAObjeto } from './mercado-alfa/firestore-rest.mjs';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { validateDividendDates } from '../company-analysis/alfa/dividend-dates.mjs';
const index = validateIndex(JSON.parse(await readFile('company-analysis/build/data/company-index.json', 'utf8')));
const checkedAt = new Date().toISOString();
const rows = [];
for (let offset = 0; offset < index.entries.length; offset += 6) {
  rows.push(...await Promise.all(index.entries.slice(offset, offset + 6).map(async entry => {
    let status = null;
    try {
      const response = await fetch(`${URL_BASE}/assets/${entry.isin}/fundamentals/dividends`, { redirect: 'error', signal: AbortSignal.timeout(25000) });
      status = response.status;
      if (!response.ok) return { symbol: entry.symbol, status, valid: false };
      const doc = documentoAObjeto(await response.json()); delete doc._id;
      validateDividendDates(doc); assert.equal(doc.isin, entry.isin); assert.equal(doc.symbol, entry.symbol);
      return { symbol: entry.symbol, status, valid: true, availability: doc.availability,
        paymentDate: doc.dividendDate, exDividendDate: doc.exDividendDate, fetchedAt: doc.source.fetchedAt, loadedAt: doc.loaded_at };
    } catch { return { symbol: entry.symbol, status, valid: false }; }
  })));
}
const result = { checkedAt, requests: rows.length, method: 'GET', credentials: false, remoteWrites: 0,
  valid: rows.filter(r => r.valid).length, failed: rows.filter(r => !r.valid), rows };
const directory = resolve('output/carga-fechas-dividendos');
await mkdir(directory, { recursive: true });
const file = resolve(directory, `lectura-publica-${checkedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(file, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ file, requests: result.requests, valid: result.valid, failed: result.failed, credentials: false, remoteWrites: 0 }, null, 2));
if (result.failed.length) process.exitCode = 1;

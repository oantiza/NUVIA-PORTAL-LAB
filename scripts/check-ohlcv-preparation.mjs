// Solo lectura de cachés locales de precios. No importa ningún cliente de red o escritor remoto.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { inspectOhlcv, adjustedCandles, atrWilder } from '../company-analysis/alfa/ohlcv.mjs';
import { entradaActual } from '../js/nuvia-identidades.js';

const root = resolve(import.meta.dirname, '..');
const index = JSON.parse(await readFile(resolve(root, 'company-analysis/public/data/fundamentals.json'), 'utf8'));
const entries = index.entries.map(entradaActual), rows = [];
for (const entry of entries) {
  if (!/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(entry.symbol)) throw new Error('Símbolo inválido');
  const path = resolve(root, 'output/mercado-alfa/crudo', `${entry.symbol}.eod.json`);
  let raw;
  try { raw = await readFile(path, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; rows.push({ isin: entry.isin, symbol: entry.symbol, state: 'cache-missing' }); continue; }
  const source = JSON.parse(raw), inspected = inspectOhlcv(source);
  let derived = null, derivedError = null;
  if (!inspected.issues.length) {
    try { derived = atrWilder(adjustedCandles(source)).at(-1)?.atr ?? null; }
    catch (error) { derivedError = error.message; }
  }
  const reasons = Object.fromEntries([...new Set(inspected.issues.map(i => i.reason))].map(reason => [reason, inspected.issues.filter(i => i.reason === reason).length]));
  rows.push({ isin: entry.isin, symbol: entry.symbol, state: inspected.issues.length || derivedError ? 'review' : 'locally-valid',
    rawSha256: createHash('sha256').update(raw).digest('hex'), observations: source.length,
    first: inspected.points[0]?.date ?? null, last: inspected.points.at(-1)?.date ?? null,
    missingVolume: inspected.points.filter(p => p.volume === null).length,
    zeroVolume: inspected.points.filter(p => p.volume === 0).length, reasons, derivedAtr14: derived, derivedError });
}
const report = { inspectedAt: new Date().toISOString(), scope: 'local-cache-only', remoteReads: 0, remoteWrites: 0,
  total: entries.length, cached: rows.filter(r => r.state !== 'cache-missing').length,
  locallyValid: rows.filter(r => r.state === 'locally-valid').length, needsReview: rows.filter(r => r.state === 'review').length, rows };
const folder = resolve(root, 'output/ohlcv-preparation'); await mkdir(folder, { recursive: true });
const output = resolve(folder, `audit-${report.inspectedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report, rows: rows.filter(r => r.state === 'review'), output }, null, 2));

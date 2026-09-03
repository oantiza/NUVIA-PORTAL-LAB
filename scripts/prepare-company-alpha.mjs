// Generación local de un artefacto publicable, sin red ni modificación de la base.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { buildAlphaSnapshot } from '../company-analysis/alfa/project.mjs';
import { SYMBOL } from '../company-analysis/local/data.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = JSON.parse(await readFile(resolve(root, 'output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json'), 'utf8'));
const rawBySymbol = {};
const hashes = {};
for (const asset of evidence.assets) {
  if (!SYMBOL.test(asset.eodhd_symbol)) throw new Error('Símbolo no válido');
  try {
    const bytes = await readFile(resolve(root, `output/mercado-alfa/crudo/${asset.eodhd_symbol}.fundamentals.json`));
    rawBySymbol[asset.eodhd_symbol] = JSON.parse(bytes.toString('utf8'));
    hashes[asset.eodhd_symbol] = createHash('sha256').update(bytes).digest('hex');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const snapshot = buildAlphaSnapshot({ assets: evidence.assets, rawBySymbol, catalogObservedAt: evidence.at, preparedAt: new Date().toISOString() });
for (const entry of snapshot.entries) if (entry.company) entry.company.source.rawSha256 = hashes[entry.symbol];
const directory = resolve(root, 'company-analysis/public/data');
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'fundamentals.json'), JSON.stringify(snapshot) + '\n', 'utf8');
console.log(JSON.stringify({ catalog: snapshot.entries.length, withData: snapshot.entries.filter(e => e.company).length, states: snapshot.entries.reduce((a, e) => ({ ...a, [e.state]: (a[e.state] || 0) + 1 }), {}) }));

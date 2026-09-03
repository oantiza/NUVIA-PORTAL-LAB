// Diagnóstico explícito de SOLO LECTURA contra la base propia, fuera del build.
// No usa credenciales ni consulta cuentas o carteras de visitantes.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';
import { CAMBIOS_IDENTIDAD, entradaActual } from '../js/nuvia-identidades.js';
import { creaClienteMaestra } from '../js/nuvia-datos.js';
import { documentoAObjeto } from './mercado-alfa/firestore-rest.mjs';

const calls = [];
async function readOnly(url, options = {}) {
  const method = options.method || 'GET';
  assert.ok(url.startsWith(`${FUNDAMENTALS_BASE}/`) || url === `${FUNDAMENTALS_BASE}:batchGet`);
  assert.ok(method === 'GET' || (method === 'POST' && url === `${FUNDAMENTALS_BASE}:batchGet`));
  assert.equal(options.headers?.Authorization, undefined);
  calls.push({ method, path: url.slice(FUNDAMENTALS_BASE.length) });
  return fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(20000) });
}
async function doc(path) {
  const res = await readOnly(`${FUNDAMENTALS_BASE}/${path}`);
  assert.equal(res.status, 200, path);
  return documentoAObjeto(await res.json());
}
const snapshot = JSON.parse(await readFile(resolve('company-analysis/public/data/fundamentals.json'), 'utf8'));
const report = { checkedAt: new Date().toISOString(), expected: snapshot.entries.length, companies: [], identities: [], remoteWrites: 0 };
for (let i = 0; i < snapshot.entries.length; i += 8) {
  report.companies.push(...await Promise.all(snapshot.entries.slice(i, i + 8).map(async entry => {
    const result = await readCompany(entry, { fetchFn: readOnly });
    assert.equal(result.state, 'ready', entry.symbol);
    assert.equal(result.origin, 'database');
    assert.equal(result.company.identity.isin, entradaActual(entry).isin);
    return { symbol: entry.symbol, isin: result.company.identity.isin,
      rows: Object.fromEntries(Object.entries(result.company.statements).map(([key, statement]) => [key, statement.rows.length])) };
  })));
}
const client = creaClienteMaestra({ fetchFn: readOnly });
const manifest = await doc('catalog_manifest/public');
const chunks = await Promise.all(Array.from({ length: manifest.chunks }, (_, i) => doc(`catalog_chunks/${String(i).padStart(3, '0')}`)));
const raw = { manifiesto: manifest, items: chunks.flatMap(chunk => chunk.items) };
assert.equal(raw.items.length, 698); assert.equal(raw.manifiesto.total, 698);
for (const c of CAMBIOS_IDENTIDAD) {
  assert.equal(raw.manifiesto.identity_aliases[c.old], c.current);
  assert.ok(raw.items.some(a => a.asset_id === c.old));
  assert.ok(!raw.items.some(a => a.asset_id === c.current));
  for (const id of [c.old, c.current]) {
    const search = await client.buscaActivos(id);
    assert.equal(search.activos.length, 1); assert.equal(search.activos[0].asset_id, c.current);
    const detail = await client.detalleActivo(id);
    assert.equal(detail.asset_id, id); assert.equal(detail.identity.isin, c.current);
  }
  assert.deepEqual(await client.enCatalogo([c.old, c.current]), { [c.old]: true, [c.current]: true });
  let count = 0, first, last;
  for (let year = 2021; year <= 2026; year++) {
    const [old, current] = await Promise.all([doc(`assets/${c.old}/series/${year}`), doc(`assets/${c.current}/series/${year}`)]);
    assert.deepEqual(current.points, old.points); count += current.points.length;
    first ||= current.first_date; last = current.last_date;
  }
  const aligned = await client.seriesRebasadas([c.old, c.current]);
  assert.equal(aligned.series.length, 2); assert.ok(aligned.dates.length > 0);
  assert.deepEqual(aligned.series[0].values, aligned.series[1].values);
  report.identities.push({ symbol: c.symbol, previous: c.old, current: c.current, equalPricePoints: count, first, last,
    alignedDays: aligned.dates.length, legacyCatalogRetained: true });
}
report.ready = report.companies.length;
report.calls = calls;
const output = resolve('output/identidades-pendientes');
await mkdir(output, { recursive: true });
const path = resolve(output, `lectura-${report.checkedAt.replace(/[:.]/g, '-')}.json`);
await writeFile(path, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ready: report.ready, expected: report.expected, identities: report.identities, remoteWrites: 0, report: path }, null, 2));

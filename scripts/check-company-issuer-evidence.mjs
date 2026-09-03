// Diagnóstico explícito: GET anónimos acotados y salida local. No se importa en la web.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readCompany, FUNDAMENTALS_BASE } from '../company-analysis/src/alfa/remote.js';
import { validateIndex } from '../company-analysis/alfa/index-contract.mjs';
import { COMPANY_FIELDS } from '../company-analysis/alfa/contract.mjs';

const relations = new Set(['direct', 'derived', 'outflow-magnitude', 'definition-unresolved', 'not-reconciled']);

export function compareCase(company, item, source) {
  assert.equal(company.symbol, item.symbol, 'Símbolo diferente');
  assert.equal(company.identity.isin, item.isin, 'ISIN diferente');
  assert.ok(COMPANY_FIELDS[item.statement], 'Estado no permitido');
  assert.ok(Number.isSafeInteger(source.sourceUnitMultiplier) && source.sourceUnitMultiplier > 0);
  const statement = company.statements[item.statement];
  const rows = statement.rows.filter(row => row.period === item.period);
  assert.ok(rows.length <= 1, 'Cierre duplicado: no elegir una versión arbitraria');
  const row = rows[0];
  const fields = item.fields.map(field => {
    assert.ok(COMPANY_FIELDS[item.statement].includes(field.field), 'Campo no permitido');
    assert.ok(relations.has(field.relation));
    const hasSource = field.sourceValue !== null;
    assert.ok(!hasSource || Number.isFinite(field.sourceValue));
    assert.ok(field.relation !== 'outflow-magnitude' || field.sourceValue < 0);
    const issuerBaseValue = hasSource ? field.sourceValue * source.sourceUnitMultiplier : null;
    const comparisonValue = issuerBaseValue === null ? null
      : field.relation === 'outflow-magnitude' ? -issuerBaseValue : issuerBaseValue;
    const storedValue = row?.[field.field] ?? null;
    assert.ok(storedValue === null || Number.isFinite(storedValue), 'Cifra almacenada no válida');
    const comparable = storedValue !== null && comparisonValue !== null;
    return { ...field, storedValue, issuerBaseValue, comparisonValue,
      numericEqual: comparable ? storedValue === comparisonValue : null,
      difference: comparable ? storedValue - comparisonValue : null };
  });
  return { symbol: item.symbol, isin: item.isin, statement: item.statement, period: item.period,
    rowPresent: Boolean(row), storedCurrency: row?.currency ?? null, storedScale: row?.scale ?? null,
    storedReportedAt: row?.reportedAt ?? null, source: item.source, sourceCurrency: source.currency,
    sourceUnitMultiplier: source.sourceUnitMultiplier, fields };
}

export async function run() {
  const evidence = JSON.parse(await readFile(resolve('docs/evidence/fundamentales-emisores-20260903.json'), 'utf8'));
  // La evidencia numérica está transcrita y revisada por una persona/agente, no extraída por este programa.
  // El hash impide atribuir la revisión a otro PDF descargado después bajo la misma ruta.
  for (const source of Object.values(evidence.sources)) {
    const sha = createHash('sha256').update(await readFile(resolve(source.localFile))).digest('hex');
    assert.equal(sha, source.sha256, 'PDF ausente o diferente de la versión revisada');
  }
  const index = validateIndex(JSON.parse(await readFile(resolve('company-analysis/build/data/company-index.json'), 'utf8')));
  const symbols = [...new Set(evidence.cases.map(item => item.symbol))];
  const entries = symbols.map(symbol => {
    const entry = index.entries.find(value => value.symbol === symbol);
    assert.ok(entry, 'Empresa ausente del índice');
    return entry;
  });
  const allowed = new Set(entries.flatMap(entry => [`${FUNDAMENTALS_BASE}/assets/${entry.isin}`, `${FUNDAMENTALS_BASE}/assets/${entry.isin}/fundamentals/current`]));
  let reads = 0;
  const fetchFn = (url, options) => {
    assert.ok(allowed.has(url)); assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit'); assert.equal(options.headers, undefined);
    reads++;
    return fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
  };
  const report = { startedAt: new Date().toISOString(), completedAt: null, sources: evidence.sources,
    note: 'La igualdad numérica no acredita por sí sola equivalencia contable, escala global ni fecha de presentación.',
    companies: [], failures: [], reads: 0, remoteWrites: 0 };
  for (const entry of entries) {
    try {
      const result = await readCompany(entry, { fetchFn });
      assert.equal(result.state, 'ready'); assert.equal(result.origin, 'database');
      report.companies.push({ symbol: entry.symbol, loadedAt: result.loadedAt, source: result.company.source,
        latestCloses: Object.fromEntries(Object.entries(result.company.statements).map(([key, s]) => [key, s.rows.at(-1)?.period ?? null])),
        cases: evidence.cases.filter(item => item.symbol === entry.symbol).map(item => compareCase(result.company, item, evidence.sources[item.source])) });
    } catch {
      report.failures.push({ symbol: entry.symbol, reason: 'No se pudo contrastar identidad, contrato o lectura; no se usa respaldo.' });
    }
  }
  report.reads = reads; report.completedAt = new Date().toISOString();
  const directory = resolve('output/metadatos-fuentes'); await mkdir(directory, { recursive: true });
  const path = resolve(directory, `contraste-${report.startedAt.replace(/[:.]/g, '-')}.json`);
  await writeFile(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ report: path, companies: report.companies.length, failures: report.failures, reads, remoteWrites: 0 }, null, 2));
  // Las diferencias documentales se informan: nunca desactivan fichas ni se convierten en un veredicto global.
  if (report.failures.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();

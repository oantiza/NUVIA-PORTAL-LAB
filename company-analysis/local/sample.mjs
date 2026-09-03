// Generador offline deliberadamente acotado. No escribe ni consulta ninguna base.
import { readFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { RAW_DIRECTORY } from './data.mjs';
import { assertCatalogSnapshot, normalizeSample, sha256 } from './normalize.mjs';
import { validateRecord } from './contract.mjs';

// Casos de calidad de datos, no selección de inversión. Cambiar este alcance requiere revisión.
const selection = [
  ['IBE.MC', 'Estados EUR y referencia ordinaria'],
  ['PRX.AS', 'Cotización EUR y estados USD'],
  ['RI.PA', 'Moneda de balance desconocida'],
  ['IES.XETRA', 'Revisión sectorial bancaria'],
  ['TSK.MC', 'Campos ausentes y codificación del nombre'],
  ['SLR.MC', 'Dividendo no informado'],
  ['FER.MC', 'Control negativo: ISIN incompatible'],
  ['SGRE.MC', 'Control negativo: fuera del catálogo observado'],
  ['SAN.MC', 'Control negativo: sin archivo local'],
];
if (process.argv.length > 2) throw new Error('Muestra fija: no admite rutas, opciones ni credenciales');
const evidenceName = 'output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json';
const evidenceBytes = await readFile(new URL(`../../${evidenceName}`, import.meta.url));
const evidence = JSON.parse(evidenceBytes.toString('utf8'));
assertCatalogSnapshot(evidence);
const generatedAt = new Date().toISOString(), observedOn = generatedAt.slice(0, 10);
if (evidence.at > generatedAt) throw new Error('Evidencia de catálogo posterior a la lectura');
const cases = [];
for (const [symbol, purpose] of selection) {
  const asset = evidence.assets.find(a => a.eodhd_symbol.toUpperCase() === symbol);
  let rawBytes = null;
  if (asset) {
    try { rawBytes = await readFile(join(RAW_DIRECTORY, `${symbol}.fundamentals.json`)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  cases.push({ purpose, ...normalizeSample({ rawBytes, asset, symbol, observedOn }) });
}
const records = cases.flatMap(c => c.records);
const keys = new Set();
for (const record of records) {
  if (validateRecord(record, observedOn).length) throw new Error('Registro inválido: se cancela la generación');
  const key = [record.asset_id, record.symbol, record.kind, record.statement || '', record.period_end || record.observed_on].join('|');
  if (keys.has(key)) throw new Error('Registro duplicado: se cancela la generación');
  keys.add(key);
}
const summaries = cases.map(({ records: companyRecords, ...rest }) => ({ ...rest,
  record_count: companyRecords.length, annual_count: companyRecords.filter(r => r.kind === 'annual').length,
  null_value_count: companyRecords.reduce((n, r) => n + Object.values(r.values)
    .filter(value => (r.kind === 'annual' ? value : value.value) === null).length, 0),
}));
const counts = { cases: cases.length, companies_with_records: cases.filter(c => c.records.length).length,
  rejected_companies: cases.filter(c => !c.records.length).length,
  rejected_records: cases.reduce((n, c) => n + c.rejected.filter(r => r.statement || r.kind).length, 0),
  records: records.length, annual: records.filter(r => r.kind === 'annual').length,
  ratios: records.filter(r => r.kind === 'ratios').length,
  annual_without_currency: records.filter(r => r.kind === 'annual' && !r.currency).length,
  annual_without_scale: records.filter(r => r.kind === 'annual' && r.scale === null).length,
  records_without_download_date: records.filter(r => r.source.downloaded_at === null).length,
};
const normalized = { schema: 'nuvia-local-review-sample.v1', publication_status: 'blocked',
  scope: 'Revisión local de archivos existentes. No publicable ni conectado a la alfa.',
  generated_at: generatedAt, ratio_observation_meaning: 'Lectura del archivo local; no refresco de mercado ni periodo TTM.',
  catalog_evidence: { path: evidenceName, sha256: sha256(evidenceBytes), observed_at: evidence.at,
    live_rechecked: false },
  counts, records,
};
const review = { generated_at: generatedAt, publication_status: 'blocked',
  catalog_evidence: normalized.catalog_evidence, counts, cases: summaries };
const base = fileURLToPath(new URL('../../output/fundamentales-muestra/', import.meta.url));
await mkdir(base, { recursive: true });
const directory = await mkdtemp(join(base, `${observedOn}-`));
const files = { 'muestra.json': normalized, 'revision.json': review };
const hashes = {};
for (const [name, content] of Object.entries(files)) {
  const bytes = Buffer.from(`${JSON.stringify(content, null, 2)}\n`, 'utf8');
  await writeFile(join(directory, name), bytes, { flag: 'wx' });
  const saved = await readFile(join(directory, name));
  if (sha256(saved) !== sha256(bytes)) throw new Error('La verificación de escritura no coincide');
  hashes[name] = sha256(saved);
}
await writeFile(join(directory, 'integridad.json'), JSON.stringify({ generated_at: generatedAt,
  publication_status: 'blocked', files: hashes }, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ directory, counts, cases: summaries.map(c => ({ symbol: c.symbol,
  status: c.status, records: c.record_count, rejected: c.rejected,
  issue_codes: [...new Set(c.issues.map(i => i.code))] })) }, null, 2));

// Compara dist con el manifiesto de un ensayo limpio terminado. Solo lectura.
import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
if (!process.argv[2]) throw new Error('Indicar resultado.json de la instalación limpia');
const reportFile = resolve(process.argv[2]);
assert.ok(reportFile.startsWith(resolve(root, 'output/cierre-alfa') + sep), 'El manifiesto debe pertenecer a un ensayo local');
const report = JSON.parse(await readFile(reportFile, 'utf8'));
assert.equal(report.state, 'built', 'El ensayo limpio no terminó correctamente');
assert.ok(Array.isArray(report.artifact) && report.artifact.length > 0);
assert.ok(report.commands.every(command => command.exitCode === 0));
const base = resolve(root, 'dist');
async function manifest(folder) {
  const entries = [];
  for (const name of (await readdir(folder)).sort()) {
    const path = resolve(folder, name), info = await lstat(path);
    assert.equal(info.isSymbolicLink(), false, 'No se comparan destinos de enlaces');
    if (info.isDirectory()) entries.push(...await manifest(path));
    else {
      const bytes = await readFile(path);
      entries.push({ path: relative(base, path).replaceAll('\\', '/'), bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  return entries;
}
const actual = await manifest(base);
assert.deepEqual(actual, report.artifact, 'El paquete local difiere del ensayo limpio');
console.log(JSON.stringify({ state: 'identical', files: actual.length,
  bytes: actual.reduce((sum, item) => sum + item.bytes, 0), report: relative(root, reportFile),
  remoteWrites: 0 }));

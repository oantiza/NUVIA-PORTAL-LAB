// Ensayo local de una instalación desde las entradas de entrega, sin .git,
// output, dist, dependencias previas ni credenciales del proveedor/base.
// No confirma, publica, modifica ramas ni conecta con la base de datos.
import { execFileSync, execSync } from 'node:child_process';
import { mkdtemp, mkdir, lstat, copyFile, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'output/cierre-alfa'); await mkdir(output, { recursive: true });
const work = await mkdtemp(resolve(output, 'instalacion-limpia-'));
const source = resolve(work, 'source'); await mkdir(source);
const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 20_000_000 }).split('\0').filter(Boolean))];
// El flujo se copia solo para que las pruebas lean su configuración; no se ejecuta.
const allowed = /^(?:\.github\/workflows\/pages\.yml$|[^/]+\.(?:html|js|mjs|json|txt|xml|svg)|(?:company-analysis|docs|scripts|estilos|js|_ds|core|data|src\/assets|universo)\/)/;
const excluded = /(?:^|\/)(?:node_modules|build|dist|output|\.git|\.env[^/]*)(?:\/|$)|\.(?:pem|key|p12|pfx)$/i;
const report = { startedAt: new Date().toISOString(), sourceDirectory: relative(root, source), copied: 0, skippedLinks: 0, commands: [], remoteWrites: 0 };
const env = { ...process.env, NUVIA_RENDER_OFFLINE: '1' };
for (const key of Object.keys(env)) if (/EODHD|GOOGLE_APPLICATION_CREDENTIALS|FIREBASE|PRIVATE_KEY|ACCESS_TOKEN|API_KEY/i.test(key)) delete env[key];
try {
  for (const file of files.filter(f => allowed.test(f) && !excluded.test(f))) {
    const origin = resolve(root, file), destination = resolve(source, file);
    if (!origin.startsWith(root + sep) || !destination.startsWith(source + sep)) throw new Error('Ruta de copia fuera del proyecto');
    let info; try { info = await lstat(origin); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (info.isSymbolicLink()) { report.skippedLinks++; continue; }
    if (!info.isFile()) continue;
    await mkdir(dirname(destination), { recursive: true }); await copyFile(origin, destination); report.copied++;
  }
  for (const command of ['npm ci --no-audit --no-fund', 'npm ci --prefix company-analysis --no-audit --no-fund',
    'npm run build:company-analysis', 'npm run test:analisis',
    'node docs/nuvia-economia-entry.test.mjs .', 'node docs/nuvia-company-privacy.test.mjs .',
    'node scripts/build-site.mjs', 'node scripts/check-static-site.mjs dist',
    'node docs/nuvia-economia-entry.test.mjs dist', 'node docs/nuvia-company-privacy.test.mjs dist',
    'node docs/nuvia-news-editorial.test.mjs dist']) {
    const log = resolve(work, `step-${report.commands.length + 1}.log`);
    try {
      const result = execSync(command, { cwd: source, env, encoding: 'utf8', maxBuffer: 30_000_000, timeout: 180_000, windowsHide: true });
      await writeFile(log, result); report.commands.push({ command, exitCode: 0, log: relative(root, log) });
    } catch (error) {
      await writeFile(log, String(error.stdout || '') + String(error.stderr || ''));
      report.commands.push({ command, exitCode: error.status ?? -1, log: relative(root, log) }); throw new Error('Falló una etapa; consultar su registro local');
    }
  }
  async function manifest(folder, base = folder) {
    const entries = [];
    for (const name of (await readdir(folder)).sort()) {
      const file = resolve(folder, name), info = await lstat(file);
      if (info.isSymbolicLink()) throw new Error('Enlace simbólico en la salida');
      if (info.isDirectory()) entries.push(...await manifest(file, base));
      else { const bytes = await readFile(file); entries.push({ path: relative(base, file).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
    }
    return entries;
  }
  report.artifact = await manifest(resolve(source, 'dist'));
  report.state = 'built';
} catch (error) { report.state = 'failed'; report.message = error.message; process.exitCode = 1; }
report.completedAt = new Date().toISOString();
await writeFile(resolve(work, 'resultado.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ state: report.state, copied: report.copied, commands: report.commands, artifactFiles: report.artifact?.length, report: resolve(work, 'resultado.json'), remoteWrites: 0 }, null, 2));

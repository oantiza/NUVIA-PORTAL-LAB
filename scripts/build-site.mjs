import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const output = resolve(root, 'dist');

const topLevelFiles = [
  'index.html',
  'academia.html',
  'cartera.html',
  'curso.html',
  'fiscalidad.html',
  'guia-fiscal.html',
  'guia-impuestos.html',
  'guia-planificacion.html',
  'jubilacion.html',
  'lecturas.html',
  'mercados.html',
  'temas.html',
  'vivienda.html',
  'support.js',
  'web2-integration.js',
  'web2-core-bridge.js',
  'tema-claro.css',
  'favicon.svg'
];

const directories = ['_ds', 'core', 'data', 'src/assets'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of topLevelFiles) {
  await cp(resolve(root, file), resolve(output, file));
}

for (const directory of directories) {
  await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
}

const published = await readdir(output);
console.log(`Publicación preparada en dist/ con ${published.length} elementos de primer nivel.`);

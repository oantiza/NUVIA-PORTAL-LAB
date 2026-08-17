/**
 * Convierte imagenes PNG/JPG a WebP conservando el original.
 *
 * El original se queda en el repositorio (es archivo de produccion) pero deja
 * de publicarse: build-site.mjs solo copia a dist/ lo que el HTML referencia,
 * asi que basta con repuntar la referencia al .webp.
 *
 * Uso:  node scripts/optimizar-imagenes.mjs <fichero|glob> [calidad]
 */
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { resolve, dirname, basename, join } from 'node:path';

const args = process.argv.slice(2);
if (!args.length) { console.error('Falta la ruta a convertir.'); process.exit(1); }
const calidad = Number(args[1]) || 85;

const kb = n => `${Math.round(n / 1024)} KB`;

async function convertir(ruta) {
  const destino = join(dirname(ruta), basename(ruta).replace(/\.(png|jpe?g)$/i, '.webp'));
  const antes = (await stat(ruta)).size;
  await sharp(ruta).webp({ quality: calidad, effort: 6 }).toFile(destino);
  const despues = (await stat(destino)).size;
  console.log(`  ${basename(ruta).padEnd(50)} ${kb(antes).padStart(8)} -> ${kb(despues).padStart(7)}  (${Math.round(100 - 100 * despues / antes)}% menos)`);
  return [antes, despues];
}

const patron = args[0];
const dir = dirname(patron);
const regex = new RegExp('^' + basename(patron).replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
const ficheros = (await readdir(dir)).filter(f => regex.test(f)).map(f => resolve(dir, f));

if (!ficheros.length) { console.error(`Sin coincidencias para ${patron}`); process.exit(1); }

console.log(`\nConvirtiendo ${ficheros.length} fichero(s) a WebP calidad ${calidad}:\n`);
let a = 0, d = 0;
for (const f of ficheros) { const [x, y] = await convertir(f); a += x; d += y; }
console.log(`\n  TOTAL ${kb(a)} -> ${kb(d)}  (${Math.round(100 - 100 * d / a)}% menos)\n`);
console.log('Los originales siguen en el repositorio. Actualiza las referencias del HTML al .webp.\n');

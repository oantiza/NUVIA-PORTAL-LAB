/**
 * Regresión estática: Academia NUVIA debe abrir directamente, sin entradilla.
 * Ejecutar con: node docs/nuvia-academy-intro.test.mjs
 */
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'academia.html'), 'utf8');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');

async function existe(ruta) {
  try {
    await access(resolve(root, ruta));
    return true;
  } catch {
    return false;
  }
}

let failures = 0;
function check(label, condition) {
  const ok = Boolean(condition);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${label}`);
  if (!ok) failures += 1;
}

console.log('— Acceso directo a Academia NUVIA —');
check('Academia no contiene la capa ni controles de la entradilla',
  !html.includes('data-academy-intro')
  && !html.includes('Saltar introducción'));
check('Academia no carga el controlador ni el vídeo de entrada',
  !html.includes('nuvia-academy-intro.js')
  && !html.includes('nuvia-academy-entry-intro.mp4'));
check('No quedan estilos que bloqueen la página durante una entradilla',
  !css.includes('has-academy-intro')
  && !css.includes('.nuvia-academy-intro'));
check('El controlador y el MP4 de entrada ya no forman parte del sitio',
  !(await existe('js/nuvia-academy-intro.js'))
  && !(await existe('src/assets/education/nuvia-academy/nuvia-academy-entry-intro.mp4')));

if (failures) {
  console.error(`\n${failures} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: Academia abre directamente.');

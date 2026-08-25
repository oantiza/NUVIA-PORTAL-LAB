/**
 * Regresión estática de la apertura audiovisual de Academia NUVIA.
 * Ejecutar con: node docs/nuvia-academy-intro.test.mjs
 */
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'academia.html'), 'utf8');
const script = await readFile(resolve(root, 'js/nuvia-academy-intro.js'), 'utf8');
const css = await readFile(resolve(root, 'estilos/nuvia-pages.css'), 'utf8');
const videoPath = resolve(root, 'src/assets/education/nuvia-academy/nuvia-academy-entry-intro.mp4');
const videoInfo = await stat(videoPath);
const videoHeader = await readFile(videoPath).then((buffer) => buffer.subarray(0, 32).toString('ascii'));

let failures = 0;
function check(label, condition) {
  const ok = Boolean(condition);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${label}`);
  if (!ok) failures += 1;
}

console.log('— Apertura audiovisual de Academia NUVIA —');
check('El vídeo MP4 existe y no está vacío', videoInfo.isFile() && videoInfo.size > 100_000);
check('La cabecera del archivo corresponde a un contenedor MP4', videoHeader.includes('ftyp'));
check('Academia referencia el vídeo local', html.includes('src/assets/education/nuvia-academy/nuvia-academy-entry-intro.mp4'));
check('La reproducción de entrada es automática, silenciada e integrada', /<video[^>]*\bautoplay\b[^>]*\bmuted\b[^>]*\bplaysinline\b/s.test(html));
check('Hay una salida visible para omitir la introducción', html.includes('data-academy-intro-skip') && html.includes('Saltar introducción'));
check('La apertura aísla el fondo y devuelve el foco al contenido',
  html.includes('aria-modal="true"')
  && script.includes("setAttribute('inert', '')")
  && script.includes("removeAttribute('inert')")
  && script.includes("main.focus({ preventScroll: true })"));
check('El controlador responde al final, error, Escape y tiempo máximo',
  /addEventListener\('ended'/.test(script)
  && /addEventListener\('error'/.test(script)
  && /event\.key === 'Escape'/.test(script)
  && /safety-timeout/.test(script));
check('Se respeta la preferencia de movimiento reducido', script.includes("prefers-reduced-motion: reduce"));
check('La capa cubre el escritorio sin ocultar el contenido de la página',
  /\.nuvia-academy-intro\s*\{[^}]*inset:\s*0;[^}]*position:\s*fixed;/s.test(css)
  && !/\.nuvia-page\s*\{[^}]*display:\s*none/s.test(css));

if (failures) {
  console.error(`\n${failures} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: apertura audiovisual de Academia NUVIA.');

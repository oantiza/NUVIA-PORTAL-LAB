import { access, readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || '.');
const requiredPages = [
  'index.html',
  'academia.html',
  'cartera.html',
  'curso.html',
  'fiscalidad.html',
  'guia-impuestos.html',
  'jubilacion.html',
  'lecturas.html',
  'mercados.html',
  'temas.html',
  'vivienda.html'
];

await Promise.all(requiredPages.map((page) => access(resolve(root, page))));

const DIRECTORIOS_IGNORADOS = new Set([
  '.firebase', '.git', '.github', 'build', 'dist', 'node_modules', 'tmp',
  'output', '_archivo', 'coverage', '.next', '.cache',
]);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && DIRECTORIOS_IGNORADOS.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

function localTarget(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('data:')) return null;
  if (/^(?:https?:|mailto:|tel:|javascript:|\/\/)/i.test(trimmed)) return null;
  if (/[{}]/.test(trimmed)) return null;
  return decodeURIComponent(trimmed.split('#')[0].split('?')[0]);
}

/* Los ficheros que empiezan por _ no se publican: _plantilla.html es el punto
   de partida para secciones nuevas y contiene marcadores ⟨…⟩ y rutas de ejemplo
   a propósito. Validarlo como si fuese una página daba falsos errores. */
const htmlFiles = (await listFiles(root))
  .filter((file) => extname(file).toLowerCase() === '.html')
  .filter((file) => !basename(file).startsWith('_'));
const missing = [];
const referencePattern = /\b(?:href|src)=["']([^"']+)["']/gi;

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, 'utf8');
  const usesDesignComponentRuntime = /<x-dc\b/i.test(html)
    && /<script\b[^>]*data-dc-script/i.test(html);
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    missing.push(`${htmlPath}: falta un título de página`);
  }
  // En los Design Components, support.js resuelve las expresiones antes de
  // entregarlas a React. La misma sintaxis sí sería inválida en HTML estático.
  if (!usesDesignComponentRuntime && /\s(?:d|points)=["']\s*\{\{/i.test(html)) {
    missing.push(`${htmlPath}: contiene un atributo SVG dinámico que provoca errores al cargar`);
  }
  /* En un <input>, un value="{{ … }}" se pinta tal cual mientras no arranca el
     runtime: el usuario ve la llave. Se usa defaultValue, que React entiende y
     el navegador ignora. En un <select> el value no se pinta —lo hacen las
     <option>—, así que ahí sí se enlaza, y con onChange en la misma etiqueta no
     hay aviso de campo controlado sin manejador.

     Ojo: data-dc-value NO enlaza nada. El runtime lo pasa como atributo data-
     tal cual, así que el campo se queda vacío o con la primera opción. */
  if (/<input\b[^>]*\svalue=["']\s*\{\{/i.test(html)) {
    missing.push(`${htmlPath}: un <input> con value="{{ … }}" enseña la plantilla antes de arrancar; usa defaultValue`);
  }
  for (const etiqueta of html.match(/<select\b[^>]*>/gi) || []) {
    if (/\svalue=["']\s*\{\{/i.test(etiqueta) && !/\sonChange=/i.test(etiqueta)) {
      missing.push(`${htmlPath}: un <select> enlaza value sin onChange y React avisará de campo controlado`);
    }
  }
  if (/<(?:input|select)\b[^>]*\sdata-dc-value=/i.test(html)) {
    missing.push(`${htmlPath}: data-dc-value no enlaza el valor de un campo; usa value con onChange, o defaultValue`);
  }
  for (const match of html.matchAll(referencePattern)) {
    const target = localTarget(match[1]);
    if (!target) continue;
    const targetPath = target.startsWith('/')
      ? resolve(root, target.slice(1))
      : resolve(dirname(htmlPath), target);
    if (targetPath !== root && !targetPath.startsWith(`${root}${sep}`)) {
      missing.push(`${htmlPath}: referencia fuera del sitio (${match[1]})`);
      continue;
    }
    try {
      const targetStat = await stat(targetPath);
      if (targetStat.isDirectory()) await access(resolve(targetPath, 'index.html'));
    } catch {
      missing.push(`${htmlPath}: falta ${match[1]}`);
    }
  }
}

if (missing.length) {
  throw new Error(`Referencias locales no válidas:\n${missing.join('\n')}`);
}

const daily = JSON.parse(await readFile(resolve(root, 'data/daily-content.json'), 'utf8'));
if (!daily.dailyEconomicNews?.title || daily.dailyEconomicNews.impactPoints?.length !== 3) {
  throw new Error('La noticia diaria debe incluir titular y exactamente tres claves de impacto.');
}
if (!Array.isArray(daily.dailyMacroIndicators) || daily.dailyMacroIndicators.length !== 5) {
  throw new Error('Deben existir exactamente cinco indicadores macroeconómicos.');
}

console.log(`Sitio estático verificado: ${htmlFiles.length} páginas y todas sus referencias locales.`);

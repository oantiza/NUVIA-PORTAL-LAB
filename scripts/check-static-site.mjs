import { access, readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, resolve, sep } from 'node:path';
import { CADENAS_SIN_MAESTRA, PATRON_CLAVE_EODHD } from './sin-maestra.mjs';

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
  // support.js resuelve las expresiones antes de entregarlas a React, así que el
  // gráfico se pinta bien. Pero el navegador ya ha analizado la plantilla en
  // crudo para entonces, y un points="{{ … }}" dentro de un <svg> le hace lanzar
  // un error de consola igualmente: cuatro en jubilacion.html y diez en
  // academia.html, medidos. Se tolera porque no afecta a lo que se ve, no
  // porque no ocurra. En una página sin runtime no hay nada que lo resuelva
  // después, y ahí sí es un fallo de verdad.
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
  /* Las fuentes se autoalojan (22-08-2026): ni un <link> ni un preconnect a
     Google. Se mira el HTML sin comentarios.
     company-analysis/ queda fuera: es la app de «Análisis y valoración de
     empresas», que se compila aparte y trae Fraunces + Roboto Flex de Google
     en su propio <head> (index.html:8-11 y su build). Está fuera del perímetro
     de este trabajo: anotado, no tocado. */
  if (!htmlPath.includes(`${sep}company-analysis${sep}`)
      && /fonts\.(?:googleapis|gstatic)\.com/i.test(html.replace(/<!--[\s\S]*?-->/g, ''))) {
    missing.push(`${htmlPath}: enlaza las fuentes de Google; van autoalojadas en estilos/fuentes/`);
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

/* ══ Cuatro reglas de las hojas de estilo ════════════════════════════════════
   Las cuatro salieron de defectos reales, no de una preferencia:

   1 · Un token de espaciado usado como tamaño de letra. Aparecía en seis
       sitios (--nv-space-4 y --nv-space-5 dan 16 y 20 px, así que «funciona»
       por coincidencia) y saltaba a la vista solo al medir la escala.

   2 · Un selector de <span> por descendencia. El runtime envuelve cada
       interpolación en <span class="sc-interp">, que debe ser transparente;
       una regla como «.contenedor span» lo alcanza igual y el texto
       interpolado se pinta distinto del elemento que lo contiene. Rompía la
       cifra del ejercicio del curso, el enunciado del test, la cuota del test
       de estrés de vivienda, el nombre de la compañía en la tabla de
       cotizaciones, la fecha de los dos calendarios y el enlace a la fuente de
       las tres guías fiscales. Se admite el combinador de hijo directo y se
       admite una clase.

   3 · Las fuentes, traídas de Google. Venían por @import en nuvia-tokens.css:
       tres viajes en serie antes del primer woff2 (403 ms medidos) y la IP de
       cada lector enviada a un tercero. Desde el 22-08-2026 se autoalojan.

   4 · Un woff2 declarado que no existe. Renombrar o no subir el fichero deja
       todo el sitio en Georgia/system-ui sin que nada avise: el CSS es válido
       y la página «funciona».
   ═══════════════════════════════════════════════════════════════════════════ */
const problemasCss = [];
for (const hoja of ['estilos/nuvia-tokens.css', 'estilos/nuvia-components.css', 'estilos/nuvia-pages.css']) {
  const css = await readFile(resolve(root, hoja), 'utf8');
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');

  for (const m of sinComentarios.matchAll(/font-size:\s*var\(--nv-space-\d+\)/g)) {
    problemasCss.push(`${hoja}: «${m[0]}» usa un token de espaciado como tamaño de letra; la escala es --nv-label, --nv-body-sm, --nv-body, --nv-body-lg, --nv-title-*, --nv-display-*`);
  }

  /* 3 · Ninguna dependencia externa de fuentes (22-08-2026).
     Las familias se autoalojan en estilos/fuentes/. Un @import o un url() a
     fonts.googleapis.com / fonts.gstatic.com vuelve a meter un tercero en la
     ruta crítica de pintado —tres viajes en serie, medidos: el primer woff2 no
     llegaba hasta los 403 ms— y manda la IP de cada lector a Google. Se mira el
     CSS ya sin comentarios, así que la nota que explica todo esto en
     nuvia-tokens.css no dispara la regla. */
  for (const m of sinComentarios.matchAll(/(?:@import|url\()[^;{}]*?fonts\.(?:googleapis|gstatic)\.com/g)) {
    problemasCss.push(`${hoja}: «${m[0].slice(0, 70)}…» vuelve a traer las fuentes de Google; van autoalojadas en estilos/fuentes/`);
  }

  /* 4 · Y un woff2 declarado tiene que existir. Sin esto, renombrar o no subir
     un fichero deja el sitio en Georgia/system-ui sin que nada avise. */
  for (const m of sinComentarios.matchAll(/url\(['"]?([^'")]+\.woff2?)['"]?\)/g)) {
    try {
      await access(resolve(root, 'estilos', m[1]));
    } catch {
      problemasCss.push(`${hoja}: declara ${m[1]} y ese fichero no existe en estilos/`);
    }
  }

  for (const m of sinComentarios.matchAll(/([^{}\n;]+?)\s*\{[^{}]*\}/g)) {
    for (const selector of m[1].split(',')) {
      const s2 = selector.trim();
      if (!s2 || s2.startsWith('@') || s2.startsWith('%')) continue;
      if (/(?:^|\s)(?:[.#][\w-]+|\])\s+span(?![\w-])(?![^\s]*\.)/.test(s2) && !/>\s*span/.test(s2)) {
        problemasCss.push(`${hoja}: «${s2}» alcanza el <span class="sc-interp"> del runtime; usa «> span» o la clase del elemento`);
      }
    }
  }
}
if (problemasCss.length) {
  throw new Error(`Reglas de estilo no válidas:\n${problemasCss.join('\n')}`);
}

const daily = JSON.parse(await readFile(resolve(root, 'data/daily-content.json'), 'utf8'));
if (!daily.dailyEconomicNews?.title || daily.dailyEconomicNews.impactPoints?.length !== 3) {
  throw new Error('La noticia diaria debe incluir titular y exactamente tres claves de impacto.');
}
if (!Array.isArray(daily.dailyMacroIndicators) || daily.dailyMacroIndicators.length !== 5) {
  throw new Error('Deben existir exactamente cinco indicadores macroeconómicos.');
}

/* ══ Alfa con base propia (Entrega 2b) ═══════════════════════════════════════
   Lo que NO puede haber en el árbol publicado:
   - el universo de la alfa (universo/universo-alfa.*): es contenido editorial
     del repositorio, no de la web; el catálogo se sirve desde Firestore;
   - company-analysis/: entrada alfa sin dependencias de la base profesional;
   - ninguna cadena de la base profesional, de funciones en la nube, de Auth
     ni una clave de EODHD en el código publicado (js/ y páginas). */
const problemasAlfa = [];
const todos = await listFiles(root);
const esDist = basename(root) === 'dist';
for (const f of todos) {
  const nombre = basename(f);
  if (!/^universo-alfa\./.test(nombre)) continue;
  const enCarpetaUniverso = basename(dirname(f)) === 'universo' && dirname(dirname(f)) === root;
  if (esDist || !enCarpetaUniverso) problemasAlfa.push(`${f}: el universo de la alfa vive solo en universo/ y no se publica`);
}
if (esDist) await access(resolve(root, 'company-analysis/index.html'));
const CADENAS_MAESTRA = CADENAS_SIN_MAESTRA.map(([cadena]) => cadena);
for (const f of todos) {
  const rel = f.slice(root.length + 1).replace(/\\/g, '/');
  const companyAlpha = esDist && rel.startsWith('company-analysis/');
  if (!companyAlpha && !/^(?:js\/|[^/]+\.html$|web2-integration\.js$|nuvia-site-unified\.js$)/.test(rel)) continue;
  if (rel.startsWith('js/nuvia-cuenta.js')) continue;
  if (!/\.(?:m?js|html)$/.test(rel)) continue;
  const texto = await readFile(f, 'utf8');
  for (const cadena of CADENAS_MAESTRA) {
    if (texto.includes(cadena)) problemasAlfa.push(`${rel}: contiene «${cadena}» (regresión «sin maestra»)`);
  }
  if (PATRON_CLAVE_EODHD.test(texto)) problemasAlfa.push(`${rel}: clave de EODHD pegada`);
}
if (problemasAlfa.length) {
  throw new Error(`Alfa con base propia:\n${problemasAlfa.join('\n')}`);
}

console.log(`Sitio estático verificado: ${htmlFiles.length} páginas y todas sus referencias locales. Sin universo privado ni rastro de la base profesional; módulo alfa independiente.`);

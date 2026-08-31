/* ============================================================================
   NUVIA · VALIDADOR DE CONSISTENCIA
   ----------------------------------------------------------------------------
   Sin esto, el sistema se degrada solo. Con esto, no puede.

   Instalación:
     1. Copiar a scripts/check-consistencia.mjs
     2. En package.json:
        "validate": "node scripts/check-parity.mjs . && node scripts/check-static-site.mjs . && node scripts/check-consistencia.mjs ."

   Uso:
     node scripts/check-consistencia.mjs .          → valida
     node scripts/check-consistencia.mjs . --presupuesto → imprime el presupuesto
                                                           actual, para fijar el techo

   EL PRESUPUESTO DE ESTILOS INLINE es la pieza clave. Hoy hay 2.786. El techo
   se fija por encima del recuento actual de cada página y se BAJA cada semana.
   Nunca sube. Así la deuda solo puede decrecer mientras se construye el resto
   del sitio.
   ========================================================================== */

import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const soloPresupuesto = process.argv.includes('--presupuesto');

const CANONICA_BASE = 'https://oantiza.github.io/NUVIA-PORTAL-LAB/';

/* La familia de logotipos en uso. Está aprobada pero declarada candidata, así
   que puede cambiar: se sustituye con
     node scripts/cambiar-familia-logo.mjs <carpeta>
   Esta comprobación impide que el cambio se quede a medias y el sitio acabe
   con dos familias distintas conviviendo. */
const FAMILIA_LOGO = 'nuvia-family-wealth-exact-2026-v2';

/* Techo de atributos style="…" por página.
   Bajar estos números conforme se migra. Cuando una llegue a 0, se congela. */
const PRESUPUESTO_INLINE = {
  // Migración completada: las 13 páginas publicadas están en cero.
  // Los tres restantes son valores calculados en tiempo real que no pueden
  // expresarse como clase (anchura de una barra de progreso).
  'academia.html': 0,
  'cartera.html': 0,
  'curso.html': 1,          // barra de progreso del capítulo
  'fiscalidad.html': 0,
  'guia-fiscal.html': 0,
  'guia-impuestos.html': 0,
  'guia-planificacion.html': 1,  // barra de progreso de la hoja de ruta
  'guia-sucesiones.html': 0,
  'guia-ahorro.html': 0,
  'guia-calendario.html': 0,
  'index.html': 0,
  'jubilacion.html': 0,
  'lecturas.html': 0,
  'mercados.html': 0,
  'que-es-nuvia.html': 0,
  'temas.html': 0,
  'vivienda.html': 0,
  'sistema-visual.html': 11,     // muestra del sistema, no publicada
};

/* Colores retirados del uso como texto por no llegar a WCAG AA.
   Siguen valiendo como fondo, filete o icono: por eso solo se avisa. */
const COLORES_RETIRADOS = ['#94ad58', '#b69152', '#8a94a6', '#697587', '#75798c'];

const errores = [];
const avisos = [];

const paginas = (await readdir(root))
  .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
  .sort();

if (paginas.length === 0) {
  console.error('No se ha encontrado ninguna página HTML en', root);
  process.exit(1);
}

const presupuestoReal = {};

for (const pagina of paginas) {
  const html = await readFile(join(root, pagina), 'utf8');

  /* El markup sin <script> ni comentarios. Contar encabezados o imágenes sobre
     el fichero entero da falsos positivos: un `<h1>` mencionado dentro de un
     comentario de JavaScript no es un encabezado de la página. */
  const markup = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const en = (msg) => errores.push(`${pagina}: ${msg}`);
  const ojo = (msg) => avisos.push(`${pagina}: ${msg}`);

  /* ── 1 · Canónica ──────────────────────────────────────────────────────
     El fallo que estaba mandando toda la autoridad al repositorio antiguo. */
  const canonica = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (!canonica) {
    en('falta <link rel="canonical">');
  } else if (!canonica[1].startsWith(CANONICA_BASE)) {
    en(`canónica apunta fuera del proyecto → ${canonica[1]}`);
  }

  /* ── 2 · Metadatos mínimos ───────────────────────────────────────────── */
  if (!/<title>[^<]{5,}<\/title>/i.test(html)) en('<title> ausente o demasiado corto');
  if (!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}["']/i.test(html)) {
    en('falta <meta name="description"> con contenido suficiente');
  }
  if (!/<html[^>]+lang=["']es["']/i.test(html)) en('falta lang="es" en <html>');

  /* ── 3 · Un solo H1 y jerarquía sin saltos ───────────────────────────── */
  const h1 = (markup.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 === 0) en('no hay <h1>');
  if (h1 > 1) en(`hay ${h1} <h1>, debe haber exactamente uno`);

  const niveles = [...markup.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
  for (let i = 0; i < niveles.length - 1; i++) {
    if (niveles[i + 1] - niveles[i] > 1) {
      ojo(`salto de encabezado H${niveles[i]} → H${niveles[i + 1]}`);
      break;
    }
  }

  /* ── 4 · Marcadores de plantilla sin resolver en el HTML publicado ────── */
  const enH1 = markup.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i);
  if (enH1 && /\{\{/.test(enH1[1])) {
    ojo('el <h1> contiene una expresión {{ }} sin resolver: invisible para buscadores');
  }

  /* ── 5 · Presupuesto de estilos inline ────────────────────────────────── */
  const inline = (markup.match(/\sstyle=["']/g) ?? []).length;
  presupuestoReal[pagina] = inline;
  const techo = PRESUPUESTO_INLINE[pagina];
  if (techo === undefined) {
    ojo(`página nueva sin techo asignado (${inline} estilos inline). Añádela a PRESUPUESTO_INLINE con techo 0.`);
    if (inline > 0) en(`página nueva con ${inline} estilos inline: deben ser 0`);
  } else if (inline > techo) {
    en(`${inline} estilos inline, el techo es ${techo}. El presupuesto solo baja.`);
  }

  /* ── 6 · Imágenes ─────────────────────────────────────────────────────── */
  const imgs = markup.match(/<img\b[^>]*>/gi) ?? [];
  const sinAlt = imgs.filter((i) => !/\salt=/i.test(i)).length;
  const sinMedidas = imgs.filter((i) => !(/\swidth=/i.test(i) && /\sheight=/i.test(i))).length;
  const sinLazy = imgs.filter((i) => !/\sloading=/i.test(i)).length;

  if (sinAlt > 0) en(`${sinAlt} imagen(es) sin alt`);
  if (sinMedidas > 0) ojo(`${sinMedidas} imagen(es) sin width/height: provocan salto de maquetación`);
  if (sinLazy > 1) ojo(`${sinLazy} imagen(es) sin loading="lazy" (la del héroe debe ir sin lazy)`);

  /* ── 7 · Colores retirados usados como texto ──────────────────────────── */
  for (const color of COLORES_RETIRADOS) {
    const patron = new RegExp(`color\\s*:\\s*${color}`, 'i');
    if (patron.test(html)) ojo(`usa ${color} como color de texto: no llega a WCAG AA`);
  }

  /* ── 7b · Una sola familia de logotipos ───────────────────────────────── */
  const familias = new Set(
    [...html.matchAll(/src\/assets\/brand\/([a-z0-9-]+)\//g)].map((m) => m[1])
  );
  for (const f of familias) {
    if (f !== FAMILIA_LOGO) {
      en(`usa la familia de logotipos "${f}" en lugar de "${FAMILIA_LOGO}". ` +
         'Ejecuta: node scripts/cambiar-familia-logo.mjs ' + FAMILIA_LOGO);
    }
  }

  /* ── 8 · Cáscara común ────────────────────────────────────────────────── */
  /* sistema-visual.html es la muestra del sistema, no una página del sitio:
     enseña una cabecera y un pie de referencia, no los usa. */
  const esMuestra = pagina === 'sistema-visual.html';
  if (!esMuestra) {
    if (!/class=["']nuvia-site-header["']/.test(html)) ojo('no usa la cabecera común nuvia-site-header');
    if (!/class=["']nuvia-site-footer["']/.test(html)) ojo('no usa el pie común nuvia-site-footer');
  }
  if (!/<main[\s>]/i.test(html)) en('falta <main>');

  /* ── 9 · Restos de la plantilla ───────────────────────────────────────── */
  if (/⟨[^⟩]+⟩/.test(markup)) en('quedan marcadores ⟨…⟩ de la plantilla sin rellenar');
  if (/name=["']robots["'][^>]*noindex/i.test(html) && !esMuestra) {
    ojo('lleva noindex: correcto si la sección sigue en preparación, quitar al publicar');
  }
}

/* ── Modo presupuesto ───────────────────────────────────────────────────── */
if (soloPresupuesto) {
  const total = Object.values(presupuestoReal).reduce((a, b) => a + b, 0);
  console.log('\nEstilos inline por página:\n');
  Object.entries(presupuestoReal)
    .sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`  ${String(n).padStart(5)}  ${p}`));
  console.log(`\n  ${String(total).padStart(5)}  TOTAL\n`);
  process.exit(0);
}

/* ── Resultado ──────────────────────────────────────────────────────────── */
if (avisos.length > 0) {
  console.log(`\nAvisos (${avisos.length}) — no bloquean la publicación:\n`);
  avisos.forEach((a) => console.log(`  · ${a}`));
}

if (errores.length > 0) {
  console.error(`\nErrores (${errores.length}) — bloquean la publicación:\n`);
  errores.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}

console.log(`\n✓ ${paginas.length} páginas validadas sin errores.\n`);

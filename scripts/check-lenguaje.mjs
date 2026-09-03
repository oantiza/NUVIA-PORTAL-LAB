/**
 * Revisión de lenguaje del laboratorio de cartera (guía, paso 25).
 *
 * Las bases (§2, MiFID II) exigen describir sin prescribir: se muestra la
 * métrica y se explica qué significa; la conclusión la saca el usuario. Este
 * validador busca en las superficies del laboratorio los giros que cruzan esa
 * línea y rompe la build si aparece alguno. La lista nace de la propia guía
 * («mejor», «recomendado», «óptimo», «conviene», «deberías», «ideal para») y
 * se amplía con las formas de personalización y juicio que las bases citan.
 *
 *   node scripts/check-lenguaje.mjs [raíz]
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.argv[2] || '.';

/** Superficies que ve el visitante del laboratorio. */
const FICHEROS = [
  'cartera.html',
  'js/nuvia-simulador.js',
  'js/nuvia-buscador.js',
  'js/nuvia-constructor.js',
  'js/nuvia-datos.js',
  'js/nuvia-cuenta.js',
  'js/nuvia-analisis.js',
  'js/nuvia-informe.js',
  'js/nuvia-modelos.js',
  'js/nuvia-mapa.js',
  'js/nuvia-etiquetas.js',
];

/** Patrones prohibidos, con el porqué al lado. */
const PROHIBIDO = [
  [/\bmejor(?:es)?\b/iu, '«mejor» juzga: implica «para usted» (bases §2)'],
  /* «no emite recomendaciones» (la declaración) se permite; lo prohibido es
     recomendar: «recomendado», «recomendamos», «te recomiendo», «recomendable». */
  [/recomendad|recomendamos|recomiend[oae]|recomendable/iu, 'recomendar es la definición misma de asesoramiento'],
  [/óptim|\boptim[oa]s?\b/iu, '«óptimo» juzga la combinación concreta'],
  [/\bconviene\b|\bconvenient/iu, '«conviene» aconseja'],
  [/\bdeberías?\b|\bdebería usted\b/iu, '«deberías» aconseja'],
  [/ideal para/iu, '«ideal para» personaliza'],
  [/adecuad[oa]s? para/iu, '«adecuado para» introduce el perfil del lector'],
  [/\bpara ti\b|\bpara usted\b/iu, 'personaliza la conveniencia'],
  [/sugerimos|te sugiere|sugerencia de compra/iu, 'sugerir qué meter cruza la línea'],
  [/perfil (?:conservador|moderado|agresivo|arriesgado)/iu, 'jerga de idoneidad: introduce el perfil del lector'],
  [/garantiz/iu, 'nada está garantizado; ni para afirmarlo ni para negarlo con esa palabra'],
  [/\bcompra\b|\bvende\b|\bmantén\b/iu, 'comprar, vender o mantener: la norma cubre las tres direcciones'],
];

let errores = 0;
for (const fichero of FICHEROS) {
  let texto;
  try {
    texto = await readFile(resolve(root, fichero), 'utf8');
  } catch {
    console.error(`EN   ${fichero}: no se puede leer (¿movido sin actualizar check-lenguaje?)`);
    errores += 1;
    continue;
  }
  const lineas = texto.split('\n');
  for (const [patron, porque] of PROHIBIDO) {
    lineas.forEach((linea, i) => {
      if (patron.test(linea)) {
        console.error(`EN   ${fichero}:${i + 1} — ${porque}\n     ${linea.trim().slice(0, 120)}`);
        errores += 1;
      }
    });
  }
}

/* Declaraciones exigidas: estimaciones dichas como tales (bases §2, «los
   supuestos, visibles») y nota de fuentes en cada vista con datos (paso 26).
   En esta página nunca se cita EODHD: esa atribución es de la vista de
   análisis de empresas (lo vigila check-parity). */
const EXIGIDO = [
  ['cartera.html', ['no previsiones', 'pendientes de validación profesional', 'no constituye asesoramiento', 'base de datos NUVIA',
    'Versión alfa de NUVIA', 'Nada de lo que ves es una recomendación']],
  ['js/nuvia-simulador.js', ['supuestos propios de NUVIA']],
  ['js/nuvia-periodo-analisis.js', ['Datos de cierre', 'base de datos NUVIA']],
  /* Paso 28: el registro pide lo mínimo y lo declara; nada de teléfono,
     patrimonio ni cuestionarios de perfil. */
  /* Paso 29: lo opcional es opt-in de verdad; se declara que apagado no
     registra nada. */
  /* Paso 34: los cuatro derechos RGPD, nombrados y operativos. */
  ['js/nuvia-cuenta.js', ['correo y contraseña', 'Sin teléfono, sin datos de patrimonio', 'no se registrará nunca',
    'rectificación, supresión y portabilidad']],
  /* Paso 32: el análisis ampliado declara su fuente y nunca inventa.
     Paso 33: la proyección se declara simulación, jamás previsión. */
  ['js/nuvia-analisis.js', ['base de datos NUVIA', 'nunca se inventa', 'no es una previsión']],
  /* Paso 37: el informe es genérico, sin firma y sin recomendación. */
  ['js/nuvia-informe.js', ['idéntico para cualquiera', 'sin firma', 'no emite recomendaciones', 'base de datos NUVIA']],
  /* Paso 38: las carteras modelo son publicación, nunca propuesta. */
  ['js/nuvia-modelos.js', ['la misma para cualquiera', 'ni enlace para contratarla', 'No es una propuesta', 'base de datos NUVIA']],
  /* Paso 42: el mapa describe dónde está el dinero, no dónde debería. */
  ['js/nuvia-mapa.js', ['renta variable', 'describe dónde está hoy']],
];
for (const [fichero, declaraciones] of EXIGIDO) {
  const texto = await readFile(resolve(root, fichero), 'utf8');
  for (const exigido of declaraciones) {
    if (!texto.includes(exigido)) {
      console.error(`EN   ${fichero}: falta la declaración «${exigido}»`);
      errores += 1;
    }
  }
}

/* ══ Regresión «sin maestra» (Entrega 2b, alfa con base propia) ══════════════
   La alfa no puede hablar con la base profesional del fundador, con las
   funciones en la nube antiguas, con Firebase Auth ni llevar una clave de
   EODHD pegada. Si alguna de estas cadenas vuelve a aparecer en el código
   que se publica, la build falla. Excluidos: docs/, universo/ y
   company-analysis/ (fuera de la publicación en la alfa), y nuvia-cuenta.js
   mientras no se importe desde ninguna página. */
import { readdir, stat } from 'node:fs/promises';
import { CADENAS_SIN_MAESTRA, PATRON_CLAVE_EODHD, FICHEROS_DE_LA_LISTA } from './sin-maestra.mjs';

const SIN_MAESTRA = [...CADENAS_SIN_MAESTRA, [PATRON_CLAVE_EODHD, 'clave de EODHD pegada; solo por variable de entorno en scripts/']];
const RAICES_SIN_MAESTRA = ['js', 'scripts', '.github/workflows'];
const FICHEROS_SIN_MAESTRA = ['cartera.html', 'web2-integration.js', 'nuvia-site-unified.js'];
const EXCLUIDOS_SIN_MAESTRA = ['js/nuvia-cuenta.js'];

async function listaFicheros(dir) {
  const salida = [];
  let entradas;
  try { entradas = await readdir(resolve(root, dir)); } catch { return salida; }
  for (const nombre of entradas) {
    const rel = `${dir}/${nombre}`;
    const info = await stat(resolve(root, rel));
    if (info.isDirectory()) salida.push(...await listaFicheros(rel));
    else if (/\.(?:m?js|html|yml|yaml|json)$/.test(nombre)) salida.push(rel);
  }
  return salida;
}

const candidatos = [...FICHEROS_SIN_MAESTRA];
for (const dir of RAICES_SIN_MAESTRA) candidatos.push(...await listaFicheros(dir));
for (const fichero of candidatos) {
  if (EXCLUIDOS_SIN_MAESTRA.includes(fichero)) continue;
  let texto;
  try { texto = await readFile(resolve(root, fichero), 'utf8'); } catch { continue; }
  if (FICHEROS_DE_LA_LISTA.includes(fichero)) continue; // el fichero que lista las cadenas
  for (const [patron, porque] of SIN_MAESTRA) {
    const re = patron instanceof RegExp ? patron : new RegExp(patron.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const lineas = texto.split('\n');
    lineas.forEach((linea, i) => {
      if (re.test(linea)) {
        console.error(`EN   ${fichero}:${i + 1} — regresión «sin maestra»: ${porque}\n     ${linea.trim().slice(0, 120)}`);
        errores += 1;
      }
    });
  }
}

if (errores) {
  console.error(`\ncheck-lenguaje: ${errores} problema(s). La pantalla no debe permitir deducir qué hacer con el dinero, ni el código hablar con la base profesional.`);
  process.exit(1);
}
console.log('✓ Lenguaje del laboratorio: describe sin prescribir (paso 25). Sin rastro de la base profesional ni de Auth (Entrega 2b).');

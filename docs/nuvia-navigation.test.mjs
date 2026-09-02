import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const expectedGroups = [
  {
    "id": "economia",
    "label": "Economía y Finanzas",
    "children": [
      [
        "mercados.html",
        "Mercados y noticias"
      ],
      [
        "cartera.html",
        "Cartera"
      ]
    ]
  },
  {
    "id": "patrimonio",
    "label": "Patrimonio",
    "children": [
      [
        "vivienda.html",
        "Vivienda y coste de vida"
      ],
      [
        "jubilacion.html",
        "Jubilación"
      ],
      [
        "fiscalidad.html",
        "Impuestos"
      ],
      [
        "temas.html?topic=planificacion-patrimonial",
        "Planificación patrimonial"
      ]
    ]
  },
  {
    "id": "bienestar",
    "label": "Familia, Salud y Bienestar",
    "children": [
      [
        "temas.html?topic=bienestar",
        "Cuerpo, mente y salud"
      ]
    ]
  },
  {
    "id": "academy",
    "label": "Academia NUVIA",
    "children": [
      [
        "academia.html",
        "Portada de Academia"
      ],
      [
        "academia.html?tab=esenciales",
        "Conocimientos esenciales"
      ],
      [
        "academia.html?tab=cursos",
        "Cursos"
      ]
    ]
  }
];
const read = (path) => readFile(resolve(root, path), 'utf8');
const linksIn = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
  .map(([, href, label]) => [href, label]);
const expectedFooterLinks = [
  ['mercados.html', 'Economía y Finanzas'],
  ['temas.html', 'Patrimonio'],
  ['temas.html?topic=bienestar', 'Familia, Salud y Bienestar'],
  ['academia.html', 'Academia NUVIA'],
  ['lecturas.html', 'Lecturas con Criterio'],
  ['cartera.html', 'Cartera y analítica'],
  ['cartera.html?vista=companies', 'Análisis y valoración de empresas'],
  ['vivienda.html', 'Vivienda y coste de vida'],
  ['fiscalidad.html', 'Impuestos'],
  ['jubilacion.html', 'Jubilación'],
  ['que-es-nuvia.html', 'Qué es NUVIA'],
];
let checked = 0;
for (const name of (await readdir(root)).filter((name) => name.endsWith('.html'))) {
  const html = await read(name);
  const nav = html.match(/<nav class="nuvia-site-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  if (!nav) continue; // Redirect and visual-system reference are not portal sections.
  checked++;
  const groups = [...nav.matchAll(/<details\b[^>]*data-nav-area="([^"]+)"[^>]*>\s*<summary>([^<]+)<\/summary>([\s\S]*?)<\/details>/g)];
  assert.deepEqual(groups.map(([, id, label, content]) => ({
    id, label, children: linksIn(content)
  })), expectedGroups, name + ': estructura común del menú');
  assert.deepEqual(linksIn(nav), [
    ...expectedGroups.flatMap((group) => group.children),
    ['lecturas.html', 'Lecturas con Criterio'],
    ['que-es-nuvia.html', 'Qué es NUVIA']
  ], name + ': no quedan categorías antiguas o duplicadas');
  assert.doesNotMatch(nav, />Inicio<\/a>/, name + ': Inicio no aparece como sección del menú');
  for (const [href] of linksIn(nav)) await access(resolve(root, href.split(/[?#]/)[0]));
  assert.doesNotMatch(nav, /vista=companies|Gestión de cartera|Temas clave|Curso ·/,
    name + ': el menú superior no expone opciones retiradas');
  if (name !== 'index.html') {
    assert.equal((html.match(/data-main-menu-return/g) || []).length, 1,
      name + ': un regreso visible al menú principal');
    assert.match(html, /<nav class="nv-breadcrumb"[^>]*>[\s\S]*?<a href="index.html" data-main-menu-return>Volver al menú principal<\/a>/,
      name + ': regreso en la ruta de navegación');
  }
  const footer = html.match(/<footer data-screen-label="Footer"[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer, name + ': pie común presente');
  assert.deepEqual(linksIn(footer), expectedFooterLinks, name + ': cinco espacios, herramientas e información en el pie');
  assert.match(footer, /NUVIA reúne información, formación y herramientas para comprender la economía familiar y pensar a largo plazo\./,
    name + ': registro institucional aprobado en el pie');
  assert.doesNotMatch(footer, /Sistema visual|Acompañamos a familias a preservar|Academia Nuvia|Lecturas con criterio/,
    name + ': no quedan taxonomías, documentación interna o promesas retiradas');
}
assert.ok(checked >= 15, 'Comprobar todas las páginas públicas del portal');
const home = await read('index.html');
assert.match(home, /<h2 id="titulo-mercados"[^>]*>Economía y Finanzas<\/h2>/, 'Nombre de sección igual que el menú');
assert.match(home, /Información, formación y herramientas para familias que quieren comprender su dinero y pensar a largo plazo\./,
  'Subtítulo institucional aprobado en la portada');
for (const pillar of ['Comprender', 'Cuidar', 'Transmitir']) {
  assert.match(home, new RegExp(`home-pillars__name">${pillar}</span>`), `Pilar educativo publicado: ${pillar}`);
}
assert.match(home, /href="que-es-nuvia\.html">Descubre qué es NUVIA/,
  'La portada enlaza de forma visible con la presentación institucional');
assert.match(home, /id="espacios"/,
  'La portada ofrece un ancla estable para el comienzo de los cinco espacios');
const about = await read('que-es-nuvia.html');
assert.match(about, /<h1 id="que-nuvia-title"><span>¿Qué es<\/span> NUVIA\?<\/h1>/, 'La página institucional tiene un único título principal');
assert.match(about, /NUVIA es un lugar donde las familias aprenden a entender su dinero\./, 'La definición principal está publicada');
assert.match(about, /No constituye asesoramiento financiero, fiscal o jurídico personalizado\./, 'La página conserva su aviso de alcance');
assert.match(about, /href="que-es-nuvia\.html" aria-current="page">Qué es NUVIA<\/a>/, 'La sección activa se identifica en su propia página');
assert.match(about, /href="index\.html#espacios">Explorar los cinco espacios/,
  'La llamada institucional utiliza el ancla semántica de los cinco espacios');
const topics = await read('temas.html');
assert.match(topics, /'planificacion-patrimonial': \['Planificación patrimonial'/);
assert.match(topics, /id: 'planificacion-patrimonial'[\s\S]*?tipo: 'recursos'/);
for (const concept of ['Balance patrimonial', 'Objetivos y horizontes', 'Documentación y continuidad familiar']) {
  assert.ok(topics.includes(concept), 'Categoría informativa: ' + concept);
}
assert.ok(topics.includes("String(temasPatrimonio.length).padStart(2, '0')"), 'Patrimonio declara sus cuatro ámbitos');
assert.match(topics, /const temasPatrimonio = temas\.filter\(\(tema\) => tema\.id !== 'bienestar'\)/,
  'Familia, Salud y Bienestar no aparece como tema interno de Patrimonio');
assert.match(topics, /mostrarSelector: !esBienestar/,
  'El selector de Patrimonio se oculta dentro del espacio de Bienestar');
assert.match(topics, /'bienestar':\s+\['Familia, Salud y Bienestar'/,
  'Bienestar utiliza el nombre canónico de su espacio');
assert.match(topics, /En preparación/, 'Los ámbitos introductorios declaran su estado editorial');
const academy = await read('academia.html');
assert.ok(academy.includes("'esenciales'") && academy.includes("'cursos'"), 'Pestañas de Academia conservadas');
const portfolio = await read('cartera.html');
assert.match(portfolio, /id="vista-companies" href="cartera.html\?vista=companies#suite-nuvia"/,
  'Análisis de empresas sigue dentro de Cartera');
/* Alfa (Entrega 2b): la vista de empresas está «En preparación» y no carga
   la suite local; vuelve con la base propia. */
assert.ok(portfolio.includes('id="empresas-en-preparacion"') && !portfolio.includes('company-analysis/'),
  'La vista de empresas se muestra «En preparación» sin cargar la suite local (alfa)');
console.log('Navegación: ' + checked + ' cabeceras, destinos y enlaces de regreso correctos.');

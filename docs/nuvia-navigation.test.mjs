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
    "label": "Academia",
    "children": [
      [
        "academia.html",
        "Academia NUVIA"
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
    ['index.html', 'Inicio'],
    ...expectedGroups.flatMap((group) => group.children),
    ['lecturas.html', 'Lecturas'],
    ['que-es-nuvia.html', 'Qué es NUVIA']
  ], name + ': no quedan categorías antiguas o duplicadas');
  for (const [href] of linksIn(nav)) await access(resolve(root, href.split(/[?#]/)[0]));
  assert.doesNotMatch(nav, /vista=companies|Gestión de cartera|Temas clave|Curso ·/,
    name + ': el menú superior no expone opciones retiradas');
  if (name !== 'index.html') {
    assert.equal((html.match(/data-main-menu-return/g) || []).length, 1,
      name + ': un regreso visible al menú principal');
    assert.match(html, /<nav class="nv-breadcrumb"[^>]*>[\s\S]*?<a href="index.html" data-main-menu-return>Volver al menú principal<\/a>/,
      name + ': regreso en la ruta de navegación');
  }
}
assert.ok(checked >= 15, 'Comprobar todas las páginas públicas del portal');
const home = await read('index.html');
assert.match(home, /<h2 id="titulo-mercados"[^>]*>Economía y Finanzas<\/h2>/, 'Nombre de sección igual que el menú');
const about = await read('que-es-nuvia.html');
assert.match(about, /<h1 id="que-nuvia-title"><span>¿Qué es<\/span> NUVIA\?<\/h1>/, 'La página institucional tiene un único título principal');
assert.match(about, /NUVIA es un lugar donde las familias aprenden a entender su dinero\./, 'La definición principal está publicada');
assert.match(about, /No constituye asesoramiento financiero, fiscal o jurídico personalizado\./, 'La página conserva su aviso de alcance');
assert.match(about, /href="que-es-nuvia\.html" aria-current="page">Qué es NUVIA<\/a>/, 'La sección activa se identifica en su propia página');
const topics = await read('temas.html');
assert.match(topics, /'planificacion-patrimonial': \['Planificación patrimonial'/);
assert.match(topics, /id: 'planificacion-patrimonial'[\s\S]*?tipo: 'recursos'/);
for (const concept of ['Balance patrimonial', 'Objetivos y horizontes', 'Documentación y continuidad familiar']) {
  assert.ok(topics.includes(concept), 'Categoría informativa: ' + concept);
}
assert.ok(topics.includes("String(temas.length).padStart(2, '0')"), 'Conteo de temas no fijado a cuatro');
const academy = await read('academia.html');
assert.ok(academy.includes("'esenciales'") && academy.includes("'cursos'"), 'Pestañas de Academia conservadas');
const portfolio = await read('cartera.html');
assert.match(portfolio, /id="vista-companies" href="cartera.html\?vista=companies#suite-nuvia"/,
  'Análisis de empresas sigue dentro de Cartera');
assert.ok(portfolio.includes('data-src="company-analysis/index.html?embedded=web2"'), 'Suite local preservada');
console.log('Navegación: ' + checked + ' cabeceras, destinos y enlaces de regreso correctos.');

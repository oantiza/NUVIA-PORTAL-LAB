import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const pages = [
  'index.html', 'academia.html', 'cartera.html', 'curso.html', 'fiscalidad.html',
  'guia-ahorro.html', 'guia-calendario.html', 'guia-fiscal.html',
  'guia-planificacion.html', 'guia-sucesiones.html', 'jubilacion.html',
  'lecturas.html', 'mercados.html', 'que-es-nuvia.html', 'temas.html', 'vivienda.html',
];
const socialImage = 'https://oantiza.github.io/NUVIA-PORTAL-LAB/src/assets/social/nuvia-social-card-2026-v1.webp';
const start = '<!-- NUVIA SOCIAL META: START -->';
const end = '<!-- NUVIA SOCIAL META: END -->';
const escapeAttribute = (value) => value.replace(/&(?!(?:amp|quot|lt|gt|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/"/g, '&quot;');

for (const file of pages) {
  const path = resolve(root, file);
  let html = await readFile(path, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1]?.trim();
  if (!title || !description || !canonical) throw new Error(`${file}: faltan title, description o canonical`);

  const block = `${start}
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="NUVIA">
<meta property="og:title" content="${escapeAttribute(title)}">
<meta property="og:description" content="${escapeAttribute(description)}">
<meta property="og:url" content="${escapeAttribute(canonical)}">
<meta property="og:image" content="${socialImage}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="NUVIA · Un lugar donde las familias aprenden a entender su dinero">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttribute(title)}">
<meta name="twitter:description" content="${escapeAttribute(description)}">
<meta name="twitter:image" content="${socialImage}">
<meta name="twitter:image:alt" content="NUVIA · Un lugar donde las familias aprenden a entender su dinero">
${end}`;

  const existing = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (existing.test(html)) html = html.replace(existing, block);
  else html = html.replace(/(<link rel="canonical" href="[^"]+">)/, `$1\n\n${block}`);
  await writeFile(path, html, 'utf8');
}

console.log(`Metadatos sociales aplicados a ${pages.length} páginas.`);

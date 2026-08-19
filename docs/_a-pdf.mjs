/**
 * Convierte los documentos markdown de docs/ a PDF con la identidad de NUVIA.
 * Uso:  node docs/_a-pdf.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { marked } from 'marked';
import { chromium } from 'playwright';
import { resolve, basename } from 'node:path';

const DOCS = [
  ['BASES_ANALISIS_CARTERA.md',          'Bases de la sección',        'Análisis de cartera'],
  ['PLAN_ANALISIS_CARTERA.md',           'Plan de acción',             'Análisis de cartera'],
  ['IMPLEMENTACION_ANALISIS_CARTERA.md', 'Guía de implementación',     'Análisis de cartera'],
];

const CSS = `
@page { size: A4; margin: 20mm 18mm 18mm; }
:root{
  --navy-950:#06172f; --navy-900:#0b2347; --navy-700:#284c75;
  --green-700:#4a5d23; --green-300:#b9cc8b;
  --bronze-500:#b69152; --bronze-200:#dcc59c;
  --cloud:#f4f6f9; --paper-light:#faf7ee;
  --ink:#0b2347; --copy:#40506a; --muted:#5b6472;
  --line:rgba(11,35,71,.13);
  --sans:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
  --serif:"Fraunces",Georgia,serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);color:var(--ink);font-size:10.5pt;line-height:1.62;
     -webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── Portada ─────────────────────────────────────────────── */
.cover{height:297mm;display:flex;flex-direction:column;position:relative;page-break-after:always;
       background:linear-gradient(155deg,#06172f 0%,#0b2347 52%,#1d4468 100%);
       margin:-20mm -18mm 0;padding:32mm 20mm 26mm;color:#f8f4ea;overflow:hidden}
.cover .arcs{position:absolute;inset:0}
.cover .in{position:relative;height:100%;display:flex;flex-direction:column}
.cover .brand{font-family:var(--serif);font-size:17pt;letter-spacing:.2em;font-weight:300}
.cover .brand span{display:block;font-family:var(--sans);font-size:6.5pt;letter-spacing:.34em;
                   color:var(--green-300);text-transform:uppercase;font-weight:600;margin-top:3px}
.cover .mid{margin-top:auto;margin-bottom:26mm}
.cover .kick{font-size:7.5pt;letter-spacing:.28em;text-transform:uppercase;
             color:var(--green-300);font-weight:600;margin-bottom:9mm}
.cover h1{font-family:var(--serif);font-size:34pt;font-weight:200;line-height:1.06;color:#fff}
.cover .sub{font-family:var(--serif);font-size:14pt;font-weight:300;font-style:italic;
            color:rgba(255,255,255,.72);margin-top:6mm}
.cover .meta{border-top:1px solid rgba(255,255,255,.22);padding-top:5mm;
             font-size:8pt;color:rgba(255,255,255,.62);letter-spacing:.05em}

/* ── Contenido ───────────────────────────────────────────── */
.doc{padding-top:4mm}
h1{font-family:var(--serif);font-size:19pt;font-weight:300;color:var(--navy-900);
   margin:0 0 5mm;padding-bottom:3mm;border-bottom:2px solid var(--bronze-500);
   page-break-after:avoid}
h2{font-family:var(--serif);font-size:14pt;font-weight:400;color:var(--navy-900);
   margin:9mm 0 3mm;page-break-after:avoid}
h3{font-family:var(--serif);font-size:11.5pt;font-weight:600;color:var(--navy-900);
   margin:6mm 0 2mm;page-break-after:avoid}
h4{font-size:10pt;font-weight:600;color:var(--navy-700);margin:4mm 0 2mm}
p{margin-bottom:3mm;color:var(--copy)}
strong{color:var(--navy-900);font-weight:600}
em{font-style:italic}
ul,ol{margin:0 0 3mm 5mm;color:var(--copy)}
li{margin-bottom:1.4mm}
li>strong:first-child{color:var(--navy-900)}
hr{border:none;border-top:1px solid var(--line);margin:8mm 0}
a{color:var(--green-700);text-decoration:none}
code{font-family:"Consolas","Menlo",monospace;font-size:9pt;background:var(--cloud);
     padding:1px 4px;border-radius:3px;color:var(--navy-700)}

blockquote{background:var(--paper-light);border-left:3px solid var(--bronze-500);
           padding:3.5mm 5mm;margin:4mm 0;border-radius:0 5px 5px 0;
           page-break-inside:avoid}
blockquote p{margin:0;font-size:9.8pt}
blockquote p+p{margin-top:2mm}

table{width:100%;border-collapse:collapse;font-size:9pt;margin:4mm 0;
      page-break-inside:avoid}
th{background:var(--navy-900);color:#fff;padding:2.4mm 3mm;text-align:left;
   font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;font-weight:600}
td{padding:2.2mm 3mm;border-bottom:1px solid var(--line);color:var(--copy);
   vertical-align:top}
td:first-child{font-weight:600;color:var(--navy-900)}
tbody tr:nth-child(even) td{background:var(--cloud)}
`;

const arcs = `<svg class="arcs" viewBox="0 0 210 247" preserveAspectRatio="none">
  <g fill="none" stroke="#fff" stroke-opacity=".05">
    <circle cx="215" cy="52" r="70"/><circle cx="215" cy="52" r="98"/>
    <circle cx="215" cy="52" r="128"/><circle cx="215" cy="52" r="160"/></g>
  <path d="M 18 196 C 52 196 74 182 94 166 C 116 148 134 130 158 121"
        fill="none" stroke="#b9cc8b" stroke-opacity=".3" stroke-width=".5"/>
  <circle cx="94" cy="166" r="1.1" fill="#b9cc8b" fill-opacity=".5"/>
  <circle cx="158" cy="121" r="1.1" fill="#b9cc8b" fill-opacity=".5"/>
</svg>`;

const salida = resolve('docs/pdf');
await mkdir(salida, { recursive: true });

const b = await chromium.launch();

for (const [fichero, titulo, sub] of DOCS) {
  const md = await readFile(resolve('docs', fichero), 'utf8');
  // Quitar el H1 del markdown: ya va en la portada
  const cuerpo = marked.parse(md.replace(/^# .*\n/, ''));

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,300..400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>
<section class="cover">${arcs}<div class="in">
  <div class="brand">NUVIA<span>Family Wealth</span></div>
  <div class="mid">
    <div class="kick">${sub}</div>
    <h1>${titulo}</h1>
    <div class="sub">Sección del portal · documento de trabajo</div>
  </div>
  <div class="meta">18 de agosto de 2026 · Documento interno · No constituye asesoramiento financiero</div>
</div></section>
<div class="doc">${cuerpo}</div>
</body></html>`;

  const pg = await b.newPage();
  await pg.setContent(html, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1800);
  const destino = resolve(salida, basename(fichero, '.md') + '.pdf');
  await pg.pdf({ path: destino, format: 'A4', printBackground: true,
                 margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' } });
  await pg.close();
  console.log(`  ${basename(destino)}`);
}

await b.close();
console.log('\n  PDFs en docs/pdf/');

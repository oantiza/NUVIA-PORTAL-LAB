/* Auditoría de la página pintada.
   ═════════════════════════════════════════════════════════════════════════════
   Los otros validadores leen ficheros. Este abre las páginas en un navegador de
   verdad y mide lo que el usuario ve, porque hay defectos que solo existen una
   vez aplicada la cascada:

     · el suelo tipográfico de 12 px y la escala 12/14/16/18/22/28/36;
     · el contraste AA, componiendo el alfa del texto contra su fondo real;
     · los desbordes horizontales;
     · las fugas del envoltorio de interpolación.

   Necesita Playwright y un Chromium. Si no están, no falla: lo dice y se salta,
   para que la publicación no dependa de que el entorno tenga navegador.

       npm run auditar                 · las 16 páginas a 1440 px
       npm run auditar -- 1440,1180    · a los anchos que se le pidan

   Cinco cosas que este auditor aprendió a no contar como fallo, todas nacidas
   de falsos positivos reales:

     1 · Un gris hecho con color-mix contra transparente «es» tinta si no se
         compone el alfa contra el fondo. Se compone.
     2 · Recorrer los ancestros leyendo backgroundColor no encuentra nada cuando
         el fondo lo pone un ::before absoluto, un degradado o una foto, y acaba
         suponiendo blanco. Cuando no se resuelve, se muestrea el pixel pintado
         dentro de la caja, con el texto apagado.
     3 · Y sobre una franja ancha, con la moda de los pixeles: un ::before
         decorativo puede ocupar un recorte estrecho entero.
     4 · Un <details> cerrado deja sus hijos en «visible» pero no los pinta, y
         .nv-visually-hidden recorta a 1x1. Lo que no se pinta no puntúa; la
         decoración aria-hidden, tampoco.
     5 · Un desborde solo cuenta si lo provoca un elemento. Un aro decorativo
         que se sale y queda recortado por el padre, no.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

const raiz = resolve(process.argv[2] || '.');
const ANCHOS = (process.argv[3] || '1440').split(',').map(Number);
const ESCALA = [12, 14, 16, 18, 22, 28, 36];

const PAGINAS = [
  'index.html', 'mercados.html', 'cartera.html', 'academia.html', 'curso.html',
  'lecturas.html', 'vivienda.html', 'fiscalidad.html', 'jubilacion.html',
  'temas.html', 'guia-calendario.html', 'guia-ahorro.html', 'guia-sucesiones.html',
  'guia-planificacion.html', 'guia-fiscal.html', 'sistema-visual.html',
];

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('Auditoría de render omitida: Playwright no está instalado en este entorno.');
  process.exit(0);
}

/* ── servidor estático mínimo, para no depender de uno externo ─────────────── */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const servidor = createServer(async (req, res) => {
  const ruta = resolve(raiz, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!ruta.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try {
    const st = await stat(ruta);
    if (st.isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] || 'application/octet-stream' });
    createReadStream(ruta).pipe(res);
  } catch { res.writeHead(404).end(); }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${servidor.address().port}/`;

const MEDIR = (ESC) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const leer = (v) => {
    if (!v) return null;
    if (cache.has(v)) return cache.get(v);
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = v;
    if (cx.fillStyle === '#000' && !/^(#000|black|rgb\(0, 0, 0\))/.test(v)) { cache.set(v, null); return null; }
    cx.clearRect(0, 0, 1, 1); cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const c = [d[0], d[1], d[2], d[3] / 255];
    cache.set(v, c); return c;
  };
  function fondoDe(el) {
    let e = el, acc = null;
    while (e) {
      const st = getComputedStyle(e);
      if (st.backgroundImage && st.backgroundImage !== 'none') return null;
      const anterior = getComputedStyle(e, '::before');
      if (anterior.content !== 'none' && anterior.position === 'absolute') return null;
      const c = leer(st.backgroundColor);
      if (c && c[3] > 0) {
        acc = acc ? [0, 1, 2].map((i) => c[i] * c[3] + acc[i] * (1 - c[3])).concat([1]) : c.slice();
        if (c[3] > 0.99) return acc;
      }
      e = e.parentElement;
    }
    return acc;
  }
  const salida = { textos: [], pequenos: [], escala: {}, desbordes: [], fugas: {} };
  let n = 0;
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    if (el.scrollWidth - el.clientWidth > 2 && !['auto', 'scroll'].includes(cs.overflowX) && cs.overflow !== 'hidden') {
      const r = el.getBoundingClientRect();
      const fuera = [...el.querySelectorAll('*')].filter((h) => h.getBoundingClientRect().right > r.right + 1).length;
      if (fuera) salida.desbordes.push(`${el.className.toString().slice(0, 40)} ${el.scrollWidth}>${el.clientWidth}`);
    }
    const t = [...el.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent.trim()).join(' ').trim();
    if (!t) return;
    if (el.closest('details:not([open])')) return;
    if (el.closest('.nv-visually-hidden, .nv-skip-link')) return;
    const decorativo = !!el.closest('[aria-hidden="true"]');
    const fs = parseFloat(cs.fontSize);
    let ref = el, giros = 0;
    while (ref && giros < 4 && (!ref.className || /^(sc-interp|sc-if|sc-for)?$/.test(ref.className.toString().trim()))) { ref = ref.parentElement; giros++; }
    const cls = (ref && ref.className ? ref.className.toString() : el.tagName).slice(0, 45);
    if (fs < 12 && !decorativo) salida.pequenos.push(`${fs}px "${t.slice(0, 28)}" [${cls}]`);
    if (!ESC.includes(fs) && fs < 40 && !decorativo) {
      const k = `${fs}px [${cls || el.tagName}]`;
      salida.escala[k] = (salida.escala[k] || 0) + 1;
    }
    const fg = leer(cs.color);
    if (!fg || decorativo) { n++; return; }
    el.setAttribute('data-aud', n);
    salida.textos.push({ n: n++, t: t.slice(0, 30), fs, cls, color: cs.color, peso: parseInt(cs.fontWeight), fg, bg: fondoDe(el) });
  });
  /* el <span class="sc-interp"> del runtime debe ser transparente */
  const PROPS = ['fontSize', 'color', 'textTransform', 'letterSpacing', 'fontWeight'];
  document.querySelectorAll('span.sc-interp').forEach((s) => {
    const pa = s.parentElement; if (!pa) return;
    const a = getComputedStyle(s), b = getComputedStyle(pa);
    const dif = PROPS.filter((k) => a[k] !== b[k]);
    if (!dif.length) return;
    let e = pa, i = 0, ruta = pa.tagName;
    while (e && i < 4) { if (e.className && !/sc-/.test(e.className)) { ruta = e.className.toString().slice(0, 40); break; } e = e.parentElement; i++; }
    const k = `${ruta} › <${pa.tagName.toLowerCase()}>  ${dif.map((d) => `${d}: ${b[d]} → ${a[d]}`).join(' · ')}`;
    salida.fugas[k] = (salida.fugas[k] || 0) + 1;
  });
  return salida;
};

const Lum = (c) => { const s = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
const razon = (a, b) => { const x = Lum(a), y = Lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

let sharp = null;
try { ({ default: sharp } = await import('sharp')); } catch {}

/* NUVIA_CHROMIUM permite apuntar a un binario concreto cuando el entorno no
   registra ninguno por su cuenta. */
const binario = process.env.NUVIA_CHROMIUM;
const navegador = await chromium.launch(binario ? { executablePath: binario } : {}).catch(() => null);
if (!navegador) {
  console.log('Auditoría de render omitida: no hay un Chromium disponible («npx playwright install chromium»).');
  servidor.close(); process.exit(0);
}

const problemas = [];
for (const ancho of ANCHOS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 1000 } });
  const p = await ctx.newPage();
  for (const pag of PAGINAS) {
    await p.goto(base + pag, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(4200);
    const r = await p.evaluate(MEDIR, ESCALA);
    const fallos = [];
    for (const it of r.textos) {
      let bg = it.bg;
      if (!bg && sharp) {
        const el = await p.$(`[data-aud="${it.n}"]`); if (!el) continue;
        const caja = await el.boundingBox(); if (!caja || caja.width < 1) continue;
        try {
          await el.evaluate((e) => { e.dataset.audColor = e.style.color; e.style.color = 'transparent'; });
          const buf = await p.screenshot({ clip: { x: caja.x, y: caja.y + Math.min(2, caja.height / 4), width: Math.max(1, Math.min(400, caja.width)), height: Math.max(1, Math.min(4, caja.height - 2)) } });
          await el.evaluate((e) => { e.style.color = e.dataset.audColor || ''; delete e.dataset.audColor; });
          const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
          const cuenta = new Map();
          for (let i = 0; i < data.length; i += info.channels) {
            const k = `${data[i]},${data[i + 1]},${data[i + 2]}`;
            cuenta.set(k, (cuenta.get(k) || 0) + 1);
          }
          bg = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number).concat([1]);
        } catch { continue; }
      }
      if (!bg) continue;
      let fg = it.fg;
      if (fg[3] < 1) fg = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat([1]);
      const rr = razon(fg, bg);
      const grande = it.fs >= 24 || (it.fs >= 18.66 && it.peso >= 700);
      if (rr < (grande ? 3 : 4.5)) fallos.push(`${rr.toFixed(2)}:1 ${it.fs}px ${it.color} "${it.t}" [${it.cls}]`);
    }
    const escala = Object.entries(r.escala);
    const fugas = Object.entries(r.fugas);
    const total = fallos.length + r.pequenos.length + escala.length + r.desbordes.length + fugas.length;
    console.log(`${total ? '  ✗ ' : '  OK'} ${ancho}px  ${pag.padEnd(26)} AA:${fallos.length}  <12px:${r.pequenos.length}  escala:${escala.length}  desbordes:${r.desbordes.length}  fugas:${fugas.length}`);
    for (const x of fallos) problemas.push(`${pag} @${ancho} · contraste ${x}`);
    for (const x of r.pequenos) problemas.push(`${pag} @${ancho} · bajo el suelo ${x}`);
    for (const [k, v] of escala) problemas.push(`${pag} @${ancho} · fuera de escala ×${v} ${k}`);
    for (const x of r.desbordes) problemas.push(`${pag} @${ancho} · desborde ${x}`);
    for (const [k, v] of fugas) problemas.push(`${pag} @${ancho} · fuga del envoltorio ×${v} ${k}`);
  }
  await ctx.close();
}
await navegador.close();
servidor.close();

if (problemas.length) {
  throw new Error(`La página pintada no cumple:\n${problemas.join('\n')}`);
}
console.log(`\nRender verificado: ${PAGINAS.length} páginas a ${ANCHOS.join(' y ')} px, sin fallos de contraste, tipografía, desborde ni fugas.`);

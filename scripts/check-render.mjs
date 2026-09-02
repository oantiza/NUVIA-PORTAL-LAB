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

       npm run auditar                 · las páginas canónicas a 1440 px
       npm run auditar:completo        · matriz completa de escritorio y tablet

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

/* Contenido que tiene que estar presente después de arrancar. La auditoría
   medía cómo se ve la página, no si tenía algo dentro: cuando un cambio en el
   arranque dejó la tabla de cotizaciones con una fila vacía, todo lo demás
   siguió dando cero y nadie se enteró. Estas cuentas son el mínimo. */
const CONTENIDO = {
  'index.html':            [['#mercados .home26-plate__cta', 1], ['#patrimonio .home26-plate__cta', 1], ['#familia-salud .home26-plate__cta', 1], ['#academia .home-academia__cta', 1], ['#lecturas-con-criterio .home-lecturas[href="lecturas.html"]', 1], ['#sumario .home26-index__item', 8]],
  'mercados.html':         [['.markets-macro__item', 5], ['.markets-secondary-card', 3]],
  'mercados.html?vista=cotizaciones': [['.markets-lab__quote', 16], ['.markets-lab__chip', 5]],
  'curso.html':            [['.curso-resultado', 4], ['.curso-campo', 7]],
  'jubilacion.html':       [['.nv-field__box', 19]],
  'vivienda.html':         [['.nv-field__box', 12], ['.viv-pill--dark', 2]],
  'lecturas.html':         [['.lecturas-card', 4]],
  'fiscalidad.html':       [['.fiscal-dato', 9]],
  'cartera.html':          [['.nuvia-analysis-tabs a', 3]],
  'cartera.html?vista=models': [['.nv-modelos__tarjeta', 4], ['.nuvia-analysis-tabs a', 3]],
  'academia.html':         [['.ac-strong', 1], ['.viv-pill', 2], ['.ac-x10', 1]],
  'academia.html?tab=activos': [['.ac-subtab', 3], ['[role="tabpanel"]', 1]],
  'academia.html?tab=glosario': [['.ac-tab', 2], ['[role="tabpanel"]', 1]],
  'temas.html':            [['.tm-card__title', 3]],
  'temas.html?topic=bienestar': [['#tema-titulo', 1], ['.tm-wellbeing', 1], ['.tm-pillar', 5]],
  'temas.html?topic=planificacion-patrimonial': [['#tema-titulo', 1], ['.tm-pills .viv-pill', 4], ['.tm-card__title', 3]],
  'guia-calendario.html':  [['.gt-title', 1]],
  'guia-ahorro.html':      [['.gt-title', 1]],
  'guia-sucesiones.html':  [['.gt-title', 1]],
  'guia-planificacion.html': [['.gp-progress', 1]],
  'guia-fiscal.html':      [['.gu-hero__title', 1]],
  'que-es-nuvia.html':     [['#que-nuvia-title', 1], ['.about-world__item', 5], ['.about-value', 4]],
};

/* Errores de consola conocidos, con su recuento exacto.

   El navegador analiza la plantilla en crudo antes de que el runtime la
   sustituya, y un points="{{ … }}" o un d="{{ … }}" dentro de un <svg> le hace
   quejarse. No afecta a nada: el gráfico se pinta bien en cuanto React entrega
   los valores. Pero veinte errores permanentes son veinte sitios donde puede
   esconderse uno nuevo, así que se cuentan: si aparece otro, o si estos
   cambian de número, la auditoría falla.

   Para quitarlos habría que cambiar cómo se escriben los gráficos, no la hoja
   de estilo: la sintaxis del runtime obliga a poner la interpolación en el
   atributo. */
const RUIDO_CONOCIDO = /<(polyline|polygon|path|circle|rect|line)>\s+attribute\s+(points|d|cx|cy|r|x|y)\b/i;
const RUIDO_EXTERNO = /ERR_TUNNEL|ERR_BLOCKED|ERR_NAME|Failed to load resource|tradingview|fonts\.googleapis|identitytoolkit|Permissions policy violation: compute-pressure is not allowed in this document/i;
const ERRORES_ESPERADOS = {
  'academia.html': 10,
  'academia.html?tab=activos': 10,
  'academia.html?tab=glosario': 10,
  'jubilacion.html': 4,
  'fiscalidad.html': 1,
};

const PAGINAS_BASE = [
  'index.html', 'mercados.html', 'cartera.html', 'academia.html', 'curso.html',
  'academia.html?tab=activos', 'academia.html?tab=glosario',
  'lecturas.html', 'vivienda.html', 'fiscalidad.html', 'jubilacion.html',
  'temas.html', 'temas.html?topic=bienestar', 'temas.html?topic=planificacion-patrimonial',
  'guia-calendario.html', 'guia-ahorro.html', 'guia-sucesiones.html',
  'guia-planificacion.html', 'guia-fiscal.html', 'sistema-visual.html',
  'que-es-nuvia.html', 'mercados.html?vista=cotizaciones', 'cartera.html?vista=models',
];
const filtroPaginas = (process.argv[4] || '').split(',').map((item) => item.trim()).filter(Boolean);
const PAGINAS = filtroPaginas.length ? PAGINAS_BASE.filter((pagina) => filtroPaginas.includes(pagina)) : PAGINAS_BASE;
if (filtroPaginas.length && PAGINAS.length !== filtroPaginas.length) {
  const desconocidas = filtroPaginas.filter((pagina) => !PAGINAS_BASE.includes(pagina));
  throw new Error(`Páginas de auditoría desconocidas: ${desconocidas.join(', ')}`);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  throw new Error('Playwright no está instalado. Ejecuta «npm ci» antes de auditar el render.');
}

/* ── servidor estático mínimo, para no depender de uno externo ─────────────── */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
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
  const salida = { textos: [], pequenos: [], escala: {}, desbordes: [], fugas: {}, colisiones: [], sinNombre: [], ayudasSueltas: [], sinFoco: [], estadosSinSemantica: [], tablists: [] };
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

  /* La cabecera puede envolver en tablet, pero ninguno de sus elementos
     visibles puede invadir a otro. Se miden cajas reales, no anchos teóricos. */
  const cabecera = [...document.querySelectorAll(
    '.nuvia-site-header__brand, .nuvia-site-nav > a, .nuvia-site-nav > details'
  )].filter((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  });
  for (let i = 0; i < cabecera.length; i++) {
    const a = cabecera[i].getBoundingClientRect();
    for (let j = i + 1; j < cabecera.length; j++) {
      const b = cabecera[j].getBoundingClientRect();
      const solapa = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      if (solapa) salida.colisiones.push(`${cabecera[i].className || cabecera[i].tagName} ↔ ${cabecera[j].className || cabecera[j].tagName}`);
    }
  }

  const visible = (el) => {
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && box.width > 0 && box.height > 0
      && !el.closest('[aria-hidden="true"], details:not([open])');
  };
  document.querySelectorAll('input:not([type="hidden"]), select, textarea, button').forEach((control) => {
    if (!visible(control)) return;
    const labelledBy = (control.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .some((id) => document.getElementById(id)?.textContent.trim());
    const nativeLabels = control.labels ? [...control.labels].some((label) => label.textContent.trim()) : false;
    const ownText = control.tagName === 'BUTTON' && control.textContent.trim();
    if (!control.getAttribute('aria-label') && !labelledBy && !nativeLabels && !ownText) {
      salida.sinNombre.push(`${control.tagName.toLowerCase()} ${control.getAttribute('name') || control.id || control.className || 'sin identificador'}`.slice(0, 80));
    }
  });
  document.querySelectorAll('.nv-field__note, .nv-field__help, [data-field-help]').forEach((note) => {
    if (!visible(note)) return;
    if (!note.id || !document.querySelector(`[aria-describedby~="${CSS.escape(note.id)}"]`)) {
      salida.ayudasSueltas.push(note.textContent.trim().slice(0, 70));
    }
  });

  const focusables = [...document.querySelectorAll([
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', 'summary',
    '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])'
  ].join(','))].filter(visible);
  const focusSignature = (element) => {
    const nodes = [];
    let node = element;
    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      const style = getComputedStyle(node);
      nodes.push([
        style.outlineStyle, style.outlineWidth, style.outlineColor,
        style.boxShadow, style.borderTopColor, style.borderRightColor,
        style.borderBottomColor, style.borderLeftColor, style.backgroundColor,
      ].join('|'));
    }
    return nodes.join('||');
  };
  focusables.forEach((element) => {
    const explicitTabIndex = element.getAttribute('tabindex');
    if (explicitTabIndex && Number(explicitTabIndex) > 0) {
      salida.sinFoco.push(`tabindex positivo en ${element.tagName.toLowerCase()} ${element.className || element.id || ''}`.trim());
      return;
    }
    element.blur();
    const before = focusSignature(element);
    element.focus({ preventScroll: true });
    const after = focusSignature(element);
    if (document.activeElement !== element) {
      salida.sinFoco.push(`no recibe foco ${element.tagName.toLowerCase()} ${element.className || element.id || ''}`.trim());
    } else if (before === after) {
      salida.sinFoco.push(`sin indicador visible ${element.tagName.toLowerCase()} ${element.className || element.id || ''}`.trim());
    }
  });

  document.querySelectorAll('button.is-active, button.is-selected').forEach((button) => {
    if (!visible(button)) return;
    if (!['aria-pressed', 'aria-selected', 'aria-current', 'aria-checked'].some((name) => button.hasAttribute(name))) {
      salida.estadosSinSemantica.push(`${button.className || button.textContent.trim().slice(0, 35)}`);
    }
  });
  document.querySelectorAll('[data-nuvia-toggle-group="true"]').forEach((group) => {
    if (!visible(group)) return;
    const buttons = [...group.querySelectorAll(':scope > button')].filter(visible);
    const pressed = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true');
    if (pressed.length > 1) {
      salida.estadosSinSemantica.push(`${group.getAttribute('aria-label') || group.className || 'grupo'}: ${pressed.length} opciones activas`);
    }
  });
  document.querySelectorAll('[role="button"]').forEach((element) => {
    if (!visible(element) || element.matches('button, input, select, textarea, a[href]')) return;
    if (element.tabIndex < 0) salida.estadosSinSemantica.push(`role=button no enfocable ${element.className || element.id || ''}`.trim());
  });
  document.querySelectorAll('[role="tablist"]').forEach((tabList) => {
    if (!visible(tabList)) return;
    const tabs = [...tabList.querySelectorAll(':scope > [role="tab"]')].filter(visible);
    const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
    const inOrder = tabs.filter((tab) => tab.tabIndex === 0);
    if (selected.length !== 1 || inOrder.length !== 1 || selected[0] !== inOrder[0]) {
      salida.tablists.push(`${tabList.getAttribute('aria-label') || tabList.id || 'sin nombre'}: selección ${selected.length}, orden ${inOrder.length}`);
    }
    tabs.forEach((tab) => {
      const target = tab.getAttribute('aria-controls');
      if (!target || !document.getElementById(target)) salida.tablists.push(`${tab.textContent.trim().slice(0, 35)} sin panel asociado`);
    });
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
  servidor.close();
  throw new Error('No hay un Chromium disponible. Ejecuta «npx playwright install chromium».');
}

const problemas = [];
for (const ancho of ANCHOS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 1000 } });
  const p = await ctx.newPage();
  for (const pag of PAGINAS) {
    const consola = [];
    const anotar = (m) => { if (m.type() === 'error' && !RUIDO_EXTERNO.test(m.text())) consola.push(m.text().slice(0, 90)); };
    const anotarError = (e) => consola.push('pageerror: ' + e.message.slice(0, 90));
    p.on('console', anotar); p.on('pageerror', anotarError);
    await p.goto(base + pag, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(4200);
    p.off('console', anotar); p.off('pageerror', anotarError);
    const ruido = consola.filter((t) => RUIDO_CONOCIDO.test(t));
    const nuevos = consola.filter((t) => !RUIDO_CONOCIDO.test(t));
    const esperados = ERRORES_ESPERADOS[pag] || 0;
    const desvio = ruido.length !== esperados
      ? [`el ruido conocido de plantilla pasó de ${esperados} a ${ruido.length} errores`]
      : [];
    await p.keyboard.press('Tab');
    await p.keyboard.press('Shift+Tab');
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
    /* ¿está el contenido? */
    const faltan = [];
    for (const [sel, minimo] of (CONTENIDO[pag] || [])) {
      const n = await p.$$eval(sel, (e) => e.length).catch(() => 0);
      if (n < minimo) faltan.push(`${sel}: ${n} de ${minimo}`);
    }
    const escala = Object.entries(r.escala);
    const fugas = Object.entries(r.fugas);
    const keyboardTabProblems = await p.evaluate(async () => {
      const visible = (element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
      };
      const tabList = [...document.querySelectorAll('[role="tablist"]')].find(visible);
      if (!tabList) return [];
      const tabs = [...tabList.querySelectorAll(':scope > [role="tab"]')].filter(visible);
      if (tabs.length < 2) return [];
      const current = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
      const expectedIndex = (tabs.indexOf(current) + 1) % tabs.length;
      const expectedLabel = tabs[expectedIndex].textContent.trim();
      current.focus({ preventScroll: true });
      current.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
      const active = document.activeElement;
      if (!active?.matches('[role="tab"]') || active.textContent.trim() !== expectedLabel) {
        return ['la flecha derecha no mueve el foco a la pestaña siguiente'];
      }
      if (active.getAttribute('aria-selected') !== 'true') return ['la flecha derecha no activa la pestaña siguiente'];
      return [];
    });
    r.tablists.push(...keyboardTabProblems);
    const toggleTransitionProblems = await p.evaluate(async () => {
      const visible = (element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
      };
      const problems = [];
      const groupCount = [...document.querySelectorAll('[data-nuvia-toggle-group="true"]')].filter(visible).length;
      for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
        const groups = [...document.querySelectorAll('[data-nuvia-toggle-group="true"]')].filter(visible);
        const group = groups[groupIndex];
        if (!group) continue;
        // Patrimonio mezcla selectores internos con accesos a páginas distintas.
        // Su semántica se audita arriba, pero aquí no se pulsa para no abandonar
        // la página a mitad de la evaluación del navegador.
        if (group.matches('.tm-pills')) continue;
        const buttons = [...group.querySelectorAll(':scope > button')].filter((button) => visible(button) && !button.disabled);
        if (buttons.length < 2) continue;
        const currentIndex = buttons.findIndex((button) => button.getAttribute('aria-pressed') === 'true');
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % buttons.length : 0;
        buttons[nextIndex].click();
        await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
        const updatedGroups = [...document.querySelectorAll('[data-nuvia-toggle-group="true"]')].filter(visible);
        const updatedButtons = [...(updatedGroups[groupIndex]?.querySelectorAll(':scope > button') || [])].filter(visible);
        const pressed = updatedButtons.filter((button) => button.getAttribute('aria-pressed') === 'true');
        if (pressed.length !== 1) {
          problems.push(`${group.getAttribute('aria-label') || group.className || 'grupo'}: transición deja ${pressed.length} opciones activas`);
        } else if (updatedButtons.indexOf(pressed[0]) !== nextIndex) {
          problems.push(`${group.getAttribute('aria-label') || group.className || 'grupo'}: no activa la opción pulsada`);
        }
      }
      return problems;
    });
    r.estadosSinSemantica.push(...toggleTransitionProblems);
    const total = fallos.length + r.pequenos.length + escala.length + r.desbordes.length + fugas.length + r.colisiones.length + r.sinNombre.length + r.ayudasSueltas.length + r.sinFoco.length + r.estadosSinSemantica.length + r.tablists.length + faltan.length + nuevos.length + desvio.length;
    console.log(`${total ? '  ✗ ' : '  OK'} ${ancho}px  ${pag.padEnd(34)} AA:${fallos.length}  <12px:${r.pequenos.length}  escala:${escala.length}  desbordes:${r.desbordes.length}  cabecera:${r.colisiones.length}  controles:${r.sinNombre.length}  ayudas:${r.ayudasSueltas.length}  foco:${r.sinFoco.length}  estados:${r.estadosSinSemantica.length}  tabs:${r.tablists.length}  fugas:${fugas.length}  contenido:${faltan.length ? faltan.length + ' ausente' : 'ok'}  consola:${nuevos.length ? nuevos.length + ' nuevos' : (esperados ? esperados + ' conocidos' : 'limpia')}`);
    for (const x of faltan) problemas.push(`${pag} @${ancho} · falta contenido ${x}`);
    for (const x of nuevos) problemas.push(`${pag} @${ancho} · error de consola nuevo: ${x}`);
    for (const x of desvio) problemas.push(`${pag} @${ancho} · ${x}`);
    for (const x of fallos) problemas.push(`${pag} @${ancho} · contraste ${x}`);
    for (const x of r.pequenos) problemas.push(`${pag} @${ancho} · bajo el suelo ${x}`);
    for (const [k, v] of escala) problemas.push(`${pag} @${ancho} · fuera de escala ×${v} ${k}`);
    for (const x of r.desbordes) problemas.push(`${pag} @${ancho} · desborde ${x}`);
    for (const x of r.colisiones) problemas.push(`${pag} @${ancho} · colisión de cabecera ${x}`);
    for (const x of r.sinNombre) problemas.push(`${pag} @${ancho} · control sin nombre accesible ${x}`);
    for (const x of r.ayudasSueltas) problemas.push(`${pag} @${ancho} · ayuda no asociada a su control: ${x}`);
    for (const x of r.sinFoco) problemas.push(`${pag} @${ancho} · foco: ${x}`);
    for (const x of r.estadosSinSemantica) problemas.push(`${pag} @${ancho} · estado interactivo sin semántica: ${x}`);
    for (const x of r.tablists) problemas.push(`${pag} @${ancho} · pestañas: ${x}`);
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

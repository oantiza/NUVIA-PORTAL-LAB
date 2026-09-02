import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const mercados = read('mercados.html');
const academia = read('academia.html');
const curso = read('curso.html');
const unified = read('nuvia-site-unified.js');

assert.doesNotMatch(mercados, /<script[^>]+widgets\.tradingview-widget\.com/i,
  'TradingView no debe cargarse desde el head antes de la elección del usuario');
assert.match(mercados, /data-nuvia-external-widget="tradingview"/,
  'Mercados debe mantener la barrera contextual de TradingView');
assert.match(mercados, /<template>[\s\S]*?<tv-market-overview/,
  'El widget debe permanecer dentro de una plantilla inerte hasta su carga');

for (const [name, html] of [['Academia', academia], ['Curso', curso]]) {
  assert.doesNotMatch(html, /<iframe[^>]+src="(?:https:\/\/www\.youtube-nocookie\.com|\{\{\s*videoSrc\s*\}\})/i,
    `${name} no debe conectar con YouTube mediante un iframe al abrir la página`);
  assert.match(html, /data-nuvia-external-frame/,
    `${name} debe explicar y solicitar la carga del vídeo externo`);
  assert.match(html, /data-nuvia-external-status[^>]*aria-live="polite"/,
    `${name} debe comunicar accesiblemente el estado de la carga externa`);
}

assert.match(unified, /\[data-nuvia-external-load\]/,
  'El controlador común debe atender la elección expresa');
assert.match(unified, /customElements\.whenDefined\('tv-market-overview'\)/,
  'El widget no debe pintarse hasta que su módulo externo esté preparado');
assert.match(unified, /host\.replaceChildren\(iframe\)/,
  'Los vídeos deben crear el iframe únicamente tras la acción');

console.log(`Contenido externo: TradingView y YouTube quedan cerrados hasta la acción del usuario en ${root}.`);

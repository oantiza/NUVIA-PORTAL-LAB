import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(process.argv[2]||'.');
const html=readFileSync(resolve(root,'lecturas.html'),'utf8');
const css=readFileSync(resolve(root,'estilos/nuvia-pages.css'),'utf8');
const expected={'psicologia-dinero':'comportamiento','inversor-inteligente':'inversion','wall-street':'inversion','pensar-rapido':'comportamiento'};
const cards=[...html.matchAll(/<article class="lecturas-card"([^>]*)>([\s\S]*?)<\/article>/g)];
assert.equal(cards.length,4);
assert.match(html,/document.title = 'NUVIA · Lecturas con Criterio'/);
for(const [,attrs,body] of cards) {
  const id=attrs.match(/data-book-id="([^"]+)"/)[1];
  assert.ok(attrs.includes(`data-book-theme="${expected[id]}"`),id);
  assert.doesNotMatch(attrs,/hidden|tabindex|role="button"/);
  assert.match(body,/<button class="lecturas-summary-button"/);
}
const books=runInNewContext('('+html.match(/const books = (\{[\s\S]*?\n  \});/)[1]+')');
assert.deepEqual(Object.keys(books),Object.keys(expected));
for(const [id,book] of Object.entries(books)) {
  assert.ok(book.reason.length>30 && book.limit.length>30,id);
  assert.ok(['www.planetadelibros.com','www.penguinlibros.com'].includes(new URL(book.source).hostname));
  assert.doesNotMatch([...book.summary,...book.points].join(' '),/Exigir siempre|Dar tiempo a las buenas|cotizaciones ofrecen oportunidades|comprar con suficiente/);
}
for(const id of ['seleccion-lecturas','catalogo-lecturas','criterios-lecturas','comunidad-lecturas','lecturas-result-count','lecturas-dialog-reason','lecturas-dialog-limit','lecturas-dialog-source']) {
  assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
}
assert.equal((html.match(/data-reading-filter="/g)||[]).length,3);
assert.match(html,/id="lecturas-result-count"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(css,/\.lecturas-card\[hidden\] \{ display: none; \}/);
assert.match(html,/el catálogo todavía no cubre todos los temas de NUVIA/);
assert.match(html,/no indica una clasificación de calidad ni un orden obligatorio/);
const community=html.match(/<section id="comunidad-lecturas"[\s\S]*?<\/section>/)[0];
assert.match(community,/nv-tag--pending/);
assert.match(community,/opiniones, propuestas, votaciones y el foro todavía no están disponibles/);
assert.doesNotMatch(community,/<button\b|<input\b|<textarea\b|<form\b/);
assert.doesNotMatch(html,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|firebase|firestore/);
console.log('Lecturas 5A-5: cuatro obras, dos temas, fuentes, motivos y límites; comunidad aplazada y sin persistencia.');

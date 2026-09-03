/** Controles de la vista con DOM mínimo y servicios simulados; ninguna red real. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate as siguiente } from 'node:timers/promises';
import { CARTERAS_MODELO, montaModelos } from '../js/nuvia-modelos.js';
import * as constructor from '../js/nuvia-constructor.js';

class Nodo {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.eventos = {}; this.disabled = false; this.hidden = false; this._texto = ''; this.classList = { toggle() {}, add() {}, remove() {}, contains: () => false }; this.style = {}; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'disabled') this.disabled = true; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; }
  append(...nodos) { for (const n of nodos) { if (n && typeof n === 'object') n.parent = this; } this.children.push(...nodos); }
  addEventListener(tipo, fn) { (this.eventos[tipo] ||= []).push(fn); }
  set textContent(t) { this.children = []; this._texto = String(t); }
  get textContent() { return this._texto + this.children.map((n) => n.textContent || '').join(' '); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((n) => n !== this); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  async pulsa() { if (!this.disabled) for (const fn of this.eventos.click || []) await fn(); }
}
globalThis.document = { createElement: (tag) => new Nodo(tag), createElementNS: (_ns, tag) => new Nodo(tag), getElementById: () => null, addEventListener() {} };
globalThis.fetch = async () => { throw new Error('Red real prohibida.'); };
const todos = [...new Set(CARTERAS_MODELO.flatMap((m) => m.posiciones.map((p) => p.asset_id)))];
const presentes = () => Object.fromEntries(todos.map((id) => [id, true]));
const fichas = async (id) => ({ asset_id: id, identity: { display_name: id }, instrument_type: 'FUND', economic_asset_class: 'EQUITY' });
const cliente = (extra = {}) => ({ enCatalogo: async () => presentes(), detalleActivo: fichas, ...extra });
function busca(nodo, clase) {
  return [nodo, ...nodo.children.flatMap((n) => busca(n, clase))].filter((n) => (n.attrs.class || '').split(' ').includes(clase));
}
function botones(raiz) { return busca(raiz, 'nv-modelos__tarjeta').flatMap((t) => t.children.filter((n) => n.tag === 'button')); }
function monta(datos, callback = async () => {}) {
  const raiz = new Nodo('main'); montaModelos(raiz, { cliente: datos, alSeleccionar: callback }); return raiz;
}
async function espera() { await siguiente(); await siguiente(); }

test('Vaciar la cartera invalida una consulta pendiente aunque termine con error', async () => {
  let reject;
  const raiz = new Nodo('main');
  const vista = constructor.montaConstructor(raiz, { editable: false,
    posicionesIniciales: [{ activo: { asset_id: 'A' }, bruto: 100 }],
    cliente: { nivelSesion: () => 'registrada', sesionActual: () => ({ tipo: 'registrada' }),
      llama: () => new Promise((_, fail) => { reject = fail; }) },
  });
  await vista.cargaPosiciones([]);
  const empty = raiz.textContent;
  reject(new Error('Respuesta tardía')); await espera();
  assert.equal(raiz.textContent, empty);
  assert.equal(vista.cuantas(), 0);
});

test('Al cambiar de composición no deja cifras anteriores bajo el nuevo nombre', async () => {
  const rejects = [], raiz = new Nodo('main');
  const vista = constructor.montaConstructor(raiz, { editable: false,
    posicionesIniciales: [{ activo: { asset_id: 'A' }, bruto: 100 }],
    cliente: { nivelSesion: () => 'registrada', sesionActual: () => ({ tipo: 'registrada' }),
      llama: () => new Promise((_, fail) => { rejects.push(fail); }) },
  });
  const results = busca(raiz, 'nv-cons__resultados')[0];
  results.textContent = 'Cifras de la composición anterior';
  const pending = vista.cargaPosiciones([{ activo: { asset_id: 'B' }, bruto: 100 }]);
  assert.equal(results.textContent, '');
  for (const reject of rejects) reject(new Error('Fin simulado'));
  await pending; await espera();
});

// Orden del fundador (03-09-2026): no se bloquea nada en la alfa sin consultarle.
// Solo se apaga el boton cuando CONSTA que faltan instrumentos del universo.
test('Mientras carga el catálogo el análisis sigue disponible', async () => {
  let resuelve;
  const raiz = monta(cliente({ enCatalogo: () => new Promise((r) => { resuelve = r; }) }));
  assert.ok(botones(raiz).every((b) => !b.disabled));
  resuelve(presentes()); await espera();
  assert.ok(botones(raiz).every((b) => !b.disabled));
});

test('Error de catálogo: se explica, no se bloquea y el reintento recupera disponibilidad', async () => {
  let caido = true;
  const raiz = monta(cliente({ enCatalogo: async () => { if (caido) throw new Error('simulado'); return presentes(); } }));
  await espera(); assert.ok(botones(raiz).every((b) => !b.disabled));
  assert.match(raiz.textContent, /No se ha podido comprobar/);
  const reintento = busca(raiz, 'nv-modelos__reintentar')[0]; assert.ok(reintento);
  caido = false; await reintento.pulsa(); await espera();
  assert.ok(botones(raiz).every((b) => !b.disabled));
});

test('Respuesta incompleta o sin comprobador: no se interpreta como disponibilidad, ni se bloquea', async () => {
  for (const enCatalogo of [undefined, async () => ({ [todos[0]]: true }), async () => null]) {
    const raiz = monta(cliente({ enCatalogo })); await espera();
    // No se afirma disponibilidad: se dice que no se ha podido comprobar...
    assert.match(raiz.textContent, /sin verificar|No se ha podido comprobar|no se han podido comprobar/i);
    // ...y aun asi el analisis sigue abierto (orden del fundador, 03-09-2026).
    assert.ok(botones(raiz).every((b) => !b.disabled));
  }
});

test('Catálogo parcial: cuenta e identifica ausencias sin cambiar las composiciones', async () => {
  const antes = JSON.stringify(CARTERAS_MODELO); const mapa = Object.fromEntries(todos.map((id) => [id, false]));
  CARTERAS_MODELO[0].posiciones.slice(0, 2).forEach((p) => { mapa[p.asset_id] = true; });
  const raiz = monta(cliente({ enCatalogo: async () => mapa })); await espera();
  assert.ok(botones(raiz).every((b) => b.disabled));
  const primera = busca(raiz, 'nv-modelos__tarjeta')[0];
  assert.match(primera.textContent, /2 de 4/);
  assert.ok(primera.textContent.includes(CARTERAS_MODELO[0].posiciones[2].asset_id));
  assert.equal(JSON.stringify(CARTERAS_MODELO), antes);
});

test('Cambio al pulsar: revalida y no abre una cartera que acaba de quedar incompleta', async () => {
  let n = 0; let aperturas = 0;
  const raiz = monta(cliente({ enCatalogo: async (_ids, opciones) => {
    assert.equal(opciones?.refrescar, true); const mapa = presentes(); if (++n > 1) mapa[todos[0]] = false; return mapa;
  } }), async () => { aperturas++; });
  await espera(); await botones(raiz)[0].pulsa();
  assert.equal(aperturas, 0); assert.ok(botones(raiz)[0].disabled);
});

test('Ficha fallida o identidad incorrecta: nunca envía una composición parcialmente enriquecida', async () => {
  for (const detalleActivo of [async () => { throw new Error('simulado'); }, async () => null,
    async () => ({ asset_id: 'OTRO' }), async (id) => ({ asset_id: id }),
    async (id) => ({ ...await fichas(id), economic_asset_class: '' })]) {
    let aperturas = 0; const raiz = monta(cliente({ detalleActivo }), async () => { aperturas++; });
    await espera(); await botones(raiz)[0].pulsa();
    assert.equal(aperturas, 0); assert.match(raiz.textContent, /No se ha podido preparar/);
  }
});

test('Selección completa conserva pesos e identificadores y no habilita las incompletas', async () => {
  let recibido; const mapa = presentes();
  CARTERAS_MODELO[2].posiciones.forEach((p) => { mapa[p.asset_id] = false; });
  const raiz = monta(cliente({ enCatalogo: async () => mapa }), async (detalle) => { recibido = detalle; });
  await espera(); await botones(raiz)[0].pulsa();
  assert.deepEqual(recibido.posiciones.map((p) => [p.activo.asset_id, p.bruto]), CARTERAS_MODELO[0].posiciones.map((p) => [p.asset_id, p.peso]));
  assert.ok(botones(raiz)[2].disabled); assert.equal(botones(raiz)[0].textContent, 'Cartera seleccionada');
});

test('Una cartera fija sin todas sus series declara qué falta y cómo se recalcula el reparto', () => {
  const pos = [{ activo: { asset_id: 'A', display_name: 'Ficticio A' } }, { activo: { asset_id: 'B', display_name: 'Ficticio B' } }];
  assert.match(constructor.avisoHistorialFijo(pos, [{ asset_id: 'A', values: [100, 110] }]), /Ficticio B/);
  assert.match(constructor.avisoHistorialFijo(pos, [{ asset_id: 'A', values: [100, 110] }, { asset_id: 'B', values: [] }]), /quedan fuera del cálculo/);
  assert.equal(constructor.avisoHistorialFijo(pos, [{ asset_id: 'A', values: [100, 110] }, { asset_id: 'B', values: [100, 95] }]), '');
});

test('El constructor de solo lectura declara lo que falta, calcula con el resto y conserva sus posiciones', async () => {
  const raiz = new Nodo('main');
  const iniciales = ['A', 'B'].map((id) => ({ activo: { asset_id: id, display_name: 'Ficticio ' + id }, bruto: 50 }));
  const copia = JSON.stringify(iniciales);
  const vista = constructor.montaConstructor(raiz, {
    editable: false, posicionesIniciales: iniciales,
    cliente: {
      nivelSesion: () => 'registrada', sesionActual: () => ({ tipo: 'registrada' }),
      detalleActivo: fichas, enCatalogo: async () => presentes(), manifiesto: async () => ({}), revisionDatos: () => null,
      llama: async () => ({ dates: ['2026-01-01', '2026-01-02'], series: [{ asset_id: 'A', values: [100, 110] }] }),
    },
  });
  await vista.recalcula();
  // Orden del fundador (03-09-2026): no se bloquea. Se declara lo que falta,
  // se calcula con el resto y las posiciones originales no se tocan.
  assert.match(raiz.textContent, /Ficticio B/);
  assert.match(raiz.textContent, /quedan fuera del cálculo/);
  assert.match(raiz.textContent, /los pesos publicados de la composición no cambian/);
  assert.notEqual(busca(raiz, 'nv-cons__resultados')[0].textContent, '');
  assert.equal(vista.cuantas(), 2);
  assert.equal(JSON.stringify(iniciales), copia);
});

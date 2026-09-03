/** Persistencia simulada; ninguna cartera del navegador real ni petición remota. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate as siguiente } from 'node:timers/promises';
import { montaConstructor, agregaCartera } from '../js/nuvia-constructor.js';
import { creaGuardadoLocal } from '../js/nuvia-guardado-local.js';

class Nodo {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.eventos = {}; this.style = {}; this.value = ''; this._texto = ''; this.classList = { toggle() {} }; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  append(...nodos) { this.children.push(...nodos); }
  addEventListener(tipo, fn) { (this.eventos[tipo] ||= []).push(fn); }
  set textContent(t) { this.children = []; this._texto = String(t); }
  get textContent() { return this._texto + this.children.map((n) => typeof n === 'string' ? n : n.textContent).join(' '); }
  async pulsa() { if (!this.disabled) for (const fn of this.eventos.click || []) await fn(); }
}
globalThis.document = { createElement: (tag) => new Nodo(tag), getElementById: () => null, addEventListener() {} };
globalThis.fetch = async () => { throw new Error('Red real prohibida'); };
const posiciones = [{ activo: { asset_id: 'FICTICIO', display_name: 'Instrumento ficticio', instrument_type: 'FUND', economic_asset_class: 'EQUITY' }, bruto: 100 }];
const cartera = (nombre) => ({ nombre, posiciones: structuredClone(posiciones) });
function almacenamiento(inicial = null) {
  const s = { crudo: inicial, rechazaLectura: false, rechazaEscritura: false, escrituras: 0,
    getItem(k) { assert.equal(k, 'nuvia.carteras-visitante.v1'); if (this.rechazaLectura) throw new Error('Acceso denegado'); return this.crudo; },
    setItem(k, v) { assert.equal(k, 'nuvia.carteras-visitante.v1'); if (this.rechazaEscritura) throw new Error('Sin espacio'); this.escrituras++; this.crudo = v; },
  };
  globalThis.localStorage = s;
  return s;
}
function nodos(n) { return typeof n === 'string' ? [] : [n, ...n.children.flatMap(nodos)]; }
function porClase(raiz, clase) { return nodos(raiz).filter((n) => (n.attrs.class || '').split(' ').includes(clase)); }
function boton(raiz, texto) { return nodos(raiz).find((n) => n.tag === 'button' && n.textContent.startsWith(texto)); }
async function monta(s) {
  const raiz = new Nodo('main');
  montaConstructor(raiz, { posicionesIniciales: posiciones, cliente: {
    sesionActual: () => ({ tipo: 'alfa' }), nivelSesion: () => 'registrada',
    llama: async () => { throw new Error('Datos fuera del alcance'); },
  } });
  await siguiente();
  const panel = porClase(raiz, 'nv-cons__guardado')[0];
  return { panel, nombre: nodos(panel).find((n) => n.attrs.id === 'nombre-cartera'), guardar: porClase(panel, 'nv-cons__boton-guardar')[0] };
}

test('Cuota agotada no anuncia guardado ni borra el nombre introducido', async () => {
  const s = almacenamiento(); s.rechazaEscritura = true;
  const v = await monta(s); v.nombre.value = 'Prueba'; await v.guardar.pulsa();
  assert.match(v.panel.textContent, /No se ha podido guardar/);
  assert.doesNotMatch(v.panel.textContent, /Cartera guardada/);
  assert.equal(v.nombre.value, 'Prueba'); assert.equal(s.crudo, null);
});
test('Un borrado rechazado no se presenta como realizado', async () => {
  const original = JSON.stringify([cartera('Una')]); const s = almacenamiento(original); s.rechazaEscritura = true;
  const v = await monta(s); await boton(v.panel, 'Borrar').pulsa();
  assert.match(v.panel.textContent, /No se ha podido borrar/);
  assert.doesNotMatch(v.panel.textContent, /borrada de este navegador/);
  assert.equal(s.crudo, original);
});
test('Datos ilegibles o parcialmente inválidos se conservan sin sustituirlos por una lista vacía', async () => {
  for (const original of ['{roto', '{}', '', JSON.stringify([cartera('Válida'), null]), JSON.stringify([{ nombre: 'Rota', posiciones: [null] }])]) {
    const s = almacenamiento(original); const v = await monta(s); v.nombre.value = 'Nueva'; await v.guardar.pulsa();
    assert.equal(s.crudo, original); assert.equal(s.escrituras, 0);
    assert.match(v.panel.textContent, /no se pueden interpretar/);
  }
});
test('Lectura denegada se muestra sin afirmar que no existen carteras', async () => {
  const s = almacenamiento(JSON.stringify([cartera('Anterior')])); s.rechazaLectura = true;
  const v = await monta(s); v.nombre.value = 'Nueva'; await v.guardar.pulsa();
  assert.match(v.panel.textContent, /No se puede acceder/); assert.equal(s.escrituras, 0);
});
test('Cambio en otra pestaña: no borra con un índice antiguo', async () => {
  const s = almacenamiento(JSON.stringify([cartera('A'), cartera('B')])); const v = await monta(s);
  const filaB = porClase(v.panel, 'nv-cons__guardada')[1];
  const posterior = JSON.stringify([cartera('B'), cartera('C')]); s.crudo = posterior;
  await boton(filaB, 'Borrar').pulsa();
  assert.equal(s.crudo, posterior); assert.equal(s.escrituras, 0);
  assert.match(v.panel.textContent, /han cambiado/);
});
test('Un nombre automático nunca reemplaza otra cartera después de un borrado', () => {
  const anterior = [cartera('Cartera 1'), cartera('Cartera 3')];
  const r = agregaCartera(anterior, cartera(''));
  assert.equal(r.lista.length, 3); assert.equal(r.motivo, null);
  assert.equal(new Set(r.lista.map((c) => c.nombre)).size, 3);
});
test('Guardado, recarga y borrado correctos mantienen el formato existente', async () => {
  const s = almacenamiento(); let v = await monta(s); v.nombre.value = 'Mi prueba'; await v.guardar.pulsa();
  assert.deepEqual(JSON.parse(s.crudo), [cartera('Mi prueba')]); assert.match(v.panel.textContent, /Cartera guardada/);
  v = await monta(s); await boton(v.panel, 'Cargar').pulsa();
  assert.match(v.panel.textContent, /Mi prueba.*cargada/);
  await boton(v.panel, 'Borrar').pulsa(); assert.equal(s.crudo, '[]');
  assert.match(v.panel.textContent, /borrada de este navegador/);
});
test('Cambio al guardar no sobrescribe otras pestañas y mantiene el nombre para reintentar', async () => {
  const s = almacenamiento(); const v = await monta(s); v.nombre.value = 'Nueva';
  s.crudo = JSON.stringify([cartera('Otra pestaña')]); const posterior = s.crudo;
  await v.guardar.pulsa(); assert.equal(s.crudo, posterior); assert.equal(v.nombre.value, 'Nueva');
  assert.match(v.panel.textContent, /han cambiado/);
  await v.guardar.pulsa(); assert.equal(JSON.parse(s.crudo).length, 2);
});

test('El reintento recupera el acceso sin escribir ni eliminar carteras', async () => {
  const original = JSON.stringify([cartera('Anterior')]); const s = almacenamiento(original); s.rechazaLectura = true;
  const v = await monta(s); assert.equal(v.guardar.disabled, true);
  s.rechazaLectura = false; await boton(v.panel, 'Volver a comprobar').pulsa();
  assert.equal(v.guardar.disabled, false); assert.match(v.panel.textContent, /Anterior/);
  assert.equal(s.escrituras, 0); assert.equal(s.crudo, original);
});
test('Escritura que no persiste o cambia después no produce confirmación de éxito', () => {
  const s = almacenamiento(); const repo = creaGuardadoLocal(() => s); const antes = repo.lee();
  s.setItem = () => {};
  assert.equal(repo.escribe([cartera('Nueva')], antes).motivo, 'sin-confirmar');
  s.setItem = () => { s.crudo = JSON.stringify([cartera('Otra pestaña')]); };
  assert.equal(repo.escribe([cartera('Nueva')], antes).motivo, 'sin-confirmar');
  assert.equal(JSON.parse(s.crudo)[0].nombre, 'Otra pestaña');
});
test('Acceso al propio almacenamiento denegado queda controlado', () => {
  const repo = creaGuardadoLocal(() => { throw new Error('SecurityError'); });
  assert.equal(repo.lee().motivo, 'acceso');
  assert.equal(repo.escribe([], { ok: true, crudo: null }).motivo, 'acceso');
});
test('Posiciones o pesos no válidos no llegan a persistirse', () => {
  for (const p of [null, { activo: {}, bruto: 100 }, { activo: { asset_id: 'A' }, bruto: -1 },
    { activo: { asset_id: 'A' }, bruto: NaN }, { activo: { asset_id: 'A' }, bruto: '100' }]) {
    const s = almacenamiento(); const repo = creaGuardadoLocal(() => s);
    assert.equal(repo.escribe([{ nombre: 'Nueva', posiciones: [p] }], repo.lee()).ok, false);
    assert.equal(s.escrituras, 0);
  }
});
test('Cambio antes de cargar no reemplaza la cartera de trabajo por una versión antigua', async () => {
  const s = almacenamiento(JSON.stringify([cartera('Anterior')])); const v = await monta(s);
  s.crudo = '[]'; await boton(v.panel, 'Cargar').pulsa();
  assert.match(v.panel.textContent, /han cambiado/); assert.doesNotMatch(v.panel.textContent, /Anterior.*cargada/);
  assert.equal(s.escrituras, 0);
});

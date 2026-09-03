/** Regresiones de fase 1: sin red ni datos reales. Solo archivos sintéticos en output/. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creaClienteMaestra, fichaParaModulos, PREFIJO_SERIES } from '../js/nuvia-datos.js';
import { concentracionSectorial, concentracionGeografica } from '../js/nuvia-concentracion.js';
import { creaConsultaSeries } from '../js/nuvia-constructor.js';
import { detalleDe, holdingsDe, textoCalidad } from '../js/nuvia-analisis.js';
import { aFirestore } from '../scripts/mercado-alfa/firestore-rest.mjs';
import { proyectar, cargaPublicable } from '../scripts/mercado-alfa/run.mjs';
import { creaGeneracion } from '../scripts/mercado-alfa/publicable.mjs';

globalThis.fetch = async () => { throw new Error('Red real prohibida en esta batería.'); };
const AHORA = () => Date.parse('2026-09-02T12:00:00Z');
function almacen() {
  const datos = new Map();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v), removeItem: (k) => datos.delete(k) };
}
function servidor() {
  const estado = { version: 'v1', base: 100, llamadas: [], caido: false };
  const fetchFn = async (url, opciones = {}) => {
    estado.llamadas.push({ url, opciones });
    assert.equal(opciones.headers.Authorization, undefined);
    if (estado.caido) return { ok: false, status: 503, json: async () => ({ error: { message: 'caída simulada' } }) };
    const objeto = (ruta) => {
      if (ruta === 'catalog_manifest/public') return { updated_at: estado.version, chunks: 1, total: 1 };
      if (ruta === 'catalog_chunks/000') return { items: [{ asset_id: 'PRUEBA', display_name: estado.version }] };
      if (ruta === 'assets/PRUEBA') return { asset_id: 'PRUEBA', display_name: estado.version };
      const anio = Number(ruta.split('/').at(-1));
      const points = anio === 2023 ? [{ date: '2023-09-02', value: estado.base }]
        : anio === 2026 ? [{ date: '2026-09-01', value: 110 }] : [];
      return { points };
    };
    const documento = (name) => ({ name, fields: Object.fromEntries(Object.entries(objeto(name.split('/documents/')[1])).map(([k, v]) => [k, aFirestore(v)])) });
    const json = url.endsWith(':batchGet')
      ? JSON.parse(opciones.body).documents.map((name) => ({ found: documento(name) }))
      : documento(url.replace(/^https:\/\/[^/]+\/v1\//, ''));
    return { ok: true, status: 200, json: async () => json };
  };
  return { estado, fetchFn };
}
const ultimo = (resultado) => resultado.series[0].values.at(-1);

test('Históricos: navegador recurrente coincide con uno nuevo tras una corrección', async () => {
  const a = almacen(); const { estado, fetchFn } = servidor();
  const cliente = () => creaClienteMaestra({ almacen: a, fetchFn, ahora: AHORA });
  assert.equal(ultimo(await cliente().seriesRebasadas(['PRUEBA'])), 110);
  estado.version = 'v2'; estado.base = 50;
  const recurrente = ultimo(await cliente().seriesRebasadas(['PRUEBA']));
  const nuevo = ultimo(await creaClienteMaestra({ fetchFn, ahora: AHORA }).seriesRebasadas(['PRUEBA']));
  assert.equal(recurrente, nuevo);
  assert.equal(recurrente, 220);
});

test('Históricos: pestaña abierta detecta otra versión y renueva catálogo y ficha', async () => {
  const { estado, fetchFn } = servidor();
  const cliente = creaClienteMaestra({ almacen: almacen(), fetchFn, ahora: AHORA });
  await cliente.buscaActivos('v1'); await cliente.detalleActivo('PRUEBA');
  await cliente.seriesRebasadas(['PRUEBA']);
  estado.version = 'v2'; estado.base = 50;
  assert.equal(ultimo(await cliente.seriesRebasadas(['PRUEBA'])), 220);
  assert.equal((await cliente.manifiesto()).updated_at, 'v2');
  assert.equal((await cliente.buscaActivos('v1')).total, 0);
  assert.equal((await cliente.detalleActivo('PRUEBA')).identity.display_name, 'v2');
});

test('Históricos: caché antigua sin versión no se reutiliza; versión estable sí', async () => {
  const a = almacen(); const { estado, fetchFn } = servidor();
  a.setItem(PREFIJO_SERIES + 'PRUEBA.2023', JSON.stringify({ points: [{ date: '2023-09-02', value: 200 }] }));
  const cliente = creaClienteMaestra({ almacen: a, fetchFn, ahora: AHORA });
  assert.equal(ultimo(await cliente.seriesRebasadas(['PRUEBA'])), 110);
  estado.llamadas = [];
  assert.equal(ultimo(await cliente.seriesRebasadas(['PRUEBA'])), 110);
  const lotes = estado.llamadas.filter((l) => l.url.endsWith(':batchGet'));
  assert.equal(lotes.length, 1);
  assert.deepEqual(JSON.parse(lotes[0].opciones.body).documents.map((d) => d.split('/documents/')[1]), ['assets/PRUEBA/series/2026']);
  estado.caido = true;
  await assert.rejects(() => cliente.seriesRebasadas(['PRUEBA']), /caída simulada/);
  estado.caido = false;
  assert.equal(ultimo(await cliente.seriesRebasadas(['PRUEBA'])), 110);
});

test('Constructor y análisis: otra consulta revalida; las simultáneas se comparten', async () => {
  const { estado, fetchFn } = servidor();
  const cliente = creaClienteMaestra({ almacen: almacen(), fetchFn, ahora: AHORA });
  const consulta = creaConsultaSeries(cliente);
  const primera = consulta(['PRUEBA']);
  assert.equal(primera, consulta(['PRUEBA']));
  assert.equal(ultimo(await primera), 110);
  assert.equal((await detalleDe(cliente, 'PRUEBA')).identity.display_name, 'v1');
  estado.version = 'v2'; estado.base = 50;
  assert.equal(ultimo(await consulta(['PRUEBA'])), 220);
  assert.equal((await detalleDe(cliente, 'PRUEBA')).identity.display_name, 'v2');
});

test('Desgloses cacheados del análisis: aislamiento por cliente y versión', async () => {
  let version = 1; let peticiones = 0;
  const datos = { revisionDatos: () => version, llama: async () => { peticiones++; return { holdings: { PRUEBA: { version } } }; } };
  assert.equal((await holdingsDe(datos, ['PRUEBA'])).PRUEBA.version, 1);
  await holdingsDe(datos, ['PRUEBA']); assert.equal(peticiones, 1);
  version = 2;
  assert.equal((await holdingsDe(datos, ['PRUEBA'])).PRUEBA.version, 2);
  assert.equal(peticiones, 2);
  const otro = { revisionDatos: () => 2, llama: async () => ({ holdings: { PRUEBA: { version: 'otro' } } }) };
  assert.equal((await holdingsDe(otro, ['PRUEBA'])).PRUEBA.version, 'otro');
});

test('Históricos: sin versión del manifiesto no reutiliza series; no toca carteras locales', async () => {
  const a = almacen(); const { estado, fetchFn } = servidor(); estado.version = null;
  const cartera = '[{"nombre":"Cartera ficticia"}]'; a.setItem('nuvia.carteras-visitante.v1', cartera);
  const cliente = creaClienteMaestra({ almacen: a, fetchFn, ahora: AHORA });
  await cliente.seriesRebasadas(['PRUEBA']);
  estado.base = 50;
  assert.equal(ultimo(await cliente.seriesRebasadas(['PRUEBA'])), 220);
  assert.equal(a.getItem('nuvia.carteras-visitante.v1'), cartera);
});

function ficha(exposures) {
  return fichaParaModulos({ asset_id: 'PRUEBA', display_name: 'Technology Global', category: 'Technology', currency: 'EUR', exposures });
}
const posicion = [{ asset_id: 'PRUEBA', weight_percent: 100 }];
test('Regiones ausentes: conserva sectores pero no deduce eurozona por la divisa', () => {
  const activo = ficha({ asset_mix: { equity: 1 }, sectors: { technology: 100 }, regions: null });
  const s = concentracionSectorial(posicion, [activo]); const g = concentracionGeografica(posicion, [activo]);
  assert.equal(s.filas[0].peso, 100); assert.equal(s.pesoSinDatos, 0);
  assert.deepEqual(g.filas, []); assert.equal(g.pesoSinDatos, 100); assert.equal(g.pesoEstimado, 0);
});
test('Sectores ausentes: conserva regiones sin deducir sector del nombre', () => {
  const activo = ficha({ asset_mix: { equity: 1 }, sectors: null, regions: { japan: 100 } });
  const s = concentracionSectorial(posicion, [activo]); const g = concentracionGeografica(posicion, [activo]);
  assert.deepEqual(s.filas, []); assert.equal(s.pesoSinDatos, 100); assert.equal(s.pesoEstimado, 0);
  assert.equal(g.filas[0].clave, 'japan'); assert.equal(g.pesoSinDatos, 0);
});
test('Desgloses: vacío, inválido y exposición RV desconocida no se convierten en estimación o cero', () => {
  for (const regions of [{}, { japan: 0 }, { japan: -1 }, { japan: NaN }, { japan: '100' }]) {
    const a = ficha({ asset_mix: { equity: 1 }, sectors: { technology: 100 }, regions });
    assert.deepEqual(concentracionGeografica(posicion, [a]).filas, []);
    assert.equal(concentracionGeografica(posicion, [a]).pesoSinDatos, 100);
  }
  const a = ficha({ asset_mix: {}, sectors: { technology: 100 }, regions: { japan: 100 } });
  assert.equal(a.pms_exposure, null);
  assert.equal(concentracionSectorial(posicion, [a]).pesoSinDatos, 100);
});
test('Desgloses parciales en cartera: el peso sin datos se declara por dimensión', () => {
  const a = ficha({ asset_mix: { equity: 1 }, sectors: { technology: 100 }, regions: null });
  const b = { ...ficha({ asset_mix: { equity: 1 }, sectors: { energy: 100 }, regions: { japan: 100 } }), asset_id: 'OTRO' };
  const pos = [{ asset_id: 'PRUEBA', weight_percent: 40 }, { asset_id: 'OTRO', weight_percent: 60 }];
  assert.equal(concentracionSectorial(pos, [a, b]).pesoSinDatos, 0);
  const g = concentracionGeografica(pos, [a, b]);
  assert.equal(g.pesoSinDatos, 40); assert.deepEqual(g.filas, [{ clave: 'japan', peso: 100 }]);
  assert.match(textoCalidad(g), /40/); assert.match(textoCalidad(g), /sin datos de desglose/);
});

test('Exposición RV de cero conocida no se confunde con exposición desconocida', () => {
  const a = ficha({ asset_mix: { equity: 0 }, sectors: null, regions: null });
  assert.deepEqual(concentracionGeografica(posicion, [a]), { filas: [], calidad: 'none', pesoEstimado: 0, pesoSinDatos: 0 });
});

const output = fileURLToPath(new URL('../output/', import.meta.url));
function zona() {
  mkdirSync(output, { recursive: true });
  const salida = mkdtempSync(join(output, 'fase1-prueba-'));
  mkdirSync(join(salida, 'crudo'));
  return salida;
}
function json(ruta, obj) { writeFileSync(ruta, JSON.stringify(obj)); }
function prepara(salida, ids) {
  return ids.map((id) => {
    json(join(salida, 'crudo', id + '.PRUEBA.eod.json'), [{ date: '2025-01-02', adjusted_close: 100 }, { date: '2026-09-01', adjusted_close: 110 }]);
    json(join(salida, 'crudo', id + '.PRUEBA.fundamentals.json'), { General: { Name: id, CurrencyCode: 'EUR', Sector: 'Technology', CountryName: 'Japan' } });
    return { asset_id: id, eodhd_symbol: id + '.PRUEBA', instrument_type: 'STOCK', clase: 'EQUITY', nombre: id, divisa: 'EUR' };
  });
}
test('Proyección repetida: no conserva un activo retirado ni un año ya ausente', () => {
  const salida = zona(); const filas = prepara(salida, ['PRUEBA_A', 'PRUEBA_B']);
  proyectar({ filas, salida, updatedAt: '2026-09-02T10:00:00Z' });
  assert.equal(cargaPublicable(salida).assets.length, 2);
  json(join(salida, 'crudo', 'PRUEBA_A.PRUEBA.eod.json'), [{ date: '2026-09-01', adjusted_close: 110 }]);
  proyectar({ filas: filas.slice(0, 1), salida, updatedAt: '2026-09-02T11:00:00Z' });
  const docs = cargaPublicable(salida);
  assert.deepEqual(docs.assets.map((a) => a.objeto.asset_id), ['PRUEBA_A']);
  assert.deepEqual(docs.series.map((a) => a.objeto.year), [2026]);
  assert.equal(docs.manifest.total, 1);
});

function seleccion(salida) { return JSON.parse(readFileSync(join(salida, 'publicable', 'actual.json'), 'utf8')); }
function carpetaActual(salida) { return join(salida, 'publicable', 'generaciones', seleccion(salida).generacion); }

test('Proyección: al reducir catálogo y perder holdings no arrastra trozos ni desgloses', () => {
  const salida = zona();
  const filas = prepara(salida, Array.from({ length: 201 }, (_, i) => 'PRUEBA_' + i));
  filas[0].instrument_type = 'ETF';
  const rutaFund = join(salida, 'crudo', 'PRUEBA_0.PRUEBA.fundamentals.json');
  const fund = JSON.parse(readFileSync(rutaFund, 'utf8'));
  json(rutaFund, { ...fund, ETF_Data: { Top_10_Holdings: { FICTICIO: { Name: 'Ficticio', 'Assets_%': 10 } } } });
  proyectar({ filas, salida, updatedAt: '2026-09-02T10:00:00Z' });
  assert.equal(cargaPublicable(salida).chunks.length, 2);
  assert.equal(cargaPublicable(salida).holdings.length, 1);
  const anterior = carpetaActual(salida);
  const archivoAnterior = readFileSync(join(anterior, 'holdings', 'PRUEBA_0.json'), 'utf8');
  json(rutaFund, fund);
  proyectar({ filas: filas.slice(0, 1), salida, updatedAt: '2026-09-02T11:00:00Z' });
  const actual = cargaPublicable(salida);
  assert.equal(actual.chunks.length, 1); assert.equal(actual.holdings.length, 0);
  assert.equal(readFileSync(join(anterior, 'holdings', 'PRUEBA_0.json'), 'utf8'), archivoAnterior);
  assert.notEqual(carpetaActual(salida), anterior);
});

test('Proyección fallida: la selección anterior permanece recuperable e intacta', () => {
  const salida = zona(); const filas = prepara(salida, ['PRUEBA_A']);
  proyectar({ filas, salida, updatedAt: '2026-09-02T10:00:00Z' });
  const anterior = seleccion(salida);
  assert.throws(() => proyectar({ filas: [{ ...filas[0], asset_id: '../NO_PERMITIDO' }], salida, updatedAt: '2026-09-02T11:00:00Z' }), /no permitido/);
  assert.deepEqual(seleccion(salida), anterior);
  assert.equal(cargaPublicable(salida).assets.length, 1);
  const incompleta = creaGeneracion(salida);
  assert.throws(() => incompleta.termina({ ok: [] }), /Falta manifiesto/);
  assert.deepEqual(seleccion(salida), anterior);
});

test('Publicable: rechaza formato antiguo, archivos alterados e inventario modificado', () => {
  const salida = zona(); const filas = prepara(salida, ['PRUEBA_A']);
  mkdirSync(join(salida, 'publicable', 'assets'), { recursive: true });
  json(join(salida, 'publicable', 'assets', 'HEREDADO.json'), { asset_id: 'HEREDADO' });
  assert.throws(() => cargaPublicable(salida), /no se carga el directorio heredado/);
  proyectar({ filas, salida, updatedAt: '2026-09-02T10:00:00Z' });
  assert.equal(cargaPublicable(salida).assets.length, 1);
  const carpeta = carpetaActual(salida);
  json(join(carpeta, 'assets', 'RESIDUAL.json'), { asset_id: 'RESIDUAL' });
  assert.equal(cargaPublicable(salida).assets.length, 1, 'No lee archivos ajenos al inventario.');
  const rutaFicha = join(carpeta, 'assets', 'PRUEBA_A.json'); const texto = readFileSync(rutaFicha, 'utf8');
  json(rutaFicha, { asset_id: 'ALTERADO' });
  assert.throws(() => cargaPublicable(salida), /Archivo alterado/);
  writeFileSync(rutaFicha, texto);
  json(join(carpeta, 'inventario.json'), { archivos: [] });
  assert.throws(() => cargaPublicable(salida), /inventario.*cambiado/);
  json(join(salida, 'publicable', 'actual.json'), { ...seleccion(salida), generacion: '../fuera' });
  assert.throws(() => cargaPublicable(salida), /Identificador de generación inválido/);
});

test('Publicable: un manifiesto incoherente nunca se selecciona aunque los archivos existan', () => {
  const salida = zona(); const filas = prepara(salida, ['PRUEBA_A']);
  proyectar({ filas, salida, updatedAt: '2026-09-02T10:00:00Z' });
  const anterior = seleccion(salida); const docs = cargaPublicable(salida);
  const nueva = creaGeneracion(salida);
  nueva.escribe('assets/PRUEBA_A.json', docs.assets[0].objeto);
  for (const serie of docs.series) nueva.escribe('series/PRUEBA_A/' + serie.objeto.year + '.json', serie.objeto);
  nueva.escribe('catalog/chunk-000.json', docs.chunks[0].objeto);
  nueva.escribe('catalog/manifest.json', { ...docs.manifest, total: 2 });
  assert.throws(() => nueva.termina(docs.resumen), /manifiesto no corresponde/);
  assert.deepEqual(seleccion(salida), anterior);
});

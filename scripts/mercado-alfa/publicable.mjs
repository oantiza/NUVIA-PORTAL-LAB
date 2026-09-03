/** Generaciones locales independientes. No hay red, credenciales ni borrado de archivos. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { catalogo } from './proyecta.mjs';

const FORMATO = 'nuvia-proyeccion.v1';
const hash = (texto) => createHash('sha256').update(texto).digest('hex');
const serializa = (objeto) => JSON.stringify(objeto, null, 1) + '\n';
const ID = /^[A-Za-z0-9_-]+$/;
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const ARCHIVO = /^(?:assets\/[A-Za-z0-9_-]+\.json|series\/[A-Za-z0-9_-]+\/\d{4}\.json|holdings\/[A-Za-z0-9_-]+\.json|catalog\/(?:chunk-\d{3,}|manifest)\.json|resumen\.json)$/;

function rutaLocal(raiz, partes) {
  let ruta = resolve(raiz);
  assert.ok(!lstatSync(ruta).isSymbolicLink(), 'La carpeta publicable no puede ser un enlace.');
  for (const parte of partes) {
    assert.ok(/^[A-Za-z0-9_.-]+$/.test(parte) && parte !== '.' && parte !== '..', 'Ruta local inválida.');
    ruta = join(ruta, parte);
    if (existsSync(ruta)) assert.ok(!lstatSync(ruta).isSymbolicLink(), 'No se permiten enlaces en una generación.');
  }
  return ruta;
}

/** Valida la generación completa antes de seleccionarla o de preparar escrituras. */
function leeGeneracion(raiz, referencia) {
  assert.equal(referencia.formato, FORMATO, 'Formato de proyección no reconocido; ejecuta proyectar.');
  assert.ok(UUID.test(referencia.generacion), 'Identificador de generación inválido.');
  const carpeta = rutaLocal(raiz, ['generaciones', referencia.generacion]);
  const texto = readFileSync(rutaLocal(carpeta, ['inventario.json']), 'utf8');
  assert.equal(hash(texto), referencia.sha256, 'El inventario de la generación ha cambiado.');
  const inventario = JSON.parse(texto);
  assert.ok(Array.isArray(inventario.archivos), 'Falta el inventario de archivos.');
  const vistos = new Set();
  const docs = { assets: [], series: [], holdings: [], chunks: [], manifest: null, resumen: null, generacion: referencia.generacion };
  for (const entrada of inventario.archivos) {
    assert.ok(typeof entrada.ruta === 'string' && ARCHIVO.test(entrada.ruta) && !entrada.ruta.includes('\n'), 'Archivo no permitido en el inventario.');
    assert.ok(!vistos.has(entrada.ruta), 'Archivo repetido en el inventario.');
    vistos.add(entrada.ruta);
    const datos = readFileSync(rutaLocal(carpeta, entrada.ruta.split('/')), 'utf8');
    assert.equal(hash(datos), entrada.sha256, `Archivo alterado: ${entrada.ruta}`);
    const objeto = JSON.parse(datos);
    const [tipo, archivo, sub] = entrada.ruta.split('/');
    const id = archivo?.replace(/\.json$/, '');
    if (tipo === 'assets') {
      assert.equal(objeto.asset_id, id, 'La ficha no corresponde a su archivo.');
      docs.assets.push({ ruta: `assets/${id}`, objeto });
    } else if (tipo === 'series') {
      assert.equal(objeto.asset_id, archivo, 'La serie no corresponde al activo.');
      assert.equal(String(objeto.year), sub.replace('.json', ''), 'El año no corresponde al archivo.');
      docs.series.push({ ruta: `assets/${archivo}/series/${objeto.year}`, objeto });
    } else if (tipo === 'holdings') docs.holdings.push({ ruta: `assets/${id}/holdings/latest`, objeto });
    else if (entrada.ruta === 'catalog/manifest.json') docs.manifest = objeto;
    else if (tipo === 'catalog') docs.chunks.push({ ruta: `catalog_chunks/${id.replace('chunk-', '')}`, objeto });
    else docs.resumen = objeto;
  }
  assert.ok(docs.manifest && docs.resumen, 'Falta manifiesto o resumen de la generación.');
  const ids = docs.assets.map((a) => a.objeto.asset_id);
  assert.equal(new Set(ids).size, ids.length, 'Activo duplicado.');
  assert.ok(ids.every((id) => ID.test(id)), 'Identificador de activo no válido.');
  assert.equal(docs.resumen.updated_at, docs.manifest.updated_at, 'Fechas de generación distintas.');
  assert.deepEqual([...docs.resumen.ok].sort(), [...ids].sort(), 'El resumen no coincide con las fichas.');
  assert.equal(docs.resumen.series, docs.series.length, 'Recuento de series incorrecto.');
  assert.equal(docs.resumen.holdings, docs.holdings.length, 'Recuento de desgloses incorrecto.');
  assert.equal(docs.resumen.chunks, docs.chunks.length, 'Recuento de trozos incorrecto.');
  assert.ok(docs.assets.every((a) => a.objeto.updated_at === docs.manifest.updated_at), 'Ficha de otra generación.');
  assert.ok([...docs.series, ...docs.holdings].every((d) => ids.includes(d.ruta.split('/')[1])), 'Documento huérfano.');
  const esperado = catalogo(docs.assets.map((a) => a.objeto), docs.manifest.updated_at);
  assert.deepEqual(docs.manifest, esperado.manifest, 'El manifiesto no corresponde a las fichas.');
  docs.chunks.sort((a, b) => a.ruta.localeCompare(b.ruta));
  assert.deepEqual(docs.chunks, esperado.chunks.map((c) => ({ ruta: `catalog_chunks/${c.id}`, objeto: { items: c.items, n: c.n } })), 'El catálogo no corresponde a las fichas.');
  return docs;
}

export function cargaPublicable(salida) {
  const raiz = join(salida, 'publicable');
  if (!existsSync(join(raiz, 'actual.json'))) throw new Error('No hay generación seleccionada: ejecuta proyectar; no se carga el directorio heredado.');
  const referencia = JSON.parse(readFileSync(rutaLocal(raiz, ['actual.json']), 'utf8'));
  return leeGeneracion(raiz, referencia);
}

export function creaGeneracion(salida) {
  const raiz = join(salida, 'publicable');
  mkdirSync(raiz, { recursive: true });
  const generacion = randomUUID();
  const carpeta = rutaLocal(raiz, ['generaciones', generacion]);
  mkdirSync(carpeta, { recursive: true });
  const archivos = [];
  let terminada = false;
  function escribe(ruta, objeto) {
    assert.ok(!terminada, 'La generación ya está cerrada.');
    assert.ok(ARCHIVO.test(ruta) && !ruta.includes('\n'), 'Archivo de proyección no permitido.');
    assert.ok(!archivos.some((a) => a.ruta === ruta), 'Archivo de proyección repetido.');
    const destino = rutaLocal(carpeta, ruta.split('/'));
    mkdirSync(dirname(destino), { recursive: true });
    const texto = serializa(objeto);
    writeFileSync(destino, texto, { encoding: 'utf8', flag: 'wx' });
    archivos.push({ ruta, sha256: hash(texto) });
  }
  function termina(resumen) {
    escribe('resumen.json', resumen);
    const texto = serializa({ archivos });
    writeFileSync(join(carpeta, 'inventario.json'), texto, { encoding: 'utf8', flag: 'wx' });
    const referencia = { formato: FORMATO, generacion, sha256: hash(texto) };
    leeGeneracion(raiz, referencia);
    // Selección al final mediante renombrado en el mismo directorio. La
    // generación anterior y los archivos heredados permanecen intactos.
    const temporal = rutaLocal(raiz, [`actual-${generacion}.tmp`]);
    writeFileSync(temporal, serializa(referencia), { encoding: 'utf8', flag: 'wx' });
    renameSync(temporal, rutaLocal(raiz, ['actual.json']));
    terminada = true;
    return generacion;
  }
  return { escribe, termina };
}

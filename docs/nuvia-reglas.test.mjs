/**
 * Reglas de la alfa: contrato y protecciones sin red por defecto.
 * Permisos efectivos: npm run test:reglas:emulador, solo en 127.0.0.1
 * y en el proyecto ficticio demo-nuvia-reglas. Nunca contra producción.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  compruebaContratoReglas, origenEmulador, creaTransporteEmulador,
  pruebaReglasEnEmulador, PROYECTO_PRUEBA,
} from '../scripts/reglas-alfa-local.mjs';

if (process.env.NUVIA_REGLAS_EN_VIVO === '1') {
  console.error('Modo en vivo retirado: no se prueban escrituras ni borrados contra datos reales. Usa --emulador.');
  process.exit(2);
}
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--emulador'), 'Solo se admite --emulador.');
const reglas = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
compruebaContratoReglas(reglas);
console.log('OK · Contrato estático de las reglas locales (no equivale a ejecutar sus permisos).');

for (const mutacion of [
  reglas.replace('allow write: if false', 'allow write: if true'),
  reglas.replace('allow read, write: if false', 'allow read, write: if true'),
  reglas.replace('allow read: if true', 'allow read: if false'),
  reglas.replace('match /assets/{id}', 'match /users/{id}'),
]) {
  assert.notEqual(mutacion, reglas, 'La prueba adversarial debe cambiar las reglas.');
  assert.throws(() => compruebaContratoReglas(mutacion));
}
compruebaContratoReglas('// Comentario de prueba\n' + reglas + '\n/* comentario */');
assert.equal(origenEmulador('127.0.0.1:8080'), 'http://127.0.0.1:8080');
for (const host of [undefined, '', 'localhost:8080', '0.0.0.0:8080', '192.168.1.2:8080',
  'firestore.googleapis.com:443', 'https://127.0.0.1:8080', '127.0.0.1:8080@ejemplo.test',
  '127.0.0.1:8080/ruta', '127.0.0.1:8080?x=1', '127.0.0.1:80', '127.0.0.1:65536',
  '127.0.0.1:08080', '127.0.0.1:8080\n']) {
  assert.throws(() => origenEmulador(host));
}

const llamadas = [];
const transporte = creaTransporteEmulador({
  host: '127.0.0.1:8080',
  fetchFn: async (url, opciones) => {
    llamadas.push({ url, opciones });
    return { status: 200, json: async () => ({}) };
  },
});
await transporte.cargaReglas(reglas);
await transporte.documento('assets/prueba', { method: 'PATCH', admin: true, objeto: { fields: {} } });
await transporte.documento('assets/prueba');
await transporte.documento('assets/prueba', { method: 'DELETE' });
assert.equal(llamadas.length, 4);
for (const { url, opciones } of llamadas) {
  assert.equal(new URL(url).origin, 'http://127.0.0.1:8080');
  assert.ok(new URL(url).pathname.includes('/projects/' + PROYECTO_PRUEBA));
  assert.equal(opciones.redirect, 'error');
  assert.ok(opciones.signal instanceof AbortSignal);
}
assert.equal(llamadas[0].opciones.method, 'PUT');
assert.deepEqual(JSON.parse(llamadas[0].opciones.body), {
  rules: { files: [{ name: 'firestore.rules', content: reglas }] },
});
assert.equal(llamadas[0].opciones.headers.Authorization, 'Bearer owner');
assert.equal(llamadas[1].opciones.headers.Authorization, 'Bearer owner');
assert.equal(llamadas[2].opciones.headers.Authorization, undefined);
assert.equal(llamadas[3].opciones.headers.Authorization, undefined);
for (const ruta of ['https://ejemplo.test/assets/x', 'assets/../users/x', 'assets/%2e%2e',
  '/assets/x', 'assets/x?updateMask=x', 'assets/x/series', 'assets/x#fragmento', 'assets/x\n']) {
  await assert.rejects(() => transporte.documento(ruta));
}
await assert.rejects(() => transporte.documento('assets/prueba', { method: 'PUT' }));
assert.equal(llamadas.length, 4, 'Las rutas u operaciones inválidas no deben generar peticiones.');
const redireccion = creaTransporteEmulador({
  host: '127.0.0.1:8080',
  fetchFn: async () => ({ status: 302, json: async () => ({}) }),
});
await assert.rejects(() => redireccion.documento('assets/prueba'), /redirigir/);
const reglasInvalidas = creaTransporteEmulador({
  host: '127.0.0.1:8080',
  fetchFn: async () => ({ status: 200, json: async () => ({ issues: [{ severity: 'ERROR' }] }) }),
});
await assert.rejects(() => reglasInvalidas.cargaReglas(reglas), /rechazado/);

const antiguo = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
  env: { ...process.env, NUVIA_REGLAS_EN_VIVO: '1' }, encoding: 'utf8', timeout: 5_000,
});
assert.equal(antiguo.status, 2, 'El modo en vivo antiguo debe fallar antes de intentar la red.');
assert.match(antiguo.stderr, /Modo en vivo retirado/);
console.log('OK · Protecciones del destino, proyecto fijo, rutas, autenticación de prueba, redirecciones y modo antiguo. Sin red.');

if (args[0] === '--emulador') {
  await pruebaReglasEnEmulador({ reglas, host: process.env.FIRESTORE_EMULATOR_HOST });
} else {
  console.log('Permisos efectivos: NO EJECUTADOS aquí. Usa --emulador con un emulador local; no hay alternativa contra producción.');
}

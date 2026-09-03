import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { referencedAsset } from '../scripts/site-assets.mjs';

test('un mismo nombre no publica versiones descartadas de marca ni otros README', () => {
  const text = '<img src="src/assets/brand/actual/logo.png"> src/assets/social/README.md';
  assert.equal(referencedAsset(text, 'src/assets/brand/actual/logo.png'), true);
  assert.equal(referencedAsset(text, 'src/assets/brand/descartado/logo.png'), false);
  assert.equal(referencedAsset(text, 'src/assets/social/README.md'), true);
  assert.equal(referencedAsset(text, 'src/assets/brand/README.md'), false);
});
test('rutas completas en CSS relativo y datos siguen incluidas', () => {
  assert.equal(referencedAsset('url("../src/assets/home/familia.webp")', 'src/assets/home/familia.webp'), true);
  assert.equal(referencedAsset('{"imageUrl":"src/assets/home/familia.webp"}', 'src\\assets\\home\\familia.webp'), true);
});
test('diagnóstico de descartes queda fuera de dist y core conserva solo los descargables', async () => {
  const code = await readFile(new URL('../scripts/build-site.mjs', import.meta.url), 'utf8');
  assert.match(code, /'core\/downloads'/);
  assert.doesNotMatch(code, /resolve\(output, 'assets-excluidos.txt'\)/);
  assert.match(code, /resolve\(root, 'output\/build'\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { officialNumber, eurostatObservations, ecbObservations } from '../scripts/official-observations.mjs';
import { readFile } from 'node:fs/promises';

test('la fuente oficial distingue cero, ausencia e invalidez', () => {
  for (const value of [null, undefined, '', ' ', false, true, {}, [], NaN, Infinity, 'NA', ':']) assert.equal(officialNumber(value), null);
  for (const value of [0, '0', ' 0 ']) assert.equal(officialNumber(value), 0);
  assert.equal(officialNumber('-0.5'), -0.5);
});
test('Eurostat: huecos y orden del diccionario no inventan la observación más reciente', () => {
  const payload = { dimension: { time: { category: { index: { '2026-08': 0, '2026-06': 2, '2026-07': 1 } } } }, value: { 0: null, 1: 0, 2: 1.2 } };
  assert.deepEqual(eurostatObservations(payload), [{ period: '2026-06', value: 1.2 }, { period: '2026-07', value: 0 }]);
  assert.deepEqual(eurostatObservations({}), []);
});
test('BCE: orden cronológico y celdas vacías sin conversión a cero', () => {
  assert.deepEqual(ecbObservations(['TIME_PERIOD', 'OBS_VALUE'], [['2026-08', ''], ['2026-07', '0'], ['2026-06', '2.5']]), [{ period: '2026-06', value: 2.5 }, { period: '2026-07', value: 0 }]);
  assert.deepEqual(ecbObservations(['OTRA'], [['dato']]), []);
});
test('la publicación programa noticias y macro antes de construir; conserva copias ante una incidencia', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  const macro = workflow.indexOf('node scripts/update-macro-data.mjs'), build = workflow.indexOf('run: npm run build');
  assert.ok(macro >= 0 && build > macro);
  assert.match(workflow, /run: node scripts\/update-macro-data\.mjs[\s\S]*?continue-on-error: true/);
  assert.match(workflow, /run: node scripts\/update-daily-news\.mjs/);
});

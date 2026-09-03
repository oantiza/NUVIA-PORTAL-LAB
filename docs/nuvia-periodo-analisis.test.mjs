import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { periodoAnalizado, fuenteDelAnalisis } from '../js/nuvia-periodo-analisis.js';

test('periodo corresponde a las fechas usadas, no al máximo del catálogo', () => {
  const dates = ['2023-09-04', '2024-09-02', '2026-08-31'];
  assert.deepEqual(periodoAnalizado(dates), { desde: '2023-09-04', hasta: '2026-08-31', cierres: 3 });
  const texto = fuenteDelAnalisis(dates, 2);
  assert.match(texto, /04\/09\/2023.*31\/08\/2026/);
  assert.match(texto, /2 observaciones/); assert.doesNotMatch(texto, /02\/09\/2026|Ventana de 3 años/);
});
test('un historial corto y las fechas de año bisiesto no aparentan tres años completos', () => {
  assert.deepEqual(periodoAnalizado(['2024-02-28','2024-02-29']), { desde: '2024-02-28', hasta: '2024-02-29', cierres: 2 });
  assert.match(fuenteDelAnalisis(['2026-08-31','2026-09-01'], 1), /1 observación\./);
});
test('fechas ausentes, imposibles, repetidas o desordenadas no inventan un periodo', () => {
  for (const dates of [null, [], ['2026-09-01'], ['2026-02-30','2026-03-02'], ['2026-09-02','2026-09-01'], ['2026-09-01','2026-09-01'], ['2026-08-31',null,'2026-09-02'], ['2026-09-01T00:00:00Z','2026-09-02']]) {
    assert.equal(periodoAnalizado(dates), null);
    assert.match(fuenteDelAnalisis(dates, null), /Periodo del historial no disponible/);
    assert.doesNotMatch(fuenteDelAnalisis(dates, null), /null|undefined|NaN/);
  }
});
test('la presentación no cambia los datos y no añade recuentos no válidos', () => {
  const dates = Object.freeze(['2026-08-31','2026-09-01']);
  for (const observations of [undefined, null, -1, NaN, Infinity, 2.5]) assert.doesNotMatch(fuenteDelAnalisis(dates, observations), /observaci/);
  assert.deepEqual([...dates], ['2026-08-31','2026-09-01']);
});
test('el constructor usa la misma serie que sus métricas para el pie de fechas', () => {
  const source = readFileSync(new URL('../js/nuvia-constructor.js', import.meta.url), 'utf8');
  assert.match(source, /fuenteDelAnalisis\(fechasComunes, m\.observaciones\)/);
  assert.doesNotMatch(source, /fechaCorta\(payload\?\.coverage\?\.last_date\)/);
});

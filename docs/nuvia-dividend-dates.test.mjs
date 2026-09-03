import test from 'node:test';
import assert from 'node:assert/strict';
import { DIVIDEND_FIELDS, projectDividendDates, validateDividendDates, dividendCreate } from '../company-analysis/alfa/dividend-dates.mjs';
import { aFirestore } from '../scripts/mercado-alfa/firestore-rest.mjs';
const entry = { assetId: 'ES0000000001', isin: 'ES0000000001', symbol: 'TEST.MC' };
const dates = { fetchedAt: '2026-09-03T11:00:00.000Z', loadedAt: '2026-09-03T11:01:00.000Z', responseSha256: 'a'.repeat(64) };
const raw = () => Object.fromEntries(DIVIDEND_FIELDS.map((key, i) => [key, ['TEST', 'MC', entry.isin, 'Common Stock', '2026-09-02', null, '2026-10-01'][i]]));
test('proyección exacta: fechas, identidad y procedencia; una fecha futura no se convierte en importe', () => {
  const response = raw(), before = structuredClone(response);
  const doc = projectDividendDates(response, entry, dates);
  assert.deepEqual(response, before); assert.equal(doc.availability, 'exDividendOnly');
  assert.equal(doc.dividendDate, null); assert.equal(doc.exDividendDate, '2026-10-01');
  assert.equal(doc.source.fetchedAt, dates.fetchedAt); assert.equal(doc.loaded_at, dates.loadedAt);
});
test('ausencia explícita no significa dividendo cero ni fecha de pago inventada', () => {
  const response = raw(); response['SplitsDividends::ExDividendDate'] = null;
  assert.equal(projectDividendDates(response, entry, dates).availability, 'notReported');
  response['SplitsDividends::DividendDate'] = '2026-09-03';
  assert.equal(projectDividendDates(response, entry, dates).availability, 'paymentOnly');
});
test('no copia campos inesperados, personas, estimaciones ni respuestas incompletas', () => {
  for (const key of ['Holders', 'name', 'SplitsDividends::ForwardAnnualDividendRate', 'Officers']) {
    const response = raw(); response[key] = 'NO_GUARDAR';
    assert.throws(() => projectDividendDates(response, entry, dates));
  }
  const response = raw(); delete response['SplitsDividends::DividendDate'];
  assert.throws(() => projectDividendDates(response, entry, dates));
});
test('el marcador NA comprobado se normaliza a ausencia, sin admitir otros formatos', () => {
  const response = raw(); response['SplitsDividends::DividendDate'] = 'NA';
  assert.equal(projectDividendDates(response, entry, dates).dividendDate, null);
  response['SplitsDividends::ExDividendDate'] = 'NA';
  assert.equal(projectDividendDates(response, entry, dates).availability, 'notReported');
  for (const value of ['', 'N/A', 'Invalid Date', undefined, false]) {
    response['SplitsDividends::DividendDate'] = value;
    assert.throws(() => projectDividendDates(response, entry, dates));
  }
});
test('identidad exacta y fechas de calendario, sin reasignar ni aceptar formatos ambiguos', () => {
  for (const [key, value] of [['General::ISIN', 'NL0000000002'], ['General::Exchange', 'AS'], ['General::Type', 'ETF'], ['SplitsDividends::DividendDate', '2026-02-30'], ['SplitsDividends::ExDividendDate', 0]]) {
    const response = raw(); response[key] = value;
    assert.throws(() => projectDividendDates(response, entry, dates));
  }
});
test('contrato valida de nuevo procedencia, campos y disponibilidad antes de crear', () => {
  for (const alter of [d => { d.source.token = 'NO_GUARDAR'; }, d => { d.source.fetchedAt = '2026-09-03'; }, d => { d.source.fetchedAt = '2026-09-04T00:00:00.000Z'; }, d => { d.availability = 'both'; }, d => { d.name = 'NO_GUARDAR'; }, d => { d.asset_id = '../otro'; }]) {
    const doc = projectDividendDates(raw(), entry, dates); alter(doc); assert.throws(() => validateDividendDates(doc));
  }
});
test('escritura solo de creación, ruta fija y separada del fundamental y de los precios', () => {
  const doc = projectDividendDates(raw(), entry, dates);
  const write = dividendCreate(doc, aFirestore);
  assert.equal(write.update.name, 'projects/nuvia-family-wealth/databases/(default)/documents/assets/ES0000000001/fundamentals/dividends');
  assert.deepEqual(write.currentDocument, { exists: false });
  assert.deepEqual(Object.keys(write).sort(), ['currentDocument', 'update']);
  assert.doesNotMatch(JSON.stringify(write), /\/current|\/series|ForwardAnnual|Holders|Officers/);
});

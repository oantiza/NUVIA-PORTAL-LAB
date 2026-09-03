import test from 'node:test';
import assert from 'node:assert/strict';
import { countInstitutionCoverage } from '../scripts/check-company-institutions-coverage.mjs';
const entry = { isin: 'ES0000000001', symbol: 'TEST.MC' };
const payload = institutions => ({ 'General::Code': 'TEST', 'General::Exchange': 'MC', 'General::ISIN': entry.isin, 'General::Type': 'Common Stock', 'General::UpdatedAt': '2026-09-03', 'Holders::Institutions': institutions });
test('la salida contiene únicamente recuentos; no acredita la naturaleza jurídica', () => {
  const result = countInstitutionCoverage(payload({ one: { name: 'PERSONA_NO_EXPORTAR', email: 'SECRETO', date: '2026-06-30', totalShares: 0, currentShares: '125' } }), entry, '2026-09-03');
  assert.equal(result.institutions.objectRows, 1); assert.equal(result.institutions.percentageRows, 1);
  assert.equal(result.institutions.legalNatureVerified, false);
  assert.doesNotMatch(JSON.stringify(result), /PERSONA_NO_EXPORTAR|SECRETO|email/);
});
test('no confunde ausencia, contenedor vacío, formato inválido ni identidad incorrecta', () => {
  for (const [value, expected] of [[null, 'missing'], ['NA', 'missing'], [{}, 'readable'], ['NO_EXPORTAR', 'invalid']]) assert.equal(countInstitutionCoverage(payload(value), entry, '2026-09-03').institutions.containerState, expected);
  assert.equal(countInstitutionCoverage(payload('NA'), entry, '2026-09-03').sourceMarker, 'NA');
  const wrong = payload({}); wrong['General::ISIN'] = 'NL0000000002';
  assert.throws(() => countInstitutionCoverage(wrong, entry, '2026-09-03'));
  assert.throws(() => countInstitutionCoverage({ ...payload({}), Officers: [] }, entry, '2026-09-03'));
});

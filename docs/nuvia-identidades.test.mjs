import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMBIOS_IDENTIDAD, idActual, catalogoActual, entradaActual } from '../js/nuvia-identidades.js';
import { planIdentidades, YEARS } from '../scripts/mercado-alfa/identidades.mjs';
import { prepareEntry } from '../company-analysis/alfa/ingestion.mjs';
import { aFirestore, NOMBRE_BASE, documentoAObjeto } from '../scripts/mercado-alfa/firestore-rest.mjs';
import { creaClienteMaestra, buscaEnCatalogo } from '../js/nuvia-datos.js';
import { agregaPosicion, pesosNormalizados } from '../js/nuvia-constructor.js';
import { readCompany } from '../company-analysis/src/alfa/remote.js';
import { COLUMNAS, REFERENCIA_OBLIGATORIA, validaUniverso } from '../scripts/mercado-alfa/universo.mjs';
import { proyectaActivo, catalogo } from '../scripts/mercado-alfa/proyecta.mjs';
import { companyDisplayName } from '../company-analysis/alfa/display-name.mjs';
import { searchCompanies } from '../company-analysis/src/alfa/client.js';

test('TSK: grafía verificada solo en presentación y búsqueda, sin mutar fuente ni otros nombres', () => {
  const entry = { assetId: 'ES0105394003', isin: 'ES0105394003', symbol: 'TSK.MC', name: 'TSK ElectrÃ³nica y Electricidad, S.A.' };
  const before = structuredClone(entry);
  assert.equal(companyDisplayName(entry), 'TSK Electrónica y Electricidad, S.A.');
  assert.deepEqual(searchCompanies([entry], 'electronica'), [entry]);
  assert.deepEqual(entry, before);
  for (const changed of [{ isin: 'ES0000000001' }, { assetId: 'ES0000000001' }, { symbol: 'OTHER.MC' }, { name: 'TSK Nueva denominación' }]) {
    const other = { ...entry, ...changed };
    assert.equal(companyDisplayName(other), other.name);
  }
});
const at = '2026-09-03T09:00:00Z';
const wire = (path, value) => ({ name: `${NOMBRE_BASE}/${path}`, updateTime: '2026-09-02T00:00:00Z', fields: aFirestore(value).mapValue.fields });
function fixture() {
  const sources = {}, entries = [], assets = [];
  for (const c of CAMBIOS_IDENTIDAD) {
    const a = { asset_id: c.old, isin: c.old, instrument_type: 'STOCK', eodhd_symbol: c.symbol,
      ticker: c.symbol.split('.')[0], currency: 'EUR', display_name: c.symbol, history: { observations: 6 } };
    assets.push(a); sources[`assets/${c.old}`] = wire(`assets/${c.old}`, a);
    for (const year of YEARS) {
      const date = `${year}-09-${year === 2026 ? '02' : '04'}`;
      sources[`assets/${c.old}/series/${year}`] = wire(`assets/${c.old}/series/${year}`, {
        asset_id: c.old, year, currency: 'EUR', first_date: date, last_date: date, n: 1, points: [{ date, value: year - 2000 }] });
    }
    entries.push(prepareEntry({ ...a, asset_id: c.current, isin: c.current }, {
      General: { ISIN: c.current, Code: a.ticker, Exchange: 'MC', Name: c.symbol, Type: 'Common Stock', CurrencyCode: 'EUR' }, Financials: {},
    }, { catalogObservedAt: at, downloadedAt: at }));
  }
  const items = [...assets, ...Array.from({ length: 696 }, (_, i) => ({ asset_id: `XX${String(i).padStart(10, '0')}`, isin: `XX${String(i).padStart(10, '0')}` }))];
  sources['catalog_manifest/public'] = wire('catalog_manifest/public', { total: 698, chunks: 4, updated_at: '2026-09-02', prices_last_date: '2026-09-02' });
  for (let i = 0; i < 4; i++) { const path = `catalog_chunks/${String(i).padStart(3, '0')}`, chunk = items.slice(i * 200, (i + 1) * 200); sources[path] = wire(path, { items: chunk, n: chunk.length }); }
  return { sources, entries, assets };
}
test('plan autorizado: 16 creaciones y manifiesto; nunca borra ni modifica precios de origen o trozos', () => {
  const f = fixture(), before = structuredClone(f), plan = planIdentidades(f.sources, f.entries, at);
  assert.deepEqual(f, before); assert.equal(plan.writes.length, 17);
  for (const w of plan.writes.slice(0, 16)) {
    assert.deepEqual(w.currentDocument, { exists: false }); assert.equal(w.delete, undefined);
    assert.ok(CAMBIOS_IDENTIDAD.some(c => w.update.name.startsWith(`${NOMBRE_BASE}/assets/${c.current}`)));
  }
  assert.equal(plan.writes.at(-1).update.name, `${NOMBRE_BASE}/catalog_manifest/public`);
  assert.equal(plan.writes.at(-1).currentDocument.updateTime, '2026-09-02T00:00:00Z');
  assert.equal(plan.manifest.total, 698); assert.equal(plan.manifest.prices_last_date, '2026-09-02');
  for (const c of CAMBIOS_IDENTIDAD) for (const year of YEARS) {
    const before = documentoAObjeto(f.sources[`assets/${c.old}/series/${year}`]);
    const after = plan.creates.find(d => d.path === `assets/${c.current}/series/${year}`).value;
    assert.deepEqual(after.points, before.points); assert.equal(after.asset_id, c.current);
  }
});
test('el plan rechaza otra identidad, universo alterado, dato personal y cifras inválidas', () => {
  for (const alter of [
    f => { f.entries[0].isin = CAMBIOS_IDENTIDAD[1].current; },
    f => { f.sources['catalog_manifest/public'].fields.total = aFirestore(700); },
    f => { f.sources[`assets/${CAMBIOS_IDENTIDAD[0].old}`].fields.Officers = aFirestore('persona'); },
    f => { f.entries[0].company.metrics.ForwardPE = 22; },
    f => { f.sources[`assets/${CAMBIOS_IDENTIDAD[0].old}/series/2021`].name = 'otro-proyecto'; },
    f => { f.sources[`assets/${CAMBIOS_IDENTIDAD[0].old}/series/2021`].fields.points = aFirestore([{ date: '2021-02-31', value: 4 }]); },
  ]) { const f = fixture(); alter(f); assert.throws(() => planIdentidades(f.sources, f.entries, at)); }
});
test('normaliza solo las dos sucesiones aprobadas, sin mutar ni duplicar el índice', () => {
  const f = fixture(), copy = structuredClone(f.assets);
  for (const c of CAMBIOS_IDENTIDAD) {
    assert.equal(idActual(c.old), c.current); assert.equal(idActual(c.current), c.current);
    const found = buscaEnCatalogo(f.assets, c.old); assert.equal(found.activos[0].asset_id, c.current);
    assert.equal(buscaEnCatalogo(f.assets, c.current).activos.length, 1);
  }
  assert.deepEqual(f.assets, copy); assert.equal(idActual('OTRO'), 'OTRO');
  assert.equal(catalogoActual([...f.assets, ...catalogoActual(f.assets)]).length, 2);
  assert.equal(catalogoActual([{ ...f.assets[0], ticker: 'OTRO' }])[0].asset_id, f.assets[0].asset_id);
});
test('carteras antiguas: consulta la ficha y precios actuales conservando claves, pesos e importes', async () => {
  const f = fixture(), plan = planIdentidades(f.sources, f.entries, at), documents = { ...f.sources };
  for (const c of plan.creates) documents[c.path] = wire(c.path, c.value);
  documents['catalog_manifest/public'] = wire('catalog_manifest/public', plan.manifest);
  const requested = [];
  const fetchFn = async (url, options = {}) => {
    assert.equal(options.headers?.Authorization, undefined);
    assert.ok(url.startsWith('https://firestore.googleapis.com/v1/' + NOMBRE_BASE));
    if (url.endsWith(':batchGet')) {
      const names = JSON.parse(options.body).documents; assert.equal(new Set(names).size, names.length);
      requested.push(...names);
      return { ok: true, status: 200, json: async () => names.map(name => documents[name.slice(NOMBRE_BASE.length + 1)] ? { found: documents[name.slice(NOMBRE_BASE.length + 1)] } : { missing: name }) };
    }
    requested.push(url);
    const doc = documents[url.split('/documents/')[1]];
    return { ok: !!doc, status: doc ? 200 : 404, json: async () => doc || {} };
  };
  const client = creaClienteMaestra({ fetchFn, ahora: () => Date.parse(at) });
  const c = CAMBIOS_IDENTIDAD[0];
  assert.deepEqual(await client.enCatalogo([c.old, c.current]), { [c.old]: true, [c.current]: true });
  const detail = await client.detalleActivo(c.old);
  assert.equal(detail.asset_id, c.old); assert.equal(detail.identity.isin, c.current); assert.equal(detail.canonical_asset_id, c.current);
  const series = await client.seriesRebasadas([c.old, c.current]);
  assert.deepEqual(series.series.map(s => s.asset_id), [c.old, c.current]);
  assert.deepEqual(series.series[0].values, series.series[1].values);
  assert.ok(!requested.some(url => url.includes(`assets/${c.old}`)), 'No lee series antiguas al resolver alias');
  const positions = [{ activo: { asset_id: c.old }, bruto: 37 }], before = structuredClone(positions);
  assert.equal(agregaPosicion(positions, { asset_id: c.current }).motivo, 'repetido');
  assert.deepEqual(positions, before); assert.deepEqual(pesosNormalizados(positions), { [c.old]: 1 });
  const oldEntry = { ...f.entries[0], assetId: c.old, isin: c.old };
  const result = await readCompany(oldEntry, { fetchFn }); assert.equal(result.company.identity.isin, c.current);
  assert.equal(entradaActual(oldEntry).company, null, 'No reasigna respaldo antiguo a nueva identidad');
});

test('futuras cargas conservan las identidades autorizadas y sus alias sin reescribir el CSV', () => {
  const rows = CAMBIOS_IDENTIDAD.map(c => ({ asset_id: c.old, eodhd_symbol: c.symbol, instrument_type: 'STOCK',
    clase: 'EQUITY', grupo: 'acciones', nombre: c.symbol, divisa: 'EUR', incluir: 'si' }));
  const refs = REFERENCIA_OBLIGATORIA.map(id => ({ ...rows[0], asset_id: id, instrument_type: 'FUND', eodhd_symbol: `${id}.EUFUND` }));
  const csv = { cabecera: COLUMNAS, filas: [...refs, ...rows] }, before = structuredClone(csv);
  const result = validaUniverso(csv);
  assert.deepEqual(result.errores, []); assert.deepEqual(csv, before);
  assert.deepEqual(result.incluidas.slice(-2).map(r => r.asset_id), CAMBIOS_IDENTIDAD.map(c => c.current));
  const projected = rows.map((fila, i) => {
    const p = proyectaActivo({ fila, eod: [{ date: '2026-09-02', adjusted_close: 25.125 }],
      fundamentales: { General: { CurrencyCode: 'EUR', Code: fila.eodhd_symbol.split('.')[0] } }, fetchedAt: at, updatedAt: at });
    assert.deepEqual(p.errores, []); assert.equal(p.asset.asset_id, CAMBIOS_IDENTIDAD[i].current);
    assert.equal(p.asset.identity_transition.previous_isin, fila.asset_id);
    assert.deepEqual(p.series[0].points, [{ date: '2026-09-02', value: 25.125 }]);
    return p.asset;
  });
  const built = catalogo(projected, at);
  assert.deepEqual(built.manifest.identity_aliases, Object.fromEntries(CAMBIOS_IDENTIDAD.map(c => [c.old, c.current])));
  assert.equal(built.manifest.total, 2);
  assert.equal(catalogo([], at).manifest.identity_aliases, undefined);
  const duplicate = validaUniverso({ ...csv, filas: [...csv.filas, { ...rows[0], asset_id: CAMBIOS_IDENTIDAD[0].current }] });
  assert.ok(duplicate.errores.some(e => e.includes('repetido')));
  const excluded = validaUniverso({ ...csv, filas: [...refs, { ...rows[0], incluir: 'no' }] });
  assert.equal(excluded.incluidas.length, 4);
});

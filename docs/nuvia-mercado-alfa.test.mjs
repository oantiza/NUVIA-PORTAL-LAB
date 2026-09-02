/**
 * Batería del pipeline de datos de la alfa (scripts/mercado-alfa/).
 *
 * Sin red y sin escribir en Firestore: proyector sobre los fixtures reales de
 * docs/fixtures/eodhd/, métricas sobre series sintéticas de resultado conocido,
 * lector del CSV, conversor de Firestore y escritura por lotes con fetch falso.
 *
 *   node docs/nuvia-mercado-alfa.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { leeCsv, validaUniverso, claveOrden, REFERENCIA_OBLIGATORIA } from '../scripts/mercado-alfa/universo.mjs';
import {
  puntosValidos, fusionaEod, seriesPorAnio, metricas, volatilidad, caidaMaxima, historialYCalidad,
  exposicionesEtf, holdingsEtf, divisaConfirmada, proyectaActivo, exposicionesPorClase, catalogo,
  clavesProhibidasEn, restaAnios, diasLaborables, normClave, SCHEMA_VERSION,
} from '../scripts/mercado-alfa/proyecta.mjs';
import { aFirestore, deFirestore, escrituraUpsert, commitLotes, tokenGcloud, URL_BASE, PROYECTO_ALFA } from '../scripts/mercado-alfa/firestore-rest.mjs';
import { creaClienteEodhd, candidatoEnEuros } from '../scripts/mercado-alfa/eodhd.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const fixture = (n) => JSON.parse(readFileSync(join(AQUI, 'fixtures', 'eodhd', n), 'utf8').replace(/^\uFEFF/, ''));

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}
const cerca = (a, b, tol = 1e-6) => a != null && Math.abs(a - b) <= tol;

/* ───────── series sintéticas ───────── */

/** Precio diario (todos los días naturales) con crecimiento anual constante. */
function serieGeometrica({ desde, hasta, anual = 0.10, base = 100 }) {
  const salida = [];
  const d0 = new Date(`${desde}T00:00:00Z`);
  const d1 = new Date(`${hasta}T00:00:00Z`);
  for (const d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    const dias = (d - d0) / 86_400_000;
    salida.push({ date: d.toISOString().slice(0, 10), adjusted_close: base * (1 + anual) ** (dias / 365.25) });
  }
  return salida;
}

/* ───────── 1. CSV y universo ───────── */
{
  const csv = '\uFEFFasset_id,eodhd_symbol,instrument_type,clase,grupo,nombre,divisa,incluir\r\n'
    + 'IE00B03HD191,IE00B03HD191.EUFUND,FUND,EQUITY,referencia-bolsa,"Vanguard, Global",EUR,si\r\n'
    + 'IE00BYX5NX33,IE00BYX5NX33.EUFUND,FUND,EQUITY,referencia-bolsa,Fidelity,EUR,si\r\n'
    + 'LU0113257694,LU0113257694.EUFUND,FUND,FIXED_INCOME,referencia-bonos,Schroder,EUR,si\r\n'
    + 'LU0132601682,LU0132601682.EUFUND,FUND,FIXED_INCOME,referencia-bonos,MS,EUR,si\r\n'
    + 'ES0178430E18,TEF.MC,STOCK,,acciones,Telefónica,EUR,si\r\n'
    + 'ES0105394003,,STOCK,,acciones,TSK,EUR,si\r\n'
    + 'LU0000000001,LU0000000001.EUFUND,FUND,,fondos-bolsa,Fondo sin clase,EUR,si\r\n'
    + 'US0000000002,AAA.US,STOCK,,acciones,Dólar,USD,si\r\n'
    + 'FR0000000003,FR0000000003.EUFUND,FUND,EQUITY,fondos-bolsa,Excluido,EUR,no\r\n';
  const leido = leeCsv(csv);
  comprueba('CSV: BOM, CRLF y comillas', leido.filas.length === 9 && leido.filas[0].nombre === 'Vanguard, Global' && leido.cabecera[0] === 'asset_id');
  const v = validaUniverso(leido);
  comprueba('universo: excluye incluir=no', !v.incluidas.some((f) => f.asset_id === 'FR0000000003'));
  comprueba('universo: fondo sin clase es error', v.errores.some((e) => e.includes('LU0000000001') || e.includes('Línea 8')));
  comprueba('universo: divisa USD es error', v.errores.some((e) => e.includes('USD')));
  comprueba('universo: símbolo vacío es aviso, no error', v.avisos.some((a) => a.includes('ES0105394003')) && !v.errores.some((e) => e.includes('ES0105394003')));
  const sinRef = validaUniverso(leeCsv(csv.replace('IE00B03HD191,IE00B03HD191.EUFUND,FUND,EQUITY,referencia-bolsa,"Vanguard, Global",EUR,si\r\n', '')));
  comprueba('universo: falta un instrumento de referencia', sinRef.errores.some((e) => e.includes('IE00B03HD191')));
  comprueba('referencia: los cuatro del constructor', REFERENCIA_OBLIGATORIA.length === 4);
  comprueba('orden del catálogo: referencia antes que fondos, y sin acentos', claveOrden({ grupo: 'referencia-bolsa', nombre: 'Éxito' }) < claveOrden({ grupo: 'fondos-bolsa', nombre: 'Abc' }) && claveOrden({ grupo: 'etf', nombre: 'Éxito' }).endsWith('exito'));

  // El CSV real del repositorio, si existe.
  try {
    const real = validaUniverso(leeCsv(readFileSync(join(AQUI, '..', 'universo', 'universo-alfa.csv'), 'utf8')));
    comprueba('CSV real: sin errores', real.errores.length === 0, real.errores.slice(0, 3).join(' | '));
    comprueba('CSV real: entre 50 y 200 incluidos', real.incluidas.length >= 50 && real.incluidas.length <= 200, String(real.incluidas.length));
  } catch { console.log('     (sin CSV real en este árbol; se omite)'); }
}

/* ───────── 2. precios, métricas y calidad ───────── */
{
  const eod = [
    { date: '2024-01-03', adjusted_close: '10.5' }, { date: '2024-01-02', adjusted_close: 10 },
    { date: '2024-01-04', adjusted_close: 0 }, { date: '2024-01-05', adjusted_close: null }, { date: 'x', adjusted_close: 3 },
    { date: '2024-01-03', adjusted_close: 11 },
  ];
  const p = puntosValidos(eod);
  comprueba('puntosValidos: ordena, descarta 0/null/fecha mala y deduplica', p.length === 2 && p[0].date === '2024-01-02' && p[1].value === 11);
  const fus = fusionaEod([{ date: '2024-01-02', adjusted_close: 1 }, { date: '2024-01-03', adjusted_close: 2 }], [{ date: '2024-01-03', adjusted_close: 2.5 }, { date: '2024-01-04', adjusted_close: 3 }]);
  comprueba('fusionaEod: el nuevo sustituye y se añade', fus.length === 3 && fus[1].adjusted_close === 2.5 && fus[2].date === '2024-01-04');

  const sint = puntosValidos(serieGeometrica({ desde: '2022-08-01', hasta: '2026-09-01', anual: 0.10 }));
  const m = metricas(sint);
  comprueba('métricas: as_of_date = último punto', m.as_of_date === '2026-09-01');
  comprueba('métricas: rentabilidad 1 año ≈ 10 %', cerca(m.return_1y, 0.10, 2e-3), String(m.return_1y));
  comprueba('métricas: rentabilidad 3 años anualizada ≈ 10 %', cerca(m.return_3y_annualized, 0.10, 2e-3), String(m.return_3y_annualized));
  comprueba('métricas: volatilidad de una serie geométrica = 0', cerca(m.volatility_1y, 0, 1e-9) && cerca(m.volatility_3y, 0, 1e-9));
  comprueba('métricas: caída máxima de una serie creciente = 0', m.max_drawdown_3y === 0);
  comprueba('métricas: método declarado', typeof m.method === 'string' && m.method.includes('√252'));

  const corta = puntosValidos(serieGeometrica({ desde: '2026-03-01', hasta: '2026-09-01' }));
  const mc = metricas(corta);
  comprueba('métricas: serie de 6 meses → 1 y 3 años null, nunca inventadas', mc.return_1y === null && mc.return_3y_annualized === null && mc.volatility_3y === null);

  const caida = [{ date: '2026-01-01', value: 100 }, { date: '2026-01-02', value: 120 }, { date: '2026-01-03', value: 60 }, { date: '2026-01-04', value: 90 }];
  comprueba('caidaMaxima: 120 → 60 = −50 %', cerca(caidaMaxima(caida), -0.5));
  const vol = volatilidad([{ date: 'a', value: 100 }, { date: 'b', value: 110 }, { date: 'c', value: 100 }]);
  comprueba('volatilidad: desviación muestral × √252', cerca(vol, Math.sqrt(252) * Math.sqrt(((Math.log(1.1)) ** 2 + (Math.log(1 / 1.1)) ** 2) / 1) , 1e-9));

  comprueba('restaAnios respeta 29-02', restaAnios('2024-02-29', 1) === '2023-02-28' && restaAnios('2026-09-01', 3) === '2023-09-01');
  comprueba('diasLaborables: una semana completa = 5', diasLaborables('2026-08-31', '2026-09-06') === 5);

  const hc = historialYCalidad(sint);
  comprueba('calidad: serie diaria completa → OK', hc.quality.status === 'OK' && hc.history.observations === sint.length && hc.history.years > 4);
  const semanal = sint.filter((_, i) => i % 7 === 0);
  const hs = historialYCalidad(semanal);
  comprueba('calidad: serie semanal → INCOMPLETO por sesiones que faltan', hs.quality.status === 'INCOMPLETO' && hs.quality.warnings.some((w) => w.includes('faltan sesiones')));
  const hcorta = historialYCalidad(corta);
  comprueba('calidad: historial < 3 años → INCOMPLETO con aviso', hcorta.quality.status === 'INCOMPLETO' && hcorta.quality.warnings.some((w) => w.includes('más corto')));
  comprueba('calidad: sin puntos → INCOMPLETO', historialYCalidad([]).quality.status === 'INCOMPLETO');

  const s = seriesPorAnio('X', sint);
  comprueba('seriesPorAnio: un documento por año, con n y fechas', s.length === 5 && s[0].year === 2022 && s[4].year === 2026 && s[1].n === 365 && s[1].first_date === '2023-01-01' && s[0].currency === 'EUR');
}

/* ───────── 3. fixtures reales ───────── */
const hoy = '2026-09-01';
const eodBase = serieGeometrica({ desde: '2021-01-01', hasta: hoy, anual: 0.08 });
const filaFondo = { asset_id: 'IE00B03HD191', eodhd_symbol: 'IE00B03HD191.EUFUND', instrument_type: 'FUND', clase: 'EQUITY', grupo: 'referencia-bolsa', nombre: 'Vanguard Global Stock Index Fund EUR Acc', divisa: 'EUR', incluir: 'si' };
const filaFondoLu = { ...filaFondo, asset_id: 'LU0113257694', eodhd_symbol: 'LU0113257694.EUFUND', clase: 'FIXED_INCOME', grupo: 'referencia-bonos', nombre: 'Schroder ISF EURO Corporate Bond' };
const filaEtf = { asset_id: 'IE00B4L5Y983', eodhd_symbol: 'IWDA.AS', instrument_type: 'ETF', clase: '', grupo: 'etf', nombre: 'iShares Core MSCI World', divisa: 'EUR', incluir: 'si' };
const filaAccion = { asset_id: 'ES0178430E18', eodhd_symbol: 'TEF.MC', instrument_type: 'STOCK', clase: '', grupo: 'acciones', nombre: 'Telefónica', divisa: 'EUR', incluir: 'si' };
const busquedaFondo = [{ Code: 'IE00B03HD191', Exchange: 'EUFUND', Name: 'Vanguard Global Stock Index Fund EUR Acc', Currency: 'EUR', ISIN: 'IE00B03HD191', Type: 'FUND' }];
const busquedaFondoLu = [{ Code: 'LU0113257694', Exchange: 'EUFUND', Name: 'Schroder', Currency: 'EUR', ISIN: null, Type: 'FUND' }];
const fetchedAt = '2026-09-02T10:00:00.000Z';
const updatedAt = '2026-09-02T10:05:00.000Z';

{
  const etfData = fixture('muestra-etf.json').ETF_Data;
  const ex = exposicionesEtf(etfData);
  comprueba('ETF: asset_mix desde Asset_Allocation (equity ≈ 0,99)', ex && cerca(ex.asset_mix.equity, 0.9947, 1e-3) && cerca(ex.asset_mix.fixed_income, 0, 1e-9), JSON.stringify(ex?.asset_mix));
  comprueba('ETF: regiones normalizadas con Equity_%', ex && cerca(ex.regions.north_america, 75.543, 1e-3) && ex.regions.europe_developed > 10);
  comprueba('ETF: sectores normalizados', ex && ex.sectors.financial_services > 16 && ex.sectors.technology > 0 && !('relative_to_category' in ex.sectors));
  const h = holdingsEtf(etfData, hoy);
  comprueba('ETF: 10 mayores posiciones, ordenadas, con top10_weight', h && h.holdings.length === 10 && h.holdings[0].ticker === 'NVDA' && h.holdings[0].weight_pct >= h.holdings[9].weight_pct && h.top10_weight > 15 && h.as_of_date === hoy);
  comprueba('ETF: posiciones con país y sector, sin ISIN (EODHD no lo da)', h.holdings[0].country === 'United States' && h.holdings[0].sector === 'Technology' && h.holdings[0].isin === null);

  const rEtf = proyectaActivo({ fila: filaEtf, eod: eodBase, fundamentales: fixture('muestra-etf.json'), fetchedAt, updatedAt });
  comprueba('ETF proyectado: publicable', rEtf.asset && rEtf.errores.length === 0, rEtf.errores.join('; '));
  comprueba('ETF: nombre y ticker de EODHD, clase deducida EQUITY, gastos 0,20 %, categoría = índice', rEtf.asset.display_name.startsWith('iShares Core MSCI World') && rEtf.asset.ticker === 'IWDA' && rEtf.asset.economic_asset_class === 'EQUITY' && rEtf.asset.costs.ongoing_charge === 0.2 && rEtf.asset.category === etfData.Index_Name && typeof etfData.Index_Name === 'string');
  comprueba('ETF: divisa confirmada por la ficha', rEtf.asset.source.currency_check.method === 'fundamentals' && rEtf.asset.source.currency_check.value === 'EUR');
  comprueba('ETF: región principal = north_america', rEtf.asset.region === 'north_america');
  comprueba('ETF: esquema y fechas', rEtf.asset.schema_version === SCHEMA_VERSION && rEtf.asset.updated_at === updatedAt && rEtf.asset.source.fetched_at === fetchedAt && rEtf.asset.currency === 'EUR');
  comprueba('ETF: sin claves de mérito aunque la ficha traiga MorningStar/Performance', clavesProhibidasEn({ a: rEtf.asset, h: rEtf.holdings }).length === 0);
  comprueba('fixture ETF sí trae claves de mérito (la prueba tiene sentido)', clavesProhibidasEn(fixture('muestra-etf.json')).length >= 2);
  comprueba('ETF: 6 series (2021–2026)', rEtf.series.length === 6 && rEtf.series[0].year === 2021);

  const rAcc = proyectaActivo({ fila: filaAccion, eod: eodBase, fundamentales: fixture('muestra-accion.json'), fetchedAt, updatedAt });
  comprueba('acción proyectada: publicable', rAcc.asset && rAcc.errores.length === 0, rAcc.errores.join('; '));
  comprueba('acción: nombre, sector, país e industria de General', rAcc.asset.display_name === 'Telefonica' && rAcc.asset.sector === 'Communication Services' && rAcc.asset.region === 'Spain' && rAcc.asset.category === 'Telecom Services');
  comprueba('acción: exposiciones = 100 % en su sector y país; sin Highlights', rAcc.asset.exposures.sectors.communication_services === 100 && rAcc.asset.exposures.regions.spain === 100 && rAcc.asset.exposures.asset_mix.equity === 1 && clavesProhibidasEn(rAcc.asset).length === 0);
  comprueba('acción: sin desglose de posiciones', rAcc.holdings === null);

  const rF = proyectaActivo({ fila: filaFondo, eod: eodBase, fundamentales: fixture('muestra-fondo.json'), busqueda: busquedaFondo, fetchedAt, updatedAt });
  comprueba('fondo (esqueleto EODHD) proyectado: publicable', rF.asset && rF.errores.length === 0, rF.errores.join('; '));
  comprueba('fondo: nombre y clase del CSV; sin ticker, sector ni región', rF.asset.display_name === filaFondo.nombre && rF.asset.economic_asset_class === 'EQUITY' && rF.asset.ticker === null && rF.asset.sector === null && rF.asset.region === null);
  comprueba('fondo: regiones y sectores = null (nunca {} ni 0), asset_mix por clase declarada', rF.asset.exposures.regions === null && rF.asset.exposures.sectors === null && rF.asset.exposures.source === 'csv-clase' && rF.asset.exposures.asset_mix.equity === 1);
  comprueba('fondo: aviso «sin desglose» sin degradar el estado', rF.asset.quality.status === 'OK' && rF.asset.quality.warnings.some((w) => w.startsWith('sin desglose')));
  comprueba('fondo: divisa confirmada por la ficha (el esqueleto trae CurrencyCode)', rF.asset.source.currency_check.method === 'fundamentals');
  comprueba('fondo: sin documento de posiciones', rF.holdings === null);

  const rLu = proyectaActivo({ fila: filaFondoLu, eod: eodBase, fundamentales: fixture('muestra-fondo-lu.json'), busqueda: busquedaFondoLu, fetchedAt, updatedAt });
  comprueba('fondo con ficha {} : publicable, divisa por búsqueda (coincide Code)', rLu.asset && rLu.asset.source.currency_check.method === 'search' && rLu.asset.economic_asset_class === 'FIXED_INCOME', rLu.errores.join('; '));
  comprueba('fondo mixto: asset_mix null', exposicionesPorClase('MIXED') === null && exposicionesPorClase('OTHER') === null && exposicionesPorClase('MONEY_MARKET').asset_mix.cash === 1);

  const rSinDivisa = proyectaActivo({ fila: filaFondoLu, eod: eodBase, fundamentales: {}, busqueda: [], fetchedAt, updatedAt });
  comprueba('sin divisa confirmable → no se publica', rSinDivisa.asset === null && rSinDivisa.errores.some((e) => e.includes('divisa no confirmable')));
  const rUsd = proyectaActivo({ fila: filaAccion, eod: eodBase, fundamentales: { General: { Name: 'X', CurrencyCode: 'USD' } }, fetchedAt, updatedAt });
  comprueba('divisa USD en EODHD → no se publica', rUsd.asset === null && rUsd.errores.some((e) => e.includes('USD')));
  const rSinPrecios = proyectaActivo({ fila: filaAccion, eod: [], fundamentales: fixture('muestra-accion.json'), fetchedAt, updatedAt });
  comprueba('sin precios → no se publica', rSinPrecios.asset === null);
  comprueba('divisaConfirmada: búsqueda que no coincide → null', divisaConfirmada({ fila: filaFondoLu, busqueda: [{ Code: 'OTRO', Exchange: 'EUFUND', Currency: 'EUR' }] }) === null);
  comprueba('normClave', normClave('Europe Developed') === 'europe_developed' && normClave('Consumer Cyclicals') === 'consumer_cyclicals');

  const { chunks, manifest } = catalogo([rF.asset, rAcc.asset, rEtf.asset, rLu.asset], updatedAt);
  comprueba('catálogo: un trozo, orden referencia → etf → acciones', chunks.length === 1 && chunks[0].id === '000' && chunks[0].items[0].asset_id === 'IE00B03HD191' && chunks[0].items[3].asset_id === 'ES0178430E18');
  comprueba('catálogo: manifiesto con total, fecha de precios y universo alfa', manifest.total === 4 && manifest.prices_last_date === hoy && manifest.universe === 'alfa' && manifest.updated_at === updatedAt && manifest.schema_version === SCHEMA_VERSION);
  comprueba('catálogo: los items no llevan métricas ni mérito', !('metrics' in chunks[0].items[0]) && clavesProhibidasEn(chunks[0]).length === 0);
}

/* ───────── 4. Firestore REST ───────── */
{
  const obj = { a: 'x', n: 3, d: 0.5, b: true, z: null, l: [1, 'dos', { k: null }], m: { p: [] }, u: undefined };
  const ida = aFirestore(obj);
  comprueba('aFirestore: tipos', ida.mapValue.fields.n.integerValue === '3' && 'doubleValue' in ida.mapValue.fields.d && 'nullValue' in ida.mapValue.fields.z && !('u' in ida.mapValue.fields));
  const vuelta = deFirestore(ida);
  comprueba('deFirestore: ida y vuelta', JSON.stringify(vuelta) === JSON.stringify({ a: 'x', n: 3, d: 0.5, b: true, z: null, l: [1, 'dos', { k: null }], m: { p: [] } }));
  comprueba('deFirestore: timestampValue e integerValue en cadena', deFirestore({ timestampValue: '2026-01-01T00:00:00Z' }) === '2026-01-01T00:00:00Z' && deFirestore({ integerValue: '42' }) === 42);
  const w = escrituraUpsert('assets/X', { a: 1 });
  comprueba('escrituraUpsert apunta solo a nuvia-family-wealth', w.update.name === `projects/${PROYECTO_ALFA}/databases/(default)/documents/assets/X` && !w.update.currentDocument && URL_BASE.includes('nuvia-family-wealth') && !URL_BASE.includes('bbdd'));

  const llamadas = [];
  const fetchFalso = async (url, opciones) => {
    llamadas.push({ url, cuerpo: JSON.parse(opciones.body), cabeceras: opciones.headers });
    return { ok: true, status: 200, json: async () => ({ writeResults: JSON.parse(opciones.body).writes.map(() => ({})) }), text: async () => '' };
  };
  const docs = Array.from({ length: 450 }, (_, i) => ({ ruta: `assets/A${i}`, objeto: { i } }));
  const r = await commitLotes(docs, { token: 'tok', fetchFn: fetchFalso });
  comprueba('commitLotes: 450 docs en 3 lotes de ≤ 200, cabeceras correctas', r.escritos === 450 && r.lotes === 3 && llamadas.length === 3 && llamadas[0].cuerpo.writes.length === 200 && llamadas[0].cabeceras.Authorization === 'Bearer tok' && llamadas[0].cabeceras['x-goog-user-project'] === PROYECTO_ALFA && llamadas[0].url.endsWith(':commit'));
  const seco = await commitLotes(docs, { token: null, fetchFn: async () => { throw new Error('no debería llamar'); }, dryRun: true });
  comprueba('commitLotes: dry-run cuenta sin llamar a la red', seco.escritos === 450 && seco.lotes === 3);
  const fetchCorto = async () => ({ ok: true, status: 200, json: async () => ({ writeResults: [{}] }), text: async () => '' });
  let fallo = null;
  try { await commitLotes(docs.slice(0, 3), { token: 'tok', fetchFn: fetchCorto }); } catch (e) { fallo = e; }
  comprueba('commitLotes: recuento que no cuadra → error', fallo && fallo.message.includes('resultados'));
  comprueba('tokenGcloud: ejecuta gcloud como proceso hijo y recorta', tokenGcloud({ exec: () => ' abc \n', plataforma: 'linux' }) === 'abc');
  let sinToken = null;
  try { tokenGcloud({ exec: () => '', plataforma: 'win32' }); } catch (e) { sinToken = e; }
  comprueba('tokenGcloud: sin token → error claro', sinToken && sinToken.message.includes('gcloud auth login'));
}

/* ───────── 5. cliente EODHD ───────── */
{
  const urls = [];
  const fetchFalso = async (url) => {
    urls.push(url);
    if (urls.length === 1) return { ok: false, status: 429, text: async () => '' };
    return { ok: true, status: 200, text: async () => '\uFEFF[{"date":"2026-09-01","adjusted_close":1}]' };
  };
  const esperas = [];
  const cli = creaClienteEodhd({ token: 'CLAVE-SECRETA', fetchFn: fetchFalso, espera: async (ms) => { esperas.push(ms); } });
  const r = await cli.precios('IE00B03HD191.EUFUND', '2026-08-01');
  comprueba('EODHD: reintenta ante 429 y quita el BOM', Array.isArray(r) && r[0].date === '2026-09-01' && urls.length === 2 && esperas.some((ms) => ms >= 1000));
  comprueba('EODHD: la clave viaja en la URL y en ningún otro sitio', urls[0].includes('api_token=CLAVE-SECRETA') && urls[0].includes('/eod/IE00B03HD191.EUFUND') && urls[0].includes('from=2026-08-01'));
  comprueba('EODHD: fundamentales cuentan 10 llamadas', (await cli.fundamentales('IWDA.AS'), cli.llamadas() === 12));
  const cli404 = creaClienteEodhd({ token: 'CLAVE-SECRETA', fetchFn: async () => ({ ok: false, status: 404, text: async () => '' }) });
  let err = null;
  try { await cli404.precios('X.Y', '2026-01-01'); } catch (e) { err = e; }
  comprueba('EODHD: el error no lleva la clave', err && !err.message.includes('CLAVE-SECRETA') && err.message.includes('404'));
  let sinClave = null;
  try { creaClienteEodhd({ token: '' }); } catch (e) { sinClave = e; }
  comprueba('EODHD: sin clave → error', Boolean(sinClave));

  const busq = [
    { Code: 'TSK', Exchange: 'MC', Name: 'Tubos', Currency: 'EUR', ISIN: 'ES0105394003', Type: 'Common Stock' },
    { Code: 'TSK', Exchange: 'US', Name: 'Tubos ADR', Currency: 'USD', ISIN: null, Type: 'Common Stock' },
  ];
  const c = candidatoEnEuros(busq, { isin: 'ES0105394003', tipo: 'STOCK' });
  comprueba('candidatoEnEuros: elige el de ISIN en EUR', c.candidato?.symbol === 'TSK.MC');
  const ambiguo = candidatoEnEuros([{ Code: 'A', Exchange: 'MC', Currency: 'EUR', Type: 'Common Stock' }, { Code: 'B', Exchange: 'PA', Currency: 'EUR', Type: 'Common Stock' }], { isin: 'X', tipo: 'STOCK' });
  comprueba('candidatoEnEuros: con dos en EUR y sin ISIN no adivina', ambiguo.candidato === null && ambiguo.alternativas.length === 2);
}

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo en verde');
process.exit(fallos ? 1 : 0);

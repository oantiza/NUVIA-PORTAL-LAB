/**
 * Batería de verificación de js/nuvia-datos.js (Entrega 2b: base propia de
 * la alfa, en abierto, sin cuentas).
 *
 * Sin red: se inyecta un fetch falso que imita la API REST de Firestore del
 * proyecto nuvia-family-wealth. Se comprueba que:
 *  - ninguna petición lleva cabecera Authorization ni va a Auth, a funciones
 *    en la nube ni a la base profesional;
 *  - el catálogo se carga una vez (manifiesto + trozos) y se cachea por
 *    updated_at; la búsqueda es en memoria, sin acentos;
 *  - las fichas llegan con la forma que esperan los módulos, y «sin datos» es null;
 *  - las series se alinean y rebasan como get_price_series; años cerrados en caché;
 *  - la fachada llama() conserva los nombres antiguos y rechaza el resto;
 *  - la clave de sesión del proyecto anterior se borra.
 *
 *   node docs/nuvia-datos.test.mjs
 */
import {
  creaClienteMaestra, etiquetaTipo, leeSuscripcion, esAdmin, CLAVE_SUSCRIPCION,
  deFirestore, documentoAObjeto, buscaEnCatalogo, fichaParaModulos, alineaYRebasa, aniosDeVentana, normaliza,
  CLAVE_SESION_ANTIGUA, CLAVE_CATALOGO, PREFIJO_SERIES, NIVEL_ALFA, PROYECTO, URL_DOCUMENTOS,
} from '../js/nuvia-datos.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

function almacenFalso() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    claves: () => [...m.keys()],
  };
}

/* ── Base falsa en formato REST ── */
const PREFIJO = `projects/${PROYECTO.id}/databases/(default)/documents/`;
const s = (v) => ({ stringValue: v });
const n = (v) => (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v });
const nul = () => ({ nullValue: null });
const mapa = (o) => ({ mapValue: { fields: o } });
const lista = (a) => ({ arrayValue: { values: a } });

function puntos(desde, dias, base, paso) {
  const out = [];
  const d = new Date(`${desde}T00:00:00Z`);
  for (let i = 0; i < dias; i += 1) {
    out.push(mapa({ date: s(d.toISOString().slice(0, 10)), value: n(base + paso * i) }));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const HOY = Date.parse('2026-09-02T12:00:00Z');
const base = {
  'catalog_manifest/public': { total: n(3), chunks: n(1), updated_at: s('2026-09-02T10:00:00Z'), prices_last_date: s('2026-09-01'), universe: s('alfa') },
  'catalog_chunks/000': { items: lista([
    mapa({ asset_id: s('IE00B03HD191'), display_name: s('Vanguard Global Stock Index Fund EUR Acc'), instrument_type: s('FUND'), economic_asset_class: s('EQUITY'), isin: s('IE00B03HD191'), ticker: nul(), grupo: s('referencia-bolsa') }),
    mapa({ asset_id: s('ES0178430E18'), display_name: s('Telefónica'), instrument_type: s('STOCK'), economic_asset_class: s('EQUITY'), isin: s('ES0178430E18'), ticker: s('TEF'), grupo: s('acciones') }),
    mapa({ asset_id: s('IE00B4L5Y983'), display_name: s('iShares Core MSCI World UCITS ETF'), instrument_type: s('ETF'), economic_asset_class: s('EQUITY'), isin: s('IE00B4L5Y983'), ticker: s('IWDA'), grupo: s('etf') }),
  ]), n: n(3) },
  'assets/IE00B03HD191': {
    asset_id: s('IE00B03HD191'), isin: s('IE00B03HD191'), ticker: nul(), instrument_type: s('FUND'), economic_asset_class: s('EQUITY'),
    display_name: s('Vanguard Global Stock Index Fund EUR Acc'), currency: s('EUR'), region: nul(), sector: nul(), category: nul(),
    costs: mapa({}), exposures: mapa({ source: s('csv-clase'), asset_mix: mapa({ equity: n(1), fixed_income: n(0), cash: n(0), other: n(0) }), regions: nul(), sectors: nul() }),
    metrics: mapa({ as_of_date: s('2026-09-01'), return_1y: n(0.08), volatility_1y: n(0.12) }),
    quality: mapa({ status: s('OK'), warnings: lista([s('sin desglose de regiones y sectores en la alfa (EODHD no lo publica para fondos europeos)')]) }),
  },
  'assets/IE00B4L5Y983': {
    asset_id: s('IE00B4L5Y983'), isin: s('IE00B4L5Y983'), ticker: s('IWDA'), instrument_type: s('ETF'), economic_asset_class: s('EQUITY'),
    display_name: s('iShares Core MSCI World UCITS ETF'), currency: s('EUR'), region: s('north_america'), sector: nul(), category: s('MSCI World'),
    costs: mapa({ ongoing_charge: n(0.2) }),
    exposures: mapa({ source: s('EODHD'), asset_mix: mapa({ equity: n(0.99), fixed_income: n(0), cash: n(0.01), other: n(0) }), regions: mapa({ north_america: n(75.5), europe_developed: n(12.3) }), sectors: mapa({ technology: n(25.1) }) }),
    metrics: mapa({ as_of_date: s('2026-09-01') }), quality: mapa({ status: s('OK'), warnings: lista([]) }),
  },
  'assets/IE00B4L5Y983/holdings/latest': { as_of_date: s('2026-09-01'), source: s('EODHD'), holdings_count: n(10), top10_weight: n(21.5),
    holdings: lista([mapa({ name: s('NVIDIA'), isin: nul(), ticker: s('NVDA'), weight_pct: n(5.2), country: s('United States'), sector: s('Technology') })]) },
  'assets/IE00B03HD191/series/2023': { asset_id: s('IE00B03HD191'), year: n(2023), points: lista(puntos('2023-01-01', 365, 100, 0.1)) },
  'assets/IE00B03HD191/series/2024': { asset_id: s('IE00B03HD191'), year: n(2024), points: lista(puntos('2024-01-01', 366, 136.5, 0.1)) },
  'assets/IE00B03HD191/series/2025': { asset_id: s('IE00B03HD191'), year: n(2025), points: lista(puntos('2025-01-01', 365, 173.1, 0.1)) },
  'assets/IE00B03HD191/series/2026': { asset_id: s('IE00B03HD191'), year: n(2026), points: lista(puntos('2026-01-01', 244, 209.6, 0.1)) },
  'assets/IE00B4L5Y983/series/2023': { asset_id: s('IE00B4L5Y983'), year: n(2023), points: lista(puntos('2023-01-02', 364, 50, 0.05)) },
  'assets/IE00B4L5Y983/series/2024': { asset_id: s('IE00B4L5Y983'), year: n(2024), points: lista(puntos('2024-01-01', 366, 68.2, 0.05)) },
  'assets/IE00B4L5Y983/series/2025': { asset_id: s('IE00B4L5Y983'), year: n(2025), points: lista(puntos('2025-01-01', 365, 86.5, 0.05)) },
  'assets/IE00B4L5Y983/series/2026': { asset_id: s('IE00B4L5Y983'), year: n(2026), points: lista(puntos('2026-01-01', 244, 104.7, 0.05)) },
  // Telefónica: solo desde 2025 → sin historial suficiente en la ventana de 3 años
  'assets/ES0178430E18/series/2025': { asset_id: s('ES0178430E18'), year: n(2025), points: lista(puntos('2025-06-01', 214, 4, 0.001)) },
  'assets/ES0178430E18/series/2026': { asset_id: s('ES0178430E18'), year: n(2026), points: lista(puntos('2026-01-01', 244, 4.2, 0.001)) },
};

function fetchFalso() {
  const registro = { urls: [], cabeceras: [], get: 0, batch: 0 };
  const fn = async (url, opciones = {}) => {
    registro.urls.push(url);
    registro.cabeceras.push(opciones.headers || {});
    const responde = (json, ok = true, status = 200) => ({ ok, status, json: async () => json });
    if (!url.startsWith(URL_DOCUMENTOS)) return responde({ error: { message: 'host inesperado' } }, false, 500);
    if (url.endsWith(':batchGet')) {
      registro.batch += 1;
      const { documents } = JSON.parse(opciones.body);
      return responde(documents.map((nombre) => {
        const ruta = nombre.slice(PREFIJO.length);
        return base[ruta] ? { found: { name: nombre, fields: base[ruta] } } : { missing: nombre };
      }));
    }
    registro.get += 1;
    const ruta = url.slice(URL_DOCUMENTOS.length + 1);
    if (!base[ruta]) return responde({ error: { status: 'NOT_FOUND', message: 'no' } }, false, 404);
    return responde({ name: PREFIJO + ruta, fields: base[ruta] });
  };
  return { fn, registro };
}

/* ── 1. helpers puros ── */
{
  comprueba('deFirestore: tipos', deFirestore({ integerValue: '3' }) === 3 && deFirestore({ doubleValue: 0.5 }) === 0.5 && deFirestore({ nullValue: null }) === null && deFirestore({ stringValue: 'a' }) === 'a');
  comprueba('deFirestore: mapa y lista anidados', JSON.stringify(deFirestore(mapa({ a: lista([n(1), s('b'), mapa({ c: nul() })]) }))) === '{"a":[1,"b",{"c":null}]}');
  comprueba('documentoAObjeto: sin name → null', documentoAObjeto({ fields: {} }) === null);
  comprueba('normaliza: sin acentos ni mayúsculas', normaliza('Telefónica  ') === 'telefonica');
  const items = deFirestore(base['catalog_chunks/000'].items);
  comprueba('buscaEnCatalogo: por nombre sin acentos', buscaEnCatalogo(items, 'telefonica').activos[0].asset_id === 'ES0178430E18');
  comprueba('buscaEnCatalogo: por ISIN y por ticker', buscaEnCatalogo(items, 'ie00b03hd191').total === 1 && buscaEnCatalogo(items, 'tef').activos[0].ticker === 'TEF');
  comprueba('buscaEnCatalogo: varias palabras (todas deben estar)', buscaEnCatalogo(items, 'core world').total === 1 && buscaEnCatalogo(items, 'core mundo').total === 0);
  comprueba('buscaEnCatalogo: filtro por tipo y límite', buscaEnCatalogo(items, 'i', { tipos: ['STOCK'] }).total === 1 && buscaEnCatalogo(items, 'i', { limite: 1 }).activos.length === 1 && buscaEnCatalogo(items, 'i').total === 3);
  comprueba('buscaEnCatalogo: consulta vacía → nada', buscaEnCatalogo(items, '  ').total === 0);

  const fondo = fichaParaModulos(deFirestore(mapa(base['assets/IE00B03HD191'])));
  comprueba('fichaParaModulos (fondo): identity y clase', fondo.identity.display_name.startsWith('Vanguard') && fondo.identity.currency === 'EUR' && fondo.economic_asset_class === 'EQUITY' && fondo.instrument_type === 'FUND');
  comprueba('fichaParaModulos (fondo): sin desglose → exposure_detail null, pms_exposure de la clase', fondo.exposure_detail === null && fondo.pms_exposure.equity === 1);
  comprueba('fichaParaModulos: sin fundamentales ni previsualización (no hay en la alfa)', fondo.fundamentals_summary === null && fondo.performance_preview === null);
  const etf = fichaParaModulos(deFirestore(mapa(base['assets/IE00B4L5Y983'])));
  comprueba('fichaParaModulos (ETF): exposure_detail con sectores y regiones, costes', etf.exposure_detail.sectors.technology === 25.1 && etf.exposure_detail.equity_regions.north_america === 75.5 && etf.pms_exposure.equity === 0.99 && etf.costs.ongoing_charge === 0.2);
  const mixto = fichaParaModulos({ asset_id: 'M', display_name: 'Mixto', currency: 'EUR', exposures: { source: 'csv-clase', asset_mix: null, regions: null, sectors: null } });
  comprueba('fichaParaModulos (mixto sin asset_mix): pms_exposure null, no 0', mixto.pms_exposure === null && mixto.exposure_detail === null);
  comprueba('fichaParaModulos: null → null', fichaParaModulos(null) === null);

  const por = {
    A: [{ date: '2026-01-01', value: 10 }, { date: '2026-01-02', value: 11 }, { date: '2026-01-03', value: 12 }, { date: '2026-01-04', value: 0 }],
    B: [{ date: '2026-01-02', value: 200 }, { date: '2026-01-03', value: 100 }, { date: '2026-01-05', value: 150 }],
    C: [],
  };
  const r = alineaYRebasa(por);
  comprueba('alineaYRebasa: intersección de fechas y rebase a 100', JSON.stringify(r.dates) === '["2026-01-02","2026-01-03"]' && r.series.find((x) => x.asset_id === 'A').values[1] === Number((100 * 12 / 11).toFixed(6)) && r.series.find((x) => x.asset_id === 'B').values[1] === 50);
  comprueba('alineaYRebasa: activo sin puntos queda fuera de series', !r.series.some((x) => x.asset_id === 'C') && r.series.length === 2);
  const tarde = alineaYRebasa({ A: por.A, D: [{ date: '2026-03-01', value: 1 }] }, { desde: '2026-01-01' });
  comprueba('alineaYRebasa: activo que empieza tarde no acorta la ventana de los demás (queda fuera)', tarde.series.length === 1 && tarde.dates.length === 3);
  comprueba('alineaYRebasa: vacío → vacío', alineaYRebasa({}).dates.length === 0);
  comprueba('aniosDeVentana: 3 años hasta hoy', JSON.stringify(aniosDeVentana('2026-09-02')) === '[2023,2024,2025,2026]');
}

/* ── 2. cliente contra la base falsa ── */
{
  const almacen = almacenFalso();
  almacen.setItem(CLAVE_SESION_ANTIGUA, '{"idToken":"viejo"}');
  const { fn, registro } = fetchFalso();
  const cliente = creaClienteMaestra({ fetchFn: fn, almacen, ahora: () => HOY });
  comprueba('Arranque: borra la clave de sesión del proyecto anterior', almacen.getItem(CLAVE_SESION_ANTIGUA) === null);
  comprueba('Sesión: sin cuentas, tipo «alfa» y nivel único', cliente.sesionActual().tipo === 'alfa' && cliente.nivelSesion() === NIVEL_ALFA && (await cliente.sesion()).tipo === 'alfa');

  const b1 = await cliente.buscaActivos('vanguard');
  comprueba('Búsqueda: carga manifiesto + trozo y devuelve {activos, total}', b1.activos.length === 1 && b1.total === 1 && b1.activos[0].asset_id === 'IE00B03HD191');
  const peticionesTrasCatalogo = registro.urls.length;
  await cliente.buscaActivos('telefonica');
  await cliente.buscaActivos('TEF');
  comprueba('Búsqueda: el catálogo se carga una sola vez; las búsquedas no vuelven a la red', registro.urls.length === peticionesTrasCatalogo);
  comprueba('Catálogo cacheado en el navegador por updated_at', JSON.parse(almacen.getItem(CLAVE_CATALOGO)).updated_at === '2026-09-02T10:00:00Z');
  const m = await cliente.manifiesto();
  comprueba('Manifiesto: fecha de los datos y total', m.prices_last_date === '2026-09-01' && m.total === 3);
  const en = await cliente.enCatalogo(['IE00B03HD191', 'XX0000000000']);
  comprueba('enCatalogo: presentes y ausentes', en.IE00B03HD191 === true && en.XX0000000000 === false);

  const ficha = await cliente.detalleActivo('IE00B03HD191');
  comprueba('detalleActivo: forma de los módulos', ficha.identity.display_name.startsWith('Vanguard') && ficha.exposure_detail === null);
  let noExiste = null;
  try { await cliente.detalleActivo('XX0000000000'); } catch (e) { noExiste = e; }
  comprueba('detalleActivo: activo fuera de la alfa → error NOT_FOUND, nunca un dato inventado', noExiste?.codigo === 'NOT_FOUND');

  const series = await cliente.llama('get_price_series', { asset_ids: ['IE00B03HD191', 'IE00B4L5Y983', 'ES0178430E18'], frequency: 'DAILY', window: '3Y' });
  comprueba('get_price_series: {dates, series} con los dos activos con historial; Telefónica fuera', series.series.length === 2 && !series.series.some((x) => x.asset_id === 'ES0178430E18') && series.dates[0] >= '2023-09-02');
  comprueba('get_price_series: rebasadas a 100 en la primera fecha común', series.series.every((x) => x.values[0] === 100) && series.dates.length === series.series[0].values.length);
  comprueba('Series: años cerrados en caché del navegador, el año en curso no', almacen.getItem(`${PREFIJO_SERIES}IE00B03HD191.2024`) !== null && almacen.getItem(`${PREFIJO_SERIES}IE00B03HD191.2026`) === null);
  const lotesAntes = registro.batch;
  await cliente.seriesRebasadas(['IE00B03HD191']);
  comprueba('Series: la segunda vez solo pide el año en curso por lote', registro.batch === lotesAntes + 1 && JSON.parse(JSON.stringify(registro.urls.at(-1))).endsWith(':batchGet'));

  const h = await cliente.llama('get_asset_holdings', { asset_id: 'IE00B4L5Y983' });
  comprueba('get_asset_holdings: documento con la forma corta', h.holdings[0].name === 'NVIDIA' && h.holdings[0].weight_pct === 5.2 && h.top10_weight === 21.5);
  const hf = await cliente.llama('get_asset_holdings', { asset_id: 'IE00B03HD191' });
  comprueba('get_asset_holdings: fondo sin desglose → null (sin error)', hf === null);
  const lote = await cliente.llama('get_asset_holdings_batch', { asset_ids: ['IE00B4L5Y983', 'IE00B03HD191'] });
  comprueba('get_asset_holdings_batch: {holdings: {id: doc|null}}', lote.holdings.IE00B4L5Y983.holdings.length === 1 && lote.holdings.IE00B03HD191 === null);
  const det = await cliente.llama('get_asset_detail', { asset_id: 'IE00B4L5Y983' });
  const bus = await cliente.llama('search_assets', { query: 'world', limit: 5 });
  comprueba('Fachada: get_asset_detail y search_assets con la forma antigua', det.identity.ticker === 'IWDA' && bus.assets.length === 1 && bus.total_matches === 1);

  let rechazo = null;
  try { await cliente.llama('save_portfolio', {}); } catch (e) { rechazo = e; }
  comprueba('Fachada: función desconocida → NO_DISPONIBLE_ALFA', rechazo?.codigo === 'NO_DISPONIBLE_ALFA');
  let nube = null;
  try { await cliente.listaCarterasNube(); } catch (e) { nube = e; }
  let cuenta = null;
  try { await cliente.creaCuenta('a@b.c', 'x'); } catch (e) { cuenta = e; }
  comprueba('Carteras en la nube y cuenta: no disponibles en la alfa', nube?.codigo === 'NO_DISPONIBLE_ALFA' && cuenta?.codigo === 'NO_DISPONIBLE_ALFA');

  comprueba('Red: todas las peticiones van a Firestore de nuvia-family-wealth', registro.urls.every((u) => u.startsWith(URL_DOCUMENTOS)) && URL_DOCUMENTOS.includes('nuvia-family-wealth'));
  comprueba('Red: ninguna cabecera Authorization', registro.cabeceras.every((c) => !('Authorization' in c) && !('authorization' in c)));
  comprueba('Red: nada hacia Auth, funciones en la nube ni la base profesional',
    !registro.urls.some((u) => /identitytoolkit|securetoken|cloudfunctions|bbdd-activos/.test(u)));
}

/* ── 3. sin almacén y con la base caída ── */
{
  const caido = async () => ({ ok: false, status: 503, json: async () => ({ error: { message: 'no' } }) });
  const cliente = creaClienteMaestra({ fetchFn: caido, almacen: null, ahora: () => HOY });
  let e1 = null;
  try { await cliente.buscaActivos('x'); } catch (e) { e1 = e; }
  comprueba('Base caída: la búsqueda lanza error con mensaje, no devuelve lista vacía', e1 && e1.message.length > 0);
  const { fn } = fetchFalso();
  const luego = creaClienteMaestra({ fetchFn: fn, almacen: null, ahora: () => HOY });
  const r = await luego.buscaActivos('tef');
  comprueba('Sin almacén: funciona igual, solo sin caché', r.activos.length === 1);
  const vacio = creaClienteMaestra({ fetchFn: async () => ({ ok: false, status: 404, json: async () => ({}) }), almacen: null, ahora: () => HOY });
  let sinCat = null;
  try { await vacio.buscaActivos('x'); } catch (e) { sinCat = e; }
  comprueba('Sin manifiesto publicado → SIN_CATALOGO', sinCat?.codigo === 'SIN_CATALOGO');
}

/* ── 4. helpers heredados ── */
comprueba('STOCK → Acción', etiquetaTipo('STOCK') === 'Acción');
comprueba('FUND → Fondo', etiquetaTipo('FUND') === 'Fondo');
comprueba('Tipo desconocido se muestra tal cual, no se inventa', etiquetaTipo('BOND') === 'BOND');
comprueba('Sin tipo → «—»', etiquetaTipo(null) === '—');
{
  const almacen = almacenFalso();
  comprueba('Sin marcador, nadie es suscriptor', leeSuscripcion(almacen, 'a@b.c') === false);
  almacen.setItem(CLAVE_SUSCRIPCION, JSON.stringify({ 'a@b.c': { activa: true } }));
  comprueba('Con marcador activo, la cuenta es suscriptora (correo normalizado)', leeSuscripcion(almacen, ' A@B.C ') === true);
  comprueba('esAdmin: el correo del administrador, normalizado', esAdmin(' OANTIZA@gmail.com ') === true && esAdmin('otro@x.y') === false);
}

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo en verde: base propia de la alfa, en abierto y sin cuentas (Entrega 2b).');
process.exit(fallos ? 1 : 0);

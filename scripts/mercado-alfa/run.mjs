#!/usr/bin/env node
/**
 * NUVIA · alfa · pipeline de datos de mercado propio.
 *
 *   node scripts/mercado-alfa/run.mjs descargar   [--solo-precios] [--desde 2021-01-01]
 *   node scripts/mercado-alfa/run.mjs proyectar
 *   node scripts/mercado-alfa/run.mjs publicar    [--dry-run] [--forzar] [--retirados]
 *   node scripts/mercado-alfa/run.mjs todo        [--solo-precios] [--dry-run]
 *
 * Entrada: universo/universo-alfa.csv (incluir=si). Salida: Firestore del
 * proyecto nuvia-family-wealth, y solo de ese proyecto.
 *
 * Clave de EODHD: variable de entorno EODHD_API_KEY. No se lee de ningún
 * fichero, no se escribe en ninguno y no se imprime.
 *
 * Carpeta de trabajo (ignorada por git): output/mercado-alfa/
 *   crudo/{symbol}.eod.json, .fundamentals.json, .search.json   caché cruda (fuente de verdad de los precios)
 *   publicable/assets/{id}.json, series/{id}/{año}.json, holdings/{id}.json, catalog/…
 *   informe-descarga.txt, resumen-proyeccion.json, resumen-publicacion.json
 *
 * Documentación: docs/INFORME_PARA_CODEX_BASE_DATOS_ALFA_20260902.md (§4–§7)
 * y docs/PENDIENTE_ALFA_NUVIA_20260902.md (§4).
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { leeCsv, validaUniverso, REFERENCIA_OBLIGATORIA } from './universo.mjs';
import { creaClienteEodhd, candidatoEnEuros } from './eodhd.mjs';
import { proyectaActivo, catalogo, fusionaEod, clavesProhibidasEn, SCHEMA_VERSION, diaIso } from './proyecta.mjs';
import { commitLotes, tokenGcloud, leeDocumento, listaIds, PROYECTO_ALFA } from './firestore-rest.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSV = join(RAIZ, 'universo', 'universo-alfa.csv');
const SALIDA = join(RAIZ, 'output', 'mercado-alfa');
const CRUDO = join(SALIDA, 'crudo');
const PUBLICABLE = join(SALIDA, 'publicable');
const DESDE_POR_DEFECTO = '2021-01-01';
const DIAS_REFRESCO = 12;

/* ───────────────────────── utilidades ───────────────────────── */

function parseArgs(argv) {
  const [orden, ...resto] = argv;
  const opciones = { soloPrecios: false, dryRun: false, forzar: false, retirados: false, desde: DESDE_POR_DEFECTO };
  for (let i = 0; i < resto.length; i += 1) {
    const a = resto[i];
    if (a === '--solo-precios') opciones.soloPrecios = true;
    else if (a === '--dry-run') opciones.dryRun = true;
    else if (a === '--forzar') opciones.forzar = true;
    else if (a === '--retirados') opciones.retirados = true;
    else if (a === '--desde') { opciones.desde = resto[i + 1]; i += 1; }
    else throw new Error(`Opción desconocida: ${a}`);
  }
  return { orden, opciones };
}

function leeJson(ruta, porDefecto = null) {
  if (!existsSync(ruta)) return porDefecto;
  try { return JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '')); } catch { return porDefecto; }
}

function escribeJson(ruta, objeto) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, `${JSON.stringify(objeto, null, 1)}\n`, 'utf8');
}

function seguro(symbol) {
  return String(symbol).replace(/[^A-Za-z0-9._-]/g, '_');
}

function universo() {
  if (!existsSync(CSV)) throw new Error(`No existe ${CSV}`);
  const { incluidas, errores, avisos } = validaUniverso(leeCsv(readFileSync(CSV, 'utf8')));
  if (errores.length) {
    console.error('El universo tiene errores; corrige el CSV antes de seguir:');
    for (const e of errores) console.error(`  · ${e}`);
    process.exit(2);
  }
  for (const a of avisos) console.warn(`aviso · ${a}`);
  return incluidas;
}

function hoyIso() { return diaIso(new Date()); }
function ahoraIso() { return new Date().toISOString(); }

function restaDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return diaIso(d);
}

/* ───────────────────────── descargar ───────────────────────── */

async function descargar({ soloPrecios, desde }) {
  const token = process.env.EODHD_API_KEY;
  if (!token) {
    console.error('Falta EODHD_API_KEY. En PowerShell: $env:EODHD_API_KEY = "…" (solo en la sesión), o como variable de usuario.');
    process.exit(2);
  }
  const eodhd = creaClienteEodhd({ token });
  const filas = universo();
  mkdirSync(CRUDO, { recursive: true });
  const informe = [];
  const linea = (t) => { informe.push(t); console.log(t); };
  linea(`NUVIA · alfa · descarga ${ahoraIso()} · ${filas.length} instrumentos · modo ${soloPrecios ? 'solo precios' : 'completo'}`);
  linea('');

  const fallidos = [];
  const propuestas = [];
  for (const f of filas) {
    const etiqueta = `${f.asset_id} ${f.instrument_type}`;
    try {
      if (!f.eodhd_symbol) {
        const busqueda = await eodhd.busca(f.asset_id);
        const { candidato, alternativas } = candidatoEnEuros(busqueda, { isin: f.asset_id, tipo: f.instrument_type });
        const texto = candidato
          ? `propuesta: ${candidato.symbol} (${candidato.name})`
          : `sin candidato claro; en EUR: ${alternativas.map((a) => a.symbol).join(', ') || 'ninguno'}`;
        propuestas.push(`${etiqueta} · sin símbolo · ${texto} · fija eodhd_symbol en el CSV`);
        continue;
      }
      const base = join(CRUDO, seguro(f.eodhd_symbol));
      const rutaEod = `${base}.eod.json`;
      const cacheado = leeJson(rutaEod, null);
      let desdeEfectivo = desde;
      if (soloPrecios && Array.isArray(cacheado) && cacheado.length) desdeEfectivo = restaDias(hoyIso(), DIAS_REFRESCO);
      const nuevo = await eodhd.precios(f.eodhd_symbol, desdeEfectivo);
      if (!Array.isArray(nuevo)) throw new Error('respuesta de precios no es una lista');
      const fusionado = soloPrecios && Array.isArray(cacheado) ? fusionaEod(cacheado, nuevo) : nuevo;
      escribeJson(rutaEod, fusionado);
      escribeJson(`${base}.meta.json`, { asset_id: f.asset_id, symbol: f.eodhd_symbol, fetched_at: ahoraIso(), from: desdeEfectivo, n: fusionado.length });

      if (f.instrument_type === 'ETF' || f.instrument_type === 'STOCK') {
        const rutaFund = `${base}.fundamentals.json`;
        if (!soloPrecios || !existsSync(rutaFund)) {
          const fund = await eodhd.fundamentales(f.eodhd_symbol);
          escribeJson(rutaFund, fund && typeof fund === 'object' ? fund : {});
        }
      } else {
        const rutaBusq = `${base}.search.json`;
        if (!existsSync(rutaBusq)) {
          const busqueda = await eodhd.busca(f.asset_id);
          escribeJson(rutaBusq, Array.isArray(busqueda) ? busqueda : []);
        }
      }
      const ultimo = fusionado.length ? fusionado[fusionado.length - 1].date : '—';
      linea(`ok   ${etiqueta} ${f.eodhd_symbol} · ${fusionado.length} puntos · último ${ultimo}`);
    } catch (e) {
      fallidos.push(`${etiqueta} ${f.eodhd_symbol || '(sin símbolo)'} · ${e.message}`);
      linea(`FALLO ${etiqueta} ${f.eodhd_symbol || ''} · ${e.message}`);
    }
  }
  linea('');
  linea(`Llamadas a EODHD contadas: ${eodhd.llamadas()}`);
  if (propuestas.length) { linea(''); linea('Símbolos por fijar en el CSV:'); propuestas.forEach((p) => linea(`  · ${p}`)); }
  if (fallidos.length) { linea(''); linea('Fallos:'); fallidos.forEach((p) => linea(`  · ${p}`)); }
  writeFileSync(join(SALIDA, 'informe-descarga.txt'), `${informe.join('\n')}\n`, 'utf8');
  console.log(`\nInforme: ${join(SALIDA, 'informe-descarga.txt')}`);
  return { fallidos, propuestas };
}

/* ───────────────────────── proyectar ───────────────────────── */

function proyectar() {
  const filas = universo();
  const updatedAt = ahoraIso();
  const assets = [];
  const resumen = { updated_at: updatedAt, schema_version: SCHEMA_VERSION, ok: [], excluidos: [], series: 0, holdings: 0 };
  mkdirSync(PUBLICABLE, { recursive: true });
  for (const f of filas) {
    if (!f.eodhd_symbol) { resumen.excluidos.push({ asset_id: f.asset_id, motivo: 'sin eodhd_symbol en el CSV' }); continue; }
    const base = join(CRUDO, seguro(f.eodhd_symbol));
    const eod = leeJson(`${base}.eod.json`, null);
    if (!eod) { resumen.excluidos.push({ asset_id: f.asset_id, motivo: 'sin descarga en la caché (ejecuta descargar)' }); continue; }
    const meta = leeJson(`${base}.meta.json`, {});
    const fundamentales = leeJson(`${base}.fundamentals.json`, null);
    const busqueda = leeJson(`${base}.search.json`, null);
    const r = proyectaActivo({ fila: f, eod, fundamentales, busqueda, fetchedAt: meta.fetched_at || updatedAt, updatedAt });
    if (!r.asset) { resumen.excluidos.push({ asset_id: f.asset_id, motivo: r.errores.join('; ') }); continue; }
    const prohibidas = clavesProhibidasEn({ asset: r.asset, holdings: r.holdings });
    if (prohibidas.length) { resumen.excluidos.push({ asset_id: f.asset_id, motivo: `claves prohibidas: ${prohibidas.join(', ')}` }); continue; }
    escribeJson(join(PUBLICABLE, 'assets', `${f.asset_id}.json`), r.asset);
    for (const s of r.series) escribeJson(join(PUBLICABLE, 'series', f.asset_id, `${s.year}.json`), s);
    if (r.holdings) escribeJson(join(PUBLICABLE, 'holdings', `${f.asset_id}.json`), r.holdings);
    resumen.series += r.series.length;
    if (r.holdings) resumen.holdings += 1;
    resumen.ok.push(f.asset_id);
    assets.push(r.asset);
  }
  const { chunks, manifest } = catalogo(assets, updatedAt);
  for (const c of chunks) escribeJson(join(PUBLICABLE, 'catalog', `chunk-${c.id}.json`), { items: c.items, n: c.n });
  escribeJson(join(PUBLICABLE, 'catalog', 'manifest.json'), manifest);
  resumen.chunks = chunks.length;
  escribeJson(join(SALIDA, 'resumen-proyeccion.json'), resumen);
  console.log(`Proyectados ${resumen.ok.length} activos · ${resumen.series} series · ${resumen.holdings} desgloses · ${chunks.length} trozo(s) de catálogo · datos hasta ${manifest.prices_last_date}`);
  if (resumen.excluidos.length) {
    const sinCache = resumen.excluidos.filter((e) => e.motivo.startsWith('sin descarga'));
    if (sinCache.length) console.log(`Sin descarga en la caché: ${sinCache.length} (ejecuta descargar)`);
    const resto = resumen.excluidos.filter((e) => !e.motivo.startsWith('sin descarga'));
    if (resto.length) {
      console.log('Excluidos:');
      for (const e of resto) console.log(`  · ${e.asset_id}: ${e.motivo}`);
    }
  }
  return resumen;
}

/* ───────────────────────── publicar ───────────────────────── */

function cargaPublicable() {
  const docs = { assets: [], series: [], holdings: [], chunks: [], manifest: null };
  const dirAssets = join(PUBLICABLE, 'assets');
  if (!existsSync(dirAssets)) throw new Error('No hay nada publicable: ejecuta proyectar');
  for (const fich of readdirSync(dirAssets)) {
    const asset = leeJson(join(dirAssets, fich));
    docs.assets.push({ ruta: `assets/${asset.asset_id}`, objeto: asset });
    const dirSeries = join(PUBLICABLE, 'series', asset.asset_id);
    if (existsSync(dirSeries)) {
      for (const s of readdirSync(dirSeries)) {
        const serie = leeJson(join(dirSeries, s));
        docs.series.push({ ruta: `assets/${asset.asset_id}/series/${serie.year}`, objeto: serie });
      }
    }
    const rutaH = join(PUBLICABLE, 'holdings', `${asset.asset_id}.json`);
    if (existsSync(rutaH)) docs.holdings.push({ ruta: `assets/${asset.asset_id}/holdings/latest`, objeto: leeJson(rutaH) });
  }
  const dirCat = join(PUBLICABLE, 'catalog');
  for (const fich of readdirSync(dirCat)) {
    if (fich === 'manifest.json') docs.manifest = leeJson(join(dirCat, fich));
    else docs.chunks.push({ ruta: `catalog_chunks/${fich.replace('chunk-', '').replace('.json', '')}`, objeto: leeJson(join(dirCat, fich)) });
  }
  if (!docs.manifest) throw new Error('Falta catalog/manifest.json');
  return docs;
}

async function publicar({ dryRun, forzar, retirados }) {
  const docs = cargaPublicable();
  const resumenProy = leeJson(join(SALIDA, 'resumen-proyeccion.json'), {});
  const ids = new Set(docs.assets.map((d) => d.objeto.asset_id));
  for (const ref of REFERENCIA_OBLIGATORIA) {
    if (!ids.has(ref)) throw new Error(`Falta el instrumento de referencia ${ref} en lo publicable; no se publica.`);
  }
  for (const d of [...docs.assets, ...docs.holdings]) {
    const malas = clavesProhibidasEn(d.objeto);
    if (malas.length) throw new Error(`${d.ruta} contiene claves prohibidas: ${malas.join(', ')}`);
    if (d.objeto.currency && d.objeto.currency !== 'EUR') throw new Error(`${d.ruta} no está en EUR`);
  }
  if (docs.manifest.total !== docs.assets.length) throw new Error(`El manifiesto dice ${docs.manifest.total} activos y hay ${docs.assets.length}`);

  const total = docs.assets.length + docs.series.length + docs.holdings.length + docs.chunks.length + 1;
  console.log(`Proyecto: ${PROYECTO_ALFA} · ${docs.assets.length} activos · ${docs.series.length} series · ${docs.holdings.length} desgloses · ${docs.chunks.length} trozos · 1 manifiesto = ${total} escrituras${dryRun ? ' (dry-run: no se escribe nada)' : ''}`);

  const token = dryRun ? null : tokenGcloud();
  const fecha = hoyIso();
  const rutaRun = `sync_runs/${fecha}`;

  if (!dryRun) {
    const previo = await leeDocumento(rutaRun, { token });
    if (previo?.status === 'en_curso' && !forzar) {
      const hace = (Date.now() - Date.parse(previo.started_at || 0)) / 60_000;
      if (hace < 60) throw new Error(`Hay una publicación en curso desde hace ${Math.round(hace)} min (${rutaRun}). Usa --forzar si sabes que no es así.`);
    }
    if (retirados) {
      const enBase = await listaIds('assets', { token });
      const fuera = enBase.map((d) => d._id).filter((id) => !ids.has(id));
      console.log(fuera.length ? `En Firestore y no en el CSV (no se borran): ${fuera.join(', ')}` : 'Ningún activo retirado.');
    }
  }

  const runInicio = { status: 'en_curso', started_at: ahoraIso(), finished_at: null, assets_ok: docs.assets.length, assets_failed: resumenProy.excluidos || [], series_written: 0, holdings_written: 0, prices_last_date_min: docs.manifest.prices_last_date_min, prices_last_date_max: docs.manifest.prices_last_date, api_calls: null, schema_version: SCHEMA_VERSION };
  const informa = (n, de) => { if (n % 1000 === 0 || n === de) console.log(`  ${n}/${de}`); };
  let escritos = 0;
  try {
    if (!dryRun) await commitLotes([{ ruta: rutaRun, objeto: runInicio }], { token });
    const r1 = await commitLotes(docs.assets, { token, dryRun, informa }); escritos += r1.escritos;
    const r2 = await commitLotes(docs.series, { token, dryRun, informa }); escritos += r2.escritos;
    const r3 = await commitLotes(docs.holdings, { token, dryRun, informa }); escritos += r3.escritos;
    const r4 = await commitLotes(docs.chunks, { token, dryRun, informa }); escritos += r4.escritos;
    const esperado = docs.assets.length + docs.series.length + docs.holdings.length + docs.chunks.length;
    if (escritos !== esperado) throw new Error(`Recuento: ${escritos} escritos frente a ${esperado} esperados; el manifiesto NO se actualiza`);
    // El manifiesto va el último y solo si todo lo anterior ha cuadrado.
    const r5 = await commitLotes([{ ruta: 'catalog_manifest/public', objeto: docs.manifest }], { token, dryRun }); escritos += r5.escritos;
    const runFin = { ...runInicio, status: 'ok', finished_at: ahoraIso(), series_written: docs.series.length, holdings_written: docs.holdings.length };
    if (!dryRun) await commitLotes([{ ruta: rutaRun, objeto: runFin }], { token });
    escribeJson(join(SALIDA, 'resumen-publicacion.json'), { ...runFin, dry_run: dryRun, escritos });
    console.log(`${dryRun ? 'Dry-run' : 'Publicación'} correcta: ${escritos} escrituras · manifiesto ${docs.manifest.updated_at} · datos hasta ${docs.manifest.prices_last_date}`);
  } catch (e) {
    if (!dryRun) {
      const runFallo = { ...runInicio, status: 'fallida', finished_at: ahoraIso(), error: String(e.message).slice(0, 500) };
      try { await commitLotes([{ ruta: rutaRun, objeto: runFallo }], { token }); } catch { /* el error original manda */ }
    }
    throw e;
  }
}

/* ───────────────────────── principal ───────────────────────── */

async function main() {
  const { orden, opciones } = parseArgs(process.argv.slice(2));
  switch (orden) {
    case 'descargar': await descargar(opciones); break;
    case 'proyectar': proyectar(); break;
    case 'publicar': await publicar(opciones); break;
    case 'todo': {
      const { fallidos } = await descargar(opciones);
      if (fallidos.length) console.warn(`Aviso: ${fallidos.length} descarga(s) fallida(s); se proyecta lo que hay en caché.`);
      proyectar();
      await publicar(opciones);
      break;
    }
    default:
      console.error('Uso: node scripts/mercado-alfa/run.mjs descargar|proyectar|publicar|todo [--solo-precios] [--dry-run] [--forzar] [--retirados] [--desde AAAA-MM-DD]');
      process.exit(1);
  }
}

main().catch((e) => { console.error(`Error: ${e.message}`); process.exit(1); });

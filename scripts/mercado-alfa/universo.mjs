/**
 * NUVIA · alfa · lectura y validación del universo (`universo/universo-alfa.csv`).
 *
 * Funciones puras, sin red ni disco. La batería está en
 * docs/nuvia-mercado-alfa.test.mjs.
 */

export const COLUMNAS = ['asset_id', 'eodhd_symbol', 'instrument_type', 'clase', 'grupo', 'nombre', 'divisa', 'incluir'];
export const TIPOS = ['FUND', 'ETF', 'STOCK'];
export const CLASES = ['EQUITY', 'FIXED_INCOME', 'MIXED', 'MONEY_MARKET', 'OTHER'];
export const DIVISA_ALFA = 'EUR';

/** Los cuatro instrumentos que el laboratorio usa como referencia (nuvia-constructor.js, ACTIVOS_BENCHMARK). */
export const REFERENCIA_OBLIGATORIA = ['IE00B03HD191', 'IE00BYX5NX33', 'LU0113257694', 'LU0132601682'];

/** Orden de presentación del catálogo por grupo: referencia, fondos, ETF, acciones. Nunca por mérito. */
export const ORDEN_GRUPOS = [
  'referencia-bolsa', 'referencia-bonos',
  'fondos-bolsa', 'fondos-bonos', 'fondos-mixtos', 'fondos-monetarios', 'fondos-otros',
  'etf', 'acciones',
];

/**
 * Lee un CSV sencillo con comillas dobles opcionales. Tolera BOM, `\r\n` y
 * líneas vacías. Devuelve objetos con las claves de la cabecera.
 */
export function leeCsv(texto) {
  const limpio = String(texto || '').replace(/^\uFEFF/, '');
  const lineas = limpio.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lineas.length) return { cabecera: [], filas: [] };
  const cabecera = separaCampos(lineas[0]).map((c) => c.trim());
  const filas = lineas.slice(1).map((linea, i) => {
    const campos = separaCampos(linea);
    const fila = { _linea: i + 2 };
    cabecera.forEach((col, j) => { fila[col] = (campos[j] ?? '').trim(); });
    return fila;
  });
  return { cabecera, filas };
}

function separaCampos(linea) {
  const campos = [];
  let actual = '';
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i += 1; }
      else if (c === '"') entreComillas = false;
      else actual += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') { campos.push(actual); actual = ''; }
    else actual += c;
  }
  campos.push(actual);
  return campos;
}

/**
 * Valida el universo y separa las líneas incluidas.
 * @returns {{incluidas: Array<Object>, errores: string[], avisos: string[]}}
 */
export function validaUniverso({ cabecera, filas }) {
  const errores = [];
  const avisos = [];
  for (const col of COLUMNAS) {
    if (!cabecera.includes(col)) errores.push(`Falta la columna «${col}» en la cabecera.`);
  }
  if (errores.length) return { incluidas: [], errores, avisos };

  const vistos = new Map();
  const incluidas = [];
  for (const f of filas) {
    const id = f.asset_id;
    if (!id) { errores.push(`Línea ${f._linea}: sin asset_id.`); continue; }
    if (vistos.has(id)) errores.push(`Línea ${f._linea}: asset_id repetido (${id}, ya en la línea ${vistos.get(id)}).`);
    vistos.set(id, f._linea);
    if (f.incluir !== 'si') continue;
    if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(id)) errores.push(`Línea ${f._linea}: «${id}» no tiene forma de ISIN.`);
    if (!TIPOS.includes(f.instrument_type)) errores.push(`Línea ${f._linea}: instrument_type «${f.instrument_type}» no válido.`);
    if (f.clase && !CLASES.includes(f.clase)) errores.push(`Línea ${f._linea}: clase «${f.clase}» no válida.`);
    if (f.instrument_type === 'FUND' && !f.clase) errores.push(`Línea ${f._linea}: los fondos necesitan «clase» (EODHD no da ficha de fondos europeos).`);
    if (!f.nombre) errores.push(`Línea ${f._linea}: sin nombre.`);
    if (f.divisa !== DIVISA_ALFA) errores.push(`Línea ${f._linea}: divisa «${f.divisa}» distinta de ${DIVISA_ALFA}; la alfa es solo en euros.`);
    if (!f.eodhd_symbol) avisos.push(`Línea ${f._linea}: ${id} sin eodhd_symbol; «descargar» propondrá uno y no lo publicará hasta que se fije en el CSV.`);
    incluidas.push(f);
  }
  for (const ref of REFERENCIA_OBLIGATORIA) {
    if (!incluidas.some((f) => f.asset_id === ref)) errores.push(`Falta el instrumento de referencia ${ref} (obligatorio, incluir=si).`);
  }
  return { incluidas, errores, avisos };
}

/** Clave de orden del catálogo: grupo (según ORDEN_GRUPOS) y nombre, sin acentos. */
export function claveOrden(fila) {
  const g = ORDEN_GRUPOS.indexOf(fila.grupo);
  const pos = g === -1 ? ORDEN_GRUPOS.length : g;
  return `${String(pos).padStart(2, '0')}|${sinAcentos(fila.display_name || fila.nombre || '')}`;
}

export function sinAcentos(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

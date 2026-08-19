/**
 * Solapamiento y look-through de cartera · NUVIA
 * ---------------------------------------------------------------------------
 * Portado de la plataforma OAA (oantiza/BDB-ACTIVOS):
 *   src/core/overlap.ts · src/core/holdingsLookthrough.ts
 * Guía de implementación, paso 13. El solapamiento es prioritario: es lo que
 * el usuario no ve en ningún otro sitio (bases, sección 6).
 *
 * Diferencias respecto al original, documentadas (bases, sección 4):
 *   - Sin TypeScript ni promesas: las carteras de cada fondo llegan YA
 *     descargadas (de `get_asset_holdings`); este módulo no toca la red.
 *     El original resolvía la carga (individual o en lote) dentro del
 *     look-through; aquí esa responsabilidad queda fuera, en la capa de datos.
 *   - `matrizSolapamiento()` es añadido propio del portal: el original
 *     calcula un par; el portal enseña todos los pares de la cartera.
 *   - El nº de posiciones comunes y de filas del look-through son parámetros
 *     (el original fija 3 y 25); los valores por defecto son los del original.
 *
 * Forma de los datos — la misma que sirve `get_asset_holdings`:
 *   cartera de un fondo:  { holdings: [{ name, isin?, ticker?, weight_pct }] }
 * Los cálculos son idénticos al original:
 *   solapamiento(A, B) = Σ_k min(w_Ak, w_Bk), con pesos normalizados a 100.
 *   look-through: peso del fondo × peso de la posición dentro del fondo.
 */

/**
 * Normaliza un nombre para casar posiciones sin ISIN.
 * Copiado literal de normalizeHoldingName(): sin acentos, solo letras y
 * números, minúsculas es-ES. «Telefónica, S.A.» y «TELEFONICA S.A.» casan;
 * grafías con distinta separación («SA» frente a «S.A.») no casan — igual
 * que en el original: el casado fiable es por ISIN, el nombre es el respaldo.
 */
export function normalizaNombre(valor) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('es-ES');
}

/** Clave de casado de una posición: el ISIN si lo hay; si no, el nombre normalizado. */
function claveDePosicion(posicion) {
  const isin = posicion.isin?.trim().toUpperCase();
  if (isin) return `isin:${isin}`;
  const nombre = normalizaNombre(posicion.name);
  return nombre ? `name:${nombre}` : null;
}

/** Identificador visible de una posición, para las filas del look-through. */
function identificadorDe(posicion) {
  return posicion.isin?.trim().toUpperCase() || posicion.ticker?.trim().toUpperCase() || undefined;
}

/** Agrega las posiciones de un fondo por clave, con pesos normalizados a 100. */
function mapaNormalizado(cartera) {
  const posiciones = cartera?.holdings ?? [];
  const suma = posiciones.reduce((s, h) => s + Math.max(0, h.weight_pct), 0);
  if (suma === 0) return null;
  const mapa = new Map();
  for (const h of posiciones) {
    const clave = claveDePosicion(h);
    if (!clave) continue;
    const peso = (Math.max(0, h.weight_pct) / suma) * 100;
    const existente = mapa.get(clave);
    if (existente) existente.peso += peso;
    else mapa.set(clave, { peso, nombre: h.name });
  }
  return mapa;
}

/**
 * Solapamiento entre dos fondos a partir de sus carteras.
 * Portado literal de calculateOverlap():
 *   solapamiento = Σ_k min(w_Ak, w_Bk)  ·  pesos normalizados a 100
 *
 * @param {{holdings:Array}|null} carteraA  desglose del fondo A
 * @param {{holdings:Array}|null} carteraB  desglose del fondo B
 * @param {{topComunes?:number}} [opciones]  nº de posiciones comunes a devolver (3 en el original)
 * @returns {{porcentaje:number, comunes:Array<{nombre:string, peso:number}>}}
 *   `porcentaje` en 0–100. Dos ETF del mismo índice → cerca de 100;
 *   dos fondos sin nada en común → 0.
 */
export function solapamiento(carteraA, carteraB, { topComunes = 3 } = {}) {
  const mapaA = mapaNormalizado(carteraA);
  const mapaB = mapaNormalizado(carteraB);
  if (!mapaA || !mapaB) return { porcentaje: 0, comunes: [] };

  let porcentaje = 0;
  const comunes = [];
  for (const [clave, valA] of mapaA.entries()) {
    const valB = mapaB.get(clave);
    if (!valB) continue;
    const minimo = Math.min(valA.peso, valB.peso);
    porcentaje += minimo;
    comunes.push({ nombre: valA.nombre, peso: minimo });
  }
  comunes.sort((a, b) => b.peso - a.peso);
  return { porcentaje, comunes: comunes.slice(0, topComunes) };
}

/**
 * Solapamiento de todos los pares de una lista de fondos — añadido del portal.
 *
 * @param {Array<{id:string, cartera:{holdings:Array}|null}>} fondos
 * @returns {{ids:string[], porcentaje:Object, comunes:Object, sinDatos:string[]}}
 *   `porcentaje[a][b]` en 0–100 (diagonal = 100 si el fondo tiene desglose).
 *   `sinDatos` lista los fondos sin desglose: sus pares no aparecen en la
 *   matriz — nunca se inventa un solapamiento (mismo criterio que las
 *   correlaciones, paso 12).
 */
export function matrizSolapamiento(fondos) {
  const limpios = (fondos || []).filter((f) => f && f.id);
  const ids = limpios.map((f) => f.id);
  const porcentaje = {};
  const comunes = {};
  const sinDatos = limpios
    .filter((f) => !mapaNormalizado(f.cartera))
    .map((f) => f.id);
  const conDatos = limpios.filter((f) => !sinDatos.includes(f.id));

  for (const f of conDatos) { porcentaje[f.id] = {}; comunes[f.id] = {}; }
  for (let i = 0; i < conDatos.length; i += 1) {
    for (let j = i; j < conDatos.length; j += 1) {
      const a = conDatos[i];
      const b = conDatos[j];
      if (i === j) { porcentaje[a.id][a.id] = 100; continue; }
      const r = solapamiento(a.cartera, b.cartera);
      const pct = Number(r.porcentaje.toFixed(2));
      porcentaje[a.id][b.id] = pct;
      porcentaje[b.id][a.id] = pct;
      comunes[a.id][b.id] = r.comunes;
      comunes[b.id][a.id] = r.comunes;
    }
  }
  return { ids, porcentaje, comunes, sinDatos };
}

/**
 * Look-through de la cartera: qué tiene el usuario DE VERDAD, agregando las
 * posiciones de cada fondo ponderadas por el peso del fondo en su cartera.
 * Portado de buildPortfolioLookThrough(), sin la capa de carga.
 *
 * @param {Array<{id:string, nombre?:string, peso:number, cartera:{holdings:Array}|null}>} posiciones
 *   `peso` en % sobre la cartera del usuario. `cartera` con el desglose del
 *   fondo, o null si no está disponible. Pasar aquí las posiciones que son
 *   fondos/ETF; una acción directa no tiene desglose y la capa que llama
 *   decide cómo presentarla (en paso 14 se consolida con estas filas).
 * @param {{maxFilas?:number}} [opciones]  nº de filas devueltas (25 en el original)
 * @returns {{
 *   filas: Array<{clave:string, nombre:string, identificador?:string, peso:number, enFondos:number, desdeFondos:string[]}>,
 *   pesoCubierto:number, fondosCubiertos:number, fondosElegibles:number, avisos:string[]
 * }}
 *   `pesoCubierto` dice qué parte de la cartera del usuario está desglosada:
 *   la diferencia hasta 100 NO está mirada por dentro y hay que decirlo en la
 *   interfaz — nunca presentar un look-through parcial como total.
 */
export function lookThroughCartera(posiciones, { maxFilas = 25 } = {}) {
  const avisos = [];
  const agregado = new Map();
  let pesoCubierto = 0;
  let fondosCubiertos = 0;

  const elegibles = (posiciones || []).filter(
    (p) => p && p.id && Number.isFinite(p.peso) && p.peso > 0
  );

  for (const p of elegibles) {
    const filasFondo = p.cartera?.holdings?.filter((h) => h.weight_pct > 0) ?? [];
    if (!p.cartera || filasFondo.length === 0) {
      avisos.push(`${p.nombre ?? p.id}: sin desglose disponible.`);
      continue;
    }
    pesoCubierto += p.peso;
    fondosCubiertos += 1;

    for (const h of filasFondo) {
      const clave = claveDePosicion(h);
      if (!clave) continue;
      const contribucion = (p.peso * h.weight_pct) / 100;
      if (!Number.isFinite(contribucion) || contribucion <= 0) continue;
      const existente = agregado.get(clave);
      if (existente) {
        existente.peso += contribucion;
        existente.desdeFondos.add(p.id);
        if (!existente.identificador) existente.identificador = identificadorDe(h);
        continue;
      }
      agregado.set(clave, {
        nombre: h.name,
        identificador: identificadorDe(h),
        peso: contribucion,
        desdeFondos: new Set([p.id]),
      });
    }
  }

  const filas = Array.from(agregado.entries())
    .map(([clave, fila]) => ({
      clave,
      nombre: fila.nombre,
      identificador: fila.identificador,
      peso: Number(fila.peso.toFixed(4)),
      enFondos: fila.desdeFondos.size,
      desdeFondos: Array.from(fila.desdeFondos).sort(),
    }))
    .sort((a, b) => b.peso - a.peso || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, maxFilas);

  return {
    filas,
    pesoCubierto: Number(pesoCubierto.toFixed(4)),
    fondosCubiertos,
    fondosElegibles: elegibles.length,
    avisos,
  };
}

/**
 * Concentración sectorial y geográfica · NUVIA
 * ---------------------------------------------------------------------------
 * Portado de la plataforma OAA (oantiza/BDB-ACTIVOS):
 *   src/core/equitySectors.ts · src/core/equityRegions.ts
 * Guía de implementación, paso 14.
 *
 * Cómo funciona, igual que en la plataforma: cada activo trae de la maestra
 * (vía `get_asset_detail`) sus distribuciones ya calculadas —
 * `exposure_detail.sectors` y `exposure_detail.equity_regions` — y su
 * exposición a renta variable (`pms_exposure.equity`, 0–1). La concentración
 * de la cartera es la suma de esas distribuciones ponderadas por
 * peso × exposición RV. Así un fondo global no cuenta como «internacional»:
 * cuentan sus posiciones repartidas (look-through).
 *
 * Cuando un activo no trae distribución, la plataforma ESTIMA por heurística
 * (categoría/nombre para el sector; región declarada o divisa para la
 * geografía) y lo declara en `calidad` y `pesoEstimado`. Se porta tal cual:
 * la interfaz debe enseñar esa calidad — un dato estimado nunca se presenta
 * como look-through real (bases, sección 2: los supuestos, visibles).
 *
 * Se mantienen los nombres de campo de la maestra (asset_id, weight_percent,
 * pms_exposure, exposure_detail…) para que las respuestas de las Cloud
 * Functions pasen directas, sin capa de traducción.
 *
 * Alfa (02-09-2026, base propia): cuando el activo trae `exposure_detail`
 * o `pms_exposure` como `null` EXPLÍCITO, significa «sin datos» y NO se
 * estima nada: su peso va a `pesoSinDatos` y se declara. Esto incluye el null
 * de cada dimensión (sectors / equity_regions), independientemente de la otra.
 * Con `undefined` o
 * `{}` se conserva el comportamiento anterior (estimación declarada).
 *
 * Todo son funciones puras: sin red, sin backend, sin estado.
 */

/** Normalización de texto para las heurísticas (igual que la plataforma). */
const normTexto = (valor) => (valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const normClave = (valor) => normTexto(valor)
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

/** Suma una distribución {clave: peso} al acumulador, normalizada y ponderada. */
function agregaDistribucion(acumulador, pesoBase, distribucion) {
  const suma = Object.values(distribucion).reduce((x, y) => x + (y || 0), 0);
  if (suma <= 0) return;
  for (const [clave, valor] of Object.entries(distribucion)) {
    if ((valor || 0) <= 0) continue;
    acumulador.set(clave, (acumulador.get(clave) || 0) + pesoBase * (valor / suma));
  }
}

/**
 * Sector estimado de un activo SIN distribución propia, por su texto
 * descriptivo. Copiado literal de classifyEquitySector(): es un respaldo
 * declarado, no un cálculo — de ahí la calidad «estimated».
 */
export function clasificaSectorEstimado(activo) {
  const texto = normTexto([activo.category, activo.display_name, activo.provider, activo.economic_asset_class]
    .filter(Boolean).join(' '));
  if (/microsoft|apple|nvidia|asml|semiconductor|technology|tech|software|digital|robot|ai\b/.test(texto)) return 'technology';
  if (/alphabet|google|meta|netflix|communication|telecom|media/.test(texto)) return 'communication_services';
  if (/health|salud|pharma|biotech|medical/.test(texto)) return 'healthcare';
  if (/financial|financier|bank|insurance|seguro/.test(texto)) return 'financial_services';
  if (/consumer defensive|staples|aliment|food|beverage|defensivo/.test(texto)) return 'consumer_defensive';
  if (/amazon|tesla|lvmh|consumer cyclical|discretionary|luxury|retail|ciclico/.test(texto)) return 'consumer_cyclical';
  if (/energy|energia|oil|gas/.test(texto)) return 'energy';
  if (/water|utilities|utility|infrastructure|infraestructura/.test(texto)) return 'utilities';
  if (/industrial|industrials/.test(texto)) return 'industrials';
  if (/material|materials|mining|basic/.test(texto)) return 'basic_materials';
  if (/real estate|reit|inmobili/.test(texto)) return 'real_estate';
  if (/msci|world|ucits|mixed|balanced|allocation|global|broad|index|market|multi/.test(texto)) return 'multi_sector';
  return null;
}

/** Región estimada por divisa, cuando no hay nada mejor (regionFromCurrency). */
function regionPorDivisa(divisa) {
  const c = (divisa || '').toUpperCase();
  if (c === 'USD') return { united_states: 100 };
  if (c === 'CAD') return { canada: 100 };
  if (c === 'GBP') return { united_kingdom: 100 };
  if (c === 'JPY') return { japan: 100 };
  if (['CHF', 'DKK', 'NOK', 'SEK'].includes(c)) return { europe_ex_euro: 100 };
  if (['AUD', 'NZD'].includes(c)) return { australasia: 100 };
  if (c === 'EUR') return { eurozone: 100 };
  return null;
}

/** Distribución regional estimada de un activo sin datos (estimatedRegionDist). */
export function distribucionRegionalEstimada(activo) {
  const r = normClave(activo.region || '');
  if (r) {
    if (['united_states', 'usa', 'us', 'north_america'].includes(r)) return { united_states: 100 };
    if (r.includes('canada')) return { canada: 100 };
    if (r.includes('latin') || r.includes('south_america') || r.includes('ibero')) return { latin_america: 100 };
    if (r.includes('united_kingdom') || r === 'uk') return { united_kingdom: 100 };
    if (r.includes('europe') || r.includes('europa')) return { eurozone: 78, europe_ex_euro: 22 };
    if (r.includes('japan') || r.includes('japon')) return { japan: 100 };
    if (r.includes('emerging')) return { asia_emerging: 58, latin_america: 25, africa_middle_east: 17 };
    if (r.includes('asia')) return { asia_developed: 45, asia_emerging: 45, japan: 10 };
    if (r.includes('global') || r.includes('world')) {
      return { united_states: 55, eurozone: 20, europe_ex_euro: 8, japan: 6, asia_developed: 5, asia_emerging: 6 };
    }
  }
  return regionPorDivisa(activo.currency);
}

/**
 * Motor común de agregación, idéntico en sectores y regiones:
 * peso de cartera × exposición a RV × distribución del activo.
 */
function agregaConcentracion(posiciones, activos, eligeDistribucion, eligeEstimada) {
  const porId = new Map((activos || []).map((a) => [a.asset_id, a]));
  const acumulador = new Map();
  let pesoTotal = 0;
  let pesoLookthrough = 0;
  let pesoEstimado = 0;
  let pesoSinDatos = 0;
  let pesoCartera = 0;

  for (const posicion of posiciones || []) {
    const peso = posicion.weight_percent || 0;
    const activo = porId.get(posicion.asset_id);
    if (peso <= 0 || !activo) continue;
    pesoCartera += peso;
    // Exposición conocida de 0 % RV: no necesita desglose de renta variable.
    if (activo.pms_exposure?.equity === 0) continue;
    const distribucion = eligeDistribucion(activo);
    /* null explícito, también por dimensión: ni se estima ni cuenta como 0 % RV. */
    if (activo.pms_exposure === null || activo.exposure_detail === null || distribucion === null) {
      pesoSinDatos += peso;
      continue;
    }
    const pesoRV = peso * (activo.pms_exposure?.equity || 0);
    if (pesoRV <= 0) continue;
    const suma = distribucion ? Object.values(distribucion).reduce((x, y) => x + (y || 0), 0) : 0;
    pesoTotal += pesoRV;
    if (distribucion && suma > 0) {
      agregaDistribucion(acumulador, pesoRV, distribucion);
      pesoLookthrough += pesoRV;
      continue;
    }
    const estimada = eligeEstimada(activo);
    if (estimada) {
      agregaDistribucion(acumulador, pesoRV, estimada);
      pesoEstimado += pesoRV;
    }
  }

  const sinDatos = pesoCartera > 0 ? (pesoSinDatos / pesoCartera) * 100 : 0;
  if (pesoTotal <= 0) return { filas: [], calidad: 'none', pesoEstimado: 0, pesoSinDatos: sinDatos };
  const filas = Array.from(acumulador.entries())
    .map(([clave, valor]) => ({ clave, peso: (valor / pesoTotal) * 100 }))
    .filter((fila) => fila.peso > 0.05)
    .sort((a, b) => b.peso - a.peso);
  const calidad = filas.length === 0 ? 'none'
    : pesoEstimado <= 0 ? 'lookthrough'
      : pesoLookthrough <= 0 ? 'estimated' : 'mixed';
  return { filas, calidad, pesoEstimado: (pesoEstimado / pesoTotal) * 100, pesoSinDatos: sinDatos };
}

/**
 * Concentración sectorial de la renta variable de la cartera.
 * Portado de computeEquitySectorAllocation().
 *
 * @param {Array<{asset_id:string, weight_percent:number}>} posiciones
 * @param {Array<Object>} activos  detalles de `get_asset_detail`, con
 *   `pms_exposure.equity` (0–1) y `exposure_detail.sectors` ({clave: peso})
 * @returns {{filas:Array<{clave:string, peso:number}>, calidad:string, pesoEstimado:number}}
 *   `filas` en % sobre la renta variable de la cartera, de mayor a menor.
 *   `calidad`: 'lookthrough' | 'mixed' | 'estimated' | 'none'.
 *   `pesoEstimado`: % del peso RV cubierto por heurística, para declararlo.
 */
export function concentracionSectorial(posiciones, activos) {
  return agregaConcentracion(
    posiciones,
    activos,
    (a) => a.exposure_detail?.sectors,
    (a) => {
      const sector = clasificaSectorEstimado(a);
      return sector ? { [sector]: 100 } : null;
    }
  );
}

/**
 * Concentración geográfica de la renta variable de la cartera.
 * Portado de computeEquityRegionAllocation().
 * Misma salida que concentracionSectorial(), con claves de región.
 */
export function concentracionGeografica(posiciones, activos) {
  return agregaConcentracion(
    posiciones,
    activos,
    (a) => a.exposure_detail?.equity_regions,
    distribucionRegionalEstimada
  );
}

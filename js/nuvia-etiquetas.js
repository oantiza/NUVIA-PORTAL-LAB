/**
 * NUVIA — etiquetas y escalas de los gráficos del laboratorio (Fase 7).
 *
 * Bases §4: «cero jerga sin traducir» y «un gráfico enseña una idea». Este
 * módulo reúne lo que necesitan los gráficos rediseñados para ser legibles
 * por cualquiera: los sectores y regiones de la base de datos NUVIA dichos
 * en castellano, los nombres largos de los fondos acortados sin perder la
 * identidad, y unas marcas de eje redondas en lugar de solo el mínimo y el
 * máximo. Todo puro y probado; sin DOM y sin red.
 */

/** Sectores tal y como los sirve la base, en castellano. */
export const SECTORES_ES = {
  basic_materials: 'Materiales básicos',
  communication_services: 'Comunicaciones',
  consumer_cyclical: 'Consumo cíclico',
  consumer_defensive: 'Consumo básico',
  energy: 'Energía',
  financial_services: 'Servicios financieros',
  financial: 'Servicios financieros',
  healthcare: 'Salud',
  industrials: 'Industria',
  real_estate: 'Inmobiliario',
  technology: 'Tecnología',
  utilities: 'Suministros (luz, agua, gas)',
};

/** Regiones de los desgloses, en castellano. */
export const REGIONES_ES = {
  united_states: 'Estados Unidos',
  canada: 'Canadá',
  north_america: 'Norteamérica',
  latin_america: 'Latinoamérica',
  eurozone: 'Zona euro',
  europe_ex_euro: 'Europa fuera del euro',
  united_kingdom: 'Reino Unido',
  europe: 'Europa',
  developed_europe: 'Europa desarrollada',
  emerging_europe: 'Europa emergente',
  europe_emerging: 'Europa emergente',
  iberia: 'España y Portugal',
  spain: 'España',
  portugal: 'Portugal',
  nordics: 'Países nórdicos',
  switzerland: 'Suiza',
  africa_middle_east: 'África y Oriente Medio',
  middle_east: 'Oriente Medio',
  africa: 'África',
  japan: 'Japón',
  asia_developed: 'Asia desarrollada',
  asia_emerging: 'Asia emergente',
  asia: 'Asia',
  china: 'China',
  india: 'India',
  oceania: 'Oceanía',
  australia: 'Australia',
  global: 'Global',
  other: 'Otras regiones',
};

/** Clave aseada cuando el diccionario no la conoce: nunca se esconde. */
function aseada(clave) {
  const texto = String(clave || '').replace(/_/g, ' ').trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '—';
}

/** Sector en castellano; una clave desconocida se enseña aseada, tal cual. */
export function etiquetaSector(clave) {
  return SECTORES_ES[String(clave || '').toLowerCase()] || aseada(clave);
}

/** Región en castellano; una clave desconocida se enseña aseada, tal cual. */
export function etiquetaRegion(clave) {
  return REGIONES_ES[String(clave || '').toLowerCase()] || aseada(clave);
}

/**
 * Nombre corto de un activo para leyendas y cabeceras: corta en un límite
 * por palabra entera y lo dice con puntos suspensivos. No inventa siglas.
 */
export function nombreCorto(nombre, max = 28) {
  const texto = String(nombre || '').trim();
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max * 0.5 ? corte.slice(0, espacio) : corte).replace(/[\s\-·,]+$/, '')}…`;
}

/**
 * Marcas redondas para un eje: paso de 1, 2 o 5 por potencia de diez y el
 * dominio ampliado hasta la marca redonda por cada lado. Devuelve
 * { min, max, paso, marcas } — las escalas del gráfico usan min y max para
 * que la primera y la última marca caigan en el borde.
 */
export function marcasEje(minDato, maxDato, objetivo = 5) {
  if (!Number.isFinite(minDato) || !Number.isFinite(maxDato)) return null;
  if (minDato === maxDato) { minDato -= 0.5; maxDato += 0.5; }
  if (minDato > maxDato) [minDato, maxDato] = [maxDato, minDato];
  const bruto = (maxDato - minDato) / Math.max(objetivo - 1, 1);
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const norma = bruto / magnitud;
  const paso = magnitud * (norma < 1.5 ? 1 : norma < 3.5 ? 2 : norma < 7.5 ? 5 : 10);
  const min = Math.floor(minDato / paso) * paso;
  const max = Math.ceil(maxDato / paso) * paso;
  const marcas = [];
  for (let v = min; v <= max + paso / 1e6; v += paso) marcas.push(Number(v.toFixed(10)));
  return { min, max, paso, marcas };
}

/**
 * Separa verticalmente las etiquetas de un gráfico para que ninguna pise a
 * otra: recibe las posiciones deseadas, devuelve posiciones a una distancia
 * mínima entre sí y dentro de [min, max], conservando el orden. Puro.
 */
export function separaVerticalmente(deseadas, distancia, min, max) {
  const orden = deseadas.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  /* Empuje hacia abajo para separar, recule en bloque si se sale del borde
     inferior, y un último empuje desde el borde superior. Si no caben todas,
     la distancia se respeta y el sobrante rebasa por abajo: nunca se pisan. */
  const puestas = [];
  for (const { y } of orden) {
    puestas.push(puestas.length ? Math.max(y, puestas[puestas.length - 1] + distancia) : y);
  }
  const exceso = puestas.length ? Math.max(0, puestas[puestas.length - 1] - max) : 0;
  let previa = -Infinity;
  for (let k = 0; k < puestas.length; k += 1) {
    puestas[k] = Math.max(puestas[k] - exceso, min, previa + distancia);
    previa = puestas[k];
  }
  const resultado = new Array(deseadas.length);
  orden.forEach(({ i }, k) => { resultado[i] = puestas[k]; });
  return resultado;
}

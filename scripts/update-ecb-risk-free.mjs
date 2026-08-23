/**
 * Descarga la serie diaria oficial del €STR desde el ECB Data Portal.
 *
 * Se conservan cinco años como margen para poder cubrir siempre la ventana
 * común de tres años de las carteras, aunque la última fecha disponible en
 * la base NUVIA y la última del BCE no coincidan exactamente.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const SERIE_ESTR = 'EST.B.EU000A2X2A25.WT';
export const URL_ESTR = 'https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?format=csvdata&lastNObservations=1300';
export const URL_FUENTE = 'https://data.ecb.europa.eu/data/datasets/EST/EST.B.EU000A2X2A25.WT';

function campoCsv(linea, indice) {
  let campo = '';
  let actual = 0;
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];
    if (caracter === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === ',' && !entreComillas) {
      if (actual === indice) return campo;
      actual += 1;
      campo = '';
    } else {
      campo += caracter;
    }
  }
  return actual === indice ? campo : '';
}

export function observacionesDesdeCsv(csv) {
  const lineas = String(csv || '').trim().split(/\r?\n/);
  const cabecera = lineas.shift()?.split(',') || [];
  const indiceFecha = cabecera.indexOf('TIME_PERIOD');
  const indiceValor = cabecera.indexOf('OBS_VALUE');
  if (indiceFecha < 0 || indiceValor < 0) throw new Error('La respuesta del BCE no contiene TIME_PERIOD y OBS_VALUE.');

  return lineas.map((linea) => {
    const fecha = campoCsv(linea, indiceFecha);
    const valor = Number(campoCsv(linea, indiceValor));
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(valor) ? [fecha, valor] : null;
  }).filter(Boolean).sort((a, b) => a[0].localeCompare(b[0]));
}

export async function actualizaEstr({ fetchFn = fetch, destino = resolve('data', 'ecb-estr.json') } = {}) {
  const respuesta = await fetchFn(URL_ESTR, { headers: { Accept: 'text/csv' } });
  if (!respuesta.ok) throw new Error(`El BCE respondió ${respuesta.status}.`);
  const observaciones = observacionesDesdeCsv(await respuesta.text());
  if (observaciones.length < 500) throw new Error(`Solo llegaron ${observaciones.length} observaciones del BCE.`);

  const [fecha, valor] = observaciones.at(-1);
  const salida = {
    serie: SERIE_ESTR,
    nombre: 'Euro short-term rate (€STR)',
    unidad: 'porcentaje anual',
    fuente: 'Banco Central Europeo',
    fuente_url: URL_FUENTE,
    consulta_url: URL_ESTR,
    recuperado_el: new Date().toISOString(),
    ultimo: { fecha, valor },
    observaciones,
  };
  await writeFile(destino, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');
  console.log(`€STR BCE: ${valor.toFixed(3)} % (${fecha}); ${observaciones.length} observaciones.`);
  return salida;
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  await actualizaEstr();
}

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dataPath = resolve(root, 'data/daily-content.json');
const eurostatApi = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date);
}

function periodLabel(period) {
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) return `${monthNames[Number(month[2]) - 1]} ${month[1]}`;
  const quarter = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarter) return `${quarter[2]}T ${quarter[1]}`;
  return period;
}

function number(value, digits = 1, signed = false) {
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

function movement(current, previous, up = 'Sube', down = 'Baja') {
  const difference = Number((current - previous).toFixed(2));
  if (Math.abs(difference) < 0.01) return { change: 'Sin cambios', direction: 'stable' };
  return {
    change: `${difference > 0 ? up : down} ${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(Math.abs(difference))} pp`,
    direction: difference > 0 ? 'up' : 'down',
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'NUVIA-Web-3/1.0 (daily official-data updater)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} al consultar ${url}`);
  return response.text();
}

async function eurostatSeries(dataset, filters) {
  const query = new URLSearchParams({ lang: 'en', ...filters, lastTimePeriod: '3' });
  const url = `${eurostatApi}/${dataset}?${query}`;
  const payload = JSON.parse(await fetchText(url));
  const timeIndex = payload.dimension?.time?.category?.index;
  if (!timeIndex || !payload.value) throw new Error(`Respuesta incompleta de Eurostat para ${dataset}`);

  const observations = Object.entries(timeIndex)
    .map(([period, index]) => ({ period, value: Number(payload.value[String(index)]) }))
    .filter(({ value }) => Number.isFinite(value))
    .sort((a, b) => timeIndex[a.period] - timeIndex[b.period]);

  if (observations.length < 2) throw new Error(`Eurostat no devolvió dos observaciones para ${dataset}`);
  return {
    current: observations.at(-1),
    previous: observations.at(-2),
    updatedAt: payload.updated,
  };
}

function parseCsvRow(row) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"' && quoted && row[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  cells.push(value);
  return cells;
}

async function ecbSeries(seriesKey, lastObservations = 10) {
  const url = `https://data-api.ecb.europa.eu/service/data/FM/${seriesKey}?format=csvdata&lastNObservations=${lastObservations}`;
  const rows = (await fetchText(url)).trim().split(/\r?\n/).map(parseCsvRow);
  const header = rows.shift();
  const timeColumn = header.indexOf('TIME_PERIOD');
  const valueColumn = header.indexOf('OBS_VALUE');
  const observations = rows
    .map((row) => ({ period: row[timeColumn], value: Number(row[valueColumn]) }))
    .filter(({ period, value }) => period && Number.isFinite(value));
  if (observations.length < 2) throw new Error(`El BCE no devolvió datos suficientes para ${seriesKey}`);
  return { current: observations.at(-1), previous: observations.at(-2) };
}

const [inflationSpain, gdpSpain, unemploymentSpain, ecbRate, euribor] = await Promise.all([
  eurostatSeries('prc_hicp_manr', { geo: 'ES', coicop: 'CP00', unit: 'RCH_A' }),
  eurostatSeries('namq_10_gdp', { geo: 'ES', na_item: 'B1GQ', unit: 'CLV_PCH_PRE', s_adj: 'SCA' }),
  eurostatSeries('une_rt_m', { geo: 'ES', sex: 'T', age: 'TOTAL', unit: 'PC_ACT', s_adj: 'SA' }),
  ecbSeries('D.U2.EUR.4F.KR.DFR.LEV'),
  ecbSeries('M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA', 3),
]);

const sourceUrls = {
  hicp: 'https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_manr/default/table?lang=es',
  gdp: 'https://ec.europa.eu/eurostat/databrowser/view/namq_10_gdp/default/table?lang=es',
  unemployment: 'https://ec.europa.eu/eurostat/databrowser/view/une_rt_m/default/table?lang=es',
  ecb: 'https://data.ecb.europa.eu/data/datasets/FM/FM.D.U2.EUR.4F.KR.DFR.LEV',
  euribor: 'https://data.ecb.europa.eu/data/datasets/FM/FM.M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA',
};

const checkedAt = new Date();
const checkedLabel = formatDate(checkedAt);
const existing = JSON.parse(await readFile(dataPath, 'utf8'));

existing.macroIndicatorsCheckedAt = checkedAt.toISOString();
existing.macroIndicatorsUpdatedAt = checkedLabel;
existing.dailyMacroIndicators = [
  {
    id: 'inflation-spain',
    label: 'IPC España',
    value: number(inflationSpain.current.value),
    period: `${periodLabel(inflationSpain.current.period)} · interanual`,
    ...movement(inflationSpain.current.value, inflationSpain.previous.value),
    context: 'Última variación interanual oficial del índice armonizado de precios de consumo.',
    sourceName: 'Eurostat',
    sourceUrl: sourceUrls.hicp,
    referenceDate: `dato ${periodLabel(inflationSpain.current.period)}`,
  },
  {
    id: 'ecb-rate',
    label: 'Tipo BCE',
    value: number(ecbRate.current.value, 2),
    period: 'Facilidad de depósito',
    ...movement(ecbRate.current.value, ecbRate.previous.value),
    context: 'Tipo oficial que remunera los depósitos de las entidades de crédito en el BCE.',
    sourceName: 'BCE',
    sourceUrl: sourceUrls.ecb,
    referenceDate: `dato ${formatDate(new Date(`${ecbRate.current.period}T12:00:00Z`), { month: 'short' })}`,
  },
  {
    id: 'euribor',
    label: 'Euríbor a 1 año',
    value: number(euribor.current.value, 2),
    period: `${periodLabel(euribor.current.period)} · media mensual`,
    ...movement(euribor.current.value, euribor.previous.value),
    context: 'Última media mensual disponible del Euríbor a 12 meses, referencia habitual de las hipotecas variables.',
    sourceName: 'BCE · Refinitiv',
    sourceUrl: sourceUrls.euribor,
    referenceDate: `dato ${periodLabel(euribor.current.period)}`,
  },
  {
    id: 'gdp-spain',
    label: 'PIB España',
    value: number(gdpSpain.current.value, 1, true),
    period: `${periodLabel(gdpSpain.current.period)} · trimestral`,
    ...movement(gdpSpain.current.value, gdpSpain.previous.value, 'Acelera', 'Modera'),
    context: 'Última variación trimestral oficial del PIB real, corregida de estacionalidad.',
    sourceName: 'Eurostat',
    sourceUrl: sourceUrls.gdp,
    referenceDate: `dato ${periodLabel(gdpSpain.current.period)}`,
  },
  {
    id: 'unemployment-spain',
    label: 'Paro España',
    value: number(unemploymentSpain.current.value),
    period: `${periodLabel(unemploymentSpain.current.period)} · desestacionalizado`,
    ...movement(unemploymentSpain.current.value, unemploymentSpain.previous.value),
    context: 'Última tasa de paro mensual armonizada y corregida de estacionalidad.',
    sourceName: 'Eurostat',
    sourceUrl: sourceUrls.unemployment,
    referenceDate: `dato ${periodLabel(unemploymentSpain.current.period)}`,
  },
];

await writeFile(dataPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
console.log(`Indicadores oficiales comprobados y actualizados: ${checkedLabel}.`);

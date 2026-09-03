import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { eligibleNews, newsAttribution, CONTEXT_NOTICE } from './news-editorial.mjs';

const root = resolve(process.cwd());
const dataPath = resolve(root, 'data/daily-content.json');
const editorialImageUrl = 'src/assets/social/nuvia-social-source-generated-v1.png';

const feeds = [
  {
    name: 'EL PAÍS Economía',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada',
  },
  {
    name: 'Expansión',
    url: 'https://e00-expansion.uecdn.es/rss/mercados.xml',
  },
];

const excludedPattern = /\b(f[uú]tbol|tenis|motor|moda|viajes|televisi[oó]n|cine)\b/i;
const excludedUrlPattern = /\/(?:opinion|firmas|blogs?|consultorio)\//i;

function relevanceScore(title) {
  const normalized = title.toLocaleLowerCase('es-ES');
  let score = 0;
  if (/\b(inflaci[oó]n|tipos?|bce|fed|eur[ií]bor|pib|paro|empleo|salarios?|pensiones?|jubilaci[oó]n|hipotecas?|viviendas?|deuda|bonos?|impuestos?|fiscalidad)\b/.test(normalized)) score += 8;
  if (/\b(econom[ií]a|mercados?|bolsa|ibex|precios?|energ[ií]a|petr[oó]leo|crecimiento|beneficios?|consumo|ahorro|inversi[oó]n|d[oó]lar|euro)\b/.test(normalized)) score += 4;
  if (/\b(españa|europea?|europeo|zona euro)\b/.test(normalized)) score += 2;
  if (/\b(valores? para invertir|recomendaciones?|apuestas?|rey de)\b/.test(normalized)) score -= 4;
  return score;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function madridDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function titleSimilarity(firstTitle, secondTitle) {
  const ignored = new Set(['para', 'como', 'desde', 'hasta', 'entre', 'sobre', 'ante', 'tras', 'pese', 'vuelve', 'retoma', 'ahora', 'esta', 'este', 'estos', 'estas']);
  const tokens = (title) => new Set(title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES')
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !ignored.has(word)) || []);
  const first = tokens(firstTitle);
  const second = tokens(secondTitle);
  if (!first.size || !second.size) return 0;
  const shared = [...first].filter((word) => second.has(word)).length;
  return shared / Math.min(first.size, second.size);
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function field(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeXml(match?.[1]);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'NUVIA-Portal-Lab/1.0 (daily economic-news updater)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} al consultar ${url}`);
  return response.text();
}

async function readFeed(feed) {
  const xml = await fetchText(feed.url);
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map(([item]) => ({
      title: field(item, 'title'),
      url: field(item, 'link'),
      publishedAt: new Date(field(item, 'pubDate')),
      sourceName: feed.name,
    }))
    .filter((item) => item.title && /^https?:\/\//.test(item.url) && !Number.isNaN(item.publishedAt.valueOf()));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date).replace(/\./g, '');
}

function editorialFor(title) {
  const normalized = title.toLocaleLowerCase('es-ES');

  if (/viviend|hipotec|alquiler|inmobili/.test(normalized)) {
    return {
      category: 'Vivienda y financiación',
      focus: 'el precio de la vivienda, el acceso al crédito y el esfuerzo financiero familiar',
      context: 'La vivienda conecta ahorro inicial, coste de financiación, gasto mensual y patrimonio. Conviene leer sus datos junto a los tipos de interés y la renta disponible.',
      whyItMatters: 'Un cambio en precios, compraventas o hipotecas no afecta igual a quien compra, vende o ya tiene vivienda. La señal útil es contrastarlo con el presupuesto familiar y el horizonte de la decisión.',
      impactPoints: [
        'Puede cambiar el esfuerzo necesario para comprar, financiar o mantener una vivienda.',
        'Ayuda a revisar cuánto ahorro conviene conservar antes de asumir una entrada o una deuda.',
        'Invita a comparar precio, cuota, costes recurrentes y plazo, no solo el dato del día.',
      ],
    };
  }

  if (/inflaci|precio|coste|energ|petr[oó]leo/.test(normalized)) {
    return {
      category: 'Inflación y coste de vida',
      focus: 'los precios, el poder adquisitivo y las expectativas sobre los tipos de interés',
      context: 'La inflación afecta al presupuesto cotidiano y a la rentabilidad real del ahorro. También condiciona la respuesta de los bancos centrales y el coste de la financiación.',
      whyItMatters: 'Para construir patrimonio importa lo que el dinero permite comprar después de la inflación. Por eso conviene distinguir entre rentabilidad nominal, rentabilidad real y necesidades de liquidez.',
      impactPoints: [
        'Puede alterar el poder de compra y la capacidad mensual de ahorro.',
        'Influye en las expectativas sobre tipos, depósitos, bonos e hipotecas.',
        'Refuerza la necesidad de medir objetivos y rentabilidades en términos reales.',
      ],
    };
  }

  if (/tipo|bce|fed|eur[ií]bor|bono|deuda/.test(normalized)) {
    return {
      category: 'Tipos de interés y deuda',
      focus: 'el coste del dinero, la remuneración del ahorro y la valoración de los activos',
      context: 'Los tipos se transmiten a hipotecas, crédito, depósitos, bonos y valoraciones bursátiles. Sus efectos suelen aparecer con distinta velocidad en cada parte de la economía.',
      whyItMatters: 'Una decisión de tipos puede mejorar la remuneración del efectivo y, al mismo tiempo, encarecer la deuda. La lectura patrimonial debe considerar ambos lados del balance familiar.',
      impactPoints: [
        'Puede modificar cuotas, nuevas financiaciones y rentabilidad del ahorro conservador.',
        'Afecta de forma diferente a bonos, bolsa, divisas y activos inmobiliarios.',
        'Ayuda a revisar plazos y riesgos sin reaccionar a una sola sesión de mercado.',
      ],
    };
  }

  if (/empleo|paro|salario|renta|pensi|jubil/.test(normalized)) {
    return {
      category: 'Empleo e ingresos',
      focus: 'los ingresos familiares, el consumo y la capacidad de ahorro a largo plazo',
      context: 'El empleo y los salarios sostienen el consumo y determinan cuánto margen tienen las familias para ahorrar, reducir deuda y financiar sus objetivos.',
      whyItMatters: 'El patrimonio se construye sobre un flujo de ingresos sostenible. Los datos laborales ayudan a calibrar el colchón de seguridad y la velocidad razonable de ahorro e inversión.',
      impactPoints: [
        'Orienta sobre la fortaleza de los ingresos y del consumo de los hogares.',
        'Puede influir en inflación, tipos de interés y expectativas de crecimiento.',
        'Ayuda a ajustar colchón, deuda y aportaciones periódicas a un escenario realista.',
      ],
    };
  }

  return {
    category: 'Economía y mercados',
    focus: 'el crecimiento, las expectativas empresariales y la valoración de los mercados',
    context: 'Los mercados condensan expectativas sobre beneficios, crecimiento, inflación y tipos. Una noticia diaria aporta contexto, pero no sustituye una estrategia diversificada y de largo plazo.',
    whyItMatters: 'La utilidad de la noticia no está en anticipar la próxima sesión, sino en entender qué variable económica está cambiando y si altera de verdad los objetivos, el plazo o el riesgo asumido.',
    impactPoints: [
      'Puede modificar las expectativas de crecimiento y beneficios empresariales.',
      'Ayuda a interpretar movimientos en bolsa, bonos y divisas con más contexto.',
      'Recuerda separar el ruido diario de las decisiones patrimoniales de largo plazo.',
    ],
  };
}

const checkedAt = new Date();
const existing = JSON.parse(await readFile(dataPath, 'utf8'));
let feedReport = [];

try {
  const results = await Promise.allSettled(feeds.map(readFeed));
  feedReport = results.map((result, index) => ({
    name: feeds[index].name,
    status: result.status === 'fulfilled' ? 'ok' : 'failed',
  }));
  const candidates = results
  .filter((result) => result.status === 'fulfilled')
  .flatMap((result) => result.value)
  .map((item) => ({
    ...item,
    relevance: relevanceScore(item.title),
    ageHours: (checkedAt - item.publishedAt) / 3_600_000,
  }))
  .filter((item) => item.relevance >= 4
    && eligibleNews(item, checkedAt)
    && !excludedPattern.test(item.title)
    && !excludedUrlPattern.test(item.url))
  .map((item) => ({ ...item, editorialScore: item.relevance * 10 - item.ageHours }))
  .sort((a, b) => b.editorialScore - a.editorialScore || b.publishedAt - a.publishedAt);

if (!candidates.length) {
  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || String(result.reason));
  throw new Error(`No se encontró una noticia económica válida. ${failures.join(' · ')}`);
}

const recentCandidates = candidates.filter((item) => item.ageHours <= 36);
const todayKey = madridDateKey(checkedAt);
const todayCandidates = candidates.filter((item) => madridDateKey(item.publishedAt) === todayKey);
const timelyCandidates = todayCandidates.length
  ? todayCandidates
  : (recentCandidates.length ? recentCandidates : candidates);
const previousNews = existing.dailyEconomicNews;
const newCandidates = timelyCandidates.filter((item) => (
  item.url !== previousNews?.sourceUrl
  && titleSimilarity(item.title, previousNews?.title || '') < 0.45
));
const selected = (newCandidates.length ? newCandidates : timelyCandidates)[0];

const editorial = editorialFor(selected.title);
const preparedSecondaryNews = [];
const secondaryCandidates = candidates.filter((candidate) => (
  candidate.url !== selected.url
  && titleSimilarity(candidate.title, selected.title) < 0.45
));

for (const candidate of secondaryCandidates) {
  if (preparedSecondaryNews.length === 3) break;
  if (preparedSecondaryNews.some((item) => titleSimilarity(item.candidate.title, candidate.title) >= 0.45)) continue;
  preparedSecondaryNews.push({ candidate, editorial: editorialFor(candidate.title) });
}

if (preparedSecondaryNews.length < 3) {
  throw new Error(`Solo se pudieron preparar ${preparedSecondaryNews.length} noticias breves actuales.`);
}

const secondaryNews = preparedSecondaryNews.map(({ candidate, editorial: itemEditorial }, index) => {
  const slot = index + 1;
  return {
    id: `market-brief-${slot}`,
    category: itemEditorial.category,
    title: candidate.title,
    summary: newsAttribution(candidate.sourceName),
    contextMode: 'automatic-topic-context',
    imageUrl: editorialImageUrl,
    imageAlt: '',
    imageProvenance: 'Activo editorial propio de NUVIA; imagen decorativa generada y documentada en src/assets/social/README.md.',
    body: [
      CONTEXT_NOTICE,
      itemEditorial.context,
    ],
    whyItMatters: `Contexto general: ${itemEditorial.whyItMatters}`,
    publishedAt: formatShortDate(candidate.publishedAt),
    publishedAtIso: candidate.publishedAt.toISOString(),
    selectedAt: checkedAt.toISOString(),
    sourceName: candidate.sourceName,
    sourceUrl: candidate.url,
  };
});

existing.synchronizedAt = checkedAt.toISOString();
existing.sourceRepository = 'NUVIA-PORTAL-LAB';
existing.dailyEconomicNewsCheckedAt = checkedAt.toISOString();
existing.editorialUpdate = {
  lastAttemptAt: checkedAt.toISOString(),
  lastSuccessAt: checkedAt.toISOString(),
  status: feedReport.some((feed) => feed.status === 'failed') ? 'degraded' : 'ok',
  selectionMode: 'automatic',
  contextMode: 'automatic-topic-context',
  successfulFeeds: feedReport.filter((feed) => feed.status === 'ok').map((feed) => feed.name),
  failedFeeds: feedReport.filter((feed) => feed.status === 'failed').map((feed) => feed.name),
  candidateCount: candidates.length,
  maximumSourceAgeHours: 72,
};
existing.dailyEconomicNews = {
  selectionDate: formatDate(selected.publishedAt),
  freshnessStatus: madridDateKey(selected.publishedAt) === todayKey ? 'today' : 'recent',
  sourcePublishedAt: formatDate(selected.publishedAt),
  sourcePublishedAtIso: selected.publishedAt.toISOString(),
  selectedAt: checkedAt.toISOString(),
  sourceName: selected.sourceName,
  sourceUrl: selected.url,
  imageUrl: editorialImageUrl,
  imageAlt: '',
  imageProvenance: 'Activo editorial propio de NUVIA; imagen decorativa generada y documentada en src/assets/social/README.md.',
  title: selected.title,
  summary: newsAttribution(selected.sourceName),
  contextMode: 'automatic-topic-context',
  category: editorial.category,
  context: `${CONTEXT_NOTICE} ${editorial.context}`,
  whyItMatters: `${CONTEXT_NOTICE} ${editorial.whyItMatters}`,
  impactPoints: editorial.impactPoints.map(point => `Contexto general: ${point}`),
};
existing.secondaryEconomicNews = secondaryNews;

await writeFile(dataPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
console.log(`Noticia diaria actualizada con ${selected.sourceName}: ${selected.title}`);
} catch (error) {
  existing.editorialUpdate = {
    ...(existing.editorialUpdate || {}),
    lastAttemptAt: checkedAt.toISOString(),
    status: 'failed',
    selectionMode: 'automatic',
    successfulFeeds: feedReport.filter((feed) => feed.status === 'ok').map((feed) => feed.name),
    failedFeeds: feedReport.filter((feed) => feed.status === 'failed').map((feed) => feed.name),
    publicMessage: 'No se pudo completar la actualización automática. Se conserva la última selección con su fecha y su fuente.',
  };
  await writeFile(dataPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
  console.error(`Actualización editorial incompleta: ${error.message}`);
  process.exitCode = 1;
}

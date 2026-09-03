const domains = { 'EL PAÍS Economía': 'elpais.com', 'Expansión': 'expansion.com' };
export const CONTEXT_NOTICE = 'Contexto temático automático de NUVIA: no resume ni verifica el artículo enlazado.';
export const newsAttribution = source => `Titular de ${source}. Consulta la noticia completa en el medio de origen.`;

export function eligibleNews(item, checkedAt) {
  const age = checkedAt - item.publishedAt;
  if (!item.title?.trim() || !(item.publishedAt instanceof Date) || !Number.isFinite(age) || age < 0 || age > 72 * 3_600_000) return false;
  try {
    const url = new URL(item.url), domain = domains[item.sourceName];
    return Boolean(domain && url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (url.hostname === domain || url.hostname.endsWith(`.${domain}`)));
  } catch { return false; }
}

const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const CACHE_PREFIX = 'nuvia-company-description-es:';

function cacheKey(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${CACHE_PREFIX}${(hash >>> 0).toString(36)}`;
}

function splitIntoChunks(text, limit = 720) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean) continue;
    if (current && `${current} ${clean}`.length > limit) {
      chunks.push(current);
      current = clean;
    } else {
      current = current ? `${current} ${clean}` : clean;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'es',
    dt: 't',
    q: chunk
  });
  const response = await fetch(`${TRANSLATE_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`No se pudo traducir la descripción (${response.status})`);
  const payload = await response.json();
  const translated = payload?.[0]
    ?.map((segment) => segment?.[0] || '')
    .join('')
    .trim();
  if (!translated) throw new Error('El servicio de traducción no devolvió contenido');
  return translated;
}

export async function translateCompanyDescription(text) {
  const source = String(text || '').trim();
  if (!source) return '';

  const key = cacheKey(source);
  try {
    const cached = window.localStorage.getItem(key);
    if (cached) return cached;
  } catch { /* El almacenamiento puede estar deshabilitado. */ }

  const chunks = splitIntoChunks(source);
  const translated = (await Promise.all(chunks.map(translateChunk))).join(' ');

  try {
    window.localStorage.setItem(key, translated);
  } catch { /* La traducción sigue siendo válida aunque no pueda guardarse. */ }
  return translated;
}

/**
 * NUVIA · alfa · cliente mínimo de EODHD.
 *
 * La clave llega SOLO por parámetro (desde la variable de entorno
 * EODHD_API_KEY en run.mjs). Nunca se escribe en ficheros ni se imprime; los
 * mensajes de error la ocultan.
 *
 * Ritmo: 4 peticiones por segundo; ante 429 o 5xx espera y reintenta.
 */

export const URL_EODHD = 'https://eodhd.com/api';

export function creaClienteEodhd({ token, fetchFn = fetch, espera = (ms) => new Promise((r) => setTimeout(r, ms)), porSegundo = 4, reintentos = 3 } = {}) {
  if (!token) throw new Error('Falta la clave de EODHD (variable de entorno EODHD_API_KEY).');
  const intervalo = Math.ceil(1000 / porSegundo);
  let ultima = 0;
  let llamadas = 0;

  async function pide(ruta, params = {}, { coste = 1 } = {}) {
    const url = new URL(`${URL_EODHD}/${ruta}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set('api_token', token);
    url.searchParams.set('fmt', 'json');
    for (let intento = 0; ; intento += 1) {
      const ahora = Date.now();
      if (ahora - ultima < intervalo) await espera(intervalo - (ahora - ultima));
      ultima = Date.now();
      llamadas += coste;
      const res = await fetchFn(url.toString());
      if (res.ok) {
        const texto = await res.text();
        try { return JSON.parse(texto.replace(/^\uFEFF/, '')); } catch { return null; }
      }
      const reintentable = res.status === 429 || res.status >= 500;
      if (!reintentable || intento >= reintentos) {
        throw new Error(`EODHD ${ruta}: HTTP ${res.status}`); // sin la URL: lleva la clave
      }
      await espera(1000 * (intento + 1) * 2);
    }
  }

  return {
    /** Precios diarios desde una fecha ISO. 1 llamada. */
    precios: (symbol, desde) => pide(`eod/${encodeURIComponent(symbol)}`, { period: 'd', from: desde }),
    /** Ficha completa. 10 llamadas. */
    fundamentales: (symbol) => pide(`fundamentals/${encodeURIComponent(symbol)}`, {}, { coste: 10 }),
    /** Búsqueda por ISIN o texto. 1 llamada. */
    busca: (texto) => pide(`search/${encodeURIComponent(texto)}`),
    llamadas: () => llamadas,
  };
}

/**
 * Elige, entre los resultados de /api/search, el candidato en euros para un
 * instrumento del CSV. Devuelve {symbol, name, currency} o null. No adivina:
 * si hay varios en EUR y ninguno coincide por ISIN, devuelve null y la lista.
 */
export function candidatoEnEuros(busqueda, { isin, tipo }) {
  const lista = (Array.isArray(busqueda) ? busqueda : [])
    .filter((b) => String(b?.Currency || '').toUpperCase() === 'EUR')
    .map((b) => ({ symbol: `${b.Code}.${b.Exchange}`, name: b.Name || '', currency: 'EUR', isin: b.ISIN || null, type: b.Type || '' }));
  const porIsin = lista.filter((b) => b.isin && b.isin.toUpperCase() === String(isin).toUpperCase());
  if (porIsin.length === 1) return { candidato: porIsin[0], alternativas: lista };
  const tipoEsperado = tipo === 'STOCK' ? /stock/i : tipo === 'ETF' ? /etf/i : /fund/i;
  const porTipo = (porIsin.length ? porIsin : lista).filter((b) => tipoEsperado.test(b.type));
  if (porTipo.length === 1) return { candidato: porTipo[0], alternativas: lista };
  return { candidato: null, alternativas: lista };
}

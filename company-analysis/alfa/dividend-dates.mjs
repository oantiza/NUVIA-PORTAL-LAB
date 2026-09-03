// Contrato independiente. No se añaden campos a los fundamentales existentes.
export const DIVIDEND_DATES_SCHEMA = 'nuvia-dividend-dates.v1';
export const DIVIDEND_FIELDS = Object.freeze(['General::Code', 'General::Exchange', 'General::ISIN', 'General::Type', 'General::UpdatedAt', 'SplitsDividends::DividendDate', 'SplitsDividends::ExDividendDate']);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
function exact(value, fields) {
  if (!record(value) || Object.keys(value).length !== fields.length || fields.some(field => !Object.hasOwn(value, field))) throw new Error('Campos de fechas no válidos');
}
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const optionalDay = value => value === null || day(value);
// En la respuesta filtrada, el proveedor representa una fecha no disponible como "NA".
// Solo se normaliza ese marcador comprobado; cualquier otro formato sigue validándose.
const providerDay = value => value === 'NA' ? null : value;
const availability = (payment, ex) => payment && ex ? 'both' : payment ? 'paymentOnly' : ex ? 'exDividendOnly' : 'notReported';
export function validateDividendDates(doc) {
  exact(doc, ['schema_version', 'asset_id', 'isin', 'symbol', 'dividendDate', 'exDividendDate', 'availability', 'source', 'loaded_at']);
  if (doc.schema_version !== DIVIDEND_DATES_SCHEMA || !/^[A-Z]{2}[A-Z0-9]{10}$/.test(doc.asset_id)
    || doc.asset_id !== doc.isin || !/^[A-Z0-9-]+\.[A-Z0-9]+$/.test(doc.symbol)
    || !optionalDay(doc.dividendDate) || !optionalDay(doc.exDividendDate)
    || doc.availability !== availability(doc.dividendDate, doc.exDividendDate) || !timestamp(doc.loaded_at)) throw new Error('Identidad o fechas no válidas');
  exact(doc.source, ['provider', 'endpoint', 'fields', 'providerUpdated', 'fetchedAt', 'responseSha256']);
  const source = doc.source;
  if (source.provider !== 'EODHD' || source.endpoint !== 'fundamentals-filtered'
    || !Array.isArray(source.fields) || JSON.stringify(source.fields) !== JSON.stringify(DIVIDEND_FIELDS)
    || !optionalDay(source.providerUpdated) || !timestamp(source.fetchedAt) || source.fetchedAt > doc.loaded_at
    || !/^[a-f0-9]{64}$/.test(source.responseSha256)) throw new Error('Procedencia de fechas no válida');
  return doc;
}

export function projectDividendDates(response, entry, { fetchedAt, loadedAt, responseSha256 }) {
  exact(response, DIVIDEND_FIELDS);
  if (response['General::ISIN'] !== entry.isin || entry.assetId !== entry.isin
    || `${response['General::Code']}.${response['General::Exchange']}` !== entry.symbol
    || response['General::Type'] !== 'Common Stock') throw new Error('Identidad distinta; no se asignan fechas');
  const dividendDate = providerDay(response['SplitsDividends::DividendDate']);
  const exDividendDate = providerDay(response['SplitsDividends::ExDividendDate']);
  return validateDividendDates({ schema_version: DIVIDEND_DATES_SCHEMA, asset_id: entry.assetId, isin: entry.isin, symbol: entry.symbol,
    dividendDate, exDividendDate, availability: availability(dividendDate, exDividendDate),
    source: { provider: 'EODHD', endpoint: 'fundamentals-filtered', fields: [...DIVIDEND_FIELDS], providerUpdated: response['General::UpdatedAt'], fetchedAt, responseSha256 },
    loaded_at: loadedAt });
}

export function dividendCreate(doc, encode) {
  validateDividendDates(doc);
  return { update: { name: `projects/nuvia-family-wealth/databases/(default)/documents/assets/${doc.isin}/fundamentals/dividends`, fields: encode(doc).mapValue.fields }, currentDocument: { exists: false } };
}

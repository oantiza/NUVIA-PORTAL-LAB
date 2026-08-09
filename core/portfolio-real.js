const FIREBASE = {
  apiKey: 'AIzaSyC9-mRmyrHR0ci6VkOpWP1g4-P2K_J5ddU',
  projectId: 'nuvia-market-data',
};

const STORAGE_KEY = 'nuvia.real-portfolio.client.v1';
const AUTH_KEY = 'nuvia.market-auth.v1';
const MAX_ASSETS = 10;
const TRADING_DAYS = 252;
const COLORS = ['#0B2347', '#B78B3B', '#74263C', '#78933D', '#3A7E8C', '#7358B8', '#D66A1F', '#6D7D91', '#2F6FA9', '#A34F6B'];

let catalog = [];
let authState = null;
let activeAnalysis = null;
let mountNode = null;

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const percent = (value, digits = 2) => Number.isFinite(value)
  ? `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value * 100)} %`
  : '—';
const euros = (value) => Number.isFinite(value)
  ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  : '—';

function loadLocalPortfolio() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed && Array.isArray(parsed.positions)) return parsed;
  } catch { /* se crea un registro local limpio */ }
  return {
    schema: 1,
    clientId: crypto.randomUUID(),
    clientName: 'Cliente local',
    portfolioName: 'Cartera principal',
    baseCurrency: 'EUR',
    objective: 'max_sharpe',
    riskFreeRate: 2,
    periodYears: 3,
    positions: [],
    updatedAt: new Date().toISOString(),
  };
}

let portfolio = loadLocalPortfolio();

function saveLocalPortfolio() {
  portfolio.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function decodeFirestore(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestore);
  if ('mapValue' in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeFirestore(item)]));
  }
  return null;
}

function decodeDocument(document) {
  return Object.fromEntries(Object.entries(document?.fields || {}).map(([key, value]) => [key, decodeFirestore(value)]));
}

async function refreshAnonymousAuth(refreshToken) {
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error('No se ha podido renovar el acceso de lectura.');
  const payload = await response.json();
  return {
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 - 60_000,
  };
}

async function ensureAnonymousAuth() {
  if (authState?.idToken && authState.expiresAt > Date.now()) return authState.idToken;
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (stored?.refreshToken) authState = await refreshAnonymousAuth(stored.refreshToken);
  } catch { authState = null; }

  if (!authState?.idToken) {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    if (!response.ok) throw new Error('No se ha podido iniciar el acceso anónimo de solo lectura.');
    const payload = await response.json();
    authState = {
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000 - 60_000,
    };
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify({ refreshToken: authState.refreshToken }));
  return authState.idToken;
}

async function firestoreGet(path) {
  const token = await ensureAnonymousAuth();
  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
  let response = await fetch(`${base}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) {
    authState = null;
    const retryToken = await ensureAnonymousAuth();
    response = await fetch(`${base}/${path}`, { headers: { Authorization: `Bearer ${retryToken}` } });
  }
  if (!response.ok) throw new Error(`La fuente diaria no ha respondido (${response.status}).`);
  return response.json();
}

async function loadCatalog() {
  const manifestDocument = await firestoreGet('catalog_manifest/public');
  const manifest = decodeDocument(manifestDocument);
  const chunks = await Promise.all((manifest.chunks || []).map((id) => firestoreGet(`catalog_chunks/${encodeURIComponent(id)}`)));
  catalog = chunks.flatMap((document) => decodeDocument(document).items || [])
    .filter((asset) => asset.asset_id && asset.display_name && asset.ohlcv_available)
    .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name), 'es'));
  return { manifest, items: catalog };
}

async function loadSeries(assetId) {
  const response = await firestoreGet(`assets/${encodeURIComponent(assetId)}/series?pageSize=100`);
  const byDate = new Map();
  (response.documents || []).forEach((document) => {
    const data = decodeDocument(document);
    (data.points || []).forEach((point) => {
      const value = Number(point.value ?? point.adjusted_close ?? point.close);
      if (point.date && Number.isFinite(value) && value > 0) byDate.set(String(point.date), value);
    });
  });
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

function assetTicker(asset) {
  return asset?.ticker || asset?.isin || asset?.asset_id || '—';
}

function resolveDefaultPositions() {
  if (portfolio.positions.length) return;
  ['AAPL', 'SPY', 'QQQ'].forEach((ticker) => {
    const asset = catalog.find((item) => String(item.ticker || '').toUpperCase() === ticker);
    if (asset) portfolio.positions.push({
      assetId: asset.asset_id,
      ticker: assetTicker(asset),
      name: asset.display_name,
      currency: asset.currency || '—',
      instrumentType: asset.instrument_type || asset.asset_type || 'Activo',
      capital: 25000,
    });
  });
  saveLocalPortfolio();
}

function totalCapital() {
  return portfolio.positions.reduce((sum, position) => sum + Math.max(0, Number(position.capital) || 0), 0);
}

function currentWeights() {
  const total = totalCapital();
  return portfolio.positions.map((position) => total > 0 ? Math.max(0, Number(position.capital) || 0) / total : 0);
}

function renderApp(manifest) {
  mountNode.innerHTML = `
    <div class="nuvia-real-portfolio">
      <div class="nrp-shell">
        <section class="nrp-hero">
          <div>
            <p class="nrp-kicker">Análisis real · cierres diarios</p>
            <h2>La cartera del cliente,<br>medida con datos reales</h2>
            <p class="nrp-hero-copy">Rentabilidad, riesgo, correlaciones y optimización calculados en el dispositivo con históricos diarios. La cartera permanece en este navegador.</p>
          </div>
          <aside class="nrp-source-card">
            <strong>Fuente de mercado verificada</strong>
            <p>Catálogo público de solo lectura, alimentado desde la base de activos financieros. No se utilizan cotizaciones intradía.</p>
            <div class="nrp-source-row">
              <span class="nrp-chip"><i></i> ${number.format(manifest.total || catalog.length)} activos</span>
              <span class="nrp-chip">Cierre ajustado</span>
              <span class="nrp-chip">Actualización diaria</span>
            </div>
          </aside>
        </section>

        <section class="nrp-client-bar" aria-label="Identificación local de la cartera">
          <div class="nrp-field"><label for="nrp-client">Cliente</label><input id="nrp-client" class="nrp-input" value="${escapeHtml(portfolio.clientName)}"></div>
          <div class="nrp-field"><label for="nrp-portfolio">Nombre de la cartera</label><input id="nrp-portfolio" class="nrp-input" value="${escapeHtml(portfolio.portfolioName)}"></div>
          <div class="nrp-field"><label for="nrp-currency">Moneda base</label><select id="nrp-currency" class="nrp-select"><option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option></select></div>
          <span class="nrp-local-badge">Guardado solo en este dispositivo</span>
        </section>

        <div class="nrp-workspace">
          <section class="nrp-card">
            <p class="nrp-section-label">01 · Composición</p>
            <h3>Construye la cartera</h3>
            <p class="nrp-card-sub">Busca por nombre, ticker o ISIN. Cada cartera queda vinculada a un único cliente local.</p>
            <div class="nrp-search">
              <div class="nrp-field"><label for="nrp-search-input">Añadir activo</label><input id="nrp-search-input" class="nrp-input" autocomplete="off" placeholder="Ej. Apple, AAPL o US0378331005"></div>
              <div id="nrp-search-results" class="nrp-search-results" hidden></div>
            </div>
            <div id="nrp-positions" class="nrp-positions"></div>
            <div class="nrp-settings">
              <div class="nrp-field"><label for="nrp-objective">Objetivo</label><select id="nrp-objective" class="nrp-select"><option value="max_sharpe">Mejor equilibrio</option><option value="min_volatility">Menor volatilidad</option></select></div>
              <div class="nrp-field"><label for="nrp-period">Histórico</label><select id="nrp-period" class="nrp-select"><option value="1">1 año</option><option value="3">3 años</option><option value="5">5 años</option></select></div>
              <div class="nrp-field"><label for="nrp-risk-free">Tipo libre de riesgo</label><input id="nrp-risk-free" class="nrp-input" type="number" min="0" max="20" step="0.1" value="${escapeHtml(portfolio.riskFreeRate)}"></div>
              <div class="nrp-field"><label>Capital total</label><div class="nrp-input" id="nrp-total" style="display:flex;align-items:center;font-weight:750"></div></div>
            </div>
            <button id="nrp-analyze" class="nrp-primary" type="button">Calcular análisis con cierres reales <span aria-hidden="true">→</span></button>
            <div id="nrp-message" class="nrp-message">Selecciona al menos dos activos. Se utilizarán únicamente fechas comunes y precios diarios ajustados.</div>
          </section>

          <section id="nrp-summary" class="nrp-summary">
            <div class="nrp-empty"><div><strong>El análisis está preparado</strong><p>Al calcular, NUVIA descargará los cierres diarios necesarios, comprobará su cobertura y construirá los gráficos con los datos de esta cartera.</p></div></div>
          </section>
        </div>
        <div id="nrp-results" class="nrp-results"></div>
        <p class="nrp-footnote">Análisis informativo basado en históricos diarios. Las estimaciones no garantizan resultados futuros y no constituyen una recomendación personalizada. Las rentabilidades se calculan en la divisa de cotización; cuando conviven varias divisas, se identifica expresamente la exposición no ajustada.</p>
      </div>
    </div>`;

  bindAppEvents();
  renderPositions();
}

function bindAppEvents() {
  const byId = (id) => mountNode.querySelector(`#${id}`);
  byId('nrp-currency').value = portfolio.baseCurrency;
  byId('nrp-objective').value = portfolio.objective;
  byId('nrp-period').value = String(portfolio.periodYears);

  const saveField = (field, value) => { portfolio[field] = value; saveLocalPortfolio(); };
  byId('nrp-client').addEventListener('change', (event) => saveField('clientName', event.target.value.trim() || 'Cliente local'));
  byId('nrp-portfolio').addEventListener('change', (event) => saveField('portfolioName', event.target.value.trim() || 'Cartera principal'));
  byId('nrp-currency').addEventListener('change', (event) => saveField('baseCurrency', event.target.value));
  byId('nrp-objective').addEventListener('change', (event) => saveField('objective', event.target.value));
  byId('nrp-period').addEventListener('change', (event) => saveField('periodYears', Number(event.target.value)));
  byId('nrp-risk-free').addEventListener('change', (event) => saveField('riskFreeRate', Number(event.target.value) || 0));
  byId('nrp-analyze').addEventListener('click', runAnalysis);

  const searchInput = byId('nrp-search-input');
  searchInput.addEventListener('input', () => renderSearchResults(searchInput.value));
  searchInput.addEventListener('focus', () => renderSearchResults(searchInput.value));
  document.addEventListener('click', (event) => {
    if (!event.target.closest?.('.nrp-search')) byId('nrp-search-results').hidden = true;
  });
}

function renderSearchResults(query) {
  const resultsNode = mountNode.querySelector('#nrp-search-results');
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) { resultsNode.hidden = true; return; }
  const matches = catalog.filter((asset) => [asset.ticker, asset.isin, asset.asset_id, asset.display_name]
    .some((value) => String(value || '').toLowerCase().includes(normalized)))
    .filter((asset) => !portfolio.positions.some((position) => position.assetId === asset.asset_id))
    .slice(0, 8);
  resultsNode.innerHTML = matches.length ? matches.map((asset) => `
    <button type="button" class="nrp-search-result" data-asset="${escapeHtml(asset.asset_id)}">
      <b>${escapeHtml(assetTicker(asset))}</b><span>${escapeHtml(asset.display_name)}</span><em>${escapeHtml(asset.currency || asset.instrument_type || '')}</em>
    </button>`).join('') : '<div style="padding:14px;color:#6b788b;font-size:11px">No se han encontrado activos con histórico diario disponible.</div>';
  resultsNode.hidden = false;
  resultsNode.querySelectorAll('[data-asset]').forEach((button) => button.addEventListener('click', () => {
    if (portfolio.positions.length >= MAX_ASSETS) return setMessage(`La cartera admite un máximo de ${MAX_ASSETS} activos.`, true);
    const asset = catalog.find((item) => item.asset_id === button.dataset.asset);
    if (!asset) return;
    portfolio.positions.push({
      assetId: asset.asset_id,
      ticker: assetTicker(asset),
      name: asset.display_name,
      currency: asset.currency || '—',
      instrumentType: asset.instrument_type || asset.asset_type || 'Activo',
      capital: 10000,
    });
    saveLocalPortfolio();
    mountNode.querySelector('#nrp-search-input').value = '';
    resultsNode.hidden = true;
    renderPositions();
  }));
}

function renderPositions() {
  const node = mountNode.querySelector('#nrp-positions');
  if (!node) return;
  node.innerHTML = portfolio.positions.length ? portfolio.positions.map((position, index) => `
    <div class="nrp-position">
      <div><b>${escapeHtml(position.ticker)}</b><small>${escapeHtml(position.name)} · ${escapeHtml(position.currency || '—')}</small></div>
      <input class="nrp-input nrp-capital" type="number" min="0" step="100" value="${escapeHtml(position.capital)}" aria-label="Capital de ${escapeHtml(position.ticker)}" data-capital="${index}">
      <button class="nrp-remove" type="button" data-remove="${index}" aria-label="Eliminar ${escapeHtml(position.ticker)}">×</button>
    </div>`).join('') : '<div class="nrp-message">Todavía no hay posiciones. Busca y añade al menos dos activos.</div>';
  node.querySelectorAll('[data-capital]').forEach((input) => input.addEventListener('change', () => {
    portfolio.positions[Number(input.dataset.capital)].capital = Math.max(0, Number(input.value) || 0);
    saveLocalPortfolio();
    updateTotal();
  }));
  node.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
    portfolio.positions.splice(Number(button.dataset.remove), 1);
    saveLocalPortfolio();
    activeAnalysis = null;
    renderPositions();
  }));
  updateTotal();
}

function updateTotal() {
  const node = mountNode.querySelector('#nrp-total');
  if (node) node.textContent = euros(totalCapital());
}

function setMessage(message, isError = false) {
  const node = mountNode.querySelector('#nrp-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('is-error', isError);
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const sampleStd = (values) => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
};
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);

function buildAlignedData(seriesByAsset) {
  const allSeries = portfolio.positions.map((position) => seriesByAsset[position.assetId] || []);
  const maxDate = allSeries.flat().reduce((latest, point) => point.date > latest ? point.date : latest, '');
  const cutoff = new Date(`${maxDate}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - Number(portfolio.periodYears || 3));
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const maps = allSeries.map((series) => new Map(series.filter((point) => point.date >= cutoffIso).map((point) => [point.date, point.value])));
  let common = new Set(maps[0]?.keys() || []);
  maps.slice(1).forEach((map) => { common = new Set([...common].filter((date) => map.has(date))); });
  const dates = [...common].sort();
  if (dates.length < 60) throw new Error('No hay al menos 60 cierres comunes entre todos los activos seleccionados.');
  const prices = dates.map((date) => maps.map((map) => map.get(date)));
  const returns = prices.slice(1).map((row, index) => row.map((price, assetIndex) => price / prices[index][assetIndex] - 1));
  return { dates, prices, returns, startDate: dates[0], endDate: dates.at(-1) };
}

function covarianceMatrix(returns) {
  const columns = returns[0].map((_, index) => returns.map((row) => row[index]));
  const averages = columns.map(mean);
  return columns.map((columnA, i) => columns.map((columnB, j) => {
    const sum = columnA.reduce((acc, value, row) => acc + (value - averages[i]) * (columnB[row] - averages[j]), 0);
    return (sum / Math.max(1, columnA.length - 1)) * TRADING_DAYS;
  }));
}

function correlationMatrix(returns) {
  const columns = returns[0].map((_, index) => returns.map((row) => row[index]));
  const covariance = covarianceMatrix(returns);
  const volatility = columns.map((column) => sampleStd(column) * Math.sqrt(TRADING_DAYS));
  return covariance.map((row, i) => row.map((value, j) => volatility[i] && volatility[j] ? value / (volatility[i] * volatility[j]) : 0));
}

function portfolioEvaluation(weights, meanAnnual, covariance, riskFree) {
  const expected = dot(weights, meanAnnual);
  const variance = weights.reduce((sum, weightI, i) => sum + weights.reduce((inner, weightJ, j) => inner + weightI * weightJ * covariance[i][j], 0), 0);
  const volatility = Math.sqrt(Math.max(0, variance));
  return { expected, volatility, sharpe: volatility > 0 ? (expected - riskFree) / volatility : 0 };
}

function optimizeWeights(startWeights, meanAnnual, covariance, riskFree, objective) {
  const evaluate = (weights) => portfolioEvaluation(weights, meanAnnual, covariance, riskFree);
  const score = (metrics) => objective === 'min_volatility' ? -metrics.volatility : metrics.sharpe;
  const equal = startWeights.map(() => 1 / startWeights.length);
  let weights = score(evaluate(equal)) > score(evaluate(startWeights)) ? equal : [...startWeights];
  const maxWeight = Math.max(.45, 1 / weights.length);
  for (const step of [.08, .04, .02, .01, .005, .002, .001]) {
    let improved = true;
    let passes = 0;
    while (improved && passes < 80) {
      improved = false;
      passes += 1;
      let bestWeights = weights;
      let bestScore = score(evaluate(weights));
      for (let from = 0; from < weights.length; from += 1) {
        for (let to = 0; to < weights.length; to += 1) {
          if (from === to || weights[from] < step || weights[to] + step > maxWeight) continue;
          const candidate = [...weights];
          candidate[from] -= step;
          candidate[to] += step;
          const candidateScore = score(evaluate(candidate));
          if (candidateScore > bestScore + 1e-9) { bestScore = candidateScore; bestWeights = candidate; improved = true; }
        }
      }
      weights = bestWeights;
    }
  }
  const normalized = weights.map((weight) => Math.max(0, weight));
  const total = normalized.reduce((sum, value) => sum + value, 0);
  return normalized.map((weight) => weight / total);
}

function portfolioPath(returns, weights) {
  let value = 100;
  const values = [value];
  returns.forEach((row) => { value *= 1 + dot(row, weights); values.push(value); });
  return values;
}

function pathMetrics(returns, weights, riskFree) {
  const daily = returns.map((row) => dot(row, weights));
  const path = portfolioPath(returns, weights);
  const years = daily.length / TRADING_DAYS;
  const cagr = years > 0 ? (path.at(-1) / 100) ** (1 / years) - 1 : 0;
  const volatility = sampleStd(daily) * Math.sqrt(TRADING_DAYS);
  const arithmeticAnnual = mean(daily) * TRADING_DAYS;
  let peak = path[0];
  let maxDrawdown = 0;
  path.forEach((value) => { peak = Math.max(peak, value); maxDrawdown = Math.min(maxDrawdown, value / peak - 1); });
  return { cagr, volatility, sharpe: volatility > 0 ? (arithmeticAnnual - riskFree) / volatility : 0, maxDrawdown, path };
}

function seededRandom(seed = 9137) {
  let state = seed;
  return () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
}

function samplePortfolios(count, assetCount, meanAnnual, covariance, riskFree) {
  const random = seededRandom(48193 + assetCount);
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    let weights;
    let attempts = 0;
    do {
      const raw = Array.from({ length: assetCount }, () => -Math.log(Math.max(1e-9, random())));
      const total = raw.reduce((sum, value) => sum + value, 0);
      weights = raw.map((value) => value / total);
      attempts += 1;
    } while (Math.max(...weights) > Math.max(.55, 1 / assetCount) && attempts < 30);
    const metrics = portfolioEvaluation(weights, meanAnnual, covariance, riskFree);
    samples.push({ ...metrics, weights });
  }
  return samples;
}

function calculateAnalysis(aligned) {
  const weights = currentWeights();
  const riskFree = Number(portfolio.riskFreeRate || 0) / 100;
  const covariance = covarianceMatrix(aligned.returns);
  const meanAnnual = aligned.returns[0].map((_, assetIndex) => mean(aligned.returns.map((row) => row[assetIndex])) * TRADING_DAYS);
  const optimizedWeights = optimizeWeights(weights, meanAnnual, covariance, riskFree, portfolio.objective);
  const current = pathMetrics(aligned.returns, weights, riskFree);
  const optimized = pathMetrics(aligned.returns, optimizedWeights, riskFree);
  const currentEstimate = portfolioEvaluation(weights, meanAnnual, covariance, riskFree);
  const optimizedEstimate = portfolioEvaluation(optimizedWeights, meanAnnual, covariance, riskFree);
  const samples = samplePortfolios(1400, weights.length, meanAnnual, covariance, riskFree);
  const correlations = correlationMatrix(aligned.returns);
  return { ...aligned, weights, optimizedWeights, current, optimized, currentEstimate, optimizedEstimate, samples, correlations, riskFree };
}

async function runAnalysis() {
  if (portfolio.positions.length < 2) return setMessage('Añade al menos dos activos para realizar el análisis.', true);
  if (portfolio.positions.some((position) => !(Number(position.capital) > 0))) return setMessage('Todos los activos deben tener un capital mayor que cero.', true);
  const button = mountNode.querySelector('#nrp-analyze');
  button.disabled = true;
  button.textContent = 'Comprobando cierres diarios…';
  setMessage('Descargando las series reales y comprobando fechas comunes.');
  try {
    const series = await Promise.all(portfolio.positions.map((position) => loadSeries(position.assetId)));
    const missing = series.map((points, index) => points.length ? null : portfolio.positions[index].ticker).filter(Boolean);
    if (missing.length) throw new Error(`No hay históricos diarios disponibles para: ${missing.join(', ')}.`);
    const seriesByAsset = Object.fromEntries(portfolio.positions.map((position, index) => [position.assetId, series[index]]));
    const aligned = buildAlignedData(seriesByAsset);
    activeAnalysis = calculateAnalysis(aligned);
    renderAnalysis(activeAnalysis);
    const currencies = [...new Set(portfolio.positions.map((position) => position.currency).filter(Boolean))];
    setMessage(`${aligned.returns.length} sesiones comunes analizadas. Último cierre: ${formatDate(aligned.endDate)}.${currencies.length > 1 ? ' La cartera contiene varias divisas y la lectura no incorpora todavía el efecto del tipo de cambio.' : ''}`);
    saveLocalPortfolio();
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'No se ha podido completar el análisis.', true);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Calcular análisis con cierres reales <span aria-hidden="true">→</span>';
  }
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function metricCard(label, value, note, highlight = false) {
  return `<article class="nrp-metric${highlight ? ' is-highlight' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

function allocationCard(title, weights, optimized = false) {
  return `<article class="nrp-allocation${optimized ? ' is-optimized' : ''}"><h4>${escapeHtml(title)}</h4>${weights.map((weight, index) => `
    <div class="nrp-weight-row"><b>${escapeHtml(portfolio.positions[index].ticker)}</b><span class="nrp-bar"><i style="width:${Math.max(1, weight * 100)}%"></i></span><span>${number.format(weight * 100)} %</span></div>`).join('')}</article>`;
}

function renderAnalysis(analysis) {
  const summary = mountNode.querySelector('#nrp-summary');
  const results = mountNode.querySelector('#nrp-results');
  const currencies = [...new Set(portfolio.positions.map((position) => position.currency).filter(Boolean))];
  summary.innerHTML = `
    <div class="nrp-card">
      <div class="nrp-summary-head"><div><p class="nrp-section-label">02 · Diagnóstico histórico</p><h3>${escapeHtml(portfolio.portfolioName)}</h3><p class="nrp-card-sub">Lectura de la cartera actual con pesos calculados desde el capital introducido.</p></div><p class="nrp-asof">${escapeHtml(portfolio.clientName)}<br>Datos hasta ${formatDate(analysis.endDate)}</p></div>
      <div class="nrp-metrics" style="margin-top:18px">
        ${metricCard('Rentabilidad anualizada', percent(analysis.current.cagr), 'CAGR del periodo común')}
        ${metricCard('Volatilidad anual', percent(analysis.current.volatility), 'Desviación estándar × √252')}
        ${metricCard('Ratio de Sharpe', number.format(analysis.current.sharpe), `Referencia ${number.format(analysis.riskFree * 100)} %`)}
        ${metricCard('Máxima caída', percent(analysis.current.maxDrawdown), 'Drawdown histórico observado')}
      </div>
      <div class="nrp-allocation-compare" style="margin-top:14px">
        ${allocationCard('Cartera actual', analysis.weights)}
        ${allocationCard(portfolio.objective === 'min_volatility' ? 'Propuesta de menor volatilidad' : 'Propuesta de mejor equilibrio', analysis.optimizedWeights, true)}
      </div>
      <div class="nrp-metrics" style="margin-top:14px">
        ${metricCard('Rentabilidad propuesta', percent(analysis.optimized.cagr), 'Aplicada al mismo histórico', true)}
        ${metricCard('Volatilidad propuesta', percent(analysis.optimized.volatility), 'Misma ventana temporal', true)}
        ${metricCard('Sharpe propuesto', number.format(analysis.optimized.sharpe), 'Optimización sin posiciones cortas', true)}
        ${metricCard('Caída propuesta', percent(analysis.optimized.maxDrawdown), 'Backtest sobre cierres reales', true)}
      </div>
    </div>`;

  results.innerHTML = `
    <div class="nrp-charts-grid">
      ${chartCard('03 · Evolución', 'Crecimiento comparado', `Base 100 · ${formatDate(analysis.startDate)} — ${formatDate(analysis.endDate)}`, growthChart(analysis), '<span style="--legend:#0B2347"><i></i>Cartera actual</span><span style="--legend:#B78B3B"><i></i>Propuesta</span>', 'El gráfico aplica ambos repartos al mismo conjunto de cierres diarios. No incluye aportaciones, costes ni fiscalidad.')}
      ${chartCard('04 · Riesgo y retorno', 'Frontera de carteras', `${analysis.samples.length} combinaciones · sin posiciones cortas`, frontierChart(analysis), '<span style="--legend:#0B2347"><i></i>Actual</span><span style="--legend:#B78B3B"><i></i>Propuesta</span><span style="--legend:#BBC6D2"><i></i>Combinaciones</span>', 'Más arriba implica mayor rentabilidad histórica anualizada; más a la izquierda, menor volatilidad.')}
    </div>
    <div class="nrp-charts-grid">
      ${chartCard('05 · Dependencias', 'Matriz de correlación', `${analysis.returns.length} sesiones comunes`, correlationTable(analysis), '', 'Valores próximos a 1 se mueven de forma parecida; próximos a 0 muestran menor relación histórica.')}
      ${chartCard('06 · Calidad del dato', 'Cobertura utilizada', 'Históricos reales · frecuencia diaria', coveragePanel(analysis, currencies), '', 'La fecha efectiva depende del mercado y del instrumento. Los fondos pueden publicar su valor liquidativo con retraso.')}
    </div>`;
  requestParentResize();
}

function chartCard(kicker, title, meta, body, legend, note) {
  return `<section class="nrp-chart-card"><div class="nrp-chart-heading"><div><p class="nrp-section-label">${escapeHtml(kicker)}</p><h3>${escapeHtml(title)}</h3></div><p class="nrp-chart-meta">${escapeHtml(meta)}</p></div><div class="nrp-chart">${body}</div>${legend ? `<div class="nrp-legend">${legend}</div>` : ''}<p class="nrp-chart-note">${escapeHtml(note)}</p></section>`;
}

function linePath(values, width, height, padding, minValue, maxValue) {
  const usableW = width - padding.left - padding.right;
  const usableH = height - padding.top - padding.bottom;
  return values.map((value, index) => {
    const x = padding.left + (index / Math.max(1, values.length - 1)) * usableW;
    const y = padding.top + (1 - (value - minValue) / Math.max(1e-9, maxValue - minValue)) * usableH;
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function growthChart(analysis) {
  const width = 760; const height = 360; const padding = { left: 58, right: 22, top: 20, bottom: 43 };
  const values = [...analysis.current.path, ...analysis.optimized.path];
  const minValue = Math.min(...values) * .97; const maxValue = Math.max(...values) * 1.03;
  const ticks = Array.from({ length: 5 }, (_, index) => minValue + (maxValue - minValue) * index / 4);
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución histórica de la cartera actual y propuesta">
    <defs><linearGradient id="nrpGrowthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2347" stop-opacity=".12"/><stop offset="1" stop-color="#0B2347" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((tick) => { const y = padding.top + (1 - (tick - minValue) / (maxValue - minValue)) * (height - padding.top - padding.bottom); return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E5EAF0"/><text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#7B8797" font-size="10">${number.format(tick)}</text>`; }).join('')}
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#C9D4DF"/>
    <path d="${linePath(analysis.current.path, width, height, padding, minValue, maxValue)}" fill="none" stroke="#0B2347" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${linePath(analysis.optimized.path, width, height, padding, minValue, maxValue)}" fill="none" stroke="#B78B3B" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${padding.left}" y="${height - 14}" fill="#7B8797" font-size="10">${analysis.startDate.slice(0,7)}</text><text x="${width-padding.right}" y="${height - 14}" text-anchor="end" fill="#7B8797" font-size="10">${analysis.endDate.slice(0,7)}</text>
    <text x="${width-padding.right}" y="${padding.top + 3}" text-anchor="end" fill="#0B2347" font-size="11" font-weight="700">Actual ${number.format(analysis.current.path.at(-1))}</text>
    <text x="${width-padding.right}" y="${padding.top + 19}" text-anchor="end" fill="#9B742F" font-size="11" font-weight="700">Propuesta ${number.format(analysis.optimized.path.at(-1))}</text>
  </svg>`;
}

function frontierChart(analysis) {
  const width = 680; const height = 360; const padding = { left: 62, right: 25, top: 22, bottom: 50 };
  const currentEval = analysis.currentEstimate;
  const optimizedEval = analysis.optimizedEstimate;
  const points = [...analysis.samples, currentEval, optimizedEval];
  const minX = Math.max(0, Math.min(...points.map((point) => point.volatility)) * .82);
  const maxX = Math.max(...points.map((point) => point.volatility)) * 1.08;
  const minY = Math.min(...points.map((point) => point.expected)) * .92;
  const maxY = Math.max(...points.map((point) => point.expected)) * 1.08;
  const x = (value) => padding.left + (value - minX) / Math.max(1e-9, maxX - minX) * (width - padding.left - padding.right);
  const y = (value) => padding.top + (1 - (value - minY) / Math.max(1e-9, maxY - minY)) * (height - padding.top - padding.bottom);
  const sorted = [...analysis.samples].sort((a,b) => a.volatility - b.volatility);
  let highest = -Infinity;
  const frontier = sorted.filter((point) => { if (point.expected > highest) { highest = point.expected; return true; } return false; });
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Plano de riesgo y rentabilidad con frontera de combinaciones">
    ${[0,.25,.5,.75,1].map((ratio) => { const gx=padding.left+ratio*(width-padding.left-padding.right); const gy=padding.top+ratio*(height-padding.top-padding.bottom); return `<line x1="${gx}" y1="${padding.top}" x2="${gx}" y2="${height-padding.bottom}" stroke="#EDF1F4"/><line x1="${padding.left}" y1="${gy}" x2="${width-padding.right}" y2="${gy}" stroke="#EDF1F4"/>`; }).join('')}
    ${analysis.samples.filter((_, index) => index % 5 === 0).map((point) => `<circle cx="${x(point.volatility)}" cy="${y(point.expected)}" r="2" fill="#AEBAC6" opacity=".34"/>`).join('')}
    <path d="${frontier.map((point,index)=>`${index?'L':'M'}${x(point.volatility)},${y(point.expected)}`).join(' ')}" fill="none" stroke="#78933D" stroke-width="1.7" stroke-linecap="round" opacity=".9"/>
    <circle cx="${x(currentEval.volatility)}" cy="${y(currentEval.expected)}" r="8" fill="#0B2347" stroke="#fff" stroke-width="3"/><text x="${x(currentEval.volatility)+12}" y="${y(currentEval.expected)+4}" fill="#0B2347" font-size="11" font-weight="700">Actual</text>
    <circle cx="${x(optimizedEval.volatility)}" cy="${y(optimizedEval.expected)}" r="9" fill="#B78B3B" stroke="#fff" stroke-width="3"/><text x="${x(optimizedEval.volatility)+12}" y="${y(optimizedEval.expected)-8}" fill="#8A6428" font-size="11" font-weight="700">Propuesta</text>
    <text x="${(padding.left+width-padding.right)/2}" y="${height-12}" text-anchor="middle" fill="#65758A" font-size="11">Volatilidad anualizada</text><text transform="translate(15 ${(padding.top+height-padding.bottom)/2}) rotate(-90)" text-anchor="middle" fill="#65758A" font-size="11">Rentabilidad anualizada</text>
    <text x="${padding.left}" y="${height-padding.bottom+17}" text-anchor="middle" fill="#7B8797" font-size="9">${percent(minX,1)}</text><text x="${width-padding.right}" y="${height-padding.bottom+17}" text-anchor="middle" fill="#7B8797" font-size="9">${percent(maxX,1)}</text>
  </svg>`;
}

function correlationTable(analysis) {
  const tickers = portfolio.positions.map((position) => position.ticker);
  return `<div class="nrp-correlation"><table><thead><tr><th></th>${tickers.map((ticker) => `<th>${escapeHtml(ticker)}</th>`).join('')}</tr></thead><tbody>${analysis.correlations.map((row, i) => `<tr><td>${escapeHtml(tickers[i])}</td>${row.map((value) => {
    const intensity = Math.min(1, Math.abs(value));
    const color = value >= 0 ? `rgba(11,35,71,${.2 + intensity * .75})` : `rgba(116,38,60,${.2 + intensity * .75})`;
    return `<td style="background:${color}">${number.format(value)}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function coveragePanel(analysis, currencies) {
  return `<div style="display:grid;gap:10px">${portfolio.positions.map((position, index) => `
    <div style="display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;padding:13px;border:1px solid #E1E7ED;border-radius:14px;background:#FBFAF6">
      <b style="font-size:13px">${escapeHtml(position.ticker)}</b><div><div style="height:7px;border-radius:999px;background:#E8EDF1"><i style="display:block;width:100%;height:100%;border-radius:inherit;background:${COLORS[index % COLORS.length]}"></i></div><small style="display:block;margin-top:5px;color:#718095;font-size:9px">${analysis.returns.length} retornos comunes</small></div><span style="color:#586A80;font-size:10px">${escapeHtml(position.currency || '—')}</span>
    </div>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px"><div class="nrp-metric"><span>Inicio común</span><strong style="font-size:19px">${formatDate(analysis.startDate)}</strong><small>Primera fecha compartida</small></div><div class="nrp-metric"><span>Último cierre</span><strong style="font-size:19px">${formatDate(analysis.endDate)}</strong><small>${currencies.length > 1 ? 'Varias divisas · sin conversión FX' : `Divisa ${currencies[0] || '—'}`}</small></div></div>`;
}

function requestParentResize() {
  setTimeout(() => {
    window.parent?.postMessage({ source: 'nuvia-core', type: 'resize', height: document.documentElement.scrollHeight }, window.location.origin);
  }, 80);
}

function attachToPortfolioPanel() {
  const panel = document.querySelector('#analytics-panel-portfolio');
  if (!panel) return false;
  const portfolioTab = document.querySelector('#analytics-tab-portfolio');
  if (portfolioTab) {
    [...portfolioTab.querySelectorAll('*')].forEach((node) => {
      if (node.children.length === 0 && node.textContent.trim() === 'Laboratorio de cartera') node.textContent = 'Análisis de cartera real';
      if (node.children.length === 0 && node.textContent.trim() === 'Distribución y riesgo') node.textContent = 'Cartera y riesgo';
    });
    portfolioTab.setAttribute('aria-label', 'Análisis de cartera real con cierres diarios');
  }
  if (!mountNode || !document.contains(mountNode)) {
    mountNode = document.createElement('div');
    mountNode.id = 'nuvia-real-portfolio-root';
    panel.appendChild(mountNode);
  }
  [...panel.children].forEach((child) => {
    if (child !== mountNode) {
      child.classList.add('nrp-replaced');
      child.style.setProperty('display', 'none', 'important');
    }
  });
  if (!mountNode.dataset.ready) {
    mountNode.dataset.ready = 'loading';
    loadCatalog().then(({ manifest }) => {
      resolveDefaultPositions();
      renderApp(manifest);
      mountNode.dataset.ready = 'true';
      requestParentResize();
    }).catch((error) => {
      mountNode.innerHTML = `<div class="nuvia-real-portfolio"><div class="nrp-empty"><div><strong>No se ha podido abrir la fuente diaria</strong><p>${escapeHtml(error instanceof Error ? error.message : 'Error desconocido')}</p></div></div></div>`;
      mountNode.dataset.ready = 'error';
    });
  }
  return true;
}

if (new URLSearchParams(location.search).get('portfolioPreview') === '1') {
  const observer = new MutationObserver(() => attachToPortfolioPanel());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  attachToPortfolioPanel();
}

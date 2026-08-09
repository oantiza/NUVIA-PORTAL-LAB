(function () {
  'use strict';
  // NUVIA Web 2 — integración v2 (rediseño canónico).
  // Cambios vs v1: SIN redirecciones a core/ — las 12 páginas rediseñadas son las que se ven.
  // core/ sigue publicado y accesible directamente en ./core/index.html.
  // En la portada: hidrata noticia del día + indicadores macro (data-*) y monta el ticker
  // en vivo de TradingView DENTRO del panel navy del rediseño (#nuvia-live-market-ticker),
  // manteniendo su cabecera, bordes y fundidos laterales. Sin red, queda el contenido estático.

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // Enlaces profundos a la app completa (core/). NO se redirige a ellos: se publican en
  // window.NUVIA_CORE_LINKS como referencia navegable y para la validación de paridad
  // (scripts/check-parity.mjs exige estas rutas funcionales en este fichero).
  const CORE_DEEP_LINKS = {
    'academia.html': 'core/index.html?educationGuide=1',
    'cartera.html': 'core/index.html?portfolioPreview=1',
    'curso.html': 'core/index.html?educationGuide=1&tab=curso',
    'fiscalidad.html': 'core/index.html?topic=mis-impuestos',
    'guia-fiscal.html': 'core/index.html?view=retirement-fiscal-guide',
    'guia-planificacion.html': 'core/index.html?view=retirement-planning-guide',
    'jubilacion.html': 'core/index.html?view=retirement-simulator',
    'lecturas.html': 'core/index.html?lecturasConCriterio=1',
    'vivienda.html': 'core/index.html?topic=vivienda-coste-vida',
    'mercados.html': {
      diario: 'core/index.html?view=daily-report',
      archivo: 'core/index.html?view=archive',
      semanal: 'core/index.html?view=weekly',
    },
  };
  window.NUVIA_CORE_LINKS = CORE_DEEP_LINKS;

  if (page !== 'index.html' && page !== '') return;

  const DIRECTION = {
    up: { symbol: '↗', color: '#e4bd67' },
    down: { symbol: '↘', color: '#a8c97a' },
    stable: { symbol: '→', color: '#b9c7d8' },
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && typeof value === 'string') element.textContent = value;
  };

  const hydrateDailyContent = async () => {
    try {
      const response = await fetch('./data/daily-content.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const news = payload.dailyEconomicNews;

      if (news) {
        setText('[data-daily-news="date"]', news.selectionDate);
        setText('[data-daily-news="title"]', news.title);
        setText('[data-daily-news="summary"]', news.summary);
        setText('[data-daily-news="why"]', news.whyItMatters);
        setText('[data-daily-news="source"]', `Fuente: ${news.sourceName} · Publicada el ${news.sourcePublishedAt}`);

        const sourceLink = document.querySelector('[data-daily-news="source-link"]');
        if (sourceLink && news.sourceUrl) sourceLink.href = news.sourceUrl;

        const image = document.querySelector('[data-daily-news="image"]');
        if (image && news.imageAlt) image.alt = news.imageAlt;

        document.querySelectorAll('[data-daily-impact]').forEach((element, index) => {
          if (news.impactPoints?.[index]) element.textContent = news.impactPoints[index];
        });
      }

      setText('[data-macro-updated]', `Datos oficiales revisados a diario · ${payload.macroIndicatorsUpdatedAt}`);
      const indicators = Array.isArray(payload.dailyMacroIndicators) ? payload.dailyMacroIndicators : [];
      indicators.forEach((indicator) => {
        const card = document.querySelector(`[data-macro-id="${indicator.id}"]`);
        if (!card) return;
        const fields = {
          label: indicator.label,
          value: indicator.value,
          change: indicator.change,
          period: indicator.period,
          context: indicator.context,
        };
        Object.entries(fields).forEach(([field, value]) => {
          const element = card.querySelector(`[data-macro-field="${field}"]`);
          if (element && typeof value === 'string') element.textContent = value;
        });
        const source = card.querySelector('[data-macro-field="source"]');
        if (source) {
          source.textContent = `${indicator.sourceName} · ${indicator.referenceDate}`;
          source.href = indicator.sourceUrl;
        }
        const direction = DIRECTION[indicator.direction];
        if (direction) {
          const arrow = card.querySelector('[data-macro-field="direction"]');
          if (arrow) { arrow.textContent = direction.symbol; arrow.style.color = direction.color; }
          const change = card.querySelector('[data-macro-field="change"]');
          if (change) change.style.color = direction.color;
        }
      });
    } catch (error) {
      console.warn('NUVIA Web 2 mantiene el último contenido editorial disponible.', error);
    }
  };

  const mountTradingView = () => {
    const container = document.getElementById('nuvia-live-market-ticker');
    if (!container) return;

    container.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    const attribution = document.createElement('div');
    attribution.className = 'tradingview-widget-copyright';
    attribution.style.cssText = 'text-align:right;padding:2px 16px 7px;color:rgba(255,255,255,.42);font-size:10px;line-height:1.2';
    attribution.innerHTML = '<a href="https://www.tradingview.com/markets/" target="_blank" rel="noopener nofollow" style="color:rgba(243,223,181,.7);text-decoration:none">Ticker tape</a> by TradingView';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.text = JSON.stringify({
      symbols: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'NASDAQ:NDX', title: 'Nasdaq 100' },
        { proName: 'DJ:DJI', title: 'Dow Jones' },
        { proName: 'INDEX:SX5E', title: 'Euro Stoxx 50' },
        { proName: 'XETR:DAX', title: 'DAX 40' },
        { proName: 'BME:IBC', title: 'IBEX 35' },
        { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
        { proName: 'FX_IDC:GBPUSD', title: 'GBP/USD' },
        { proName: 'FX_IDC:USDJPY', title: 'USD/JPY' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'es',
    });

    container.append(widget, attribution, script);
  };

  const startHomeIntegration = () => {
    window.setTimeout(() => {
      hydrateDailyContent();
      mountTradingView();
    }, 400);
  };

  if (document.readyState === 'complete') startHomeIntegration();
  else window.addEventListener('load', startHomeIntegration, { once: true });
})();

(function () {
  'use strict';
  // NUVIA Portal Lab — integración v2 (rediseño canónico).
  // La app antigua (core/) se eliminó el 21-08-2026 por encargo de Óscar: las
  // páginas rediseñadas son las únicas; de core/ solo quedan los PDF del curso.
  // En la portada hidrata la noticia del día y monta el ticker; en Mercados hidrata
  // los indicadores macroeconómicos y las tres lecturas editoriales (data-*) con la misma fuente de datos diaria,
  // manteniendo su cabecera, bordes y fundidos laterales. Sin red, queda el contenido estático.

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  if (page !== 'index.html' && page !== '' && page !== 'mercados.html') return;

  /* Los tres colores vivían aquí en crudo y no coincidían con los tokens: la
     flecha de «baja» era #a8c97a y --nv-trend-down es #72c99a, así que el
     indicador cambiaba de tono al hidratarse. Además llegaban por style.color,
     que gana a cualquier hoja. Ahora esto solo decide la clase; el color lo
     pone nuvia-pages.css, igual que en el HTML publicado. */
  const DIRECTION = {
    up: { symbol: '↗', clase: 'is-up' },
    down: { symbol: '↘', clase: 'is-down' },
    stable: { symbol: '→', clase: 'is-flat' },
  };
  const TENDENCIAS = ['is-up', 'is-down', 'is-flat'];
  const marcarTendencia = (elemento, clase) => {
    if (!elemento) return;
    elemento.classList.remove(...TENDENCIAS);
    elemento.classList.add(clase);
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && typeof value === 'string') element.textContent = value;
  };

  const madridDateKey = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.valueOf())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const readableAttempt = (value) => {
    const date = new Date(value || 0);
    if (Number.isNaN(date.valueOf())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(date).replace(/\./g, '');
  };

  const mountSecondaryNewsDialog = (newsItems) => {
    const dialog = document.getElementById('market-news-dialog');
    if (!dialog || dialog.dataset.mounted === 'true') return;

    const newsById = new Map(newsItems.map((item) => [item.id, item]));
    const dialogField = (field) => dialog.querySelector(`[data-news-dialog="${field}"]`);
    const openNews = (newsId) => {
      const newsItem = newsById.get(newsId);
      if (!newsItem) return;

      const image = dialogField('image');
      if (image) {
        image.src = newsItem.imageUrl || '';
        image.alt = newsItem.imageAlt || '';
      }
      ['category', 'date', 'title', 'summary', 'why'].forEach((field) => {
        const valueByField = {
          category: newsItem.category,
          date: newsItem.publishedAt,
          title: newsItem.title,
          summary: newsItem.summary,
          why: newsItem.whyItMatters,
        };
        const element = dialogField(field);
        if (element) element.textContent = valueByField[field] || '';
      });
      const dialogDate = dialogField('date');
      if (dialogDate) dialogDate.dateTime = newsItem.publishedAtIso || '';

      const body = dialogField('body');
      if (body) {
        body.replaceChildren();
        (Array.isArray(newsItem.body) ? newsItem.body : []).forEach((paragraph) => {
          const element = document.createElement('p');
          element.textContent = paragraph;
          body.appendChild(element);
        });
      }

      const sourceLink = dialogField('source-link');
      if (sourceLink) {
        sourceLink.href = newsItem.sourceUrl;
        sourceLink.setAttribute('aria-label', `Leer la noticia original en ${newsItem.sourceName}`);
      }
      const dialogSourceName = dialogField('source-name');
      if (dialogSourceName) dialogSourceName.textContent = `Leer en ${newsItem.sourceName}`;

      dialog.showModal();
    };

    document.querySelectorAll('[data-market-news-id]').forEach((card) => {
      card.addEventListener('click', () => openNews(card.dataset.marketNewsId));
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openNews(card.dataset.marketNewsId);
      });
    });
    dialog.querySelector('[data-news-dialog-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.dataset.mounted = 'true';
  };

  const hydrateDailyContent = async () => {
    try {
      const response = await fetch('./data/daily-content.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const news = payload.dailyEconomicNews;

      if (news) {
        const update = payload.editorialUpdate || {};
        const publishedAt = new Date(news.sourcePublishedAtIso || 0);
        const ageHours = Number.isNaN(publishedAt.valueOf()) ? Infinity : Math.max(0, (Date.now() - publishedAt.valueOf()) / 3_600_000);
        const publishedToday = madridDateKey(publishedAt) === madridDateKey(new Date());
        let freshness = 'archive';
        let status = 'Archivo económico';
        if (update.status === 'failed') {
          freshness = ageHours <= 72 ? 'available' : 'archive';
          status = ageHours <= 72 ? 'Última noticia económica disponible' : 'Archivo económico';
        } else if (publishedToday) {
          freshness = 'today';
          status = 'Noticia económica del día';
        } else if (ageHours <= 36) {
          freshness = 'recent';
          status = 'Noticia económica reciente';
        } else if (ageHours <= 72) {
          freshness = 'available';
          status = 'Última noticia económica disponible';
        }
        setText('[data-daily-news="status"]', status);
        setText('[data-daily-news="date"]', news.selectionDate);
        setText('[data-daily-news="category"]', news.category);
        setText('[data-daily-news="title"]', news.title);
        setText('[data-daily-news="summary"]', news.summary);
        setText('[data-daily-news="why"]', news.whyItMatters);
        setText('[data-daily-news="source"]', `Fuente: ${news.sourceName} · Publicada el ${news.sourcePublishedAt}`);
        setText('[data-daily-news="source-name"]', news.sourceName);

        const lead = document.querySelector('.markets-lead-news');
        if (lead) lead.dataset.newsFreshness = freshness;
        const newsDate = document.querySelector('[data-daily-news="date"]');
        if (newsDate) newsDate.dateTime = news.sourcePublishedAtIso || '';

        const attemptedAt = readableAttempt(update.lastAttemptAt);
        const updateStatus = update.status === 'failed'
          ? 'Actualización automática pendiente. Se conserva la última selección con su fecha y fuente.'
          : `Selección automática actualizada${attemptedAt ? ` el ${attemptedAt}` : ''}.`;
        setText('[data-news-update-status]', updateStatus);

        const sourceLink = document.querySelector('[data-daily-news="source-link"]');
        if (sourceLink && news.sourceUrl) sourceLink.href = news.sourceUrl;

        const image = document.querySelector('[data-daily-news="image"]');
        if (image && news.imageUrl) image.src = news.imageUrl;
        if (image && news.imageAlt) image.alt = news.imageAlt;

        document.querySelectorAll('[data-daily-impact]').forEach((element, index) => {
          if (news.impactPoints?.[index]) element.textContent = news.impactPoints[index];
        });
      }

      setText('[data-macro-updated]', `Última comprobación de datos oficiales · ${payload.macroIndicatorsUpdatedAt}`);
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
          if (arrow) { arrow.textContent = direction.symbol; marcarTendencia(arrow, direction.clase); }
          marcarTendencia(card.querySelector('[data-macro-field="change"]'), direction.clase);
        }
      });

      const secondaryNews = Array.isArray(payload.secondaryEconomicNews) ? payload.secondaryEconomicNews : [];
      secondaryNews.forEach((newsItem) => {
        const newsCard = document.querySelector(`[data-market-news-id="${newsItem.id}"]`);
        if (!newsCard) return;
        const label = newsCard.querySelector('[data-market-news-field="label"]');
        const headline = newsCard.querySelector('[data-market-news-field="headline"]');
        const context = newsCard.querySelector('[data-market-news-field="context"]');
        const change = newsCard.querySelector('[data-market-news-field="change"]');
        const image = newsCard.querySelector('[data-market-news-field="image"]');
        const sourceName = newsCard.querySelector('[data-market-news-field="source-name"]');
        if (label) label.textContent = newsItem.category;
        if (headline) headline.textContent = newsItem.title;
        if (context) context.textContent = newsItem.summary;
        if (change) {
          change.textContent = newsItem.publishedAt;
          change.dateTime = newsItem.publishedAtIso || '';
        }
        if (image && newsItem.imageUrl) image.src = newsItem.imageUrl;
        if (image && newsItem.imageAlt) image.alt = newsItem.imageAlt;
        if (sourceName) sourceName.textContent = newsItem.sourceName;
        newsCard.setAttribute('aria-label', `Ampliar noticia: ${newsItem.title}`);
      });
      mountSecondaryNewsDialog(secondaryNews);
    } catch (error) {
      setText('[data-news-update-status]', 'No se ha podido comprobar la actualización. Consulta la fecha y la fuente de cada noticia.');
      console.warn('NUVIA Portal Lab mantiene el último contenido editorial disponible.', error);
    }
  };

  const startHomeIntegration = () => {
    window.setTimeout(() => {
      hydrateDailyContent();
    }, 400);
  };

  if (document.readyState === 'complete') startHomeIntegration();
  else window.addEventListener('load', startHomeIntegration, { once: true });
})();

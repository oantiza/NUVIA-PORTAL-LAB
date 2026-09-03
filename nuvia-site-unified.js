(() => {
  let formularios;
  let estados;
  const scriptBase = document.currentScript.src;
  Promise.all([
    import(new URL('js/nuvia-formularios.js', scriptBase)),
    import(new URL('js/nuvia-estados.js', scriptBase)),
  ]).then(([f, e]) => {
    formularios = f.instalaFormularios(); estados = e;
    scheduleSync();
  }).catch((error) => console.error('No se pudieron cargar los controles locales de NUVIA.', error));
  const route = () => location.pathname.split('/').pop() || 'index.html';
  const currentTopic = () => document.body?.dataset.nuviaTopic
    || new URLSearchParams(location.search).get('topic') || 'jubilacion';

  const areaForRoute = (currentRoute) => {
    if (['mercados.html', 'cartera.html'].includes(currentRoute)) return 'economia';
    if (['academia.html', 'curso.html'].includes(currentRoute)) return 'academy';
    if (currentRoute === 'lecturas.html') return 'lecturas';
    if (currentRoute === 'temas.html' && currentTopic() === 'bienestar') return 'bienestar';
    if (currentRoute.startsWith('guia-') || [
      'temas.html', 'fiscalidad.html', 'jubilacion.html', 'vivienda.html'
    ].includes(currentRoute)) return 'patrimonio';
    return location.hash === '#que-es-nuvia' ? 'nuvia' : 'inicio';
  };

  const pageKindForRoute = (currentRoute) => {
    if (currentRoute === 'index.html') return 'home';
    if (currentRoute === 'lecturas.html') return 'editorial';
    if ([
      'guia-ahorro.html',
      'guia-calendario.html',
      'guia-fiscal.html',
      'guia-planificacion.html',
      'guia-sucesiones.html',
      'guia-impuestos.html'
    ].includes(currentRoute)) return 'guide';
    if (['cartera.html', 'jubilacion.html', 'vivienda.html'].includes(currentRoute)) return 'tool';
    if (['academia.html', 'curso.html'].includes(currentRoute)) return 'academy';
    return 'institutional';
  };

  const normalizeHeadingFlow = (main) => {
    if (!main || main.dataset.nuviaHeadings === 'true') return;
    const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    let previousLevel = 0;
    headings.forEach((heading) => {
      const currentLevel = Number(heading.tagName.slice(1));
      const nextLevel = previousLevel && currentLevel > previousLevel + 1 ? previousLevel + 1 : currentLevel;
      if (nextLevel !== currentLevel) {
        const replacement = document.createElement(`h${nextLevel}`);
        [...heading.attributes].forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
        replacement.innerHTML = heading.innerHTML;
        heading.replaceWith(replacement);
      }
      previousLevel = nextLevel;
    });
    main.dataset.nuviaHeadings = 'true';
  };

  let fieldSequence = 0;
  const controlId = (control) => {
    if (control.id) return control.id;
    const stem = String(control.getAttribute('name') || control.getAttribute('type') || 'control')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'control';
    let candidate = `nuvia-field-${stem}`;
    while (document.getElementById(candidate) && document.getElementById(candidate) !== control) {
      fieldSequence += 1;
      candidate = `nuvia-field-${stem}-${fieldSequence}`;
    }
    control.id = candidate;
    return candidate;
  };

  const normalizeFormAccessibility = (root) => {
    if (!root) return;
    root.querySelectorAll('.nv-field').forEach((field) => {
      const control = field.querySelector('input:not([type="hidden"]), select, textarea');
      if (!control) return;
      const id = controlId(control);
      const label = [...field.children].find((child) => child.tagName === 'LABEL');
      if (label && !label.contains(control)) label.htmlFor = id;

      const descriptions = [...field.querySelectorAll('.nv-field__note, .nv-field__help, [data-field-help]')];
      if (!descriptions.length) return;
      const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      descriptions.forEach((description) => {
        if (!description.id) description.id = `${id}-ayuda-${describedBy.size + 1}`;
        describedBy.add(description.id);
      });
      control.setAttribute('aria-describedby', [...describedBy].join(' '));
    });

    root.querySelectorAll('.nv-field__note, .nv-field__help, [data-field-help]').forEach((description) => {
      if (description.id && root.querySelector(`[aria-describedby~="${CSS.escape(description.id)}"]`)) return;
      const container = description.parentElement;
      const control = container?.querySelector('input:not([type="hidden"]), select, textarea');
      if (!control) return;
      const id = controlId(control);
      if (!description.id) description.id = `${id}-ayuda`;
      const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(description.id);
      control.setAttribute('aria-describedby', [...describedBy].join(' '));
    });
  };

  let tabListSequence = 0;
  const setAttributeIfChanged = (element, name, value) => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  };

  const normalizeToggleGroups = (root) => {
    if (!root) return;
    const selector = [
      '.markets-viewnav',
      '.markets-tools-nav',
      '.ac-x04',
      '.curso-programa',
      '.tm-pills',
    ].join(', ');
    root.querySelectorAll(selector).forEach((group) => {
      setAttributeIfChanged(group, 'role', 'group');
      group.dataset.nuviaToggleGroup = 'true';
      group.querySelectorAll(':scope > button').forEach((button) => {
        const active = button.classList.contains('is-active')
          || button.getAttribute('aria-current') === 'page';
        setAttributeIfChanged(button, 'aria-pressed', String(active));
        button.removeAttribute('aria-current');
      });
    });
  };

  const tabPanelFor = (tabList) => {
    const direct = tabList.nextElementSibling;
    if (direct) return direct;
    return tabList.parentElement?.nextElementSibling || null;
  };

  const normalizeTabAccessibility = (root) => {
    if (!root) return;
    root.querySelectorAll('[role="tablist"]').forEach((tabList) => {
      const tabs = [...tabList.querySelectorAll(':scope > [role="tab"]')];
      if (!tabs.length) return;
      if (!tabList.id) {
        tabListSequence += 1;
        tabList.id = `nuvia-tablist-${tabListSequence}`;
      }
      let selected = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
      tabs.forEach((tab, index) => {
        if (!tab.id) tab.id = `${tabList.id}-tab-${index + 1}`;
        const isSelected = tab === selected;
        setAttributeIfChanged(tab, 'aria-selected', String(isSelected));
        setAttributeIfChanged(tab, 'tabindex', isSelected ? '0' : '-1');
      });

      const panel = tabPanelFor(tabList);
      if (panel) {
        if (!panel.id) panel.id = `${tabList.id}-panel`;
        setAttributeIfChanged(panel, 'role', 'tabpanel');
        setAttributeIfChanged(panel, 'aria-labelledby', selected.id);
        setAttributeIfChanged(panel, 'aria-live', 'polite');
        tabs.forEach((tab) => setAttributeIfChanged(tab, 'aria-controls', panel.id));
      }

      if (tabList.dataset.nuviaKeyboardTabs === 'true') return;
      tabList.dataset.nuviaKeyboardTabs = 'true';
      tabList.addEventListener('keydown', (event) => {
        const currentTabs = [...tabList.querySelectorAll(':scope > [role="tab"]')];
        const currentIndex = currentTabs.indexOf(event.target.closest('[role="tab"]'));
        if (currentIndex < 0) return;
        let nextIndex = currentIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % currentTabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + currentTabs.length) % currentTabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = currentTabs.length - 1;
        else return;
        event.preventDefault();
        currentTabs[nextIndex].tabIndex = 0;
        currentTabs[currentIndex].tabIndex = -1;
        currentTabs[nextIndex].focus();
        currentTabs[nextIndex].click();
      });
    });
  };

  let tradingViewLoader;
  const loadExternalFrame = (host) => {
    const iframe = document.createElement('iframe');
    iframe.src = host.dataset.src;
    iframe.title = host.dataset.title || 'Contenido externo';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    host.replaceChildren(iframe);
    host.dataset.nuviaExternalLoaded = 'true';
  };

  const loadTradingView = async (host) => {
    const template = host.querySelector('template');
    if (!template) throw new Error('No se encontró la plantilla del panel de mercado.');
    if (!tradingViewLoader) {
      tradingViewLoader = new Promise((resolveLoad, rejectLoad) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = host.dataset.script;
        script.addEventListener('load', resolveLoad, { once: true });
        script.addEventListener('error', () => rejectLoad(new Error('No se pudo cargar TradingView.')), { once: true });
        document.head.appendChild(script);
      });
    }
    await tradingViewLoader;
    await customElements.whenDefined('tv-market-overview');
    host.replaceChildren(template.content.cloneNode(true));
    host.dataset.nuviaExternalLoaded = 'true';
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-nuvia-external-load]');
    if (!button) return;
    const host = button.closest('[data-nuvia-external-frame], [data-nuvia-external-widget]');
    if (!host || host.dataset.nuviaExternalLoaded === 'true' || host.getAttribute('aria-busy') === 'true') return;
    host.setAttribute('aria-busy', 'true');
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = 'Cargando…';
    try {
      if (host.hasAttribute('data-nuvia-external-frame')) loadExternalFrame(host);
      else await loadTradingView(host);
    } catch (error) {
      button.disabled = false;
      button.textContent = originalLabel;
      const status = host.querySelector('[data-nuvia-external-status]');
      if (status) status.textContent = error.message || 'No se pudo cargar el contenido externo.';
    } finally {
      host.removeAttribute('aria-busy');
    }
  });

  const synchronizeNavigation = (nav, currentRoute, activeArea) => {
    nav.querySelectorAll('[data-nav-area]').forEach((group) => {
      group.classList.toggle('is-active', group.dataset.navArea === activeArea);
    });
    nav.querySelectorAll('a').forEach((link) => {
      const target = new URL(link.getAttribute('href'), location.href);
      const targetRoute = target.pathname.split('/').pop() || 'index.html';
      let active = targetRoute === currentRoute;
      if (active && currentRoute === 'academia.html') {
        active = (target.searchParams.get('tab') || 'inicio')
          === (new URLSearchParams(location.search).get('tab') || 'inicio');
      } else if (active && currentRoute === 'temas.html') {
        active = target.searchParams.get('topic') === currentTopic();
      } else if (active && currentRoute === 'index.html') {
        active = activeArea === 'nuvia' ? target.hash === '#que-es-nuvia' : !target.hash;
      }
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const synchronize = () => {
    const currentRoute = route();
    const activeArea = areaForRoute(currentRoute);
    const pageKind = pageKindForRoute(currentRoute);

    document.documentElement.lang = 'es';
    document.body?.classList.add('nuvia-unified', `nuvia-page-${pageKind}`, `nuvia-route-${currentRoute.replace('.html', '')}`);

    const header = document.querySelector('header[data-screen-label="Header"], header');
    if (header) {
      header.classList.add('nuvia-global-header');
      const nav = header.querySelector('.nuvia-site-nav');
      if (nav) synchronizeNavigation(nav, currentRoute, activeArea);
    }

    document.querySelectorAll('footer').forEach((footer) => footer.classList.add('nuvia-global-footer'));
    normalizeHeadingFlow(document.querySelector('main'));
    const main = document.querySelector('main');
    normalizeFormAccessibility(main);
    normalizeToggleGroups(main);
    normalizeTabAccessibility(main);
    formularios?.sincroniza();
    if (main) {
      estados?.senalaDestinosPendientes(document.body);
      estados?.sincronizaAtajos(main);
    }
  };

  // Native details/summary keeps keyboard support without replacing React nodes.
  // Scope events to the main header; breadcrumb menus and content accordions stay independent.
  const dropdownSelector = '.nuvia-site-nav > .nuvia-site-nav__topics';
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('a[data-result-anchor][aria-disabled="true"]')) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('toggle', (event) => {
    const opened = event.target;
    if (!(opened instanceof Element) || !opened.matches(dropdownSelector) || !opened.open) return;
    document.querySelectorAll(dropdownSelector + '[open]').forEach((dropdown) => {
      if (dropdown !== opened) dropdown.removeAttribute('open');
    });
  }, true);
  document.addEventListener('click', (event) => {
    document.querySelectorAll(dropdownSelector + '[open]').forEach((dropdown) => {
      if (!dropdown.contains(event.target) || event.target.closest('a')) dropdown.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll(dropdownSelector + '[open]').forEach((dropdown) => {
      dropdown.removeAttribute('open');
      dropdown.querySelector('summary')?.focus();
    });
  });

  let scheduled = false;
  const scheduleSync = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      synchronize();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
  else scheduleSync();
  window.addEventListener('hashchange', scheduleSync);
  window.addEventListener('popstate', scheduleSync);

  const observer = new MutationObserver((records) => {
    // React puede cambiar de capítulo sin añadir nodos. También sincronizar
    // sus botones cuando cambia la clase activa o aria-current; no observar
    // aria-pressed, que escribe esta misma capa, ni clases ajenas al grupo.
    if (records.some((record) => record.type === 'childList'
      || (record.target instanceof Element
        && record.target.matches('[data-nuvia-toggle-group="true"] > button')))) scheduleSync();
  });
  observer.observe(document, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'aria-current'],
  });
})();

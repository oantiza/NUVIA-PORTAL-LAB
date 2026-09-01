(() => {
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
    normalizeFormAccessibility(document.querySelector('main'));
  };

  // Native details/summary keeps keyboard support without replacing React nodes.
  // Scope events to the main header; breadcrumb menus and content accordions stay independent.
  const dropdownSelector = '.nuvia-site-nav > .nuvia-site-nav__topics';
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

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document, { childList: true, subtree: true });
})();

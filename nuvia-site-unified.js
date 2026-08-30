(() => {
  const navigation = [
    { id: 'inicio', label: 'Inicio', href: 'index.html' },
    { id: 'mercados', label: 'Mercados', href: 'mercados.html' },
    { id: 'cartera', label: 'Analítica de cartera', href: 'cartera.html' },
    { id: 'academy', label: 'Academia', href: 'academia.html' },
    {
      id: 'temas',
      label: 'Temas clave',
      children: [
        { label: 'Vivienda y coste de vida', href: 'vivienda.html' },
        { label: 'Mis impuestos', href: 'fiscalidad.html' },
        { label: 'Jubilación', href: 'temas.html?topic=jubilacion' },
        { label: 'Cuerpo, mente y salud', href: 'temas.html?topic=bienestar' }
      ]
    },
    { id: 'lecturas', label: 'Lecturas', href: 'lecturas.html' },
    { id: 'nuvia', label: 'Qué es NUVIA', href: 'index.html#que-es-nuvia' }
  ];

  const route = () => location.pathname.split('/').pop() || 'index.html';

  const areaForRoute = (currentRoute) => {
    if (currentRoute === 'mercados.html') return 'mercados';
    if (currentRoute === 'cartera.html') return 'cartera';
    if (['academia.html', 'curso.html'].includes(currentRoute)) return 'academy';
    if (currentRoute === 'lecturas.html') return 'lecturas';
    if ([
      'temas.html',
      'fiscalidad.html',
      'jubilacion.html',
      'vivienda.html',
      'guia-ahorro.html',
      'guia-calendario.html',
      'guia-fiscal.html',
      'guia-planificacion.html',
      'guia-sucesiones.html',
      'guia-impuestos.html'
    ].includes(currentRoute)) return 'temas';
    return 'inicio';
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

  const synchronize = () => {
    const currentRoute = route();
    const activeArea = areaForRoute(currentRoute);
    const pageKind = pageKindForRoute(currentRoute);

    document.documentElement.lang = 'es';
    document.body?.classList.add('nuvia-unified', `nuvia-page-${pageKind}`, `nuvia-route-${currentRoute.replace('.html', '')}`);

    const header = document.querySelector('header[data-screen-label="Header"], header');
    if (header) {
      header.classList.add('nuvia-global-header');
      const nav = header.querySelector('nav');
      if (nav && nav.dataset.nuviaUnified !== 'true') {
        nav.className = 'nuvia-global-nav';
        nav.setAttribute('aria-label', 'Navegación principal');
        nav.replaceChildren(...navigation.map((item) => {
          if (item.children) {
            const dropdown = document.createElement('details');
            dropdown.className = 'nuvia-global-nav__dropdown';

            const summary = document.createElement('summary');
            summary.className = 'nuvia-global-nav__link nuvia-global-nav__summary';
            summary.append(document.createTextNode(item.label));
            const arrow = document.createElement('span');
            arrow.className = 'nuvia-global-nav__arrow';
            arrow.setAttribute('aria-hidden', 'true');
            summary.append(arrow);
            if (item.id === activeArea) summary.setAttribute('aria-current', 'page');

            const menu = document.createElement('div');
            menu.className = 'nuvia-global-nav__menu';
            menu.setAttribute('aria-label', item.label);
            item.children.forEach((child) => {
              const childLink = document.createElement('a');
              childLink.href = child.href;
              childLink.textContent = child.label;
              childLink.addEventListener('click', () => dropdown.removeAttribute('open'));
              menu.append(childLink);
            });

            dropdown.append(summary, menu);
            return dropdown;
          }
          const link = document.createElement('a');
          link.href = item.href;
          link.textContent = item.label;
          link.className = 'nuvia-global-nav__link';
          if (item.id === activeArea) link.setAttribute('aria-current', 'page');
          return link;
        }));
        nav.dataset.nuviaUnified = 'true';

        if (document.documentElement.dataset.nuviaDropdownReady !== 'true') {
          document.addEventListener('click', (event) => {
            document.querySelectorAll('.nuvia-global-nav__dropdown[open]').forEach((dropdown) => {
              if (!dropdown.contains(event.target)) dropdown.removeAttribute('open');
            });
          });
          document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            document.querySelectorAll('.nuvia-global-nav__dropdown[open]').forEach((dropdown) => {
              dropdown.removeAttribute('open');
              dropdown.querySelector('summary')?.focus();
            });
          });
          document.documentElement.dataset.nuviaDropdownReady = 'true';
        }
      }
    }

    document.querySelectorAll('footer').forEach((footer) => footer.classList.add('nuvia-global-footer'));
    normalizeHeadingFlow(document.querySelector('main'));
  };

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

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document, { childList: true, subtree: true });
})();

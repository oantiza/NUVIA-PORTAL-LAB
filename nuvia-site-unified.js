(() => {
  const navigation = [
    { id: 'inicio', label: 'Inicio', href: 'index.html' },
    { id: 'mercados', label: 'Mercados', href: 'mercados.html' },
    { id: 'cartera', label: 'Analítica de cartera', href: 'cartera.html' },
    { id: 'temas', label: 'Temas clave', href: 'temas.html' },
    { id: 'academy', label: 'Academia', href: 'academia.html' },
    { id: 'lecturas', label: 'Lecturas', href: 'lecturas.html' },
    { id: 'nuvia', label: 'Qué es NUVIA', href: 'index.html#que-es-nuvia' }
  ];

  const route = () => location.pathname.split('/').pop() || 'index.html';

  const areaForRoute = (currentRoute) => {
    if (currentRoute === 'mercados.html') return 'mercados';
    if (currentRoute === 'cartera.html') return 'cartera';
    if (['academia.html', 'curso.html'].includes(currentRoute)) return 'academy';
    if (currentRoute === 'lecturas.html') return 'lecturas';
    if (['temas.html', 'fiscalidad.html', 'jubilacion.html', 'vivienda.html', 'guia-fiscal.html', 'guia-planificacion.html', 'guia-impuestos.html'].includes(currentRoute)) return 'temas';
    return 'inicio';
  };

  const pageKindForRoute = (currentRoute) => {
    if (currentRoute === 'index.html') return 'home';
    if (currentRoute === 'lecturas.html') return 'editorial';
    if (['guia-fiscal.html', 'guia-planificacion.html', 'guia-impuestos.html'].includes(currentRoute)) return 'guide';
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
          const link = document.createElement('a');
          link.href = item.href;
          link.textContent = item.label;
          link.className = 'nuvia-global-nav__link';
          if (item.id === activeArea) link.setAttribute('aria-current', 'page');
          return link;
        }));
        nav.dataset.nuviaUnified = 'true';
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

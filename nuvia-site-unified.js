(() => {
  const navigation = [
    { id: 'inicio', label: 'Inicio', href: 'index.html' },
    { id: 'mercados', label: 'Mercados', href: 'mercados.html' },
    { id: 'cartera', label: 'Analítica de cartera', href: 'cartera.html' },
    { id: 'temas', label: 'Temas clave', href: 'temas.html' },
    { id: 'academy', label: 'Academy', href: 'academia.html' },
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

  const homePortalMarkup = `
    <section class="nv-home-portal" id="descubrir" aria-labelledby="nv-home-portal-title">
      <div class="nv-home-container">
        <div class="nv-home-section-intro">
          <div>
            <span class="nv-home-eyebrow">Explora NUVIA</span>
            <h2 id="nv-home-portal-title">Elige por dónde empezar</h2>
          </div>
          <p>Información, herramientas y conocimiento para entender mejor el dinero y tomar decisiones con perspectiva.</p>
        </div>

        <div class="nv-home-door-grid">
          <a class="nv-home-door nv-home-door--markets" href="mercados.html">
            <span class="nv-home-door-number">01</span>
            <span class="nv-home-door-label">Entender el contexto</span>
            <h3>Mercados</h3>
            <p>Las claves del día, explicadas con calma y conectadas con la economía familiar.</p>
            <span class="nv-home-door-action">Ver Mercados <span aria-hidden="true">→</span></span>
          </a>
          <a class="nv-home-door nv-home-door--portfolio" href="cartera.html">
            <span class="nv-home-door-number">02</span>
            <span class="nv-home-door-label">Mirar por dentro</span>
            <h3>Analítica de cartera</h3>
            <p>Distribución, riesgo, tendencia y calidad fundamental en un mismo lenguaje visual.</p>
            <span class="nv-home-door-action">Abrir la suite <span aria-hidden="true">→</span></span>
          </a>
          <a class="nv-home-door nv-home-door--academy" href="academia.html">
            <span class="nv-home-door-number">03</span>
            <span class="nv-home-door-label">Aprender con criterio</span>
            <h3>NUVIA Academy</h3>
            <p>Cursos, guías y simuladores para comprender el dinero paso a paso.</p>
            <span class="nv-home-door-action">Entrar en Academy <span aria-hidden="true">→</span></span>
          </a>
          <a class="nv-home-door nv-home-door--reading" href="lecturas.html">
            <span class="nv-home-door-number">04</span>
            <span class="nv-home-door-label">Leer sin prisa</span>
            <h3>Lecturas con criterio</h3>
            <p>Libros e ideas que ayudan a pensar mejor sobre el patrimonio y el largo plazo.</p>
            <span class="nv-home-door-action">Explorar Lecturas <span aria-hidden="true">→</span></span>
          </a>
        </div>
      </div>
    </section>

    <section class="nv-home-feature" aria-labelledby="nv-home-feature-title">
      <div class="nv-home-container nv-home-feature-grid">
        <div class="nv-home-feature-copy">
          <span class="nv-home-eyebrow nv-home-eyebrow--light">Esta semana en NUVIA</span>
          <h2 id="nv-home-feature-title">Saber es patrimonio</h2>
          <p>Una fuente de conocimiento para entender el dinero con calma: desde la primera cuenta hasta el plan de toda una familia.</p>
          <div class="nv-home-feature-actions">
            <a class="nv-home-button nv-home-button--light" href="academia.html">Empezar a aprender</a>
            <a class="nv-home-text-link" href="lecturas.html">Ver la selección editorial <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <a class="nv-home-feature-art" href="academia.html" aria-label="Entrar en NUVIA Academy">
          <img src="src/assets/education/nuvia-academy/nuvia-academy-home-banner.jpg" alt="Biblioteca de NUVIA Academy, un espacio para aprender sobre dinero y patrimonio">
        </a>
      </div>
    </section>

    <section class="nv-home-topics" aria-labelledby="nv-home-topics-title">
      <div class="nv-home-container">
        <div class="nv-home-section-intro nv-home-section-intro--compact">
          <div>
            <span class="nv-home-eyebrow">Temas para tu vida</span>
            <h2 id="nv-home-topics-title">Decisiones que merecen tiempo</h2>
          </div>
          <a class="nv-home-all-link" href="temas.html">Ver todos los temas <span aria-hidden="true">→</span></a>
        </div>
        <div class="nv-home-topic-grid">
          <a href="temas.html?topic=ahorro-inversion">
            <span>01</span><strong>Empezar a invertir</strong><small>Orden, horizonte y disciplina.</small>
          </a>
          <a href="jubilacion.html">
            <span>02</span><strong>Preparar la jubilación</strong><small>Tiempo, ahorro y renta futura.</small>
          </a>
          <a href="temas.html?topic=hijos-legado">
            <span>03</span><strong>Familia y legado</strong><small>Proteger, compartir y transmitir.</small>
          </a>
        </div>
      </div>
    </section>

    <section class="nv-home-about" id="que-es-nuvia" aria-labelledby="nv-home-about-title">
      <div class="nv-home-container nv-home-about-grid">
        <div>
          <span class="nv-home-eyebrow">Qué es NUVIA</span>
          <h2 id="nv-home-about-title">Una forma más serena de acercarse al patrimonio</h2>
        </div>
        <div class="nv-home-about-copy">
          <p>NUVIA reúne conocimiento, herramientas y tecnología para ayudar a las familias a comprender, proteger y gestionar mejor su patrimonio.</p>
          <a class="nv-home-all-link" href="temas.html">Conocer el proyecto <span aria-hidden="true">→</span></a>
        </div>
        <div class="nv-home-pillars" aria-label="Pilares de NUVIA">
          <span><b>01</b> Proteger</span>
          <span><b>02</b> Crecer</span>
          <span><b>03</b> Legado</span>
        </div>
      </div>
    </section>

    <section class="nv-home-join" id="registro" aria-labelledby="nv-home-join-title">
      <div class="nv-home-container nv-home-join-inner">
        <div>
          <span class="nv-home-eyebrow nv-home-eyebrow--light">Tu puerta de entrada</span>
          <h2 id="nv-home-join-title">Empieza hoy, a tu ritmo</h2>
          <p>Descubre una manera clara y tranquila de aprender, leer y explorar tus decisiones patrimoniales.</p>
        </div>
        <div class="nv-home-join-actions">
          <a class="nv-home-button nv-home-button--light" href="academia.html">Entrar en NUVIA</a>
          <a class="nv-home-text-link" href="lecturas.html">Prefiero empezar leyendo <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>`;

  const renderHomePortal = () => {
    if (route() !== 'index.html') return;
    const main = document.querySelector('main');
    const hero = document.querySelector('#inicio');
    if (!main || !hero || main.querySelector('.nv-home-portal')) return;

    ['mercados', 'noticia', 'temas-clave', 'lecturas-con-criterio'].forEach((id) => {
      document.getElementById(id)?.classList.add('nv-home-legacy-section');
    });
    const legacyAbout = document.getElementById('que-es-nuvia');
    if (legacyAbout) {
      legacyAbout.id = 'que-es-nuvia-anterior';
      legacyAbout.classList.add('nv-home-legacy-section');
    }

    hero.insertAdjacentHTML('afterend', homePortalMarkup);
    const heroLinks = hero.querySelectorAll('a');
    if (heroLinks[0]) {
      heroLinks[0].href = '#descubrir';
      heroLinks[0].textContent = 'Descubrir NUVIA';
    }
    if (heroLinks[1]) {
      heroLinks[1].href = 'mercados.html';
      heroLinks[1].textContent = 'Ver Mercados →';
    }
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
    renderHomePortal();
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

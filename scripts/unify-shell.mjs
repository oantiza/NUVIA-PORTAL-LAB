import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  'index.html', 'mercados.html', 'cartera.html', 'temas.html', 'vivienda.html',
  'fiscalidad.html', 'jubilacion.html', 'guia-fiscal.html', 'guia-impuestos.html',
  'guia-planificacion.html', 'academia.html', 'curso.html', 'lecturas.html',
];

const sectionFor = (file) => {
  if (file === 'index.html') return 'inicio';
  if (file === 'mercados.html') return 'mercados';
  if (file === 'cartera.html') return 'cartera';
  if (file === 'academia.html' || file === 'curso.html') return 'academy';
  if (file === 'lecturas.html') return 'lecturas';
  return 'temas';
};

const active = (current, section) => current === section ? ' class="is-active" aria-current="page"' : '';

const header = (current) => `<header data-screen-label="Header" class="nuvia-site-header">
    <div class="nuvia-site-header__inner">
      <a class="nuvia-site-header__brand" href="index.html" aria-label="Inicio de NUVIA">
        <img src="src/assets/home/nuvia-logo-transparent.webp" alt="NUVIA Family Wealth">
      </a>
      <nav class="nuvia-site-nav" aria-label="Navegación principal">
        <a href="index.html"${active(current, 'inicio')}>Inicio</a>
        <a href="mercados.html"${active(current, 'mercados')}>Mercados</a>
        <details class="nuvia-site-nav__topics${current === 'cartera' ? ' is-active' : ''}">
          <summary${current === 'cartera' ? ' aria-current="page"' : ''}>Cartera</summary>
          <div class="nuvia-site-nav__menu">
            <a href="cartera.html">Visión de cartera</a>
            <a href="cartera.html?vista=companies">Análisis y valoración de empresas</a>
          </div>
        </details>
        <details class="nuvia-site-nav__topics${current === 'temas' ? ' is-active' : ''}">
          <summary${current === 'temas' ? ' aria-current="page"' : ''}>Temas clave</summary>
          <div class="nuvia-site-nav__menu">
            <a href="temas.html?topic=ahorro-inversion">Ahorro e inversión</a>
            <a href="vivienda.html">Vivienda y coste de vida</a>
            <a href="fiscalidad.html">Mis impuestos</a>
            <a href="temas.html?topic=jubilacion">Jubilación</a>
            <a href="temas.html?topic=hijos-legado">Hijos y legado</a>
            <a href="temas.html?topic=bienestar">Cuerpo, mente y salud</a>
          </div>
        </details>
        <a href="academia.html"${active(current, 'academy')}>Academy</a>
        <a href="lecturas.html"${active(current, 'lecturas')}>Lecturas</a>
        <a class="nuvia-site-nav__secondary" href="index.html#que-es-nuvia">Qué es NUVIA</a>
      </nav>
    </div>
  </header>`;

const footer = `<footer data-screen-label="Footer" class="nuvia-site-footer">
    <div class="nuvia-site-footer__inner">
      <div class="nuvia-site-footer__grid">
        <div class="nuvia-site-footer__brand">
          <img src="src/assets/home/nuvia-logo-transparent.webp" alt="NUVIA">
          <p>Acompañamos a familias a preservar, hacer crecer y transferir su patrimonio con visión de largo plazo.</p>
        </div>
        <div>
          <h4>Navegación</h4>
          <div class="nuvia-site-footer__links">
            <a href="index.html">Inicio</a>
            <a href="mercados.html">Mercados</a>
            <a href="cartera.html">Analítica de cartera</a>
            <a href="cartera.html?vista=companies">Análisis y valoración de empresas</a>
            <a href="lecturas.html">Lecturas con criterio</a>
          </div>
        </div>
        <div>
          <h4>Recursos</h4>
          <div class="nuvia-site-footer__links">
            <a href="temas.html?topic=ahorro-inversion">Temas clave</a>
            <a href="academia.html">NUVIA Academy</a>
            <a href="academia.html?tab=interes">Interés compuesto</a>
            <a href="academia.html?tab=calculadora">Simulador</a>
            <a href="curso.html">Curso · Dinero con criterio</a>
          </div>
        </div>
        <div class="nuvia-site-footer__info-column">
          <h4>Información</h4>
          <div class="nuvia-site-footer__info">
            <span>Contenido educativo e informativo.</span>
            <span>No constituye asesoramiento financiero, fiscal o jurídico personalizado.</span>
          </div>
        </div>
      </div>
      <div class="nuvia-site-footer__legal">
        <span>© 2026 NUVIA Family Wealth. Todos los derechos reservados.</span>
        <span>Las decisiones patrimoniales deben valorar las circunstancias personales de cada familia.</span>
      </div>
    </div>
  </footer>`;

for (const file of pages) {
  const fullPath = path.join(root, file);
  let html = fs.readFileSync(fullPath, 'utf8');
  const next = html
    .replace(/<header data-screen-label="Header"[\s\S]*?<\/header>/, header(sectionFor(file)))
    .replace(/<footer data-screen-label="Footer"[\s\S]*?<\/footer>/, footer)
    .replace(/min-width:1080px/g, 'min-width:768px');
  if (next === html) throw new Error(`No se pudo actualizar la estructura de ${file}`);
  fs.writeFileSync(fullPath, next);
}

console.log(`Estructura compartida aplicada a ${pages.length} páginas.`);

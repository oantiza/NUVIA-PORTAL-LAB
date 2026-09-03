/* Contrato de presentación para pruebas. No se carga en el portal ni lee datos. */
export const VISUAL_ARCHETYPES = {
  'index.html': { type: 'institucional', exception: 'Portada fotográfica: composición y velos propios.' },
  'que-es-nuvia.html': { type: 'institucional', exception: 'Cubierta y manifiesto editorial propios.' },
  'mercados.html': { type: 'espacio' },
  'academia.html': { type: 'espacio', exception: 'Categorías formativas: colores y leyendas propios.' },
  'temas.html': { type: 'espacio', exception: 'Vistas de Patrimonio y Bienestar sin cambiar rutas ni estados.' },
  'cartera.html': { type: 'herramienta', exception: 'Aro de apertura y series analíticas; empresas se revisará en 4B.' },
  'vivienda.html': { type: 'herramienta' },
  'fiscalidad.html': { type: 'herramienta' },
  'jubilacion.html': { type: 'herramienta' },
  'lecturas.html': { type: 'editorial', exception: 'Lámina ilustrada sin degradado, no héroe institucional.' },
  'curso.html': { type: 'editorial', exception: 'Cabecera institucional con navegación del curso.' },
  'guia-ahorro.html': { type: 'editorial', exception: 'Cabecera institucional y panel de contexto.' },
  'guia-calendario.html': { type: 'editorial', exception: 'Cabecera institucional y panel de contexto.' },
  'guia-sucesiones.html': { type: 'editorial', exception: 'Cabecera institucional y panel de contexto.' },
  'guia-fiscal.html': { type: 'editorial', exception: 'Cabecera institucional compacta.' },
  'guia-planificacion.html': { type: 'editorial', exception: 'Cabecera institucional y recorrido educativo.' },
  'guia-impuestos.html': { type: 'editorial', exception: 'Estado en preparación, no guía activa; noindex.' },
  'sistema-visual.html': { type: 'institucional', exception: 'Muestra de componentes, noindex.' },
};

/* Selector, propiedad calculada, valor esperado. Se evalúan solo cajas visibles.
   Las fotos, estados y gráficos no se someten a una sustitución indiscriminada. */
export const PALETTE_SAMPLES = [
  ['navy', 'navy-900', '#0B2347'], ['green', 'green-500', '#7C9A44'],
  ['paper', 'paper', '#F3EEDF'], ['bronze', 'bronze-500', '#B69152'],
  ['cloud', 'cloud', '#F4F6F9'], ['white', 'white', '#FFFFFF'],
  ['copy', 'copy', '#40506A'], ['deep', 'navy-950', '#06172F'],
];

export const SURFACE_CONTRACT = [
  ['.nuvia-design-lab', 'backgroundColor', 'var(--nv-surface-page)'],
  ['.nuvia-design-lab main', 'backgroundColor', 'var(--nv-surface-page)'],
  ['.nuvia-route-cartera main', 'backgroundColor', 'var(--nv-surface-page)'],
  ['.nv-system', 'backgroundColor', 'var(--nv-surface-page)'],
  ['.nv-hero--institutional, .nuvia-analysis-hero, .nv-guide-hero', 'backgroundImage', 'var(--nv-surface-institutional)'],
  ['.nuvia-analysis-hero', 'backgroundImage', 'none', '::before'],
  ['.nv-section--white', 'backgroundColor', 'var(--nv-surface)'],
  ['.nv-section--paper, .nv-hero--editorial', 'backgroundColor', 'var(--nv-surface-editorial)'],
  ['.nv-section--technical', 'backgroundColor', 'var(--nv-surface-technical)'],
  ['.nv-section--deep', 'backgroundColor', 'var(--nv-surface-deep)'],
  ['.lecturas-hero, .lecturas-hero__banner', 'backgroundImage', 'none'],
  ...PALETTE_SAMPLES.map(([name, token]) => [`.nv-swatch--${name} .nv-swatch__color`, 'backgroundColor', `var(--nv-${token})`]),
];

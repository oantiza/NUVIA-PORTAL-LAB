# Auditoría de cambios · 01-09-2026

**Rango auditado:** `13b67f2` (HEAD de la auditoría del 31-08) → `58f599a` («Refina Lecturas y los conocimientos esenciales», 01-09 17:29). **29 commits**, +2.369/−383 líneas.
**Método:** clon del repo en la nube, `npm run validate` completo, auditoría de render con Chromium real (batería propia del sitio), mediciones de cabecera a 8 anchos, inspección visual de portada y `que-es-nuvia.html`.

## Qué ha cambiado desde ayer

1. **Publicada `que-es-nuvia.html`** (manifiesto institucional, 277 líneas): héroe fotográfico con «NUVIA es un lugar donde las familias aprenden a entender su dinero», manifiesto por bloques, «Cinco puertas», «Nuestro espíritu» (4 láminas de valores), «NUVIA informa, explica y calcula. Tú comprendes y decides», cierre «NUVIA crece contigo». Usa la redacción depurada del 01-09 («espacio digital independiente, creado con vocación de comunidad»). Registrada en `build-site.mjs` y `check-consistencia.mjs`, **pero NO en la lista PAGINAS de `check-render.mjs`** → la página de marca más importante no tiene auditoría de render.
2. **Rediseño completo de la portada** («láminas editoriales», prefijo `home26-`): héroe conservado; sección El proyecto con índice de valores; tres láminas de área (Economía y Finanzas / Patrimonio / Familia, Salud y Bienestar con distintivo honesto «En preparación»); sumario 01–08; banners de Academia y Lecturas. Los cinco espacios quedan nombrados en portada — ejecuta ya parte del plan de ChatGPT.
3. **4 imágenes nuevas sin optimizar:** `nuvia-academy-banner-2026.jpeg` (2,97 MB), dos PNG de patrimonio (2,2 y 2,5 MB), banner Lecturas (0,96 MB). Reincide y amplía el hallazgo 4.3 del 31-08.

## Resultado de validación

- `npm run validate`: **todo en verde** (18 páginas, paridad, consistencia, lenguaje, cálculos).
- **Auditoría de render: FALLA en `index.html`** — primera vez desde la homogeneización:
  - **11 fallos de contraste AA**: bronce `rgb(159,121,64)` a 3,38:1 en los numeritos 01–08 del sumario (11 px), 01–03 de valores (12 px).
  - **9 textos por debajo de 12 px** (numeritos del sumario, distintivo «En preparación» a 11 px).
  - **5 tamaños fuera de escala**: 17, 15 y 11 px (`home26-project__name`, `home26-plate__cta`, `home26-plate__badge`, `home26-index__item`).
  - En el PC de Óscar esto no salta porque Playwright no está instalado y `check-render` se omite (lo señala también el informe de ChatGPT). En la nube se ejecuta con `NUVIA_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- Resto de páginas: 0 fallos; consola limpia salvo los 15 errores de plantilla conocidos.

## Verificación de las afirmaciones de los informes de ChatGPT (3 PDF del 01-09)

| Afirmación | Verificación |
|---|---|
| Subtítulo del héroe «Planificación patrimonial y financiera…» suena a servicio profesional | ✔ El texto está en `index.html`; coincide con el hallazgo 4.4 del 31-08 |
| Pie «Acompañamos a familias a preservar, hacer crecer y transferir…» en todas las páginas | ✔ Confirmado |
| «Cinco puertas» de `que-es-nuvia.html` desfasadas (falta Familia-Salud-Bienestar, sobra Analítica como puerta) | ✔ La página lista Economía y mercados / Patrimonio / Academia / Analítica de cartera / Lecturas |
| `docs/DEFINICION_NUVIA.md` describe la organización anterior | ✔ Confirmado |
| Cabecera rota en tableta: colisión menú-logotipo 768–~1199 px | ✔ **Medido**: solape de 97–136 px a 768/820/900; limpio a 1024; reaparece a 1180 (60 px); limpio a 1280. Clavado |
| Vivienda: etiquetas sin asociación semántica | ✔ 41 controles (40 inputs + 1 select), labels sin `for=`, inputs sin `id`; el label no envuelve al input (caja hermana) |
| Playwright ausente → render no auditado | ✔ Reproducido |
| PNG de Lecturas sin utilizar | ✔ `lecturas-con-criterio-banner-2026.png` (956 KB) no se referencia; la portada usa la versión .webp |

## Orden recomendado (inmediato)

1. Arreglar el bronce pequeño de la portada nueva (subir contraste del token o tamaño ≥12 px con AA) — el propio validador del sitio la rechaza.
2. Añadir `que-es-nuvia.html` a PAGINAS de `check-render.mjs` (y unos contenidos mínimos esperados).
3. Optimizar los 4 banners nuevos a WebP (`scripts/optimizar-imagenes.mjs` ya existe).
4. Cabecera de tableta 768–1199 px (medida, real).
5. Después, Fase 0–3 del plan de ChatGPT: definición canónica → ficha regulatoria → cinco puertas de `que-es-nuvia` → subtítulo del héroe.

Siguen abiertos del 31-08: metadatos sociales/sitemap/robots, tensión de lenguaje del pie, validación profesional de supuestos del simulador, 15 errores de consola de plantilla.

---

*Adopción (01-09-2026): junto con `PLAN_APLICACION_FINAL_NUVIA_20260901.md` e `INFORME_FINAL_NUVIA_20260901.md`, este documento forma el paquete adoptado como hoja de ruta oficial.*

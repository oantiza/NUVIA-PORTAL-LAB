# NUVIA · Verificación independiente de la Entrega 2b (base propia de la alfa) · 2 de septiembre de 2026

**Verifica:** Claude Fable 5.1 (paso 7 del plan). **Publicado en `main`:** `f2f91ee`, GitHub Actions run 33665075251, `success` (build completo: `validate`, `check-render` a 1440 px en el Chromium del runner, `build-site`, comprobaciones sobre `dist/`).

## Veredicto

**Apta.** La alfa está publicada en abierto sobre la base propia `nuvia-family-wealth`, sin cuentas, sin rastro de la base profesional ni de Auth, con los datos declarados y las limitaciones dichas en pantalla. Clasificación ámbar firmada; validación jurídica pendiente por decisión expresa del fundador (ficha, § Decisiones).

## Comprobaciones

| # | Qué | Resultado |
|---|---|---|
| 1 | Código publicado = código probado | `js/nuvia-datos.js` en producción es byte a byte el del árbol de trabajo (`f2f91ee`) |
| 2 | `cartera.html` en producción | 200; contiene «Versión alfa de NUVIA»; no carga `nuvia-cuenta.js`; no hay iframe ni referencia a `company-analysis/` |
| 3 | Regresión «sin maestra» sobre producción | `nuvia-datos.js` publicado: sin `bbdd-activos-financieros`, `cloudfunctions.net`, `identitytoolkit`, `securetoken` ni la `apiKey` antigua; apunta a `nuvia-family-wealth` |
| 4 | Lo que no debe publicarse | `universo/universo-alfa.csv` → 404; `company-analysis/index.html` → 404 |
| 5 | Reglas de Firestore en vivo (sin credenciales) | Lectura pública de `assets`, series, catálogo y `sync_runs`; `users/*` y cualquier otra colección denegadas en lectura; escritura y borrado denegados (10/10, `docs/nuvia-reglas.test.mjs`) |
| 6 | Recuentos en Firestore frente a `sync_runs` | `sync_runs/2026-09-02`: `status ok`, 159 activos; manifiesto `total 159`, `prices_last_date 2026-09-02`, `updated_at 2026-09-02T17:51:25Z`; escritas 1.100 (159 fichas + 932 series + 7 desgloses + 1 trozo + manifiesto) |
| 7 | Flujo de datos del portal contra la base real (Node, con el módulo publicado) | manifiesto → catálogo (búsqueda «telefonica» → `ES0178430E18`) → ficha (fondo con `exposure_detail = null`, `return_1y 0,2062`) → series de 3 activos alineadas y rebasadas a 100 (758 fechas, 2023-09-04 → 2026-09-01) → desgloses (ETF 10 posiciones; fondo `null`) → `enCatalogo` |
| 8 | Prueba manual en navegador (local, misma base, antes de publicar) | Buscar por nombre y ticker; fondo + ETF + acción; análisis completo con 757 observaciones; «33 % de la cartera sin datos de desglose» declarado; solapamiento «sin desglose disponible»; guardar, recargar y cargar en el navegador; empresas «En preparación»; Red: solo `firestore.googleapis.com` y estáticos |
| 9 | Baterías | `validate` completo en verde en el runner; en el PC del fundador: parity, static-site, consistencia, lenguaje, navegación, metadatos, privacidad de empresas, `test:analisis` (incluye `nuvia-mercado-alfa` con 82 comprobaciones, `nuvia-datos`, `nuvia-concentracion`) |
| 10 | Excluidos de la carga, justificados | `LU2267099674` (EODHD no devuelve precios); `ES0143416115` Siemens Gamesa (sin cotización desde 2023-02-08) |

## Límites conocidos (declarados, no defectos)

- Fondos sin desglose de sectores y regiones (EODHD no lo publica para fondos europeos): el análisis lo declara como «sin datos», nunca lo estima.
- Carteras modelo: tres de cuatro «No disponible en la alfa» por instrumentos fuera del universo; decisión del fundador pendiente (añadir ocho líneas al universo o dejarlas así).
- Doce activos `INCOMPLETO` (historial < 3 años o sesiones que faltan), publicados con aviso; TSK (`TSK.MC`) con 80 sesiones, sin métrica a 1 año.
- `check-render` fuera de 1440 px: `cartera.html` a 1180 px tiene un aviso de escala previo a esta entrega (también en el `main` anterior).

## Lo que queda abierto

- Decisión sobre las carteras modelo.
- Refresco de precios: `npm run mercado-alfa -- todo --solo-precios` cuando el fundador quiera (semanal en la alfa).
- Validación jurídica antes de cualquier apertura comercial, recogida de datos personales o ampliación (ficha, § Decisiones).
- Integración posterior de las Entregas 4A/4B/5A (rama `prueba/tipografia-empresas`) con conflictos pequeños previsibles en `package.json` y `cartera.html`.

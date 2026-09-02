# NUVIA · Estado de la Entrega 2b (base propia de la alfa) · 2 de septiembre de 2026, tarde

**Autor:** Claude Fable 5.1. Ejecución completa de los pasos por encargo del fundador («haz tú todos los pasos»), con auditoría previa del estado del repositorio.

## 1. Auditoría previa (lo que había)

- `origin/main` estaba en `7bd8371`, el mismo commit que la rama `prueba/tipografia-empresas`; el `main` local estaba 106 commits por detrás en un worktree temporal de publicación (no se usa como base).
- Árbol de trabajo con dos bloques mezclados sin confirmar: el trabajo visual de Codex (Entregas 4A/4B/5A: 35 ficheros modificados y ~45 nuevos) y la Entrega 2b (reglas, universo, fixtures, documentos). Los únicos ficheros ya versionados que tocaba la 2b (`firebase.json`, acta) solo llevaban añadidos de la 2b: sin solape.
- Había un `.git/index.lock` huérfano de la mañana; se retiró.
- La adenda del acta contradecía las decisiones de la tarde («no autoriza publicación abierta», condición de licencia de EODHD); corregida.
- Los fixtures de EODHD llevaban BOM UTF-8 (guardados por PowerShell); se quitó.

## 2. Hecho hoy (tarde)

| # | Qué | Dónde |
|---|---|---|
| 1 | Separación de commits: `prueba/tipografia-empresas` ← `cba4706` (visual, sin validar ni integrar); `codex/entrega-2b-base-alfa` ← `35a72ad` (proyecto, reglas, universo, documentos, ficha) | ambas ramas en `origin` |
| 2 | Ficha regulatoria de la alfa (marco §12, 18 preguntas), **propuesta ámbar** | `docs/FICHA_REGULATORIA_ALFA_BASE_PROPIA.md` |
| 3 | Reglas nuevas de Firestore publicadas en `nuvia-family-wealth` (lectura pública de datos de mercado, todo lo demás denegado); probadas en vivo desde el PC del fundador: 10/10 | `firestore.rules`, `docs/nuvia-reglas.test.mjs` |
| 4 | **Entrega A**, pipeline `scripts/mercado-alfa/` (`descargar | proyectar | publicar | todo`), batería de 77 comprobaciones sin red en verde, `publicar --dry-run` probado con caché sintética | commit `4ae2787` |
| 5 | **Entrega B**, portal contra la base propia sin cuentas: `nuvia-datos.js` reescrito (Firestore REST sin sesión, catálogo en memoria, `alineaYRebasa`, fachada `llama()`), concentración sin estimar lo desconocido, carteras modelo «No disponible en la alfa» cuando falta un activo, `cartera.html` sin cuenta y con aviso de alfa y «Datos a fecha», empresas «En preparación» sin iframe, `company-analysis` y `universo/` fuera de `dist/`, regresión «sin maestra» (con Auth) en `check-lenguaje` y `check-static-site`, baterías actualizadas | commit `8f10d71` |
| 6 | Verificación: `check-parity`, `check-static-site` (árbol y `dist/`), `check-consistencia`, `check-lenguaje`, `test:analisis` (incluye datos, concentración, mercado-alfa), navegación, metadatos, privacidad de empresas: **todo en verde en el PC del fundador y en el entorno de Claude**. `check-render` a 1440 px en verde para `cartera.html` y `cartera.html?vista=models`; `dist/` sin `company-analysis/`, sin `universo-alfa.*`, sin cadenas de la base profesional ni de Auth | — |

## 3. Pendiente y quién lo desbloquea

| # | Qué | Quién | Nota |
|---|---|---|---|
| A | **Clave de EODHD** como variable de usuario en el PC (`[Environment]::SetEnvironmentVariable('EODHD_API_KEY','…','User')`) | Óscar | Sin ella no hay primera carga. Nada más queda bloqueado por esto |
| B | Primera carga: `npm run mercado-alfa -- descargar` → revisar `output/mercado-alfa/informe-descarga.txt` (divisas, TSK, series cortas) → `proyectar` → `publicar --dry-run` → `publicar` | Claude, en cuanto exista A | ≈ 15–30 min, casi todo descarga |
| C | Prueba manual en local (`npm run serve`) con un fondo, un ETF y una acción, pestaña Red | Claude con el navegador del fundador, tras B | — |
| D | **Firmar la clasificación de la ficha** (propuesta ámbar), responder la pregunta 14 (¿algún instrumento del universo está vinculado a la entidad representada?) y elegir la salida para la validación jurídica (a, b o c de la ficha) | Óscar | Condiciona la integración en `main`, no el desarrollo |
| E | Integrar `codex/entrega-2b-base-alfa` en `main` y publicar (GitHub Actions ejecuta `npm run build`, con `check-render` completo en su Chromium) | Claude, tras D | — |
| F | Verificación independiente final (paso 7) e informe | Claude, tras E | — |

## 4. Avisos que conviene saber

1. **Carteras modelo.** Tres de las cuatro usan instrumentos que no están en el universo con `incluir=si`: `IE00B4L5Y983` (iShares Core MSCI World) y `IE00B3XXRP09` (Vanguard S&P 500 UCITS ETF) no están en la lista; `ES0113900J37` (Santander), `ES0113211835` (BBVA), `LU0563745743`, `LU1372006947`, `LU1333148903` y `LU1330191542` están con `no`. En la alfa esas carteras aparecen como «No disponible en la alfa» con la lista de lo que falta; solo «Mitad bolsa mundial, mitad bonos» funciona si se añade IWDA. **Decisión de Óscar:** poner esas líneas a `si` (añadiendo IWDA.AS y VUSA.AS con su símbolo en EUR) o dejar las carteras modelo apagadas en la alfa. No se ha tocado el universo.
2. **Nivel único.** Todo el mundo ve el análisis completo del nivel «registrada»; los escenarios del suscriptor siguen cerrados. Cambiarlo es una línea (`NIVEL_ALFA` en `nuvia-datos.js`).
3. **Informe genérico de acciones** (`nuvia-informe.js`): sigue sin montarse (ya lo prohibía `check-parity`); en la alfa no habría fundamentales para alimentarlo.
4. **`check-render` fuera de 1440 px:** `cartera.html` a 1180 px da «fuera de escala» en `nv-lab-fase__cabecera` **también en `main`**; no es de esta entrega. Y en el entorno de Claude la auditoría de contraste de todas las páginas seguidas es inestable (imágenes de cabecera que no llegan a tiempo), también en `main`; por páginas sueltas pasa. GitHub Actions es la referencia.
5. **`docs/nuvia-reglas.test.mjs`** necesita red y solo corre con `NUVIA_REGLAS_EN_VIVO=1`; no está en `validate`.
6. **Entregas 4A/4B/5A** están confirmadas tal cual en su rama, sin validar. Cuando se integren después de la 2b habrá que resolver conflictos pequeños en `package.json` y `cartera.html`.
7. **La base está vacía** hasta la primera carga: en producción, el laboratorio mostraría «La base de datos de la alfa no responde…» en la línea de fecha y el buscador no devolvería resultados. Por eso E va después de B.

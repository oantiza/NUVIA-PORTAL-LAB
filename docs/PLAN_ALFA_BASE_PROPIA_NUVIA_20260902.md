# NUVIA · Plan de ejecución: base propia de la alfa, desde cero (Entrega 2b)

**Autor:** Claude Fable 5.1  
**Fecha:** 2 de septiembre de 2026 · **versión 2**, sustituye a la del mismo día basada en copiar `nuvia-market-data`  
**Decisiones del fundador (02-09-2026):** empezar de cero; **redirigir el proyecto `nuvia-family-wealth`** (existe, vacío, sin facturación); **datos de mercado descargados directamente de EODHD con la clave propia** mediante un script local; **universo pequeño y curado, 50–150 instrumentos en EUR**, elegido por Óscar.  
**Objetivo:** laboratorio de cartera funcional para ≤ 100 personas invitadas, coste cero, **sin ninguna credencial, permiso, lectura ni llamada hacia `bbdd-activos-financieros`** y sin depender de `nuvia-market-data`.  
**Duración:** 4–5 jornadas de trabajo efectivo en 7 pasos; cada paso deja el repositorio en verde.

Papeles: **Óscar** = decisiones, universo, consola de Firebase, ejecución de scripts en su PC, commits y publicación. **Codex/Claude** = código, pruebas y documentación. **Claude** = verificación independiente al cierre.

Regla transversal: ninguna orden lleva `--project bbdd-activos-financieros`, ningún script abre un cliente contra ese proyecto ni contra `nuvia-market-data`, y ningún secreto (clave de EODHD incluida) entra en el repositorio. Desde el paso 4 lo vigila la batería.

---

## Paso 0 · Preparación (Óscar, 30 min)

| # | Acción | Comprobación |
|---|---|---|
| 0.1 | Confirmar en `main` las entregas U y 1 (dos commits), esperar GitHub Pages | `git status` limpio; producción con «Academia NUVIA» y el subtítulo nuevo |
| 0.2 | Rama `codex/entrega-2b-base-alfa` | — |
| 0.3 | Acta, D6, un párrafo: «La alfa usa el proyecto propio `nuvia-family-wealth` en plan gratuito, con datos descargados de EODHD sobre un universo curado en euros, cuentas por invitación, sin desgloses más allá de los que da EODHD, y Análisis de empresas en preparación. No hay relación con `bbdd-activos-financieros` ni con `nuvia-market-data`.» | Acta actualizada |
| 0.4 | **EODHD, lo que ya se sabe (02-09-2026, eodhd.com/pricing):** Óscar tiene los planes **EOD Historical Data – All World** (19,99 $/mes; 100.000 peticiones/día, 1.000/min; precios ajustados con dividendos y splits) y **Fundamentals Data Feed** (59,99 $/mes; mismos límites; fundamentales de acciones, ETF y fondos; **cada petición de fundamentales cuenta 10 llamadas**). Con 120 instrumentos: carga inicial ≈ 1.320 llamadas, refresco ≈ 120; sobra margen. Ambos planes se anuncian «para uso personal; para uso comercial, plan Startups & Enterprise». **Comprobación de 10 minutos, obligatoria antes de escribir código**, con la clave en la sesión de PowerShell (nunca en un fichero del repositorio): `Invoke-RestMethod "https://eodhd.com/api/eod/IE00B03HD191.EUFUND?api_token=$env:EODHD_API_KEY&fmt=json&from=2026-08-01"` debe devolver precios de agosto; `Invoke-RestMethod "https://eodhd.com/api/fundamentals/IE00B03HD191.EUFUND?api_token=$env:EODHD_API_KEY"` debe devolver `General` y datos de fondo (distribución, regiones, sectores, posiciones). Si la segunda no trae fondos europeos, el pipeline usa fundamentales solo para ETF y acciones y los fondos van con nombre, divisa y precios (el laboratorio funciona igual; el solapamiento solo cubre ETF). **Resultado (02-09-2026, 09:05):** precios ✓ (el fondo llega al 01-09-2026 con `adjusted_close` diario); fundamentales: **fondos europeos vacíos** (`IE00B03HD191.EUFUND` devuelve el esqueleto sin datos; `LU0113257694.EUFUND` devuelve `{}`), **ETF completo** (`IWDA.AS`: domicilio, gastos corrientes 0,20 %, distribución por activo, regiones, sectores, capitalización y las 10 mayores posiciones con ISIN/sector/país) y **acción completa** (`TEF.MC`: sector, industria, país, ISIN, capitalización). Muestras sin clave en `docs/fixtures/eodhd/` (la de la acción recortada a `General`/`Highlights`/`Technicals`). Consecuencia: los fondos entran con nombre, clase y divisa **desde el CSV** más precios de EODHD; la ficha de fundamentales solo se pide para ETF y acciones. | Muestras guardadas ✓ |
| 0.4b | **Licencia.** «Uso personal» no es lo mismo que «alfa cerrada y no comercial con 100 invitados». Enviar un correo breve a EODHD (support@eodhd.com) describiendo la alfa (sin ánimo de lucro, sin acceso público, datos detrás de sesión, sin redistribución ni descarga, ≤ 100 personas conocidas) y pidiendo confirmación escrita de que cabe en los planes actuales; guardar la respuesta en la ficha del paso 5. Mientras llega, la alfa puede avanzar con la primera ronda de 3–5 personas; la ampliación a la lista completa espera a la respuesta o a la decisión consciente de Óscar | Correo enviado; respuesta archivada |
| 0.5 | `nuvia-market-data`: pausar el trabajo programado, porque ya no sirve a nada y sigue leyendo la maestra a diario: `gcloud scheduler jobs pause firebase-schedule-daily_nuvia_sync-europe-west1 --project nuvia-market-data --location europe-west1`. Borrar el proyecto es una decisión posterior, cuando la alfa lleve unas semanas | `state: PAUSED` |

---

## Paso 1 · Proyecto y reglas (Óscar 45 min + Codex 1 h)

1. **Firestore** en `nuvia-family-wealth`: Crear base de datos → modo producción → **`europe-west1`**. Sin facturación.
2. **Authentication:** activar Correo/contraseña; **no** activar Anónimo; Configuración → Acciones del usuario → desmarcar «Permitir crear cuenta»; dominios autorizados: `oantiza.github.io` y `localhost`.
3. **App web** «NUVIA Portal Lab» (sin Hosting): copiar `apiKey` y `projectId`.
4. **`firestore.rules`** en el repositorio y `"firestore": {"rules": "firestore.rules"}` en `firebase.json`; publicar con `firebase use nuvia-family-wealth && firebase deploy --only firestore:rules`.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function invitado() { return request.auth != null && request.auth.token.firebase.sign_in_provider == 'password'; }
    function propio(uid) { return invitado() && request.auth.uid == uid; }

    match /assets/{id}            { allow read: if invitado(); allow write: if false; }
    match /assets/{id}/{sub=**}   { allow read: if invitado(); allow write: if false; }
    match /catalog_chunks/{id}    { allow read: if invitado(); allow write: if false; }
    match /catalog_manifest/{id}  { allow read: if invitado(); allow write: if false; }
    match /sync_runs/{id}         { allow read: if invitado(); allow write: if false; }

    match /users/{uid} {
      allow read, delete: if propio(uid);
      allow create, update: if propio(uid)
        && request.resource.data.keys().hasOnly(['created_at', 'consents', 'schema_version']);
      match /portfolios/{pid} {
        allow read, delete: if propio(uid);
        allow create, update: if propio(uid)
          && request.resource.data.keys().hasOnly(['name','base_currency','positions','created_at','updated_at'])
          && request.resource.data.positions.size() <= 25
          && request.resource.data.name.size() <= 80;
      }
    }
  }
}
```

5. **Batería de reglas** `docs/nuvia-reglas.test.mjs` con `@firebase/rules-unit-testing` (sin sesión no lee; invitado lee y no escribe activos; `users/A` no ve `users/B`; cartera con 26 posiciones o campo extra rechazada). Se ejecuta con `firebase emulators:exec` cuando el emulador está instalado; si no, a mano antes de cada publicación de reglas.

**Aceptación:** base en `europe-west1`, registro cerrado, reglas publicadas, batería en verde.

---

## Paso 2 · Universo curado (Óscar, 1–2 h)

Fichero **`universo/universo-alfa.csv`** (versionado; es contenido editorial, no un secreto): **Vive en `universo/` (raíz), fuera de `data/`, porque `scripts/build-site.mjs` copia `data/` entera a `dist/` y la lista no debe publicarse.** La columna `divisa` es una declaración (EUR) que el pipeline contrasta con EODHD antes de publicar (informe para Codex v2, §4–§5).

```
asset_id,eodhd_symbol,instrument_type,clase,grupo,nombre,divisa,incluir
IE00B03HD191,IE00B03HD191.EUFUND,FUND,EQUITY,referencia-bolsa,Vanguard Global Stock Index Fund EUR Acc,EUR,si
IE00BYX5NX33,IE00BYX5NX33.EUFUND,FUND,EQUITY,referencia-bolsa,Fidelity MSCI World Index Fund EUR P Acc,EUR,si
LU0113257694,LU0113257694.EUFUND,FUND,FIXED_INCOME,referencia-bonos,Schroder ISF EURO Corporate Bond A Acc,EUR,si
LU0132601682,LU0132601682.EUFUND,FUND,FIXED_INCOME,referencia-bonos,Morgan Stanley INVF Euro Corporate Bond A,EUR,si
ES0178430E18,TEF.MC,STOCK,EQUITY,bolsa-espana,Telefónica,EUR,si
IE00B4L5Y983,IWDA.AS,ETF,EQUITY,etf-global,iShares Core MSCI World UCITS ETF (Ámsterdam · EUR),EUR,si
```

Las columnas `clase` y `nombre` son **obligatorias para los fondos**: EODHD no devuelve ficha de fondos europeos, así que la clase económica (`EQUITY`, `FIXED_INCOME`, `MIXED`, `MONEY_MARKET`, `OTHER`) y el nombre comercial salen de esta lista. Instrucciones completas en `universo/universo-alfa.LEEME.md`.

- Los cuatro primeros son **obligatorios**: son los que `nuvia-constructor.js` usa como referencia de bolsa y bonos (`ACTIVOS_BENCHMARK`); sin ellos no hay cartera de referencia.
- Reparto sugerido para 100–120 líneas: 30 fondos de bolsa (global, EE. UU., Europa, emergentes, sectoriales), 20 fondos de renta fija (gobierno, corporativo, corto plazo, alto rendimiento), 10 mixtos y monetarios, 20 ETF en EUR (cotizados en Ámsterdam, Xetra o Milán), 30 acciones (IBEX y grandes europeas). Todo cotizado o valorado en **EUR**; el script rechaza cualquier otra divisa.
- `grupo` sirve solo para ordenar el catálogo y para las pruebas; no se muestra como recomendación (marco §5: nada de «seleccionados» o «mejores»). En pantalla el universo se presenta como «instrumentos disponibles en la alfa».
- **Sin rating, sin estrellas, sin «top».** El CSV no lleva ninguna columna de mérito.

**Aceptación:** CSV con 50–150 líneas, los cuatro de referencia incluidos, `incluir=si` en todas las que entran.

---

## Paso 3 · Pipeline de datos propio (Codex escribe, Óscar ejecuta; 1,5–2 jornadas)

Carpeta **`scripts/mercado-alfa/`**, Node sin dependencias nuevas (`fetch` nativo; escritura en Firestore por API REST con el token de `gcloud auth print-access-token`, que en el proyecto propio tiene permiso de propietario y **no pasa por las reglas**).

```
node scripts/mercado-alfa/run.mjs descargar   [--solo-precios] [--desde 2021-01-01]
node scripts/mercado-alfa/run.mjs proyectar
node scripts/mercado-alfa/run.mjs publicar    [--dry-run]
node scripts/mercado-alfa/run.mjs todo        [--solo-precios]
```

Clave: variable de entorno `EODHD_API_KEY` (en PowerShell, `$env:EODHD_API_KEY = "…"` en la sesión; nunca en fichero del repositorio; `.gitignore` con `output/mercado-alfa/`).

**3.1 `descargar`** → caché local `output/mercado-alfa/crudo/{symbol}.eod.json` y `.fundamentals.json`.

- Precios: `GET https://eodhd.com/api/eod/{symbol}?api_token=…&fmt=json&period=d&from={desde}` (desde 2021-01-01 para cubrir la ventana de 3 años con margen; con `--solo-precios`, desde 12 días atrás). 1 llamada por instrumento.
- Ficha: `GET https://eodhd.com/api/fundamentals/{symbol}?api_token=…` **solo para ETF y acciones** (10 llamadas por instrumento; solo en la carga inicial y en refrescos completos, no en `--solo-precios`). ETF: nombre, divisa, domicilio, gastos corrientes, distribución por clase de activo, regiones, sectores, capitalización y **las 10 mayores posiciones**; acciones: nombre, ISIN, sector, industria, país. **Fondos europeos: no se pide** (comprobado el 02-09: la respuesta llega vacía); su nombre y clase vienen del CSV.
- Resolución de símbolos dudosos: `GET https://eodhd.com/api/search/{isin}` una vez, y se fija el símbolo en el CSV. El script no adivina: si un símbolo no responde, lo lista al final y no lo publica.
- Ritmo: 4 peticiones por segundo, reintento con espera ante 429. Carga inicial de 120 instrumentos ≈ 120 + 1.200 llamadas; refresco diario ≈ 120.

**3.2 `proyectar`** (funciones puras, con batería `docs/nuvia-mercado-alfa.test.mjs` sobre respuestas de ejemplo guardadas en `docs/fixtures/eodhd/`) → `output/mercado-alfa/publicable/*.json`. Esquema propio de la alfa, `nuvia-alfa-asset.v1`:

```
assets/{asset_id}
  asset_id, isin, ticker, eodhd_symbol, instrument_type (FUND|ETF|STOCK), economic_asset_class
  (EQUITY|FIXED_INCOME|MIXED|MONEY_MARKET|OTHER), display_name, currency:"EUR", region, sector (acciones),
  category (texto descriptivo de EODHD, sin rating), costs{ongoing_charge}, 
  exposures{asset_mix, regions, sectors},
  metrics{as_of_date, return_1y, return_3y_annualized, volatility_1y, volatility_3y, max_drawdown_3y,
          method:"log-returns diarios, anualización √252, sobre adjusted_close"},
  history{first_date, last_date, observations, years},
  quality{status:"OK"|"INCOMPLETO", warnings[]},
  source{system:"EODHD", symbol, fetched_at}, schema_version, updated_at
assets/{asset_id}/series/{AÑO}         {asset_id, year, currency, first_date, last_date, n, points:[{date, value}]}   (value = adjusted_close)
assets/{asset_id}/holdings/latest      {as_of_date, source:"EODHD", holdings_count, top10_weight,
                                        holdings:[{name, isin?, ticker?, weight_pct, country?, sector?}]}   (solo ETF: las 10 mayores posiciones que da EODHD; los fondos no tienen desglose en la alfa)
catalog_chunks/{nnn}, catalog_manifest/public   {items:[…], total, updated_at, universe:"alfa"}
sync_runs/{AAAA-MM-DD}                 {started_at, finished_at, assets_ok, assets_failed[], prices_last_date_min/max, api_calls}
```

Las métricas se calculan en el propio script con fórmulas escritas en el documento (marco §3: método, fórmulas y supuestos identificados) y se prueban con una serie sintética de resultado conocido. No se calcula Sharpe en la alfa (evita la discusión del tipo sin riesgo); el laboratorio sigue calculando lo suyo en el navegador como hoy.

**3.3 `publicar`** → escritura por lotes de 200 (`documents:commit`) en `nuvia-family-wealth`; con `--dry-run` solo cuenta. Al final escribe `sync_runs/{fecha}` y `catalog_manifest/public.updated_at`, y **falla si los recuentos no cuadran** con los ficheros publicables. Cuota: una carga completa de 120 instrumentos ≈ 120 activos + ~600 series (2021–2026) + 120 desgloses + 2 catálogo ≈ 850 escrituras (límite gratuito: 20.000/día).

**3.4 Primera carga** (Óscar): `descargar` → revisar `output/mercado-alfa/informe-descarga.txt` (símbolos fallidos, divisas distintas de EUR, series cortas) → corregir el CSV si hace falta → `proyectar` → `publicar --dry-run` → `publicar`. Duración: 15–30 minutos, casi todo descarga.

**3.5 Refresco:** `todo --solo-precios` cuando Óscar quiera (semanal en la alfa). El laboratorio muestra siempre «Datos a fecha …» del manifiesto.

**Aceptación:** `sync_runs` con `assets_failed` vacío o justificado; recuentos en verde; en Firestore, los cuatro de referencia con `history.last_date` de esta semana; ningún activo fuera de EUR; ningún campo de rating.

---

## Paso 4 · El portal habla con la base propia (Codex, 1,5 jornadas)

Principio: **los módulos de análisis no cambian**; cambia `js/nuvia-datos.js`, algo de `js/nuvia-cuenta.js` y el estado de `cartera.html`. `creaClienteMaestra` conserva los nombres de método.

| Hoy | Alfa |
|---|---|
| `PROYECTO` = maestra, `region`, `urlFuncion` | `PROYECTO = {apiKey, id:'nuvia-family-wealth'}`; sin `region` ni funciones |
| Alta anónima en `sesionNueva()` | Se elimina; sin sesión, los métodos de datos lanzan `Error` con `codigo='SIN_SESION'` |
| `llama(callable)` | `lee(ruta)`, `consulta(query)`, `escribe(ruta, doc)`, `borra(ruta)` sobre `https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents/…` con `Authorization: Bearer idToken`; conversor puro `deFirestore` / `aFirestore` con batería |
| `buscaActivos` → `search_assets` | Catálogo cargado una vez (manifiesto + trozos), caché `localStorage` `nuvia.catalogo.v1` por `updated_at`; búsqueda en memoria por nombre, ISIN o ticker sin acentos; mismo `{activos, total}` |
| `detalleActivo` → `get_asset_detail` | `lee('assets/'+id)` devuelto con **la misma forma que la función** (`identity.display_name`, `instrument_type`, `economic_asset_class`, `isin`, `ticker`, `currency`, `sector`, `region`, `metrics`, `costs`, `quality`) |
| `get_price_series` (3Y, DAILY, rebasadas) | `seriesRebasadas(ids)`: lee `series/{2023..2026}` de cada activo (años cerrados cacheados en `localStorage`), y la función pura `alineaYRebasa()` devuelve exactamente `{dates, series:[{asset_id, values}]}`; activo sin datos en la ventana → fuera de `series` (el constructor ya lo interpreta como «sin historial suficiente»). Todo en EUR por construcción del universo: no hay FX |
| `get_asset_holdings` / `_batch` | `lee('assets/'+id+'/holdings/latest')` → forma `{holdings:[{name, isin, ticker, weight_pct, country, sector}]}` que `carteraDesdeHoldings` ya entiende. En la alfa hay desglose **para ETF** (10 mayores posiciones); para fondos el documento no existe y el laboratorio muestra «sin desglose disponible», como ya contempla |
| Carteras por callables en la maestra | `users/{uid}/portfolios/{id}` por REST: listar (`runQuery` por `updated_at desc`), guardar (`portfolio_id` = `crypto.randomUUID()`), borrar. Solo `name`, `base_currency`, `positions[{asset_id, weight_percent}]`, fechas |
| Consentimientos en `localStorage` | Además en `users/{uid}.consents` con fecha |

`js/nuvia-cuenta.js`: desaparece «crear cuenta»; queda iniciar/cerrar sesión, recuperar y cambiar contraseña, y **borrar cuenta** (primero `users/{uid}/portfolios/*` y `users/{uid}`, después la cuenta). Texto: «Alfa por invitación: solo pedimos correo y contraseña. Tus carteras guardadas se quedan en tu cuenta y las borras cuando quieras.»

`cartera.html`: sin sesión, portada del laboratorio con «Alfa por invitación» y el acceso; con sesión, todo. Línea «Datos a fecha {manifiesto.updated_at} · universo de la alfa: instrumentos en euros». `?vista=companies` en «En preparación»; `build:company-analysis` condicionado a `NUVIA_EMPRESAS=1` para que `npm run build` no dependa de él.

**Baterías:** `nuvia-datos.test.mjs` (conversor, catálogo, `alineaYRebasa`, carteras, `SIN_SESION`), `nuvia-cuenta.test.mjs` (sin alta; borrado en orden; consentimientos), y en `check-lenguaje.mjs` la regresión **«sin maestra»**: falla si en `js/`, `scripts/`, `cartera.html`, `web2-integration.js` o `.github/workflows/` aparecen `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, la `apiKey` antigua `AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg` o el patrón de una clave de EODHD (`api_token=` seguido de algo que no sea `${`).

**Prueba manual** (Óscar, con la cuenta de prueba del paso 6): buscar «Vanguard», añadir tres fondos, ver evolución, proyección y solapamiento, guardar cartera, recargar, cargar, borrar, cerrar sesión, comprobar que sin sesión no hay catálogo. Pestaña Red: solo `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` y `firestore.googleapis.com/v1/projects/nuvia-family-wealth/…`.

**Aceptación:** batería y regresión «sin maestra» en verde; prueba manual completa; cero peticiones a la maestra o a `nuvia-market-data`.

---

## Paso 5 · Textos y expediente (ChatGPT/Claude + Óscar, media jornada)

| # | Pieza | Contenido mínimo |
|---|---|---|
| 5.1 | `docs/FICHA_REGULATORIA_ALFA_BASE_PROPIA.md` | Las 18 preguntas del marco §12; clasificación **ámbar** (datos personales de testers; datos de mercado de un proveedor con licencia; universo cerrado; sin comercialización; sin IA). Puertas §13: validación funcional (batería), regulatoria (esta ficha), sin validación jurídica externa por tratarse de pruebas cerradas con consentimiento; **retirada**: al cerrar la alfa se borran cuentas y carteras y se vacía el proyecto |
| 5.2 | Licencia de datos | Párrafo con lo anotado en 0.4: plan de EODHD, uso permitido, y la decisión de mantener los datos **detrás de sesión invitada**, sin rating ni categorías de terceros más allá del texto descriptivo, y sin apertura pública hasta revisar la licencia |
| 5.3 | `privacidad-alfa.html` (`noindex`, enlazada desde «Tu cuenta»), **partiendo del borrador ya existente** `docs/BORRADOR_PRIVACIDAD_ENTREGA_2_20260902.md` y de los demás borradores de la Entrega 2 | Responsable, datos (correo; contraseña cifrada por Firebase; consentimientos; composiciones de cartera: identificadores y pesos), finalidad (probar el laboratorio), lugar (Firestore, `europe-west1`, Google Ireland), plazo (fin de la alfa o baja), derechos y cómo ejercerlos, sin cesión ni uso comercial, sin relación con ninguna entidad financiera |
| 5.4 | Consentimiento | Casilla obligatoria en el primer inicio de sesión; `users/{uid}.consents.alfa_at` |
| 5.5 | Guion de invitación | Qué es la alfa, que no es un servicio ni una recomendación, cómo entrar, qué probar, dónde contar fallos, borrado al terminar |
| 5.6 | Acta e ideas | D6 según 0.3; IDEAS §4: la cuenta de la alfa sustituye a la anterior; las cuentas antiguas del proyecto profesional no se migran |

**Aceptación:** ficha y nota en la rama; `check-render` incluye `privacidad-alfa.html`.

---

## Paso 6 · Cuentas invitadas y publicación (Óscar, 1–2 h)

1. Cuenta de prueba propia en Authentication → Usuarios → Añadir usuario; prueba manual del paso 4 en local (`npm run serve`).
2. Integrar la rama en `main` («Entrega 2b · base propia de la alfa»); esperar GitHub Actions; repetir la prueba en producción.
3. Primera ronda: 3–5 cuentas creadas a mano (correo + contraseña provisional, o «restablecer contraseña» como invitación). Para más de diez: CSV y `firebase auth:import`.
4. Enviar la invitación (5.5); una semana de rodaje; ampliar a la lista completa (≤ 100).
5. Registro de testers (hoja privada: correo, alta, baja): inventario mínimo del marco §11.

**Aceptación:** producción funcionando para las cuentas invitadas; borrar la cuenta de prueba desde «Tu cuenta» la elimina de Authentication y de Firestore.

---

## Paso 7 · Verificación independiente (Claude, 2 h)

Lectura del árbol confirmado; batería y auditoría de render reejecutadas; recuentos en Firestore frente a `sync_runs`; reglas probadas con una sesión real de tester (lectura de `assets` OK, escritura denegada, `users/{otro}` denegado); `grep` del árbol publicado (`dist/`) sin `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net` ni claves; captura de la pestaña Red durante un análisis completo; informe en `docs/` y en el proyecto.

---

## Opcional, después de la alfa · refresco automático y gratuito

Cuando el pipeline lleve unas semanas funcionando a mano: un flujo de GitHub Actions con `schedule` diario que ejecute `todo --solo-precios` con dos secretos del repositorio (`EODHD_API_KEY` y la clave JSON de una **cuenta de servicio de `nuvia-family-wealth`** con el rol `roles/datastore.user`, que es un proyecto de NUVIA y no la maestra). Gratis en el plan de GitHub Actions al volumen de la alfa (≈ 2 min/día) y sin funciones ni facturación en Firebase. No se activa hasta que Óscar lo decida: en la alfa el refresco manual basta.

---

## Calendario

| Día | Pasos | Resultado |
|---|---|---|
| 1 mañana | 0 + 1 | Proyecto listo, reglas publicadas y probadas |
| 1 tarde | 2 | Universo curado en el repositorio |
| 2 – 3 | 3 | Pipeline con batería; primera carga en Firestore |
| 3 – 4 | 4 | Portal contra la base propia, batería en verde |
| 5 mañana | 5 | Ficha, licencia, privacidad, invitación |
| 5 tarde | 6 | Publicado; primeras 3–5 personas |
| 6 | 7 | Verificación; ampliación |

---

## Riesgos

| Riesgo | Tratamiento |
|---|---|
| Los fundamentales de EODHD no cubren fondos europeos (`EUFUND`) | Se comprueba en 0.4 con dos llamadas reales antes de escribir código; si faltan, los fondos entran con precios, nombre y divisa y el solapamiento cubre solo ETF; las llamadas sobran (100.000/día) |
| Planes de EODHD «para uso personal» | Correo de confirmación (0.4b); alfa cerrada, sin redistribución, datos detrás de sesión; ampliación condicionada a la respuesta |
| Ficha de EODHD incompleta para algún fondo (sin posiciones o sin distribución) | `quality.status = INCOMPLETO` y avisos visibles; el laboratorio ya muestra «sin desglose disponible» |
| Licencia de datos frente a terceros | Sesión invitada obligatoria, universo cerrado, sin rating, sin apertura pública; párrafo 5.2 |
| Cuota gratuita agotada por uso anómalo | Spark no factura; error visible y recuperación al día siguiente; años cerrados cacheados en el navegador |
| Serie con huecos o valor cero en EODHD | El proyector descarta puntos sin `adjusted_close` válido y marca `INCOMPLETO` si faltan más del 5 % de sesiones |
| `company-analysis` sin compilar | «En preparación», excluido del build por variable; portarlo a un proxy propio es decisión posterior |

---

## Qué NO hace este plan

- No toca, lee ni configura nada en `bbdd-activos-financieros`; no lee `nuvia-market-data` (solo se pausa su programación).
- No migra cuentas ni carteras existentes: la alfa empieza vacía.
- No despliega funciones, App Check, programaciones ni facturación en `nuvia-family-wealth`.
- No decide la estructura definitiva: la alfa enseñará qué se usa; `ANALISIS_BASE_DATOS_PROPIA_NUVIA_20260902.md` sigue siendo la referencia para entonces, y la migración futura partirá **de esta base**.

# NUVIA · Informe de traspaso a Codex: la base de datos propia de la alfa

> **Nota del 02-09-2026 (tarde) · alcance recortado.** Por decisión del fundador, la alfa **no tendrá cuentas ni recogerá datos de usuarios** y **queda en abierto** (lectura sin sesión); el trámite de licencia de EODHD se da por cerrado. Quedan por tanto **sin efecto** en este documento: el bloque `users/` de las reglas (§3) y su endurecimiento, la sesión y la cuenta (§8.1, §8.4 en su parte de cuenta), las carteras en la nube (§8.3, filas de `guardaCarteraNube`…), la regla 4 de §1 y los puntos 2 y 3 de §12. **Lo vigente está en `docs/PENDIENTE_ALFA_NUVIA_20260902.md`**, que manda sobre este informe donde difieran. El universo, EODHD (lo técnico), el esquema de activos, el pipeline, los contratos de lectura y las regresiones siguen valiendo tal cual.

**Autor:** Claude Fable 5.1 · **Fecha:** 2 de septiembre de 2026 · **versión 2** (tarde), tras el contraste de Codex · **Destinatario:** Codex (ChatGPT 5.6), ejecutor de los pasos 3, 4 y 5 del plan.
**Documento rector:** `docs/PLAN_ALFA_BASE_PROPIA_NUVIA_20260902.md` (versión 2, «desde cero»). Este informe no lo sustituye: recoge **lo que ya está hecho y comprobado en vivo** (pasos 0, 1 y 2), fija los contratos que el código tiene que cumplir y señala las trampas encontradas al preparar el terreno. Donde este informe y el plan difieran, manda este informe, porque está escrito después y sobre datos reales.

### Cambios de la versión 2 (respuesta al contraste de Codex, 02-09-2026)

Codex revisó la versión 1 sin tocar Firebase y señaló cinco puntos. Los cinco eran acertados y se corrigen aquí:

| Punto de Codex | Comprobación | Corrección aplicada |
|---|---|---|
| El informe permitía 3–5 invitados antes de la respuesta de EODHD; el acta dice que hasta entonces el único usuario es el fundador | Cierto: acta, adenda §4 (D7), último punto | §1 y §12: **ningún invitado hasta la confirmación escrita de EODHD**; la cuenta de prueba del fundador es la única |
| El CSV no tiene columna de divisa y el informe decía que la divisa salía del CSV | Cierto | Columna **`divisa`** añadida (EUR en las 725 líneas, procede del filtro con que se construyó la lista) y **comprobación obligatoria contra EODHD** en `descargar` (§4, §5.1) |
| `data/` se copia entera a `dist/` (`scripts/build-site.mjs`, línea 58): el CSV y el Excel de la alfa se publicarían | Cierto | Los tres ficheros del universo **se mueven a `universo/`** (raíz, fuera de las carpetas copiadas) y `check-static-site` debe fallar si `dist/data/` contiene `universo-alfa*` (§4, §9) |
| Dejar de compilar `company-analysis` no basta: `build-site.mjs` copia `company-analysis/build` si existe (líneas 111–113) | Cierto | La copia queda condicionada a `NUVIA_EMPRESAS=1` y `check-static-site` falla si `dist/company-analysis/` existe sin esa variable (§8.4, §9) |
| Los fondos no tienen desglose: un dato desconocido no debe convertirse en cero; faltan reglas de conservación de históricos y de cargas a medias | Cierto | `exposures.regions/sectors = null` para fondos (nunca `{}` ni 0), con `exposures.source` declarado; caché cruda como fuente de verdad, regeneración completa de los documentos de año, manifiesto escrito el último y solo si cuadran los recuentos (§6, §7) |

Sobre las reglas de Firestore, Codex tiene razón en que no validan el contenido de cada posición: las reglas de Firestore no iteran listas, así que la validación por elemento se hace en el cliente y en la batería, y las reglas se endurecen en lo que sí pueden (§3).

---

## 1. En una página

La alfa de NUVIA (≤ 100 personas invitadas, sin acceso público, sin comercialización) va a funcionar contra una base de datos **propia, nueva y vacía** en el proyecto Firebase **`nuvia-family-wealth`** (plan gratuito Spark, sin facturación). Los datos de mercado se descargan de **EODHD con la clave personal de Óscar** mediante un script local que corre en su PC y escribe en Firestore; el portal deja de llamar a Cloud Functions y lee Firestore por REST con la sesión del usuario.

Tres reglas que no admiten excepción:

1. **Ninguna relación con `bbdd-activos-financieros`** (la maestra de otro programa) **ni con `nuvia-market-data`**: ni credenciales, ni lecturas, ni copias, ni `--project`, ni referencias en código. A partir del paso 4 lo vigila una regresión automática (§9).
2. **Ningún secreto en el repositorio.** La clave de EODHD vive solo en la variable de entorno `EODHD_API_KEY` de la sesión de PowerShell de Óscar. La `apiKey` web de Firebase sí puede ir en código (es pública por diseño), pero la antigua de la maestra tiene que desaparecer.
3. **Sin rating, sin estrellas, sin «mejores», sin recomendación** (marco regulatorio §5): el pipeline no copia campos de mérito aunque EODHD los traiga (§5.4).
4. **Ningún invitado hasta que EODHD confirme por escrito** que la alfa cerrada cabe en los planes contratados (acta, adenda §4). Hasta entonces la única cuenta es la del fundador. Que la prueba sea pequeña, cerrada o gratuita no la cubre por sí solo.

Lo que Codex tiene que entregar: el pipeline `scripts/mercado-alfa/` (paso 3), la adaptación del portal (paso 4) y los textos y pruebas asociados (paso 5 en la parte técnica). Óscar ejecuta los scripts, hace los commits y publica. Claude verifica al final (paso 7).

---

## 2. Estado real de la infraestructura (comprobado el 02-09-2026)

| Elemento | Valor / estado |
|---|---|
| Proyecto Firebase | `nuvia-family-wealth` · número `128295996347` · plan Spark, **sin facturación** |
| Firestore | Base `(default)`, modo nativo, **`europe-west1`**, creada el 02-09-2026 06:55 UTC, vacía |
| App web | «NUVIA Portal Lab» · `appId` `1:128295996347:web:6f6c78f0efd8532a00129e` · **`apiKey` `AIzaSyAhlsp0ueNu3xmjvLNI2IpxRC66fWEghHo`** · `authDomain` `nuvia-family-wealth.firebaseapp.com` · sin Hosting |
| Authentication | Correo/contraseña **activado**; anónimo **desactivado**; **alta de usuarios cerrada** (`accounts:signUp` devuelve `ADMIN_ONLY_OPERATION`, comprobado); borrado de cuenta por el propio usuario permitido; dominios autorizados: `localhost`, `nuvia-family-wealth.firebaseapp.com`, `nuvia-family-wealth.web.app`, `oantiza.github.io` |
| Reglas de Firestore | Publicadas el 02-09-2026 desde `firestore.rules` (repositorio, raíz). Contenido en §3 |
| `firebase.json` | Se le ha añadido `"firestore": {"rules": "firestore.rules"}`; el bloque `hosting` no se toca |
| `.firebaserc` | `default: nuvia-family-wealth` (ya lo era) |
| Cuentas | **Ninguna todavía.** Óscar creará la suya de prueba en Authentication → Usuarios → Añadir usuario (paso 6) |
| `nuvia-market-data` | Trabajo programado `daily_nuvia_sync` **en pausa** (`state: PAUSED`); no se lee ni se borra por ahora |
| `bbdd-activos-financieros` | **Intacta.** Nada de lo anterior la ha tocado; nada de lo siguiente debe tocarla |

Herramientas en el PC de Óscar: `gcloud` y `firebase` CLI autenticados como `oantiza@gmail.com` (propietario del proyecto), Node 22, PowerShell. `gcloud auth print-access-token` devuelve un token con permiso de propietario sobre `nuvia-family-wealth`; **es lo que usará el pipeline para escribir**, y no pasa por las reglas.

---

## 3. Reglas de Firestore publicadas

Fichero `firestore.rules` (ya en el repositorio, sin seguimiento en git todavía). Se publican con `firebase deploy --only firestore:rules` desde la raíz; el proyecto activo es el de `.firebaserc`.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function invitado() {
      return request.auth != null
        && request.auth.token.firebase.sign_in_provider == 'password';
    }
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
          && request.resource.data.keys().hasOnly(['name', 'base_currency', 'positions', 'created_at', 'updated_at'])
          && request.resource.data.positions is list
          && request.resource.data.positions.size() <= 25
          && request.resource.data.name is string
          && request.resource.data.name.size() <= 80;
      }
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

Consecuencias para el código del portal:

- Sin sesión de correo/contraseña **no se lee nada**: ni catálogo, ni fichas, ni series. Una sesión anónima tampoco sirve (`sign_in_provider` tiene que ser `password`). Por eso desaparece `sesionNueva()` (alta anónima).
- Los documentos de usuario y cartera solo admiten **exactamente** las claves listadas. Un campo de más (por ejemplo `portfolio_id` dentro del documento, o `description`) hace fallar la escritura con `PERMISSION_DENIED`. El identificador de la cartera es el **id del documento**, no un campo.
- Las listas de carteras se consultan con `runQuery` **bajo el padre `users/{uid}`** (consulta de colección, no de grupo de colecciones); una consulta sobre `portfolios` como grupo sería denegada.
- Las reglas solo se cambian editando `firestore.rules` en el repositorio y republicando; nunca desde la consola.

**Endurecimiento pendiente (Codex lo incluye en la entrega del paso 4 y Óscar lo republica):** las reglas de Firestore no pueden recorrer una lista, así que **no** pueden validar cada `{asset_id, weight_percent}`; eso lo hace el cliente antes de escribir (ISIN de 12 caracteres, peso numérico entre 0 y 100, suma ≤ 100, sin duplicados) y lo prueba la batería. Lo que las reglas sí pueden exigir, y deben añadir a las condiciones actuales:

```
// users/{uid}
&& request.resource.data.created_at is string
&& request.resource.data.schema_version is string
&& request.resource.data.consents is map
&& request.resource.data.consents.keys().hasOnly(['comunicaciones', 'analitica', 'alfa_at', 'updated_at'])
// users/{uid}/portfolios/{pid}
&& request.resource.data.base_currency == 'EUR'
&& request.resource.data.positions.size() >= 1
&& request.resource.data.created_at is string
&& request.resource.data.updated_at is string
```

El límite de 25 posiciones se mantiene (el constructor usa 5; el margen es para no republicar reglas al primer cambio). La batería `docs/nuvia-reglas.test.mjs` (§9) cubre cada condición con un caso que pasa y otro que falla.

---

## 4. Universo de la alfa (paso 2, cerrado)

Fichero **`universo/universo-alfa.csv`** (versionado, contenido editorial) con **725 líneas** de datos, de las que **161 tienen `incluir=si`**. **Está en la carpeta `universo/` de la raíz, no en `data/`:** `scripts/build-site.mjs` copia `data/` entera a `dist/` (`directorios = ['estilos', 'js', '_ds', 'core', 'data']`) y la lista de la alfa no debe publicarse en la web; el catálogo que ve el usuario sale de Firestore detrás de sesión. Si en el árbol de Óscar quedara alguna copia en `data/universo-alfa.*` de la versión anterior, se borra. Cabecera y contrato:

```
asset_id,eodhd_symbol,instrument_type,clase,grupo,nombre,divisa,incluir
IE00BYX5NX33,IE00BYX5NX33.EUFUND,FUND,EQUITY,referencia-bolsa,Fidelity MSCI World Index Fund EUR P Acc,EUR,si
IE00B03HD191,IE00B03HD191.EUFUND,FUND,EQUITY,referencia-bolsa,Vanguard Global Stock Index Fund EUR Acc,EUR,si
LU0132601682,LU0132601682.EUFUND,FUND,FIXED_INCOME,referencia-bonos,Morgan Stanley Investment Funds - Euro Corporate Bond Fund A,EUR,si
LU0113257694,LU0113257694.EUFUND,FUND,FIXED_INCOME,referencia-bonos,Schroder International Selection Fund EURO Corporate Bond A Accumulation EUR,EUR,si
```

| Columna | Regla |
|---|---|
| `asset_id` | ISIN. Es el identificador del documento en `assets/` y el que va en las carteras guardadas |
| `eodhd_symbol` | Fondos: `ISIN.EUFUND`. ETF y acciones: ticker y bolsa (`IWDA.AS`, `TEF.MC`, `.XETRA`, `.MI`, `.PA`). **Puede venir vacío** (ver TSK) |
| `instrument_type` | `FUND`, `ETF`, `STOCK` |
| `clase` | `EQUITY`, `FIXED_INCOME`, `MIXED`, `MONEY_MARKET`, `OTHER`. **Obligatoria para fondos** (EODHD no devuelve ficha de fondos europeos). Para ETF y acciones, si está rellena manda sobre EODHD |
| `grupo` | Etiqueta interna para ordenar el catálogo y para las pruebas. **No se muestra como ranking ni recomendación** |
| `nombre` | Nombre comercial. Para fondos es el que ve el usuario; para ETF y acciones se usa si EODHD no trae `General.Name` |
| `divisa` | **Declaración**, no comprobación: `EUR` en todas las líneas (la lista se construyó filtrando por EUR el catálogo de origen). `descargar` la contrasta con EODHD y excluye con aviso cualquier instrumento cuya divisa real no coincida (§5.1). Una línea sin `EUR` no se descarga |
| `incluir` | `si` / `no`. Con `no` la línea se conserva pero **no se descarga ni se publica** |

Composición de las 161 incluidas: 99 FUND, 8 ETF, 54 STOCK. Por grupo: `referencia-bolsa` 2, `referencia-bonos` 2, `fondos-bolsa` 74, `fondos-bonos` 11, `fondos-mixtos` 7, `fondos-monetarios` 2, `fondos-otros` 1, `etf` 8, `acciones` 54. Objetivo del plan: 50–150; 161 lo admite el fundador.

Detalles que el pipeline tiene que contemplar:

- **Los cuatro primeros son obligatorios** (`ACTIVOS_BENCHMARK` de `js/nuvia-constructor.js`: bolsa `IE00B03HD191`, `IE00BYX5NX33`; bonos `LU0113257694`, `LU0132601682`). `publicar` debe fallar si alguno de los cuatro no está en `assets_ok`.
- **`ES0105394003` (TSK, `acciones`) tiene `eodhd_symbol` vacío.** Óscar quiere mantenerla. El script `descargar` debe resolver los símbolos vacíos **una sola vez** con `GET https://eodhd.com/api/search/{ISIN}?api_token=…`, proponer el candidato en EUR en `informe-descarga.txt` y **no adivinar**: si no hay candidato claro, la línea queda fuera de la publicación y se lista al final. El símbolo definitivo lo fija Óscar en el CSV.
- El CSV está guardado por Excel/PowerShell en Windows: **usa `\r\n`** y puede llevar BOM. El lector debe tolerar ambos (`.replace(/^﻿/, '')`, `split(/\r?\n/)`) y recortar espacios. Los nombres pueden contener comas (ninguno lleva comillas hoy, pero un lector CSV mínimo con comillas es más seguro que `split(',')`).
- `universo/universo-alfa.xlsx` es la vista de edición de Óscar (desplegable si/no, filtros); **la fuente de verdad para el código es el CSV**. `universo/universo-alfa.LEEME.md` documenta las columnas.
- `grupo` sirve para ordenar el catálogo (referencia primero, luego fondos, ETF, acciones) y para las pruebas. En pantalla, el universo se presenta como «instrumentos disponibles en la alfa».

---

## 5. EODHD: lo comprobado con llamadas reales

Planes de Óscar: **EOD Historical Data – All World** y **Fundamentals Data Feed** (100.000 llamadas/día, 1.000/min; cada petición de fundamentales cuenta **10** llamadas). Licencia «uso personal»: las condiciones públicas de EODHD restringen mostrar o facilitar sus datos a terceros bajo ese plan, así que Óscar pide a EODHD confirmación por escrito para la alfa cerrada (y, de paso, para el uso de desarrollo de NUVIA); **hasta que llegue, el único usuario es el fundador** (acta, adenda §4). El desarrollo, la primera carga y las pruebas con la cuenta del fundador no esperan a esa respuesta; las invitaciones sí. Para el código esto significa dos cosas: los datos van siempre detrás de sesión invitada y nunca se ofrecen en descarga, y ninguna pantalla de la alfa puede sugerir que el acceso está abierto.

### 5.1 Endpoints y lo que devuelven

| Llamada | Coste | Resultado comprobado |
|---|---|---|
| `GET https://eodhd.com/api/eod/{symbol}?api_token=…&fmt=json&period=d&from=AAAA-MM-DD` | 1 | Funciona para **fondos** (`IE00B03HD191.EUFUND` llega al 01-09-2026 con `adjusted_close` diario), ETF y acciones. Campos: `date, open, high, low, close, adjusted_close, volume`. **Se usa `adjusted_close`** |
| `GET https://eodhd.com/api/fundamentals/{symbol}?api_token=…` | 10 | **Fondos europeos: vacío** (`IE00B03HD191.EUFUND` devuelve `General` con nombre y divisa y `MutualFund_Data` todo `null`; `LU0113257694.EUFUND` devuelve `{}`). **ETF: completo** (`IWDA.AS`). **Acción: completo** (`TEF.MC`) |
| `GET https://eodhd.com/api/search/{isin}?api_token=…` | 1 | Para resolver símbolos dudosos (TSK). Devuelve lista de `{Code, Exchange, Name, Currency, ISIN, Type}` |

Regla derivada: **fundamentales solo para ETF y acciones**, y solo en la carga inicial y en refrescos completos (nunca con `--solo-precios`). Los fondos entran con nombre y clase **del CSV** más precios de EODHD.

**Comprobación de divisa (obligatoria en `descargar`, carga inicial y refrescos completos):** `/api/eod` no devuelve la divisa, así que se contrasta por otra vía según el tipo. ETF y acciones: `General.CurrencyCode` de la ficha de fundamentales que ya se pide. Fondos: `GET /api/search/{isin}` (1 llamada) y se toma `Currency` de la entrada cuyo `Code` coincide con el símbolo del CSV (el esqueleto de fundamentales de `IE00B03HD191.EUFUND` también trae `CurrencyCode: EUR`, pero `LU0113257694.EUFUND` devuelve `{}`, así que no sirve como regla general). Resultado en `informe-descarga.txt` línea a línea (`divisa declarada / divisa EODHD / veredicto`) y en `assets/{id}.source.currency_check = {method, value, checked_at}`. Cualquier discrepancia o divisa no confirmable excluye el instrumento de la publicación con aviso; **no se publica nada cuya divisa no se haya podido confirmar**.

Coste real de la carga inicial con 161 instrumentos: 161 llamadas de precios + 99 de búsqueda (fondos) + 62 × 10 de fundamentales ≈ **880 llamadas**; refresco de precios ≈ 161. Ritmo prudente: 4 peticiones/segundo con reintento y espera ante `429`.

### 5.2 Muestras guardadas (`docs/fixtures/eodhd/`, sin clave)

| Fichero | Contenido | Uso en pruebas |
|---|---|---|
| `muestra-fondo.json` | `IE00B03HD191.EUFUND`: `General` (Code, Type FUND, Name, Exchange EUFUND, CurrencyCode EUR, ISIN null) y `MutualFund_Data` con todos los valores `null` | El proyector debe **ignorar** los fundamentales de fondos y tomar nombre y clase del CSV |
| `muestra-fondo-lu.json` | `{}` | El proyector no debe romper con respuesta vacía |
| `muestra-etf.json` | `IWDA.AS` completo: `General` (Name, Type ETF, Exchange AS, CurrencyCode EUR, CountryName, Description) y `ETF_Data` (ISIN, Domicile, Inception_Date, `Ongoing_Charge` "0.2000", TotalAssets, `Asset_Allocation`, `World_Regions`, `Sector_Weights`, `Fixed_Income`, `Holdings_Count`, `Top_10_Holdings`, `Holdings`, `Valuations_Growth`, `MorningStar`, `Performance`) | Fuente de `costs`, `exposures`, `holdings/latest` |
| `muestra-accion.json` | `TEF.MC` recortado a `General` (Code, Name, Exchange MC, CurrencyCode EUR, ISIN, Sector, Industry, CountryName, Type) + `Highlights` + `Technicals` + una clave `_nota` explicativa | Fuente de `sector`, `region`, `display_name` de acciones |

**Trampa detectada:** `muestra-etf.json`, `muestra-fondo.json` y `muestra-fondo-lu.json` están guardados por PowerShell con **BOM UTF-8 y CRLF**; `JSON.parse` de Node falla con el BOM (`Unexpected token '﻿'`). O bien Codex los vuelve a guardar sin BOM (aceptable: son fixtures sin clave) o el lector de fixtures y el lector de la caché cruda hacen `.replace(/^﻿/, '')` antes de parsear. Recomiendo las dos cosas.

### 5.3 Formas de EODHD que hay que traducir

- `ETF_Data.Asset_Allocation`: objeto `{ "Stock US": {Long_%, Short_%, Net_Assets_%}, "Stock non-US": …, "Bond": …, "Cash": …, "Other": …, "NotClassified": … }`, porcentajes **en texto** (`"71.6882"`). Renta variable = `Stock US` + `Stock non-US` (`Net_Assets_%`).
- `ETF_Data.World_Regions`: `{ "North America": {"Equity_%": "75.543", "Relative_to_Category": …}, "Europe Developed": …, "United Kingdom": …, "Japan": …, "Asia Emerging": … }`. Se usa `Equity_%`, se descarta `Relative_to_Category`.
- `ETF_Data.Sector_Weights`: `{ "Technology": {"Equity_%": …}, "Financial Services": …, "Basic Materials": …, "Consumer Cyclicals": … }`. Igual: solo `Equity_%`.
- `ETF_Data.Top_10_Holdings`: objeto indexado por símbolo `{ "NVDA.US": {Code, Exchange, Name, Sector, Industry, Country, Region, "Assets_%": 5.16034}, … }` (aquí el porcentaje es número). No trae ISIN; `ticker` = `Code`.
- Claves normalizadas para el portal (§8.3): minúsculas, espacios → `_`, sin acentos (`Financial Services` → `financial_services`, `Europe Developed` → `europe_developed`, `North America` → `north_america`). El portal las muestra tal cual, aseadas por `etiquetaClave()`, sin traducir.

### 5.4 Lo que **no** se copia de EODHD

`ETF_Data.MorningStar` (rating, categoría de riesgo, ranking), `ETF_Data.Performance` (rentabilidades de terceros; las métricas de la alfa se calculan en el script con método declarado), `Valuations_Growth`, `Highlights` de acciones (PER, objetivo de precio de analistas, etc.), `Technicals`, `Description` (texto largo del emisor). El esquema de la alfa no tiene sitio para ellos y el marco §5 los prohíbe como señal de mérito. La batería debe comprobar que los documentos publicables **no contienen** las claves `MorningStar`, `Performance`, `rating`, `stars`, `rank`, `WallStreetTargetPrice`.

---

## 6. Esquema de Firestore de la alfa (`nuvia-alfa-asset.v1`)

```
assets/{asset_id}
  asset_id            ISIN (= id del documento)
  isin                ISIN
  ticker              "IWDA" | "TEF" | null (fondos)
  eodhd_symbol        "IWDA.AS" | "IE00B03HD191.EUFUND"
  instrument_type     "FUND" | "ETF" | "STOCK"
  economic_asset_class "EQUITY" | "FIXED_INCOME" | "MIXED" | "MONEY_MARKET" | "OTHER"
  display_name        del CSV (fondos) o de EODHD General.Name (ETF/acciones) con el CSV como respaldo
  currency            "EUR" (siempre; si EODHD dice otra cosa, el activo no se publica)
  region              acciones: General.CountryName; ETF: región principal de World_Regions; fondos: null
  sector              acciones: General.Sector; resto: null
  category            texto descriptivo corto sin mérito: ETF → Index_Name; acción → Industry; fondo → null
  costs               { ongoing_charge: 0.20 } (ETF) | {} (resto)   — en %, número
  exposures           { source: "EODHD" | "csv-clase" | "eodhd-general" | null,
                        asset_mix: {equity, fixed_income, cash, other} | null,   — fracciones 0–1. ETF: de Asset_Allocation (source EODHD). Fondos: SOLO si la clase del CSV es inequívoca (EQUITY→{equity:1}, FIXED_INCOME→{fixed_income:1}, MONEY_MARKET→{cash:1}; source "csv-clase"); MIXED u OTHER → null. Acciones: {equity:1} (source "eodhd-general")
                        regions: {north_america: 75.5, europe_developed: 12.3, …} | null,   — % de la renta variable. ETF: World_Regions. Acciones: {pais_normalizado: 100}. Fondos: null
                        sectors: {technology: 25.1, financial_services: 16.3, …} | null }   — %. ETF: Sector_Weights. Acciones: {sector_normalizado: 100}. Fondos: null
                      Regla: lo desconocido es null, nunca {} ni 0. Un fondo sin desglose lleva además quality.warnings ["sin desglose de regiones y sectores en la alfa (EODHD no lo publica para fondos europeos)"]
  metrics             { as_of_date, return_1y, return_3y_annualized, volatility_1y, volatility_3y, max_drawdown_3y,
                        method: "log-returns diarios sobre adjusted_close; anualización √252; ventanas por fecha natural" }
  history             { first_date, last_date, observations, years }
  quality             { status: "OK" | "INCOMPLETO", warnings: [] }
  source              { system: "EODHD", symbol, fetched_at, currency_check: {method:"fundamentals"|"search", value:"EUR", checked_at} }
  schema_version      "nuvia-alfa-asset.v1"
  updated_at          ISO 8601

assets/{asset_id}/series/{AÑO}          { asset_id, year, currency:"EUR", first_date, last_date, n, points:[{date:"AAAA-MM-DD", value:<adjusted_close>}] }
assets/{asset_id}/holdings/latest       solo ETF: { as_of_date, source:"EODHD", holdings_count, top10_weight,
                                          holdings:[{name, isin:null, ticker, weight_pct, country, sector}] }
catalog_chunks/{000..nnn}               { items:[{asset_id, display_name, instrument_type, economic_asset_class, isin, ticker, grupo}], n }
catalog_manifest/public                 { total, chunks, updated_at, prices_last_date, universe:"alfa", schema_version }
sync_runs/{AAAA-MM-DD}                  { started_at, finished_at, assets_ok, assets_failed:[{asset_id, motivo}], series_written, holdings_written, prices_last_date_min, prices_last_date_max, api_calls }

users/{uid}                             { created_at, consents:{comunicaciones, analitica, alfa_at, updated_at}, schema_version }
users/{uid}/portfolios/{id}             { name, base_currency:"EUR", positions:[{asset_id, weight_percent}], created_at, updated_at }
```

Notas de diseño:

- **Series por año natural**, un documento por año desde 2021 (ventana de 3 años con margen). Un año de precios diarios ocupa ~10 KB; muy lejos del límite de 1 MiB por documento. El portal lee `series/2023..2026` para la ventana 3Y y cachea los años cerrados.
- **Puntos válidos:** se descartan los días sin `adjusted_close` numérico > 0. Si en la ventana de 3 años faltan más del 5 % de sesiones esperadas (≈ 252/año), `quality.status = "INCOMPLETO"` con aviso.
- **Métricas** (sobre `adjusted_close`, r_t = ln(P_t / P_{t-1})): `return_1y` = P_last / P_{≥ last−1 año} − 1; `return_3y_annualized` = (P_last / P_{≥ last−3 años})^(1/años reales) − 1; `volatility_1y` y `volatility_3y` = desviación típica muestral de r_t en la ventana × √252; `max_drawdown_3y` = mín(P_t / máx_{s≤t} P_s − 1). Si la serie no cubre la ventana, la métrica es `null` y se anota en `warnings`. **Sin Sharpe** en la alfa. Todo en fracciones (0,1234 = 12,34 %), documentado en `method`. La batería usa una serie sintética de resultado conocido (por ejemplo, precio geométrico constante → volatilidad 0 y rentabilidad exacta).
- **Catálogo en trozos** de ≤ 200 elementos (con 161 instrumentos, un solo trozo `000`); el manifiesto lleva `updated_at`, que es la clave de caché del navegador.
- `holdings/latest` solo existe para ETF. Para fondos **no hay documento**: el portal ya interpreta la ausencia como «sin desglose disponible». En la alfa, por tanto, el solapamiento solo puede calcularse entre ETF, y la concentración por sectores y regiones solo cubre ETF y acciones; para los 99 fondos el análisis tiene que decir «sin datos de desglose», nunca 0 % ni «sin concentración». Esto es una limitación real de la alfa y se declara en la ficha regulatoria y en pantalla.
- `catalog_manifest/public.prices_last_date` es la fecha que enseña el laboratorio en «Datos a fecha …».

---

## 7. Pipeline `scripts/mercado-alfa/` (paso 3, lo escribe Codex, lo ejecuta Óscar)

Node 22 sin dependencias nuevas (`fetch` nativo, `node:fs`, `node:path`). Órdenes:

```
node scripts/mercado-alfa/run.mjs descargar   [--solo-precios] [--desde 2021-01-01]
node scripts/mercado-alfa/run.mjs proyectar
node scripts/mercado-alfa/run.mjs publicar    [--dry-run]
node scripts/mercado-alfa/run.mjs todo        [--solo-precios]
```

| Fase | Entrada | Salida | Detalles |
|---|---|---|---|
| `descargar` | CSV (`incluir=si`), `EODHD_API_KEY` | `output/mercado-alfa/crudo/{symbol}.eod.json`, `{symbol}.fundamentals.json` (solo ETF/STOCK), `output/mercado-alfa/informe-descarga.txt` | Resuelve símbolos vacíos con `/api/search/{isin}` (una vez, propone, no adivina). Con `--solo-precios`, `from` = hoy − 12 días y no pide fundamentales. Informe: símbolos fallidos, divisas ≠ EUR, series cortas (< 3 años), candidatos propuestos. Falla con salida ≠ 0 si `EODHD_API_KEY` no está definida. **Nunca escribe la clave en ningún fichero ni la imprime** |
| `proyectar` | crudo + CSV | `output/mercado-alfa/publicable/assets/{id}.json`, `series/{id}/{año}.json`, `holdings/{id}.json`, `catalog/*.json`, `resumen.json` | Funciones puras en `scripts/mercado-alfa/proyecta.mjs` (importables desde la batería). Con `--solo-precios` en `todo`, reutiliza el `.fundamentals.json` de la caché si existe |
| `publicar` | publicable | Firestore `nuvia-family-wealth` + `sync_runs/{fecha}` | REST `POST https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents:commit` con lotes de **200 escrituras** (`update` con `currentDocument` sin condición = upsert). Cabeceras: `Authorization: Bearer $(gcloud auth print-access-token)` y `x-goog-user-project: nuvia-family-wealth`. El token se obtiene ejecutando `gcloud` como proceso hijo (`child_process.execFileSync('gcloud', ['auth','print-access-token'])`), no se pega a mano. `--dry-run` cuenta y no escribe. Al final compara recuentos (activos, series, desgloses) entre `publicable/` y lo escrito, y **falla** si no cuadran o si falta alguno de los cuatro de referencia. Cuota: ≈ 161 + ~900 series + 8 desgloses + 2 catálogo ≈ 1.100 escrituras por carga completa (límite gratuito 20.000/día) |

Conversión a formato REST de Firestore: los valores van tipados (`{stringValue}`, `{doubleValue}`, `{integerValue}`, `{booleanValue}`, `{nullValue}`, `{arrayValue:{values}}`, `{mapValue:{fields}}`, `{timestampValue}`). Conviene un conversor puro `aFirestore(obj)` / `deFirestore(doc)` en `scripts/mercado-alfa/firestore-rest.mjs` **compartido conceptualmente** con el del portal (§8.1); puede ser el mismo módulo si se coloca en un sitio que el navegador también pueda importar, o dos copias con la misma batería.

`.gitignore` ya ignora `output/` entera, así que `output/mercado-alfa/` (caché cruda, publicable, informe) queda fuera de git sin tocar nada.

### 7.1 Conservación de históricos y cargas a medias

- **La caché cruda local es la fuente de verdad de los precios.** `descargar` completo guarda toda la serie desde `--desde`; `descargar --solo-precios` pide solo los últimos 12 días y **los fusiona** en el `.eod.json` existente (por fecha; el valor nuevo sustituye al antiguo si EODHD reajusta un `adjusted_close`). Si no existe caché para un instrumento, `--solo-precios` lo descarga completo. Así `proyectar` **regenera siempre los documentos de año enteros** a partir de la caché y `publicar` los sobrescribe completos: nunca se escribe un año «parcial» en Firestore ni se pierden puntos de un año cerrado. La caché cruda se copia de vez en cuando fuera del PC (Óscar decide dónde); si se perdiera, una descarga completa la reconstruye en 15 minutos.
- **Orden de escritura:** primero `assets/*`, `series/*` y `holdings/*`; después `catalog_chunks/*`; **el manifiesto el último**, y solo si los recuentos escritos cuadran con `publicable/`. Como el navegador entra por el manifiesto (`updated_at`, `prices_last_date`), una carga interrumpida deja el manifiesto anterior intacto y el portal sigue enseñando un conjunto coherente (los documentos ya reescritos son versiones más nuevas de activos que ya existían; para los activos nuevos, su ausencia en el catálogo anterior los hace invisibles hasta que la carga termine).
- **`sync_runs/{fecha}`** se escribe al principio con `status: "en_curso"` y al final con `"ok"` o `"fallida"` y el motivo. `publicar` se niega a empezar si el último `sync_runs` sigue `en_curso` con menos de una hora, salvo `--forzar`.
- **Instrumentos retirados del CSV** (`incluir=no` o línea borrada) **no se borran de Firestore automáticamente:** una cartera guardada puede referenciarlos. Dejan de estar en el catálogo (no se pueden añadir) pero su ficha y sus series siguen legibles. `publicar --retirados` lista los que están en Firestore y no en el CSV; borrarlos es una orden aparte y consciente de Óscar.
- **Idempotencia:** ejecutar `publicar` dos veces seguidas con el mismo `publicable/` produce el mismo estado y no falla.

Primera carga (Óscar, después de que Codex entregue): `descargar` → leer `informe-descarga.txt` → corregir CSV (TSK y lo que salga) → `proyectar` → `publicar --dry-run` → `publicar`. Refresco: `todo --solo-precios`, a mano, semanal.

Nombre de la instrucción en `package.json`: `"mercado-alfa": "node scripts/mercado-alfa/run.mjs"` es suficiente; **no** se añade a `validate` ni a `build` (necesita red y clave).

---

## 8. El portal contra la base propia (paso 4)

Principio del plan: **los módulos de análisis no cambian** (`nuvia-constructor.js`, `nuvia-analisis.js`, `nuvia-concentracion.js`, `nuvia-modelos.js`, `nuvia-informe.js`…), con una sola excepción acotada y justificada en §8.3 bis. Cambian `js/nuvia-datos.js` (casi entero), parte de `js/nuvia-cuenta.js` y el estado de `cartera.html`. `creaClienteMaestra` conserva su nombre y su firma de inyección (`fetchFn`, `almacen`, `ahora`) para que las baterías sigan funcionando; el objeto devuelto conserva **todos** los métodos actuales: `llama, buscaActivos, sesion, sesionActual, nivelSesion, creaCuenta, iniciaSesion, cierraSesion, recuperaContrasena, cambiaContrasena, pideCambioCorreo, borraCuenta, guardaCarteraNube, listaCarterasNube, leeCarteraNube, borraCarteraNube, detalleActivo`.

### 8.1 Configuración y sesión

```js
export const PROYECTO = { apiKey: 'AIzaSyAhlsp0ueNu3xmjvLNI2IpxRC66fWEghHo', id: 'nuvia-family-wealth' };
const URL_DOCS = `https://firestore.googleapis.com/v1/projects/${PROYECTO.id}/databases/(default)/documents`;
```

- Desaparecen `region`, `urlFuncion` y `sesionNueva()` (alta anónima). `sesion()` devuelve la sesión registrada renovada por `securetoken.googleapis.com` o lanza `Error` con `codigo = 'SIN_SESION'`; los métodos de datos propagan ese error y el constructor lo trata como «inicia sesión para usar el laboratorio».
- **Clave de `localStorage` nueva:** `nuvia.alfa-sesion.v1` (la actual `nuvia.maestra-sesion.v1` guarda tokens de la maestra; si se reutilizara, el navegador de quien haya entrado antes enviaría al proyecto nuevo un token del proyecto antiguo y fallaría de forma confusa). Al arrancar, si existe la clave antigua se borra.
- `creaCuenta` deja de existir como acción de interfaz (el alta está cerrada en el servidor y devolvería `ADMIN_ONLY_OPERATION`); puede quedarse en el cliente para que la batería compruebe que traduce ese código a «La alfa es por invitación; escríbenos para entrar». `iniciaSesion`, `recuperaContrasena`, `cambiaContrasena`, `pideCambioCorreo` y `borraCuenta` siguen usando Identity Toolkit con la `apiKey` nueva.
- `llama(nombre, datos)` se conserva como **fachada** para no tocar los módulos: `get_price_series` → `seriesRebasadas`, `get_asset_holdings` → lectura de `holdings/latest`, `get_asset_holdings_batch` → lecturas en paralelo, `search_assets` → catálogo en memoria, `get_asset_detail` → `detalleActivo`, `save_portfolio` / `list_portfolios` / `get_portfolio` / `delete_portfolio` → REST de carteras. Cualquier otro nombre lanza `Error('Función no disponible en la alfa')`. Así `nuvia-constructor.js` y `nuvia-analisis.js` no cambian ni una línea.

### 8.2 Lecturas de Firestore por REST con la sesión del usuario

`GET {URL_DOCS}/assets/{id}` con `Authorization: Bearer {idToken}` (el token de Firebase Auth vale directamente para Firestore). Lecturas por lotes: `POST {URL_DOCS}:batchGet` con `documents:[…]` (hasta cientos de rutas en una llamada; útil para series y desgloses). Consulta de carteras: `POST {URL_DOCS}/users/{uid}:runQuery` con `structuredQuery: { from:[{collectionId:'portfolios'}], orderBy:[{field:{fieldPath:'updated_at'}, direction:'DESCENDING'}] }`. Escrituras: `PATCH {URL_DOCS}/users/{uid}/portfolios/{id}` (con `updateMask` para no borrar campos) y `DELETE`. Conversor puro `deFirestore(doc)` / `aFirestore(obj)` con batería (mapas, listas, números enteros que Firestore devuelve como cadena en `integerValue`, `null`, fechas ISO como `stringValue` o `timestampValue`).

Errores: `401`/`403` → renovar token una vez y reintentar; si persiste, `SIN_SESION`. `404` en `holdings/latest` → `null` (no es error). `429`/`503` → un reintento con espera.

### 8.3 Contratos de salida que los módulos esperan (no cambian)

| Método de `nuvia-datos.js` | Forma que consumen los módulos hoy | Cómo se construye en la alfa |
|---|---|---|
| `buscaActivos(q, {tipos, limite})` → `{activos, total}` | `activos[]` con `asset_id, display_name, instrument_type, economic_asset_class, isin, ticker` | Catálogo cargado una vez (`catalog_manifest/public` + `catalog_chunks/*`), caché `localStorage` `nuvia.catalogo.v1` invalidada por `updated_at`; búsqueda en memoria sin acentos ni mayúsculas por nombre, ISIN o ticker; `tipos` filtra `instrument_type`; `total` = coincidencias antes de `limite` |
| `detalleActivo(id)` | El constructor lee `f.identity?.display_name`, `f.instrument_type`, `f.economic_asset_class`. El análisis lee además `f.asset_id`, `f.category`, `f.identity?.currency`, `f.identity?.region`, **`f.pms_exposure.equity`** (0–1) y **`f.exposure_detail.sectors`** / **`f.exposure_detail.equity_regions`** (`{clave: peso %}`) | `lee('assets/'+id)` y adaptador puro `fichaParaModulos(doc)`: `identity = {display_name, currency, region, isin, ticker}`; `pms_exposure = exposures.asset_mix ? {equity: asset_mix.equity} : null`; `exposure_detail = (exposures.sectors || exposures.regions) ? {sectors: exposures.sectors, equity_regions: exposures.regions} : null`; `metrics`, `costs`, `quality` tal cual. **`null` significa «sin datos» y así debe llegar a los módulos** (ver la excepción de §8.3 bis) |
| `llama('get_price_series', {asset_ids, frequency:'DAILY', window:'3Y'})` | `{dates: [...], series: [{asset_id, values: [...]}]}`; series rebasadas y alineadas; un activo sin datos en la ventana simplemente **no aparece** en `series` | `seriesRebasadas(ids)`: lee `series/{2023..2026}` de cada activo (los años cerrados se cachean en `localStorage` `nuvia.series.v1.{id}.{año}`), concatena, y la función pura **`alineaYRebasa(seriesPorActivo, {desde, hasta})`** alinea por fechas comunes (intersección de fechas en que todos tienen valor), rebasa cada serie a 100 en la primera fecha común y devuelve exactamente la forma anterior. Sin FX: todo es EUR |
| `llama('get_asset_holdings', {asset_id})` y `_batch({asset_ids})` | `carteraDesdeHoldings` acepta `{holdings:[{name, isin?, ticker?, weight_pct, country?, sector?}]}`. El lote (`holdingsDe`) espera **`{holdings: {asset_id: doc|null}}`**; si el lote falla, el análisis cae a `get_asset_holdings` fondo a fondo (`null` = sin desglose) | `lee('assets/'+id+'/holdings/latest')` → el documento ya tiene la forma corta; el lote se resuelve con `batchGet` y devuelve `{holdings: {id: doc|null}}`. Fondos: `null` → «sin desglose disponible» |
| `guardaCarteraNube(cartera)` → `{portfolio_id, …}` | Entrada `{portfolio_id?, name, positions:[{asset_id, weight_percent}]}`; salida con `portfolio_id` | `id = cartera.portfolio_id || crypto.randomUUID()`; `PATCH users/{uid}/portfolios/{id}` con **solo** `name, base_currency:'EUR', positions, created_at (si nueva), updated_at`; devuelve `{portfolio_id: id, ...}`. Recortar `name` a 80 y `positions` a 25 antes de enviar (el constructor ya limita a `MAX_POSICIONES = 5`) |
| `listaCarterasNube()` → `[{portfolio_id, name, positions, updated_at, …}]` | Ordenada por fecha, más reciente primero | `runQuery` bajo `users/{uid}`; `portfolio_id` = último segmento de `document.name` |
| `leeCarteraNube(id)` / `borraCarteraNube(id)` | `{...}` / `{ok:true}` | `GET` / `DELETE` de la ruta |

### 8.3 bis · La única excepción a «los módulos no cambian»: lo desconocido no se estima

`js/nuvia-concentracion.js` fue portado del proyecto profesional y, cuando un activo no trae distribución, **la estima**: sector por palabras del nombre (`clasificaSectorEstimado`) y región por `region` o, en su defecto, **por divisa** (`regionPorDivisa`: EUR → `{eurozone: 100}`). Con la maestra eso casi nunca se activaba; en la alfa se activaría para los 99 fondos, y un fondo global en euros saldría como «100 % eurozona» con calidad «estimated». Además, `pms_exposure?.equity || 0` convierte «desconocido» en «0 % renta variable» y el fondo desaparece del cálculo sin que se diga. Es exactamente lo que Codex advierte.

Cambio mínimo y acotado, con batería en `docs/nuvia-concentracion.test.mjs`:

- En `agregaConcentracion`, si `activo.exposure_detail === null` o `activo.pms_exposure === null` (null explícito: el adaptador de la alfa lo envía así), **no se estima nada**: el peso de la posición se acumula en un nuevo `pesoSinDatos` y no entra en `pesoTotal`. Los objetos `undefined`/`{}` conservan el comportamiento actual, para no tocar el resto de casos ni las pruebas existentes.
- La salida gana `pesoSinDatos` (en % de la cartera) y `textoCalidad` en `nuvia-analisis.js` lo declara: «El 62 % de la cartera está en fondos sin datos de desglose en la alfa; los sectores y regiones mostrados corresponden solo al resto.» Si `pesoSinDatos` es el 100 %, el bloque muestra «Sin datos de desglose para esta cartera en la alfa» en lugar de una tabla.
- El solapamiento (`carteraDesdeHoldings`) ya trata la ausencia de documento como «sin desglose»; solo hay que comprobar que el texto lo diga con las mismas palabras.

No se cambia ninguna fórmula ni ningún otro módulo.

### 8.4 Cuenta, consentimientos y estado de la página

- `js/nuvia-cuenta.js`: desaparece el formulario «crear cuenta»; queda iniciar/cerrar sesión, recuperar y cambiar contraseña, cambiar correo y **borrar cuenta** en este orden: `users/{uid}/portfolios/*` → `users/{uid}` → `accounts:delete`. Texto: «Alfa por invitación: solo pedimos correo y contraseña. Tus carteras guardadas se quedan en tu cuenta y las borras cuando quieras.»
- Consentimientos: siguen en `localStorage` `nuvia.consentimientos.v1` y **además** se escriben en `users/{uid}` (`consents.comunicaciones`, `consents.analitica`, `consents.alfa_at`, `consents.updated_at`) con `PATCH` y `updateMask`. Primer inicio de sesión: casilla obligatoria de aceptación de la alfa → `consents.alfa_at`. El documento `users/{uid}` solo puede llevar `created_at, consents, schema_version` (reglas).
- `cartera.html`: sin sesión, portada del laboratorio con «Alfa por invitación» y el acceso; con sesión, todo. Línea «Datos a fecha {manifiesto.prices_last_date} · universo de la alfa: instrumentos en euros». `?vista=companies` → «En preparación».
- **`company-analysis/` fuera de la publicación, de verdad.** El módulo depende del proxy de la maestra. No basta con no compilarlo: `scripts/build-site.mjs` (líneas 111–113) **copia `company-analysis/build` a `dist/` si la carpeta existe**, y en el PC de Óscar puede existir de compilaciones anteriores. Por tanto: `build:company-analysis` condicionado a `NUVIA_EMPRESAS=1`; en `build-site.mjs`, la copia también condicionada a esa variable (sin ella, ni copia ni aviso); en `check-static-site.mjs`, **fallo** si existe `dist/company-analysis/` sin `NUVIA_EMPRESAS=1`; y en el flujo de GitHub Actions no se define la variable. `cartera.html` no debe cargar el iframe cuando la vista está «En preparación».
- `CORREOS_ADMIN`, `CLAVE_SUSCRIPCION`, `leeSuscripcion`, `esAdmin` se conservan como están.

### 8.5 Prueba manual (Óscar, con su cuenta de prueba, en `npm run serve`)

Buscar «Vanguard», añadir tres fondos, ver evolución, proyección y solapamiento, guardar cartera, recargar, cargar, borrar, cerrar sesión, comprobar que sin sesión no hay catálogo. Pestaña Red: solo `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` y `firestore.googleapis.com/v1/projects/nuvia-family-wealth/…`.

---

## 9. Baterías y regresión «sin maestra»

| Fichero | Contenido |
|---|---|
| `docs/nuvia-mercado-alfa.test.mjs` (nuevo) | Proyector sobre los cuatro fixtures de `docs/fixtures/eodhd/` (fondo con esqueleto, fondo `{}`, ETF, acción): nombre y clase desde el CSV para fondos; `costs.ongoing_charge = 0.2` y `holdings` de 10 con `top10_weight` para el ETF; `sector`/`region` de la acción; rechazo de divisa ≠ EUR; métricas sobre serie sintética; descarte de puntos inválidos y `INCOMPLETO` por huecos; **ausencia de claves de mérito** (§5.4); recuento de series por año; lector CSV con BOM y `\r\n` |
| `docs/nuvia-reglas.test.mjs` (nuevo) | Con `@firebase/rules-unit-testing` si el emulador está instalado (`firebase emulators:exec --only firestore`); si no, se salta con aviso y se hace a mano antes de publicar reglas. Casos: sin sesión no lee; invitado lee `assets` y no escribe; `users/A` no ve `users/B`; cartera con 26 posiciones o con campo extra rechazada; documento `users` con campo extra rechazado |
| `docs/nuvia-datos.test.mjs` (actualizar) | `deFirestore`/`aFirestore`; catálogo y búsqueda sin acentos; `alineaYRebasa` (alineación por intersección, rebase a 100, activo sin datos fuera de `series`); `fichaParaModulos`; carteras (id nuevo, campos permitidos, recorte); `SIN_SESION`; borrado de la clave antigua de sesión; **ninguna petición a `cloudfunctions.net`** con `fetchFn` espía |
| `docs/nuvia-cuenta.test.mjs` (actualizar) | Sin alta; `ADMIN_ONLY_OPERATION` traducido; borrado en orden; consentimientos escritos en `users/{uid}` |
| `docs/nuvia-concentracion.test.mjs` (ampliar) | `exposure_detail: null` / `pms_exposure: null` → sin estimación, `pesoSinDatos` correcto, `pesoTotal` sin ese peso; los casos actuales con `undefined` y `{}` no cambian |
| `scripts/check-lenguaje.mjs` (ampliar) | **Regresión «sin maestra»:** falla si en `js/`, `scripts/`, `cartera.html`, `web2-integration.js`, `nuvia-site-unified.js` o `.github/workflows/` aparece alguna de estas cadenas: `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, `AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg`, o `api_token=` seguido de algo que no sea `${` (clave de EODHD pegada). Excluye `docs/`, `universo/` y `company-analysis/` (este último queda fuera del build) |
| `scripts/check-static-site.mjs` (ampliar, sobre `dist/`) | Falla si existe `dist/universo/` o cualquier `dist/**/universo-alfa.*`; falla si existe `dist/company-analysis/` sin `NUVIA_EMPRESAS=1`; falla si `dist/` contiene las cadenas de la regresión «sin maestra» |
| Validación de carteras en el cliente (`nuvia-datos.test.mjs`) | Antes de escribir: `asset_id` con forma de ISIN (12 caracteres alfanuméricos), `weight_percent` número finito en [0, 100], suma ≤ 100,01, sin `asset_id` repetido, 1–25 posiciones, `name` recortado a 80. Lo que las reglas no pueden comprobar por elemento se comprueba aquí |

Todo se cuelga de `npm run validate` como hasta ahora (`test:analisis` para las baterías de `js/`). `check-render` sigue exigiendo Chromium (`NUVIA_CHROMIUM` en el PC de Óscar apunta a uno o falla por diseño; Claude lo ejecuta en su entorno).

---

## 10. Estado del repositorio y cómo entregar

- Rama actual en el PC de Óscar: **`prueba/tipografia-empresas`**, con el trabajo de las entregas 4A/4B/5A de Codex sin confirmar (muchos `M` y `??` en `git status`). **Nuestros ficheros no deben mezclarse con ese commit.**
- Ficheros de la Entrega 2b que ya existen sin seguimiento: `firestore.rules`, `universo/universo-alfa.csv`, `universo/universo-alfa.xlsx`, `universo/universo-alfa.LEEME.md`, `docs/fixtures/eodhd/*.json`, `docs/PLAN_ALFA_BASE_PROPIA_NUVIA_20260902.md`, `docs/ESTRUCTURA_MINIMA_ALFA_NUVIA_20260902.md`, `docs/ANALISIS_BASE_DATOS_PROPIA_NUVIA_20260902.md`, `docs/backend-recuperado/` (referencia histórica de `nuvia-market-data`; **no se importa ni se ejecuta**), este informe; y modificados: `firebase.json` (bloque `firestore`) y `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md` (adenda §4, D7).
- Propuesta: rama `codex/entrega-2b-base-alfa` desde `main`, un primer commit «Entrega 2b · base propia de la alfa: proyecto, reglas y universo» con lo anterior, y después los commits de Codex con pipeline (paso 3) y portal (paso 4). **Los commits y el push los hace Óscar**; Codex prepara el árbol y el mensaje.
- `company-analysis/` no se toca en esta entrega salvo la condición de build.

---

## 11. Aceptación de lo que entrega Codex

Orden de ejecución (el que propuso Codex, asumido): primero el pipeline **probado en local sin escribir en Firebase** (`proyectar` sobre los fixtures y sobre una descarga real; `publicar --dry-run`); después, **con autorización expresa de Óscar**, la primera carga controlada; después el portal; y las invitaciones, solo tras superar las pruebas y con la licencia aclarada.

Paso 3: `sync_runs/{fecha}` con `status: "ok"` y `assets_failed` vacío o justificado línea a línea; recuentos cuadrados; los cuatro de referencia con `history.last_date` de la semana en curso; **todos los activos publicados con `currency_check` confirmado en EUR**; fondos con `exposures.regions/sectors = null` y aviso, nunca `{}`; ninguna clave de mérito en Firestore; `informe-descarga.txt` legible por Óscar; la clave nunca aparece en salida ni en ficheros; `publicar` repetido no cambia nada.

Paso 4: `npm run validate` en verde incluida la regresión «sin maestra» y las comprobaciones nuevas de `check-static-site`; prueba manual de §8.5 completa con un fondo, un ETF y una acción, comprobando que el análisis dice «sin datos de desglose» para el fondo; pestaña Red limpia; `dist/` sin `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, la `apiKey` antigua, `universo-alfa.*` ni `company-analysis/`; borrar la cuenta desde «Tu cuenta» la elimina de Authentication y de Firestore.

Lo que Codex **no** hace: abrir clientes, credenciales o consultas contra `bbdd-activos-financieros` o `nuvia-market-data`; escribir en `nuvia-family-wealth` sin que Óscar lo ordene (la primera carga la ejecuta Óscar); migrar cuentas o carteras antiguas (la alfa empieza vacía); desplegar funciones, App Check, programaciones ni facturación en `nuvia-family-wealth`; cambiar reglas desde la consola; añadir columnas de mérito al CSV; crear cuentas de invitados; hacer commits.

---

## 12. Pendiente de Óscar (no bloquea a Codex)

1. Resolver el símbolo de TSK: `Invoke-RestMethod "https://eodhd.com/api/search/ES0105394003?api_token=$env:EODHD_API_KEY"` y fijar `eodhd_symbol` en el CSV (o dejar que `descargar` lo proponga).
2. Enviar el correo de licencia a EODHD (borrador ya entregado; añadir la pregunta por el uso de desarrollo de NUVIA) y archivar la respuesta para la ficha regulatoria del paso 5. **Sin respuesta escrita, no hay invitados.**
3. Crear su cuenta de prueba en Authentication → Usuarios (la única cuenta hasta el punto 2).
4. Cuando Codex entregue el paso 3: primera carga (`descargar` → revisar `informe-descarga.txt`, en especial divisas y TSK → `proyectar` → `publicar --dry-run` → `publicar`).
5. Confirmar que en su árbol ya no queda `data/universo-alfa.*` (los tres ficheros viven ahora en `universo/`).

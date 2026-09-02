# NUVIA · Análisis: base de datos propia y migración desde la base maestra

**Autor:** Claude Fable 5.1  
**Fecha:** 2 de septiembre de 2026  
**Estado:** análisis y propuesta; no autoriza desarrollo ni cambios en ninguna base  
**Regla de partida:** `bbdd-activos-financieros` pertenece a otro programa (BDB Activos) y **no se toca**. Todo lo que sigue se ha comprobado en modo lectura: código del portal, código público de `oantiza/BDB-ACTIVOS`, recuentos y esquemas de Firestore vía API con la sesión de `gcloud` del PC, y el código fuente de la función de sincronización descargado del bucket de despliegue.

---

## 1. Resumen ejecutivo

**La base propia de NUVIA ya existe a medias y el portal no la usa.** El proyecto Firebase `nuvia-market-data` contiene desde el 25 de agosto una copia independiente y adaptada de los datos de mercado (765 activos con esquema propio `nuvia-asset.v1`, 12.544 documentos de series por año, catálogo público en trozos) y una función programada `daily_nuvia_sync` que la actualiza cada día a las 05:30 leyendo BDB (fondos, solo lectura entre proyectos) y EODHD (acciones y ETF). Hoy la ha ejecutado a las 05:30. Sin embargo, `js/nuvia-datos.js` sigue apuntando a `bbdd-activos-financieros` para **todo**: autenticación de visitantes y cuentas, búsqueda, fichas, desgloses, series de precios y, lo más delicado, **las carteras guardadas de los usuarios de NUVIA**, que viven en el Firestore del programa profesional (`bdb_activos/{uid}/portfolios`).

Por tanto la pregunta no es «¿podemos crear una base nueva?», sino «¿qué falta para que el portal deje de depender de la maestra?». Falta lo siguiente:

1. Una **capa de lectura** para el portal sobre los datos ya copiados (hoy no hay ninguna función ni regla pensada para que la web los consuma).
2. Los **desgloses de cartera (holdings)** de los fondos, que la sincronización no copia y que el solapamiento y la concentración necesitan.
3. **Autenticación y datos de usuario propios** (cuentas, consentimientos, carteras guardadas), que son datos personales y no deben seguir en el proyecto de la actividad profesional (marco §8 y §11).
4. Un **repositorio** con el código de la sincronización: la función está desplegada, pero su fuente no está en ningún repositorio ni carpeta local que haya encontrado.
5. Un **proxy propio de EODHD** para «Análisis y valoración de empresas», que hoy usa la función `api` del proyecto profesional.

Recomendación: consolidar todo en **un único proyecto Firebase de NUVIA con dos bases de datos Firestore** —una pública de mercado y otra privada de usuarios— reutilizando íntegramente el esquema y la sincronización que ya existen, y cambiar el portal por fases sin cortar el servicio. Esfuerzo estimado: 10–13 jornadas. Coste de explotación previsible: unos pocos euros al mes al tráfico actual, más la suscripción de EODHD que ya se paga.

---

## 2. Qué usa el portal hoy de `bbdd-activos-financieros`

| Uso | Dónde | Detalle | Riesgo de seguir así |
|---|---|---|---|
| **Autenticación** (sesión anónima de cada visitante y cuentas con correo y contraseña) | `js/nuvia-datos.js` (`PROYECTO.apiKey`, Identity Toolkit), `js/nuvia-cuenta.js` | Los usuarios de NUVIA son usuarios del tenant de Auth del programa profesional; no se pueden distinguir de los de la app BDB | Datos personales de NUVIA dentro del proyecto de la actividad del agente vinculado (marco §8: «no se mezclará… las cuentas… o los datos de NUVIA»; §11) |
| **Búsqueda** `search_assets` | `nuvia-buscador.js` | Texto, tipos, límite; 120 llamadas/min por UID | Depende de límites y despliegues ajenos |
| **Ficha** `get_asset_detail` | `nuvia-constructor.js`, `nuvia-modelos.js`, `nuvia-informe.js` | `identity.display_name`, `instrument_type`, `economic_asset_class`, `isin`, `ticker`, `currency`, `sector`, `region` | Ídem |
| **Desgloses** `get_asset_holdings` / `_batch` | `nuvia-analisis.js:699-720` | El *batch* ya responde **401** a las sesiones del portal y el código cae a llamadas una a una | Ya hay una rotura parcial |
| **Series** `get_price_series` (`DAILY`, ventana `3Y`, rebasadas y en EUR) | `nuvia-constructor.js:1160` | Contrato `{dates, series:[{asset_id, values}]}` | Ídem |
| **Carteras en la nube** `save/list/get/delete_portfolio` | `nuvia-datos.js:328-345` | Escribe en `bdb_activos/{uid}/portfolios/{id}` del Firestore profesional (`source_kind: BDB_APP_OWNED`); hoy hay 11 carteras de 5 UID, la mayoría pruebas | El portal **sí escribe** en la maestra, contra lo que dicen las bases §6 («De solo consulta. Sin excepción»); las bases ya preveían «una base de datos aparte, más adelante, para lo que sí escribe el portal» |
| **Análisis y valoración de empresas** | `company-analysis/src/api.js` → función `api` (`/search`, `/quote`, `/fundamentals`, `/consensus`, `/eod`, `/technicals`, `/news`) | Proxy de EODHD con la clave del proyecto profesional, más `firebase.js` del mismo proyecto | Misma dependencia, otra ruta |

Dos fragilidades concretas, leídas en el código público de BDB (`functions_python/main.py`, commit `7884b13` del 01-09-2026):

- `EMAIL_VERIFIED_REQUIRED` vale **`true` por defecto** (línea 24) y `_require_auth` rechaza cualquier token sin correo verificado (líneas 102-106). Las sesiones anónimas del portal solo funcionan porque el despliegue actual lo desactiva por variable de entorno; un redespliegue con el valor por defecto deja NUVIA sin datos.
- `APPCHECK_ENFORCED` (línea 21) está preparado para exigir App Check; el último commit «calienta» el token de App Check en la app profesional. El día que se active, el portal —que no lo envía— queda fuera.

Ninguna de las dos es una decisión de NUVIA: son decisiones legítimas de otro programa. Esa es la razón de fondo para separar.

Lo que **no** depende de la maestra y no cambia: Mercados (widgets de TradingView, noticias por RSS de El País y Expansión, indicadores del INE y el BCE enlazados), el €STR en `data/ecb-estr.json`, los simuladores de Vivienda, Impuestos y Jubilación, Academia y Lecturas.

---

## 3. Lo que ya existe en `nuvia-market-data`

Comprobado hoy en Firestore (proyecto `nuvia-market-data`, base `(default)`):

| Colección | Documentos | Contenido |
|---|---|---|
| `assets/{asset_id}` | **765** (668 fondos, 78 acciones, 19 ETF) | Esquema `nuvia-asset.v1`: `asset_id`, `instrument_type`, `economic_asset_class`, `display_name`, `isin`, `ticker`, `currency`, `region`, `provider`, `category`, `morningstar_rating`, `costs{ongoing_charge, management_fee}`, `metrics{annualized_return_1y/3y/5y/10y, volatility_1y/3y/5y, sharpe_1y/3y/5y, ytd_return, max_drawdown_hist(+date), risk_score, as_of_date}`, `exposures{asset_mix, regions, sectors, styles, market_caps, confidence}`, `fixed_income_profile`, `holdings_summary{positions_count, top10_weight, as_of_date}`, `quality{status, review_flags, warnings}`, `history{available, first_date, last_date, interval, eodhd_symbol, available_years}`, `search_text`, `source{system:BDB, project_id, asset_id}`, `synced_at` |
| `assets/{id}/series/{EODHD_símbolo_AÑO}` | **12.544** | Un documento por activo y año: `points[{date, value, open, high, low, close, adjusted_close, volume}]`, `first_date`, `last_date`, `observations_count`, `currency`, `series_type`, `source`, `nuvia_source` |
| `catalog_chunks/{000…005}` | 6 (150 ítems cada uno) | Catálogo público para búsqueda en el cliente: `asset_id`, tipo, clase, nombre, ISIN, ticker, divisa, proveedor, categoría, `morningstar_rating`, `quality_status`, `history_available`, `ohlcv_available`, `eodhd_symbol`, `history_last_date` |
| `catalog_manifest/public` | 1 | `chunks`, `total: 765`, `types`, `updated_at` (hoy, 05:30 hora de Madrid) |

Funciones desplegadas en el proyecto (Cloud Functions gen 2, Python 3.14, región `europe-west1`, desplegadas con Firebase CLI el 25-08-2026):

- `daily_nuvia_sync`, programada `30 5 * * *` Europe/Madrid, con el secreto `EODHD_API_KEY`. Lee de BDB **solo lectura, entre proyectos** (`firestore.Client(project="bbdd-activos-financieros")`) las raíces y `metrics/latest` de los fondos y el documento de serie del año en curso; para acciones y ETF pide a EODHD los últimos 12 días y los fusiona en el documento del año; después reconstruye el catálogo. La cabecera del código lo dice literalmente: «Actualización diaria de la base independiente de NUVIA».
- `fundamental_snapshot` (misma fecha; no la he abierto).

El código (`main.py`, 300 líneas, y `nuvia_mapper.py`, el «contrato público y estable de activos para NUVIA») está solo en el zip del bucket de despliegue `gcf-v2-sources-323039599507-europe-west1`. No aparece en `oantiza/BDB-ACTIVOS`, ni en `NUVIA-PORTAL-LAB`, ni en ninguna carpeta con `.firebaserc` del PC (las catorce que hay apuntan a `bbdd-activos-financieros`, `bdb-fondos`, `mis-acciones-oaa`, `analisis-fundamental-75feb` o `nuvia-family-wealth`). He dejado una copia en `docs/backend-recuperado/` para que no se pierda; conviene que Óscar confirme quién lo desplegó y desde dónde.

Otro proyecto: `nuvia-family-wealth` (número 128295996347) existe con Hosting y `.firebaserc` en `NUVIA-PORTAL-LAB`, pero **sin Firestore ni Cloud Functions** activados.

### Lo que le falta a `nuvia-market-data` para servir al portal

1. **Desgloses completos.** Solo copia `holdings_summary`; el portal necesita el array de posiciones (`holdings/latest` de la maestra: 677 fondos con `holding_name`, `holding_weight`, `identifiers{isin, ticker}`, `country`, `sector`) para solapamiento y concentración.
2. **Ninguna vía de acceso para la web.** No hay funciones de lectura y no he podido leer las reglas de seguridad (la API de reglas devuelve 403 desde `gcloud`); hay que verificarlas en la consola antes de asumir nada.
3. **Alta de activos nuevos.** La sincronización actualiza los 765 que ya están; no incorpora los que entren en la maestra (hoy 1.002) ni retira los archivados.
4. **Series rebasadas y en EUR.** `get_price_series` de BDB rebasa, alinea fechas y convierte divisas en el servidor; en la copia las series de acciones están en divisa nativa y no hay tipos de cambio.
5. **Registro de ejecuciones.** El resumen de cada sincronización solo se imprime en el log; el portal no puede mostrar «datos actualizados el …», que es justo lo que la Entrega 3 (sistema editorial) pide para noticias e indicadores.
6. **Autenticación, cuentas, consentimientos y carteras.** No existen en ningún proyecto de NUVIA.

---

## 4. Qué migrar y qué no

Principio: **migrar lo que el portal muestra o calcula, nada más**. La maestra tiene mucho que NUVIA no debe tener.

| De la maestra | Decisión | Motivo |
|---|---|---|
| `assets` raíz → proyección `nuvia-asset.v1` | **Sí** (ya hecho por `nuvia_mapper.py`) | Es exactamente el subconjunto que el portal usa |
| `assets/{id}/metrics/latest` → `metrics` | **Sí** (ya hecho) | Volatilidad, Sharpe, drawdown: métricas admitidas por el marco §4 |
| `assets/{id}/price_series/*` → `series` | **Sí** (ya hecho para fondos, todos los años; acciones y ETF vía EODHD) | Base del laboratorio |
| `assets/{id}/holdings/latest` | **Sí, pendiente** | Solapamiento y concentración |
| `classification.morningstar_rating` | **No: retirar** de `assets` y de `catalog_chunks` | Es una puntuación de atractivo de un tercero. Marco §5 («puntuaciones… de atractivo financiero») y §6 («consenso de terceros transformado en conclusión»). Además requiere licencia de redistribución |
| `commercial_retro` | **Nunca** | Retrocesiones comerciales: incompatibles con la independencia (marco §10) |
| `bdb_activos`, `bdb_activos_reports` | **No** | Datos de usuarios y de la app profesional |
| `ingestion_runs`, `meta`, `_archived_assets`, `fundamentals` crudos, `quality` interna | **No** | Operación interna de otro programa; de `quality` solo el `status` y los avisos ya resumidos |
| Cuentas de Auth del proyecto profesional | **No migrar** | No hay forma de separar usuarios de NUVIA y de BDB; exportar contraseñas de un tenant ajeno es, además, un movimiento de datos personales sin base clara. Las cuentas de NUVIA son pocas y recientes: se pide **volver a registrarse** en el proyecto propio |
| Carteras `bdb_activos/{uid}/portfolios` | **No migrar automáticamente** | 11 documentos, 5 UID, en su mayoría pruebas del propio Óscar; las suyas se recrean a mano si interesa |

Filtro de universo (bases §1: «el catálogo visible al usuario se filtra por criterio propio»): publicar solo activos con `is_investable`, `history.available` y `quality.status` distinto de rechazado; los `REVIEW` y `PROVISIONAL_ADMIN` (la mayoría hoy) pueden mostrarse con la advertencia de calidad visible, o esperar. Es una decisión editorial, no técnica; el campo ya existe.

---

## 5. Estructura propuesta

### 5.1. Dónde: un proyecto, dos bases

Firebase verifica los tokens de identidad **solo del proyecto que los emite**: unas funciones o reglas en `nuvia-market-data` no pueden reconocer a un usuario autenticado en `nuvia-family-wealth`. Mantener dos proyectos obligaría a dejar los datos de mercado en lectura pública sin autenticación o a verificar tokens a mano. Por eso propongo **un solo proyecto de NUVIA** con **dos bases de datos Firestore** (Firestore admite varias bases con nombre por proyecto, cada una con sus reglas):

| Base | Contenido | Reglas | Datos personales |
|---|---|---|---|
| `market` | Activos, series, desgloses, catálogo, registro de sincronizaciones | Lectura para cualquier sesión autenticada del proyecto (incluida la anónima); escritura solo desde las funciones | Ninguno |
| `(default)` | Usuarios, consentimientos, carteras guardadas | Cada UID lee y escribe únicamente bajo `users/{uid}`; validación de tamaño y forma en la regla | Sí: correo (en Auth), consentimientos, composiciones de cartera |

Qué proyecto: el candidato natural es **`nuvia-family-wealth`**, que ya es «el proyecto del portal» (Hosting y `.firebaserc`), repuntando la sincronización (`TARGET_PROJECT`) y copiando una vez los 13.000 documentos (minutos). `nuvia-market-data` quedaría como origen de la copia y se retiraría después. La alternativa —quedarse en `nuvia-market-data` y añadirle Auth y usuarios— ahorra la copia, pero deja los datos personales en un proyecto llamado «market data» y con una función que ya usa la cuenta de servicio por defecto; funciona, es menos limpio. Cualquiera de las dos es correcta; la decisión es de Óscar y cambia una constante en cada sitio.

### 5.2. Base `market`

```
assets/{asset_id}                      nuvia-asset.v1 (como hoy, sin morningstar_rating)
assets/{asset_id}/series/{símbolo_AÑO} nuvia-market-series.v1 (como hoy)
assets/{asset_id}/holdings/latest      NUEVO · {as_of_date, source, holdings_count, top10_weight,
                                        holdings:[{name, isin, ticker, weight_pct, country, sector, currency}]}
                                        (posiciones normalizadas al contrato que nuvia-analisis.js ya traduce;
                                        tope de 400 posiciones o 700 KB por documento)
catalog_chunks/{nnn} + catalog_manifest/public   como hoy, sin morningstar_rating
fx/{PAR}/{AÑO}                          NUEVO · tipos de cambio diarios de referencia del BCE (gratuitos,
                                        misma fuente que el €STR), para rebasar en EUR las series en divisa
reference/estr                          OPCIONAL · el €STR que hoy vive en data/ecb-estr.json
sync_runs/{AAAA-MM-DD}                  NUEVO · resumen de cada ejecución: activos tocados, series, errores,
                                        finished_at → alimenta «Datos actualizados el …» en el laboratorio
meta/schema                             versión del esquema y fecha de la última migración
```

### 5.3. Base `(default)` (usuarios)

```
users/{uid}                              {created_at, consents:{comunicaciones:false, analitica:false,
                                          updated_at}, schema_version}
users/{uid}/portfolios/{portfolio_id}    {name, base_currency:"EUR", positions:[{asset_id, weight_percent}],
                                          created_at, updated_at}   ← mismo contrato mínimo del paso 30
```

Nada más. Ni patrimonio, ni edad, ni objetivos, ni resultados: exactamente lo que el paso 28 y el acta D6 prometen. Los consentimientos, que hoy solo viven en `localStorage` (`nuvia-cuenta.js:43-175`), pasan a tener registro con fecha, que es lo que el RGPD exige para poder demostrarlos.

### 5.4. Acceso desde el portal

`nuvia-datos.js` no usa SDK, solo HTTP, y eso se mantiene. Dos rutas:

- **Datos de mercado: lectura directa por la API REST de Firestore** con el token de la sesión (anónima o registrada) del proyecto propio. Búsqueda: seis lecturas del catálogo, cacheadas en el navegador con el `updated_at` del manifiesto; ficha: una lectura; series de tres años: cuatro documentos por activo (≤ 40 lecturas por análisis); desgloses: un documento por fondo. Sin funciones intermedias, sin arranques en frío (los ~7 s medidos en producción con diez fondos, `main.py` de BDB), sin límites por minuto ajenos. El rebase en EUR y la alineación de fechas se hacen en el navegador con funciones puras que se prueban en la batería, como ya ocurre con el resto del laboratorio. Coste: lecturas de Firestore, del orden de céntimos al día al tráfico actual.
- **Carteras y consentimientos: escritura directa por la misma API REST** bajo `users/{uid}`, con reglas que validan que `positions` tenga como máximo `MAX_POSICIONES` entradas, pesos numéricos entre 0 y 100 y ningún campo ajeno. Tampoco necesita funciones.

Las únicas funciones del proyecto son las que ya existen (`daily_nuvia_sync`, ampliada) y una nueva `api` para el módulo de empresas (proxy de EODHD con la clave de NUVIA, portada del proyecto `4-ANALISIS-EMPRESAS`, que hoy despliega al proyecto profesional).

Si en el futuro se quiere un control de abuso más fino que el de las reglas, App Check con reCAPTCHA se activa en el proyecto propio sin tocar nada más; eso es precisamente lo que no se puede hacer hoy.

---

## 6. Plan de migración por fases (sin corte de servicio)

| Fase | Contenido | Jornadas | Entregable verificable |
|---|---|---|---|
| **M0** Expediente | Ficha regulatoria **ámbar** (datos personales + licencias de proveedores); decisión del proyecto destino; confirmar el origen de `daily_nuvia_sync`; leer las reglas actuales en consola | 1 | Ficha en `docs/`, decisión en acta |
| **M1** Repositorio | Carpeta `backend/` en `NUVIA-PORTAL-LAB` (o repo `NUVIA-DATA`) con el código recuperado, pruebas de `nuvia_mapper`, despliegue por GitHub Actions, secreto `EODHD_API_KEY` propio | 1–2 | `firebase deploy` reproducible desde el repo |
| **M2** Datos | Ampliar la sincronización: desgloses, alta y baja de activos, FX del BCE, `sync_runs`, retirar `morningstar_rating`; crear la base `market` en el proyecto destino y hacer la copia inicial | 2–3 | Recuentos iguales origen/destino; una ejecución programada en verde con `sync_runs` escrito |
| **M3** Lectura | Nuevo `nuvia-datos.js` (REST a Firestore, rebase y alineación en el cliente); mantener el contrato que ya consumen constructor, análisis, modelos e informe; `nuvia-datos.test.mjs` con las respuestas nuevas | 2–3 | `npm run validate` en verde; el laboratorio funciona contra el proyecto propio detrás de una bandera |
| **M4** Usuarios | Auth propia (anónima + correo), `users/{uid}`, reglas, consentimientos con fecha, carteras; aviso a los registrados actuales para que vuelvan a crear la cuenta | 2 | Batería `nuvia-cuenta.test.mjs` adaptada; prueba de reglas con el emulador |
| **M5** Empresas | Función `api` propia para `company-analysis` | 1 | Módulo funcionando con la clave de NUVIA |
| **M6** Corte | Cambiar la bandera; retirar `apiKey` y `PROYECTO` de la maestra del código; comprobar en producción; **no tocar nada en `bbdd-activos-financieros`** (las carteras de prueba pueden quedarse o borrarlas Óscar desde la app BDB) | 1 | Producción sin ninguna referencia a la maestra (`grep` en la batería como control de regresión) |

Encaje con el plan final: es «trabajo técnico de fondo» pero condiciona la **Entrega 2 (C4, páginas de confianza)**: la política de privacidad debe describir dónde viven los datos, y no conviene escribirla dos veces. Orden propuesto: Entrega 2 avanza con accesibilidad y metadatos; la migración va como **Entrega 2b** y los textos de privacidad se redactan al terminarla.

---

## 7. Riesgos y avisos

- **Licencias de datos.** Las categorías «EAA Fund …» y el `morningstar_rating` de la maestra provienen de un proveedor con condiciones de redistribución; EODHD tiene sus propias condiciones para mostrar datos a terceros. Antes de publicar el catálogo en un portal abierto, revisar ambas (marco §2.9). Retirar el rating resuelve la parte más clara; las categorías pueden sustituirse por la clase económica propia (`economic_asset_class`) si hiciera falta.
- **Calidad.** El activo de muestra tiene `quality.status = REVIEW` con avisos (`rf_sin_duracion`, `rf_sin_yield`…); la acción de muestra, `PROVISIONAL_ADMIN`. El portal hereda la calidad de la maestra: mostrar el estado y la fecha, nunca ocultarlos (principio «Honestidad» de la definición).
- **Divisas.** Sin FX, las series en divisa de las acciones no pueden rebasarse en EUR; hasta M2 el universo público debería limitarse a instrumentos cotizados en EUR o mostrar la divisa nativa con aviso.
- **Cuenta de servicio.** `daily_nuvia_sync` corre con la cuenta de cómputo por defecto y lee la maestra entre proyectos: ese permiso (`datastore.viewer` sobre `bbdd-activos-financieros`) es la única puerta que debe quedar abierta hacia la maestra, y es de solo lectura. Documentarlo en la ficha.
- **Nada se borra en la maestra.** Ni cuentas, ni carteras, ni funciones. Cuando el portal deje de llamar, esos recursos simplemente dejan de usarse.

---

## 8. Decisiones que necesita Óscar

1. **Proyecto destino:** `nuvia-family-wealth` (recomendado) o quedarse en `nuvia-market-data`.
2. **Origen de `daily_nuvia_sync`:** quién lo desplegó y desde qué carpeta; si no hay repositorio, se adopta el código recuperado.
3. **Rating y categorías de terceros:** retirar el rating (recomendado) y decidir sobre las categorías tras revisar la licencia.
4. **Cuentas existentes:** aceptar que no se migran y se piden de nuevo.
5. **Orden:** Entrega 2b antes de los textos de privacidad.

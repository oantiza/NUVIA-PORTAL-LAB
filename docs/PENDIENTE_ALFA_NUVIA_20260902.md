# NUVIA · Lo que queda pendiente para la alfa (base propia, en abierto)

**Autor:** Claude Fable 5.1 · **Fecha:** 2 de septiembre de 2026 (tarde) · **Para:** Óscar y Codex.
**Sustituye, en lo que toca a cuentas y acceso, a** `docs/INFORME_PARA_CODEX_BASE_DATOS_ALFA_20260902.md` (v2) y al plan v2. Todo lo demás de esos documentos (universo, EODHD, esquema, pipeline, contratos del portal, baterías) sigue vigente y aquí se referencia, no se repite.

---

## 1. Decisiones del fundador que cambian el alcance (02-09-2026, tarde)

1. **Sin registro ni recogida de datos de clientes en la alfa.** Se aplaza a una fase posterior para no entrar en obligaciones de datos personales. Se descartan por tanto: cuentas de usuario, inicio de sesión, consentimientos, colección `users/`, carteras en la nube, página de privacidad de cuentas, guion de invitación con cuentas y todo lo relacionado en el informe v2 (§3 bloque `users`, §8.1, §8.4 en su parte de cuenta, §12.3).
2. **El proyecto queda en abierto.** Los datos de mercado de la alfa se leen **sin sesión**: cualquiera que llegue a la página puede usar el laboratorio. No hay puerta de invitación técnica; la alfa es «cerrada» solo en el sentido de que no se anuncia ni se comercializa.
3. **EODHD, resuelto.** Óscar lo da por cerrado; se retiran del alcance el correo de licencia, la condición de «ningún invitado hasta respuesta» y toda mención a ese trámite. Lo técnico de EODHD (endpoints, coste, fixtures, comprobación de divisa) no cambia.

Lo que **no** cambia: ninguna relación con `bbdd-activos-financieros` ni con `nuvia-market-data`; ningún secreto en el repositorio; sin rating ni recomendación; los commits los hace Óscar.

Consecuencias que conviene tener a la vista antes de seguir:

- Con lectura abierta, el catálogo, las series y los desgloses de la alfa son accesibles a cualquiera que sepa la URL de Firestore (no solo desde la web). Es coherente con «proyecto en abierto» y con lo que Óscar ha decidido; queda anotado en la ficha regulatoria como característica de la alfa, no como riesgo pendiente.
- Al no haber cuentas, las carteras se guardan **solo en el navegador** de cada persona (`localStorage`, clave `nuvia.carteras-visitante.v1`, que ya existe en `nuvia-constructor.js`). Quien borre datos del navegador o cambie de dispositivo las pierde; la pantalla lo dirá.
- El laboratorio tiene hoy tres niveles (`visitante`, `registrada`, `suscriptor`) y al `visitante` le cierra parte del análisis. **Sin cuentas hace falta fijar un nivel único.** Propuesta: todo el mundo al nivel `registrada` (análisis completo; los escenarios del suscriptor siguen «no abiertos», como ahora). Si Óscar prefiere otra cosa, es una línea en `nuvia-datos.js`.

---

## 2. Estado: hecho y comprobado

| Pieza | Estado |
|---|---|
| Proyecto `nuvia-family-wealth`, Firestore `(default)` nativo en `europe-west1`, plan Spark | Hecho, vacío |
| App web «NUVIA Portal Lab» (`apiKey` `AIzaSyAhlsp0ueNu3xmjvLNI2IpxRC66fWEghHo`, `appId` `1:128295996347:web:6f6c78f0efd8532a00129e`) | Hecho; en modo abierto ni siquiera hace falta la `apiKey` para leer Firestore por REST |
| Authentication (correo/contraseña activo, alta cerrada) | Hecho, **pero ya no se usa**. Se deja como está, sin cuentas; opcionalmente Óscar desactiva el proveedor para que no haya dudas |
| Reglas de Firestore | Publicadas las de la v1 (con `users/` y lectura solo con sesión). **Hay que sustituirlas** por las de §3 y republicar |
| `nuvia-market-data`: programación en pausa | Hecho |
| Universo: `universo/universo-alfa.csv` (725 líneas, 161 `si`, columna `divisa`), `.xlsx`, `LEEME` | Hecho; TSK sin símbolo |
| Fixtures de EODHD en `docs/fixtures/eodhd/` (con BOM; ver informe v2 §5.2) | Hecho |
| Documentación: plan v2, análisis, estructura mínima, informe para Codex v2, adenda del acta | Hecho; el acta y el informe v2 necesitan la nota de §7 |

---

## 3. Pendiente inmediato · Óscar (20 minutos)

**3.1 Reglas nuevas.** Sustituir `firestore.rules` por esta versión (ya entregada en la raíz del repositorio) y publicar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /assets/{id}            { allow read: if true; allow write: if false; }
    match /assets/{id}/{sub=**}   { allow read: if true; allow write: if false; }
    match /catalog_chunks/{id}    { allow read: if true; allow write: if false; }
    match /catalog_manifest/{id}  { allow read: if true; allow write: if false; }
    match /sync_runs/{id}         { allow read: if true; allow write: if false; }
    match /{document=**}          { allow read, write: if false; }
  }
}
```

En PowerShell, desde la carpeta del repositorio: `firebase deploy --only firestore:rules` (el proyecto activo es `nuvia-family-wealth` por `.firebaserc`). Comprobación sin sesión, en el navegador: `https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents/catalog_manifest/public` debe devolver `404 NOT_FOUND` (la base está vacía; un `403` significaría que las reglas siguen siendo las antiguas).

**3.2 TSK.** `Invoke-RestMethod "https://eodhd.com/api/search/ES0105394003?api_token=$env:EODHD_API_KEY"` y fijar `eodhd_symbol` en `universo/universo-alfa.csv`, o dejar que `descargar` lo proponga en la primera carga.

**3.3 Rama y primer commit.** Desde `main`: rama `codex/entrega-2b-base-alfa`; commit «Entrega 2b · base propia de la alfa: proyecto, reglas y universo» con `firestore.rules`, `firebase.json`, `universo/`, `docs/fixtures/eodhd/`, `docs/backend-recuperado/`, los cuatro documentos del 02-09 y la adenda del acta. Sin mezclar con el trabajo de 4A/4B/5A que está en `prueba/tipografia-empresas`.

---

## 4. Pendiente · Codex, paso 3: pipeline `scripts/mercado-alfa/`

**Sin cambios respecto al informe v2**, secciones §4 a §7 (universo, EODHD, esquema `nuvia-alfa-asset.v1`, órdenes `descargar | proyectar | publicar | todo`, comprobación de divisa, conservación de históricos, manifiesto el último, `sync_runs`, sin claves de mérito). Solo dos matices:

- Del esquema desaparecen `users/{uid}` y `users/{uid}/portfolios/{id}`. El pipeline nunca los tocaba, así que no cambia nada en el código; se quita del documento.
- La referencia a «licencia» en `informe-descarga.txt` o en comentarios no procede: no hay nada que archivar.

Entregables: `scripts/mercado-alfa/run.mjs`, `proyecta.mjs`, `firestore-rest.mjs`, `docs/nuvia-mercado-alfa.test.mjs`, entrada `"mercado-alfa"` en `package.json`, y las pruebas colgadas de `validate`. Primero probado en local sin escribir (`proyectar` sobre fixtures y sobre una descarga real; `publicar --dry-run`); la primera carga la ejecuta Óscar cuando Codex entregue.

---

## 5. Pendiente · Codex, paso 4: el portal contra la base propia, **sin cuentas**

Principio: los módulos de análisis no cambian, salvo la excepción de §8.3 bis del informe v2 (lo desconocido no se estima). Cambia `js/nuvia-datos.js`, se retira la cuenta y se ajusta `cartera.html`.

### 5.1 `js/nuvia-datos.js`

| Hoy | Alfa en abierto |
|---|---|
| `PROYECTO` con `apiKey`, `region`, `id` de la maestra; `urlFuncion` | `PROYECTO = { id: 'nuvia-family-wealth' }`; `URL_DOCS = https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents`. Sin `region`, sin funciones, sin `apiKey` (no hace falta para lecturas públicas) |
| `sesion()`, `sesionNueva()` (alta anónima), `sesionRenovada()`, clave `nuvia.maestra-sesion.v1` | **Desaparecen.** Ninguna llamada a `identitytoolkit` ni a `securetoken`. Al arrancar se borra la clave `nuvia.maestra-sesion.v1` si existe (tokens de la maestra en navegadores antiguos) |
| `llama(callable)` con `Authorization` | `lee(ruta)`, `lote(rutas)` (`:batchGet`) **sin cabecera de autorización**; `llama(nombre, datos)` se conserva como fachada para `search_assets`, `get_asset_detail`, `get_price_series`, `get_asset_holdings`, `get_asset_holdings_batch`; el resto lanza `Error('Función no disponible en la alfa')` con `codigo = 'NO_DISPONIBLE_ALFA'` |
| `buscaActivos`, `detalleActivo`, series, desgloses | Como en el informe v2 §8.2–§8.3 (catálogo en memoria con caché `nuvia.catalogo.v1`, `fichaParaModulos`, `alineaYRebasa`, `null` = sin datos) |
| `sesionActual()` / `nivelSesion()` | `sesionActual()` devuelve `{ tipo: 'alfa' }`; `nivelSesion()` devuelve el nivel único de la alfa (`'registrada'` salvo decisión contraria de Óscar). `esRegistrada()` en el constructor (línea 908) sigue funcionando |
| `creaCuenta`, `iniciaSesion`, `cierraSesion`, `recuperaContrasena`, `cambiaContrasena`, `pideCambioCorreo`, `borraCuenta` | Se eliminan del cliente. Si `nuvia-cuenta.js` deja de importarse, no queda ningún consumidor |
| `guardaCarteraNube`, `listaCarterasNube`, `leeCarteraNube`, `borraCarteraNube` | Lanzan `NO_DISPONIBLE_ALFA`. El constructor ya guarda carteras en el navegador (`CLAVE_CARTERAS = 'nuvia.carteras-visitante.v1'`); se retiran los botones y textos de «subir a tu cuenta» / «cargar de tu cuenta» (líneas ~1053, 1068, 1105–1137 de `nuvia-constructor.js`) o se ocultan cuando `sesionActual().tipo === 'alfa'`, lo que menos toque los módulos |
| `CORREOS_ADMIN`, `CLAVE_SUSCRIPCION`, `leeSuscripcion`, `esAdmin` | Se conservan sin uso (no molestan y evitan tocar `nuvia-cuenta.js` si algún día vuelve) |

### 5.2 Cuenta y consentimientos

- `cartera.html`: se retiran el botón «Tu cuenta» (línea 139), el `dialog#dialogo-cuenta` (170–180) y el `import('./js/nuvia-cuenta.js')` (387–390). `js/nuvia-cuenta.js` y `docs/nuvia-cuenta.test.mjs` **se quedan en el repositorio sin importarse** (el módulo vuelve en la fase de cuentas); se saca `nuvia-cuenta.test.mjs` de `test:analisis` o se deja si sigue pasando sin red. Codex decide lo que sea menos frágil y lo anota.
- Consentimientos: no hay nada que pedir. El aviso de tecnologías de almacenamiento (`localStorage` para carteras y caché del catálogo) sale del borrador ya existente `docs/BORRADOR_TECNOLOGIAS_ALMACENAMIENTO_ENTREGA_2_20260902.md`, como parte de la Entrega 2 de textos; no es una casilla ni un consentimiento.
- Texto en el laboratorio, en lugar de la puerta de invitación: «Versión alfa de NUVIA. Los datos de mercado cubren un universo limitado de instrumentos en euros. Las carteras se guardan solo en este navegador. Nada de lo que ves es una recomendación.» Más la línea «Datos a fecha {manifiesto.prices_last_date}».

### 5.3 Lo que sigue igual que en el informe v2

`?vista=companies` en «En preparación» y `company-analysis/` fuera de `dist/` de verdad (variable `NUVIA_EMPRESAS=1` en `build:company-analysis` **y** en la copia de `build-site.mjs`, con fallo en `check-static-site` si aparece); `dist/` sin `universo-alfa.*`; regresión «sin maestra» en `check-lenguaje.mjs` (`bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, `AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg`, `api_token=` sin `${`). A esa lista se añaden ahora **`identitytoolkit.googleapis.com` y `securetoken.googleapis.com`** en `js/` y `cartera.html`: la alfa en abierto no habla con Auth, y si aparece es que ha vuelto algo de la maestra por la puerta de atrás (`nuvia-cuenta.js` queda excluido de esa comprobación mientras no se importe).

### 5.4 Baterías

`docs/nuvia-datos.test.mjs` (conversor, catálogo, `alineaYRebasa`, `fichaParaModulos`, `NO_DISPONIBLE_ALFA`, borrado de la clave antigua, y con `fetchFn` espía: **ninguna petición a `cloudfunctions.net`, `identitytoolkit` ni `securetoken`, ninguna cabecera `Authorization`**); `docs/nuvia-concentracion.test.mjs` (null = sin datos); `docs/nuvia-mercado-alfa.test.mjs` (paso 3); `docs/nuvia-reglas.test.mjs` queda **reducido a tres casos** (lectura pública de `assets` y catálogo; escritura denegada; cualquier otra colección denegada), con el emulador si está y a mano si no.

### 5.5 Prueba manual (Óscar, `npm run serve`)

Sin ninguna sesión: buscar «Vanguard», añadir un fondo, un ETF y una acción, ver evolución, proyección y solapamiento (el fondo debe decir «sin datos de desglose»), guardar cartera en el navegador, recargar, cargarla, borrarla. Pestaña Red: solo `firestore.googleapis.com/v1/projects/nuvia-family-wealth/…` y los ficheros estáticos del sitio. Ninguna petición a `identitytoolkit`, `securetoken`, `cloudfunctions.net` ni a la maestra.

---

## 6. Pendiente · textos y expediente (Codex/ChatGPT + Óscar), reducido

| # | Pieza | Qué queda |
|---|---|---|
| 6.1 | `docs/FICHA_REGULATORIA_ALFA_BASE_PROPIA.md` (marco §12, 18 preguntas) | Se reclasifica: sin datos personales, sin cuentas, sin comercialización, sin IA; datos de mercado de un proveedor con licencia, en lectura abierta; universo cerrado; sin rating. La clasificación (verde o ámbar) la fija quien firme la ficha, con esos hechos. Puertas §13: validación funcional (batería) y regulatoria (la ficha); retirada: al cerrar la alfa se vacía el proyecto |
| 6.2 | Párrafo de datos de mercado | Proveedor, plan, universo cerrado en euros, sin rating ni categorías de mérito, «Datos a fecha». Sin el trámite de licencia (cerrado por el fundador) |
| 6.3 | Aviso de tecnologías de almacenamiento | Desde el borrador de la Entrega 2; menciona `localStorage` para carteras y caché del catálogo |
| 6.4 | Texto «qué es la alfa» en `cartera.html` | El de §5.2; no es un guion de invitación, es un aviso en pantalla |
| 6.5 | Acta e IDEAS | Adenda §4 del acta: sustituir el punto de licencia y el de cuentas por las tres decisiones de §1 de este documento. IDEAS §4: «cuentas y datos de usuarios: fase posterior» |

**Descartado en esta fase:** `privacidad-alfa.html`, consentimiento en el primer acceso, guion de invitación con cuentas, registro de testers (no hay datos que inventariar).

---

## 7. Pendiente · Óscar, publicación (paso 6, reducido)

1. Primera carga cuando Codex entregue el paso 3: `descargar` → revisar `informe-descarga.txt` (divisas, TSK, series cortas) → `proyectar` → `publicar --dry-run` → `publicar`.
2. Prueba manual de §5.5 en local; integrar la rama en `main` («Entrega 2b · base propia de la alfa»); esperar GitHub Actions; repetir la prueba en producción.
3. Contar la alfa a las personas que quiera (URL y el aviso de §5.2). No hay cuentas que crear ni lista que mantener.
4. Refresco de precios cuando quiera: `todo --solo-precios` (semanal en la alfa).
5. Nota al acta y al informe v2 (§6.5 y la marca de «sustituido» al principio del informe v2), para que nadie ejecute lo de cuentas por inercia.

---

## 8. Pendiente · Claude, verificación independiente (paso 7)

Árbol confirmado; batería y auditoría de render reejecutadas; recuentos en Firestore frente a `sync_runs`; reglas probadas sin sesión (lectura de `assets` y catálogo OK, escritura denegada, cualquier otra ruta denegada); `grep` de `dist/` sin `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, `identitytoolkit`, `securetoken`, claves ni `universo-alfa.*`; captura de la pestaña Red durante un análisis completo; comprobación de que el fondo sin desglose se declara como tal; informe en `docs/` y en el proyecto.

---

## 9. Descartado o aplazado (para que no reaparezca)

| Tema | Estado |
|---|---|
| Cuentas de usuario, inicio de sesión, alta, borrado de cuenta | Aplazado a una fase posterior con su propio expediente |
| Consentimientos, `users/{uid}`, privacidad de cuentas, registro de testers | Aplazado con lo anterior |
| Carteras en la nube (`users/{uid}/portfolios`) | Aplazado; en la alfa, solo navegador |
| Puerta de invitación técnica, cuentas creadas a mano, `auth:import` | Descartado: proyecto en abierto |
| Correo y confirmación de licencia de EODHD | Cerrado por el fundador; fuera del alcance |
| Reglas con `invitado()` / `propio(uid)` | Sustituidas por las de §3 |
| Refresco automático con GitHub Actions | Sigue siendo opcional y posterior (plan v2, «Opcional») |
| Borrar `nuvia-market-data` | Decisión posterior |

---

## 10. Calendario razonable

| Día | Quién | Qué |
|---|---|---|
| Hoy | Óscar | §3: reglas nuevas publicadas, TSK, rama y primer commit |
| 1–2 | Codex | Paso 3 completo con batería; `publicar --dry-run` en verde |
| 2 | Óscar | Primera carga real |
| 3–4 | Codex | Paso 4 (portal en abierto) con baterías y regresiones |
| 4 | Óscar | Prueba manual, textos de §6, integración en `main` |
| 5 | Claude | Verificación (§8) |

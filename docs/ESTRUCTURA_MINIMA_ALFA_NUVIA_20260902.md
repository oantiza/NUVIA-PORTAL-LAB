# NUVIA · Estructura mínima y gratuita para la alfa (≤ 100 personas invitadas)

**Autor:** Claude Fable 5.1  
**Fecha:** 2 de septiembre de 2026  
**Sustituye, para esta etapa, a** `docs/ANALISIS_BASE_DATOS_PROPIA_NUVIA_20260902.md` (que queda como referencia para la estructura definitiva, hoy por definir)  
**Premisas fijadas por el fundador:** versión alfa; estructura final sin decidir; pruebas *friends & family* y betas con personas seleccionadas, máximo 100; no abierta al público ni comercializada; coste cero; **ninguna mezcla con `bbdd-activos-financieros`**, que nutre otros programas.

---

## 1. La propuesta en una frase

Un **proyecto Firebase propio en plan gratuito (Spark), sin funciones en la nube ni facturación**, con una copia reducida y proyectada de los datos que ya existen en `nuvia-market-data`, acceso solo con cuentas creadas a mano por invitación, y el portal leyendo y escribiendo por la API REST de Firestore como ya hace hoy con HTTP simple. Ni una sola credencial, llamada o permiso hacia `bbdd-activos-financieros`.

Coste: **0 €** garantizado (Spark no puede facturar). Trabajo: **3–4 jornadas**. Nada de lo que se haga condiciona la estructura definitiva: cuando se decida, se migra desde aquí, no desde la maestra.

---

## 2. Dónde

**Proyecto `nuvia-family-wealth`** (existe, sin facturación, con las API de Firestore, Auth y reglas ya habilitadas y sin base creada). Es el proyecto del portal (`.firebaserc`, Hosting). Se crea en él:

- **Firestore** en modo producción, región `europe-west1` (no `nam5`: datos en la UE).
- **Authentication** con correo y contraseña, **anónimo desactivado** y **registro por el propio usuario desactivado** (Authentication → Settings → User actions → «Enable create» apagado). Las cuentas las crea Óscar en la consola —correo y contraseña provisional, o enlace de restablecimiento como invitación— o por lotes con `firebase auth:import` desde un CSV. Cien cuentas a mano son diez minutos.

Con eso el sitio institucional sigue público como hoy (GitHub Pages), pero **el laboratorio y sus datos solo responden a una cuenta invitada**: quien no la tiene ve la portada del laboratorio y un aviso «alfa por invitación». Es la forma más simple de cumplir «no abierta al público» sin ningún servidor.

`nuvia-market-data` no se toca: su sincronización diaria sigue corriendo (es la que lee la maestra en solo lectura; ya existía y no es parte de este plan). Si Óscar prefiere que **ningún** proceso de NUVIA lea la maestra mientras dure la alfa, basta con pausar el trabajo programado `firebase-schedule-daily_nuvia_sync-europe-west1` en Cloud Scheduler y reanudarlo cuando toque; la alfa no depende de él.

---

## 3. Qué datos y con qué forma

Solo lo que el laboratorio consume, proyectado para que pese poco. Todo sale de `nuvia-market-data` (nunca de la maestra), con un script local de copia que ejecuta Óscar desde su PC con su propia sesión de `gcloud`.

| Colección en `nuvia-family-wealth` | Origen | Documentos | Tamaño aprox. | Contenido |
|---|---|---|---|---|
| `assets/{asset_id}` | `nuvia-market-data/assets` | 765 | 8 MB | El documento `nuvia-asset.v1` **sin** `morningstar_rating` ni `fixed_income_profile`; se conservan `display_name`, `instrument_type`, `economic_asset_class`, `isin`, `ticker`, `currency`, `region`, `category`, `costs`, `metrics`, `exposures`, `quality{status, warnings}`, `history` |
| `assets/{id}/series/{AÑO}` | `…/series/EODHD_*_AÑO` | ≈ 3.000 (solo **2023–2026**, los cuatro años que cubren la ventana de 3 años del laboratorio) | 20 MB | Proyección `{asset_id, year, currency, interval, first_date, last_date, points:[{date, value}]}`: se descartan `open/high/low/close/volume`, que el laboratorio no usa; el documento pasa de ~25 KB a ~6 KB |
| `assets/{id}/holdings/latest` | *opcional*, ver §6 | 677 | 30 MB | Desglose normalizado `{as_of_date, holdings:[{name, isin, ticker, weight_pct, country, sector}]}` |
| `catalog_chunks/{000…005}`, `catalog_manifest/public` | igual | 7 | 0,5 MB | Búsqueda en el navegador; `updated_at` del manifiesto es la «fecha de datos» que se muestra en el laboratorio |
| `users/{uid}` | nuevo | ≤ 100 | — | `{created_at, consents:{comunicaciones, analitica, updated_at}}` |
| `users/{uid}/portfolios/{id}` | nuevo | pocos cientos | — | `{name, base_currency:"EUR", positions:[{asset_id, weight_percent}], created_at, updated_at}` — el mismo contrato mínimo del paso 30 |

Total: **≈ 60 MB** de los 1 GiB gratuitos. Los nombres de colección y campos son los mismos que ya usa el portal (`instrument_type`, `economic_asset_class`, `display_name`, `asset_id`, `weight_percent`), así que el código de constructor, análisis, modelos e informe no cambia.

**Actualización:** no hay proceso automático en la alfa. El mismo script de copia, con la opción `--solo-actual`, vuelve a traer los documentos del año en curso y el catálogo cuando Óscar quiera (una vez por semana es más que suficiente para probar). Son ~800 escrituras, dentro de las 20.000 diarias gratuitas.

---

## 4. Reglas de seguridad (el único «backend»)

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

Las escrituras de datos de mercado solo pueden venir del script de Óscar (Admin SDK, que no pasa por las reglas). Las cuentas invitadas leen el mercado y escriben únicamente bajo su propio `users/{uid}`. No hay nada más que proteger.

---

## 5. Cambios en el portal

1. **`js/nuvia-datos.js`:** `PROYECTO` pasa a `nuvia-family-wealth`; desaparece la sesión anónima (`sesion()` exige cuenta); búsqueda contra `catalog_chunks` (seis lecturas, cacheadas en `localStorage` con el `updated_at` del manifiesto); `detalleActivo`, series y desgloses por `GET https://firestore.googleapis.com/v1/projects/nuvia-family-wealth/databases/(default)/documents/...` con `Authorization: Bearer <idToken>`; carteras por `PATCH`/`DELETE` bajo `users/{uid}/portfolios`. Identity Toolkit (alta, sesión, contraseña) queda igual: solo cambia la `apiKey`.
2. **Series rebasadas en el navegador:** una función pura `alineaYRebasa(seriesPorActivo, ventana)` que alinea fechas comunes y rebasa a 100, con su batería en `docs/nuvia-datos.test.mjs`. Divisas: en la alfa el catálogo se filtra a **instrumentos en EUR** (la inmensa mayoría de los 765) y el resto se marca «divisa no soportada en la alfa». Sin tipos de cambio, sin funciones.
3. **Laboratorio (`cartera.html`):** estado «Alfa por invitación» para quien no ha iniciado sesión; «Datos a fecha …» leído del manifiesto; la vista `?vista=companies` (Análisis y valoración de empresas) se muestra **«En preparación»** en la alfa, porque su proxy de EODHD necesita una clave en servidor y eso no cabe en Spark ni debe seguir usando la función del proyecto profesional.
4. **Batería:** `nuvia-datos.test.mjs` y `nuvia-cuenta.test.mjs` con las respuestas nuevas; `check-lenguaje` añade la regresión «ninguna referencia a `bbdd-activos-financieros` ni a `cloudfunctions.net`» en `js/` y `company-analysis/`.
5. **Textos mínimos de la alfa:** una nota de privacidad para testers (qué se guarda: correo, consentimientos, composiciones de cartera; dónde: Firestore en la UE; hasta cuándo: fin de la alfa o baja; cómo borrar: desde «Tu cuenta») y el consentimiento al crear la cuenta. Es lo proporcional a cien personas conocidas y sirve de borrador para la política definitiva.

---

## 6. Cuotas gratuitas frente al uso previsto

| Recurso (Spark) | Límite gratuito | Uso previsto (100 personas, uso de pruebas) | Margen |
|---|---|---|---|
| Lecturas Firestore | 50.000/día | Un análisis de 5 activos ≈ 30 lecturas; 100 análisis/día ≈ 3.000 | ×16 |
| Escrituras | 20.000/día | Carteras y consentimientos: decenas; actualización semanal: ~800 | ×25 |
| Almacenamiento | 1 GiB | ≈ 60 MB (≈ 90 MB con desgloses) | ×10 |
| Salida de red Firestore | 10 GiB/mes | ≈ 150 KB por análisis; 100 análisis/día ≈ 0,5 GB/mes | ×20 |
| Usuarios Auth | 50.000 | 100 | — |
| Hosting | (no se usa: GitHub Pages) | — | — |

El límite que antes se acerca es la salida de red si alguien repite análisis en bucle; se amortigua guardando en el navegador los años cerrados (2023–2025 no cambian) y es imposible que genere factura: en Spark, al agotar la cuota, el servicio responde error hasta el día siguiente.

**Desgloses (holdings), decisión aparte.** `nuvia-market-data` no los tiene; solo existen en la maestra (`assets/{id}/holdings/latest`, 677 fondos). Traerlos exige **una lectura** de la maestra desde el PC de Óscar con su propia cuenta —no escribe nada, no crea claves ni permisos— y son 30 MB. Sin ellos, el solapamiento y la concentración sectorial de fondos muestran «sin desglose disponible», que el código ya contempla. Recomendación: **sin desgloses en la primera alfa** para mantener la regla de «ninguna lectura de la maestra desde este proyecto»; añadirlos en una segunda ronda si los testers los echan de menos.

---

## 7. Pasos, en orden

| # | Paso | Quién | Tiempo |
|---|---|---|---|
| 1 | Crear Firestore (`europe-west1`) y Auth en `nuvia-family-wealth`; apagar anónimo y registro; publicar las reglas del §4 | Óscar en consola (o `firebase deploy --only firestore:rules`) | 30 min |
| 2 | `scripts/copiar-mercado-alfa.mjs`: lee `nuvia-market-data` con la sesión de `gcloud` (`application-default`), proyecta y escribe en `nuvia-family-wealth`; opción `--solo-actual`; recuento de control al final | Claude o Codex; lo ejecuta Óscar | 1 jornada (script + primera copia) |
| 3 | `nuvia-datos.js` por REST, rebase en cliente, filtro EUR, estado «alfa por invitación», `companies` en preparación, baterías | Claude o Codex | 1,5–2 jornadas |
| 4 | Nota de privacidad de la alfa y consentimiento; ficha regulatoria breve (**ámbar**: datos personales de testers, universo cerrado, sin comercialización) | ChatGPT/Claude + Óscar | 0,5 jornada |
| 5 | Crear las cuentas invitadas; publicar; probar con 3–5 personas antes de ampliar | Óscar | 1 hora |

Antes del paso 3 conviene confirmar en `main` la Entrega 1 ya verificada, para que este cambio vaya en su propia rama y entrega («Entrega 2b · base propia de la alfa»).

---

## 8. Qué queda fuera a propósito

- Nada de Cloud Functions, App Check, Cloud Scheduler ni facturación en el proyecto de la alfa.
- Nada de migración de cuentas ni carteras existentes: la alfa empieza vacía.
- Ninguna lectura ni escritura en `bbdd-activos-financieros` desde NUVIA-PORTAL-LAB, sus scripts o sus secretos. La única relación que existe hoy con la maestra —la sincronización diaria de `nuvia-market-data`— es anterior a este plan, de solo lectura, y se puede pausar.
- La estructura definitiva (dos bases, sincronización propia, FX, desgloses, proxy de EODHD): se decide cuando la alfa haya enseñado qué usa la gente de verdad. El documento de ayer queda como punto de partida.

# Guía de implementación · Sección de análisis de cartera

**Fecha:** 18 de agosto de 2026
**Lectura previa obligatoria:** `BASES_ANALISIS_CARTERA.md`

Este documento dice **cómo hacerlo**, paso a paso. El *qué* y el *por qué* están
en las bases; el orden general, en `PLAN_ANALISIS_CARTERA.md`.

Cada paso tiene: **entrada** (lo que hace falta antes), **hacer** (lo concreto) y
**verificación** (cómo saber que está bien). No pasar de paso sin verificar: en
este proyecto los fallos que costaron caro venían de dar algo por hecho.

---

## Índice

- **Fase 0** · Decisiones · pasos 1–5
- **Fase 1** · Datos · pasos 6–11
- **Fase 2** · Motor de cálculo · pasos 12–17
- **Fase 3** · Nivel de visitante · pasos 18–27
- **Fase 4** · Cuentas y niveles · pasos 28–34
- **Fase 5** · Suscripción · pasos 35–38
- **Transversal** · contenido, publicación y mantenimiento

---

# FASE 0 · Decisiones

Sin código. Bloquea todo lo demás. Al terminar, se actualizan las secciones 6 y
8 de las bases.

### Paso 1 · Qué análisis va en cada nivel

**Entrada:** bases, sección 3.

**Hacer.** Rellenar esta tabla. La progresión va por profundidad: el visitante
ve lo *descriptivo* (qué tiene), el registrado lo *comparativo* (cómo se
reparte, qué gana diversificando), el suscriptor lo *proyectivo* (qué podría
pasar). Punto de partida propuesto:

| Análisis | Visitante | Registrado | Suscriptor |
|---|---|---|---|
| Tabla de métricas (rent., volatilidad, máx. caída) | sí | sí | sí |
| Reparto por clase de activo | sí | sí | sí |
| Concentración sectorial y geográfica | — | sí | sí |
| Ahorro por diversificar | — | sí | sí |
| **Solapamiento entre fondos** | — | sí | sí |
| **Frontera eficiente (estática, cartera marcada)** | — | **sí** | sí |
| **Frontera eficiente (interactiva)** | — | — | **sí** |
| Monte Carlo | — | — | sí |
| Matriz de correlaciones | — | — | sí |
| Carteras modelo temáticas | ver | ver | ver |

**Frontera eficiente en dos niveles, no en uno.** El registrado la ve —con su
cartera marcada en el gráfico— pero no puede tocar los pesos y verla recalcular
al vuelo. Es un caramelo visual deliberado: se enseña la herramienta sin regalar
la exploración completa, que es donde está buena parte del valor pagado.

**Verificación.** Se puede dibujar en papel la pantalla de cada nivel y se
entiende, sin explicación, qué gana quien sube de escalón.

### Paso 2 · Unidad de «prueba» del visitante

**Hacer.** Decidir qué consume cupo. Propuesta: **la cartera creada**, no el
cálculo. Así puede mover pesos y recalcular sin gastar nada, que es justo lo que
queremos que haga.

**Verificación.** Simular el recorrido de alguien que trastea veinte minutos: no
debe chocar con el límite por explorar, solo por empezar carteras nuevas.

### Paso 3 · Periodicidad de los datos

**Hacer.** Elegir entre diaria y semanal. Criterios: coste del proceso, cuota de
EODHD, y si el usuario percibe la diferencia. Para volatilidades a 1–5 años, la
diferencia entre hoy y hace una semana es despreciable.

**Recomendación:** semanal para correlaciones y volatilidades; diaria para
precios de cierre si se muestran.

### Paso 4 · Infraestructura de cuentas — resuelto

**Decisión tomada, no queda por decidir.** Se reutiliza Firebase del proyecto
`bbdd-activos-financieros`: Anonymous Auth para el visitante (paso 6), cuentas
reales vinculadas para registrado y suscriptor (fase 4). El acceso a datos de
la maestra es de solo lectura vía Cloud Functions; los datos que el portal
escriba (carteras, cuentas) van, cuando haga falta, en una base **aparte**
—decisión de las bases, sección 6— nunca en la maestra.

**Verificación.** Antes de dar este paso por cerrado del todo: confirmar que
las reglas de Firestore actuales (`av_watchlist`, `av_informes`, etc., ligadas
a `esOscar()`) no interfieren con usuarios anónimos del portal. Por diseño no
deberían —esas reglas exigen emails concretos verificados—, pero conviene
probarlo antes de depender de ello.

**Verificación.** Escribir en una línea qué pasa si alguien se registra en el
portal: dónde queda su cuenta y qué puede ver.

### Paso 5 · Validar los supuestos de mercado

**Entrada:** `js/nuvia-cartera.js`, constante `CLASES`.

**Hacer.** Revisar con criterio profesional los pares rentabilidad/volatilidad:
renta variable 7,0 / 16,0 · renta fija 3,2 / 5,5 · monetario 2,0 / 0,8 ·
activos reales 5,0 / 13,0. Documentar de dónde salen y cada cuánto se revisan.

**Verificación.** Cada cifra tiene una fuente citable. Las bases exigen que los
supuestos sean visibles para el usuario: si no se puede citar, no se puede
publicar.

---

# FASE 1 · Integración con la base maestra

**Cambia por completo respecto a la versión anterior de este documento.** Ya no
se monta un proceso propio de descarga y cálculo: se reutiliza
`bbdd-activos-financieros`, la base de datos de la plataforma profesional
(ver bases, sección 6). El trabajo pasa de "construir datos" a "conectar con
los que ya existen, de solo lectura".

### Paso 6 · Dar de alta Firebase Anonymous Auth en el portal

**Hacer.** Añadir el SDK cliente de Firebase al portal, apuntando al proyecto
`bbdd-activos-financieros`. Al cargar la sección, si no hay sesión, iniciar
sesión anónima automáticamente.

**Verificación.** Abrir en incógnito, cargar la sección y comprobar en la
consola de Firebase que aparece un nuevo usuario anónimo. Sin acción del
visitante: tiene que ser invisible para él.

> **No mezclar con las cuentas del portal.** Este UID anónimo es solo para
> autorizar las consultas de solo lectura. La cuenta que el usuario cree al
> registrarse en NUVIA (fase 4) es otra cosa; se vincula, no se confunde.

### Paso 7 · Probar las Cloud Functions existentes desde el portal

**Hacer.** Llamar a `search_assets`, `get_asset_detail`, `get_asset_holdings` y
`get_price_series` desde un prototipo mínimo, autenticado solo con el UID
anónimo del paso 6.

**Verificación.** Las cuatro responden sin error de permisos. Si alguna
rechaza al usuario anónimo pese a pasar `request.auth != null`, revisar si
tiene una comprobación adicional (por ejemplo, email verificado) que excluya
cuentas anónimas — habría que pedir un ajuste en el repositorio profesional.

### Paso 8 · Calcular la matriz de correlaciones en el cliente — resuelto

**Decisión tomada, verificada contra el código de `get_price_series`.** No
hace falta Cloud Function nueva: se calcula en el navegador con lo que ya
sirve esa función.

**Por qué es viable, con datos concretos de la implementación:**
- Acepta hasta **25 `asset_ids`** por llamada (`MAX_REBASED_SERIES_ASSETS`),
  por encima del límite de 20 del suscriptor.
- Con `frequency: "DAILY"` y `window: "3Y"` devuelve series diarias de tres
  años por activo — la ventana estándar para una correlación de Pearson.
- Devuelve fechas ya **alineadas entre activos** y niveles rebasados a 100:
  de ahí se derivan los retornos diarios sin trabajo adicional de casado de
  calendarios.
- Los activos sin histórico suficiente vienen marcados (`INSUFFICIENT_HISTORY`
  y otros motivos en `excluded`), no hacen fallar la llamada entera.

**Hacer.** Para la cartera del usuario (máximo 20 activos → 190 pares):
1. Llamar a `get_price_series` con `frequency: "DAILY"`, `window: "3Y"` y los
   `asset_ids` de la cartera.
2. Derivar retornos diarios de los niveles rebasados de cada serie.
3. Calcular Pearson por pares sobre las fechas comunes.
4. Si algún activo vuelve en `excluded`, avisar en la interfaz de qué activo
   falta y por qué — nunca fallar en silencio ni inventar una correlación.

**Verificación.**
- La diagonal debe ser 1.
- Telefónica–BBVA debe salir claramente por encima de Telefónica–Toyota.
- Dos ETF del mismo índice deben salir cerca de 0,99.
- Ningún valor fuera de [−1, 1].
- 190 pares para 20 activos se calculan sin percibirse un retraso en el
  navegador; si no, revisar antes de dar el paso por cerrado.
- Telefónica–BBVA debe salir claramente por encima de Telefónica–Toyota.
- Dos ETF del mismo índice deben salir cerca de 0,99.
- Ningún valor fuera de [−1, 1].

**Esquema resumen del paso 8:**

```
  20 activos de la cartera del suscriptor
         │
         │  1 llamada a get_price_series
         │  { asset_ids: [...20], frequency: "DAILY", window: "3Y" }
         ▼
  ┌─────────────────────────────────────────┐
  │  Límite de la función: 25 asset_ids      │   20 < 25 → una sola llamada,
  │  margen: 5 activos                       │   margen de sobra
  └─────────────────────────────────────────┘
         │
         ▼
  20 series diarias · 3 años · ya alineadas por fecha · rebasadas a 100
  (+ excluded: activos sin histórico suficiente, con motivo)
         │
         │  en el cliente, sin red
         ▼
  niveles → retornos diarios → Pearson por pares
         ▼
  190 pares de correlación  (20 × 19 / 2)
```

| | |
|---|---|
| **Dónde se calcula** | En el navegador, no en una Cloud Function nueva |
| **Con qué dato** | `get_price_series`, ya existente, sin modificar |
| **Límite técnico real** | 25 activos por llamada |
| **Límite de negocio** | 20 activos (suscriptor) — con 5 de margen |
| **Verificado con** | idénticas → 1,0000 · invertida → −0,9996 · ruido → 0,0412 |
| **Repositorio profesional** | No se toca |

### Paso 9 · Definir el catálogo visible en el portal

**Hacer.** El catálogo completo ya existe en la maestra; el portal filtra qué
parte muestra. Criterio **propio** (bases, sección 1): relevancia para un
particular español, cobertura de las principales bolsas y gestoras, presencia
de productos habituales en banca comercial.

**Verificación.** Buscar diez valores que un cliente típico tendría —IBEX
grandes, fondos indexados conocidos, un ETF global— y comprobar que
`search_assets` los devuelve dentro del filtro elegido.

> **Cuidado, sigue aplicando.** El catálogo no lo determina quién aporta los
> datos ni qué tiene la maestra volcado. Si mañana una gestora ofrece su gama
> «para que la tengáis», entra por criterio propio o no entra.

### Paso 10 · Medir el coste real

**Hacer.** Con el prototipo del paso 7, estimar invocaciones por sesión de
usuario típica (búsqueda + varias fichas + un cálculo de cartera) y proyectar
coste mensual a distintos volúmenes de visitantes.

**Por qué este paso no existía antes.** La versión anterior de este plan no
tenía coste marginal por visitante —todo era estático—. Ahora sí lo hay, y
conviene conocerlo antes de que el nivel gratuito escale sin control.

**Verificación.** Cifra en euros/mes a 1.000, 10.000 y 100.000 visitantes
mensuales, con margen si `optimize_portfolio` u otras funciones pesadas entran
en el camino del visitante (no deberían: son de nivel suscriptor).

### Paso 11 · Cachear en el cliente lo que no cambia en el día

**Hacer.** Los datos de una ficha de activo no cambian en el mismo día. Cachear
en el navegador (`localStorage` o similar) las respuestas de `get_asset_detail`
y `get_asset_holdings` con expiración diaria, para no repetir la llamada si el
usuario vuelve a mirar el mismo activo en la misma sesión.

**Verificación.** Consultar el mismo activo dos veces en una sesión debe
disparar una sola llamada a la Cloud Function, visible en las herramientas de
red del navegador.

---

# FASE 2 · Motor de cálculo

**Entrada:** `js/nuvia-cartera.js` y el fichero de datos de la fase 1.

### Paso 12 · Migrar a correlaciones reales

**Hacer.** Sustituir `correlacion(a, b)` —que hoy asume por clase de activo—
por una lectura de la matriz publicada. La firma de `volatilidadCartera()` no
cambia; cambia de dónde sale ρ.

**Verificación.** Una cartera de Telefónica + BBVA + Santander debe dar ahora
**mucho menos ahorro por diversificar** que antes. Si no baja, la matriz no se
está usando.

> **Hecho y verificado (19-08-2026), con un matiz que importa.** El módulo lee
> ρ de la matriz real (`correlacionesDesdeSeries()` +
> `estableceCorrelaciones()`); la firma de `volatilidadCartera()` no cambió, y
> la batería (`node docs/nuvia-cartera.test.mjs`) pasa entera, incluida la
> comprobación de que sin matriz no se inventa ninguna ρ (devuelve
> `undefined`). Pero el contraste con datos reales de mercado desmintió el
> ejemplo del enunciado: Telefónica ya no se mueve con la banca (ρ ≈ 0,15–0,23
> con BBVA y Santander en la ventana 2023–2026, tras su desplome de nov-2025),
> así que esa cartera concreta da HOY MÁS ahorro por diversificar que con el
> supuesto de clase, no menos — y es el resultado correcto. Con tres valores
> que sí se mueven juntos (mecanismo verificado con series sintéticas de
> ρ ≈ 0,88, y con BBVA–SAN real, ρ = 0,79) el ahorro baja como predice el
> enunciado. La prueba de que «la matriz se está usando» es doble: los pares
> reales pesan cada uno lo suyo, y sin matriz el cálculo se niega a responder.

### Paso 13 · Portar el solapamiento

**Prioritario, no un extra.** Es lo que el usuario no ve en ningún otro sitio.

**Hacer.** Portar `src/core/overlap.ts` de la plataforma, resolviendo sus
dependencias de tipos. Necesita el desglose de posiciones de cada fondo
(look-through), que hay que incorporar al catálogo.

**Verificación.** Dos ETF conocidos del mismo índice deben dar solapamiento
cercano al 100 %. Dos de sectores distintos, cercano a 0.

> **Hecho y verificado (19-08-2026).** Portado en `js/nuvia-solapamiento.js`
> como funciones puras: `solapamiento()` (de `overlap.ts`, Σ min de pesos
> normalizados, casado por ISIN y por nombre normalizado como respaldo),
> `lookThroughCartera()` (de `holdingsLookthrough.ts`, sin la capa de carga:
> los desgloses llegan ya descargados de `get_asset_holdings`) y
> `matrizSolapamiento()` (añadido del portal, todos los pares con la misma
> regla que el paso 12: fondo sin desglose fuera de la matriz, nunca un valor
> inventado). Batería en `node docs/nuvia-solapamiento.test.mjs`. Contraste
> con carteras reales de ETF: SPY–VOO (mismo índice, misma profundidad de
> desglose) 95,5 %; XLF–XLE (financiero vs energía) 0 %; SPY–XLF 10,6 %, el
> peso que financieras tiene dentro del índice amplio. El repositorio
> profesional no se ha tocado. Queda para la fase 1/3: que el catálogo del
> portal traiga el desglose vía `get_asset_holdings` (con su caché diaria,
> paso 11).

### Paso 14 · Concentración sectorial y geográfica

**Hacer.** Agregar los pesos por sector y por país, con look-through en fondos:
un fondo global no es «internacional», son sus posiciones repartidas.

**Verificación.** Una cartera de cuatro bancos españoles debe salir ~100 %
financiero y ~100 % España. Si sale repartida, el look-through no funciona.

> **Hecho y verificado (19-08-2026).** Portado en `js/nuvia-concentracion.js`
> desde `equitySectors.ts` y `equityRegions.ts` de la plataforma:
> `concentracionSectorial()` y `concentracionGeografica()` agregan las
> distribuciones que la maestra guarda por activo (`exposure_detail`),
> ponderadas por peso × exposición a renta variable — el look-through no se
> recalcula en el portal, viene calculado en el dato del activo. Se porta
> también el respaldo heurístico de la plataforma (categoría/nombre para
> sector; región o divisa para geografía) con su etiqueta de calidad
> (`lookthrough`/`mixed`/`estimated`/`none`) y el `pesoEstimado` declarado:
> la interfaz TIENE que enseñarlo, un estimado nunca se presenta como dato.
> Batería en `node docs/nuvia-concentracion.test.mjs`: cuatro bancos → 100 %
> financiero y 100 % España; fondo global repartido por regiones; fondo de
> bonos fuera de la concentración de RV. Contraste con distribuciones reales
> de EODHD: XLF → 98,1 % financiero; SPY 70 % + XLF 30 % → financiero 37,8 %,
> exactamente la media ponderada.

### Paso 15 · Frontera y Monte Carlo sobre activos reales

**Hacer.** Adaptar `frontera()` para que opere sobre las posiciones reales del
usuario en vez de sobre las cuatro clases.

**Verificación.** La frontera debe ser monótona creciente en rentabilidad. Y con
activos muy correlacionados debe ser mucho más plana que con una cartera
diversificada: si no, las correlaciones no están entrando.

> **Hecho y verificado (19-08-2026).** `frontera()` acepta ahora `activos`
> —posiciones reales con su rentabilidad y, opcionalmente, su σ; la σ que
> falte sale de la matriz registrada y la ρ de cada par sale SIEMPRE de esa
> matriz—. Sin `activos` sigue operando sobre las cuatro clases, intacto para
> el visitante. Si falta σ, rentabilidad o alguna ρ, devuelve la frontera
> vacía con el motivo en `sinDatos`: nunca calcula con cifras inventadas.
> La frontera se filtra además a monótona creciente (más riesgo solo aparece
> si paga más rentabilidad), que es la verificación del enunciado. Batería:
> tres activos con ρ = 0,95 dan un rango de σ 22 veces más estrecho que con
> ρ = 0,1 (0,0031 frente a 0,0686), y con ρ baja la cartera de mínimo riesgo
> baja a 12,7 % frente a 19,7 %. Contraste real: frontera BBVA+SAN+CABK con
> la matriz semanal 2023–2026 → monótona y plana (σ de 24,2 % a 25,3 %),
> con la σ mínima de cartera pegada a la del banco menos volátil — entre
> activos con ρ 0,70–0,79 apenas hay diversificación que rascar.

### Paso 16 · Métricas de la tabla del visitante

**Hacer.** Rentabilidad a 3 años, volatilidad, **máxima caída** (peor caída de
pico a valle en el periodo). Esta última es la más intuitiva para un particular
y no está aún en el módulo.

> **Hecho y verificado (19-08-2026).** `metricasDesdeSerie()` en
> `js/nuvia-cartera.js`: rentabilidad total y anualizada, volatilidad anualizada
> y máxima caída, con la serie de caídas portada literal de `underwater.ts`
> (`serieDeCaidas()`: el NaN no rompe el pico). Serie insuficiente →
> `undefined`, nada inventado. Contraste real: Telefónica semanal 2023–2026
> → +19,6 % total, 6,1 % anualizada, σ 21,5 % y máxima caída −28,3 %, que es
> el desplome de noviembre de 2025 medido de pico a valle.

### Paso 17 · Batería de pruebas

**Hacer.** Fichero de casos con resultado esperado. Mínimo:

| Caso | Debe dar |
|---|---|
| Un solo activo | ahorro por diversificar = 0 |
| Dos activos idénticos | ahorro ≈ 0 |
| Cuatro bancos españoles | concentración ~100 % un sector |
| Cartera diversificada real | ahorro de varios puntos |
| Dos ETF del mismo índice | solapamiento ~100 % |

**Verificación.** Se ejecuta con un comando y pasa entera. Añadir al
`npm run validate` si encaja.

> **Hecho (19-08-2026).** `npm run test:analisis` ejecuta las tres baterías
> (cartera, solapamiento, concentración: 58 comprobaciones) y queda integrado
> en `npm run validate`. Todos los casos de la tabla están cubiertos: un solo
> activo → ahorro 0; dos idénticos (ρ = 1) → ahorro 0; cuatro bancos → 100 %
> un sector; cartera diversificada → ahorro de varios puntos; dos ETF del
> mismo índice → solapamiento ~100 % (95,5 % con carteras reales SPY–VOO).

---

# FASE 3 · Nivel de visitante

El más importante. Si no engancha, no hay registro ni suscripción.

### Paso 18 · Estructura de la página

**Hacer.** Sustituir el iframe actual de `cartera.html` por la sección propia.
Mantener el héroe existente, que ya está bien y usa la identidad de NUVIA.

**Verificación.** La página renderiza **sin JavaScript** (principio del portal).
El simulador puede requerirlo; la página, no.

> **Hecho y verificado (19-08-2026).** `cartera.html` dejó de incrustar la suite
> del núcleo (`portfolioPreview=1`) y pasó a servir su propia sección
> `#laboratorio`: introducción, simulador por clases, tabla de supuestos
> visible, «cómo leer estas cifras» y fuentes/límites. La vista de análisis de
> empresas conserva su iframe. Los módulos de cálculo se movieron de `docs/` a
> `js/` (build los publica) y el montaje lo hace `js/nuvia-simulador.js` desde
> el script de la página. Comprobado con navegador real: sin JavaScript se lee
> toda la sección estática con su aviso; con JavaScript el simulador recalcula
> al instante; sin desbordamiento horizontal a 1440/1024/390; `?vista=companies`
> oculta el laboratorio y carga el iframe de empresas. `npm run validate` en
> verde con el contrato de paridad actualizado (la página ya no debe contener
> `portfolioPreview=1`).

### Paso 19 · Buscador de activos

**Hacer.** Campo único que busque por nombre, ticker o ISIN sobre el catálogo
completo. Visible y usable para todos desde el primer momento.

**Verificación.** Escribir «telefonica» sin tilde debe encontrarlo. Escribir un
ISIN completo, también.

> **Hecho y verificado (19-08-2026).** Dos módulos nuevos: `js/nuvia-datos.js`
> (sesión anónima por REST de Identity Toolkit —persistida y renovada— y
> llamadas a las callable de la maestra, con caché de búsquedas de 10 min y
> batería propia en `docs/nuvia-datos.test.mjs`) y `js/nuvia-buscador.js`
> (campo único con retardo de 300 ms, estados «Buscando…»/«Sin resultados»/
> error llano; elegir un resultado emite `nuvia:activo-elegido`, que usará el
> constructor del paso 20). Verificado contra la función real desde el equipo
> de Óscar: «telefonica» sin tilde devuelve Telefónica y el ISIN completo
> también (`search_assets` normaliza acentos en servidor). El contrato de
> paridad exige ahora el buscador y prohíbe que la página mencione EODHD.
>
> **Nota de infraestructura (cierra de verdad el paso 6).** El proveedor
> «Anonymous» del proyecto `bbdd-activos-financieros` no estaba habilitado y,
> además, el alta de usuarios estaba desactivada a nivel de proyecto
> (`disabledUserSignup: true`), lo que bloqueaba también las sesiones
> anónimas. El 19-08-2026, con autorización de Óscar, se habilitó el proveedor
> anónimo y se reabrió el alta. Efecto colateral consciente: también puede
> autorregistrarse una cuenta de email; queda con los mismos permisos de solo
> lectura y límite de 120 llamadas/min que un anónimo (el panel admin sigue
> tras claims de administrador).

### Paso 20 · Construcción de la cartera

**Hacer.** Añadir hasta 5 posiciones con su peso. Los pesos deben normalizarse a
100 % automáticamente y verse cómo cambian al mover uno.

**Verificación.** Mover un peso debe recalcular todo **al instante**, sin botón
de «calcular». Esa inmediatez es lo que engancha.

> **Hecho y verificado (19-08-2026).** `js/nuvia-constructor.js`: hasta 5
> posiciones que llegan del buscador (evento `nuvia:activo-elegido`), pesos
> normalizados al 100 % y recálculo inmediato. Las métricas salen del
> historial real: una llamada a `get_price_series` (diaria, 3 años, EUR) por
> conjunto de activos, cacheada — mover un peso no toca la red; la serie de
> la cartera es la combinación ponderada de las series rebasadas (comprar al
> inicio y no tocar) y pasa por `metricasDesdeSerie()`. Un activo sin
> historial se dice tal cual («fuera del cálculo») y el resto se renormaliza.
> Nota de fuente con la fecha del último cierre y «base de datos NUVIA»
> (adelanta el paso 26 en esta vista). La lógica pura tiene batería propia
> (`docs/nuvia-constructor.test.mjs`, en `npm run test:analisis`); el flujo
> completo está verificado con navegador real (añadir/quitar/límite/sin
> historial/overflow a 1440 y 390/sin JS) y en producción.

### Paso 21 · El límite, comunicado antes

**Hacer.** Al llegar a 5 posiciones, decir por qué y qué se gana registrándose.
Nunca dejar montar y bloquear al final (bases, sección 3).

> **Hecho y verificado (19-08-2026).** Tres piezas en el constructor: (1) un
> contador «Posiciones: N de 5» visible desde la primera posición — el límite
> se comunica antes, no después; (2) al llegar a 5, una nota de nivel
> (`NOTA_NIVEL`) que explica el porqué del tope (con pocas posiciones la
> tabla se lee con claridad), qué añadirá la cuenta gratuita (mismas 5
> posiciones, guardado en la nube, carteras sin tope, análisis más amplio) y
> hasta dónde llega la suscripción (20 posiciones) — y dice honestamente que
> el registro se abre en una fase posterior; (3) el sexto intento no borra
> nada: se rechaza con la explicación delante. La nota describe sin
> aconsejar; la batería lo comprueba (incluido el filtro de lenguaje de la
> sección 2 de las bases) y el ciclo completo está verificado con navegador
> real: la nota no aparece antes del tope, aparece al llegar y se oculta al
> quitar una posición.

### Paso 22 · Tabla de métricas

**Hacer.** Rentabilidad, volatilidad, máxima caída. **Cada cifra con su lectura
en lenguaje llano**, no solo el número.

> Ejemplo del tono: «Volatilidad 12,4 % — en un año normal, el valor de esta
> cartera puede moverse arriba o abajo alrededor de un 12 %.»

> **Hecho y verificado (19-08-2026).** `lecturasDeMetricas()` en
> `js/nuvia-constructor.js`: cada cifra va dentro de una frase que la
> traduce. Rentabilidad → «Cada 10.000 € al inicio habrían acabado en X €
> tres años después (Y % de media anual). El pasado no asegura el futuro.»
> Volatilidad → «…se ha movido arriba o abajo en torno a un X %.» Máxima
> caída → «…llegó a estar un X % por debajo de su máximo anterior (punto más
> bajo: dd-mm-aaaa)», con la fecha real del valle calculada con
> `serieDeCaidas()` sobre la serie de la cartera. Casos límite dichos tal
> cual: sin caídas («no llegó a caer…»), sin datos («no hay datos
> suficientes»), fechas descuadradas → sin fecha, nunca una inventada. La
> batería cubre las lecturas y les pasa el filtro de lenguaje de las bases
> §2; verificado también en navegador real.

### Paso 23 · Reparto por clase de activo

**Hacer.** Un gráfico. Uno solo, y que enseñe una idea (bases, sección 4).

> **Hecho y verificado (19-08-2026).** Una barra apilada con leyenda en el
> constructor: `repartoPorClase()` agrega los pesos normalizados por la
> clase económica que declara la maestra (`economic_asset_class`), con los
> colores de categoría del sistema (`--nv-cat-*`) y la leyenda con etiqueta
> y porcentaje al lado — la información no depende solo del color. La idea
> que enseña: en qué clases está el dinero de esta combinación. Honestidad
> del dato: una clase desconocida sale como «Sin clasificar» (no se
> adivina), un activo sin historial no entra, y una nota fija aclara que los
> fondos mixtos cuentan como «Mixtos», sin mirar dentro (el look-through es
> de niveles superiores). Batería propia y verificación en navegador real.

### Paso 24 · Guardado local

**Hacer.** Hasta 3–4 carteras en el navegador. **Avisar de que se pierden** al
limpiar datos y de que no hay continuidad entre dispositivos.

**Verificación.** Abrir en incógnito: no debe verse nada de la sesión anterior,
y el aviso debe ser comprensible sin conocer cómo funciona un navegador.

> **Hecho y verificado (19-08-2026).** Hasta 4 carteras en `localStorage`
> (`nuvia.carteras-visitante.v1`), con nombre libre (o «Cartera N»
> automático), botón «Guardar en este navegador (N de 4)» —el límite a la
> vista antes de tocarlo—, y Cargar/Borrar por cartera. Mismo nombre →
> actualiza en vez de duplicar; el 5.º guardado se rechaza explicándolo.
> Solo se guarda lo necesario para reconstruir (identidad del activo y peso
> bruto), nunca métricas ni datos de pantalla. El aviso (`AVISO_GUARDADO`)
> evita tecnicismos: «Tus carteras se guardan solo en este navegador y en
> este dispositivo. Si borras los datos de navegación se pierden, y no
> aparecerán si abres la página en otro ordenador o en el móvil.» — la
> batería comprueba que no contiene jerga. Verificado con navegador real:
> guardar → recargar → cargar → borrar, y en contexto limpio (incógnito) no
> se ve nada de la sesión anterior.

### Paso 25 · Revisión del lenguaje, una etiqueta a una

**El paso que más se salta y más consecuencias tiene.**

**Hacer.** Repasar cada título, etiqueta, tooltip y texto de métrica contra la
sección 2 de las bases. Buscar y eliminar: «mejor», «recomendado», «óptimo»,
«conviene», «deberías», «ideal para».

**Verificación.** Leer la pantalla entera y preguntarse: *¿de esto se deduce qué
debería hacer alguien con su dinero?* Si sí, reescribir.

> **Hecho y verificado (19-08-2026).** Revisión doble. (1) Etiqueta a
> etiqueta: extraídas todas las cadenas visibles de `cartera.html` y de los
> módulos del laboratorio y contrastadas con la sección 2 de las bases. Un
> hallazgo corregido: los valores iniciales del simulador (40/40/15/5) no se
> declaraban como ejemplo y podían leerse como reparto sugerido — ahora la
> página dice que son «solo un punto de partida, el mismo para todo el que
> abre la página». (2) Pantalla entera: montada la página con datos y leída
> completa; ninguna frase juzga una combinación, personaliza la conveniencia
> ni apunta dirección de operación. Además, la revisión queda **permanente**:
> `scripts/check-lenguaje.mjs` (dentro de `npm run validate`) rompe la build
> si en las superficies del visitante aparece «mejor», «recomendado» (fuera
> de la declaración «no emite recomendaciones»), «óptimo», «conviene»,
> «deberías», «ideal/adecuado para», «para ti/usted», perfiles de idoneidad,
> «garantizado» o direcciones de operación, y exige que la página declare
> «no previsiones», «pendientes de validación profesional» y «no constituye
> asesoramiento».

### Paso 26 · Nota al pie con fuentes

**Hacer.** En cada vista con datos: origen y fecha. En el simulador, la fuente
es la maestra: «Datos de cierre del [fecha], base de datos NUVIA.» No citar
EODHD aquí: esa atribución corresponde a Análisis y valoración de empresas,
la única vista que lo consulta. Mezclar las dos rutas de datos en la misma
nota confundiría al usuario sobre de dónde sale cada cifra.

> **Hecho y verificado (19-08-2026).** Cada vista con datos lleva su nota:
> el constructor ya decía «Datos de cierre del [fecha], base de datos NUVIA.
> Ventana de 3 años, en euros. N observaciones.» (desde el paso 20); el
> simulador por clases añade ahora la suya (`FUENTE_SIMULADOR`): «Fuente:
> supuestos propios de NUVIA — la tabla “Los supuestos, a la vista” de esta
> página. Este simulador no usa datos de mercado en vivo.» — su origen son
> supuestos, no la maestra, y decir otra cosa sería inventar. El bloque
> «Fuentes y límites» explica las dos rutas. EODHD no se cita en ninguna
> parte de la página (el contrato de paridad lo prohíbe desde el paso 19); su
> atribución vive solo en Análisis y valoración de empresas.
> `check-lenguaje.mjs` exige ahora estas declaraciones, con lo que la nota de
> fuentes no puede desaparecer sin romper la build.

### Paso 27 · Verificación final del nivel

**Hacer, sin excepciones:**

- Contraste AA en todo, medido —no estimado. Ojo con fondos en degradado: hay
  que leer píxeles, no `background-color`.
- Suelo tipográfico de 12 px.
- Sin desbordes horizontales a 1440, 1024 y 390 px.
- Sin errores de consola.
- Jerarquía de encabezados sin saltos.
- `npm run validate` en verde.

> **Hecho y verificado (19-08-2026) — Fase 3 cerrada.** Con la página montada
> con datos (buscador usado, cartera construida, cartera guardada):
> **Contraste AA medido.** 146 textos visibles: los de fondo sólido,
> calculados con la fórmula WCAG (peor caso 5,98:1 ≥ 4,5); los 5 sobre el
> degradado del héroe, leyendo píxeles de la captura — solo píxeles de fondo
> planos (entorno 5×5 uniforme, lejos del color del texto, para excluir el
> antialiasing de las letras): peor píxel 7,38:1. **Suelo de 12 px:** tres
> incumplimientos corregidos — `nv-tag` (10 px) y las etiquetas `nv-field`
> (11 px) elevados a 12 px dentro del laboratorio, y el pie de página del
> sitio (11/11,5 px) subido a 12 px. **Sin desbordes** a 1440/1024/390 con el
> laboratorio lleno. **Consola limpia** (la única incidencia del entorno de
> pruebas es Google Fonts bloqueado por el sandbox; comprobado limpio en
> producción). **Encabezados:** un solo h1 y sin saltos con los h3 dinámicos
> incluidos. **`npm run validate` en verde** (paridad, sitio estático,
> consistencia, lenguaje y baterías).

---

# FASE 4 · Cuentas y niveles

**Antes de empezar: revisión jurídica.** Bases, «Pendiente de validación
jurídica». No es un trámite posterior.

> **Hecho (19-08-2026).** Óscar dio por validada la revisión jurídica y
> autorizó el arranque de la fase («sigue, está validado»). Registrado en las
> bases, §2.

### Paso 28 · Registro con datos mínimos

**Hacer.** Correo y contraseña, o proveedor externo. Nada más. Sin teléfono, sin
patrimonio, sin perfil de riesgo — eso último se parecería a un test de
idoneidad, que es exactamente lo que la norma regula.

> **Hecho y verificado (19-08-2026).** Bloque «Tu cuenta» en `cartera.html`,
> montado por `js/nuvia-cuenta.js`: crear cuenta, iniciar sesión, cerrar
> sesión y recuperar contraseña, con correo y contraseña y nada más — y el
> bloque lo declara («Solo pedimos correo y contraseña…»), con `check-lenguaje`
> exigiendo esa declaración desde la build. Dice además, honestamente, que de
> momento iniciar sesión no cambia lo que se ve: la nube y el análisis ampliado
> llegan en los pasos 30–32.
>
> **Cómo se enlaza la cuenta.** El visitante ya tiene una sesión anónima de
> lectura (paso 19). Crear la cuenta la enlaza con `accounts:signUp` +
> `idToken` — mismo usuario antes y después, así que lo que se apoye en el UID
> sobrevivirá al registro. La vía «natural» (`accounts:update` con email y
> password) la rechaza Identity Toolkit («Please verify the new email before
> changing email»); comprobado contra el proyecto real desde el PC de Óscar
> antes de escribir una línea: alta anónima → enlace (mismo UID) → login →
> llamada a las funciones OK → cuenta de prueba borrada. La renovación de
> token conserva tipo y correo de la sesión; cerrar sesión la olvida y la
> siguiente consulta abre otra anónima. Errores de Firebase traducidos a
> llano (EMAIL_EXISTS, credenciales que no coinciden —sin desvelar cuál de
> las dos falla—, WEAK_PASSWORD, INVALID_EMAIL, demasiados intentos).
> `NOTA_NIVEL` del constructor ya no habla de «una fase posterior»: apunta al
> bloque «Tu cuenta». Batería nueva `docs/nuvia-cuenta.test.mjs` (22
> comprobaciones, en `npm run validate`), `check-parity` exige el bloque, y
> verificación en navegador con Identity Toolkit simulado: alta, recarga con
> sesión persistida, cierre, login fallido y correcto, olvido de contraseña,
> sin desbordes a 1440/1024/390, suelo de 12 px y labels en todos los campos.

### Paso 29 · Consentimiento granular

**Hacer.** Separar: cuenta y persistencia (necesario) de comunicaciones
(opcional) y de análisis de comportamiento (opcional y explicado). Revocable
desde el perfil.

> **Hecho y verificado (19-08-2026).** `js/nuvia-cuenta.js` define
> `CONSENTIMIENTOS` (uno necesario —cuenta y guardado— y dos opcionales
> —comunicaciones por correo y análisis de uso—), con `leeConsentimientos` y
> `cambiaConsentimiento` (lógica pura, probada). Reglas de las bases §2 hechas
> código: lo necesario no lleva casilla y se explica por qué (marcarlo sería
> fingir una elección); lo opcional es opt-in real —apagado hasta que alguien
> lo encienda, con la explicación delante de la casilla— y **revocable al
> instante** desde el propio bloque «Tus permisos»; cada decisión se apunta con
> su fecha. El silencio nunca cuenta como sí: sin decisión previa, lo opcional
> se lee apagado. El análisis de uso se nombra como lo que es —elaboración de
> perfil— y declara que, apagado, «no se registrará nunca» (declaración que
> `check-lenguaje` exige). En el alta las casillas opcionales salen sin
> premarcar; al crear la cuenta se guardan las que el visitante haya marcado.
> Persistencia hoy en `localStorage` por cuenta (clave `nuvia.consentimientos.v1`,
> id = correo normalizado); pasará a la nube con el paso 30, y se dice tal cual.
>
> **Verificado.** Batería ampliada en `docs/nuvia-cuenta.test.mjs` (necesario
> siempre activo e intocable, opcional apagado por defecto, activar/revocar con
> fecha, normalización del correo, aislamiento entre cuentas, clave desconocida
> rechazada, textos sin jerga de consejo). En navegador con Identity Toolkit
> simulado: alta sin casillas premarcadas, marcar en el alta persiste el
> permiso, revocar en caliente se aplica y sobrevive a la recarga, lo necesario
> sin casilla. `npm run validate` en verde. Sin desbordes a 1440/1024/390
> (un `<fieldset>` pedía `min-inline-size:0` para no imponer su ancho de
> contenido en móvil; corregido).

### Paso 30 · Persistencia en la nube

**Hacer.** Guardar solo lo mínimo: identificador de activos y pesos. Ni el
cálculo ni los resultados: se recalculan al abrir.

> **Hecho y verificado (19-08-2026).** Con la sesión iniciada, el bloque «Tus
> carteras» del constructor pasa de local (paso 24) a **la cuenta**: título
> «Tus carteras, en tu cuenta», guardar / cargar / borrar contra las callable
> app-owned `save_portfolio` / `list_portfolios` / `get_portfolio` /
> `delete_portfolio` (aisladas por UID). Se guarda **solo** `asset_id` +
> `weight_percent` (peso normalizado 0–100): ni nombres, ni tipos, ni clases,
> ni métricas. Al abrir una cartera se reconstruye desde la maestra
> (`get_asset_detail` da nombre/tipo/clase) y se recalcula con
> `get_price_series`, así que el dato guardado no puede quedar viejo — se dice
> tal cual en el aviso. Sin tope de carteras (nivel gratuito). Mapas puros
> `carteraNubeParaGuardar` (solo ids+pesos, `portfolio_id` opcional para
> reemplazar) y `posicionesDesdeNube` (cap a `MAX_POSICIONES`, sin ficha →
> muestra el identificador, nunca inventa nombre) en `nuvia-constructor.js`;
> métodos de red `guarda/lista/lee/borraCarteraNube` + `detalleActivo` en
> `nuvia-datos.js`. El cambio de sesión lo comunica `nuvia-cuenta.js` con el
> evento `nuvia:sesion-cambiada`, y el constructor re-pinta el bloque.
>
> **Contrato probado en real** (PC de Óscar, antes de codificar): alta anónima
> → `save_portfolio` persiste exactamente `[{asset_id, weight_percent}]` y
> devuelve `portfolio_id` (uuid); `list_portfolios` los devuelve; `get_asset_detail`
> da `identity.display_name` + `instrument_type` + `economic_asset_class`.
> (El puente PowerShell mangla los objetos anidados al parsearlos, así que el
> contrato se leyó del **contenido crudo** de la respuesta; el `fetch` del
> navegador parsea bien.) **Verificado en navegador** con las cuatro callable y
> `get_asset_detail` simuladas: sin sesión el guardado es local; al registrarse
> pasa a la cuenta; guardar manda solo ids+pesos; cargar reconstruye el nombre
> desde la base y recalcula; persiste tras recargar; borrar la quita; al cerrar
> sesión vuelve el local. `npm run validate` en verde; sin desbordes
> 1440/1024/390. Baterías nuevas en `docs/nuvia-constructor.test.mjs` (mapas) y
> `docs/nuvia-datos.test.mjs` (llamadas y desempaquetado).

### Paso 31 · Migración desde local

**Hacer.** Al registrarse, si hay carteras locales, ofrecer migrarlas.
**Con permiso explícito, nunca en silencio.**

> **Hecho y verificado (19-08-2026).** Con la sesión iniciada, si el navegador
> guarda carteras del nivel visitante (paso 24), el bloque «Tus carteras» de la
> cuenta muestra una **oferta**: «Tienes N carteras guardadas en este
> navegador. Puedes subirlas a tu cuenta… se suben solo los activos y sus
> pesos, como el resto», con dos botones: **«Subir a mi cuenta»** y **«Ahora
> no»**. Nada se mueve sin pulsar. Al subir, cada cartera local se guarda en la
> nube con `carteraNubeParaGuardar` (solo `asset_id` + `weight_percent`; se
> descartan las vacías o a cero) y, una vez confirmada su subida, se quita del
> navegador: es una **mudanza**, no una copia doble. Si una subida falla, las ya
> subidas se retiran de local (para no duplicar al reintentar) y el resto se
> queda en el navegador, dicho en llano. «Ahora no» descarta la oferta durante
> la sesión sin tocar nada. Mapa puro `carterasLocalesParaNube` en
> `nuvia-constructor.js` (una carga por cartera, filtrando las sin peso), con
> batería propia. **Verificado en navegador** (localStorage sembrado, callable
> simuladas): la oferta aparece al registrarse, subir mueve las dos a la cuenta
> enviando solo ids+pesos, el `localStorage` queda vacío, la oferta desaparece
> y al cerrar sesión vuelve el guardado local ya vacío. `npm run validate` en
> verde; sin desbordes 1440/1024/390. (Los consentimientos no necesitan
> migración: en el paso 29 se guardan ya bajo el correo de la cuenta.)

### Paso 32 · Análisis del nivel registrado

**Hacer.** Los desbloqueados en el paso 1: concentración, ahorro por
diversificar, solapamiento.

> **Hecho y verificado (19-08-2026).** Nuevo `js/nuvia-analisis.js`: con la
> sesión iniciada, bajo la tabla de métricas del constructor aparece
> **«Análisis ampliado (tu cuenta)»** con tres grupos, todos calculados en el
> navegador con los módulos ya portados en la Fase 2:
> **Ahorro por diversificar** — `ahorroDeSeries` calcula σ de la combinación y
> σ con ρ=1 sobre el MISMO historial de 3 años ya cargado (correlaciones de
> Pearson vía `correlacionesDesdeSeries`), y la lectura da las tres cifras en
> llano; con una sola posición o sin datos de un par → se dice, nunca se
> inventa. **Concentración sectorial y geográfica** — fichas de
> `get_asset_detail` (cacheadas por activo) pasadas a
> `concentracionSectorial`/`concentracionGeografica` (paso 14), top 5 con
> barras y la **calidad del dato declarada** (desglose real / % estimado por
> heurística / todo estimado); las claves de la base se muestran aseadas pero
> sin traducir. **Solapamiento entre fondos** — `get_asset_holdings_batch`
> (cacheado por conjunto) + `matrizSolapamiento` (paso 13) solo sobre
> posiciones FUND/ETF; con <2 fondos o sin desglose se dice tal cual.
> **Realidad de producción, verificada contra el backend real:** (1) el
> batch responde **401** incluso con sesión registrada, así que la capa de
> datos se repliega fondo a fondo con `get_asset_holdings` (≤5 fondos,
> límite 30/min); (2) el documento real de holdings trae
> `holding_name`/`holding_weight`/`identifiers.{isin,ticker}` (unidad
> `percent`), no el `{name, weight_pct}` del paso 13 → adaptador puro
> `carteraDesdeHoldings` que traduce esa forma (y acepta la corta), descarta
> filas sin nombre o con peso en otra unidad, y devuelve null sin filas
> útiles: nunca se inventa.
> Sin sesión, el bloque es una sola línea que describe qué se abre —
> sin empujar a nadie. El cambio de sesión re-lanza el recálculo
> (`nuvia:sesion-cambiada`). `check-lenguaje` vigila la superficie nueva y
> exige «base de datos NUVIA» y «nunca se inventa».
>
> **Verificado en navegador** (fichas, desgloses y series simulados): sin
> sesión solo el aviso; al registrarse aparecen los tres grupos; la matriz
> del par da EXACTAMENTE el mínimo esperado (Apple 50 %/30 % → 30 %); la
> concentración agrega bien (Technology 45 % = 60·½+30·½); mover un peso
> recalcula; cerrar sesión lo cierra. La verificación en navegador simula la
> realidad de producción: batch en 401 y desgloses fondo a fondo con la forma
> real. Batería pura `docs/nuvia-analisis.test.mjs` (series opuestas → ahorro
> grande; idénticas → ~0; serie plana → null; adaptador de la forma real).
> `npm run validate` en verde; sin desbordes 1440/1024/390; suelo de 12 px.
> **Verificado en producción** con cuenta de prueba (creada y borrada):
> con dos fondos reales en cartera, los tres grupos se pintan con datos
> reales — concentración con «desglose real de la base de datos NUVIA» y
> matriz de solapamiento con su cifra —, y la red confirma el camino:
> 1 intento de batch (401) y los desgloses fondo a fondo.

### Paso 33 · Análisis del nivel suscriptor

**Hacer.** Frontera, Monte Carlo, correlaciones, y 20 posiciones.

> **Hecho y verificado (19-08-2026).** Reparto del paso 1 respetado:
> **Registrado** — la frontera **estática** entra en su análisis ampliado:
> SVG con la nube de combinaciones (pesos Montecarlo de `frontera()` sobre
> los activos reales, σ y ρ de la matriz de `correlacionesDesdeSeries`, la
> rentabilidad anualizada de cada serie), la línea de la frontera y **su
> combinación marcada**; se declara «historial, no el futuro». Al pie, una
> línea dice qué añade el suscriptor y que la contratación **aún no está
> abierta**. **Suscriptor** — mismo bloque como «Análisis completo
> (suscripción)» con: frontera **interactiva** (un control accesible recorre
> los puntos de la frontera, marca el elegido en el dibujo y enseña riesgo,
> rentabilidad y reparto de ese punto del historial), **proyección por
> simulación de Montecarlo** (`proyeccionMonteCarlo` en `nuvia-cartera.js`:
> 4.000 trayectorias lognormales a pasos mensuales con la rentabilidad
> anualizada —geométrica, deriva ln(1+r) sin corrección −σ²/2— y la σ
> históricas de la combinación; percentiles 5/50/95 a 1, 3, 5 y 10 años,
> base 100; generador con semilla: reproducible también en la batería;
> declarada «simulación…, no es una previsión», exigido por `check-lenguaje`)
> y **matriz de correlaciones** completa (Pearson 3 años, diagonal 1,00,
> par sin datos → «—»). **20 posiciones**: `maxPosiciones(nivel)` en el
> constructor (contador, buscador, apertura desde la nube y textos del
> límite); una llamada a `get_price_series` sigue bastando (límite 25).
> El nivel sale de `nivelSesion()` en `nuvia-datos.js`: sesión registrada +
> marcador `nuvia.suscripcion.v1` por correo, que **escribirá la pasarela
> del paso 35** — hoy nadie lo tiene y el nivel queda descrito pero cerrado.
> De paso, `NOTA_QUE_APORTA` de «Tu cuenta» actualizada: ya era falso que
> iniciar sesión no cambiara nada.
>
> **Verificado en navegador** (23 comprobaciones): visitante solo el aviso;
> registrado con frontera estática sin control y sin proyección/matriz;
> suscriptor con las tres piezas, recorrido de la frontera funcionando,
> percentiles en los años 1/3/5/10, diagonal 1,00, sexta posición aceptada
> con contador «6 de 20»; cierre de sesión lo cierra todo; sin desbordes
> 1440/1024/390; suelo de 12 px. Baterías nuevas: proyección (mediana ≈
> (1+r)^años, σ=0 → percentiles iguales, reproducible, más σ → banda más
> ancha, entrada inválida → null), límite por nivel y `leeSuscripcion`
> (silencio = no; correo normalizado; marcador ilegible → no).
> **Verificado en producción** con cuenta de prueba (creada y borrada) y dos
> fondos reales: nivel registrado con la frontera estática (500 puntos de
> nube, línea y su combinación marcada) y la nota del suscriptor; puesto el
> marcador de suscripción a mano, el bloque pasa a «Análisis completo»:
> contador «2 de 20», la frontera se recorre y marca el punto elegido
> (reparto real Bestinver/Cobas en cada punto), proyección con percentiles
> reales y matriz con ρ = 0,65 entre los dos fondos value.

### Paso 34 · Derechos RGPD operativos

**Hacer.** Acceso, rectificación, supresión y portabilidad, funcionando desde el
primer usuario. No «cuando haya volumen».

**Verificación.** Crear una cuenta de prueba, usarla, y ejercer los cuatro
derechos. Si alguno requiere intervención manual por correo, no está operativo.

> **Hecho y verificado (19-08-2026).** Sección **«Tus datos y tus derechos»**
> dentro de «Tu cuenta», con los cuatro derechos en autoservicio:
> **Acceso** — «Ver todo lo que guardamos»: correo, carteras de la nube con
> sus posiciones (una llamada: `list_portfolios` devuelve los documentos
> completos), permisos con estado y fecha, suscripción, y la declaración de
> que no hay nada más (ni teléfono, ni patrimonio, ni perfil).
> **Portabilidad** — «Descargar mis datos (JSON)»: `datosParaPortabilidad`
> (pura) empaqueta todo en un JSON versionado y legible por máquina; se
> descarga como fichero, sin pasar por ningún servidor propio.
> **Rectificación** — la contraseña cambia **al momento** (`accounts:update`
> con idToken, probado contra el backend real); el correo pide su enlace
> `VERIFY_AND_CHANGE_EMAIL` porque Firebase exige verificar el correo nuevo
> (probado en real: el update directo responde OPERATION_NOT_ALLOWED) — sigue
> siendo autoservicio íntegro: lo completa el titular con el enlace, nadie
> interviene. Carteras y permisos se rectifican donde están, y se dice.
> **Supresión** — dos pasos en la misma página (sin diálogos del navegador):
> borra todas las carteras de la nube una a una, el rastro local de ESA
> cuenta (`borraRastroLocal`: consentimientos y marcador de suscripción, sin
> tocar otras cuentas del navegador), la cuenta en el proveedor
> (`accounts:delete`) y la sesión. «No hay papelera: borrado es borrado.»
> `CREDENTIAL_TOO_OLD_LOGIN_AGAIN` mapeado en llano por si la sesión es
> vieja. `check-lenguaje` exige que los cuatro derechos estén nombrados.
>
> **Verificado en navegador** (20 comprobaciones): cuenta + cartera guardada
> + permiso encendido → acceso enseña todo; la descarga es un JSON válido
> con ids+pesos, consentimientos con fecha y suscripción; la contraseña
> cambia con el idToken vigente; el cambio de correo dispara el oobCode
> correcto; el borrado deja la nube a cero, el proveedor sin cuenta, el
> navegador sin rastro y la página en estado visitante. Sin desbordes;
> suelo de 12 px. Baterías: paquete de portabilidad (normalización, solo
> ids+pesos, fechas), `borraRastroLocal` selectivo, y los tres métodos de
> cuenta con fetch falso (update/oob/delete y limpieza de sesión).
> **Verificado en producción, ejerciendo los cuatro derechos con una cuenta
> de prueba real y un fondo real guardado:** acceso enseñó correo, cartera
> con id+peso y permiso con fecha; la descarga interceptada era el JSON
> versionado exacto; la contraseña cambió al momento (y el reinicio de
> sesión con la nueva funcionó); el cambio de correo devolvió su enlace de
> verificación; la supresión en dos pasos dejó «Nada queda» — y el intento
> de iniciar sesión después respondió INVALID_LOGIN_CREDENTIALS: la cuenta
> ya no existe en el proveedor. Sin intervención manual en ningún derecho.

---

# FASE 5 · Suscripción

### Paso 35 · Pasarela de pago y facturación
### Paso 36 · Extras de pago por uso

**Criterio de las bases:** se cobra aparte lo que se percibe como extra desde el
principio, no un trozo del análisis que se le ha quitado. **No cobrar por
cálculos ya precalculados.**

> **Aplazados por decisión de Óscar (19-08-2026): «35 y 36 los saltas».**
> No se implementan por ahora; el plan sigue directamente por el paso 37.
> Mientras tanto la suscripción no puede contratarse y el nivel suscriptor
> queda como lo dejó el paso 33: implementado, descrito en la página y
> cerrado (nadie tiene el marcador `nuvia.suscripcion.v1`, que escribiría
> la pasarela cuando estos pasos se retomen).
>
> **Acceso del administrador (20-08-2026, a petición de Óscar).** Las
> cuentas de `CORREOS_ADMIN` en `js/nuvia-datos.js` (hoy solo
> `oantiza@gmail.com`) ven el nivel completo —suscriptor— con solo iniciar
> sesión, sin marcador ni pasarela: frontera interactiva, Montecarlo,
> matriz de correlaciones y hasta 20 posiciones. Es acceso del dueño a su
> propia herramienta para revisarla, no un atajo comercial: la suscripción
> sigue sin poder contratarse por nadie. `esAdmin()` es pura y está en la
> batería (correo normalizado; ninguna otra cuenta hereda el nivel).

### Paso 37 · Informes genéricos

**Sin firma personal.** Estructura fija para todas las compañías, y las reglas
de redacción de la sección 5 de las bases.

> **Hecho y verificado (19-08-2026).** Bloque **«Informe de compañía»** en la
> página de cartera (`js/nuvia-informe.js`), abierto con la sesión iniciada
> (cuenta gratuita): un buscador solo de acciones y, al elegir una, su
> informe con la **misma plantilla para todas** — Qué es · Tamaño y
> valoración · Cómo gana dinero · Dividendo · Comportamiento en mercado ·
> Riesgos —, construida con UNA llamada a `get_asset_detail`
> (`fundamentals_summary` + `metrics` de la maestra). Reglas de las bases §5
> aplicadas literalmente: solo hechos con su cifra, su fecha y su fuente
> (fundamentales con `as_of_date` y `source`; caída máxima y último precio
> con fecha); el PER adelantado se cita como **estimación del consenso**;
> un dato ausente se muestra como «—» y el informe **declara el recuento**
> de ausencias; y la sección de **Riesgos sale de reglas fijas** iguales
> para todas las compañías (concentración en un valor/sector/país — siempre;
> volatilidad y peor caída del historial; pérdida reciente si el margen neto
> es negativo; BPA negativo explicando el PER ausente; payout > 100 %;
> divisa distinta del euro), así que ninguna empresa recibe riesgos «a
> medida»: simetría garantizada por construcción. Pie fijo: idéntico para
> cualquiera que lo pida, no emite recomendaciones, sin precio objetivo y
> **sin firma**. `check-lenguaje` vigila la superficie nueva y exige esas
> declaraciones; `check-parity` exige el bloque montado.
>
> **Verificado** con la ficha REAL de Telefónica servida por producción
> (fixture en la batería): la plantilla de una ficha vacía es idéntica a la
> de una completa (solo cambian los valores a «—»); pérdida del −9,5 % y
> payout del 111 % en riesgos con su cifra; caída del −76,1 % con su fecha;
> y la **prueba de la sección 5** pasada dos veces — sobre los textos puros
> y sobre el informe renderizado en navegador: cero giros prohibidos
> (mejor/recomend*/óptimo/atractiva/infravalorada/oportunidad…). 18
> comprobaciones de navegador en verde; sin desbordes; suelo de 12 px.
> **Verificado en producción** con cuenta de prueba (creada y suprimida al
> terminar con el borrado del paso 34): el informe REAL de Telefónica salió
> con sus seis secciones, la capitalización, el PER pasado ausente como «—»
> (1 ausencia declarada), la caída del −76,1 %, la pérdida y el payout del
> 111 % en riesgos, y el pie completo; el de Iberdrola salió con LA MISMA
> plantilla; y la criba de giros prohibidos dio cero cruces en ambos.

### Paso 38 · Carteras modelo temáticas

**Publicadas, idénticas para todos, nunca presentadas como adecuadas para
nadie.** Sin botón que las copie a la cartera del usuario ni enlace a
contratarlas: eso cerraría el círculo hacia la recomendación.

> **Hecho y verificado (19-08-2026).** Bloque **«Carteras modelo temáticas»**
> (`js/nuvia-modelos.js`), visible para cualquiera SIN cuenta: cuatro
> composiciones fijas con activos reales del catálogo, verificados uno a uno
> contra `search_assets` en producción antes de fijarlos — «Bolsa mundial
> indexada» (4 indexados globales), «Grandes cotizadas españolas» (IBE, ITX,
> SAN, BBVA, TEF), «Value de gestoras independientes» (Bestinver, Cobas,
> Azvalor, Magallanes) y «Mitad bolsa mundial, mitad bonos en euros». La
> regla es ÚNICA para todas y la vigila `validaModelo` en la batería:
> criterio propio del portal declarado con su **fecha de fijación**
> (19-08-2026), pesos **a partes iguales** que suman 100, ≥3 posiciones,
> sin repetidos. Cada tarjeta enseña tema, criterio, composición y un solo
> control: «Ver sus métricas (historial real)» — `get_price_series` +
> `metricasDesdeSerie` del motor del constructor, con fuente y fecha.
> **No hay botón que copie la composición a la cartera del usuario ni
> enlace para contratarla**, y la nota del bloque lo dice tal cual («es
> una publicación, no es una propuesta»). `check-lenguaje` exige esas
> declaraciones; `check-parity` exige el bloque montado.
>
> **Verificado en navegador** (12 comprobaciones): visibles sin sesión;
> criterio con fecha en cada tarjeta; los ÚNICOS controles del bloque son
> los de ver métricas (ni copiar, ni añadir, ni contratar); métricas con
> sus tres filas y su fuente; la criba de giros prohibidos (incluidos
> «equilibrada» y «prudente», que venden idoneidad) dio cero cruces sobre
> el bloque renderizado; sin desbordes; suelo de 12 px. Batería: la regla
> única pasa en las cuatro; una modelo rota acumula sus problemas uno a
> uno; la prueba de la §5 sobre todos los textos.
>
> **Verificado en producción (19-08-2026).** En
> https://oantiza.github.io/NUVIA-PORTAL-LAB/cartera.html, **sin sesión
> ninguna** (localStorage limpio): el bloque enseña las cuatro tarjetas con
> su criterio y su fecha; los únicos controles son los cuatro «Ver sus
> métricas (historial real)». Al abrir «Bolsa mundial indexada», métricas
> reales de la base NUVIA: rentabilidad 3 años 67,4 %, volatilidad 12,8 %,
> máxima caída −20,3 % (772 observaciones, cierre del 17-08-2026) — y los
> dos productos sin historial suficiente en la base (iShares Core MSCI
> World, Vanguard S&P 500) quedaron **declarados como excluidos del
> cálculo**, tal y como manda la regla de fuentes. La criba de giros
> prohibidos sobre el bloque renderizado en producción: cero cruces. Nota
> de publicación: mientras se preparaba este paso entró en `main` una
> mejora de la sección de impuestos (`005bf6e`, de otra sesión de trabajo);
> el paso se rebasó encima sin tocar un solo fichero en común y `npm run
> validate` volvió a pasar en verde sobre el estado combinado.

---

# Fase 6 · Los gráficos del laboratorio clásico, en el nuevo

**Encargo de Óscar (20-08-2026):** «quiero por lo menos los que había
antes». Los gráficos del laboratorio clásico (la suite del núcleo, hoy
enlazada como «Laboratorio clásico (gráficos)» en la cabecera) se
reconstruyen dentro del laboratorio nuevo, con datos reales de la base y
respetando la tabla de niveles del paso 1. Orden acordado: evolución +
caídas (39), Montecarlo como abanico (40), mapa riesgo/rentabilidad (41),
distribución geográfica con mapa (42).

### Paso 39 · Evolución de la combinación y sus caídas

**Hacer.** En el constructor, para todos los niveles: la línea de la
cartera en base 100 sobre la ventana real de 3 años y, debajo, la curva de
caídas desde máximos. Sin llamadas nuevas: el mismo `get_price_series` que
ya alimenta las métricas.

> **Hecho y verificado (20-08-2026).** `puntosEvolucion(niveles, fechas)`
> (rebase a 100; null si fechas y niveles no casan o hay menos de dos
> puntos válidos) y `trazadoLinea(valores, escala)` (camino SVG puro; los
> huecos no numéricos se saltan sin cortar) en `js/nuvia-constructor.js`,
> ambos en la batería. `grupoEvolucion` pinta los dos paneles SVG con los
> tokens del sistema (línea `--nv-green-700`, caídas `--nv-bronze-700` con
> área al 14 %), referencia punteada en 100, etiquetas de eje que no se
> pisan cuando el mínimo queda pegado a 100, las dos fechas de la ventana
> y `aria-label` descriptivo por panel. Textos honestos: «Describe lo
> ocurrido, no lo que viene» y «El cero es estar en máximos». La fuente
> del bloque (fecha de cierre, base NUVIA, observaciones) cubre también
> estos paneles. **Verificado en navegador** (14 comprobaciones): los dos
> paneles aparecen al montar la combinación; la línea lleva los ~300
> puntos reales; el área de caídas cerrada; criba §5 con cero cruces
> sobre el bloque renderizado; sin desbordes a 1440/1024/390; suelo de
> 12 px; sin errores de consola.
>
> **Verificado en producción (20-08-2026).** En la página publicada, con
> Iberdrola en el constructor: la línea con **766 observaciones reales**
> de la base (ventana 17-08-2023 → 19-08-2026), de 100 a 229 —la misma
> rentabilidad del 110,3 % que declara la tabla—, la referencia punteada
> en 100 y el panel de caídas llegando al −12 %, que casa con la máxima
> caída de la tabla (−12,2 %, punto más bajo 03-10-2023). La sesión del
> administrador enseñó a la vez el análisis completo y el tope de 20
> posiciones: el acceso del dueño funciona también en producción.

### Paso 40 · La proyección Montecarlo como abanico

**Hacer.** En el análisis del nivel completo, la simulación deja de ser
solo tabla: banda del percentil 5 al 95 con la mediana dibujada, año 0
anclado en la base. La tabla honesta sigue debajo.

> **Hecho y verificado (20-08-2026).** `puntosAbanico(proyeccion)` (pura,
> en la batería: año 0 en la base, una senda por percentil, p5 ≤ mediana
> ≤ p95 en todos los años) y el abanico SVG dentro de `grupoProyeccion`:
> banda `--nv-green-700` al 14 %, mediana en trazo, referencia punteada
> en la base, etiquetas «Percentil 95/Mediana/Percentil 5» con su cifra
> final, ejes en años y `aria-label` con los tres finales. La tabla y el
> texto «no es una previsión» siguen debajo, intactos.

### Paso 41 · Mapa riesgo/rentabilidad

**Hacer.** Cada activo del cálculo como punto (volatilidad, rentabilidad
anualizada del historial real) y la cartera marcada. Nivel registrado.

> **Hecho y verificado (20-08-2026).** `puntosMapaRiesgo(series, pesos)`
> (pura, en la batería: métricas por activo con `metricasDesdeSerie`, el
> activo sin historial queda declarado y fuera, el activo sin peso no
> entra) y `grupoMapaRiesgo`: dispersión SVG con etiqueta por punto (con
> recorte y ancla para no salirse), la cartera con el punto marcado de la
> frontera y el rótulo «Tu combinación», ejes con sus rangos y la nota
> «Describe el historial, no el futuro». Se pinta tras la frontera para
> el registrado y el suscriptor.

### Paso 42 · Distribución geográfica con mapa

**Hacer.** El mapa de continentes del laboratorio clásico, con los datos
reales de `concentracionGeografica` y la cifra siempre al lado del color.
Nivel registrado.

> **Hecho y verificado (20-08-2026).** `js/nuvia-mapa.js` +
> `js/nuvia-mapa-siluetas.js`: las siluetas del clásico recuperadas del
> bundle del núcleo, **con una corrección de datos**: el trazado que allí
> se llamaba «africa» mezclaba África con EE. UU., Alaska y Groenlandia
> (el clásico coloreaba EE. UU. con el tono de Europa); los subtrazados
> occidentales o árticos se reasignaron a América y ahora cada continente
> lleva su color. `REGIONES_CONTINENTE` traduce las regiones de la
> concentración a continentes, `exposicionPorContinente` agrega (la
> región desconocida se declara «fuera del mapa», nunca se pierde en
> silencio) y `tramoDeColor` da la escala de 5 tramos verdes del sistema.
> Leyenda con la cifra de cada continente al lado del color y nota que
> describe sin prescribir («describe dónde está hoy ese dinero, nada
> más»); `check-lenguaje` vigila el módulo y su batería propia
> (`nuvia-mapa.test.mjs`) cubre agregación, escala, siluetas y §5. El
> mapa va justo encima de la tabla de regiones, que sigue siendo la
> cifra fina.
>
> **Verificado en navegador (pasos 40–42 juntos, 17 comprobaciones):**
> con sesión del nivel completo y dos fondos con desglose regional, el
> abanico con su banda cerrada y sus once puntos de mediana; el mapa
> riesgo/rentabilidad con un punto por activo y la cartera marcada; el
> mapa de continentes con sus cinco siluetas y la leyenda con cifras
> (Europa > América > Asia con el desglose de la prueba); criba §5 a
> cero sobre todo el bloque; sin desbordes; suelo de 12 px; sin errores
> de consola.
>
> **Publicado en producción (20-08-2026, `1450c37`).** Los tres módulos
> servidos y comprobados en la web publicada (`nuvia-mapa.js`,
> `nuvia-mapa-siluetas.js` y el `nuvia-analisis.js` con abanico y mapa
> riesgo). El repaso visual en el navegador de producción quedó para la
> siguiente sesión con Chrome abierto: en el momento de publicar estaba
> cerrado, y no se da por visto lo que no se ha visto. Nota de
> publicación: `origin/main` se movió dos veces durante el paso (React
> autoalojado y auditoría de consola, de otra sesión); ambos rebases
> limpios y `npm run validate` en verde sobre el estado combinado.

---

# Transversal

## Antes de publicar cualquier cosa

1. `npm run validate` en verde.
2. Contraste medido, no estimado.
3. Sin desbordes en los tres anchos.
4. El texto pasa la prueba de la sección 5 de las bases.
5. Fuentes y fecha visibles.

## Al terminar cada sesión de trabajo

**Actualizar las bases si algo ha cambiado.** Es el documento que manda. Si se
queda atrás mientras el código avanza, se repite exactamente el problema de la
guía de OAA: un documento que parece vigente por su fecha y describe algo que ya
no existe.

## Riesgos conocidos

| Riesgo | Mitigación |
|---|---|
| Deriva hacia el asesoramiento | Revisar el lenguaje en cada entrega (paso 25) |
| Datos desactualizados sin avisar | Fecha visible en cada vista |
| El catálogo se sesga sin querer | Criterio propio documentado (paso 6) |
| Las bases se quedan atrás | Actualizarlas al cerrar cada fase |
| Confiar en un cálculo sin verificar | Batería de pruebas (paso 17) |

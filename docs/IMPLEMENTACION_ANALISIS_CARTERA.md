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

**Entrada:** `docs/nuvia-cartera.js`, constante `CLASES`.

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

**Entrada:** `docs/nuvia-cartera.js` y el fichero de datos de la fase 1.

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

### Paso 14 · Concentración sectorial y geográfica

**Hacer.** Agregar los pesos por sector y por país, con look-through en fondos:
un fondo global no es «internacional», son sus posiciones repartidas.

**Verificación.** Una cartera de cuatro bancos españoles debe salir ~100 %
financiero y ~100 % España. Si sale repartida, el look-through no funciona.

### Paso 15 · Frontera y Monte Carlo sobre activos reales

**Hacer.** Adaptar `frontera()` para que opere sobre las posiciones reales del
usuario en vez de sobre las cuatro clases.

**Verificación.** La frontera debe ser monótona creciente en rentabilidad. Y con
activos muy correlacionados debe ser mucho más plana que con una cartera
diversificada: si no, las correlaciones no están entrando.

### Paso 16 · Métricas de la tabla del visitante

**Hacer.** Rentabilidad a 3 años, volatilidad, **máxima caída** (peor caída de
pico a valle en el periodo). Esta última es la más intuitiva para un particular
y no está aún en el módulo.

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

---

# FASE 3 · Nivel de visitante

El más importante. Si no engancha, no hay registro ni suscripción.

### Paso 18 · Estructura de la página

**Hacer.** Sustituir el iframe actual de `cartera.html` por la sección propia.
Mantener el héroe existente, que ya está bien y usa la identidad de NUVIA.

**Verificación.** La página renderiza **sin JavaScript** (principio del portal).
El simulador puede requerirlo; la página, no.

### Paso 19 · Buscador de activos

**Hacer.** Campo único que busque por nombre, ticker o ISIN sobre el catálogo
completo. Visible y usable para todos desde el primer momento.

**Verificación.** Escribir «telefonica» sin tilde debe encontrarlo. Escribir un
ISIN completo, también.

### Paso 20 · Construcción de la cartera

**Hacer.** Añadir hasta 5 posiciones con su peso. Los pesos deben normalizarse a
100 % automáticamente y verse cómo cambian al mover uno.

**Verificación.** Mover un peso debe recalcular todo **al instante**, sin botón
de «calcular». Esa inmediatez es lo que engancha.

### Paso 21 · El límite, comunicado antes

**Hacer.** Al llegar a 5 posiciones, decir por qué y qué se gana registrándose.
Nunca dejar montar y bloquear al final (bases, sección 3).

### Paso 22 · Tabla de métricas

**Hacer.** Rentabilidad, volatilidad, máxima caída. **Cada cifra con su lectura
en lenguaje llano**, no solo el número.

> Ejemplo del tono: «Volatilidad 12,4 % — en un año normal, el valor de esta
> cartera puede moverse arriba o abajo alrededor de un 12 %.»

### Paso 23 · Reparto por clase de activo

**Hacer.** Un gráfico. Uno solo, y que enseñe una idea (bases, sección 4).

### Paso 24 · Guardado local

**Hacer.** Hasta 3–4 carteras en el navegador. **Avisar de que se pierden** al
limpiar datos y de que no hay continuidad entre dispositivos.

**Verificación.** Abrir en incógnito: no debe verse nada de la sesión anterior,
y el aviso debe ser comprensible sin conocer cómo funciona un navegador.

### Paso 25 · Revisión del lenguaje, una etiqueta a una

**El paso que más se salta y más consecuencias tiene.**

**Hacer.** Repasar cada título, etiqueta, tooltip y texto de métrica contra la
sección 2 de las bases. Buscar y eliminar: «mejor», «recomendado», «óptimo»,
«conviene», «deberías», «ideal para».

**Verificación.** Leer la pantalla entera y preguntarse: *¿de esto se deduce qué
debería hacer alguien con su dinero?* Si sí, reescribir.

### Paso 26 · Nota al pie con fuentes

**Hacer.** En cada vista con datos: origen y fecha. En el simulador, la fuente
es la maestra: «Datos de cierre del [fecha], base de datos NUVIA.» No citar
EODHD aquí: esa atribución corresponde a Análisis y valoración de empresas,
la única vista que lo consulta. Mezclar las dos rutas de datos en la misma
nota confundiría al usuario sobre de dónde sale cada cifra.

### Paso 27 · Verificación final del nivel

**Hacer, sin excepciones:**

- Contraste AA en todo, medido —no estimado. Ojo con fondos en degradado: hay
  que leer píxeles, no `background-color`.
- Suelo tipográfico de 12 px.
- Sin desbordes horizontales a 1440, 1024 y 390 px.
- Sin errores de consola.
- Jerarquía de encabezados sin saltos.
- `npm run validate` en verde.

---

# FASE 4 · Cuentas y niveles

**Antes de empezar: revisión jurídica.** Bases, «Pendiente de validación
jurídica». No es un trámite posterior.

### Paso 28 · Registro con datos mínimos

**Hacer.** Correo y contraseña, o proveedor externo. Nada más. Sin teléfono, sin
patrimonio, sin perfil de riesgo — eso último se parecería a un test de
idoneidad, que es exactamente lo que la norma regula.

### Paso 29 · Consentimiento granular

**Hacer.** Separar: cuenta y persistencia (necesario) de comunicaciones
(opcional) y de análisis de comportamiento (opcional y explicado). Revocable
desde el perfil.

### Paso 30 · Persistencia en la nube

**Hacer.** Guardar solo lo mínimo: identificador de activos y pesos. Ni el
cálculo ni los resultados: se recalculan al abrir.

### Paso 31 · Migración desde local

**Hacer.** Al registrarse, si hay carteras locales, ofrecer migrarlas.
**Con permiso explícito, nunca en silencio.**

### Paso 32 · Análisis del nivel registrado

**Hacer.** Los desbloqueados en el paso 1: concentración, ahorro por
diversificar, solapamiento.

### Paso 33 · Análisis del nivel suscriptor

**Hacer.** Frontera, Monte Carlo, correlaciones, y 20 posiciones.

### Paso 34 · Derechos RGPD operativos

**Hacer.** Acceso, rectificación, supresión y portabilidad, funcionando desde el
primer usuario. No «cuando haya volumen».

**Verificación.** Crear una cuenta de prueba, usarla, y ejercer los cuatro
derechos. Si alguno requiere intervención manual por correo, no está operativo.

---

# FASE 5 · Suscripción

### Paso 35 · Pasarela de pago y facturación
### Paso 36 · Extras de pago por uso

**Criterio de las bases:** se cobra aparte lo que se percibe como extra desde el
principio, no un trozo del análisis que se le ha quitado. **No cobrar por
cálculos ya precalculados.**

### Paso 37 · Informes genéricos

**Sin firma personal.** Estructura fija para todas las compañías, y las reglas
de redacción de la sección 5 de las bases.

### Paso 38 · Carteras modelo temáticas

**Publicadas, idénticas para todos, nunca presentadas como adecuadas para
nadie.** Sin botón que las copie a la cartera del usuario ni enlace a
contratarlas: eso cerraría el círculo hacia la recomendación.

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

# Bases de la sección de análisis de cartera

**Estado:** consolidado en lo esencial · 18 de agosto de 2026
**Alcance:** la sección de análisis de cartera del portal NUVIA
(`cartera.html`), incluidas sus dos vistas: el simulador de carteras y el
análisis fundamental y técnico de compañías.

> **Este es el documento que manda.** Cualquier resumen, presentación o
> planteamiento que se derive de él —como el HTML de notas para socios— es una
> foto de un momento. Si algo cambia, se cambia **aquí primero**. No repetir el
> error de la guía de OAA, que se arrastró meses sin reflejar lo construido.

Los cuatro puntales —**qué es la sección** (1), **cumplimiento** (2), **modelo
de niveles** (3) e **informes** (5)— están definidos y no se esperan cambios de
fondo. Queda abierto a añadidos y matices, no a reescritura.

Este documento fija los criterios que gobiernan la sección. Se escribe en el
repositorio, no en una conversación, y se actualiza cuando algo cambie: una guía
que se arrastra sin reflejar lo construido no sirve de nada.

Distinguir siempre **principio** de **decisión**. Un principio dura y explica el
porqué; una decisión concreta se revisa. Los principios van en las secciones 1 a
5; las decisiones tomadas, en la 6; lo que queda abierto, en la 8.

---

## 1. Qué es esta sección y qué no es

**Es una herramienta educativa y de exploración.** El usuario construye
carteras, juega con ellas y entiende cómo se comportan: qué aporta diversificar,
qué relación hay entre riesgo y rentabilidad, cómo se reparte geográfica y
sectorialmente lo que tiene.

### El problema que resuelve

Un particular con dinero en cuatro bancos **no tiene forma de ver su patrimonio
entero**. Cada entidad le enseña solo su parte y, por interés comercial, le
sugiere que lo de al lado es peor. Sin la visión de conjunto no puede saber si
está concentrado, si repite apuestas o cuánto riesgo asume de verdad.

Dos ejemplos de lo que sí puede ver aquí y en ningún otro sitio:

- **Consolidación.** Sus posiciones de los cuatro bancos, juntas, medidas con el
  mismo criterio.
- **Solapamiento.** Dos ETF de inteligencia artificial de gestoras distintas
  pueden llevar dentro casi los mismos valores. Cree que diversifica y está
  doblando la misma apuesta. Es frecuente y nadie se lo dice.

**El objetivo último es que aprenda a gestionar su propio dinero**, apoyado en
Academia NUVIA y en el resto de secciones. Le damos herramientas que hoy no
tiene, no decisiones tomadas.

> Y esto encaja con el cumplimiento sin esfuerzo: **no hace falta opinar**.
> Mostrarle que sus dos ETF comparten el 78 % de sus posiciones es un dato
> calculado. La conclusión la saca él.

**No es una herramienta de gestión ni de asesoramiento.** No analiza el
patrimonio real de nadie con criterio profesional y no dice a nadie qué comprar.

**El usuario es un particular, no un profesional.** No es un asesor con el
cliente delante: es alguien que entra a informarse. Eso condiciona el lenguaje,
cuántas métricas caben en pantalla, qué se explica y qué se da por sabido.

**Que enganche es un objetivo explícito.** La herramienta debe invitar a probar,
mover pesos y volver. El dinamismo es parte del valor.

**La independencia es parte del producto, no un adorno.** Es *la* propuesta de
valor: NUVIA es el único sitio sin interés comercial en lo que el usuario tenga.
Todo banco que le enseña sus posiciones tiene algo que venderle; aquí no. Aceptar
patrocinio de una entidad destruiría el argumento central de la sección.

Consecuencias prácticas: sin publicidad de entidades de partida, sin comisiones
por producto, y el catálogo se construye por criterio propio y no por quién lo
aporta. Se pueden citar informes públicos de bancos como fuente —son públicos—,
pero nada más.

> Es también la decisión reversible: aceptar publicidad más adelante es fácil;
> retirarse de una asociación ya establecida, no.

> Con una condición que no se negocia: **el usuario nunca debe confundir el
> simulador con un plan de inversión**. Si alguien ajusta pesos hasta que la
> frontera le sale bonita y cree que eso es su estrategia, el diseño ha fallado.
> Se resuelve con encuadre y lenguaje, no renunciando al dinamismo.

> La plataforma OAA (`oantiza/BDB-ACTIVOS`) es una herramienta profesional para
> banca privada, con otro público y otro sistema de diseño. Se usa como
> **cantera de cálculos y de datos**, nunca como modelo de interfaz.

---

## 2. Cumplimiento normativo

**Restricción de diseño, no aviso legal a pie de página.** Si una pantalla solo
cumple porque lleva un descargo debajo, está mal diseñada.

### MiFID II

La norma define asesoramiento como **recomendación personalizada sobre una
operación concreta con un instrumento concreto**. Los tres elementos tienen que
darse a la vez. De ahí se derivan las reglas siguientes.

- **Cero recomendaciones personalizadas.** Ni directas ni implícitas.
- **El usuario elige, nosotros calculamos.** Que introduzca los valores que
  quiera y la herramienta los analice no es asesoramiento: es una calculadora.
  La línea se cruzaría si nosotros sugiriéramos qué meter.
- **Carteras modelo, no propuestas.** Se publican carteras temáticas elaboradas
  previamente, idénticas para todo el que llegue a ellas. El sistema puede
  dirigir a un usuario hacia una sección temática por su interés demostrado,
  nunca presentar una cartera como adecuada para él. El usuario ve y decide.
- **Se personaliza el interés temático, nunca la conveniencia de operar.** El
  contenido dirigido es el mismo para todo usuario que muestre ese interés y no
  incorpora juicio sobre comprar, vender o mantener.
- **El lenguaje sostiene la distinción.** «Cartera modelo tecnológica» funciona;
  «cartera recomendada para ti» no, aunque sea el mismo contenido.
- **La navegación tampoco cierra el círculo.** Mostrar una cartera modelo es
  información; poner al lado un botón que la copie a la cartera del usuario o
  enlace a contratarla, ya no.
- **Nada de perfilado que parezca test de idoneidad.** Preguntar por horizonte,
  patrimonio o tolerancia al riesgo y devolver una cartera concreta es la
  mecánica que la norma regula, aunque se llame simulador.
- **Los supuestos, visibles.** Las estimaciones son estimaciones y el usuario
  tiene que poder verlas. Rentabilidades pasadas no garantizan futuras.
- **El principio general se puede afirmar; el juicio sobre la cartera concreta,
  no.** «La diversificación reduce el riesgo específico» es teoría financiera y
  se enseña en Academia. «Esta cartera concentra el 75 % en un sector» es un
  hecho medible y también se dice. «Esta cartera es mejor» ya juzga, porque
  *mejor* implica *para usted*.
- **Se muestra la métrica y se explica qué significa; la conclusión la saca el
  usuario.** Es el mecanismo que hace la sección educativa sin ser asesoramiento,
  y funciona igual con la concentración, el solapamiento o el ahorro por
  diversificar.
- **Advertir de un riesgo describiéndolo es obligatorio; convertirlo en consejo,
  no.** «El 60 % de sus ingresos viene de un solo cliente» es un hecho. «No es
  adecuado para un perfil conservador» juzga, y además introduce el perfil del
  lector, que es lo que define la personalización.
- **La norma no distingue dirección.** Recomendar no comprar es tan
  recomendación como recomendar comprar: la definición cubre comprar, vender *o
  mantener*.

### Garantía por arquitectura

**El motor de contenido no accede a las posiciones del usuario**, solo a
categorías de interés. Así la separación entre información dirigida y
recomendación personalizada queda garantizada por diseño y no por disciplina.

### Protección de datos (RGPD/LOPDGDD)

- **Minimización.** No pedir dato que no haga falta.
- El nivel de visitante funciona **sin recoger ningún dato personal**.
- **El cálculo ocurre siempre en el navegador.** Lo que viaja al servidor es el
  resultado guardado, nunca el motor ni la cartera en curso.
- Consentimiento explícito, granular y revocable para lo que exceda de eso.
- Derechos de acceso, rectificación, supresión y portabilidad operativos desde
  el primer día.
- **El seguimiento de comportamiento es elaboración de perfil.** Registrar con
  qué activos trabaja cada usuario exige base jurídica explícita, información
  clara y derecho de oposición. Es hacible, pero se diseña así desde el inicio.

### Pendiente de validación jurídica

Este documento lo redacta un equipo técnico, no un jurista. Antes de publicar
con registro, pago y contenido dirigido hay que revisar al menos: la frontera
exacta del contenido personalizado, las obligaciones de información publicitaria
de productos financieros, la normativa de consumo y contratación a distancia, y
los requisitos fiscales del nivel de pago.

> **Validada (19-08-2026).** Óscar dio por validada esta revisión jurídica y
> autorizó el arranque de la Fase 4 («sigue, está validado»). Con ello se abre
> el registro (paso 28). La validación de los supuestos del simulador (§8)
> sigue pendiente y es un encargo distinto.

---

## 3. Modelo de tres niveles

| | **Visitante** | **Registrado** | **Suscriptor** |
|---|---|---|---|
| Acceso | sin registro | cuenta gratuita | de pago |
| Datos personales | ninguno | los mínimos | los mínimos + facturación |
| Persistencia | local, en su navegador | en la nube | en la nube |
| Activos por cartera | 5 | 5 | 20 |
| Carteras | 3–4 | sin tope | sin tope |
| Análisis | básico: tabla de métricas y algún gráfico | ampliado | completo |

**El catálogo completo es visible para todos.** Los ~1.200 activos (500 fondos,
500 acciones, ETF) se pueden buscar desde el primer momento: el visitante
percibe la amplitud de lo que hay detrás aunque no pueda usarlo todo.

**La progresión va por profundidad de análisis, no por capacidad.** Registrado y
visitante manejan las mismas 5 posiciones; lo que cambia es cuánto ven. Ese es
el incentivo real para registrarse.

**Por qué 20 y no más.** El límite no es técnico: 20 activos son 190 pares de
correlación y un Monte Carlo de 4.000 iteraciones se resuelve en milisegundos en
el navegador. Es que **por encima de 15–20 posiciones los gráficos dejan de
comunicar**: una distribución sectorial con 25 porciones es ilegible y la nube de
la frontera se vuelve un borrón. Subir el límite después es trivial; bajarlo, no.

**El tope de pruebas del visitante es un freno, no una barrera.** Vive en el
navegador y se reinicia borrando datos o en incógnito. Se diseña sabiéndolo: no
se invierte en detección agresiva, que además chocaría con el principio de no
recoger ningún dato del visitante.

**Principios de la progresión:**

- **Cada nivel vale por sí mismo.** El gratuito no es una demo mutilada: enseña
  algo de verdad. Si no aporta valor, el visitante se va antes de registrarse.
- **El salto se ve y se entiende.** El usuario sabe qué gana al subir de nivel,
  sin descubrirlo por prueba y error.
- **El límite se comunica antes, no después.** Nada de dejar montar algo y
  bloquearlo al final.
- **Ningún nivel degrada el rigor.** Cambia la cantidad de análisis, nunca la
  calidad ni la honestidad de las cifras.

---

## 4. Diseño e identidad

- **La identidad es la de NUVIA**: `nuvia-tokens.css` y `nuvia-components.css`.
  Azul marino y verde, Fraunces para titulares, suelo tipográfico de 12 px,
  contraste AA sin excepciones.
- **Un gráfico enseña una idea.** Se prioriza la comprensión sobre la densidad.
- **Los cálculos se extraen de la plataforma y se simplifican, nunca se
  reinventan.** Así las cifras del portal son coherentes con el trabajo
  profesional que hay detrás. Cuando algo se aparta del original, se documenta.
- **Explicar el porqué, no solo el cuánto.** Cada cifra relevante lleva una
  lectura en lenguaje llano.
- **Cero jerga sin traducir.**

---

## 5. Informes y análisis de compañías

**Alcance:** aplica también a la sección de análisis fundamental y técnico
(`cartera.html?vista=companies`), no solo al simulador de cartera.

Además de la información en pantalla, el usuario puede obtener un **informe
genérico** sobre una compañía. Bajo ningún concepto como recomendación de
inversión, y **sin firma personal**: el responsable del portal trabaja para una
entidad financiera y firmar análisis la arrastraría, con implicaciones de
conflicto de interés. Es una restricción, no una preferencia.

### La pregunta difícil: cómo decir que una compañía es buena

Es la parte más delicada del proyecto. La respuesta no es evitar el juicio, sino
cambiar su naturaleza: **se describe la empresa, no se prescribe la operación.**

**Se puede afirmar un hecho verificable.**
«El margen operativo ha crecido del 12 % al 18 % en cinco años.»
«La deuda neta equivale a 1,2 veces el EBITDA, por debajo de la media del sector.»
Son datos comprobables. Cualquiera con las cuentas llega a lo mismo.

**Se puede caracterizar el negocio.**
«Es una compañía con ingresos recurrentes y baja intensidad de capital.»
Describe el modelo de negocio, no aconseja nada.

**Se puede situar en su contexto.**
«Cotiza a 13 veces beneficios, frente a una media sectorial de 17.»
El dato relativo es información; la conclusión la saca el lector.

**Se pueden explicar los riesgos.** De hecho, se deben. Un informe que solo
cuenta lo favorable no es genérico, es promocional.

**No se puede juzgar la conveniencia de operar.**
«Atractiva a estos precios», «buena oportunidad», «infravalorada», «momento de
entrar», «recomendamos», «nuestro precio objetivo». Todo eso es recomendación.
La palabra clave no es *buena*: es *para usted, ahora*.

### Reglas de redacción

- **Cero verbos de acción.** Comprar, vender, entrar, salir, aprovechar,
  posicionarse. Ni en condicional.
- **Cero precio objetivo propio.** Se puede citar el consenso de analistas como
  dato de mercado, atribuido y fechado. No se genera uno.
- **Cero comparativa que ordene.** «Las mejores del sector» ordena por
  conveniencia. «Las de mayor margen del sector» ordena por un dato.
- **Simetría obligatoria.** Fortalezas y riesgos, siempre. Si un apartado no
  tiene contrapeso, falta trabajo.
- **Mismo informe para todos.** Idéntico para cualquiera que lo pida. En cuanto
  varía según quién lo consulta, es personalizado.
- **Estructura fija.** Mismo esqueleto para todas las compañías: qué hace, cómo
  gana dinero, cifras, situación financiera, contexto sectorial, riesgos. Una
  plantilla constante es en sí misma una garantía de no selección interesada.
- **Fuente y fecha en cada dato.** Un dato sin fechar envejece a recomendación.

### Prueba antes de publicar

Leer el informe y preguntarse: **¿de este texto se deduce qué debería hacer un
lector concreto con su dinero?** Si la respuesta es sí, hay que reescribirlo,
aunque cada frase por separado sea un hecho cierto. El conjunto también comunica.

---

## 6. Decisiones tomadas

**Persistencia.** Visitante: almacenamiento local del navegador, sin cuenta ni
dato personal; hay que advertirle de que se pierde al limpiar el navegador y de
que no hay continuidad entre dispositivos. Registrado y suscriptor: en la nube,
ligado a su cuenta. La persistencia real es una de las razones para registrarse.

**Migración al registrarse.** Si un visitante con simulaciones locales crea
cuenta, se le ofrece migrarlas con permiso explícito. Nunca en silencio.

**El usuario introduce valores concretos.** Telefónica, BBVA, un fondo. No solo
clases de activo. Es lo que hace la herramienta interesante y no compromete el
cumplimiento, porque elige él.

**Origen de los datos de mercado — decisión revisada.** Se reutiliza
**`bbdd-activos-financieros`**, la base de datos maestra de la plataforma
profesional (Firestore, alimentada por EODHD y otras fuentes en `functions_python`
de `oantiza/BDB-ACTIVOS`). Ya tiene ~1.200 activos con volatilidades y
fundamentales calculados. No se monta un proceso propio de descarga y cálculo.

> **EODHD solo se toca en Análisis y valoración de empresas** (la aplicación
> ya existente, `company-analysis/`, que muestra la atribución «vía EODHD»).
> El simulador de cartera de esta sección **no llama a EODHD en ningún punto**,
> ni directo ni a través de un proceso propio: todo pasa por las Cloud
> Functions de solo lectura de `bbdd-activos-financieros`, que ya trae los
> datos calculados. Son dos rutas de datos distintas dentro del mismo proyecto
> Firebase; no confundirlas al implementar.

**De solo consulta. Sin excepción.** El portal no escribe en `bbdd-activos-financieros`
bajo ningún concepto. Las propias reglas de Firestore ya lo garantizan por
diseño: `assets/` tiene `allow read, write: if false` para el cliente; el único
acceso es vía Cloud Functions con Admin SDK. El portal consumirá esas mismas
Cloud Functions —`search_assets`, `get_asset_detail`, `get_asset_holdings`,
`get_price_series`—, nunca Firestore directo.

**Una base de datos aparte, más adelante, para lo que sí escribe el portal**
—carteras guardadas, cuentas, datos de clientes—. Eso no toca la maestra. Se
abrirá cuando haga falta (fase 4); no antes.

**Acceso del visitante: Firebase Anonymous Auth.** Las Cloud Functions exigen
`request.auth != null` con límite de 120 llamadas/minuto por UID. Con Anonymous
Auth, cada visitante obtiene un UID al cargar la página y cae en ese sistema tal
cual está, sin tocar una sola línea del código profesional. Se descarta una
«autorización del programa» (clave compartida, App Check en solitario): exigiría
modificar las Cloud Functions del proyecto profesional para un problema que
Anonymous Auth ya resuelve sin tocarlas.

> **Beneficio no buscado.** Firebase permite vincular una cuenta anónima a una
> cuenta real al registrarse, conservando el mismo UID. Resuelve casi solo la
> migración de local a nube de la que ya hablan estas bases: no hace falta un
> proceso de migración a mano.

**Consecuencia que hay que asumir con los ojos abiertos.** Esto cambia el
principio de «sin backend por usuario» que regía cuando la fuente era EODHD
propio: ya no es servir un fichero estático, es una llamada real a Cloud
Functions por cada búsqueda. Tiene coste por invocación —pequeño, pero real y no
gratuito a escala—. Es un cambio de arquitectura, no un matiz.

> **Pendiente de verificar antes de implementar.** Ninguna de las Cloud
> Functions existentes sirve la matriz de correlaciones entre pares, que sigue
> siendo necesaria para que la frontera eficiente sea creíble con valores
> concretos (ver limitación conocida, sección 7). Si hace falta una función
> nueva, eso **sí es escribir código en el repositorio de la plataforma
> profesional** —no es "solo consulta"— y es una decisión distinta, que requiere
> acuerdo explícito antes de tocar ese código.

**Datos de cierre, no en vivo,** salvo que una Cloud Function ya sirva otra cosa:
en fondos el valor liquidativo es diario y «en vivo» no aporta al propósito
educativo de la sección.

**Catálogo.** ~1.200 activos ya existentes en `bbdd-activos-financieros`: fondos,
acciones y ETF. No lo construye el portal; lo consulta. Sigue aplicando la
restricción de las bases, sección 1: el catálogo visible al usuario se filtra
por criterio propio, no por lo que la maestra tenga volcado.

**Análisis previstos.** Consolidación de posiciones de varias entidades,
**solapamiento entre fondos y ETF**, concentración sectorial y geográfica,
frontera eficiente, simulación de Monte Carlo, y métricas de riesgo y
rentabilidad.

> **El solapamiento es prioritario**, no un extra. Es el ejemplo más claro de
> algo que el usuario no puede ver en ningún otro sitio y que le afecta de
> verdad. La plataforma ya lo calcula en `src/core/overlap.ts`; hay que portarlo
> resolviendo sus dependencias de tipos.

---

## 7. Estado técnico

**Ya hecho:** módulo de cálculo `js/nuvia-cartera.js`, extraído de
`src/core/portfolioRiskModel.ts`, `quantConfig.ts` y `frontier.ts` de la
plataforma. Funciones puras: volatilidad con matriz de correlaciones,
rentabilidad esperada, Sharpe, frontera por Monte Carlo y **ahorro por
diversificar** (cálculo propio del portal). Batería de verificación en
`nuvia-cartera.test.mjs` (`node docs/nuvia-cartera.test.mjs`).

**También hecho — solapamiento y look-through (paso 13, 19-08-2026):**
`nuvia-solapamiento.js`, portado de `src/core/overlap.ts` y
`holdingsLookthrough.ts` sin tocar el repositorio profesional. Funciones
puras: los desgloses llegan ya descargados de `get_asset_holdings`. Batería
en `nuvia-solapamiento.test.mjs`; contrastado con carteras reales de ETF
(mismo índice 95,5 %, sectores disjuntos 0 %).

**También hecho — concentración sectorial y geográfica (paso 14, 19-08-2026):**
`nuvia-concentracion.js`, portado de `equitySectors.ts` y `equityRegions.ts`.
Agrega las distribuciones por activo de la maestra (`exposure_detail`)
ponderadas por exposición a renta variable, con la calidad del dato declarada
(`lookthrough`/`mixed`/`estimated`) — un estimado se enseña como estimado.
Batería en `nuvia-concentracion.test.mjs` (cuatro bancos españoles → 100 %
financiero y 100 % España).

**También hecho — frontera sobre activos reales (paso 15, 19-08-2026):**
`frontera()` opera ya sobre posiciones reales (σ y ρ de la matriz del paso
12), mantiene intacto el modo por clases del visitante, sale monótona
creciente y, si faltan datos, devuelve el motivo en `sinDatos` en vez de
calcular con cifras inventadas.

**Fase 2 cerrada (pasos 16 y 17, 19-08-2026).** `metricasDesdeSerie()` añade
las métricas de la tabla del visitante —rentabilidad, volatilidad y máxima
caída, con `serieDeCaidas()` portada de `underwater.ts`— y la batería entera
(58 comprobaciones) corre con `npm run test:analisis`, integrada en
`npm run validate`. El motor de cálculo del portal queda completo a falta
del Monte Carlo de proyección (nivel suscriptor, fase 4).

**Análisis del nivel registrado (paso 32, 19-08-2026).** Con la sesión
iniciada, el constructor añade «Análisis ampliado (tu cuenta)»: ahorro por
diversificar sobre el historial real (σ frente a σ con ρ=1, correlaciones de
Pearson), concentración sectorial y geográfica con la calidad del dato
declarada (fichas de `get_asset_detail` a los módulos del paso 14) y matriz
de solapamiento entre fondos/ETF (`get_asset_holdings_batch` al módulo del
paso 13). Todo en el navegador, con `js/nuvia-analisis.js` orquestando; sin
sesión, una sola línea descriptiva. Cuando falta un dato se declara; nunca se
inventa. `check-lenguaje` cubre la superficie.

**Migración desde local (paso 31, 19-08-2026).** Al registrarse, si el
navegador guarda carteras del nivel visitante, la cuenta ofrece subirlas —con
un botón, nunca en silencio— y, tras confirmar cada subida, las retira del
navegador (mudanza, no copia doble). Se sube lo mismo que todo: identificadores
y pesos. Mapa puro `carterasLocalesParaNube` en `nuvia-constructor.js`. Los
consentimientos no se migran: ya se guardan bajo el correo de la cuenta.

**Persistencia en la nube (paso 30, 19-08-2026).** Con la sesión iniciada, el
constructor guarda las carteras en la cuenta (callable app-owned aisladas por
UID) en vez de en el navegador. Se guarda solo el mínimo —`asset_id` y
`weight_percent`—; ni cálculo ni resultados, que se rehacen al abrir con
`get_asset_detail` y `get_price_series`. Así el dato guardado nunca queda
viejo. Sin tope de carteras en el nivel gratuito. `nuvia-datos.js`
(guarda/lista/lee/borraCarteraNube, detalleActivo) + mapas puros en
`nuvia-constructor.js`; el guardado local (paso 24) sigue para quien no ha
iniciado sesión. La migración de lo local a la cuenta llega en el paso 31, con
permiso explícito.

**Consentimiento granular (paso 29, 19-08-2026).** El bloque «Tu cuenta»
separa lo necesario (cuenta y guardado, sin casilla y explicado) de lo
opcional (comunicaciones y análisis de uso). Lo opcional es opt-in de verdad:
apagado hasta que alguien lo encienda, con el porqué delante de la casilla, y
revocable al instante; cada decisión se apunta con fecha y el silencio nunca
cuenta como sí. El análisis de uso se nombra como elaboración de perfil y
declara que, apagado, no registra nada. `js/nuvia-cuenta.js`
(`CONSENTIMIENTOS`, `leeConsentimientos`, `cambiaConsentimiento`) con batería
propia y verificación en navegador; hoy en `localStorage` por cuenta, a la
nube en el paso 30. `check-lenguaje` exige la declaración de que apagado no
registra.

**Fase 4 en marcha — registro con datos mínimos (paso 28, 19-08-2026).** La
revisión jurídica quedó validada por Óscar ese mismo día (nota en §2) y se
abre el registro: correo y contraseña, nada más — sin teléfono, sin patrimonio
y sin cuestionario de perfil, que se parecería a un test de idoneidad.
`js/nuvia-datos.js` enlaza la sesión anónima a la cuenta nueva con
`accounts:signUp` + idToken (mismo usuario antes y después; la vía
`accounts:update` la rechaza Identity Toolkit), inicia sesión con
`signInWithPassword`, recupera contraseña con `sendOobCode` y traduce los
códigos de error a llano. `js/nuvia-cuenta.js` monta el bloque «Tu cuenta» y
dice honestamente que, de momento, iniciar sesión no cambia lo que se ve.
`check-lenguaje.mjs` vigila también esta superficie y exige la declaración de
datos mínimos.

**FASE 3 CERRADA (pasos 18–27, 19-08-2026).** El nivel de visitante está
completo y publicado: sección propia sin iframe, buscador sobre la maestra,
constructor de hasta 5 posiciones con métricas del historial real y lecturas
llanas, reparto por clase, guardado local con aviso, límite comunicado antes,
lenguaje revisado y blindado en la build (`check-lenguaje.mjs`), fuentes en
cada vista y verificación final medida (AA por píxeles, suelo de 12 px,
sin desbordes, consola limpia, encabezados). La Fase 4 (cuentas y niveles)
exige revisión jurídica antes de empezar.

**Constructor del visitante (paso 20, 19-08-2026).** `js/nuvia-constructor.js`
monta hasta 5 posiciones reales con pesos normalizados y recálculo instantáneo;
rentabilidad, volatilidad y máxima caída se calculan en el navegador sobre el
historial de `get_price_series` (3 años, diario, EUR), con la fecha del último
cierre visible. Sin historial → fuera del cálculo, dicho tal cual.

**Buscador conectado a la maestra (paso 19, 19-08-2026).** `js/nuvia-datos.js`
abre la sesión anónima (REST de Identity Toolkit, renovada sola) y llama a las
callable de solo lectura; `js/nuvia-buscador.js` busca por nombre, ticker o
ISIN con los estados en lenguaje llano. Para que funcionara hubo que habilitar
el proveedor anónimo del proyecto y reabrir el alta de usuarios
(`disabledUserSignup` estaba a `true`); autorizado por Óscar el 19-08-2026 —
detalle en la nota del paso 19 de la guía de implementación.

**Fase 3 en marcha — sección propia del visitante (paso 18, 19-08-2026).**
`cartera.html` ya no incrusta la suite del núcleo: sirve su propia sección
`#laboratorio` con el simulador por clases (`js/nuvia-simulador.js`, montado
desde el script de la página), la tabla de supuestos a la vista y las lecturas
llanas. Los módulos de cálculo viven ahora en `js/` para que el build los
publique; las baterías siguen en `docs/`. La página entera se lee sin
JavaScript; el simulador lo requiere y lo dice. La vista de análisis de
empresas conserva su iframe independiente.

**Correlaciones reales — resuelto (paso 12, 19-08-2026).** El módulo ya no
asume ρ por clase para activos concretos: `correlacionesDesdeSeries()` calcula
la matriz de Pearson sobre retornos diarios a partir de las series de
`get_price_series` (que acepta hasta 25 activos por llamada, con `frequency:
"DAILY"` y `window: "3Y"`, y las devuelve ya alineadas por fecha), y
`estableceCorrelaciones()` la registra para que `volatilidadCartera()` la lea.
El supuesto por clase queda solo para el simulador del visitante, que trabaja
por clases. Si a un par de activos le falta correlación, el cálculo devuelve
`undefined`: nunca se inventa una ρ. Detalle en
`IMPLEMENTACION_ANALISIS_CARTERA.md`, pasos 8 y 12.

> **Lección del contraste con datos reales (semanales, 3 años, ago-2026):**
> el supuesto de clase erraba en las dos direcciones. Telefónica apenas
> correlaciona ya con la banca (ρ ≈ 0,15–0,23 tras su desplome de nov-2025),
> y los pares entre bancos (BBVA–SAN 0,79; BBVA–CABK 0,70; SAN–CABK 0,73)
> quedan alrededor del 0,75 asumido, no muy por encima. La matriz real no es
> un refinamiento cosmético: cambia el signo del mensaje según la cartera.

**Lo que hay publicado hoy** en `cartera.html` es un build antiguo de la
plataforma servido en un iframe, con su propio sistema de diseño. Es lo que se
va a sustituir.

---

## 8. Decisiones abiertas

1. **Qué análisis va en cada nivel.** La progresión va por *profundidad de
   análisis*, no por capacidad de la cartera: el visitante ve lo descriptivo, el
   registrado lo comparativo, el suscriptor lo proyectivo. Reparto por concretar.
2. **Pago por uso (cuarto nivel).** Sobre la cuota fija, extras puntuales de
   precio simbólico. Criterio: **se cobra aparte lo que el usuario percibe como
   extra desde el principio, no una parte del análisis que se le ha quitado.**
   Se descarta cobrar por cálculos ya precalculados en la base de datos: la
   fricción de decidir mata la exploración, que es el objetivo de la sección.

   **Sin firma personal.** Los informes no los firma el responsable del portal:
   trabaja para una entidad y firmar análisis la arrastraría, con implicaciones
   de conflicto de interés y de comunicación interna. Es una restricción, no una
   preferencia. Quedan dos vías: **informe genérico sin firma** (fichas,
   comparativas, contexto elaborado) y **contenido patrocinado por una entidad**.

3. **Contenido patrocinado: descartado de inicio.** Se puede reconsiderar si el
   proyecto crece y la oferta lo justifica, pero **no forma parte del diseño de
   partida y no se construye pensando en ello**. Ver sección 1: la independencia
   es parte del producto.

   Si algún día entra, estas condiciones no se negocian:
   - **Identificación inequívoca** como comunicación publicitaria, visible sin
     buscarla.
   - **Separación estricta del análisis.** El patrocinio no puede influir en qué
     activos aparecen en el catálogo, en su orden, ni en ningún resultado del
     simulador. Si un banco patrocina y sus fondos salen mejor situados, el
     problema deja de ser de imagen. Es fácil que ocurra sin mala intención:
     basta con ampliar el catálogo «porque el patrocinador nos pasó sus fondos».
   - **Publicidad de productos financieros**: normativa propia (claridad, no
     engañosa, advertencias de riesgo). Requiere revisión jurídica específica.
   - **El motor de contenido sigue sin ver las posiciones del usuario.**

4. **Unidad de «prueba» del visitante.** Propuesta: la cartera creada, no el
   cálculo — así puede mover pesos y recalcular sin gastar cupo.
5. **Periodicidad de actualización.** Ya no aplica a volatilidades y correlaciones
   —viven en la maestra y las mantiene la plataforma profesional—; sigue abierta
   para cualquier dato que el portal precalcule por su cuenta.
6. ~~Infraestructura de cuentas.~~ **Resuelta:** se reutiliza Firebase del
   proyecto `bbdd-activos-financieros`, con Anonymous Auth para el visitante
   (sección 6). Queda abierto solo el pago (pasarela, facturación).
7. **Supuestos de mercado** para el modo por clases: pendientes de validación.

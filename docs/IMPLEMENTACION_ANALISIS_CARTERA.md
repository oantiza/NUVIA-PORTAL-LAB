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

### Paso 4 · Infraestructura de cuentas

**Hacer.** Decidir si se reutiliza Firebase Auth (ya en uso en la app de
empresas, proyecto `bbdd-activos-financieros`) o se monta aparte.

**A favor de reutilizar:** ya funciona, ya está pagado, un solo inicio de sesión
para todo el portal.
**En contra:** mezcla el proyecto profesional con el portal público; conviene
comprobar que las reglas de Firestore separan bien ambos mundos.

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

# FASE 1 · Datos

El cuello de botella real. Aquí se resuelve la limitación conocida del motor.

### Paso 6 · Definir el catálogo

**Hacer.** Componer la lista de ~1.200 activos: unos 500 fondos, 500 acciones,
resto ETF. Criterio de selección **propio**: relevancia para un particular
español, cobertura de las principales bolsas y gestoras, y presencia de los
productos que se encuentran habitualmente en banca comercial.

**Formato.** Un `catalogo.json` con, por activo: `id`, `isin`, `nombre`, `tipo`
(fondo/acción/ETF), `divisa`, `pais`, `sector`, `clase` (equity/fixed/money/real).

**Verificación.** Buscar diez valores que un cliente típico tendría —los del
IBEX grandes, un par de fondos indexados conocidos, un ETF global— y comprobar
que están todos.

> **Cuidado.** Las bases prohíben que el catálogo lo determine quién aporta los
> datos. Si mañana una gestora ofrece su gama «para que la tengáis», entra por
> criterio propio o no entra.

### Paso 7 · Descargar las series de cierre

**Hacer.** Script que, para cada activo del catálogo, descarga de EODHD el
histórico de cierres ajustados de los últimos 5 años. Guardar en crudo antes de
procesar: si el cálculo cambia, no hay que volver a descargar.

**Verificación.** Contar activos con menos de 3 años de historia: esos no
pueden dar volatilidad a 3 años y hay que marcarlos, no inventarles el dato.

### Paso 8 · Calcular volatilidades

**Hacer.** Para cada activo, volatilidad anualizada a 1, 3 y 5 años sobre
rendimientos logarítmicos diarios: `σ_anual = σ_diaria × √252`.

**Verificación.** Contrastar cinco valores contra la plataforma OAA, que ya los
calcula. Deben coincidir en el primer decimal. Si no, hay una diferencia de
método que hay que entender antes de seguir.

### Paso 9 · Calcular la matriz de correlaciones

**El paso que arregla la limitación del motor actual.**

**Hacer.** Correlación de Pearson entre rendimientos diarios de cada par, con
ventana de 3 años. Son ~720.000 pares para 1.200 activos.

Guardar solo el triangular superior; la matriz es simétrica. `float32` basta:
la precisión de una correlación no necesita más.

**Verificación.** Comprobaciones de coherencia:
- La diagonal debe ser 1.
- Telefónica–BBVA debe salir claramente por encima de Telefónica–Toyota.
- Dos ETF del mismo índice deben salir cerca de 0,99.
- Ningún valor fuera de [−1, 1].

### Paso 10 · Publicar el fichero de datos

**Hacer.** No servir la matriz entera. Dos opciones:

**A · Fichero por activo.** Para cada uno, sus correlaciones con el resto.
1.200 ficheros pequeños; el navegador descarga solo los de la cartera. Sencillo
y cacheable.

**B · Endpoint que devuelve el submatriz.** Menos ficheros, pero necesita
servidor. Contradice el principio de «sin backend por usuario».

**Recomendación: A.** Encaja con el portal estático y con GitHub Pages.

**Verificación.** Una cartera de 20 activos debe resolverse descargando 20
ficheros pequeños, no un MB. Medir el total transferido.

### Paso 11 · Automatizar el proceso

**Hacer.** Script único que encadene pasos 7–10, ejecutable con un comando y
programado con la periodicidad del paso 3. Debe registrar qué activos falló y
por qué, sin abortar el conjunto.

**Verificación.** Ejecutarlo dos veces seguidas: la segunda no debe romper nada
ni duplicar datos. Y si EODHD falla a mitad, los datos anteriores siguen
publicados y válidos.

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

**Hacer.** En cada vista con datos: origen, fecha del dato y atribución. «Datos
de cierre del [fecha] vía EODHD.» La licencia lo exige y la credibilidad
también.

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

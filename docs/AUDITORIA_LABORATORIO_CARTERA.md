# Auditoría medida · Laboratorio de Cartera (`cartera.html` · `#laboratorio`)

**Fecha:** 21-08-2026 · **Base auditada:** `origin/main` = `b3dc688` · **Entrega 1 de 2**
(la Entrega 2, el plan de rediseño, se hará sobre estos hallazgos).

---

## 0 · Método y autotest

- CSS leído regla a regla: **266 reglas** pertenecen a las clases del bloque
  (`nv-portada*`, `nv-atajos`, `nuvia-lab*`, `nv-cons*`, `nv-analisis*`,
  `nv-grafico*`, `nv-frontera*`, `nv-abanico*`, `nv-mapa*`, `nv-evolucion*`,
  `nv-solape*`, `nv-perfiles*`, `nv-mriesgo*`, `nv-leyenda*`, `nv-dialogo*`,
  `nv-sim*`, `nv-buscador`, `nv-modelos`, `nv-informe`, `nv-cuenta`).
- Navegador real (Chromium/Playwright) a **1440 · 1180 · 1024 · 390 px**, con
  la maestra simulada (mocks de `search_assets`, `get_price_series`,
  `get_asset_detail`, holdings y sesión).
- **Estados recorridos**: sin cartera; 2 posiciones; límite de visitante
  (5 de 5, con su aviso de nivel); cartera completa de 7 posiciones **con un
  activo sin historial** (Medtronic simulada → «fuera del cálculo»); sin
  importe y con importe (250.000 €); carteras guardadas vacías y con una
  guardada; visitante / registrada / con nivel completo. Capturas en
  `/tmp/aud-*.png` de la sesión de auditoría.
  *No cubierto:* guardadas **en la nube** con contenido (exigiría simular
  `save_portfolio`+`list_portfolios` encadenados); anotado, no medido.
- **Contraste**: color efectivo compuesto **con canal alfa contra el fondo
  real**, ascendiendo por los ancestros hasta fondo opaco; umbrales WCAG AA
  (4,5:1 normal · 3:1 grande).
- **Control roto a propósito** (un control que nunca ha fallado no es un
  control): se inyectó un elemento `#999` sobre `#fff` y el medidor lo marcó
  con **ratio 2,85 < 4,5** → el detector de contraste detecta. El control
  nuevo de esta auditoría —tamaño **efectivo** del texto SVG tras el escalado
  del viewBox— falla hoy de verdad (hallazgo C1), así que queda demostrado
  por partida doble.

---

## 1 · Los tres números que resumen la sección

| Nº | Medida | Valor |
|---|---|---|
| R1 | Texto total de `#laboratorio` (cartera completa) | **2.834 palabras** — unas 11 páginas A4 de prosa para una sección de herramienta |
| R2 | Altura de la tarjeta «Monta una cartera…» | **7.460 px de 12.202 px** de la sección (61 %) — una sola tarjeta contiene **15 títulos internos** (h3/h4) |
| R3 | Alineación de los 19 grupos con contenido (1440 px) | **5 centrados · 14 a la izquierda** — conviven los dos ejes de composición en la misma columna |

---

## 2 · Comprensión (lector sin formación financiera)

Recorrido en voz alta sobre el render real, con la cifra delante.

| Nº | Hallazgo | Evidencia medida |
|---|---|---|
| A1 | **El primer contenido útil no es su cartera.** Lo primero tras la portada es un simulador genérico cuyos valores «no describen ninguna cartera en particular» (lo dice su propio texto). El lector novato mueve deslizadores de algo que no es suyo antes de ver nada propio. | Orden medido de bloques: portada → atajos → «Prueba un reparto» → «Busca» → «Monta una cartera». El análisis de SU cartera empieza a ~3.000 px de scroll |
| A2 | **El glosario llega el último.** «Cómo leer estas cifras» (rentabilidad, volatilidad, diversificación) es el 8º de 9 bloques: la explicación aparece después de los 10 gráficos que la necesitan. | Orden de `h2` medido; «Cómo leer estas cifras» va tras «Los supuestos» y antes solo de «Fuentes y límites» |
| A3 | **Texto estático contradice el estado real.** La intro del constructor dice «Hasta cinco posiciones» mientras el contador muestra «Posiciones: 7 de 20» (sesión registrada). | Medido en el estado E5: intro estática `cartera.html:135` vs `contador` renderizado «Posiciones: 7 de 20» |
| A4 | **Jerga concentrada, con la traducción lejos o ausente.** «volatilidad» ×14, «Sharpe» ×5, «percentil» ×7, «mediana» ×4, «Pearson» ×1, «Montecarlo» ×1, «se normalizan» ×2, «ISIN» ×3. «Percentil 95 · 367» es un rótulo directo del abanico: un lector novato no sabe si 367 es dinero, puntos o años (es base 100, y eso se dice en otra parte). | Conteo sobre `innerText` del bloque; rótulos del abanico medidos en el SVG |
| A5 | **Dos párrafos casi idénticos, uno debajo del otro**, en «Informe de compañía»: la intro estática y la del módulo repiten «la misma plantilla para todas las compañías… riesgos siempre delante… no emite recomendaciones». | Medidos ambos `p` en el DOM: coinciden 3 de sus 4 proposiciones |
| A6 | «Los pesos se normalizan para sumar el 100 %» aparece **dos veces** (simulador y constructor) y en ninguna se dice en llano qué significa («si tus pesos no suman 100, se reescalan»). | 2 apariciones medidas de «se normalizan» |
| A7 | **El visitante con cartera no ve ningún grupo de análisis.** Con 2 posiciones y sin sesión: 0 títulos `.nv-analisis__titulo` en el DOM (el análisis por grupos es del nivel registrado). El visitante ve reparto+métricas+evolución y nada le dice qué más existe ni por qué no lo ve. | Medido en estado E2: `grupsAnalisis = []` |
| A8 | **Tres grupos seguidos cuentan lo mismo** (dónde está la renta variable): «En qué sectores», «Dónde está invertida (mapa)» y «En qué regiones» — el tercero se declara a sí mismo redundante: su lectura es «El mismo reparto del mapa, región a región» (8 palabras). | Lecturas medidas; la del grupo de regiones tiene 8 palabras y remite al mapa |
| A9 | **No hay estado de ejemplo.** Sin cartera, el 61 % de la sección (los análisis) simplemente no existe: el lector que no busca un activo nunca sabrá qué ofrece la página. El vacío del constructor es una sola frase gris. | Estado E1 medido: constructor = 1 línea («Busca un activo arriba…»); cero gráficos |

## 3 · Recorrido y jerarquía

| Nº | Hallazgo | Evidencia medida |
|---|---|---|
| B1 | **Un bloque-tarjeta contiene toda la experiencia.** Buscar, montar, 10 grupos de análisis y el guardado viven dentro de la MISMA tarjeta blanca de 7.460 px. El lector no tiene sensación de avance ni límites visuales entre «mi lista», «mi análisis» y «guardar». | R2; 15 h3/h4 dentro de un solo `.nuvia-lab__bloque` |
| B2 | **Los atajos no llevan al análisis.** La barra tiene 6 píldoras; ninguna apunta a un gráfico concreto (frontera, mapa, proyección…), que es donde el lector pasa el 61 % del scroll. | 6 `.nv-atajos__enlace` medidos; destinos: sim, buscador, constructor, modelos, cuenta, supuestos |
| B3 | **El orden de los grupos de análisis no es narrativo**: «Lo que aportó diversificar» (una cifra) → riesgo por posición → frontera → perfiles → proyección → correlaciones → sectores → mapa → regiones → solapamiento. Riesgo, composición y futuro van intercalados, no agrupados. | Orden medido de los 10 `.nv-analisis__titulo` |
| B4 | **La jerarquía tipográfica dentro del análisis es plana**: títulos de grupo a 18 px/600 y subtítulos del constructor a 16 px/500 conviven con cuerpos a 16 px/400 — un solo escalón separa el título del párrafo. | Censo tipográfico medido (§5) |
| B5 | «Análisis completo (suscripción)» es un rótulo de nivel, no de contenido: al lector con nivel completo se le interrumpe la lectura con un título administrativo entre sus gráficos. | Título presente entre «Evolución» y «Lo que aportó diversificar» en E5 |

## 4 · Gráficos, uno a uno (render real, cartera de 6-7 posiciones)

| Nº | Gráfico | Hallazgo | Evidencia medida |
|---|---|---|---|
| C1 | **Todos los SVG a 390 px** | El texto interno se escala con el viewBox: **2,8–4,0 px efectivos** (declarados 14 px). Ilegible; incumple el suelo de 12 px que el HTML sí respeta. El control existente («suelo de 12 px») medía solo HTML computado, por eso nunca lo cazó. | Abanico: escala 0,2–0,28 → 2,8 px; frontera y evolución: 3,9–4,0 px |
| C2 | Frontera | Solo **4 rótulos de eje en total** (2 por eje, los extremos: «2,2 %–6,2 %» y «9,1 %–22,3 %»). Sin marcas intermedias el lector no puede situar «¿4 % es mucho?». Los tres puntos y sus rótulos con halo funcionan bien (etiquetado directo, sin leyenda de colores). | Ticks medidos en el SVG: `['2,2 %','6,2 %','9,1 %','22,3 %']` |
| C3 | Abanico (Montecarlo) | Rótulos «Percentil 95 · 367 / Mediana · 303 / Percentil 5 · 251» sin unidad visible en el gráfico (la base 100 se explica solo en la lectura de 37 palabras de arriba). A 1024 px la columna reservada de 185 px para rótulos come el 18 % del ancho del dibujo. | Rótulos medidos; `der=185` en el viewBox de 1080 |
| C4 | Mapa de perfiles | Correcto en etiquetado («10 % bolsa»… directo sobre los rombos) pero **declara dos bases distintas** (tu punto = historial 3A; rombos = supuestos) en dos notas al pie — carga cognitiva alta para el lector al que va dirigido. | 2 notas de base medidas bajo el gráfico |
| C5 | Correlaciones | La lectura arranca con «Correlación de Pearson sobre los retornos diarios comunes de 3 años» — el nombre técnico delante y la explicación después; «Pearson» no aporta nada al novato. Las frases-resumen por pares («…y … · poca relación») sí funcionan. | Lectura medida (32 palabras, «Pearson» presente) |
| C6 | Solapamiento | La rejilla numera los ejes 1…N y obliga a resolver la indirección número→fondo en la lista de debajo; con 6 fondos son 36 celdas y 6 saltos de vista. Correcta para experto, dura para novato. | 36 celdas + leyenda numerada medidas |
| C7 | Sectores / regiones / mapa | Tres representaciones del mismo dato (A8). El mapa usa 5 colores base por continente + 4 tramos de intensidad = **hasta 20 combinaciones** para expresar un vector de 5 cifras que ya está impreso en la leyenda. | Clases `--america/--europa/--africa/--asia/--oceania` × `--n0..n3` en CSS 5082–5100 |
| C8 | Riesgo por posición | Barras correctas (suma 100, etiquetado directo, honestidad «historial, no futuro»). Sin hallazgo de fondo. | — |
| C9 | Evolución + caídas | Dos gráficos apilados comparten eje temporal pero solo el primero lleva fechas; el de caídas (150 px de alto) no repite las fechas y su área bronce carece de rótulo de unidad en el propio dibujo. | SVG caídas H=150 medido; 0 `text` de fecha en el segundo SVG |

## 5 · Tipografía y color

| Nº | Hallazgo | Evidencia medida |
|---|---|---|
| D1 | **Un texto por debajo del suelo de 12 px** en HTML: el rótulo de la portada «LABORATORIO DE CARTERA» renderiza a **11 px** (`.nv-portada-lab__seccion`, `nuvia-pages.css:~4160`). Introducido con la portada del 21-08 (copiado del banner de empresas, que usa 11 px). | Censo tipográfico: `11px/650` |
| D2 | **Tamaños fuera de la escala** (12·14·16·18·22·28·36): 48 px y 43 px (`__marca`, líneas ~4150 y ~4190) y los 11 px de D1. El resto del bloque SÍ está en escala (12/14/16/18/22 medidos). | Censo: `48px/400`, `43px/400`, `11px/650` |
| D3 | **Peso 650 fuera de los tokens** (400/500/600/700): `.nv-portada-lab__seccion`. | `font-weight: 650` en línea ~4160 |
| D4 | **Contraste AA: 0 fallos** en los 4 anchos y el estado completo (medido con alfa compuesto). El sistema de color actual cumple. | 0 pares < umbral en 1440/1180/1024/390 |
| D5 | La paleta funcional de los gráficos es corta de verdad: series = 2 tonos (marino/verde) + bronce puntual; las 4 clases del simulador reutilizan verde/púrpura/petróleo/ocre que no existen como tokens de series (los tintes del solapamiento y del mapa van en hex crudos, E1–E2 de §7). Diferenciar 7+ posiciones o 5 continentes con esto obliga a los hex sueltos que ya se han colado. | Ver §7; clases de serie contadas en CSS |

## 6 · Distribución y aire

| Nº | Hallazgo | Evidencia medida |
|---|---|---|
| E0 | **Sin desbordes** horizontales en 1440/1180/1024/390 (0 px medidos en los 4). | `scrollWidth − innerWidth = 0` |
| E1 | **459 px muertos a la derecha en TODAS las tarjetas de intro a 1440 px** (303 px a 1180; 187 px a 1024): los párrafos tienen `max-width: 72ch` alineado a la izquierda dentro de tarjetas de 1240 px. Es el «hueco muerto» sistemático que se ve en las capturas: 7 tarjetas de 7. | Medido por tarjeta: hueco 459/303/187 px según ancho |
| E2 | **Dos ejes de composición conviven** (R3): dentro de la MISMA tarjeta del constructor, «Evolución» va centrada y a continuación «Lo que aportó diversificar», «Cuánto riesgo pone cada posición», sectores, regiones, solapamiento y correlaciones van a la izquierda, con frontera/perfiles/proyección/mapa centrados entre ellos. El ojo cambia de eje 8 veces en un scroll. | Alineaciones medidas: secuencia start→center→start→start→center→center→center→start→start→center→start→start |
| E3 | La proyección centrada tiene otro ancho que el resto de centrados: frontera/perfiles 760 px, mapa 640 px, proyección 1160 px — tres anchos distintos en el mismo eje. | Anchos de visual medidos: 760 · 760 · 1160 · 640 |
| E4 | La tabla de «Los supuestos» ocupa el ancho entero (1192 px) para 4 filas × 4 columnas de cifras cortas, con la columna «Cómo leerla» ausente aquí pero presente en la tabla de métricas — dos tablas hermanas con anatomías distintas. | Ancho de tabla medido 1192 px; columnas contadas |

## 7 · Deuda de sistema

| Nº | Hallazgo | Evidencia (selector · línea de `nuvia-pages.css`) |
|---|---|---|
| F1 | **20 hexadecimales fuera de `nuvia-tokens.css`**, todos del bloque: portada (4: `#d6d9d2 #f7f3e7 #edf2e9 #e7ecf1`, ~4097), tintes del solapamiento (3: `#a4b98a #cdd8c2 #e4e8e2`, 4988–4990), colores de continente del mapa (5: `#2e4f7c #4a5d23 #a04e2a #8a6a1f #256f6a`, 5082–5089) y neutros de tramo (`#e7e5da #f0eee3`, 5090–5100). Los del mapa y solape duplican además valores que YA existen como token (`#4a5d23` = `--nv-green-700`). | Escáner estático sobre las 266 reglas |
| F2 | **Espaciados fuera de la escala**: la escala real es 4·8·12·16·20·24·32·40·48·64·80 (múltiplos de 4, no solo de 8), así que **20 px y 48 px SÍ están en escala** (`--nv-space-5`, `--nv-space-12`) — el escáner los marcó de más. Fuera de escala de verdad: **34/15/30/26/18 px** en la portada (~4144–4189), **6 px** en peso-campo/filas/solape/leyenda (4508–5114), **10 px** en el informe (5132). 8 valores reales. | Escáner estático corregido contra los tokens `--nv-space-*` |
| F3 | **14 clases muertas**: `nv-frontera__control/detalle/eje/elegido/etiqueta/punto/resumen` (era del deslizador, eliminado el 21-08), `nv-leyenda__marca--linea/--nube` (leyenda antigua de la frontera-nube) y `nv-mriesgo__activo/cifras/marca/numero/union` (mapa numerado sustituido por los perfiles). Las clases de continente del mapa NO están muertas (se construyen dinámicamente: `nv-mapa__zona--${continente}`, `nuvia-mapa.js:124`). | Cruce CSS↔DOM/JS con comprobación de construcción dinámica |
| F4 | `!important`: **0 dentro del bloque**. Los 7 existentes en la página pertenecen al armazón (`.nuvia-route-cartera main`, 3904–3911) y a las pestañas del héroe (4021–4023) — fuera del perímetro; anotados, no tocados. | Grep + verificación de selector |
| F5 | Tokens de espaciado usados como `font-size`: **0**. `span` genérico por descendencia: **0** en el bloque. | Grep con patrón dedicado |
| F6 | Radio de la portada era el único `var(--nv-radius-lg, 18px)` con fallback distinto del token (20 px); ya migrado a `radius-md` el 21-08 — sin pendiente. | Verificado en CSS actual |
| F7 | **Las fuentes NO están autoalojadas.** `nuvia-tokens.css:15` las trae por `@import url('https://fonts.googleapis.com/…Fraunces…Inter…')`. Sin red, el sitio cae a `Georgia`/`system-ui` (los fallback de los tokens), no a Fraunces/Inter. La premisa del encargo «el sitio arranca hoy sin internet» **no se cumple hoy**: autoalojar es trabajo nuevo, no una preservación. Además el `@import` serializa la descarga (ya anotado como TODO en el propio fichero). | `nuvia-tokens.css:15`; búsqueda de `*.woff*`/`@font-face` en el repo: 0 resultados |

## 8 · Lo que está bien (para no tirarlo en el rediseño)

- **AA limpio**: 0 fallos de contraste medidos en 4 anchos (D4).
- **0 desbordes** en los 4 anchos (E0).
- **Etiquetado directo ya conquistado en la frontera y los perfiles**: rótulos
  con halo sobre el propio gráfico, sin leyenda de colores para los puntos.
- **Honestidad sistemática**: «describe el historial, no el futuro», «—» en
  lugar de inventar, «fuera del cálculo» explicado con nombre y motivo
  (medido en E5 con Medtronic).
- **Formato es-ES** en todas las cifras medidas (coma decimal, «12.500 €»).
- **La escala tipográfica se respeta** en todo el bloque salvo los 3 valores
  de la portada (D2).

---

## 9 · Ambigüedades del perímetro (después de la auditoría, como pediste)

1. La **portada** (`.nv-portada-lab`) no sale en las capturas del encargo pero
   es parte de `#laboratorio` y concentra hallazgos (D1–D3, F1, F2). La doy
   dentro del perímetro; si no lo está, D1–D3 pasan a «anotado, no tocar».
2. Los `!important` y el padding de 76 px del armazón (F4) afectan al aire de
   la sección pero están fuera de `#laboratorio`: anotados, sin propuesta.
3. «Guardadas en la nube con contenido» quedó sin medir (mock encadenado);
   si quieres ese estado en la Entrega 2, lo monto antes del plan.

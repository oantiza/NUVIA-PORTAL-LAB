# Plan de rediseño · Laboratorio de Cartera

**Fecha:** 21-08-2026 · **Base:** `origin/main` = `046cef7` · **Entrega 2 de 2**
Se apoya en `docs/AUDITORIA_LABORATORIO_CARTERA.md` (cada fila cita su hallazgo).
**No es código. No se toca producción hasta que apruebes una dirección.**
Prototipos vivos: `/tmp/proto.html?dir=A|B|C` (capturas ya enviadas).

Dos correcciones de la auditoría, halladas al preparar el plan (verificar antes de afirmar):
- **F2:** 20 px y 48 px SÍ están en la escala (`--nv-space-5/12`); fuera de escala real son 34/15/30/26/18/6/10 px. Corregido en la auditoría.
- **F7 (nuevo):** las fuentes **no** están autoalojadas — vienen por `@import` de Google Fonts (`nuvia-tokens.css:15`). La premisa del encargo «arranca sin internet» no se cumple hoy; autoalojar es trabajo, no preservación. Cambia la sección de tipografía de abajo.

**INNEGOCIABLE 9 (Óscar, 21-08):** el banner de entrada (`.nv-portada-lab`) se
**mantiene siempre**, con este color u otro, homogéneo con el de «Análisis y
valoración de empresas». Ninguna dirección lo elimina ni lo sustituye por una
cabecera con filete. Los hallazgos de la portada (D1–D3, F1, F2) se corrigen
**dentro** del banner (suelo de 12 px, escala, tokens), sin tocar su
composición —panel con rejilla, anillos, silueta de montaña, NUVIA en serif,
rótulo y raya—, que es justo lo que lo hace gemelo del de empresas.

**INNEGOCIABLE 10 (Óscar, 22-08, tras el informe «NUVIA — Visión consolidada
y modelo funcional v0.2»):** NUVIA **no se mezcla con el trabajo de banca
privada de Óscar**. Ninguna dirección visual puede replicar el lenguaje de sus
informes profesionales (papel crema tipo informe impreso, filetes de informe,
composición de «ficha de banca privada»). NUVIA es una organización con
identidad propia, centrada en la Comunidad de Familias (visión §6): su
estética sale de `nuvia-tokens.css` y de su propio carácter — cercana, clara y
de confianza —, no del de una entidad financiera. La dirección C del plan
original queda **descartada por este motivo** (ver §7).

---

## 1 · Tesis de diseño (tres frases)

Quien entra no es un gestor: es alguien que quiere entender lo que tiene sin
que le vendan nada. Debe sentir que abre **el informe que ningún banco le da** —
sobrio, honesto, con cada cifra explicada en llano y su cartera como
protagonista, no un simulador genérico. Cada gráfico responde a una sola
pregunta suya —«¿qué tengo?», «¿cuánto me puede moverse?», «¿estoy repitiendo
apuestas?»— y se lo dice sobre el propio dibujo, sin obligarle a descifrar una
leyenda ni a saber qué es un percentil.

## 2 · Recorrido propuesto (con el estado de quien lee)

| Paso | Qué ve | Estado cognitivo buscado |
|---|---|---|
| 1 · Portada | Marca + «Laboratorio de cartera» + una frase | «Sé dónde estoy y para qué es esto» (hoy: bien) |
| 2 · Tu cartera de un vistazo | 4 cifras grandes: valor, rentab., volatilidad, nº posiciones | «De un golpe sé lo esencial» — resuelve **A9/A1**: hay algo propio antes del detalle |
| 3 · Tu cartera posición a posición | Lista activo·peso·capital (ya hecha el 21-08) | «Esta es mi cartera, la reconozco» |
| 4 · ¿Qué tengo? (Composición) | Reparto por clase + regiones, en UNA vista | «Sé en qué estoy metido» — funde **A8/C7** (3 grupos → 1) |
| 5 · ¿Cuánto me puede moverse? (Riesgo) | Métricas + riesgo por posición + frontera con tu sitio marcado | «Entiendo mi riesgo y si compensa» — reordena **B3** |
| 6 · ¿Estoy repitiendo apuestas? (Solapamiento) | Solapamiento en llano | «Veo si dos fondos llevan lo mismo» (la razón de ser, bases §1) |
| 7 · Aprende y comprueba | Glosario + supuestos + fuentes | «Si algo no lo entendí, aquí está» — sube el glosario **A2** |

El simulador genérico por clases (hoy el paso 2) **baja** al final, como
«banco de pruebas» opcional: es útil pero no es la cartera del lector (**A1**).

## 3 · Distribución de la sección (bloques, ancho, orden)

Contenedor 1180 px, **un solo eje de composición centrado** (resuelve **R3/E2**).
Los párrafos de intro dejan de ser bloques de 72ch a la izquierda dentro de
tarjetas anchas (**E1**): van centrados y estrechos (máx. 64ch) bajo su título.

```
[ BANNER DE ENTRADA (se mantiene, Innegoc. 9) . 1180, centrado ]
[ Tu cartera de un vistazo ..... 4 tiles, 1180 ]
[ Tu cartera posición a posición .... lista, 1180 ]
── Composición ───────────────────────────────  (rótulo de fase, solo dir. B)
[ Qué tengo: clases + regiones ...... 1 tarjeta ]
── Riesgo ────────────────────────────────────
[ Métricas .......... tabla 3 col ]
[ Riesgo por posición ... barras, máx 680 centrado ]
[ Frontera .............. 680×380 centrado, texto legible ]
── Aprende y comprueba ───────────────────────
[ Glosario (3 cartas) ][ Supuestos (tabla) ][ Fuentes ]
[ Banco de pruebas por clases (opcional, plegado) ]
```

Todos los visuales centrados comparten **un mismo ancho de dibujo** (680 px;
el abanico y el mapa se reencuadran a ese ancho) — resuelve **E3**.

## 4 · Cambios, uno a uno

Riesgo/esfuerzo en bajo·medio·alto. «Rev.» = reversible sin residuo.

| # | Cambio | Por qué (hallazgo) | Riesgo | Esf. | Rev. |
|---|---|---|---|---|---|
| P1 | **Texto SVG con tamaño de pantalla, no escalado por viewBox** (mín. 12 px efectivos en los 4 anchos; en móvil, reflow del gráfico a menos marcas) | **C1** (2,8–4 px hoy) | medio | alto | sí |
| P2 | Añadir **«Tu cartera de un vistazo»** (4 tiles) tras la portada | **A1/A9** | bajo | medio | sí |
| P3 | **Fundir sectores+mapa+regiones** en un bloque «Qué tengo» (clase + región; el mapa mundi pasa a opción plegada) | **A8/C7** | medio | medio | sí |
| P4 | **Reordenar** los grupos en Composición→Riesgo→Solapamiento→Aprende | **B3/A2** | medio | medio | sí |
| P5 | **Un solo eje centrado** para todo grupo con gráfico; intros centradas máx 64ch | **R3/E1/E2/E3** | bajo | medio | sí |
| P6 | **Frontera con marcas intermedias** (2·3·4·5·6 % y 9·13·17·22 %) | **C2** | bajo | bajo | sí |
| P7 | **Abanico con unidad en el dibujo** («base 100») y columna de rótulos más estrecha | **C3** | bajo | bajo | sí |
| P8 | Microcopia: quitar «Pearson»/«Montecarlo»/«normalizan» del rótulo y dejarlos en el glosario; una sola frase de «se normalizan» en llano | **A4/A6/C5** | bajo | bajo | sí |
| P9 | Borrar el **párrafo duplicado** del informe y unificar las dos intros de «se normalizan» | **A5/A6** | bajo | bajo | sí |
| P10 | **Estado de ejemplo**: cartera precargada de muestra (marcada «ejemplo») para que nadie vea la sección vacía | **A9** | medio | medio | sí |
| P11 | Intro estática del constructor **sin cifra fija** («hasta cinco/veinte según tu nivel»), coherente con el contador | **A3** | bajo | bajo | sí |
| P12 | Atajos que **apunten a los gráficos** (composición, riesgo, frontera), no solo a los formularios | **B2** | bajo | bajo | sí |
| P13 | **Suelo de 12 px y escala** en la portada: rótulo 12 px (no 11), marca a `--nv-title-lg`/`display`, peso a 500/600 | **D1/D2/D3** | bajo | bajo | sí |
| P14 | **Tokens nuevos** para las 7 series y los continentes: mover los 20 hex a `nuvia-tokens.css` como `--nv-serie-*` y `--nv-zona-*` | **F1/D5** | bajo | medio | sí |
| P15 | **Espaciados a la escala** (34→32, 15→16, 30→32, 26→24, 18→16, 6→ token, 10→ token) | **F2** | bajo | bajo | sí |
| P16 | **Borrar las 14 clases muertas** | **F3** | bajo | bajo | sí |
| P17 | «Análisis completo (suscripción)» deja de ser un título entre gráficos: pasa a nota discreta | **B5** | bajo | bajo | sí |

## 5 · Direcciones visuales (elige una; los cambios de §4 se aplican a la elegida)

Los prototipos comparten TODOS los arreglos funcionales (P1, P5, P6…). Cambian
en el tratamiento, no en el contenido.

**A · Editorial sobrio** — `?dir=A`. Lo de hoy, afinado: tarjetas blancas,
títulos Inter, un solo acento bronce, gráficos sobre panel crema. Riesgo mínimo,
cero sorpresas. Es la más cercana a lo publicado.
*Coste:* el más bajo. *Pierde:* poco carácter; sigue pareciendo una herramienta.

**B · Panel guiado** — `?dir=B`. Portada en marino NUVIA, resumen «de un
vistazo» destacado, y los grupos agrupados bajo **rótulos de fase**
(Composición · Riesgo · Futuro) que dan sensación de avance. Es el que mejor
resuelve el recorrido (**B1/B3**).
*Coste:* medio. *Gana:* orientación; el lector sabe siempre en qué parte está.

**C · Ficha de banca privada** — `?dir=C`. **DESCARTADA (Innegociable 10):**
replicaba el lenguaje visual de los informes profesionales de banca privada de
Óscar (papel crema de informe impreso, filetes, composición de ficha), y NUVIA
no debe mezclarse con ese trabajo. Se conserva en el histórico del prototipo
solo como evidencia de lo explorado.

**El banner es común a las direcciones vivas:** A y B se diferencian de la
portada **hacia abajo**; el banner de entrada es el mismo (Innegociable 9). Su
color puede afinarse, pero la pieza no se quita.

**Recomendación (revisada tras la visión consolidada): B sobre el banner
actual, con la identidad NUVIA de los tokens.** La estructura de B —resumen
«de un vistazo» + fases Composición · Riesgo · Futuro— es la que resuelve el
recorrido (B1/B3) y encaja con la visión: los primeros niveles «especialmente
visuales, ligeros y accesibles» (§1.5) para una Comunidad de Familias, no para
clientes de banca. La piel es la propia de NUVIA: superficies nube/blanco,
marino y verde de los tokens, Fraunces solo donde los tokens ya lo permiten
(`.nv-editorial`/`.nv-title-serif`), sin imitar informes profesionales. La
portada marino del prototipo B no sobrevive (el banner del Innegociable 9 abre
la sección); el resto de B —tiles de resumen, rótulos de fase en verde
NUVIA— funciona igual debajo del banner. A queda como variante de mínimos.

### Paleta ampliada (dentro de `nuvia-tokens.css`, P14)

Siete series **seguras para daltonismo** y ancladas en marca; seis ya existen
como token, así que apenas hay hex nuevo:

| Rol | Token propuesto | Valor | Origen |
|---|---|---|---|
| Serie 1 | `--nv-serie-1` | `--nv-navy-900` | ya token |
| Serie 2 | `--nv-serie-2` | `--nv-green-700` | ya token |
| Serie 3 | `--nv-serie-3` | `--nv-bronze-700` | ya token |
| Serie 4 | `--nv-serie-4` | `--nv-cat-teal` #1f625c | ya token |
| Serie 5 | `--nv-serie-5` | `--nv-cat-clay` #8d4236 | ya token |
| Serie 6 | `--nv-serie-6` | `--nv-cat-slate` #3d5670 | ya token |
| Serie 7 | `--nv-serie-7` | `--nv-cat-purple` #5b4487 | ya token |

**Nunca solo color:** cada serie lleva además su cifra impresa y, donde importa,
su etiqueta directa (ya es el caso en frontera y perfiles). Los tintes del
solapamiento y los continentes se derivan por `color-mix` de estos tokens, no
por hex nuevos.

### Tipografía (corrige la premisa F7)

- **Emparejamiento:** se mantiene **Fraunces** (display, con carácter) + **Inter**
  (datos y tablas, muy legible). Son los del sistema; no invento familias nuevas.
- **Autoalojar (lo que el encargo cree que ya pasa y no pasa):** traer a
  `estilos/fuentes/` los `woff2` de Inter (400/500/600/700, ~4 pesos) y de
  Fraunces (400/500/600, opsz variable), declarar `@font-face` con
  `font-display:swap`, y **quitar el `@import` de Google**. Peso estimado:
  Inter variable ~110 KB + Fraunces variable ~120 KB = **~230 KB** una vez,
  cacheado. Con ello el sitio SÍ arranca sin internet (hoy no). Es un cambio de
  `tokens.css` + añadir ficheros; **fuera de `#laboratorio`**, así que lo
  propongo como paso aparte y lo marco reversible.
- Dirección C usa Fraunces en los títulos de grupo: entra dentro de esos 3 pesos,
  sin coste extra de peso.

## 6 · Extras que mejoran la sección (no pedidos, propuestos)

- **Estado de ejemplo (P10):** cartera de muestra marcada, para que la sección
  nunca se vea vacía y el visitante entienda qué ofrece sin buscar nada.
- **Revelación progresiva:** el mapa mundi, la matriz completa de correlaciones y
  el banco de pruebas por clases van plegados; se abren si el lector quiere más.
- **Glosario en línea:** «volatilidad», «Sharpe», «percentil» como término con
  su definición al pasar/pulsar, además del glosario del final.
- **Móvil:** los gráficos con menos marcas y la lista en dos líneas (ya hecho);
  la frontera reflow a 4 marcas.
- **Orden de lectura y foco:** una serie protagonista (tu cartera, en verde) y el
  resto en segundo plano, en todos los gráficos.

## 7 · Lo que descarto y por qué

- **La dirección C («ficha de banca privada») entera.** Tras leer «NUVIA —
  Visión consolidada y modelo funcional v0.2»: NUVIA es una organización con
  identidad propia centrada en la Comunidad de Familias, y no debe mezclarse
  con el trabajo profesional de banca privada de Óscar (Innegociable 10). La
  estética de informe impreso de banquero privado era exactamente esa mezcla.
  El componente útil de C que se salva es neutro: la disciplina editorial
  (jerarquía clara, poco adorno), que ya está en los tokens de NUVIA.

- **Rehacer los cálculos o el motor de gráficos SVG entero.** El innegociable 2
  lo prohíbe y la auditoría no encontró error de cálculo. Solo cambia cómo se
  dibuja el texto (P1), no qué se dibuja.
- **Una librería de gráficos (D3, Chart.js).** Rompería «arranca sin internet»,
  añadiría peso y dependería de CDN. Los SVG propios ya funcionan; solo hay que
  arreglarles el texto.
- **Un carrusel o pestañas para los 10 gráficos.** Esconde contenido y pelea con
  el runtime x-dc. El scroll con fases (B) da avance sin ocultar.
- **Nombres de perfil tipo «conservador/moderado».** MiFID (innegociable 3):
  seguimos con rótulos-hecho «10 % bolsa».
- **Color como único portador de significado.** Innegociable de daltonismo:
  cada serie lleva cifra y etiqueta.
- **Tocar los `!important` y el padding del armazón (F4).** Fuera de
  `#laboratorio`; anotado, no tocado.

## 8 · Antes de implementar (cuando apruebes)

1. Los prototipos son estáticos: al llevarlo a producción hay que respetar las
   trampas del runtime x-dc (cableado dentro del bloque, nada de `<span>` en SVG,
   `[hidden]{display:none}`, `defaultValue` en campos).
2. `check-lenguaje.mjs` exige ciertas frases presentes: al mover «Fuentes y
   límites» y el glosario, comprobar que «base de datos NUVIA», «nunca se
   inventa», «no es una previsión», «renta variable», «describe dónde está hoy»
   siguen en su fichero. Verificado en la auditoría; re-verificar tras mover.
3. Cada cambio con su prueba: si añado una comprobación (p. ej. «texto SVG ≥ 12 px
   efectivos»), la rompo a propósito primero.
4. `npm run validate` en verde es condición de salida.

## 10 · Decisiones de Óscar (22-08-2026) — cierran el §9

1. **Dirección B**, sobre el banner de entrada actual (Innegociable 9) y con la
   identidad NUVIA de los tokens: resumen «de un vistazo» + rótulos de fase
   Composición · Riesgo · Futuro. A queda como variante de mínimos, C descartada
   (Innegociable 10). Color del banner: **sin tocar** salvo el suelo de 12 px y
   la escala de P13.
2. **El simulador por clases baja al final, plegado**, como «banco de pruebas».
   Ya recogido en §2 (paso 7) y en el esquema de §3; queda confirmado, no
   propuesto. Al moverlo hay que re-verificar `check-lenguaje.mjs`: la frase
   «no es una previsión» vive hoy en la lectura de ese bloque.
3. **Autoalojar fuentes (F7): pendiente de tu OK, con recomendación medida
   abajo (§11).**

## 11 · Autoalojar las fuentes: la decisión, con las cifras

> **HECHO el 22-08-2026, sin publicar.** Ver §12 para lo ejecutado y lo medido.

Medido el 22-08 en Chromium real sobre `cartera.html` servida en local
(`tmp-medir-fuentes.mjs`, borrado tras medir):

| Medida | Hoy (Google Fonts por `@import`) |
|---|---|
| Peticiones a dominios de Google | **3** (1 a `fonts.googleapis.com`, 2 a `fonts.gstatic.com`) |
| Peso descargado | **126,4 KB** — CSS 13,6 + Inter latin 47,1 + Fraunces latin 65,7 |
| Momento en que llega el CSS de fuentes | **+296 ms** |
| Momento en que llega el primer `woff2` | **+403 ms** |
| Cadena | HTML → `tokens.css` → CSS de Google → `woff2`: **tres viajes en serie**; el `@import` impide adelantar ninguno |
| Subsets realmente descargados | solo `latin` (el castellano y el euskera caben ahí); los otros 6 subsets no se piden |
| Ficheros por familia | **1 cada una**: son variables, los 3 pesos de Fraunces y los 4 de Inter salen del mismo fichero |
| ¿Se usa Fraunces? | **Sí** — `.nv-portada-lab__marca` resuelve a Fraunces en el render; 14 usos de `--nv-font-serif` en el CSS. No se puede quitar |

**Qué cambia si se autoaloja:** los mismos **112,8 KB** de `woff2` pasan a
servirse desde GitHub Pages junto al resto. Desaparecen la petición del CSS
(13,6 KB), **dos resoluciones DNS + dos handshakes TLS** a dominios nuevos y
**un viaje completo** de la cadena: el `woff2` se pide en cuanto se analiza
`tokens.css`, no después de una segunda hoja. En una conexión buena eso son los
~110 ms medidos entre el CSS y la fuente; en móvil con latencia alta, bastante
más, y es tiempo con el texto pintado en Georgia/`system-ui`.

**Lo que ya no es argumento:** la caché compartida entre sitios de Google Fonts
**no existe desde 2020** (los navegadores la particionan por sitio). Traerla del
CDN no ahorra descarga a nadie.

**Lo que sí pesa, además del rendimiento:**
- **Privacidad.** Hoy cada visita envía la IP del lector a Google sin que el
  portal lo declare: **no hay página de privacidad en el repositorio** (0 de 18
  páginas). Para un portal cuyo valor declarado es la independencia, es
  incoherente. Autoalojar elimina el tercero, no hay que documentarlo.
- **Coherencia con lo ya decidido.** React se autoalojó en su día exactamente
  por esto («el sitio no necesita internet para arrancar»). Las fuentes son la
  única dependencia de tercero que queda en la ruta crítica.

**El coste honesto:** +113 KB en el repositorio y reponer los ficheros a mano
cuando salga una versión nueva de las familias (rara vez). Riesgo bajo,
reversible sin residuo: se quitan los `@font-face` y vuelve el `@import`.

**Recomendación: sí, pero como paso aparte del rediseño.** Toca
`nuvia-tokens.css` y afecta a las 18 páginas, no solo a `#laboratorio`; meterlo
dentro del rediseño mezcla dos cambios con perímetros distintos y hace que una
regresión tipográfica en cualquier página parezca culpa del laboratorio.
Orden propuesto: autoalojar primero (una tarde, verificable bloqueando
`fonts.googleapis.com` en el navegador como ya se hizo con unpkg), y el
rediseño después, ya sobre fuentes propias.

**Opcional, sin prometer cifra:** el `woff2` de Fraunces son 65,7 KB porque
trae el eje óptico completo (`opsz 9..144`). Si se fija ese eje o se recorta el
juego de caracteres, baja bastante — pero eso hay que medirlo antes de
ofrecerlo, no estimarlo.

## 12 · Ejecutado: fuentes autoalojadas (22-08-2026, en el árbol de trabajo, sin publicar)

**Qué se ha hecho**

- Cuatro `woff2` traídos a `estilos/fuentes/`, los mismos que servía Google:
  `inter-latin.woff2` (47,1 KB), `inter-latin-ext.woff2` (83,1 KB),
  `fraunces-latin.woff2` (65,7 KB), `fraunces-latin-ext.woff2` (58,0 KB).
  Un fichero variable por familia y subset: los 3 pesos de Fraunces y los 4 de
  Inter salen del mismo.
- `nuvia-tokens.css`: fuera el `@import`, dentro **14 bloques `@font-face`**
  calcados del CSS de Google — mismos pesos, mismo `font-display: swap`, mismos
  `unicode-range`. Por eso el render no se mueve: un lector en castellano baja
  solo los dos ficheros `latin` (112,8 KB) y los `latin-ext` solo si aparece un
  carácter que los pida.
- `estilos/` se copia entero en `build-site.mjs` (L55), así que
  `estilos/fuentes/` se publica sin tocar el build.

**Tres controles nuevos en `check-static-site.mjs`, y los tres rotos a propósito**

| Control | Roto a propósito | Resultado |
|---|---|---|
| Ningún `@import`/`url()` a Google en las tres hojas | se reañadió el `@import` | **falla** «…vuelve a traer las fuentes de Google» |
| Ningún `<link>`/`preconnect` a Google en el HTML | `<link>` a Google en `temas.html` | **falla** |
| Un `woff2` declarado existe en disco | `inter-latin.woff2` renombrado | **falla** «…y ese fichero no existe» |

Con todo en su sitio, los tres pasan. El primero mira el CSS **sin comentarios**,
así que la nota que explica la migración no dispara la regla.

**Comprobación en navegador real (Chromium, 1440 y 1024 px, 6 páginas)**

Dos pasadas sobre el mismo servidor: **A** con el `tokens.css` de `HEAD` y
Google permitido (el render publicado hoy) y **B** con el nuevo y
`fonts.googleapis.com` + `fonts.gstatic.com` **bloqueados enteros**.

| Comprobación | Resultado |
|---|---|
| Peticiones a Google — pasada A | **36** (control de que la medición mide algo) |
| Peticiones a Google — pasada B | **0** |
| `woff2` pedidos al propio sitio en B | `inter-latin.woff2`, `fraunces-latin.woff2` |
| Inter en uso, no el fallback | 698,11 px de texto sonda frente a 652,89 px de la reserva — **distintos**, en las 12 combinaciones |
| Fraunces en uso donde se usa | 679,78 px frente a 665,27 px de Georgia (index y cartera; en las otras cuatro páginas Fraunces no llega a cargarse porque nada visible la pide) |
| B pinta igual que A | anchos de sonda y geometría de `h1/h2/cabecera/pie` **idénticos** en las 12 combinaciones |

Y la comparación **no se cree a sí misma**: con `inter-latin.woff2` renombrado da
**24 fallos** — «Inter no aparece como cargada» y `inter400: 698,11 ≠ 608,77`.
Esa es justo la trampa en la que cayó la migración de React: dos lados rotos
igual daban 0,000 % de diferencia.

**`npm run validate`: verde.** Pero ojo con el punto de partida — ver §13.

## 13 · Tres cosas que aparecieron al hacerlo (fuera del perímetro salvo la primera)

1. **`npm run validate` estaba EN ROJO en `main` antes de tocar nada**, por un
   solo motivo: `cartera.html @1440 · bajo el suelo 11px «Laboratorio de
   cartera» [nv-portada-lab__seccion]` — el hallazgo **D1/D3** de la auditoría.
   Corregido ya, como primer paso de P13 y porque sin él no hay condición de
   salida: `font-size: 11px` → `var(--nv-label)`, `font-weight: 650` → `600`,
   `margin: 15px` → `var(--nv-space-4)`. La composición del banner no se toca
   (Innegociable 9). Lo demás de P13 —los 48/43 px de `__marca`— se queda para
   la fase B: el auditor no los marca fuera de escala y cambiarlos sí mueve el
   banner.
2. **`company-analysis/` sigue trayendo fuentes de Google** (`index.html:8-11` y
   su `build/`: `preconnect` ×2 y Fraunces + **Roboto Flex**). Es la app de
   «Análisis y valoración de empresas», se compila aparte y está fuera del
   perímetro: el control nuevo la excluye explícitamente. **Anotado, no tocado.**
   Consecuencia real: el portal ya no depende de Google, pero esa sección sí, y
   usa una tercera familia (Roboto Flex) que no está en los tokens.
3. **A 390 px hay cuatro páginas con desbordes, y son anteriores a este cambio.**
   Medido con el árbol guardado (`git stash`) y sin él, mismos números:
   `index.html` **17**, `vivienda.html` **64**, `sistema-visual.html` **21**,
   `mercados.html?vista=cotizaciones` **1**. `cartera.html` pasa a 390 px.
   `npm run validate` no lo ve porque `check-render.mjs` mide **solo 1440 px**
   por defecto (`ANCHOS = process.argv[3] || '1440'`, L43); el móvil nunca ha
   estado en la tubería. Fuera del perímetro: anotado, no tocado.

## 14 · Prototipo de la dirección B (22-08-2026) — referencia aprobable

**`prototipos/laboratorio-cartera-B.html`**, autónomo, sin dependencias, datos
inventados. Escrito de cero: el que había dejado la sesión anterior se descartó
y se borró a petición de Óscar.

### 14.1 · Qué cubre

Siete fases numeradas, cada una con su pregunta en llano: **01** tu cartera
(resumen de cuatro cifras, lista posición a posición, buscador y guardado
plegados) · **02** qué tienes (clases, zonas, mapa) · **03** cuánto se mueve
(recorrido y caídas, riesgo por posición, frontera, perfiles de referencia) ·
**04** apuestas repetidas · **05** escenarios · **06** otras carteras (modelo e
informe de compañía) · **07** cómo leerlo (glosario, supuestos, banco de pruebas
plegado, fuentes y límites).

Decisiones que no estaban en el plan y conviene conservar:

| Qué | Por qué |
|---|---|
| Fraunces en titulares, Inter en todo dato | el emparejamiento que pedía el encargo, sin salirse de los tokens |
| La barra de riesgo por posición lleva una marca fina con el **peso** | contesta «no es lo mismo que el peso» dentro del dibujo: bolsa mundial aporta 46 y pesa 34; los bonos aportan 8 y pesan 22 |
| Glosario en línea con `popover` nativo | definición donde se está leyendo, sin JS |
| «Cuánto se mueve», «borde del abanico», «cuatro mil recorridos» | el nombre técnico (volatilidad, percentil, Montecarlo) vive en el glosario, no en el rótulo |
| Reparto por clases como barra apilada, no anillo | se comparan mejor los tramos y no necesita SVG |
| Cartera de ejemplo cargada, con botón para vaciarla | nadie ve la sección en blanco |
| Recorrido con **784 cierres diarios** | con datos mensuales el promedio se come los mínimos y la peor racha sale más suave de lo que fue |

### 14.2 · Los dos gráficos de producción que Óscar señaló, y sus defectos

**Mapa riesgo-retorno frente a perfiles — cruza dos bases en los mismos ejes.**
`nuvia-analisis.js:884` lo declara en su propio texto: el punto del lector va
con su historial real de tres años y los cinco perfiles salen de
`perfilesReferencia()` (`nuvia-analisis.js:416`), que usa los supuestos de
`CLASES`. El techo de los perfiles es por tanto el 7,0 % de renta variable de la
tabla: **ninguna mezcla puede subir de ahí**. En la captura de Óscar el punto
sale a 22,1 % sobre unos perfiles que llegan a 6,6 %, y el dibujo sugiere una
conclusión que el dato no sostiene. La nota al pie lo aclara; gana el dibujo.
Roza el problema de MiFID sin usar ni una palabra prohibida.

> **Decidido:** en el prototipo las dos series se calculan **con los mismos
> supuestos**. El historial real ya tiene su gráfico —la frontera— y allí se
> compara contra combinaciones de los propios activos del lector, que también
> son historial. Cada gráfico, una base, y una nota que lo dice.
> La alternativa —dar historial a los perfiles— exigiría series de índices que
> hoy no están; esta no necesita ningún dato nuevo.
> Con los supuestos, el reparto de ejemplo (52/22/12/14) da **9,6 % de
> oscilación y 5,3 % de cambio estimado** y cae justo debajo de la línea, entre
> el 50 y el 70 % en bolsa. Los perfiles: 5,3/3,6 · 6,3/4,3 · 8,6/5,1 · 11,4/5,9
> · 14,4/6,6.

**Mapa del mundo — el color no distingue 0 de 22.** África y Oriente Medio sale
pintado con 0,0 % y Oceanía también, las dos en un crema casi idéntico al beige de
Asia (22,3 %). Y un **5,6 % queda fuera del mapa**, contado en una nota al pie.
Un mapa cuyo canal principal es el color y en el que 0 y 22 se ven igual hace de
decoración, no de dato.

> **Corregido en el prototipo:** un tono por continente **solo si hay
> exposición**; los que están a cero van en gris y la leyenda dice «sin
> exposición», no «0,0 %»; lo que no cabe en un mapa se cuenta **antes** del
> dibujo y con su motivo (emisores sin país asignado); y la lectura avisa de lo
> que un mapa no puede hacer — Oceanía ocupa media pantalla y pesa diez veces
> menos que Europa. Siluetas: las del propio repositorio,
> `js/nuvia-mapa-siluetas.js`, así que es el mismo mapa.

### 14.3 · Cuatro defectos de dibujo que solo aparecieron midiendo

Ninguno se ve a ojo y los cuatro son de la misma familia —un elemento colocado
por su caja en lugar de por su dato—, así que **los controles correspondientes
deben entrar en `check-render.mjs` al portar**:

| Defecto | Cómo se detectó | Control que hace falta |
|---|---|---|
| **8 de 9 puntos fuera de su coordenada**, hasta 12,5 puntos porcentuales. El rótulo iba en el flujo del punto, así que el `translate(-50%,50%)` se calculaba sobre círculo + rótulo. «Aquí estás tú» decía 7,2 % y se pintaba en 7,8; «Mayor caída» decía −14,6 y se pintaba en −18 | centro real del círculo contra el valor del eje | toda marca cae donde dice su coordenada (±1,5 pp) |
| **Rótulos que se pisan**: dos perfiles debajo de la píldora de «Tu reparto» | rectángulos de todos los rótulos de cada marco, a los cuatro anchos | ningún rótulo solapa con otro |
| **Texto dentro de un SVG escalado**: el px declarado no es el px que se ve | tamaño **efectivo** = declarado × factor del viewBox | el suelo de 12 px se mide sobre el efectivo |
| **Puntos ovalados**: `<circle>` dentro de un SVG con `preserveAspectRatio="none"` | ampliando la captura | nada circular dentro de un marco estirado |

El detector de choques y el de coordenadas están **probados rompiendo el
prototipo a propósito**: 2 choques por ancho y 8 puntos desviados,
respectivamente, y cero con todo en su sitio.

### 14.4 · Coherencia interna del ejemplo

Al medir la serie diaria salieron dos cifras que se contradecían con el resto de
la página, y las dos venían de dibujar cada bloque por separado:

- el recorrido tenía un bache de fondo tan hondo que, con la volatilidad
  declarada encima, la peor racha se iba al 21,7 %;
- el abanico estaba dibujado con una dispersión del 6,4 % anual mientras la
  cartera dice moverse un 10,8 %: enseñaba un futuro más estrecho del que sus
  propios supuestos permiten.

Se fijó la volatilidad en el 10,8 % —es la que corresponde a un 52 % en bolsa;
bajarla obligaba a rehacer la composición— y se alisó el bache, que era una
elección de guion y no un dato. Calibración iterada seis vueltas porque los dos
parámetros se desplazan entre sí. Resultado: **10,8 % de oscilación, −14,6 % de
peor racha, Sharpe 0,49**, y el abanico redibujado en **87 · 151 · 263**.
Comprobado extrayendo del navegador todas las cifras con decimal visibles: no
queda ninguna huérfana.

**Lección para el porte:** cada gráfico se dibujaba por su cuenta y por eso las
contradicciones sobrevivían. En producción todas las cifras salen de
`nuvia-cartera.js`, así que el riesgo es otro: que un gráfico use una ventana o
una base distinta de la del vecino sin decirlo. Merece una comprobación de que
dos bloques que citan la misma medida citan el mismo número.

### 14.5 · Estado de verificación

A 1440, 1180, 1024 y 390 px: **0 fallos AA, 0 textos por debajo de 12 px
efectivos, 0 tamaños fuera de escala, 0 desbordes, un solo `<h1>`, 0 choques de
rótulo y 0 puntos desviados**. Cero hexadecimales fuera de `:root`, cero
`!important`, cero `span` genérico por descendencia, cero `<text>` dentro de SVG.

### 14.6 · Lo que el prototipo aún no enseña

- «Tu cuenta» (la ventana de `<dialog>`) y los tres niveles visitante /
  registrado / suscriptor: el prototipo enseña el nivel completo.
- El banco de pruebas por clases, desplegado.
- Estados de error: activo sin historial, límite de posiciones alcanzado,
  catálogo no disponible.

### 14.7 · Anotado para el porte, fuera del prototipo

El detalle diario del recorrido depende de que la serie de la base de datos
NUVIA venga con cierres diarios y no resumida. **No lo he comprobado.**

### 14.8 · Un fichero que no es mío

`prototipos/ejemplos-mapas-laboratorio-cartera.html` (24 KB, 22-08 a las 12:35)
apareció después de vaciar la carpeta y no lo creé yo. Pendiente de que Óscar
diga si se queda o se retira.

## 9 · Preguntas para ti (respondidas el 22-08 — ver §10)

1. **Dirección:** ¿B (recomendada, con identidad NUVIA sobre el banner
   actual) o A (mínimos)? C está descartada (Innegociable 10). El banner de
   entrada se mantiene en ambas (Innegociable 9); dime si quieres afinar su
   color o lo dejo como está.
2. **Autoalojar fuentes (F7):** ¿lo incluyo en este rediseño (toca `tokens.css`,
   fuera del perímetro estricto) o lo dejo como tarea aparte?
3. **Simulador por clases:** ¿lo bajo al final como «banco de pruebas» plegado, o
   prefieres que siga arriba como está?

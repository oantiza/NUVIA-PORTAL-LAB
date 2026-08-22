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

**C · Ficha de banca privada** — `?dir=C`. Fondo papel crema en toda la sección,
titulares **Fraunces**, filetes bronce finos: se lee como el informe impreso que
un banquero privado te entrega. Es el más alineado con «imagen NUVIA: sobria,
editorial» del encargo. **El banner de entrada se conserva tal cual** (el
prototipo lo sustituía por una cabecera con filete; corregido por el
Innegociable 9): el banner abre la sección y debajo va la ficha editorial.
*Coste:* medio-alto (Fraunces en más sitios → ver tipografía). *Gana:* identidad;
no se parece a ninguna plataforma de trading.

**El banner es común a las tres:** las direcciones se diferencian de la portada
**hacia abajo**; el banner de entrada es el mismo en A, B y C (Innegociable 9).
Su color puede afinarse (el marino/verde actual, o el tono que prefieras), pero
la pieza no se quita.

**Recomendación:** **C para la piel, con la estructura de B** (fases + resumen),
sobre el banner de entrada actual. La ficha editorial es lo que distingue a
NUVIA; las fases de B son las que resuelven el recorrido. A queda como red de
seguridad si prefieres no mover tipografía.

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

## 9 · Preguntas para ti

1. **Dirección:** ¿A, B, C, o la mezcla recomendada (piel C + estructura B)?
   El banner de entrada se mantiene en todas (Innegociable 9); solo dime si
   quieres afinar su color o lo dejo como está.
2. **Autoalojar fuentes (F7):** ¿lo incluyo en este rediseño (toca `tokens.css`,
   fuera del perímetro estricto) o lo dejo como tarea aparte?
3. **Simulador por clases:** ¿lo bajo al final como «banco de pruebas» plegado, o
   prefieres que siga arriba como está?

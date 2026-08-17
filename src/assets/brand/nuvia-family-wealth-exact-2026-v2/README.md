# NUVIA Family Wealth · familia exacta 2026 V2

Familia derivada directamente del máster horizontal aprobado
`nuvia-family-wealth-horizontal-master-white.png`.

Esta versión no utiliza la reconstrucción vectorial anterior. Conserva los
píxeles, las texturas, las proporciones, la `N`, las tres hojas, el nombre
`NUVIA` y el descriptor `FAMILY WEALTH` del archivo de referencia.

## Logotipos

- `nuvia-family-wealth-horizontal-master-white.png`: máster aprobado intacto.
- `nuvia-family-wealth-horizontal-transparent.png`: extracción transparente.
- `nuvia-family-wealth-horizontal-reversed.png`: aplicación para fondos oscuros.
- `nuvia-family-wealth-vertical-transparent.png`: composición vertical creada
  con el símbolo y el bloque tipográfico extraídos del mismo máster.
- `nuvia-family-wealth-vertical-reversed.png`: composición vertical invertida.
- `nuvia-family-wealth-vertical-master-ivory.png`: vertical sobre fondo marfil.
- `nuvia-wordmark-family-wealth-transparent.png`: bloque `NUVIA / FAMILY WEALTH`.

## Símbolo y aplicaciones

- `nuvia-symbol-three-leaves-transparent.png`
- `nuvia-symbol-three-leaves-reversed.png`
- Aplicaciones circulares y redondeadas sobre fondos claros y oscuros.
- Favicons de 32 y 48 px.
- Apple touch icon, iconos PWA y perfil de YouTube.

## Vista previa

- `vista-previa-familia-exacta-2026-v2.png`

## Formato

El máster aprobado es rasterizado. Para garantizar la máxima fidelidad, esta
familia se entrega en PNG y no se presenta como vectorial. Una vectorización
futura deberá realizarse y aprobarse como un trabajo separado.

## Estado

Familia candidata corregida y **en uso en las 15 páginas del portal** desde
2026-08-17. Válida, pero no definitiva: puede sustituirse.

El README anterior decía que no estaba publicada; los commits de esa misma
mañana sí cambiaron todas las páginas a esta familia, así que la nota había
quedado desfasada.

### Cómo sustituirla

No editar rutas a mano: son cuatro por página en quince páginas, y dejarlo a
medias es fácil.

```bash
node scripts/cambiar-familia-logo.mjs <carpeta-de-la-familia-nueva>
npm run validate
```

El script reescribe favicons, apple-touch-icon y los dos logotipos en todas las
páginas de una vez, y regenera los WebP optimizados. Se niega a actuar si a la
familia destino le falta alguna pieza obligatoria.

`check-consistencia.mjs` bloquea la publicación si alguna página se queda con
una familia distinta a la del resto.

### Derivados generados

Los `<img>` del sitio no usan los PNG máster directamente: usan dos WebP
redimensionados a tres veces su tamaño de presentación.

| Fichero | Uso | Origen |
|---|---|---|
| `logo-horizontal.webp` | Cabecera, 474 px | `…-transparent.png` (700 KB → 26 KB) |
| `logo-horizontal-reversed.webp` | Pie, 372 px | `…-reversed.png` (469 KB → 15 KB) |

Los PNG máster se conservan intactos como fuente.

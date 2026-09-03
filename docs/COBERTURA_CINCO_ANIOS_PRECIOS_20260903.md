# Cinco años de precios · comprobación y contraste con EODHD

Fecha: 3 de septiembre de 2026. Orden del fundador: «carga 5 años de datos
históricos» y aclaración «y a los datos de precios».

## Resultado

**661 de los 698 instrumentos ya cubren cinco años de precios en la base.**
Los otros 37 tienen una serie disponible más corta. Se han vuelto a solicitar
a EODHD desde el inicio objetivo de cinco años: el proveedor no devuelve ningún
punto anterior adicional en ninguno de los 37 casos, sin errores de consulta.

No hacía falta cargar de nuevo los 661 historiales existentes. Tampoco se han
fabricado o duplicado observaciones para completar los restantes: en esta
actuación se han realizado **cero escrituras de precios**. La carga de 71
fundamentales es una operación distinta y sí se ha ejecutado con permiso.

| Tipo | Catálogo | Cobertura de cinco años | Historia más corta |
|---|---:|---:|---:|
| Fondos | 617 | 581 | 36 |
| ETF | 8 | 8 | 0 |
| Acciones | 73 | 72 | 1 |
| Total | 698 | 661 | 37 |

El caso de acciones es TSK: su serie disponible empieza el 13-05-2026.
Esto describe la respuesta recibida; no prueba por sí solo la fecha de
constitución de la empresa ni que otra fuente no conserve información anterior.

## Método y límites

1. Lectura del catálogo vigente de `nuvia-family-wealth`, no del CSV antiguo.
2. Lectura de las 698 fichas, limitada a identidad, moneda, tipo e historial.
3. Inicio objetivo: cinco años naturales antes del último cierre de cada serie.
   No se obliga a los fondos a compartir la fecha más reciente de las acciones.
4. Lectura de metadatos de los documentos anuales de esas ventanas: presencia,
   fechas, moneda y número de observaciones. Se cuenta como cubierta una serie
   que alcanza el inicio y dispone de todos los años correspondientes, con
   observaciones y moneda coherente.
5. Consulta a EODHD de los 37 restantes desde su inicio objetivo. Comparación
   con la primera fecha guardada: cero puntos anteriores nuevos.

La cobertura temporal no certifica ausencia de huecos dentro de cada año ni
equivale a revisar cada cotización contra el emisor. La comprobación general ha
sido de metadatos y documentos anuales; las respuestas de las 37 series cortas
sí se han revisado para buscar ampliaciones disponibles.

## Por qué el análisis mostraba tres años

La base almacena más historia que la ventana utilizada por defecto en el
análisis de cartera. Iberdrola y BBVA ya tienen precios desde el 04-01-2021
hasta el 02-09-2026, aunque el resultado mostrado empezase en septiembre de 2023.

En esta actuación **no se cambia la ventana de cálculo del laboratorio**.
Conservar cinco años y calcular usando cinco años son decisiones distintas;
no se han cambiado fórmulas, métricas ni resultados de cartera por inferencia.

## Evidencia

- Inventario, 698 activos y documentos anuales, 30 peticiones de lectura:
  `output/carga-precios/cobertura-2026-09-03T08-27-12-333Z.json`.
- Contraste de las 37 carencias, sin errores ni puntos anteriores nuevos:
  `output/carga-precios/contraste-eodhd-2026-09-03T08-27-43-171Z.json`.
- Diagnósticos locales: `output/comprobar-cinco-anios-precios.mjs` y
  `output/comprobar-ampliacion-precios.mjs`.

Están excluidos de Git y del sitio. No contienen credenciales ni datos personales.
No se han cambiado catálogo, identidades, reglas, permisos, series ni manifiesto,
ni consultado otros proyectos. Para fundamentales y las dos identidades pendientes:
[Carga autorizada de fundamentales](CARGA_FUNDAMENTALES_AUTORIZADA_20260903.md).

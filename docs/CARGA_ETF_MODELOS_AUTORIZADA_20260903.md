# Alta incremental autorizada · IWDA y VUSA

Fecha: 03-09-2026. Registro de ejecución, sin firma atribuida al fundador.

> Actualización posterior: la revisión P6 detectada en esta carga ya se ha
> [resuelto y documentado](COHERENCIA_METODOS_CARTERA_20260903.md). Las notas de
> revisión pendiente inferiores conservan el estado observado durante la carga.

## Autorización recibida

Consulta: «¿Autorizas incorporar estos dos ETF con sus históricos y actualizar el
catálogo, sin cambiar pesos, otros activos ni publicar la web?».

Respuesta directa del fundador: **«si»**.

Alcance: `IE00B4L5Y983` / `IWDA.AS` y `IE00B3XXRP09` / `VUSA.AS`, EUR, historia
desde 03-09-2021, activos y desgloses disponibles, catálogo/manifiesto. No incluye
datos personales, otros activos, pesos, reglas, Hosting, Git ni publicación web.

## Controles de ejecución

Se aplica la revisión de las 18 preguntas de la
[propuesta comprobada](PROPUESTA_ALTA_ETF_MODELOS_20260903.md). Se mantiene la
revisión interna ámbar y la validación jurídica externa fuera de la alfa.

- Alta incremental; no se ejecuta el pipeline general sobre el CSV parcial.
- Solo lectura antes de preparar el lote; rutas limitadas a los dos ISIN y catálogo.
- Ficha ETF selectiva: sin directivos, personas, contactos, ratings ni previsiones.
- Precios positivos, fechas reales, únicos, ordenados y sin ajustes adicionales.
- Si la fecha específica de las posiciones no consta, queda nula: no se utiliza
  el último cierre de cotización como si fuera la fecha del desglose.
- Dos altas de activos, doce series anuales y desgloses que cumplan contrato.
- Preservar íntegros los elementos anteriores del catálogo y sus alias.
- Escritura atómica, creación solo si el destino no existe y actualización del
  catálogo con su versión comprobada. Sin reintento automático de una escritura
  cuyo resultado sea incierto.
- Verificación posterior de destinos y de las fichas existentes, con huellas y
  versiones. Pruebas de carteras sin cambiar composición ni pesos.

## Resultado

**Carga confirmada y verificada**, 03-09-2026 a las 16:30:38 UTC.

| Instrumento | ISIN | Cotización | Cierres diarios | Cobertura |
|---|---|---|---|---|
| iShares Core MSCI World UCITS ETF USD (Acc) | IE00B4L5Y983 | IWDA.AS, EUR | 1.280 | 03-09-2021 a 02-09-2026 |
| Vanguard S&P 500 UCITS ETF | IE00B3XXRP09 | VUSA.AS, EUR | 1.280 | 03-09-2021 a 02-09-2026 |

El nombre del primero contiene USD; la cotización seleccionada y los precios
cargados son EUR. Se conserva cada `adjusted_close` recibido, sin cambio de precisión.

- **16 documentos creados:** dos fichas, doce series anuales (2021–2026) y dos
  desgloses con diez posiciones cada uno. La fecha específica de las posiciones
  queda nula y advertida porque la fuente no la informa.
- **Cinco documentos de catálogo actualizados:** cuatro fragmentos y manifiesto.
- **21 documentos leídos y comparados después de la escritura.**
- **700 fichas preexistentes sin cambios**, comprobadas por huella y versión:
  los 698 instrumentos del catálogo previo más las dos identidades actuales
  compatibles de Aena/Ferrovial. No confundir este recuento físico con el catálogo.
- Catálogo actual: **700 instrumentos únicos**, 617 fondos, 10 ETF y 73 acciones.
  Alias, elementos anteriores y fechas mínima/máxima preservados.
- Cero eliminaciones, datos personales, cambios de pesos, reglas o publicación.

La escritura se hizo en una sola transacción con precondiciones de existencia y
versión. Se conserva el recibo del commit; no se repite la carga después del éxito.
Dos preparaciones previas fallaron antes de escribir (formato selectivo del proveedor
y verificación del plan). Se hicieron ocho consultas al proveedor en total; la
preparación definitiva reutilizó la respuesta selectiva guardada y no repitió esas
descargas. No se presenta ese intento con cero consultas como el total de la tanda.

## Comprobación de las cuatro carteras

Las cuatro composiciones tienen todos sus instrumentos. La lectura directa de la
base confirma series positivas y finitas, alineadas en la ventana de tres años
que utiliza el análisis, distinta de los cinco años de datos cargados:

| Composición | Series | Cierres comunes | Desde | Hasta |
|---|---:|---:|---|---|
| Bolsa mundial indexada | 4 | 762 | 04-09-2023 | 01-09-2026 |
| Grandes cotizadas españolas | 5 | 765 | 04-09-2023 | 02-09-2026 |
| Value de gestoras independientes | 4 | 744 | 04-09-2023 | 31-08-2026 |
| Mitad bolsa mundial, mitad bonos en euros | 4 | 746 | 04-09-2023 | 01-09-2026 |

Los dos modelos previamente completos conservan sus recuentos y límites.
En el navegador se abrió cada uno de los cuatro análisis con datos reales, sin
guardar una cartera personal. Se mostraron respectivamente 4, 5, 4 y 4 posiciones
con historial y métricas numéricas. Los 761/745 registros de rentabilidades que
muestran las dos carteras afectadas corresponden a 762/746 cierres, no a datos perdidos.

**Incidencias observadas, no ocultadas:**

1. El primer intento de Bolsa mundial dio un aviso de preparación de fichas.
   Las cuatro fichas respondieron correctamente en lectura directa. Tras recargar,
   el análisis se abrió; no se reprodujo el fallo ni se ha demostrado su causa.
   El diagnóstico temporal añadido se retiró: no se atribuye una corrección ficticia.
2. La cartera mixta muestra 11,3 % de cambio anual y 6,7 % de oscilación en el
   resumen, frente a 10,9 % y 6,4 % para «Tu combinación» en la frontera; el texto
   afirma comparabilidad. Se registra una revisión pendiente de coherencia del
   cálculo/ventana/rebalanceo. No se altera la base, los pesos ni las fórmulas para
   hacer coincidir visualmente esos números. Abrir los cuatro análisis no equivale
   a certificar la equivalencia de todos sus paneles.

## Pruebas y límite del cierre

- Seis pruebas nuevas del plan puro: destinos, precondiciones, conservación,
  identidad/divisa, fechas/precios, campos ajenos, datos ausentes y respuesta plana.
- Construcción completa correcta, incluidas las pruebas generales y las nuevas,
  30 vistas a 1440 px y fundamentales a 1440, 1280, 1024, 820 y 768 px. Esta batería
  visual usa red simulada; el recorrido de carteras descrito arriba usa datos reales.
- Paquete final idéntico por ruta, longitud y SHA-256 al ensayo limpio previo:
  **164 archivos y 14.333.649 bytes**. La carga cambia datos remotos, no código de interfaz.
- CSV: añadidas solo dos filas, 727 filas y 163 inclusiones. Sigue siendo un
  universo local parcial frente a los 700 instrumentos remotos: no usarlo para
  reconstruir o reemplazar todo el catálogo. Los seis componentes previamente
  cargados con `no` en CSV siguen sin modificar; su reconciliación es otra tarea.
- No se ejecutaron commit, fusión, push, GitHub Pages ni Firebase Hosting.

La carga autorizada queda cerrada. Permanece abierta la revisión numérica indicada,
además de los asuntos de proveedor, identidad/editorial, entrega y vídeo del saldo
[consolidado](CIERRE_PENDIENTES_CONSOLIDADO_20260903.md).

## Evidencias locales

En `output/carga-etf-modelos/` (no publicable):

- `preparado-2026-09-03T16-29-43-387Z.json`.
- `plan-2026-09-03T16-30-38-877Z.json`.
- `commit-2026-09-03T16-30-39-500Z.json`.
- `resultado-2026-09-03T16-30-40-138Z.json` (estado `verified`).
- `build-despues-carga.log`.

Lectura independiente: `output/cierre-alfa/base-solo-lectura-2026-09-03T16-30-53-755Z.json`.
La verificación visual manual consta en la conversación; no se inventa un archivo
de capturas que no se haya guardado. Los registros de preparación y fuentes quedan
fuera de Git y del paquete web.

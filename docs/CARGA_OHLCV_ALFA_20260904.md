# Carga inicial OHLCV · resultado verificado

Fecha: 04-09-2026. Proyecto: `nuvia-family-wealth`.

## Autorización y alcance

El fundador respondió «Si» a la consulta expresa para añadir velas y volumen de
las 73 empresas existentes, con hasta cinco años disponibles, sin modificar
cierres ni fundamentales. La respuesta consta en esta conversación y en
[preparación OHLCV](PREPARACION_OHLCV_ALFA_20260904.md), incluida su revisión §12.
Se registra la respuesta; no se firma por el fundador.

Esta actuación no modifica permisos, reglas, servicios, catálogo, datos personales,
cuentas, despliegues ni tareas periódicas. No publica la web ni confirma cambios
en Git. Tampoco incorpora PER estimado, BPA previsto o dividendos estimados.

## Preparación y resultados

| Comprobación | Resultado |
| --- | --- |
| Empresas existentes, identidad actual y EUR comprobadas | 73 |
| Descargas nuevas del endpoint diario EODHD | 73 |
| Ventana solicitada | 01-01-2021 a 03-09-2026 |
| Registros OHLCV | 104.356 |
| Cierres existentes comparados, redondeo de origen a seis decimales | 104.283 |
| Discrepancias de cierres / incidencias estructurales | 0 / 0 |
| Última fecha disponible en las 73 descargas | 03-09-2026 |
| Destinos nuevos comprobados antes de cargar | 511, todos ausentes |
| Documentos anuales creados | 433 |
| Manifiestos creados | 73 |
| Total creado y verificado por lectura | 506 |
| Operaciones atómicas de escritura en Firestore | 73, una por empresa |
| Documentos protegidos existentes, sin cambios | 584 |
| Rutas protegidas ausentes, conservadas ausentes | 5 |
| Documentos preexistentes sobrescritos / eliminados | 0 / 0 |

La ventana incluye meses de preparación de los indicadores anteriores a los
cinco años visibles. No se fabrica cobertura: Acciona Energía comienza el
01-07-2021 y TSK el 13-05-2026; TSK tiene 82 observaciones. Para TSK se crea
solo 2026 y su manifiesto, no cinco años vacíos. El resto conserva los datos
efectivamente suministrados por el proveedor.

## Preservación y trazabilidad

Se escribieron exclusivamente `assets/{ISIN}/ohlcv/{año}` y
`assets/{ISIN}/ohlcv_manifest/current`, con precondición `exists:false`.
Cada empresa agrupa años y manifiesto en una única transacción. Las revisiones
se obtienen mediante SHA-256 de identidad, fecha de descarga y puntos; el
manifiesto incluye además la huella de cada documento anual.

Se tomaron huellas de contenido y `updateTime` antes de cargar y se repitieron
al terminar: 73 fichas de activo, 73 fundamentales, 433 series anuales existentes
y cinco documentos de catálogo. Sus 584 huellas permanecen iguales. Las cinco
rutas anuales sin historial de TSK permanecen ausentes en la colección antigua.
Las transacciones también releyeron los documentos protegidos de cada empresa
y el catálogo antes de crear sus destinos. No se ejecutó el pipeline general.

Aena y Ferrovial utilizan las identidades actuales ya aprobadas; no se modifican
alias ni se vuelven a ajustar los cierres guardados. Los datos OHLC originales
son sin ajustar; `adjusted_close` incorpora los ajustes del proveedor; el volumen
se conserva ajustado por splits tal como se recibió. Solo se guardan siete
campos por observación, más metadatos técnicos de procedencia. ATR no es un dato
importado: su cálculo local y conexión visual siguen pendientes de integración.

La nueva descarga incorpora una sesión adicional por empresa. **Las colecciones
antiguas de cierres no se han actualizado al día 3**: permanecen intactas y la
pantalla existente todavía las utiliza. La integración debe mostrar las fechas
de cada conjunto y no presentar el nuevo corte como actualización del anterior.

## Validación

- 70 pruebas del módulo y compilación Vite correctas, incluyendo cuatro pruebas
  nuevas de carga y cuatro de proyección/ATR. Se repitieron las 17 pruebas de
  técnico, preparación y carga después de la escritura.
- Lectura posterior de los 506 documentos: igualdad completa con el lote previsto.
- Lectura anónima del manifiesto y documento 2026 de Iberdrola, Aena y Ferrovial:
  seis respuestas correctas y revisiones coincidentes, sin desplegar reglas.
- Sin pruebas visuales nuevas de velas: aún no están conectadas a la interfaz.
- Aviso local actualizado a «pendientes de integración en esta vista», evitando
  afirmar que la base carece de los datos que ya se han cargado.

La validación acredita estructura, correspondencia y preservación; no constituye
una auditoría independiente de la exactitud económica del proveedor.

## Evidencia local y repetición segura

Archivos ignorados por Git en `output/carga-ohlcv/`:

- `preparado-2026-09-04T01-25-17-509Z.json`: entradas, datos por lista blanca,
  huellas protegidas y comparaciones; no contiene credenciales.
- `dry-run-2026-09-04T01-25-17-567Z.json`: inventario y alcance exacto.
- `recibo-{símbolo}-{fecha}.json`: 73 recibos de creación, sin datos de sesión.
- `resultado-2026-09-04T01-26-59-443Z.json`: verificación global completa.

Escritor: `scripts/load-company-ohlcv.mjs`. Proyección acotada:
`scripts/mercado-alfa/ohlcv-load.mjs`. `prepare` solo lee; `apply` crea y no
sobrescribe ni reintenta commits. **No repetir `apply` sobre la carga realizada**.
`verify` permite comprobar de nuevo el lote sin escribir:

```powershell
node scripts/load-company-ohlcv.mjs verify output/carga-ohlcv/preparado-2026-09-04T01-25-17-509Z.json
```

Si los datos protegidos cambian posteriormente, la verificación lo señalará;
no atribuye automáticamente ese cambio a esta carga ni restaura datos antiguos.

## Siguiente paso

Conectar un lector independiente con validación de identidad, revisión, cobertura
y coherencia; incorporar selector línea/velas, volumen, ATR y tabla de originales
y derivados; comprobar errores, cambios de empresa, escritorio, tableta e
impresión. Actualización periódica y publicación requieren su orden específica.

Actualización posterior: la orden «Go» dio paso a la
[integración local de velas, volumen y ATR](INTEGRACION_TECNICO_OHLCV_ALFA_20260904.md),
ya realizada y comprobada. Esta actuación posterior no reescribe la carga.

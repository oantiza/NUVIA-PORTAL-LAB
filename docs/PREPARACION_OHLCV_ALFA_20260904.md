# Preparación de velas, volumen y ATR · alfa

Fecha: 04-09-2026. Orden: «sigue». Preparación local, no autorización de escritura.
Se conserva la recuperación de Técnico aún sin confirmar ni publicar.

## Revisión previa · marco §12

1. Completar la lectura histórica del rango diario y el volumen.
2. Cotizaciones de las 73 empresas del índice existente, elegidas por el usuario.
3. Validación de OHLCV; ajuste explícito por cociente de cierres; ATR de Wilder.
4. Valores descriptivos y trazabilidad, nunca instrucciones de operar.
5. Emisores concretos: revisión interna ámbar, mismo perímetro de empresas.
6. Sin circunstancias personales.
7. Sin sugerencias de comprar, vender o mantener.
8. Sin opiniones de valor futuro.
9. Sin puntuaciones ni ordenación por atractivo.
10. Sin recomendaciones ajenas ni indicadores de consenso.
11. Colores identifican series y diferencias aritméticas, no veredictos.
12. Sin contratación, ejecución, contactos ni alertas operativas.
13. Sin nuevos patrocinios ni remuneración.
14. Solo datos de mercado propios del proyecto, sin sistemas profesionales.
15. Sin datos personales ni escrituras remotas en esta preparación.
16. Sin IA en el cálculo ni la salida de la web.
17. Fuente, fecha, precio original frente a derivado y fórmula explícitos.
18. Pruebas de orden, fechas, nulos, rangos, divisiones, ajustes y discontinuidades;
    dry-run sin escritor y comprobación posterior de destinos antes de cargar.

## Decisión técnica propuesta

Conservar las series actuales `assets/{ISIN}/series/{año}` y sus cierres ajustados.
No sustituirlas por precios sin ajustar ni mezclar los dos tipos en un indicador.

Añadir, después de autorización, documentos anuales separados:
`assets/{ISIN}/ohlcv/{año}`, con una cabecera de versión en
`assets/{ISIN}/ohlcv_manifest/current`. Las reglas locales existentes ya permiten
leer subcolecciones de assets; no se propone desplegar ni ampliar reglas.
Comprobar el acceso real y la ausencia de cada destino antes de escribir.

Cada fila conserva exactamente los siete campos: fecha, apertura, máximo, mínimo,
cierre, cierre ajustado y volumen. El volumen ausente es null, no cero. Las velas
con OHLC ausente se registran como incidencias; no se fabrican con el cierre.

La documentación del [endpoint EODHD](https://eodhd.com/financial-apis/api-for-historical-data-and-volumes)
indica OHLC sin ajustar, cierre ajustado por splits y dividendos, y volumen
ajustado por splits. Para mantener la escala de la línea existente se propone
calcular en el navegador `OHLC ajustado = OHLC × adjusted_close / close`, con
etiqueta de **serie derivada**, no precio negociado original. El volumen se
conserva tal como lo entrega el proveedor, sin volver a ajustarlo. ATR se calcula
sobre esa misma serie derivada, sin mezclar cierres o versiones de otra descarga.

Esto no reconstruye máximos ni mínimos a partir de un cierre: requiere OHLC real
y aplica a cada dato un factor declarado. Se mantienen en la tabla los originales.
Si el nuevo cierre ajustado difiere del almacenado más allá de su redondeo a seis
decimales, la discrepancia se presenta al fundador: no se reescribe el histórico
ni se superponen silenciosamente las series divergentes.

## Alcance que requiere autorización

Hasta cinco años visibles, con preparación desde enero de 2021 y corte inicial
03-09-2026, o historia disponible si la empresa es más reciente. Solo las 73
identidades del índice actual; no fondos, ETF ni nuevos instrumentos. Máximo
teórico: seis documentos anuales más un manifiesto por empresa, 511 creaciones;
el inventario definitivo debe reflejar la cobertura real y los destinos existentes.

Carga incremental por empresa, manifiesto y años de una misma revisión en una
operación atómica. No se sobrescribe un destino preexistente sin revisar y
autorizar ese caso. Conservar huellas del histórico y comprobarlas tras cargar.
No tocar fundamentales, catálogo, reglas, cuentas, backend existente ni publicación.

La autorización de esta ampliación no se presume de «sigue». Se pedirá al fundador
antes de ejecutar cualquier escritura remota. Mientras tanto se preparan código
puro, pruebas y auditoría local sin modificar la interfaz ya funcional.

## Resultado de la preparación

- Índice: 73 empresas. Caché de precios encontrada en la ubicación actual para
  53, con **75.270 registros**. Las 53 pasan los controles estructurales y el
  cálculo local de ajuste y ATR. En esas filas no hay volumen nulo ni cero.
  Esto no acredita exactitud económica ni actualidad: son descargas previas.
- Veinte cachés no están en esa ubicación. No implica falta de cobertura en el
  proveedor ni en Firestore. Se deberán obtener los datos con identidad verificada.
- TSK solo dispone en esa caché de 13-05-2026 a 01-09-2026. Se conserva su
  historia corta; no se rellenarán años anteriores a su cotización disponible.
- Muestra viva del proveedor: Aena, 16–20 de junio de 2025. El cierre sin ajustar
  pasa de 231,2 el 18 de junio a 22,74 el 19; sus cierres ajustados son 22,1477
  y 21,7837. Es evidencia concreta de por qué no deben mezclarse ambas escalas.
  Una consulta EODHD; no se guardó esa respuesta en la base.
- Seis GET de comprobación remota: año 2026 y manifiesto de Iberdrola
  (`ES0144580Y14`), Aena (`ES0105046017`) y Ferrovial (`NL0015001FS8`). Los seis
  destinos propuestos no existen y responden como ausencia. No es un inventario
  de todos los años ni de las 73 empresas; ese inventario sigue siendo necesario.
- Cero escrituras remotas, cambios de reglas, credenciales, permisos, catálogo,
  identidad, fundamentales o series de cierres. Cero commits y publicaciones.

### Código preparado, no conectado todavía a la interfaz

- `company-analysis/alfa/ohlcv.mjs`: proyección por lista blanca a documentos
  anuales, originales sin modificar; tratamiento del volumen ausente como null;
  derivación explícita de velas ajustadas y cálculo ATR de Wilder.
- ATR: primer rango verdadero = máximo − mínimo; primera media de 14 rangos,
  después `(ATR anterior × 13 + rango verdadero) / 14`. Historial insuficiente
  = null. Reinicio después de un salto de más de diez días naturales. Se tolera
  únicamente el error de representación numérica en comparaciones de velas
  derivadas; no se reparan rangos incoherentes de la fuente.
- `scripts/check-ohlcv-preparation.mjs`: auditoría reproducible de archivos
  locales. No importa clientes de red ni un escritor remoto. Guarda únicamente
  recuentos, fechas, huellas y resultados de control en output, ignorado por Git.
- Cuatro pruebas nuevas: campos permitidos, nulos/ceros, fechas/orden, identidad,
  moneda, rangos, split, conservación del volumen, ATR manual e historial corto.
  **66/66 pruebas** de la compilación del módulo correctas; Vite correcto.
  La prueba de ajuste usa datos sintéticos y no certifica el historial del proveedor.

Evidencia: `output/ohlcv-preparation/audit-2026-09-04T01-15-43-627Z.json` y
`output/ohlcv-preparation/build.log`. El paquete visible no añade aún velas o ATR.

## Secuencia tras la autorización

1. Fijar el listado de las 73 identidades y verificar activo, símbolo y EUR.
2. Obtener una descarga coherente desde 2021 hasta el corte acordado, sin personas
   ni campos ajenos; no presentar las cachés antiguas como recién descargadas.
3. Inventariar todos los destinos. Crear solo los ausentes; cualquier colisión
   o divergencia de cierres se informa antes de sobrescribir o mezclar datos.
4. Preparar el lote exacto, huellas, recuentos, tamaño por documento y manifiesto
   por empresa. Implementar escritor de alcance limitado, sin pipeline general
   que pueda reconstruir el catálogo a partir de un subconjunto.
5. Cargar cada empresa de forma atómica con precondiciones de creación. Verificar
   por lectura que coincide con el lote y que los datos protegidos no cambiaron.
6. Conectar el lector independiente, selector de línea/velas, volumen, ATR,
   originales y derivados en tabla; comprobar errores y cambios de empresa.
7. Repetir cálculos, escritorio/tableta e impresión. Acreditar claramente la
   fecha de cada conjunto, sin comparaciones entre revisiones incompatibles.
8. La actualización periódica y la publicación se acordarán aparte; no activar
   una tarea automática ni desplegar servicios por autorizar la carga inicial.

**Consulta al fundador:** autorización para crear los documentos OHLCV y sus
manifiestos de estas 73 empresas, con cinco años disponibles y preparación previa,
sin modificar los cierres ni los fundamentales existentes y sin datos personales.
Estado de la consulta: **autorizada por respuesta directa «Si» del fundador,
04-09-2026**, a la pregunta de añadir velas y volumen de las 73 empresas con
hasta cinco años disponibles, sin modificar cierres ni fundamentales existentes.
Se registra su respuesta, sin firmar por él. La autorización se limita a crear
OHLCV y manifiestos; no incluye catálogo, reglas, datos personales, actualización
automática, publicación ni sobrescritura de otros datos.

## Resultado posterior a la autorización

Carga inicial ejecutada y verificada el 04-09-2026. Véase el
[acta de carga](CARGA_OHLCV_ALFA_20260904.md): 73 empresas, 104.356 registros,
506 documentos creados y 584 documentos anteriores conservados. Las menciones
de preparación sin escrituras anteriores describen la fase previa, no el estado
actual. La integración de velas, volumen y ATR en pantalla continúa pendiente.

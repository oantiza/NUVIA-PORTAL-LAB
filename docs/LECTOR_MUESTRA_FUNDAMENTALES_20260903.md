# Lectura y presentación local de la muestra de fundamentales

**Alcance actualizado por orden posterior del fundador (03-09-2026):** validación
jurídica externa fuera de la alfa, sin efecto bloqueante; [marco v1.1 §0](MARCO_REGULATORIO_OBLIGATORIO.md).
Esta regla sustituye las referencias a esa puerta externa en el registro de abajo.
Los bloqueos de importes por metadatos, identidad, controles técnicos y autorizaciones
para base/backend o publicación se mantienen. La muestra no se activa con esta nota.

Fecha: 3 de septiembre de 2026. Alcance: preparar y comprobar un lector local
de la muestra ya generada. No integrar con Firebase ni publicar.

## Revisión previa obligatoria (1–18)

1. Necesidad: comprender qué datos históricos pueden presentarse sin ocultar sus límites.
2. Entrada: muestra local fija, evidencia del catálogo y archivos que acreditan sus huellas;
   el usuario elige una de las seis empresas, sin selección por mérito financiero.
3. Transformación: validar contrato e identidad, proyectar únicamente campos permitidos;
   bloquear importes sin moneda/escala y distinguirlos de valores inexistentes.
4. Resultado: tablas locales, fechas completas, ratios de la copia y limitaciones visibles.
5. Emisores identificables: sí; clasificación ÁMBAR, no autorización de publicación.
6. Circunstancias personales: ninguna.
7. Sugerencias de operar: ninguna.
8. Opinión sobre valor/precio: ninguna; ratios descriptivos atribuidos al proveedor.
9. Orden: alfabético; no ranking, señal ni atractivo financiero.
10. Recomendaciones ajenas: excluidas por el contrato y la proyección positiva.
11. Interfaz: estado de calidad del dato, sin semáforos de inversión. Cero se conserva.
12. Acción: solo lectura y selección local, sin contacto, contratación ni ejecución.
13. Remuneración/licencia: sin cambios; los derechos de difusión siguen pendientes.
14. Separación profesional: ningún sistema ni información bancaria; puertas anteriores vigentes.
15. Datos personales: ninguno; sin cuentas, persistencia, nube ni telemetría.
16. IA: no interviene en la salida ni completa campos.
17. Fuente: huellas verificadas, fecha de lectura y de catálogo diferenciadas de descarga,
   actualización del proveedor y cierres. No se presentan ratios como datos de hoy.
18. Pruebas: contrato, identidad, integridad, duplicados, fechas, bloqueo de importes,
   ausencia/cero, rutas locales y revisión de escritorio/tablet en navegador.

## Decisiones previas a programar

La nueva vista es independiente de la prueba inicial del archivo, accesible desde
la misma entrada local mediante un enlace explícito. No reemplaza el catálogo ni
el lector de la alfa. Utiliza una ruta local nueva, sin SDK ni conexión de base.

El servidor verifica las huellas de muestra, revisión, catálogo y crudos; valida
registros e identidad y solo entrega una proyección segura. No sirve los JSON
originales. Ante ausencia, manipulación o incoherencia muestra indisponibilidad
sin volver silenciosamente a los datos de la prueba anterior.

Sin escala o moneda, el importe no se envía a la vista: estado «Pendiente» con
motivo. Un dato inexistente aparece «Sin dato»; un cero válido no desaparece.
Los estados conservan sus cierres individuales y no generan gráficos combinados.
Los ratios se etiquetan como instantánea archivada, con periodo desconocido cuando
corresponda; nunca se consideran actuales por la fecha de lectura local.

No hay valoraciones propias, estimaciones, rankings, exportación ni publicación.
Esta revisión interna acota el desarrollo local; no sustituye validación jurídica
o de compliance ni las conformidades profesionales aplicables antes de publicar.

## Entrega implementada

La vista está disponible en el servidor de prueba:
`http://127.0.0.1:18792/local.html?revision=1`.

Se abre también desde el enlace «Abrir la muestra revisada con control de importes»
de la entrada inicial. Esta última conserva el archivo de 54 empresas, con un
aviso explícito de que no está normalizado ni validado para integración. La nueva
vista usa exclusivamente las seis empresas de la muestra: no incorpora Ferrovial,
Siemens Gamesa ni Santander por un mecanismo alternativo.

La cabecera mantiene la tipografía y la gama de la prueba local; se han ajustado
espaciados, tamaño de tablas, foco de teclado y lectura en tablet. No se ha
rediseñado la web publicada ni añadido una versión móvil.

### Resultado de la lectura real

| Control | Resultado |
|---|---:|
| Empresas de la muestra | 6 |
| Registros normalizados leídos | 90: 84 anuales y 6 instantáneas de ratios |
| Celdas monetarias posibles | 420 |
| Celdas bloqueadas por metadatos | 406 |
| Celdas sin cifra en la fuente | 14 |
| Importes monetarios enviados por la ruta revisada | 0 |

Las cifras monetarias bloqueadas no llegan ocultas en el HTML: se sustituyen por
un valor nulo y un motivo en la proyección entregada al navegador. Esto se aplica
a la ruta revisada, no es una afirmación sobre el archivo inicial independiente.
Los ratios archivados sí se muestran, con fecha del proveedor, fecha de lectura
local, descarga desconocida y periodo no informado cuando corresponde.

- **Pernod Ricard:** balance 30/06/2026 sin moneda; resultados y caja 30/06/2025.
  La interfaz avisa de los cierres distintos y conserva la fecha de cada columna.
- **Prosus:** moneda de cotización EUR separada de estados USD.
- **TSK:** nueve celdas sin cifra, fechas de presentación ausentes y aviso sobre
  la codificación del nombre, sin cambiar el texto de la fuente.
- **Solaria:** cinco dividendos pagados «Sin dato», no cinco dividendos cero.
- **Intesa:** aviso de pertinencia e interpretación sectorial pendientes.
- **Iberdrola:** el hecho de no tener huecos numéricos en la muestra no permite
  mostrar los importes mientras falte la evidencia de escala.

## Verificación y ausencia de sustituciones

El lector comprueba las huellas de `muestra.json`, `revision.json`, la evidencia
del catálogo y los archivos fuente. Reconstruye la normalización desde los crudos
y compara sus registros con los archivados. Cambiar una cifra y rehacer solo el
manifiesto de la muestra no basta para pasar esa comprobación.

Se validan versión, listas de campos, identidad, fechas, registros duplicados y
fuentes mezcladas. Ante fallo, se devuelve «Muestra no disponible», sin datos
de empresa ni rutas internas. No se vuelve al backend anterior, al proveedor
ni a la proyección del archivo inicial. Un fallo de lectura no se presenta como
un catálogo vacío correctamente cargado.

Estas huellas son controles de integridad local, no firma del proveedor ni prueba
de exactitud contable. El contrato sigue siendo un borrador, y `state: ready`
significa «proyección local disponible», nunca «autorizado para publicar».

## Pruebas ejecutadas

- **15 pruebas nuevas del lector**, más 15 de normalización, 10 de contrato y
  14 de recuperación: **54 pruebas superadas**. Incluyen manipulación, ficheros
  ausentes, muestras futuras, origen/solo lectura, exclusión de importes,
  desbordamiento numérico, duplicados, nulos/cero y render de React.
- Relectura de la muestra real: seis empresas, 90 registros, 406 celdas bloqueadas,
  14 ausentes y ningún importe monetario liberado por la proyección revisada.
- Navegador: selección de las seis empresas y comprobación de sus limitaciones.
  **30 combinaciones** (6 empresas × 1440, 1280, 1024, 820 y 768 px), sin
  desbordamiento horizontal de página, títulos cortados ni tablas desbordadas
  en el resultado final. Revisión visual de escritorio y tablet.
- Teclado: selección con Enter y foco accesible de las tablas. Enlaces de ida
  y vuelta entre archivo inicial y muestra revisada comprobados.
- Consola del navegador: sin errores de la aplicación; mensajes normales de
  desarrollo y reinicio del servidor durante la actualización.
- Puerta de empresas (18 archivos), privacidad, paridad, referencias estáticas y
  lenguaje: superadas. Consistencia: sin errores, con cuatro avisos previos sobre
  guía de impuestos e imágenes de portada, ajenos a esta entrega.

Las pruebas sintéticas verifican también cómo conservar cero y cantidades negativas
si una futura entrada aporta unidades acreditadas. No certifican que esas unidades
se hayan obtenido para la muestra real: sus 84 registros anuales mantienen escala nula.

## Uso y repetición

Desde la carpeta oficial:

```powershell
npm run dev:empresas-local
```

Después abrir `http://127.0.0.1:18792/local.html?revision=1`.
La lectura se realiza al arrancar el servidor. Tras cambiar archivos o el lector,
reiniciar la prueba; «Reintentar lectura» vuelve a pedir la proyección cargada,
no descarga datos ni recarga por su cuenta los crudos del disco.

La carpeta de muestra está fijada a la ya revisada:
`output/fundamentales-muestra/2026-09-03-SrbBSW/`.
No se escoge automáticamente la carpeta más reciente. Si falta, se muestra
indisponibilidad; una muestra nueva requiere revisión antes de sustituirla.

Prueba nueva: `npm run test:fundamentales-lector`. Para repetir toda la batería:

```powershell
node --test --test-concurrency=1 docs/nuvia-empresas-local.test.mjs docs/nuvia-fundamentales-contrato.test.mjs docs/nuvia-fundamentales-muestra.test.mjs docs/nuvia-fundamentales-lector.test.mjs
```

Se usa ejecución secuencial para que los dos renders de desarrollo no compitan
por el puerto interno de su entorno de pruebas.

## Qué sigue pendiente

No se ha consultado ni modificado Firebase, descargado nuevos fundamentales,
activado la alfa, ejecutado la compilación completa, publicado o confirmado
cambios en Git. Solo se reinició el servidor de prueba local de esta tarea.

La siguiente integración sigue dependiendo del informe de incidencias preparado
para el responsable de la base: contrato real de lectura, identidad, escalas,
fechas y cobertura. No se contactó con él ni se resolvieron estos puntos por
suposición. Esta entrega permite comprobar la presentación y el bloqueo antes
de disponer de esas respuestas; no convierte la base en definitiva ni la
función en publicable.

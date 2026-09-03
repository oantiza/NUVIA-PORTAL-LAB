# Paso 2 · Cobertura institucional

03-09-2026. Continuación uno por uno tras aplazar P2 por orden del fundador.

## Alcance y revisión §12

Necesidad: distinguir ausencia real de datos, limitación del proveedor y fallo
de integración. Entrada: `Holders::Institutions` filtrado; no circunstancias del
usuario. Salida: únicamente estado y recuentos. No se guardan ni muestran nombres,
contactos, operaciones, recomendaciones o estimaciones. No se cambia la base,
la interfaz, la clasificación de empresas, los permisos ni el orden del catálogo.
La aplicación alfa conserva el porcentaje agregado ya cargado. Las pruebas impiden
serializar nombres y distinguen `NA`, vacío, inválido y con filas.

## Evidencia previa

Las 73 identidades del índice se consultaron y verificaron: 73 respuestas
`Holders::Institutions = NA`, ninguna fila, ningún error de identidad o formato.
El informe persistido contiene solo recuentos. Esto demuestra ausencia en esa
consulta concreta, no que el producto de EODHD carezca siempre de esta sección.

El glosario público documenta `Holders::Institutions` y sus campos; describe la
plantilla como común a mercados estadounidenses y no estadounidenses, salvo
excepciones expresas que no incluyen Holders. Se realizará un control mínimo con
un símbolo estadounidense y otro europeo, conservando solo recuentos.

## Resultado del control

Con la misma credencial, endpoint y filtro:

- `AAPL.US`: 20 filas, todas con fecha y porcentaje legibles.
- `VOD.LSE`: marcador `NA`, sin filas.

Evidencia de recuentos:
`output/cierre-alfa/instituciones-control-2026-09-03T17-15-20-227Z.json`.
Dos solicitudes al proveedor, cero escrituras y ninguna respuesta o nombre
persistidos. Dos pruebas sintéticas comprueban el filtrado y los estados.

Esto descarta un fallo general de credencial, endpoint, filtro o lector: la misma
ruta entrega filas institucionales para el control estadounidense. El resultado
de Vodafone coincide con las 73 identidades europeas del índice. La evidencia
apoya una carencia de cobertura nominal para este universo europeo en el producto
y endpoint utilizados; no permite afirmar que ningún otro producto o fuente de
EODHD tenga esa cobertura.

## Decisión técnica aplicable a la alfa actual

La entrada alfa no utiliza `Holders::Institutions`: su contrato positivo conserva
únicamente `PercentInstitutions` y `PercentInsiders`, y la vista activa muestra
esos porcentajes agregados. El componente original que podía presentar nombres
no forma parte del flujo de datos alfa. Por tanto:

- no hay un error de integración que reparar;
- no se crea una tabla nominal vacía ni se convierte `NA` en cero;
- no se guarda ningún nombre de institución o persona;
- se mantienen los porcentajes agregados existentes;
- una lista nominal futura exigiría elegir una fuente con cobertura, definir su
  contrato y solicitar autorización antes de cualquier persistencia.

P3 queda cerrado para el alcance actual de la alfa como **dato nominal no
disponible en la fuente utilizada**, sin bloquear el módulo. No requiere esperar
una respuesta de soporte para publicar lo ya desarrollado. Puede reabrirse como
ampliación de producto si el fundador decide incorporar otra fuente o cobertura.

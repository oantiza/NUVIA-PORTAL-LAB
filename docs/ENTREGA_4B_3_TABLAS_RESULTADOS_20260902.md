# Entrega 4B · Bloque 3: tablas y resúmenes de resultados

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local; sin publicar.

## Alcance

Presentación y accesibilidad de las tablas existentes de Vivienda, cotizaciones
ilustrativas de Mercados, guías comparativas y tablas comunes del laboratorio.
Roles tipográficos para cifras de resultados, sin cambiar su precisión, unidad,
signo, fórmula, fuente, orden o significado. Escritorio y tablet: 768–1440 px.
Se preservan la portada, los gráficos y los mecanismos de guardado.
Firebase/Firestore, la base nueva, sus archivos y el módulo de empresas quedan
fuera. No se compila ni publica.

## Ficha regulatoria previa

1. Necesidad: leer y comparar datos y explicaciones sin cortes o desalineaciones.
2. Datos: exactamente los existentes, con la selección actual del usuario.
3. Transformación: geometría, tipografía, etiquetas accesibles y desplazamiento.
4. Salida: mismos datos, filas, columnas y mensajes de ausencia.
5. Instrumentos: Mercados ya muestra compañías; no se añaden ni destacan otras.
6. Circunstancias personales: no se añade recogida, uso o inferencia.
7. Operaciones: ninguna sugerencia de compra, venta o mantenimiento.
8. Valor: ninguna opinión sobre precios actuales o futuros.
9. Atractivo: no se reordena, clasifica o puntúa por mérito inversor.
10. Terceros: no se añaden recomendaciones de terceros.
11. Diseño: alineación y lectura neutrales, sin nuevos veredictos o semáforos.
12. Acciones: desplazamiento local; no contratación, contacto ni ejecución.
13. Remuneración: sin cambios.
14. Agente vinculado: separación profesional íntegra.
15. Datos personales: no hay nuevos flujos, almacenamiento o envío.
16. IA: no se incorpora al producto.
17. Límites: se conservan avisos de datos ilustrativos, fuentes y supuestos.
18. Controles: comparación de contenido, pruebas de cabeceras/columnas, teclado,
    tamaños, alineación y matriz visual aislada, además de las pruebas existentes.

Clasificación interna: verde para esta intervención de presentación. No supone
validación jurídica global ni aprobación de los servicios excluidos.

## Hallazgos

- Vivienda separa la cabecera del cuerpo desplazable. La barra vertical reduce
  solo el ancho del cuerpo: la última columna comienza unos 12 px antes que su
  encabezado en la comprobación de escritorio. El cuerpo usa texto de 12 px.
- Esa tabla visual no declara relaciones de tabla, filas y celdas.
- Mercados alinea cifras a la izquierda y oculta Año y Volumen por debajo de
  1180 px. Su zona desplazable carece de nombre y acceso explícito por teclado.
- Las tablas de guías tienen caption y encabezados correctos, pero necesitan
  preservar un ancho de lectura y facilitar el desplazamiento con teclado.
- La tabla común del laboratorio alinea también «Cómo leerla» a la derecha por
  una regla que supone que toda columna posterior a la primera es numérica.

## Cambios y validación

- Piloto visual: diez combinaciones correctas (cinco vistas a 1440 y 768 px).
- Piloto con los nuevos controles de tablas: doce combinaciones correctas
  (seis vistas a 1440 y 768 px), incluidas muestras de cero y dato ausente.
- Validación general: terminada con código cero; incluye las pruebas del
  laboratorio y las 23 vistas a 1440 px.
- Matriz adicional de seis anchos: los tres procesos terminaron con código cero.
  Total final: **23 vistas × 7 anchos = 161 combinaciones correctas**, a 1440,
  1280, 1180, 1024, 900, 820 y 768 px. Sin fallos en los controles ejecutados de
  contraste, tipografía, estructura, desbordes, navegación y tablas.
- Revisión manual con la habilidad de navegador: amortización y sus 25 filas,
  alineación antes/después, cotizaciones y muestra de formato y ausencia.

Registros locales ignorados por Git en `output/entrega-4b-3/`: `piloto.log`,
`interacciones.log`, `validate.log`, `matrix-wide.log`, `matrix-middle.log`
y `matrix-tablet.log`.

Se mantienen los avisos estáticos anteriores de la página de impuestos en
preparación y las imágenes de Inicio sin carga diferida; también el ruido de
consola conocido de SVG en Academia, Jubilación y Fiscalidad. No son incidencias
introducidas o resueltas en este bloque.
No se generó `dist/`, no se publicó y no se modificó la infraestructura de datos.
Este bloque no cierra toda la fase 4B.

## Cambios aplicados

### Vivienda

Una única región desplazable contiene ahora cabecera y filas. La cabecera queda
fija al desplazar verticalmente y conserva las mismas columnas que el cuerpo.
Se mantienen las seis columnas, la lista dinámica y todos sus valores.
La tabla tiene nombre accesible y relaciones de tabla, fila, encabezado y celda;
se conserva la estructura de contenedores compatible con las plantillas actuales.
El cuerpo pasa de 12 a 14 px. Un ancho mínimo de lectura evita comprimir las
cifras en tablet: el desplazamiento queda dentro de la tabla, no en la página.
La revisión manual confirma 25 filas en el escenario inicial y alineación exacta
de la última columna, antes desplazada unos 12 px.

### Mercados

Las siete columnas permanecen disponibles también en tablet. Se alinean a la
derecha precio, variaciones, peso y volumen; Empresa y Sector siguen a la izquierda.
Se añade caption, relación de encabezados y una región accesible por teclado.
El ancho mínimo existente de 1080 px se conserva para la tabla completa. Siguen
presentes las 16 filas iniciales, los filtros y el aviso de datos ilustrativos;
no se sustituyen por cotizaciones actuales ni se modifican sus fechas.

### Guías y laboratorio

Las tablas comparativas de Ahorro y Sucesiones conservan caption, contenidos y
encabezados. Se les da un ancho mínimo legible y desplazamiento con teclado.
Las tablas comunes comparten tamaño de texto, altura de línea y espaciado.
En las tablas de métricas «Métrica / Valor / Cómo leerla», solo el valor se trata
como cifra; la explicación vuelve a alinearse a la izquierda.
Cinco envoltorios de tablas del laboratorio reciben nombre y acceso por teclado.
En esos tres archivos JavaScript solo se modificaron atributos de los contenedores,
no los cálculos ni su conexión con datos.

### Resúmenes y referencia de formato

Se fijan roles de cifra principal (28 px) y compacta (22 px). Curso y resumen del
laboratorio utilizan el principal; Vivienda conserva su densidad compacta.
Se elimina el tamaño fluido del resumen del laboratorio y se permite que los
resultados largos ocupen más espacio sin quedar recortados.
No se fuerza una precisión decimal única entre métricas de distinto significado.

La página interna de sistema visual incluye una tabla ficticia que distingue
importe, porcentaje negativo, cero y ausencia. No aporta datos reales ni cambia
los formateadores del producto.

## Evidencia y límites

La nueva prueba estática protege las seis columnas de amortización, las siete
de Mercados, las referencias dinámicas originales y las regiones accesibles.
El auditor comprueba alineación, lectura, tamaño, nombres y desplazamiento por
flechas, además de comprobar que desplazar no cambia el contenido.
La comparación de las etiquetas script de Vivienda, Mercados, Ahorro y Sucesiones
frente a la versión confirmada da igualdad exacta: su lógica inline permanece intacta.

Los cambios no cubren todos los paneles que puedan aparecer tras cargar carteras
o datos remotos. La matriz principal tampoco es una certificación integral de
accesibilidad o jurídica. No se validan Firebase, la base nueva, proveedores
externos ni el módulo de empresas.

El siguiente bloque pendiente es avisos, estados vacíos y mensajes de actualización.

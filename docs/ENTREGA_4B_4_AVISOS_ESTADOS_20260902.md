# Entrega 4B · Bloque 4: avisos, estados vacíos y actualización

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local; sin publicar.

## Alcance y ficha previa

Presentación de avisos comunes, búsqueda local de cotizaciones ilustrativas,
estados editoriales del archivo diario existente y calendarios estáticos.
No se actualizan noticias, cotizaciones ni calendarios. No se modifican fuentes,
conexiones, cálculos ni persistencia. Escritorio y tablet: 768–1440 px.
Firebase/Firestore, la base nueva, sus archivos y el módulo de empresas quedan
excluidos. No se compila ni publica.

1. Necesidad: distinguir ausencia, búsqueda vacía, preparación, carga y error.
2. Datos: únicamente los ya disponibles; pruebas con ejemplos aislados.
3. Transformación: texto de estado, formato y semántica de interfaz.
4. Salida: mensajes fieles al estado recibido; nunca simular actualidad.
5. Instrumentos: no se añaden instrumentos ni selecciones.
6. Circunstancias personales: no se recogen ni infieren.
7. Operaciones: ninguna propuesta de compra, venta o mantenimiento.
8. Valor: ningún juicio sobre precios presentes o futuros.
9. Atractivo: ningún ranking o puntuación de mérito inversor.
10. Terceros: no se incorporan recomendaciones de terceros.
11. Diseño: estados descritos en palabras; colores solo de interfaz.
12. Acciones: limpiar filtros locales; sin contratación ni ejecución.
13. Remuneración: sin cambios.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: ningún flujo nuevo ni almacenamiento.
16. IA: no se incorpora al producto.
17. Límites: fechas, fuentes, carácter ilustrativo y avisos conservados.
18. Controles: pruebas de estados editoriales sin red, recuperación de filtros,
    lectura y desbordes; regresión general en escritorio y tablet.

Clasificación interna: verde para este alcance de interfaz. No equivale a
validación jurídica global ni aprobación de servicios excluidos.

## Hallazgos previos

- El aviso sin coincidencias está dentro del contenedor desplazable de la tabla.
  No ofrece una acción directa para quitar los filtros.
- El contador de resultados no declara una región de estado accesible.
- La actualización editorial trata un resultado parcial o desconocido como
  correcto y utiliza la fecha del intento, no la del último éxito.
- Un fallo se presenta como «pendiente», confundiendo error con espera.
- La etiqueta accesible macro dice «actualizados» sin expresar una referencia.
- Los calendarios estáticos de agosto siguen llamando «Hoy» al 11 de agosto.
- Las notas generales usan verde incluso sin comunicar éxito; los avisos
  editoriales tienen espaciados distintos y las etiquetas de preparación no
  reutilizan siempre su variante común.

## Validación y límites

La primera comprobación visual pasa en doce combinaciones: seis vistas a 1440
y 768 px. La prueba reforzada de interacción pasa en cuatro combinaciones:
Mercados/cotizaciones y sistema visual, a los mismos dos anchos.
La validación general termina con código cero, incluidas las pruebas del
laboratorio y las 23 vistas a 1440 px. Los otros tres procesos terminan también
con código cero: **23 vistas × 7 anchos = 161 combinaciones correctas** a 1440,
1280, 1180, 1024, 900, 820 y 768 px. Sin fallos en los controles ejecutados.

La revisión manual con la habilidad de navegador comprueba el mensaje editorial,
el calendario, las muestras visuales y la búsqueda vacía con su recuperación.
La comparación de las cuatro listas de cotizaciones y eventos frente a la
versión confirmada da igualdad exacta después de normalizar exclusivamente
la etiqueta «Hoy · 11 ago» a «11 ago 2026».

Evidencias locales ignoradas por Git en `output/entrega-4b-4/`:
`piloto.log`, `interacciones-final.log`, `validate-final.log`, `matrix-wide.log`,
`matrix-middle.log` y `matrix-tablet.log`. Se conservan además `interacciones.log`
y `validate.log`, correspondientes al orden de pruebas anterior y fallido.

Permanecen los avisos previos de `guia-impuestos.html` en preparación, las dos
imágenes de Inicio sin carga diferida y el ruido de consola conocido de SVG.
No se introducen ni se resuelven en este bloque. La matriz no es una
certificación integral de accesibilidad ni una validación jurídica global.

Las muestras de carga, ausencia y error del sistema visual son ejemplos de
diseño, no conexiones o fallos reales del servicio. No llevan regiones vivas
ni anuncian tareas en curso a los lectores de pantalla.

## Cambios aplicados

### Avisos comunes

Las notas generales y los nuevos avisos comparten rol tipográfico de 14 px,
altura de línea 1,6, espaciado y superficie neutra. Los avisos editoriales de
las guías reutilizan las variantes y medidas comunes. La advertencia y el error
se expresan con palabras, además del filete de color: ningún verde significa
que una cifra financiera sea «buena» ni ningún rojo que sea «mala».
Las etiquetas de preparación de Temas y del informe de Mercados usan la
variante común ya existente. No se convierten las secciones futuras en acciones.

El sistema visual documenta ocho muestras: carga, ausencia de datos, búsqueda
sin coincidencias, preparación, actualización parcial, error, disponibilidad y
actualización sin comprobar. Cero y ausencia siguen siendo conceptos distintos.

### Búsqueda de cotizaciones ilustrativas

El estado vacío queda fuera del desplazamiento horizontal de la tabla, sin
ocultar columnas. Añade una explicación y «Limpiar búsqueda y sector».
La acción restablece exclusivamente esos dos filtros, conserva el índice elegido
y devuelve el foco al buscador. El contador persistente comunica el cambio como
estado no urgente. No se interpreta una búsqueda vacía como fallo del proveedor.

La revisión manual recupera las 16 filas iniciales. La prueba automatizada
compara todo el texto de esas filas antes y después, el índice, la selección de
sector, el campo y la devolución de foco mediante activación con Enter.

### Estado de actualización editorial

Se conserva la petición existente al archivo diario local y su política de
caché. No hay peticiones nuevas, reintentos, cambios del actualizador ni cambios
de proveedor. El mensaje de carga empieza únicamente al comenzar esa petición.

| Situación recibida | Mensaje mostrado |
|---|---|
| Todavía no se ha comprobado | Selección disponible, actualización sin comprobar |
| Consulta en curso | Comprobando la actualización |
| `ok` y fecha de éxito válida | Selección automática con fecha, año y hora de Madrid |
| `degraded` | Actualización parcial |
| `failed` | No se ha podido actualizar; se conserva el contenido disponible |
| Estado ausente, desconocido o fecha de éxito incompleta | No se confirma una nueva selección |
| Respuesta sin noticia principal | Se explica la ausencia y se conserva la noticia visible |
| Fallo de petición, HTTP o JSON | No se ha podido comprobar la actualización |

La fecha del mensaje procede de `lastSuccessAt`, no de `lastAttemptAt`.
Se denomina «última selección registrada», sin afirmar que una selección parcial
esté completa. Una fecha ausente no se transforma en enero de 1970.
Las fechas originales de publicación, titulares, fuentes y criterios de
antigüedad del contenido no se modifican. Una selección reciente puede incluir
una noticia antigua: las dos fechas no se confunden.

La prueba de once respuestas sintéticas ejecuta la integración en un entorno
aislado, sin datos reales ni red, y comprueba las transiciones y el contenido
de reserva. No certifica la disponibilidad de los proveedores.

### Calendarios existentes

Ambos paneles avisan antes de los filtros de que son una selección estática de
agosto de 2026, no una agenda actualizada. «Hoy» pasa a «11 ago 2026»;
los otros filtros indican la semana del 10 de agosto y agosto de 2026.
Se mantienen las fechas subyacentes, los eventos, cifras, fuentes, opciones y
la lógica de filtrado. La etiqueta macro accesible pasa a «con fecha de
referencia», sin prometer actualidad no acreditada.

Este bloque **no pone al día los calendarios, noticias ni cotizaciones**.
La integración de datos definitiva sigue aplazada por decisión del fundador.

## Corrección del procedimiento de pruebas

La primera ejecución de la prueba nueva detectó que el auditor general cambiaba
de pestaña antes de probar los componentes específicos. En Mercados, la tabla
ya no estaba en pantalla y algunas comprobaciones anteriores podían pasar por
ausencia de elementos.

Ahora las pruebas específicas se ejecutan sobre la vista de entrada, antes de
las transiciones generales. Además, la prueba de tablas falla explícitamente
si no encuentra cotizaciones o amortización en sus rutas correspondientes.
Se conserva el registro del fallo inicial y se repite la matriz con el orden
corregido. Esto refuerza también la cobertura del bloque 4B-3.

## Pendientes fuera del bloque

- Revisión conjunta por familias antes de dar por cerrada toda la Entrega 4B.
- Estados dependientes de cuenta, guardado remoto, proveedores y base definitiva:
  excluidos; no se prueban ni se rediseñan como servicios terminados.
- Gráficos especializados y homogeneización interna del módulo de empresas:
  no cubiertos por esta intervención.
- Publicación y compilación: no ejecutadas. Los cambios siguen siendo locales.

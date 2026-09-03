# Entrega 5A · Bloque 4: itinerario de Academia NUVIA

Fecha: 2 de septiembre de 2026. Estado: completado y validado en local, sin confirmar ni publicar.

## Alcance y diagnóstico inicial

Se mantienen «Saber es patrimonio», las dos entradas de Academia, sus siete
vistas y el curso existente. Faltaba un recorrido opcional para los conocimientos,
un regreso claro desde las vistas interiores y una explicación de los formatos
disponibles. El título de la pestaña se sustituía por una versión antigua al
iniciar la página. La tarjeta de cursos prometía seguimiento del progreso.

En el curso, el progreso solo existe en el estado de la página, las actividades
marcables corresponden al capítulo 1 y la configuración arrancaba con dos partes
completadas de ejemplo. No existe persistencia del progreso en el controlador
ni en los scripts locales de soporte inspeccionados. La promesa de guardarlo
en el dispositivo no correspondía a la implementación.

## Ficha regulatoria previa

1. Necesidad: orientarse entre contenidos formativos ya disponibles.
2. Datos: textos, rutas y formatos locales existentes.
3. Transformación: organización editorial y estado temporal de interfaz.
4. Resultado: recorrido opcional, enlaces de regreso y disponibilidad explícita.
5. Instrumentos o emisores: no se añaden ni seleccionan.
6. Circunstancias personales: la ruta no pregunta ni se adapta a ellas.
7. Operaciones: no se sugieren compras, ventas ni aportaciones.
8. Precios futuros: no se emiten opiniones nuevas.
9. Atractivo inversor: la numeración ordena materias, no inversiones.
10. Recomendaciones de terceros: no se añaden.
11. Diseño: recorrido libre, sin examen de idoneidad ni nivel acreditado.
12. Acciones: consultar las vistas existentes; no contratar ni derivar clientes.
13. Remuneración: sin afiliación, cobros ni condiciones comerciales nuevas.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: sin nueva captura, persistencia o envío; el seguimiento
    existente se describe como temporal, no como una cuenta o historial.
16. IA: ninguna función de IA para visitantes.
17. Límites: no se promete formación avanzada aún inexistente, acreditación ni
    progreso sincronizado. Esta intervención no certifica los contenidos
    financieros históricos, los PDF ni los vídeos del curso.
18. Controles: rutas, vuelta al recorrido, nombres canónicos, disponibilidad,
    inicio sin progreso ficticio, reinicio al recargar, fórmulas preservadas
    y matriz visual de escritorio y tablet.

Clasificación interna verde para estos cambios de orientación y veracidad de
la interfaz. No equivale a aprobación regulatoria global del catálogo.

## Cambios aplicados

- Conservar las dos puertas: Conocimientos esenciales y Cursos.
- Añadir un recorrido opcional por fundamentos, activos e interés compuesto,
  con el glosario como consulta transversal. Sin bloqueo de acceso.
- Explicar guías, vídeos y herramientas como formatos dentro de estas puertas.
- Describir el curso realmente existente: uno de nivel inicial, cinco capítulos.
- Corregir el título dinámico y el seguimiento: inicio vacío, indicador solo
  para las actividades del capítulo 1 y aviso de estado temporal.
- Incorporar regreso al recorrido desde las vistas internas y el curso.

## Archivos de esta entrega

- `academia.html`: introducción, recorrido opcional, regreso y título canónico.
- `curso.html`: disponibilidad, progreso temporal y separación de materiales.
- `estilos/nuvia-pages.css`: estilos exclusivos del recorrido con los tokens
  existentes; tres columnas en escritorio y una en tablet hasta 1024 píxeles.
- `docs/nuvia-academy-entry.test.mjs`: contratos de las siete vistas, rutas,
  existencia de los cinco PDF y estados temporales del curso.
- `scripts/check-academy-entry.mjs`: navegación mediante teclado, regreso al
  ancla, recarga del progreso y disponibilidad de los cinco capítulos.
- `scripts/check-render.mjs` y `package.json`: incorporación a los controles.

Se ha comparado el modelo financiero de Academia con el contenido guardado al
inicio de este bloque: historia, glosario y cálculo conservan su código, salvo
el nombre canónico y la nueva bandera de regreso del modelo de presentación.
Los cálculos del curso no se han modificado.

## Exclusiones

Sin Firebase, Firestore, nueva base, backend, cuentas, progreso remoto, pagos,
suscripciones ni certificados. No se alteran fórmulas, vídeos, documentos,
integraciones de cartera, portada general ni identidad gráfica. No se compila,
confirma ni publica. Se conserva el trabajo paralelo del usuario.

## Verificación y pendientes

Durante la comprobación se detectaron y corrigieron incoherencias adicionales
directamente relacionadas con la disponibilidad del curso:

- Los capítulos 2 a 5 mostraban los desplegables y directrices del capítulo 1.
  Ahora conservan su contexto, vídeo, infografía y PDF propio, e indican que
  sus apuntes se consultan en el PDF, no en un desarrollo web inexistente.
- En esos capítulos se ocultan las marcas y el reinicio sin efecto y se
  reducen los enlaces internos a las dos secciones realmente presentes.
- Se retira «Imprimir mi resumen», que no tenía ninguna acción asociada;
  no se implementa un sistema de resúmenes ni se altera la descarga de apuntes.
- El regreso al recorrido se aplica después del montaje de la página para
  conservar el destino del ancla. Se comprueba que queda bajo la cabecera.

La revisión del
contenido financiero completo y la reproducción de vídeos externos quedan
fuera de esta entrega de navegación. Las actividades de capítulos posteriores,
el guardado de progreso y futuros cursos no se presentan como disponibles.

## Resultado de la validación

La validación general, los contratos estáticos y las pruebas de análisis
terminan correctamente. La matriz final cubre 30 vistas en siete anchos:
210 combinaciones, sin fallos detectados en los controles ejecutados. Los
cuatro procesos finales terminan con código 0.

| Registro en `output/entrega-5a-4/` | Cobertura | Resultado |
|---|---|---|
| `validate-final.log` | Validación general y 30 vistas a 1440 px | 30/30 |
| `matrix-wide-final.log` | 30 vistas a 1280 y 1180 px | 60/60 |
| `matrix-middle-final.log` | 30 vistas a 1024 y 900 px | 60/60 |
| `matrix-tablet-final.log` | 30 vistas a 820 y 768 px | 60/60 |

Además se realizaron pruebas piloto del recorrido, curso y calculadora a
1440 y 768 px, y revisión visual manual en el navegador a 1280 px. Se
comprobó el regreso desde fundamentos y que el capítulo 2 muestra su propio
PDF y contexto sin los apuntes ni las marcas del capítulo 1. Se cerró la
previsualización local al terminar.

Las pruebas de esta entrega comprueban los siete destinos de Academia,
los cuatro enlaces del recorrido, el regreso bajo la cabecera, el inicio del
curso a cero, una marca temporal y su reinicio al recargar, y los cinco
capítulos con sus enlaces y materiales correspondientes. La existencia de
los cinco archivos PDF se comprueba sin certificar su contenido editorial.

Se mantienen los avisos conocidos: `guia-impuestos.html` sigue en preparación
con `noindex` y fuera de la matriz visual; dos imágenes de la portada no usan
carga diferida; persisten avisos conocidos del analizador SVG en Academia,
Jubilación y Fiscalidad. No hay nuevas incidencias detectadas. No se ha
compilado ni validado visualmente la aplicación autenticada de empresas,
ni comprobado disponibilidad de servicios externos. Esto no cierra la
revisión regulatoria global, todas las excepciones de 4B ni la publicación.

## Siguiente bloque

Entrega 5A · Bloque 5: criterios editoriales y organización del catálogo
existente de Lecturas con Criterio. Opiniones, propuestas, votos y foro
seguirán aplazados, sin cuentas ni conexión a la nueva base.

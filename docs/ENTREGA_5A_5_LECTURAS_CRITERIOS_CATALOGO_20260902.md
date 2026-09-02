# Entrega 5A · Bloque 5: Lecturas con Criterio

Fecha: 2 de septiembre de 2026. Estado: completado y validado en local, sin confirmar ni publicar.

## Alcance y diagnóstico inicial

El catálogo contiene cuatro libros con fichas ampliadas y enlaces a una
librería. Se conservan esos libros, sus portadas, los identificadores, las
rutas y el banner aprobado. Faltaba explicar el alcance de la selección,
por qué aparece cada libro, sus límites y el estado real de la comunidad.
El título de la pestaña se sobrescribía con una denominación anterior.

La colección actual no cubre todavía todos los temas de NUVIA. No se añaden
libros, informes, valoraciones de usuarios ni funciones de comunidad ficticias.
Dos filtros temáticos bastan para cuatro fichas: comportamiento y decisiones,
e inversión y empresas. Se conserva su orden, sin clasificación por mérito,
popularidad o atractivo financiero.

## Ficha regulatoria previa

1. Necesidad: entender y explorar el catálogo formativo existente.
2. Datos: cuatro fichas locales y sinopsis públicas de sus editoriales.
3. Transformación: clasificación temática y síntesis editorial descriptiva.
4. Resultado: cuatro fichas, dos temas, motivos, límites y fuentes.
5. Instrumentos o emisores: no se seleccionan; las obras tratan conceptos.
6. Circunstancias personales: no se solicitan ni utilizan.
7. Operaciones: no se propone comprar, vender ni mantener instrumentos.
8. Valor o precio: no se expresan opiniones de mercado ni objetivos.
9. Atractivo: no hay puntuaciones, ranking ni filtro por rentabilidad.
10. Terceros: los conceptos de los autores se atribuyen y describen; se retiran
    imperativos de las síntesis, sin difundir señales sobre activos actuales.
11. Diseño: filtros por materia, sin «mejores libros», estrellas o prueba social.
12. Acciones: abrir ficha y consultar fuentes o la librería ya enlazada; no hay
    contratación financiera, contactos, compras integradas ni formularios.
13. Remuneración: no se introduce afiliación, patrocinio ni seguimiento. No se
    certifican acuerdos comerciales inexistentes en el alcance inspeccionado.
14. Agente vinculado: separación intacta, sin marcas o derivación bancaria.
15. Datos personales: no se capturan; el filtro solo cambia la vista local y
    se restablece al recargar, sin almacenamiento.
16. IA: sin función de IA para visitantes. La nueva redacción se revisa contra
    fuentes editoriales y se distingue de una reseña integral de cada libro.
17. Fuentes y límites: página de cada editorial, fecha de comprobación y
    limitaciones de la síntesis. Las ediciones enlazadas pueden ser distintas;
    no se inventan ISBN, páginas, traducciones, licencias o fechas de lectura.
18. Pruebas: cuatro fichas intactas, correspondencia de temas y contenido,
    filtros por teclado, foco del diálogo, anclas, fuentes, ausencia de
    comunidad activa y matriz de escritorio y tablet.

Clasificación interna verde para este catálogo educativo no personalizado.
No equivale a certificación jurídica del sitio, de los enlaces comerciales
ni de los derechos de las portadas. La comprobación editorial no certifica
que todas las afirmaciones de los libros sigan vigentes.

## Criterios de aplicación

- Mantener el banner y el lema aprobados; explicar debajo la selección inicial.
- Conservar las cuatro fichas y agruparlas en dos materias, con filtro local
  opcional, contador accesible y acceso a todos los libros al recargar.
- Explicar afinidad con NUVIA, aportación educativa y lectura crítica.
- Añadir motivo, límite y fuente editorial a cada ficha, sin atribuir a NUVIA
  una lectura completa o una revisión científica no realizadas.
- Identificar opiniones, propuestas, votos y foro como no disponibles, sin
  botones de acción, formularios ni fecha de lanzamiento inventada.
- Mantener las descargas completas de libros fuera del portal. No se añaden.

## Exclusiones

No se toca Firebase, Firestore, cuentas, permisos, backend ni la nueva base.
Sin publicación, confirmación, compilación de `dist/` o pruebas de móvil.
No se alteran otras áreas ni el trabajo paralelo del usuario.

## Fuentes y verificación

Consulta editorial realizada el 2 de septiembre de 2026:

- [La psicología del dinero · Planeta](https://www.planetadelibros.com/libro-la-psicologia-del-dinero/334390): enfoque sobre comportamiento y finanzas personales.
- [El inversor inteligente · Deusto](https://www.planetadelibros.com/libro-el-inversor-inteligente/427153?soporte=427153): obra de Graham y edición con comentarios de Jason Zweig.
- [Un paso por delante de Wall Street · Deusto](https://www.planetadelibros.com/libro-un-paso-por-delante-de-wall-street/319743?soporte=319743): perspectiva de Lynch sobre negocios y análisis empresarial.
- [Pensar rápido, pensar despacio · Penguin Libros](https://www.penguinlibros.com/es/ciencia-y-tecnologia/11422-libro-pensar-rapido-pensar-despacio-9788483068618): pensamiento intuitivo y deliberado, juicios y sesgos.

Se han usado las fichas públicas de las editoriales y sus resultados indexados,
sin copiar reseñas de usuarios, precios o reclamos comerciales. Algunas
aperturas directas devolvieron errores intermitentes o tiempo de espera,
especialmente Penguin; su descripción se recuperó del resultado indexado de
la propia editorial. No se garantiza la disponibilidad continua de estos enlaces.

Las razones de inclusión y los límites son formulaciones editoriales de NUVIA,
no citas ni avales de las editoriales. Se han acortado las síntesis previas y
convertido los puntos imperativos en materias de estudio. No se han leído ni
certificado íntegramente los cuatro libros en esta entrega.

## Implementación

- `lecturas.html`: entrada explicativa, filtros, criterios, comunidad pendiente,
  motivos y límites de las cuatro fichas, fuentes y nombre canónico dinámico.
- `estilos/nuvia-pages.css`: estilos acotados a Lecturas. Se mantienen banner,
  imágenes, escala tipográfica, fichas nativas y comportamiento del diálogo.
- `docs/nuvia-readings-entry.test.mjs`: contratos del catálogo y perímetro.
- `scripts/check-readings-entry.mjs`: dos filtros y restablecimiento, cuatro
  fichas con foco, fuente, ausencia de desbordes, recarga y anclas.
- `scripts/check-render.mjs` y `package.json`: integración de esos controles.

El filtro solo cambia la visibilidad del catálogo y el contador. No reordena
libros, no crea perfiles, no guarda elecciones y no añade peticiones de red.
Las fuentes externas se abren únicamente como enlaces elegidos por el lector.

## Pendientes reales

- Ampliar el catálogo hacia patrimonio cotidiano, bienestar, aprendizaje,
  macroeconomía e informes; todavía solo hay cuatro libros.
- Ratificar los criterios de partida y designar responsable editorial. Los
  textos aplicados derivan de la definición y de las indicaciones del fundador;
  no se inventa un comité ni se afirma que exista revisión científica.
- Documentar la procedencia y derechos de las portadas antes del cierre de
  publicación; conservar activos existentes no acredita sus licencias.
- Revisar ediciones y enlaces de librería al ampliar las fichas. La fuente
  editorial no se presenta como prueba de que todas las ediciones coincidan.
- Opiniones, sugerencias, votos, foro, perfiles y moderación siguen aplazados.

## Comprobación visual y alcance de las pruebas

Se ha revisado manualmente la página a 1280 píxeles: filtro de comportamiento,
ficha de Kahneman, motivo, límite, fuente y sección de criterios. La ficha
ampliada permite recorrer el texto con desplazamiento vertical, sin recortarlo.
Se han cerrado la pestaña de revisión y el servidor de previsualización.

Las pruebas específicas comprueban las combinaciones de libros de cada tema,
el orden conservado, un único filtro activo, el contador, la ocultación real,
la apertura y cierre por teclado, el regreso del foco, la presencia de fuentes
y los destinos de navegación. También comprueban que al recargar vuelvan los
cuatro libros y que la comunidad carezca de formularios y acciones ficticias.

## Resultado de la validación final

La validación estática general, los contratos de producto y las pruebas de
análisis terminan correctamente. La matriz final cubre 30 vistas en siete
anchos: 210 combinaciones sin fallos detectados en los controles ejecutados.
Los cuatro procesos finales terminan con código 0.

| Registro en `output/entrega-5a-5/` | Cobertura | Resultado |
|---|---|---|
| `validate-final.log` | Validación general y 30 vistas a 1440 px | 30/30 |
| `matrix-wide-final.log` | 30 vistas a 1280 y 1180 px | 60/60 |
| `matrix-middle-final.log` | 30 vistas a 1024 y 900 px | 60/60 |
| `matrix-tablet-final.log` | 30 vistas a 820 y 768 px | 60/60 |

Los registros `pilot.log` y `pilot-interactions.log` recogen además las
comprobaciones específicas previas de Lecturas a 1440 y 768 píxeles.

Se conservan los avisos anteriores: `guia-impuestos.html` sigue en preparación,
con `noindex` y fuera de la matriz visual; dos imágenes de portada no utilizan
carga diferida; permanecen los avisos conocidos del analizador SVG en Academia,
Jubilación y Fiscalidad. No se detectan nuevas incidencias de render o consola.

Los navegadores de prueba bloquean las conexiones externas: esta matriz no
certifica la disponibilidad de las editoriales o la librería. No se ha
compilado `dist/` ni validado visualmente la aplicación autenticada de empresas.
No equivale a certificación de accesibilidad completa, validación jurídica
global, cierre de los derechos de imágenes o autorización de publicación.

## Continuidad del plan

Este es el quinto bloque de presentación de los espacios de la Entrega 5A.
No cierra sus funciones futuras ni sustituye los permisos de publicación.
El siguiente bloque previsto es 5B: metodología, fuentes y límites basados
en lo ya desarrollado. Los textos legales con datos del titular, la nueva
base, las cuentas y cualquier decisión sobre Firebase siguen fuera del alcance.

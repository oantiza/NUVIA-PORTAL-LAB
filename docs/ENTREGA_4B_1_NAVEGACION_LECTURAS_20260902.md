# Entrega 4B · Bloque 1: navegación y tarjetas de Lecturas

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local; sin publicar.

## Alcance y hallazgos previos

- El menú principal y el pie ya comparten los cinco espacios. Se conservan.
- Las migas de varias páginas de Patrimonio todavía dicen «Temas clave».
- Lecturas conserva un desplegable de Academia en su ruta: jerarquía incorrecta.
- Curso utiliza ese mismo desplegable con enlaces heredados y capitalización desigual.
- Vivienda y Cartera no muestran el acceso a su espacio padre.
- Las portadas de Lecturas se recortan en tablet pese a `object-fit: contain`;
  se revisará el tamaño real de la imagen dentro de la pista de cuadrícula.
- Cada tarjeta se declara botón y contiene a su vez un botón y un enlace.
  Se conservará el clic sobre la tarjeta, pero el teclado usará el botón nativo
  de apertura, con nombre de libro y devolución del foco al cerrar.
- La prueba previa confirma otro defecto: el desplegable de Economía y Finanzas,
  centrado sobre el primer elemento del menú, rebasa el borde izquierdo a 768 px.

Se preservan imágenes, títulos, selección y orden de libros, enlaces externos,
contenidos de las fichas, calculadoras y rutas existentes. No se crea comunidad,
cuentas, persistencia ni recomendación personalizada. Firebase, la nueva base,
sus archivos y el módulo de empresas quedan fuera. No se compila ni publica.

## Ficha regulatoria previa

1. Necesidad: orientación coherente y acceso legible a contenido editorial existente.
2. Datos: rutas, títulos e imágenes locales ya presentes.
3. Transformación: etiquetas de navegación, dimensiones y semántica de controles.
4. Salida: mismo catálogo y contenido, sin recortes y con recorridos claros.
5. Instrumentos o emisores: no se incorporan ni se destacan.
6. Circunstancias personales: no se utilizan.
7. Operaciones: no se sugieren actuaciones inversoras.
8. Valor o precio: no se añade opinión.
9. Atractivo: no se puntúa, reordena ni selecciona por mérito inversor.
10. Terceros: no se añade ninguna recomendación externa.
11. Diseño: no cambia el énfasis relativo de libros o resultados financieros.
12. Acciones: se conservan aperturas y enlaces existentes; no se incorpora contratación.
13. Remuneración: no se añade afiliación ni cambia el destino de los enlaces.
14. Agente vinculado: separación profesional íntegra.
15. Datos personales: sin nuevo tratamiento o almacenamiento.
16. IA: no se añade IA al producto.
17. Fuentes y límites: contenido y avisos existentes conservados.
18. Controles: pruebas de rutas, geometría de imágenes, apertura/cierre y foco,
    revisión manual de teclado y matriz de escritorio/tableta sin red externa.

Clasificación interna: verde para esta intervención; no validación jurídica global.

## Cambios aplicados

1. Rutas de orientación corregidas en doce páginas. Ocho páginas de Patrimonio
   muestran el espacio padre: Vivienda, Mis impuestos, Jubilación y cinco guías.
   Cartera incorpora Economía y Finanzas; Academia utiliza su nombre oficial;
   Curso enlaza directamente con Academia NUVIA; Lecturas con Criterio se presenta
   como espacio independiente. Se conservan los destinos existentes.
2. Eliminados los desplegables heredados de las migas de Curso y Lecturas.
3. El primer desplegable de la cabecera se alinea por su borde izquierdo en la
   disposición de tablet, evitando que salga de la pantalla. Se conservan sus
   enlaces y el comportamiento de los otros menús.
4. Corregida la cuadrícula de las portadas: pistas con mínimo cero e imágenes
   capaces de reducir su tamaño, manteniendo `object-fit: contain`. A 768 px,
   antes las imágenes ocupaban entre 631 y 968 px de alto dentro de un marco de
   220 px. Tras el ajuste, ocupan 196 px dentro de ese marco, sin recortes.
5. Las tarjetas dejan de declararse botones con otros controles dentro. El botón
   nativo «Abrir ficha» identifica el libro y anuncia el diálogo. Se conserva el
   clic en el cuerpo de la tarjeta y el enlace independiente a la librería.
   Al cerrar la ficha, el foco vuelve al botón correspondiente.

No se ha cambiado el catálogo, los textos editoriales, las imágenes ni la
composición de la portada. Tampoco se han conectado servicios o modificado datos.

## Validación realizada

- Prueba previa en Inicio y Lecturas a 768 px: detectó el menú desbordado, las
  cuatro imágenes recortadas y los problemas de controles anidados y foco.
- Prueba piloto posterior: cuatro combinaciones (dos vistas a 1440 y 768 px),
  sin incidencias en las comprobaciones ejecutadas.
- Validación estática, consistencia, lenguaje, navegación, definición, metadatos,
  contenido externo, sistema editorial, fundamentos visuales y pruebas del
  laboratorio: completadas con código de salida cero.
- Matriz final: **23 vistas × 7 anchos = 161 combinaciones**, a 1440, 1280, 1180,
  1024, 900, 820 y 768 px. Los cuatro procesos terminaron con código cero.
  Sin fallos detectados por los controles de contraste, tipografía, estructura,
  superficies, cabecera, desbordes y accesibilidad incluidos en la auditoría.
- En Inicio y Lecturas, los cuatro menús se prueban con Enter, Tab y Escape:
  apertura, límites horizontales, entrada al primer enlace y devolución del foco.
- En Lecturas, se comprueban las cuatro portadas y fichas en los siete anchos:
  imagen completa, apertura con Enter o espacio, correspondencia del título,
  cierre con Escape o botón y recuperación del foco.
- Revisión visual con la habilidad de navegador: Lecturas a 768 y 1440 px,
  desplegable y ficha de libro a 768 px, cabecera de Curso a 1024 px.

Registros locales, ignorados por Git, en `output/entrega-4b-1/`:
`antes.log`, `piloto.log`, `validate.log`, `matrix-wide.log`,
`matrix-middle.log` y `matrix-tablet.log`.

Se mantienen los avisos estáticos anteriores de `guia-impuestos.html` (cabecera,
pie y exclusión de indexación) y las dos imágenes sin carga diferida de Inicio.
Los avisos de consola preexistentes registrados en Academia, Jubilación y
Fiscalidad no se presentan como resueltos por esta entrega.

Las pruebas visuales se ejecutaron bloqueando las conexiones externas. No se
validó la disponibilidad de APIs, vídeos, cotizaciones, cuentas ni la nueva base
de datos. No se generó `dist/`, no se publicó y no se modificó Firebase/Firestore.
El resultado no equivale a una certificación completa de accesibilidad ni legal.

## Continuación

Este bloque no cierra 4B. El siguiente bloque es la homogeneización de botones,
campos de formulario y sus estados, sobre funciones ya desarrolladas y sin
alterar cálculos ni persistencia. Después quedan tablas, avisos y otros tipos de
tarjetas. La revisión de la presentación del módulo integrado debe respetar su
copia local y mantener intactos el backend y la conexión existente.

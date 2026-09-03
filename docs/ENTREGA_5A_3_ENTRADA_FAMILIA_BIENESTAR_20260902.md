# Entrega 5A · Bloque 3: Familia, Salud y Bienestar

Fecha: 2 de septiembre de 2026. Estado: presentación completada y validada en local, sin confirmar ni publicar.

## Alcance y diagnóstico

Se conserva `temas.html?topic=bienestar`, su nombre canónico, la imagen existente
y los cinco temas de partida. La página ya distingue Bienestar de Patrimonio,
pero no explica suficientemente qué se puede consultar hoy. Sus tres guías
están en preparación y aparecen bajo «Lecturas con criterio», el nombre de
otro espacio. Tampoco identifica fuentes de consulta ni un proceso editorial.

Este bloque ordena la presentación y aclara los estados reales; no publica
guías sanitarias ni desarrolla funciones nuevas de salud. No modifica el
alcance clínico del producto, la definición canónica ni la navegación global.

## Ficha regulatoria previa

1. Necesidad: comprender el propósito, los temas y la disponibilidad del espacio.
2. Datos: contenido local existente y enlaces públicos de consulta general.
3. Transformación: organización editorial y navegación local, sin cálculos.
4. Resultado: presentación, cinco temas, tres guías pendientes, fuentes y límites.
5. Instrumentos o emisores: ninguno.
6. Circunstancias personales: no se recogen ni utilizan.
7. Operaciones de inversión: no se sugieren.
8. Precios o valor futuro: no se emiten opiniones.
9. Atractivo inversor: sin puntuación ni ordenación financiera.
10. Recomendaciones de terceros: no se reproducen recomendaciones de inversión
    ni tratamientos; los enlaces son índices generales de información.
11. Diseño: categorías informativas, no veredictos; los estados se explican con texto.
12. Acciones: navegación a secciones, fuentes públicas y catálogo existente;
    sin contratación, derivación profesional ni formularios.
13. Remuneración: no hay afiliación ni acuerdos comerciales nuevos.
14. Agente vinculado: separación intacta; no se utiliza su condición profesional.
15. Datos personales: ninguno nuevo, especialmente ninguno sanitario o familiar.
16. IA: no se ofrece una función de IA a visitantes.
17. Límites: no hay diagnóstico, tratamiento ni consejo sanitario individual.
    Las futuras guías necesitarán fuentes específicas, autoría, fecha y revisión
    profesional del contenido sanitario antes de publicarse. No se afirma que
    exista una revisión clínica ni que las instituciones enlazadas avalen NUVIA.
18. Controles: identidad y separación de Patrimonio, cinco temas no interactivos,
    estados pendientes, enlaces y anclas, ausencia de formularios y matriz visual.

Clasificación interna verde para esta entrada informativa. No equivale a
validación médica, jurídica o regulatoria global, ni autoriza futuras guías.

## Fuentes verificadas para enlaces de consulta

- [OMS · Temas de salud](https://www.who.int/es/health-topics).
- [MedlinePlus en español · Temas de salud](https://medlineplus.gov/spanish/healthtopics.html).

Se han comprobado los dos índices públicos el 2 de septiembre de 2026. No se
copian artículos ni se les atribuye la autoría de las guías pendientes. La
consulta de esos enlaces no sustituye las fuentes específicas de cada futuro texto.

## Exclusiones

Sin Firebase/Firestore, nueva base, cuentas, datos de salud, cuestionarios,
backend, comunidad, profesionales contratados o avales inventados. Sin
compilación de `dist/`, confirmación, publicación ni versión móvil.
Se conservan los cambios previos y el trabajo paralelo del usuario.

## Resultado y pruebas

La validación estática, los contratos y las pruebas de análisis pasan. La
matriz final cubre 30 vistas en siete anchos: 210 combinaciones, sin fallos
detectados dentro de los controles ejecutados. Los cuatro procesos finales
terminan con código 0.

| Registro en `output/entrega-5a-3/` | Cobertura | Resultado |
| --- | --- | --- |
| `validate-final.log` | Validación estática, contratos, análisis y 30 vistas a 1440 px | 30/30, código 0 |
| `matrix-wide-final.log` | 30 vistas a 1280 y 1180 px | 60/60, código 0 |
| `matrix-middle-final.log` | 30 vistas a 1024 y 900 px | 60/60, código 0 |
| `matrix-tablet-final.log` | 30 vistas a 820 y 768 px | 60/60, código 0 |

Las comprobaciones específicas de anclas con teclado, disponibilidad, acceso
al catálogo y regreso pasan en los siete anchos. No hay nuevas desviaciones
detectadas de contraste, escala tipográfica, estructura, superficies, cabecera,
desbordes, controles o contenido. El piloto previo sobre las cuatro vistas de
Temas a 1440 y 768 px también pasa tras ajustar el tamaño de un encabezado de aviso.
La comprobación de formato de los cambios pasa. Navegador y servidor temporal
cerrados.

Este bloque cierra la presentación del espacio, no toda la Entrega 5A, las
guías sanitarias pendientes ni la limitación de metadatos compartidos descrita
más abajo.

## Cambios aplicados

- Navegación interna a Temas del espacio, Guías en preparación y Fuentes y
  límites, disponible solo en Bienestar y utilizable con teclado.
- Aviso visible que diferencia la presentación disponible de las tres guías
  todavía no publicadas. No se añaden botones de lectura a contenidos inexistentes.
- Imagen y cinco temas existentes conservados; estos últimos forman una lista
  semántica, sin apariencia funcional de enlaces o cuestionarios.
- «Próximos contenidos · Tres guías en preparación» sustituye el rótulo que
  confundía estas guías con el espacio Lecturas con Criterio.
- Descripciones de las guías reformuladas como temas previstos, no como
  indicaciones de hábitos o técnicas con resultados prometidos.
- Dos índices públicos de consulta, enlaces externos identificados y protegidos,
  y aclaración expresa de que no suponen un aval institucional.
- Requisitos editoriales futuros expresados como pendientes: fuentes específicas,
  autoría, fecha y revisión profesional del contenido sanitario antes de publicar.
- Límites explícitos: sin diagnóstico, tratamiento, consejo individual ni
  solicitud de información sanitaria. Enlace al catálogo general ya existente
  de Lecturas, presentado como otro espacio, no como sustituto de atención sanitaria.
- Tipografía, espaciados, tarjetas y avisos del sistema existente; estados de
  preparación alineados dentro de sus tarjetas.
- Los encabezados de las tarjetas de recursos pasan a nivel 3 bajo el nivel 2
  de su sección. Esta mejora semántica también alcanza las tres tarjetas de
  Planificación patrimonial, sin alterar sus textos, destinos o disponibilidad.

## Controles y conservación

- Nuevo contrato `docs/nuvia-wellbeing-entry.test.mjs`: identidad, separación
  de Patrimonio, cinco temas, tres guías, destinos de anclas, fuentes, límites,
  ausencia de formularios y enlace al catálogo existente.
- Nuevo recorrido `scripts/check-wellbeing-entry.mjs`: anclas con teclado y
  destino visible bajo la cabecera, estados pendientes sin acciones falsas,
  acceso a Lecturas y regreso, y ausencia de los nuevos bloques en Patrimonio.
- Ambos controles integrados en las validaciones habituales. La matriz conserva
  las 30 vistas y los siete anchos de escritorio/tablet; no se añade móvil.
- Comparación con el archivo local anterior al bloque: el controlador es
  idéntico salvo las tres descripciones de guías de Bienestar. No cambian
  selección de temas, alias, navegación de Patrimonio ni cálculos.
- Inspección manual de cabecera, guías, fuentes, límites y catálogo, sin abrir
  servicios externos en el navegador de prueba.

## Límites y siguientes pasos

Este bloque cierra la presentación del espacio, no una biblioteca de salud.
Las guías siguen pendientes de redacción, fuentes específicas, autoría y revisión;
no se acredita una revisión clínica ni se designa un responsable inexistente.

Se conserva la ruta compartida `temas.html?topic=bienestar`. El título visible
y el de la pestaña identifican Bienestar; los metadatos estáticos de la página
base siguen siendo los de Patrimonio. Una vista social propia necesitará
resolver esa limitación de la ruta compartida, sin afirmar que ya esté resuelta.

Las advertencias anteriores se mantienen: guía de impuestos en preparación
fuera de la matriz visual, dos imágenes de portada sin carga diferida y mensajes
conocidos de parseo inicial de SVG en Academia, Jubilación y Fiscalidad.
La validación visual no certifica toda la accesibilidad ni los servicios remotos;
las pruebas se realizan con conexiones externas bloqueadas.

Siguiente bloque: itinerario de Academia NUVIA con contenidos existentes,
distinción entre conocimientos, guías, vídeos y cursos y próximos pasos de
aprendizaje, sin progreso remoto, cuentas ni promesas de acreditación.

# Entrega 4B · Bloque 5: revisión de cierre por familias

Fecha: 2 de septiembre de 2026. Estado: bloque local completado y validado,
con exclusiones explícitas. Sin publicación.

## Alcance

Recorridos de escritorio y tablet (768–1440 px), incluidas vistas secundarias de
Academia, resultados locales de Jubilación y paneles accesibles sin red.
Se mantienen portada, datos, fórmulas, rutas y contenidos. No se actualizan datos.
Sin Firebase, nueva base, autenticación, guardado remoto, cambios de backend,
compilación ni publicación. El módulo de empresas se revisa solo en código de
presentación: no se simula que sus pantallas autenticadas hayan sido probadas.

## Ficha regulatoria previa a los cambios

1. Necesidad: leer los gráficos y recorrer páginas sin rótulos ausentes o cortes.
2. Datos: los existentes y los ejemplos locales ya incluidos.
3. Transformación: presentación y atributos accesibles, sin cálculo financiero.
4. Salida: mismos valores y series, con etiquetas visibles y pruebas ampliadas.
5. Instrumentos: no se añaden, recomiendan o priorizan.
6. Circunstancias personales: no hay nueva recogida ni inferencia.
7. Operaciones: no se proponen operaciones.
8. Valor: sin juicios sobre precios presentes o futuros.
9. Atractivo: sin ranking, idoneidad o puntuación inversora.
10. Terceros: no se incorporan recomendaciones.
11. Diseño: leyendas y rótulos descriptivos; color no usado como veredicto.
12. Acciones: solo navegación y cálculo local existente para probar su presentación.
13. Remuneración: sin cambios.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: pruebas con valores de ejemplo; sin almacenamiento o envío.
16. IA: ninguna nueva función.
17. Límites: se conservan supuestos, fechas, fuentes y advertencias.
18. Controles: vistas secundarias, resultados, rótulos, comparación de fórmulas,
    teclado, desbordes y matriz completa de escritorio y tablet.

Clasificación interna verde para las correcciones visuales acotadas, no una
validación jurídica global ni aprobación del módulo o servicios excluidos.

Ampliación acotada al detectar una infracción de lenguaje: el cierre de
Fundamentos decía «Qué elegir: recomendación final» y proponía para la mayoría
acumular fondos y retirar poco a poco. Se retira esa prescripción y se sustituye
por una explicación de los límites de la comparación, sin proponer alternativas,
productos u operaciones. La salida pasa a ser educativa, sin perfil personal,
remuneración ni conexión comercial. Se añade una prueba contra su reaparición.
Esta corrección no valida jurídicamente todo el contenido fiscal de Academia.

Ampliación de accesibilidad: el recorrido de los cinco capítulos detecta que,
del segundo al tercero, React cambia el texto y la clase activa sin insertar
nodos. La capa común solo observa inserciones y deja `aria-pressed` en el
capítulo anterior. Se autoriza observar también clase/estado de los botones
de grupos normalizados, sin alterar selección, contenido, cálculo ni guardado.
Clasificación verde: el cambio solo comunica correctamente la selección actual.

## Hallazgos iniciales

- La calculadora de Academia no formaba parte de las 23 vistas de la matriz.
  Tres rótulos interpolados dentro de SVG tienen caja de 0 × 0: máximo,
  punto medio y año final. La curva se dibuja, pero sus valores no se leen.
- Jubilación solo se examinaba en su estado inicial, antes de generar resultados.
- El gráfico histórico de Academia usa rótulos de 9–11 px que se reducen aún
  más al encajar en una columna. Requiere lectura específica del gráfico.
- El módulo de empresas conserva tamaños propios (cuerpo de 15 px y gráficos
  de 10–10,5 px) y sus pantallas dependen de autenticación. Se registra como
  pendiente, sin modificar ni activar Firebase. No hay compilación local del
  módulo disponible en `company-analysis/dist/` para una revisión renderizada.

## Resultado

**203 combinaciones de vista y ancho verificadas: 29 vistas × 7 anchos.**
Los cuatro procesos finales terminan con código 0; no se detectan nuevos
fallos de contraste, escala, desbordes, estructura, superficies, cabecera,
controles, ayudas, foco, interacción, estados, pestañas, contenido o fugas
dentro de esa cobertura. La validación estática y las pruebas de análisis
también terminan correctamente.

| Evidencia local en `output/entrega-4b-5/` | Alcance | Resultado |
| --- | --- | --- |
| `validate-final.log` | Validadores estáticos, contratos, análisis y 29 vistas a 1440 px | 29/29, código 0 |
| `matrix-wide-final.log` | 29 vistas a 1280 y 1180 px | 58/58, código 0 |
| `matrix-middle-final.log` | 29 vistas a 1024 y 900 px | 58/58, código 0 |
| `matrix-tablet-final.log` | 29 vistas a 820 y 768 px | 58/58, código 0 |

La vista manual y el servidor temporal de revisión quedan cerrados.
No se declara cerrada toda la fase 4B: el módulo de empresas y los servicios
dependientes de autenticación conservan las exclusiones descritas abajo.

## Correcciones aplicadas

1. **Academia / interés compuesto.** Los cinco rótulos se dibujan fuera del SVG
   como texto HTML de 12 px. Máximo, punto medio y año final vuelven a ser
   visibles; las curvas y polígonos conservan sus coordenadas calculadas.
   Unidades y leyenda explican las series; el trazo discontinuo distingue
   aportaciones del total acumulado sin depender únicamente del color.
2. **Formulario de Academia.** Ocho etiquetas enlazadas con sus controles,
   seis cajas numéricas con el componente común, selector homogéneo y
   corrección del pequeño desborde del deslizador. En tablet se apilan las
   columnas para conservar espacio de lectura.
3. **Fundamentos / gráfico histórico.** Rótulos de al menos 12 px efectivos,
   margen para que las cifras del eje no invadan las curvas y región de
   desplazamiento horizontal con nombre y ayuda para teclado. No se han
   recalculado ni sustituido series históricas.
4. **Fundamentos / décadas.** Anchura mínima común para las filas y región
   desplazable; las columnas siguen disponibles en tablet. Se conserva el
   contenido de la tabla. Esta actuación no equivale a una conversión de
   todas las comparaciones de Academia a tablas semánticas nativas.
5. **Contrastes y escala.** Título y entradilla del curso legibles sobre azul;
   cifra de la barra azul en blanco, destacados verdes oscuros, etiquetas
   claras sobre tarjetas oscuras y tamaños dentro de los roles establecidos.
6. **Cierre de Fundamentos.** Sustituida la prescripción de inversión por una
   interpretación educativa de los límites de la comparación. Actualizado
   también su índice, que conservaba el título antiguo.
7. **Navegación del curso.** El estado accesible sigue al capítulo seleccionado,
   incluso cuando el cambio no inserta elementos nuevos. No se modifica el
   contenido, el avance del alumno, los cálculos ni el almacenamiento.

## Cobertura de la revisión

| Familia | Vistas incluidas | Comprobación añadida o conservada |
| --- | --- | --- |
| Institucional (3) | Portada, Qué es NUVIA y sistema visual | Cabecera, cinco espacios, enlaces, superficies y muestras comunes |
| Economía y Finanzas (5) | Mercados, cotizaciones, informes; cartera y modelos | Filtros, estados vacíos, tablas y presentación local; sin validar fuentes externas |
| Patrimonio (11) | Vivienda, fiscalidad, jubilación inicial y resultados, temas, planificación patrimonial y cinco guías | Controles, amortización, cuatro curvas de resultados, ayudas y navegación |
| Familia, Salud y Bienestar (1) | Cuerpo, mente y salud | Identidad del espacio, cinco pilares y navegación separada de Patrimonio |
| Academia (8) | Portada, activos, glosario, cursos, esenciales, fundamentos, calculadora y curso | Gráficos y formulario; recorrido de los cinco capítulos y enlaces a apuntes |
| Lecturas (1) | Catálogo | Tarjetas, portadas, diálogo de lectura y devolución del foco |

La matriz comprende 29 vistas y siete anchos: 1440, 1280, 1180, 1024, 900,
820 y 768 px. El recorrido de capítulos verifica su cambio de título, selección
accesible y presencia del enlace a apuntes; no certifica cada página de los PDF,
los vídeos ni todos los estados posibles del curso.

## Pruebas y trazabilidad

- Nuevo contrato estático `docs/nuvia-family-review.test.mjs`, incorporado
  tanto a validación como a la futura comprobación del paquete publicado.
- Nuevo recorrido `scripts/check-family-review.mjs`: presencia y tamaño real
  de etiquetas, coordenadas numéricas, número de series, desplazamiento con
  teclado sin cambio de datos, actualización/restauración del gráfico al
  cambiar el capital y recorrido de los cinco capítulos.
- Los scripts completos de `academia.html` se han comparado contra `HEAD`:
  idénticos, normalizando únicamente los saltos de línea. No cambian fórmulas,
  series, valores iniciales ni manejadores de cálculo.
- La inspección manual en navegador local comprueba presentación y recorridos.
  Toda la revisión se realiza con conexiones externas bloqueadas.
- Los registros `piloto.log`, `correcciones.log`, `graficos.log` y los primeros
  intentos recogen fallos que condujeron a las correcciones; no son actas finales.
  Los registros terminados en `-final.log` son la evidencia de aceptación.

### Advertencias heredadas y límites

- `guia-impuestos.html` sigue en preparación, con `noindex` y sin la cabecera
  y el pie comunes. Su advertencia estática no convierte esa página en una
  vista terminada ni en parte de las 29 vistas visuales.
- La portada conserva dos avisos por imágenes sin carga diferida; no se han
  modificado las imágenes del hero en esta entrega.
- Se mantienen los mensajes conocidos del parseo inicial de las plantillas
  SVG: 10 en Academia, 4 en Jubilación y 1 en Fiscalidad. La prueba exige esos
  recuentos y distingue ese ruido de fallos nuevos.
- Cero fallos detectados por el auditor no equivale a certificación integral
  de accesibilidad, validez jurídica, actualidad informativa o servicios remotos.

## Pendientes reales y siguiente paso

1. **Empresas:** revisión visual renderizada de la copia local cuando exista
   una compilación revisable y se haya acordado el acceso, sin activar ni
   modificar la base actual. Sus tamaños propios siguen anotados, no corregidos.
2. **Producto estático:** completar el recorrido de entrada a Patrimonio y
   demás espacios con contenido ya desarrollado, aclarar qué está disponible
   y qué está en preparación. Es el siguiente bloque propuesto, sin backend.
3. **Contenido y confianza:** revisión editorial/fiscal separada, metodología,
   fuentes, fechas, límites de simulaciones y promesas de funcionalidades.
   La validación visual no acredita actualidad normativa ni exactitud de datos.
4. **Qué es NUVIA y vídeo:** conservar la página revisada y preparar la pieza
   explicativa cuando se cierre el texto y se disponga del vídeo aprobado;
   no hay un vídeo nuevo generado o publicado en esta entrega.
5. **Entrega:** revisión de los cambios locales acumulados y publicación en
   GitHub Pages en una actuación posterior. Esta entrega no compila `dist/`,
   confirma cambios ni publica nada.

Firebase/Firestore, nueva base, autenticación, comunidad y persistencia remota
permanecen aplazados por decisión del fundador. No se han editado esos archivos.

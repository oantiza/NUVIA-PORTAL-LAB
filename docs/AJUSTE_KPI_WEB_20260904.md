# KPI compactos en NUVIA · 04-09-2026

## Petición y alcance

El fundador señala que el tamaño y la tipografía de los KPI son excesivos y pide
revisarlos en toda la web. Cambio de presentación local: no publica ni modifica
Firebase, datos, cálculos, fuentes, indicadores o funciones.

## Diagnóstico y criterio

- Empresas: cifras de 28 px, etiquetas de 14 px con peso 800 y mayúsculas,
  tarjetas con altura mínima de 104 px. La captura acentúa su volumen visual.
- Cartera, curso y mercados: resultados vinculados a títulos de 28 px.
- Jubilación: cifras de 28 px y resultado principal de hasta 44 px.
  El resumen carecía de una cuadrícula: cuatro bloques apilados dejaban vacío
  gran parte del panel. Se dispone en cuatro columnas en escritorio y dos en
  tablet; los cuatro escenarios también se agrupan de dos en dos en tablet.
- Vivienda, planificación y ejemplos fiscales: distintas escalas de títulos.
- Las tablas, las métricas secundarias de cartera y las cifras pequeñas de
  Academia ya tienen una densidad adecuada; no se agrandan para igualarlas.
- Vivienda: una regla del último párrafo trataba un resultado como una nota
  de 12 px. Se limita esa regla a párrafos que no sean cifras; el resultado usa 18 px.

Escala compartida: 22 px para KPI principales, 18 px para compactos; tarjetas de
empresas con etiquetas de 14 px, peso 500 y sin mayúsculas forzadas. Espaciado
12 × 16 px, sin altura fija ni mínima. Subtextos legibles de 14 px. Se mantienen
las unidades, fechas y cifras completas, y los títulos y el hero de portada.

Se aplica a todos los KPI de la entrada alfa activa, también Fundamentales,
Resumen e Informe en pantalla; fechas de dividendos; laboratorio de cartera,
mercados, curso, vivienda, jubilación, planificación y ejemplos de guías y Academia.
No se modifica el programa externo original ni se reactivan vistas antiguas.

## Revisión interna del cambio · §12

1. Necesidad: facilitar la lectura comparada de los datos existentes.
2. Datos: los ya elegidos por el usuario o mostrados en la página; sin cambios.
3. Transformación: solo CSS, sin transformación financiera.
4. Salida: exactamente las mismas cifras, unidades y limitaciones.
5. Emisores: los existentes, sin nuevas selecciones.
6. Circunstancias personales: no se incorporan ni se leen otras.
7. Compra, venta o mantenimiento: no se añaden sugerencias.
8. Valor futuro: no se añade ninguna opinión ni estimación.
9. Ordenación por atractivo: ninguna; se conserva el orden.
10. Recomendaciones de terceros: no se añaden.
11. Diseño: reducción uniforme de énfasis; se conservan colores descriptivos.
12. Acción, contacto o ejecución: no se añaden.
13. Monetización o afiliación: sin cambios.
14. Actividad profesional: sin cambios ni vínculos nuevos.
15. Datos personales: ninguna escritura ni tratamiento nuevo.
16. IA: no interviene en la salida del producto.
17. Fuentes, fechas, fórmulas y límites: íntegros, no se ocultan.
18. Regresión: comprobaciones de escala y desbordes en el render del portal y
    del módulo, más revisión visual de escritorio y tablet.

Cambio visual de bajo riesgo; no modifica la clasificación previa de los módulos.
La validación jurídica externa permanece fuera del alcance alfa.

## Verificación

- Módulo compilado: 76 pruebas superadas; comprobaciones internas y Vite correctos.
- Regresión del módulo a 1440, 1280, 1024, 820 y 768 px: KPI a 22 px,
  etiquetas a 14 px y peso 500, sin altura mínima ni recortes; cinco gráficos,
  cambios de serie, periodos y estados de error conservados.
- Barrido de las 30 vistas del portal a 1440 y 820 px: la única incidencia
  inicial fue la cifra de Vivienda a 12 px descrita arriba. Corregida y repetida
  la prueba de Vivienda en ambos anchos: cero incidencias. Las otras 29 vistas
  superaron el barrido en ambos anchos.
- Nueva cuadrícula de Jubilación: prueba específica a 1440, 820 y 768 px;
  repetición en los dos anchos de tablet tras ajustar también los escenarios.
  Cero fallos de contraste, escala, estructura o desbordes.
- `npm run test:analisis`: superado. Paridad, consistencia, lenguaje, fundamentos
  tipográficos, tablas/resultados en fuente y dist y referencias estáticas: correctos.
  Consistencia conserva cuatro avisos previos no bloqueantes ajenos a los KPI.
- Revisión visual real de empresas y resultados de Jubilación en escritorio y
  tablet. Empresa de muestra: Iberdrola; simulador: datos de ejemplo ya incluidos,
  sin introducir datos personales. Cifras y fechas completas.
- `dist/` regenerado para vista previa. No se ha ejecutado commit, push ni
  despliegue de esta tanda. No se ha escrito en la base de datos.

Estado: ajuste local verificado; pendiente de confirmar y publicar si el fundador
lo ordena. La ejecución inicial del barrido conserva su salida fallida como
evidencia del hallazgo; no se presenta ese comando como superado sin la repetición.

## Orden posterior de publicación · 04-09-2026

El fundador ordena «publica» después de recibir el cierre de esta revisión.
Se autoriza confirmar esta tanda e integrarla en `main` para su despliegue por
GitHub Actions en GitHub Pages. No amplía el alcance a Firebase ni a la base de
datos. La publicación se dará por terminada solo tras verificar el resultado
del despliegue y los archivos servidos por la web pública.

# Alineación de formularios · 4 de septiembre de 2026

Estado de la revisión: corregido y verificado en local. Publicación autorizada
posteriormente por el fundador el 04-09-2026: «COMIT PUSHH PULL Y PUBLICA».
El resultado del despliegue se verifica en GitHub Actions antes de darlo por publicado.

## Solicitud y diagnóstico

El fundador solicita corregir el desnivel de los campos de Jubilación y revisar
este tipo de desalineamiento en el portal. La etiqueta «Subida anual estimada de
la pensión» ocupaba dos líneas y desplazaba su control unos 19,8 px respecto a los
otros tres a 1440 px. Los controles anteriores detectaban tamaños y desbordes,
pero no comparaban los bordes de los campos de una misma fila.

## Corrección

- La base compartida de formularios alinea las filas de etiquetas, controles y
  ayudas mediante subgrid. La etiqueta más larga determina el espacio necesario;
  no se recorta texto ni se reduce su letra para encajarlo.
- Se incorporan las cuadrículas pertinentes de Jubilación, incluidas opciones
  condicionales de estimación y renta temporal. No se alteran las columnas de los
  paneles compuestos ni los puntos de adaptación existentes.
- Se aproximan los títulos de los apartados 01 y 04 a sus números: la distribución
  anterior los empujaba hacia el extremo derecho.
- El control de formularios del render habitual compara ahora el borde superior
  e inferior de los controles que comparten fila, con tolerancia de 2 px.
- Una batería independiente recorre las páginas raíz y variantes de Academia y
  Cartera, además de los estados de Vivienda y Jubilación y una etiqueta larga
  de prueba en la página de referencia visual.

## Pruebas ejecutadas

1. Matriz específica: 22 rutas, siete anchos (1440, 1280, 1180, 1024, 900, 820 y
   768 px), 231 combinaciones de ruta/estado/ancho, 295 filas comparadas y cero
   desalineamientos detectados. Algunas vistas no tienen filas horizontales de
   campos y no aportan comparaciones; no se cuentan como formularios revisados.
2. Estados adicionales: hipoteca fija, variable y mixta, ofertas, compra o
   alquiler, amortización, presupuesto; falta de certificado EPSV, renta temporal
   y valor fuera de rango; etiqueta extensa en la muestra del sistema visual.
3. Compilación completa sin red externa: código de salida cero. Incluye pruebas
   funcionales y estáticas, render de 30 vistas a 1440 px y revisión del módulo
   de empresas en cinco anchos de escritorio/tablet, sin fallos reportados.
4. Revisión visual en navegador del formulario corregido en escritorio y tablet:
   etiquetas completas, controles alineados y cabeceras agrupadas.
5. `git diff --check`: sin errores de espacios.

Resultado detallado de la matriz: `output/field-alignment/results.json` (generado,
ignorado por Git). Repetición: `node scripts/audit-field-alignment.mjs`.

## Alcance y controles preservados

Cambio de presentación sobre funciones existentes, conforme al alcance de la
ficha de formularios de `ENTREGA_4B_2_BOTONES_FORMULARIOS_20260902.md`: no cambia
datos, cálculos, resultados, instrumentos, personalización, operaciones,
valoraciones, ordenaciones, recomendaciones de terceros, contratación,
remuneración, separación profesional, IA ni fuentes y límites. No introduce
recogida o guardado de datos personales. Los datos de prueba son sintéticos y
locales. No se tocan Firebase, backend ni conexiones de datos.

La clasificación interna del cambio visual es verde; no es una validación
jurídica global ni una decisión nueva sobre las funciones del producto. No se
añade ni retira ningún bloqueo. Se respeta el alcance exclusivo de escritorio y
tablet. La revisión no certifica todos los estados posibles, servicios remotos
ni accesibilidad completa. La orden posterior indicada arriba autoriza confirmar,
sincronizar y publicar estos cambios en el canal oficial de GitHub Pages.

# Ficha regulatoria — diseño de las páginas interiores

Fecha: 30 de agosto de 2026.
Marco aplicado: `docs/MARCO_REGULATORIO_OBLIGATORIO.md`.
Clasificación del cambio: VERDE, limitada al cambio de presentación descrito.

## Alcance

Se conserva la presentación local revisada por el usuario en Academia, Curso,
Fiscalidad, Jubilación, Lecturas, Mercados, Temas, Vivienda y las guías de Ahorro,
Calendario, Fiscalidad, Planificación y Sucesiones. Incluye cabeceras claras,
tipografía, tarjetas y acentos por sección. La navegación clasifica las guías de
Ahorro, Calendario y Sucesiones dentro de Temas y como páginas de guía.

Inicio no activa `nuvia-design-lab`; su portada y hero no se modifican. Tampoco
se modifican la suite de cartera ni la copia local de análisis de empresas.
La retirada de la entradilla de Academia tiene su ficha y prueba específicas.
Los recursos y propuestas de Remotion se conservan como fuentes de trabajo;
no se incorporan a las páginas ni a `dist/` por este cambio.

## Prueba regulatoria del cambio

1. Necesidad: facilitar la lectura y orientación en contenido educativo.
2. Entradas: las mismas que antes; no se añaden datos ni formularios.
3. Transformación: estilos y clasificación de rutas; ningún cálculo nuevo.
4. Resultado: el mismo contenido y resultados con presentación diferente.
5. Instrumentos: no se incorpora ninguna selección de emisores o instrumentos.
6. Circunstancias personales: no se añaden perfiles ni personalización.
7. Operaciones: no se añaden consejos de compra, venta o mantenimiento.
8. Valor o precio: no se añaden opiniones ni expectativas.
9. Ordenación: no se cambia el orden de datos ni se puntúa atractivo inversor.
10. Terceros: no se incorporan recomendaciones de terceros.
11. Color: identifica áreas y bordes decorativos por posición, no mérito financiero.
12. Acción: se mantienen los controles existentes; no se añade contratación,
    ejecución, contacto ni derivación.
13. Remuneración: no se añaden patrocinios, afiliación ni monetización.
14. Separación profesional: no se añaden marcas bancarias ni nexos con el agente.
15. Datos personales: no se modifica almacenamiento, seguimiento ni cesiones.
16. IA: no se introduce IA en la ejecución del portal.
17. Fuentes y supuestos: no se modifican los existentes.
18. Regresión: compilación, paridad funcional, referencias locales, consistencia,
    lenguaje del laboratorio, pruebas de análisis y control de ausencia de intro.

## Evidencias y límites

- `npm run build`: superado, incluida la puerta regulatoria de empresas, los
  validadores y todas las pruebas de `test:analisis`; `dist/` generado.
- `npm run lint` en `remotion/nuvia-academy-cierre`: superado (ESLint y TypeScript).
- Revisión de cabeceras de las 13 páginas interiores en navegador de escritorio.
- Comprobación DOM de las 13 páginas a 1440 y 1024 px: contenido y título
  presentes, sin desbordamiento horizontal en las 26 combinaciones.
- Comprobación visual adicional de Vivienda, Fiscalidad y Lecturas en tablet.
- Navegación a «Mercados y cotizaciones» operativa: 16 filas y 9 filtros.
- Retiradas las decoraciones heredadas del hero y la escena decorativa anterior
  de Lecturas bajo `nuvia-design-lab`. La primera provocaba 80 px de
  desbordamiento en Vivienda; la segunda asomaba por fuera del nuevo banner.
  No se eliminan imágenes del disco ni se afecta a Inicio.
- La auditoría automatizada de render se omitió porque Playwright no está
  instalado en este entorno. Se realizó la revisión acotada de navegador
  descrita arriba; no se afirma una auditoría exhaustiva de contraste de todo el
  portal. No se realizaron pruebas móviles.
- Los informes privados, la auditoría histórica con datos personales, los
  renders y los temporales quedan fuera del repositorio público.

## Preparación de publicación

El usuario solicita publicar después de revisar la versión local. Se integra
`origin/main` conservando su retirada de la entradilla; la misma prueba queda
con el nombre `nuvia-academy-sin-intro.test.mjs`. Inicio, cartera, análisis de
empresas y el flujo de GitHub Pages no presentan diferencias respecto de main.
La publicación usa el flujo existente, que compila y valida `dist/` antes de
desplegar. Para revertir la integración se toma como línea base su padre de
main anterior (`9a31c33`, segundo padre del merge) y se vuelve a ejecutar ese
mismo flujo, sin reescribir el historial.

El cambio no incorpora instrumentos, personalización, colaboradores,
monetización, tratamiento de datos ni nuevos terceros. No modifica avisos,
consentimientos o condiciones existentes. La clasificación verde se limita a
esta presentación y navegación; no convierte la aprobación interna en un
dictamen jurídico ni certifica el portal completo. Las validaciones pendientes
de funciones preexistentes no se dan por resueltas mediante esta ficha.

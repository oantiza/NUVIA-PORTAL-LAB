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
- Vista local de Mercados comprobada en el navegador antes de esta subida.
- La auditoría automatizada de render se omitió porque Playwright no está
  instalado en este entorno. No se afirma una validación visual exhaustiva ni
  de contraste de todas las páginas. No se realizaron pruebas móviles.
- Los informes privados, la auditoría histórica con datos personales, los
  renders y los temporales quedan fuera del repositorio público.

Esta ficha registra la revisión del cambio, no una certificación jurídica del
portal completo. La subida se limita a la rama de trabajo; no modifica `main`
ni activa el despliegue de producción. Antes de publicar en producción deben
completarse las puertas de publicación del marco, incluida la revisión visual
pendiente y cualquier validación específica que resulte aplicable.

# Entrega 4A · Bloque 2: anchos y espaciados

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local;
pendiente de confirmación y publicación junto con el bloque 4A-1.

## Alcance y decisión previa

Consolidar las medidas de página y el ritmo de las secciones compartidas, sin
rediseñar la portada ni modificar contenidos, cálculos o conexiones. Se conserva
el trabajo local de 4A-1. Firebase, la nueva base de datos y los documentos de
ese desarrollo permanecen fuera del alcance.

Problemas observados en las reglas actuales:

1. La cabecera de Cartera incluye 48 px interiores adicionales, por lo que su
   texto no se alinea con el laboratorio en escritorio.
2. La regla de tableta de `.nv-section` sobrescribe los 48 px de las secciones
   compactas y los aumenta a 64 px.
3. Sistema visual duplica reglas estructurales y anula parte de la adaptación
   a tableta de los componentes que debería mostrar.

Reglas que se consolidan:

- ancho general máximo: 1240 px;
- margen lateral mínimo: 48 px en escritorio y 28 px hasta 1120 px;
- excepción explícita de la cabecera: 28 px hasta 1319 px, conservando la
  solución ya validada para los cinco espacios y Qué es NUVIA;
- ancho de lectura: 760 px, conservado;
- sección normal: 80 px por extremo; 64 px en tableta;
- sección compacta: 48 px por extremo, también en tableta;
- apertura compacta de Cartera: 64 px arriba y 32 px abajo, alineada con el
  contenido; separación del laboratorio: 48 px.

## Ficha regulatoria previa (18 preguntas)

1. Finalidad: hacer legible y coherente la disposición de información existente.
2. Datos: HTML y estilos locales; no se reciben datos nuevos.
3. Transformación: anchos, márgenes y separaciones mediante CSS.
4. Salida: mismo contenido, sin recortes ni cambios de orden.
5. Instrumentos: no se añade ni destaca ninguno.
6. Circunstancias personales: no se utilizan.
7. Actuaciones inversoras: no se sugieren.
8. Precio o valoración: no se emite opinión.
9. Mérito inversor: no se puntúa ni ordena.
10. Recomendaciones de terceros: no se incorporan.
11. Diseño: cambia alineación y espacio, no colores ni énfasis sobre resultados.
12. Contratación: no se añaden o modifican acciones.
13. Remuneración y afiliación: sin cambios.
14. Agente vinculado: se preserva la separación profesional.
15. Datos personales: sin nuevos tratamientos o persistencias.
16. IA: no se incorpora al producto.
17. Fuentes, fórmulas y límites: íntegramente conservados.
18. Controles: pruebas estáticas de medidas y reglas únicas, medición automática
    de alineación y espaciado, matriz de escritorio/tableta y revisión visual.

Clasificación interna: verde para esta intervención de presentación, no una
aprobación jurídica del producto completo.

## Cambios realizados

- `estilos/nuvia-tokens.css`: medidas compartidas de margen lateral y separación
  vertical, con la excepción de cabecera documentada y conservada.
- `estilos/nuvia-components.css`: contenedores, cabecera, pie y secciones consumen
  esas medidas. La regla de tableta ya no anula la variante compacta.
- `estilos/nuvia-pages.css`: Cartera comparte el ancho del contenido y elimina
  el relleno lateral adicional de su apertura. Se normalizan sus separaciones.
- `estilos/sistema-visual.css`: se eliminan las copias de reglas estructurales;
  la muestra utiliza los componentes reales y su adaptación a tableta.
- `docs/nuvia-layout-foundations.test.mjs`: prueba de regresión de las medidas,
  la ausencia de duplicados y la alineación de Cartera. Se incorpora a la
  validación y a las comprobaciones previstas de compilación en `package.json`.
- `scripts/check-render.mjs`: se añade la medición de anchos y posiciones reales
  de los contenedores y del espacio de las secciones compactas. No se relajan
  las comprobaciones anteriores.

No se modifican las páginas HTML, los cálculos ni el contenido. La eliminación
de las variantes duplicadas de fondo en Sistema visual conserva los mismos
colores a través de sus roles semánticos comunes.

## Validación

Pruebas sin conexiones externas, con los mecanismos de aislamiento de 4A-1.
No se abre el módulo de empresas ni se prueban cuentas o APIs remotas.

| Comprobación | Resultado |
|---|---|
| Piloto previo, Cartera, Mercados y Sistema visual a 1440 y 1024 px | Falló como estaba previsto y confirmó las desviaciones descritas |
| Piloto posterior, mismas tres páginas a 1440, 1024 y 768 px | 9 combinaciones correctas |
| Validación general, incluidas pruebas locales de analítica | Correcta, salida 0 |
| Matriz de 23 vistas a 1440 px | 23 correctas |
| Matriz a 1280 y 1180 px | 46 correctas |
| Matriz a 1024 y 900 px | 46 correctas |
| Matriz a 820 y 768 px | 46 correctas |
| Pruebas de fundamentos tipográficos y disposición | Correctas |
| Revisión de diferencias de los archivos modificados por esta entrega | Sin errores de formato |

Total: **161 combinaciones de vista y ancho correctas**, además del piloto.
Las comprobaciones automáticas no detectaron fallos de contraste evaluado,
escala, desbordamiento, estructura, colisiones de cabecera, controles sin nombre,
ayudas, foco, estados, pestañas, contenido externo o contenido ausente. No se
detectaron errores nuevos de consola. Esto no equivale a una certificación de
accesibilidad completa ni valida los servicios remotos.

Se conservan los avisos ya conocidos de la validación: cabecera y pie no comunes
y `noindex` en `guia-impuestos.html`, y dos imágenes sin carga diferida en Inicio.
No se eliminan avisos para obtener una validación favorable.

Revisión visual con la habilidad de navegador: Cartera a 1440 px, Sistema visual
a 768 px, Mercados a 1024 px y portada a 1440 px. Se comprobaron alineación,
separaciones y continuidad visual. No se activaron contenidos externos.

Registros locales de evidencia, ignorados por Git:

- `output/entrega-4a-2/piloto-antes.log`
- `output/entrega-4a-2/piloto-despues.log`
- `output/entrega-4a-2/validate.log`
- `output/entrega-4a-2/matrix-wide.log`
- `output/entrega-4a-2/matrix-middle.log`
- `output/entrega-4a-2/matrix-tablet.log`

## Límites y continuación

Este bloque cierra los anchos compartidos y el espaciado de secciones, no toda
la Entrega 4A. El siguiente bloque corresponde a roles de superficie y revisión
de excepciones por arquetipo. Los patrones específicos de formularios,
herramientas y componentes se revisarán sin convertir toda la web en un único
ancho indiscriminado.

Las imágenes de las tarjetas de Lecturas y la navegación interna se mantienen
en el lote de componentes 4B. No se presentan como corregidas por este bloque.

No se ha generado `dist/`, confirmado cambios ni publicado. La compilación y
publicación requieren una revisión separada del conjunto que se vaya a incluir;
el árbol contiene trabajo ajeno sobre la nueva base de datos que debe permanecer
aislado. No se ha modificado Firebase, Firestore, la nueva base de datos, sus
documentos ni la copia del módulo de empresas.

Para reproducir la validación de escritorio y tableta sin servicios externos:

```powershell
$env:NUVIA_RENDER_OFFLINE = '1'
npm run validate
npm run auditar:completo
```

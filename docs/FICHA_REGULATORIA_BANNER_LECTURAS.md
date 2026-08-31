# Ficha regulatoria — banner de Lecturas en Inicio

Fecha: 31 de agosto de 2026. Marco: `MARCO_REGULATORIO_OBLIGATORIO.md`.
Clasificación: VERDE, limitada a la sustitución visual solicitada.

## Prueba previa

1. Necesidad: identificar el acceso a la sección editorial de Lecturas.
2. Entrada: imagen aportada y seleccionada expresamente por el usuario.
3. Transformación: copia íntegra y ajuste proporcional en la página.
4. Resultado: nuevo banner en Inicio, sin textos HTML duplicados encima.
5. Instrumentos o emisores: ninguno añadido por la pieza.
6. Circunstancias personales: ninguna.
7. Compra, venta o mantenimiento: ninguna sugerencia.
8. Opiniones sobre precios o valores: ninguna.
9. Ranking por atractivo inversor: ninguno.
10. Recomendaciones de terceros: ninguna añadida por el banner.
11. Color y diseño: identidad editorial; árbol y paisaje decorativos, sin veredicto.
12. Acción: el mismo enlace interno a `lecturas.html`; sin contratación ni contacto.
13. Remuneración, patrocinio o afiliación: ninguno nuevo.
14. Separación profesional: sin marcas bancarias ni conexión con el agente.
15. Datos personales: no se reciben ni cambian sus tratamientos.
16. IA: no se integra ni se genera una nueva imagen.
17. Fuente: archivo aportado por el usuario, sin datos, fórmulas o series financieras.
18. Controles: integridad SHA-256, proporción, enlace y accesibilidad; prueba en
    fuente y `dist/`, compilación y revisión en escritorio y tablet.

## Alcance y puertas

Solo se sustituye el banner de Lecturas de Inicio. Se retira el texto HTML
superpuesto porque la imagen ya incluye título, lema y un botón dibujado.
Todo el banner sigue siendo un enlace accesible a la misma sección.
Se conservan la cabecera azul y contenidos de `lecturas.html`, el hero de
Inicio, Academy y las herramientas. El archivo anterior no se borra.

La solicitud autoriza usar esta imagen en el proyecto, sin presumir una
licencia más amplia. Se usa tal cual, sin corregir las letras integradas
en el archivo. No cambian proveedores, datos, avisos ni consentimientos.
Esta revisión no certifica jurídicamente otras funciones del portal.
La reversión recupera la referencia anterior mediante Git; no hay pérdida
de recursos. Publicación por GitHub Pages tras validar el cambio.

## Verificación

- Imagen original y copia: 4724 × 896 píxeles; SHA-256
  `ADA84AAD9F73B3BB913C87BD40CCF5D52FAD9CE1E7D4F427E3D8F5599CBA5E1A`.
- `npm run build` superado; nueva prueba de banner incluida en la validación
  de fuente y `dist/`, junto a las pruebas existentes.
- Imagen cargada y revisada en navegador de escritorio y tablet (1024 px),
  sin desbordamiento, recorte ni duplicación de texto. Enlace a Lecturas probado.
- La auditoría general de render sigue omitida por falta de Playwright;
  la revisión visual acotada se realizó con el navegador disponible.

## Corrección de legibilidad tras revisión del usuario

El usuario señala que el banner se ve mal. El JPEG contiene letras deformadas
en el título y lema, además del botón dibujado «Expituras»; no es una falta de
resolución de la página. Se reutiliza el paisaje limpio ya existente en el
repositorio (`lecturas-con-criterio-fondo-compacto-family-wealth.webp`) y se
componen título, lema y acceso con texto HTML real, sin generar ni editar imágenes.
Textos: «Lecturas con Criterio», «Historias de interés duradero» y
«Explorar lecturas». Se mantiene el único enlace interno a `lecturas.html`.

Se repiten los 18 puntos de la prueba: finalidad editorial, sin datos,
instrumentos, cálculos, personalización, recomendaciones, precios, rankings,
patrocinio, terceros nuevos, tratamiento personal, IA ni conexión profesional.
Solo cambian el recurso de fondo y la representación tipográfica. El paisaje
y sus colores no expresan resultados financieros. Clasificación VERDE limitada
a esta corrección de presentación, sin certificación del resto del portal.

Controles previstos: fondo sin texto duplicado, cadenas HTML exactas, encaje
del texto en escritorio y tablet, navegación por teclado, cabecera azul de
Lecturas intacta, compilación y validadores. El JPEG se conserva como referencia
en el repositorio pero deja de mostrarse; reversión mediante Git.

Verificación de la corrección: `npm run build` superado, incluido el control
del fondo limpio y los tres textos en fuente y `dist/`. Revisado en navegador
a 1440, 1024 y 768 px: imagen cargada, los cuatro elementos de texto/filete
dentro del banner y sin desbordamiento horizontal. Capturas de escritorio y
tablet revisadas; foco de teclado visible y enlace a Lecturas probado con clic.
La activación con Enter no se pudo confirmar mediante el navegador automatizado.
La cabecera
interior y el resto de Inicio permanecen sin cambios. Se conservan los límites
de la auditoría general indicados antes; no se realizaron pruebas móviles.

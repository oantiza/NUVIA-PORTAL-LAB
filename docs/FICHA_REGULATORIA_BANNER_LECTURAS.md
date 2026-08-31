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

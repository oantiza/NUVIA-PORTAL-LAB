# Ficha regulatoria — rediseño de la portada · 1 de septiembre de 2026

Marco leído: `docs/MARCO_REGULATORIO_OBLIGATORIO.md`. Definición canónica leída:
`docs/DEFINICION_NUVIA.md`. Clasificación previa: VERDE — presentación y
navegación, sin nuevas funciones financieras.

## Prueba previa

1. Necesidad: la portada repetía tres banners idénticos, la jerarquía
   tipográfica era poco clara y faltaba un bloque que ordenara la entrada al
   sitio. Se pule la presentación conservando secciones, textos y destinos.
2. Entradas: `index.html` publicado, tokens y componentes existentes,
   fotografías locales ya aprobadas. Ningún dato ni fuente nueva.
3. Transformación: los tres ámbitos pasan de banner único repetido a un
   componente de lámina con dos composiciones (a sangre y partida, esta
   última espejada en Bienestar); «El proyecto» se reorganiza a dos columnas
   de lectura con los valores en carril lateral; se añade un sumario de
   navegación; se ajusta el encuadre de la fotografía del hero; se separan
   Academia, Lecturas y el pie con una franja del fondo técnico existente.
4. Resultado: cinco ámbitos con un único acceso cada uno, mismos textos y
   mismos destinos, y un índice que enlaza páginas ya publicadas.
5. Instrumentos o emisores identificables: ninguno. Las fotografías son
   decorativas, con texto alternativo vacío y `aria-hidden`; no se presentan
   como noticia, cotización ni evidencia de un acontecimiento.
6. Circunstancias personales o personalización: ninguna.
7. Consejo de compra, venta o mantenimiento: ninguno. Los textos describen
   materias educativas.
8. Opiniones de precio o de valor: ninguna.
9. Ordenación por atractivo inversor: ninguna. La numeración de láminas y del
   sumario identifica materias y su orden de lectura, no preferencia.
10. Recomendaciones de terceros: ninguna.
11. Color y diseño: azul de identidad, fondo nube y fondo técnico existentes,
    bronce como filete editorial. Sin semáforos, veredictos ni promesas de
    resultado. Contraste comprobado sobre las tres superficies.
12. Llamadas a la acción: un solo acceso por ámbito, todos internos e
    informativos — `mercados.html`, `temas.html?topic=planificacion-patrimonial`,
    `temas.html?topic=bienestar`, `academia.html`, `lecturas.html`. Academia y
    Lecturas conservan el acceso editorial discreto «Entrar» a 16 px con área
    de interacción de 44 px. No hay contacto, contratación, derivación ni
    ejecución. El sumario enlaza a páginas existentes sin crear destinos nuevos.
13. Remuneración, publicidad, patrocinio o afiliación: sin cambios.
14. Separación profesional: no se incorpora actividad, marca ni identidad
    bancaria, ni captación de clientes. La separación entre NUVIA, la actividad
    del agente financiero y su entidad se mantiene intacta.
15. Datos personales: ninguno nuevo; no cambia su tratamiento, cookies ni
    proveedores.
16. IA: ninguna función nueva; no se generan imágenes ni textos automáticos en
    la página. Las fotografías son activos ya existentes del repositorio, sin
    editar.
17. Fuentes: material local del proyecto. No se añaden cifras, fechas,
    indicadores ni fórmulas financieras en la portada. Los indicadores, el
    archivo y la actualización dinámica siguen viviendo en Mercados.
18. Controles: un único acceso por ámbito con texto y destino exactos;
    ausencia de datos numéricos en Inicio; conservación del hero, la franja de
    pilares, la cabecera, el pie y las páginas interiores; imágenes sin editar
    (hash intacto); sin desbordamiento horizontal a 1440 y 1024 px;
    compilación completa y revisión visual en escritorio y tablet.

## Alcance y puertas

Solo se modifican `index.html` y el bloque nuevo al final de
`estilos/nuvia-pages.css`. No se tocan tokens globales, componentes
compartidos, páginas interiores, calculadoras, rutas, la suite de cartera ni
la copia local de `company-analysis/`. No se elimina ninguna imagen ni activo.
Las clases nuevas usan el prefijo `home26-` para no colisionar con reglas
existentes. Esta revisión no certifica el contenido preexistente. Reversión
mediante Git. Publicación por el canal oficial de GitHub Pages, compilando
`dist/` con Actions, después de superar las puertas automáticas y revisar la
página resultante.

## Contenido nuevo declarado

- **Sumario**: bloque nuevo. Es navegación a ocho páginas ya publicadas. No
  añade instrumentos, datos, cifras, comparaciones ni recomendaciones.
- **Numeración editorial**: ordena la lectura sin expresar preferencia. Las
  bandas de pie de foto se han retirado por petición del usuario.
- **Franjas de separación**: superficie técnica existente (`--nv-mist`), sin
  contenido.

## Verificación completada antes de publicar

- [x] Compilación completa y pruebas superadas en fuente y en `dist/` mediante
      `npm run build`; las puertas regulatorias y funcionales terminan en verde.
- [x] Navegador a 1440 y 1024 px: el ancho desplazable coincide con el ancho
      útil de la página, sin desbordamiento horizontal. Las tres láminas miden
      exactamente lo mismo que Academia y Lecturas: 1240 px en escritorio y
      953 px en tablet. El hero mantiene visible a la familia.
- [x] Un solo acceso por ámbito, con los textos y destinos exactos de la lista
      del punto 12, comprobado automáticamente en fuente y `dist/`.
- [x] Ausencia de cifras, fechas o indicadores dinámicos en Inicio; Mercados
      conserva sus cinco indicadores en su página interior.
- [x] Hashes SHA-256 de las seis fotografías comprobados sin cambios; ningún
      activo se ha editado ni borrado.
- [x] Foco visible en los cinco accesos. Los tres botones principales conservan
      contraste blanco/azul oscuro y un área mínima de 44 px; «Entrar» mantiene
      16 px y el contraste aprobado sobre las imágenes de Academia y Lecturas.

Comprobación adicional solicitada: las tres láminas están separadas por 20 px
(aproximadamente 0,5 cm) y no queda ningún pie «imagen decorativa» visible.

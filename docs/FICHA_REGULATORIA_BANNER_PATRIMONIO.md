# Ficha regulatoria — banner de Patrimonio en Inicio

Fecha: 31 de agosto de 2026. Marco obligatorio leído íntegramente.
Clasificación previa: VERDE para este cambio visual y de navegación editorial.

## Prueba previa

1. Necesidad: presentar conjuntamente las tres materias educativas de Patrimonio.
2. Entradas: diseño y fotografía aportados por el usuario; enlaces locales existentes.
3. Transformación: sustituir las tarjetas de Inicio por un banner con tres enlaces.
4. Resultado: título y descripción a la izquierda, accesos numerados a la derecha,
   fotografía decorativa de vivienda, pareja y organización doméstica al fondo.
5. Instrumentos o emisores identificables: ninguno.
6. Circunstancias personales del visitante: ninguna.
7. Compra/venta/mantenimiento como consejo: no; «compra o alquiler» nombra una
   materia educativa, sin seleccionar ninguna alternativa.
8. Opiniones sobre precios: ninguna.
9. Atractivo inversor: no; numeración editorial que conserva el orden existente.
10. Recomendaciones de terceros: ninguna.
11. Diseño: fotografía ambiental y contraste de lectura, sin semáforos ni promesas.
12. Acciones: solo navegación a vivienda.html, fiscalidad.html y jubilacion.html.
13. Remuneración, afiliación y publicidad: ninguna añadida.
14. Separación profesional: sin bancos, captación ni contactos comerciales.
15. Datos personales: no se recogen ni se modifica su tratamiento.
16. IA: se usa una imagen suministrada como decoración, no como prueba de hechos
    o resultados; no se añade IA interactiva ni se generan recomendaciones.
17. Fuente: archivos aportados por el usuario. Sin nuevos datos financieros.
18. Controles: título accesible, tres rutas conservadas, imagen original,
    prueba de regresión, compilación y comprobación visual escritorio/tablet.

## Alcance y puertas de control

Solo el bloque #patrimonio de Inicio y sus estilos específicos. La fotografía
se copia sin editar; la tipografía y los enlaces se construyen como HTML real,
no como una captura sin accesibilidad. Se conserva el fondo general de Inicio,
los demás banners y todas las páginas de destino y sus herramientas.
No se borran los antiguos archivos de imagen. Cambio reversible mediante Git.
Antes de publicar: revisar contraste, recorte, navegación y pruebas. No cambia
el tratamiento de cookies, privacidad, proveedores ni avisos legales.

## Validación antes de publicación

- Compilación y pruebas completas superadas en fuente y dist; se confirma el
  hash SHA-256 del JPEG aportado y la presencia de los tres destinos.
- Revisión visual con navegador a 1440 × 1000 y 1024 × 900: banner de 400/380 px
  de alto, imagen cargada, texto legible y sin desbordamientos horizontales.
- Se han pulsado los tres enlaces y comprobado sus páginas y encabezados.
- Estados de interacción y foco definidos sin modificar navegación global.
- La auditoría general de render se omite por falta de Playwright; se realiza
  la comprobación visual acotada con el navegador disponible. Su selector de
  Inicio se actualiza al nuevo banner, retirando expectativas de tarjetas y
  de la banda macro que ya no existen en Inicio.
- Sin cambios en páginas interiores, contenidos financieros, datos o cálculos.
  La fotografía no se presenta como resultado esperado de ninguna operación.

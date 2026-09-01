# Ficha regulatoria — fondo unificado de Inicio

Fecha: 31 de agosto de 2026. Marco leído: `MARCO_REGULATORIO_OBLIGATORIO.md`.
Clasificación: VERDE, exclusivamente para este ajuste de presentación.

## Prueba previa

1. Necesidad: continuidad visual entre los bloques informativos de Inicio.
2. Entrada: tono azul grisáceo ya usado en Mercados y Patrimonio, elegido por el usuario.
3. Transformación: retirar las dos excepciones de fondo blanco de las secciones.
4. Resultado: fondo general existente `--nv-cloud` (`#f4f6f9`) en todos los bloques.
5. Instrumentos o emisores: ninguno nuevo.
6. Circunstancias personales: ninguna.
7. Consejo operativo: ninguno.
8. Opiniones de precios: ninguna nueva.
9. Ordenación por atractivo inversor: ninguna.
10. Recomendaciones de terceros: ninguna nueva.
11. Color y navegación: fondo neutral de continuidad, sin veredicto ni semáforo.
12. Llamadas a la acción: no cambian botones, enlaces ni destinos.
13. Remuneración, publicidad o afiliación: sin cambios.
14. Separación profesional: no se añaden conexiones bancarias ni profesionales.
15. Datos personales: no se modifica su tratamiento.
16. IA: ninguna añadida.
17. Fuente: sistema de diseño local; no se añaden datos ni fórmulas financieras.
18. Controles: ausencia de franjas blancas de sección en Inicio, conservación
    del hero y recursos, compilación y revisión visual en escritorio/tablet.

## Alcance y puertas

Solo se retira `nv-section--white` en «Qué es NUVIA» y «Familia, Salud y
Bienestar». El resto ya deja ver el fondo general. Se conservan las tarjetas
blancas, banners, tamaños, textos, datos dinámicos, header, footer y páginas
interiores. No se modifican tokens globales ni imágenes. No cambian avisos,
privacidad o proveedores. Esta revisión no certifica el contenido preexistente.
Reversión mediante Git; no se borran activos. Publicación por GitHub Pages
después de compilar, validar el alcance y comprobar el resultado.

## Verificación

### Ajuste posterior del rótulo «El proyecto»

Revisión previa (31 de agosto de 2026): VERDE. Se iguala únicamente el color
del rótulo y su filete al de los rótulos de las secciones siguientes mediante
el token existente `--nv-text-muted`. Conserva tamaño, texto y posición. Para
los puntos 1–4, la necesidad y transformación son homogeneidad cromática de
encabezados; los puntos 5–17 permanecen sin cambios y sin nuevos datos,
instrumentos, recomendaciones, acciones comerciales, personalización o IA.
Punto 18: prueba de la regla de color y comparación en navegador con Mercados
y Patrimonio antes de publicar. No altera el perímetro regulatorio ni la
separación profesional, y es reversible mediante Git.

Validación del ajuste: compilación y pruebas superadas; el navegador confirma
`rgb(91, 100, 114)` tanto en texto como en filete para Proyecto, Mercados,
Patrimonio, Familia y Academia. Sin cambios de contenido ni navegación.

- Compilación y pruebas completas superadas, incluido el nuevo control de
  fondos en fuente y `dist/`.
- Navegador a 1440 y 1024 px: fondo general `rgb(244, 246, 249)` visible en
  las siete secciones de contenido; no quedan franjas blancas alternas.
- Tarjetas de Patrimonio blancas (`rgb(255, 255, 255)`), imágenes conservadas,
  sin desbordamiento horizontal. Capturas de Proyecto/Mercados y Familia revisadas.
- No se han cambiado estilos globales ni páginas interiores. La auditoría
  general de render sigue omitida por falta de Playwright; se ha realizado
  la comprobación visual acotada con el navegador disponible.

## Sustitución global por el fondo azul claro · 1 de septiembre de 2026

La petición posterior del usuario amplía expresamente el alcance a toda la web
y sustituye el fondo general casi blanco por la superficie técnica azul claro
ya existente `--nv-mist` (`#e8edf3`). Esta decisión reemplaza, desde esta fecha,
la asignación anterior de `--nv-cloud` como fondo general.

Clasificación previa: VERDE. Es un cambio cromático neutral y homogéneo; no
añade datos, instrumentos, cálculos, recomendaciones, jerarquías de atractivo,
personalización, contactos, contratación, publicidad, IA ni tratamiento de
datos. Se modifica solo el rol semántico `--nv-bg`; las tarjetas, banners,
cabeceras oscuras y superficies con función propia conservan sus colores y
contrastes. Controles: asignación exacta del token, compilación completa,
ausencia de fondos blancos de página y revisión de escritorio/tablet.

### Continuidad del hero con el nuevo fondo

Revisión previa: VERDE. El fundido inferior del hero deja de terminar en
`--nv-cloud` y pasa a terminar en el rol general `--nv-bg`, ahora vinculado a
la bruma azul. Así se elimina el corte blanquecino señalado por el usuario sin
modificar la imagen, su encuadre, altura, texto ni navegación. El ajuste es
exclusivamente cromático y conserva el resto de controles de esta ficha.

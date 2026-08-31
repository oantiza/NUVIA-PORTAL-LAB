# Ficha regulatoria — variantes locales de Patrimonio y Bienestar

Fecha: 31 de agosto de 2026. Marco obligatorio leído íntegramente.
Clasificación previa: VERDE, presentación editorial sin nuevas funciones.
Entrega prevista: dos adaptaciones en la home local, pendientes de aprobación;
no se publica ni se sincroniza el repositorio remoto en esta iteración.

## Prueba previa

1. Necesidad: homogeneizar títulos de sección fuera del banner y comparar las
   composiciones editorial e índice con las fotografías ya aprobadas.
2. Entradas: referencias del usuario, imágenes locales y destinos existentes.
3. Transformación: Patrimonio adopta la composición editorial de Bienestar;
   Bienestar adopta el esquema descriptivo con materias numeradas de Patrimonio.
4. Resultado: rótulo y título fuera; explicación y materias dentro de cada imagen.
5. Instrumentos o emisores: ninguno añadido.
6. Personalización: ninguna.
7. Compra/venta/mantenimiento como consejo: ninguno; el texto describe materias.
8. Opinión de precio: ninguna.
9. Atractivo inversor: ninguno; la numeración identifica materias de bienestar.
10. Recomendaciones de terceros: ninguna añadida.
11. Diseño: azul de continuidad y contraste, sin veredictos o promesas de resultados.
12. Acciones: los tres destinos educativos de Patrimonio y el acceso existente
    a temas.html?topic=bienestar. Los cuatro pilares de Bienestar son descriptivos,
    no nuevos enlaces, ni prestaciones disponibles ficticias.
13. Remuneración, publicidad o afiliación: sin cambios.
14. Separación profesional: sin captación, contactos ni marcas bancarias.
15. Datos personales: ninguno nuevo.
16. IA: sin nuevas funciones ni generación de imágenes; fotos decorativas existentes.
17. Fuentes: material local del proyecto y referencia visual del usuario.
18. Controles: encabezados fuera, imágenes intactas, cuatro materias descriptivas,
    destinos conservados, compilación y revisión visual escritorio/tablet.

## Límites y puertas

Se conservan rutas, calculadoras y contenidos de las páginas interiores. La sección
de Bienestar mantiene «En preparación» visible fuera del banner. Las nuevas frases
solo describen temáticas, sin consejos médicos, diagnósticos o efectos terapéuticos.
Se preservan las imágenes, el fondo general de la home y los demás bloques.
No se modifican fuentes de datos, privacidad, cookies, proveedores o APIs.
La revisión de estas variantes no certifica todo el contenido preexistente.
Reversión mediante Git; no se borra ningún archivo de imagen.

## Validación local

- Compilación completa y pruebas superadas en fuente y dist. Hashes de ambas
  fotografías intactos; encabezados y rótulos fuera del artículo del banner.
- Navegador a 1440 y 1024 px: lectura y composición revisadas; sin desbordamiento
  horizontal ni contenido recortado. En tablet ambos banners miden 430 px de alto.
- Los tres destinos de Patrimonio y el enlace de Bienestar se conservan.
- No se modifica ninguna página interior, calculadora, dato o integración.
- Auditoría general de render omitida por falta de Playwright; revisión visual
  acotada realizada con el navegador disponible.
- Sin commit, push ni publicación: las versiones quedan pendientes de aprobación.

## Comparación A/B separada

Se amplía la entrega local a dos alternativas completas: A muestra Patrimonio
y Bienestar en composición editorial; B muestra ambos con descripción e índice
de materias. Los títulos de sección y rótulos permanecen fuera en las dos.
Mismos textos descriptivos, fotografías, destinos y límites de la prueba previa;
los puntos 1–18 conservan clasificación VERDE. Las materias de Bienestar no se
convierten en enlaces ficticios. La comparación vive en docs/previews, fuera de
las páginas de producción, y se sirve exclusivamente en localhost. No se publica.

Comparación A/B comprobada en navegador: dos banners editoriales en A; tres
accesos de Patrimonio y cuatro materias de Bienestar en B. Selector A/B funcional,
fotografías cargadas, títulos fuera y sin desbordamientos a 1024 px. La lista
explícita de páginas y directorios de build-site no incluye docs/previews.

## Selección editorial y ajuste tipográfico

El usuario elige el estilo editorial para ambos bloques. Se mantiene el trabajo
solo en local, sin autorización de publicación. Revisión previa: VERDE; puntos
1–4 actualizados a adopción de la alternativa A y títulos interiores sans serif
de 30–36 px (antes 36–48 px). Los puntos 5–17 siguen sin cambios de datos, acciones,
recomendaciones ni separación profesional. Punto 18: comprobar ambos bloques
editoriales, cuatro etiquetas de bienestar, títulos sans serif de menor tamaño,
imágenes intactas y navegación. Cabecera, hero y rótulos exteriores no se alteran.

Validación: compilación completa superada. Ambos títulos usan Inter (sans serif),
36 px en escritorio de 1440 px y 30 px en tablet de 1024 px, sin desbordamientos.
La home y la alternativa A comparten ahora la composición editorial; la alternativa
B sigue disponible solo para comparación. Se corrigen las referencias de la
vista previa a rutas locales desde raíz para que también pase la validación
estática. No se realiza commit, push ni despliegue.

## Autorización de publicación · 31 de agosto de 2026

El usuario autoriza expresamente publicar la alternativa editorial seleccionada.
Las restricciones de publicación de los apartados anteriores describen las fases
de revisión local y quedan superadas por esta autorización para la versión A.
Se publican únicamente los bloques de Patrimonio y Familia, Salud y Bienestar
con los títulos exteriores y los títulos interiores sans serif de 30–36 px,
junto con sus pruebas. La comparación A/B de docs/previews permanece en local
y no forma parte del despliegue. Cabecera, hero principal, imágenes y destinos
existentes se conservan. Clasificación VERDE: el alcance y los puntos 1–18 de
la revisión no cambian; no se añade asesoramiento ni funcionalidad financiera.
Canal autorizado: GitHub Pages oficial, mediante compilación de dist en Actions.

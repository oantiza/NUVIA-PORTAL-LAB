# Entrega 4A · Bloque 1: escala de títulos y pruebas aisladas

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local; no publicado.

## Alcance

Normalizar las aperturas compactas de las páginas interiores y los títulos de
fase del laboratorio. Se conserva la composición de la portada, las aperturas
institucionales grandes, las familias tipográficas, los colores y los cálculos.
Este bloque no cierra toda la Entrega 4A ni inicia la Entrega 4B.

La base de datos que el fundador prepara con Fable queda fuera de alcance.
No se modifican documentos de ese trabajo, Firebase, reglas, credenciales,
conexiones de producto, esquemas ni funciones. Las pruebas visuales se ejecutan
con conexiones externas bloqueadas desde el entorno de prueba.

## Decisión de diseño

- Apertura compacta (`--nv-display-md`): 44 px en escritorio amplio; 36 px
  hasta 1319 px, en consonancia con el cambio de cabecera ya existente.
- Título de sección (`--nv-section-title`): 36 px; 28 px hasta 1120 px,
  donde los componentes actuales ya se reorganizan para tableta.
- Se conserva Inter para interfaz y Fraunces para títulos editoriales.
- No se amplía la tolerancia del auditor para aceptar tamaños arbitrarios.
- El resto de la escala y de los componentes queda pendiente de sus siguientes
  lotes. Esta intervención no cambia la definición canónica del producto.

## Ficha regulatoria previa: prueba de las 18 preguntas

1. Necesidad: facilitar lectura y jerarquía de la información existente.
2. Datos de entrada: contenido local ya publicado; no se reciben datos nuevos.
3. Transformación: reglas CSS de tamaño y ajuste por anchura de pantalla.
4. Resultado: mismo contenido con tamaños comunes y sin recortes.
5. Instrumentos identificables: no se añade ni destaca ninguno.
6. Circunstancias personales: no se usan.
7. Compra, venta o mantenimiento: no se sugieren actuaciones.
8. Opinión sobre valor o precio: ninguna.
9. Ranking o atractivo: no se altera orden ni relevancia financiera.
10. Recomendación de terceros: no se incorpora.
11. Efecto del diseño: cambia la jerarquía de títulos de forma uniforme;
    no cambia colores, señales ni resultados de instrumentos.
12. Acción o contratación: no se añaden ni cambian llamadas a la acción.
13. Remuneración o afiliación: sin cambios.
14. Agente vinculado: no se altera la separación profesional ni se añaden marcas.
15. Datos personales: no se tratan nuevos datos ni se crean persistencias.
16. IA: no se incorpora a la experiencia del visitante.
17. Fuentes, fechas y fórmulas: se conservan íntegramente.
18. Controles: prueba estática de los tokens, matriz de render de escritorio y
    tableta, pruebas funcionales locales y revisión visual representativa.

Clasificación interna: verde, limitada al cambio de presentación descrito.
No equivale a una validación jurídica de funciones existentes ni futuras.

## Puerta de cierre

Resultados verificados:

- `npm run validate`, con conexiones externas bloqueadas: salida 0. Incluye
  pruebas funcionales locales, lenguaje, definición, navegación, metadatos,
  contenido externo, noticias, escala tipográfica y render de 23 vistas a 1440 px.
- Matriz adicional a 1280, 1180 y 1024 px: 69 vistas, salida 0.
- Matriz adicional a 900, 820 y 768 px: 69 vistas, salida 0.
- Total: **161 combinaciones sin fallos del auditor**, incluidas cero
  desviaciones de escala, cero fallos de contraste y cero desbordamientos.
- Piloto previo de cuatro vistas a 1280 y 768 px: también superado.
- Revisión del diff de los archivos propios: sin errores de formato.

No se ha abierto el módulo de empresas ni se han verificado datos remotos,
cuentas o persistencia. Se mantienen los errores conocidos de SVG y los avisos
estáticos ya documentados en 3B. La matriz no garantiza por sí sola calidad de
todas las composiciones; véase el hallazgo de las portadas de libros más abajo.

Los registros locales están en `output/entrega-4a-1/validate.log`,
`output/entrega-4a-1/matrix-wide.log` y
`output/entrega-4a-1/matrix-tablet.log` (salidas de prueba ignoradas por Git).

No se ha generado una nueva compilación de publicación ni se ha actualizado
`main` en este bloque. La entrega queda local y separada del trabajo concurrente
de base de datos; antes de publicar habrá que revisar de nuevo el árbol y
seleccionar exclusivamente los archivos autorizados de interfaz.

## Revisión visual y pendientes separados

Se ha revisado en navegador la apertura de Cartera a 1280 px, su título de fase
a 1280 y 768 px (36 y 28 px respectivamente, conservando Fraunces), Lecturas a
1440 y 768 px y la guía de ahorro a 1280 px. No se han activado búsquedas,
cuentas, datos remotos ni el módulo de empresas.

Hallazgo anterior a esta entrega: en Lecturas, las portadas de libros quedan
excesivamente recortadas a 768 px. La captura de referencia de 3B ya presenta
el mismo comportamiento. Debe corregirse en el lote de tarjetas de 4B;
no se considera resuelto porque la matriz tipográfica esté en verde.

Todavía quedan en 4A la normalización de contenedores, espacios y roles de
superficie, así como la revisión de excepciones de los arquetipos. En 4B se
abordarán componentes, densidad de herramientas, imágenes y navegación interna.

## Reproducción local aislada

En PowerShell, para validar sin conexiones externas:

```powershell
$env:NUVIA_RENDER_OFFLINE = '1'
npm run validate
npm run auditar:completo
```

Para una revisión manual con las conexiones externas bloqueadas por la
previsualización local:

```powershell
$env:NUVIA_PREVIEW_OFFLINE = '1'
$env:PORT = '4184'
node scripts/serve-local.mjs .
```

Son opciones del entorno de pruebas; no cambian conexiones ni permisos del
producto. El aislamiento no acredita funcionamiento de datos, cuentas ni APIs.
La nueva prueba `docs/nuvia-typography-foundations.test.mjs` forma parte de la
validación habitual y de la comprobación de la compilación para futuras entregas.

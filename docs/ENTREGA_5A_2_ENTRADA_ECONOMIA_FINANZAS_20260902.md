# Entrega 5A · Bloque 2: entrada de Economía y Finanzas

Fecha: 2 de septiembre de 2026. Estado: completado y validado en local, sin confirmar ni publicar.

## Necesidad y solución prevista

La portada y el pie ya enlazan el espacio a `mercados.html`, pero su cabecera
solo habla de mercados y no explica la relación con Cartera. Se conserva esta
ruta y el contenido existente. Su título visible pasa a «Economía y Finanzas»
y se añaden dos accesos descriptivos, de igual jerarquía: Mercados y noticias
y Cartera y analítica. Las tres vistas de Mercados siguen disponibles; «Portada»
se identifica como «Noticias y contexto» para distinguirla del espacio completo.

El análisis de empresas se explica como parte de Cartera, no como un sexto
espacio. Se aclara que los módulos con datos externos dependen de servicios
disponibles y que algunos requieren acceso autorizado, sin activar nada.

## Ficha regulatoria previa

1. Necesidad: comprender la organización de la información y las herramientas.
2. Datos: textos y rutas locales existentes; no hay datos nuevos del usuario.
3. Transformación: presentación y navegación; sin cálculos financieros.
4. Salida: dos ámbitos descritos, con enlaces educativos.
5. Instrumentos: ninguno nuevo, destacado o seleccionado.
6. Circunstancias personales: no se utilizan.
7. Compra/venta/mantenimiento: no se sugieren.
8. Valor o precio futuro: no se opina.
9. Atractivo inversor: no hay puntuaciones o rankings nuevos.
10. Recomendaciones de terceros: no se añaden ni se reproducen.
11. Diseño: ambos accesos tienen el mismo peso; no son veredictos financieros.
12. Acciones: abrir páginas o vistas, nunca contratar, operar o contactar.
13. Remuneración: sin cambios ni nuevos vínculos comerciales.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: no se solicitan ni se guardan datos nuevos.
16. IA: no se integra una nueva función.
17. Límites: fechas, fuentes y avisos existentes se conservan; disponibilidad
    externa no garantizada. No se certifica la actualidad de cifras o noticias.
18. Controles: contratos de textos y rutas, regreso desde Cartera, vistas,
    filtros y noticias conservados, comparación de scripts y matriz visual.

Clasificación interna verde para esta entrada informativa, no aprobación
regulatoria o funcional global del laboratorio o de empresas.

## Exclusiones

Sin Firebase/Firestore, nueva base, cuentas, autenticación, backend, APIs,
cotizaciones o noticias nuevas, fórmulas, recomendaciones, compilación de
`dist/`, confirmación ni publicación. Se prueba solo escritorio y tablet.
El módulo de empresas se mantiene excluido de la revisión autenticada.

## Resultado

Completada la entrada informativa de Economía y Finanzas. La validación
estática, los contratos y las pruebas de análisis pasan. La matriz final
cubre 30 vistas en siete anchos: 210 combinaciones, sin fallos detectados
en los controles ejecutados. Los cuatro procesos finales terminan con código 0.

| Registro en `output/entrega-5a-2/` | Cobertura | Resultado |
| --- | --- | --- |
| `validate-final.log` | Validación estática, contratos, análisis y 30 vistas a 1440 px | 30/30, código 0 |
| `matrix-wide-final.log` | 30 vistas a 1280 y 1180 px | 60/60, código 0 |
| `matrix-middle-final.log` | 30 vistas a 1024 y 900 px | 60/60, código 0 |
| `matrix-tablet-final.log` | 30 vistas a 820 y 768 px | 60/60, código 0 |

Los recorridos de acceso a Cartera, regreso a noticias desde tarjetas y
pestañas, estados activos y conservación de la fecha pasan en los siete
anchos. No se detectan nuevos problemas de contraste, tipografía, estructura,
superficies, cabecera, desbordes, controles o contenido dentro de la cobertura.
La revisión de formato de los cambios también pasa. El navegador y el servidor
local temporales quedan cerrados.

Este bloque no cierra toda la Entrega 5A ni las revisiones editoriales o
de servicios externos que se indican más abajo.

## Cambios aplicados

- `mercados.html` conserva su ruta y pasa a identificar el espacio completo:
  título visible, ruta de navegación, presentación y tres descripciones de
  metadatos coherentes. El controlador ya no sustituye el título canónico de
  la pestaña por el nombre antiguo.
- Dos accesos de igual tamaño y jerarquía, usando los colores, tipografía,
  radios y espaciados existentes: Mercados y noticias; Cartera y analítica.
- Las tres vistas siguen debajo, con la etiqueta «Dentro de Mercados y
  noticias». La antigua «Portada» se llama ahora «Noticias y contexto».
- El enlace a noticias recupera esa vista incluso después de cambiar a
  Informes o Cotizaciones. Cuando el cambio de pestaña no había cambiado
  la URL, recarga la página local para que su arranque habitual vuelva a aplicar
  contenido editorial y fechas; no se limita a mostrar la plantilla inicial.
  Desde las otras URL conserva la navegación nativa. Mantiene una dirección
  navegable y un destino identificado en el documento.
- La pestaña «Noticias y contexto» aplica el mismo criterio de regreso mediante
  el arranque normal cuando se viene de otra vista. Así no reaparecen noticias
  o indicadores de la plantilla sin la fecha aplicada por la carga editorial.
  Los botones de Informes y Cotizaciones mantienen su cambio interno de vista.
- Se impide que el enlace desplace solo el interior de la cabecera: se
  recorta su decoración sin crear un contenedor desplazable. El fallo se
  detectó en la inspección manual tras navegar, no en la captura inicial.
- Cartera explica su relación con el espacio, conserva sus tres vistas y
  añade una aclaración sobre disponibilidad y acceso autorizado. No se activa
  ningún servicio. Empresas permanece dentro de Cartera y apunta a la copia local.

## Controles añadidos y conservación

- `docs/nuvia-economia-entry.test.mjs`: dos destinos, nombres, metadatos,
  tres vistas de Mercados y sus alias anteriores, título tras el arranque y
  regreso al estado de noticias. Ejecuta el controlador local sin conexiones.
- `scripts/check-economia-entry.mjs`: dimensiones y ausencia de recorte,
  acceso a Cartera mediante teclado y regreso, recuperación de noticias desde
  las otras vistas, conservación de indicadores y su fecha tras el regreso,
  y ausencia de desplazamiento
  interno del hero. También comprueba los tres accesos de Cartera y su aviso.
- Los nuevos controles se integran en la validación existente. Se mantienen
  los controles de noticias, filtros, calendarios, tablas, diálogo y estados.
  La navegación de las vistas de Mercados se comprueba mediante acciones de
  navegador que pueden esperar una carga real; ya no se pulsa dentro de una
  evaluación JavaScript que se destruye al navegar. Se comprueba que solo
  la pestaña elegida queda activa, además del contenido de destino.
- La comparación con la versión confirmada demuestra que todos los bloques
  de scripts de `cartera.html` siguen idénticos, al igual que las dos series
  ilustrativas IBEX/EURO STOXX y las referencias JavaScript de Mercados.
  Las modificaciones anteriores de estados y calendarios se conservan; no se
  atribuyen a este bloque. En el controlador de Mercados este bloque cambia
  dos etiquetas y ajusta exclusivamente el regreso a la vista de noticias
  mediante la carga normal, tanto desde la tarjeta como desde la pestaña.
  Se reutilizan las consultas de arranque existentes, sin cambiar proveedor,
  backend, contenido de datos o frecuencia programada de actualización.
- Revisión manual en navegador local: cabecera, entrada a Cartera, regreso,
  archivo vacío y recuperación de noticias después de cambiar de pestaña.

## Límites y siguiente paso

Las pruebas bloquean las conexiones externas. No certifican la actualidad de
noticias, indicadores o calendarios, ni el funcionamiento autenticado de
empresas. Los datos ilustrativos continúan siendo ilustrativos y el archivo
de informes sigue en preparación. Este bloque no subsana esos vacíos editoriales.

Se mantienen las advertencias anteriores: guía de impuestos en preparación
fuera de la matriz visual, dos imágenes de portada sin carga diferida y los
mensajes conocidos de parseo inicial de SVG en Academia, Jubilación y Fiscalidad.
Una revisión visual satisfactoria no equivale a certificación integral de
accesibilidad, asesoramiento o aprobación regulatoria de todos los módulos.

No se toca Firebase/Firestore, la nueva base de datos ni el trabajo paralelo.
No hay compilación, confirmación o publicación. Las modificaciones previas
permanecen en el árbol de trabajo, sin mezclarse con una entrega publicada.

Siguiente bloque propuesto: revisar la entrada y la disponibilidad real de
Familia, Salud y Bienestar, usando solo el contenido ya desarrollado y
manteniendo su separación de Patrimonio. Después siguen los restantes vacíos
estáticos, confianza, vídeo y publicación, según su alcance y autorización.

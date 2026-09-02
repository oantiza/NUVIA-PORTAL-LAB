# Entrega 4B · Bloque 2: botones y formularios

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local; sin publicar.

## Alcance aprobado para esta intervención

Consolidar la presentación de los botones comunes y las acciones del curso,
campos numéricos compartidos, desplegables independientes y campos de las guías.
No alterar cálculos, validadores, nombres de campos, eventos, datos ni guardado.
Las pestañas, filtros de mercados, controles de gráficos, buscadores especiales y
el módulo de empresas conservan su tratamiento y quedan fuera de este bloque.
La portada conserva su composición. No se modifica Firebase/Firestore, la nueva
base ni ninguno de sus archivos. Trabajo local, sin compilación ni publicación.

## Ficha regulatoria previa

1. Necesidad: legibilidad y manejo coherente de herramientas educativas existentes.
2. Datos: mismos campos, parámetros y contenido; la elección sigue en el usuario.
3. Transformación: estilos y referencias visuales, no cálculos.
4. Resultado: mismos valores y textos, con controles coherentes.
5. Instrumentos: no se incorporan ni se destacan emisores o instrumentos.
6. Circunstancias personales: no se añade uso o recogida de información.
7. Operaciones: ninguna sugerencia de comprar, vender o mantener.
8. Valor: no se añaden opiniones sobre precios.
9. Atractivo: no se puntúa ni ordena por mérito inversor.
10. Terceros: no se reproducen nuevas recomendaciones.
11. Diseño: estados del control, no veredictos sobre resultados financieros.
12. Acciones: las existentes; no se incorpora contratación, contacto o ejecución.
13. Remuneración: sin afiliación o patrocinio nuevos.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: ningún flujo, almacenamiento o tratamiento nuevo.
16. IA: no interviene en el producto.
17. Fuentes y límites: se preservan avisos, supuestos y métodos existentes.
18. Controles: pruebas estáticas, matriz de escritorio/tableta y estados de
    muestra aislados; revisión visual con red externa bloqueada.

Clasificación interna: verde para el cambio de presentación. No implica una
validación jurídica global ni aprobación de las funciones excluidas.

## Hallazgos previos

- Campos compartidos de Vivienda de unos 40,4 px frente a botones de 44 px.
- El curso repite estilos de acciones con texto de 12 px y forma de píldora;
  las acciones equivalentes del sistema usan 14 px y esquinas de 6 px.
- Campos de guías, curso y simuladores usan distintos filetes y radios.
- Los botones comunes no definen un estado desactivado; el efecto al pasar el
  puntero también se aplica a un botón nativamente desactivado.
- Los campos envueltos y los desplegables no comparten todos los estados.
- La matriz completa detectó dos acciones de la guía de planificación con una
  regla propia de 18 px; se retiró esa excepción de tamaño y espaciado.

## Validación y resultado

- Prueba estática nueva: correcta; incorporada al recorrido de validación.
- Piloto de diez combinaciones: ocho correctas y dos incidencias en la página
  de referencia, por sus reinicios de fuente y un encabezado sin tamaño común.
  Corregidas y repetidas sus dos combinaciones, ambas correctas (`muestras.log`).
- Matriz completa inicial: los únicos fallos fueron los dos botones heredados
  de la guía de planificación. Se conservan esos registros, sin ocultar errores.
- Tras retirar la regla local, la guía se comprobó de nuevo a 1440, 1280, 1180,
  1024, 900, 820 y 768 px: siete resultados correctos (`guia-final.log`).
- Cobertura final consolidada: **161 combinaciones correctas y únicas**. Son las
  22 vistas restantes × 7 anchos (154) más la guía corregida × 7 (7).
  Sin fallos detectados por los controles ejecutados de contraste, tipografía,
  estructura, superficies, desbordes, navegación y presentación de formularios.
- Revisión manual con la habilidad de navegador: geometría de Vivienda antes y
  después, muestras de estados, edición de un dato ficticio y foco de teclado,
  herramienta del curso y acciones de la guía corregida. No se guardaron datos.
- Última validación general (`npm run validate`): terminada con código cero,
  incluyendo las pruebas funcionales del laboratorio y las 23 vistas a 1440 px.

Registros en `output/entrega-4b-2/` (ignorados por Git): `piloto.log`,
`muestras.log`, `validate.log`, `matrix-wide.log`, `matrix-middle.log`,
`matrix-tablet.log`, `guia-final.log` y `validate-final.log`.

Se mantienen los avisos estáticos preexistentes de `guia-impuestos.html` y las
imágenes de Inicio sin carga diferida, así como el ruido conocido de SVG en
Academia, Jubilación y Fiscalidad. No se presentan como corregidos en esta entrega.

Las pruebas visuales bloquearon las conexiones externas. No certifican servicios
remotos, cumplimiento legal global o accesibilidad completa. No se generó `dist/`,
no se publicó y no se modificaron Firebase/Firestore ni archivos de la nueva base.
Esta entrega no cierra la totalidad de 4B.

## Cambios aplicados

### Base común

- Altura mínima de 44 px, no altura fija: un texto largo puede ocupar más líneas.
- Texto de control de 14 px y altura de línea de 1,5.
- Acciones con radio de 6 px; campos con radio de 12 px.
- Campos con fondo blanco y filete opaco, independiente de los bordes decorativos
  de las tarjetas. El auditor exige al menos 3:1 frente al fondo del campo.
- Los campos pueden encogerse dentro de las columnas sin forzar su anchura.

### Familias consolidadas

- Botones `nv-btn` y sus variantes, incluida la variante de enlace de apoyo.
- Cinco acciones del curso: abrir/descargar, calcular, marcar como completado,
  comprobar e iniciar de nuevo. Sus colores y estados propios se preservan;
  tamaño, tipografía, forma y espaciado proceden de una sola regla común.
- Cajas numéricas de Vivienda, Jubilación y herramientas que ya usan el componente.
- Desplegables independientes, campos del ejercicio del curso y campos de las
  guías que usan `gt-campo`.
- No se sustituyen las clases existentes ni se modifican sus eventos.

### Estados

- Desactivado: conserva legibilidad, no se desplaza ni cambia de color al pasar
  el puntero y sigue usando el atributo nativo `disabled`.
- Foco: se conserva el aro común de teclado. En una caja compuesta, tanto un
  campo como un desplegable utilizan el aro exterior, sin duplicar borde o foco.
- Solo lectura: fondo diferenciado, sin desactivar la selección del texto.
- Error declarado: borde y mensaje con el mismo color; no desaparece por el foco
  o el puntero. Esta entrega **no añade validadores ni activa errores nuevos**:
  proporciona el estilo para `aria-invalid` y una muestra con texto asociado.

### Página de referencia y controles de regresión

La página interna `sistema-visual.html` incluye muestras explícitas, sin envío ni
guardado, de edición, selección, solo lectura, desactivado y error declarado.
Se retiraron las reglas antiguas de esa página que reiniciaban la fuente de los
controles y sobrescribían el foco; la muestra consume ahora la base real.
Las filas de botones usan el contenedor compartido y permiten envolver con espacio.

Se incorpora `docs/nuvia-form-controls.test.mjs` a la validación y a la comprobación
de una futura compilación. `scripts/check-form-controls.mjs` añade al auditor
mediciones de tamaño, fuente, radio, filetes, estados desactivados y foco. Las
pruebas no envían formularios ni siguen enlaces externos.

## Límites y siguiente bloque

No equivale a una auditoría completa de todos los formularios: los buscadores,
selectores especiales de mercados y controles de tablas/gráficos siguen fuera
del alcance de esta entrega. Tampoco se ha revisado el backend, la autenticación
o la base nueva, ni se han cambiado los mensajes y criterios de validación de
las calculadoras.

El siguiente bloque de 4B será revisar tablas, resúmenes de resultados y controles
de las herramientas en escritorio y tableta, manteniendo intactos métodos,
cifras y conexiones. La publicación de este bloque queda pendiente.

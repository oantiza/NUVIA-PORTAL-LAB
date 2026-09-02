# Entrega 5A · Bloque 1: entrada de Patrimonio

Fecha: 2 de septiembre de 2026. Estado: bloque local completado y validado.
Sin confirmación de cambios ni publicación.

## Problema y alcance

La llamada de portada «Accede a Patrimonio» abre Planificación patrimonial,
que solo contiene tres recursos en preparación. El pie abre `temas.html`,
cuya vista inicial es Jubilación. No hay una entrada común al espacio.

Se convierte `temas.html` sin parámetro en portada de Patrimonio, con cuatro
ámbitos: Vivienda y coste de vida, Impuestos, Jubilación y Planificación
patrimonial. Los tres primeros enlazan a las páginas desarrolladas y el cuarto
declara su estado en preparación. El menú añade «Portada de Patrimonio» en
todas las cabeceras y la llamada de inicio usa ese mismo destino que el pie.

Se conservan las vistas de jubilación y bienestar con parámetro y la de
planificación en preparación. Los alias antiguos de vivienda e impuestos
deben llevar a las herramientas existentes, no a una sección distinta.
No se modifican fórmulas, datos, cálculos, portada visual, marca o servicios.

## Ficha regulatoria previa

1. Necesidad: encontrar las herramientas educativas ya desarrolladas.
2. Datos: títulos, descripciones y rutas locales; sin datos del visitante.
3. Transformación: navegación y presentación, no cálculo.
4. Resultado: cuatro ámbitos con disponibilidad explícita.
5. Instrumentos o emisores: ninguno nuevo ni destacado.
6. Circunstancias personales: no se recogen ni utilizan.
7. Compra/venta/mantenimiento: no se sugieren.
8. Valor o precio futuro: no se opina.
9. Atractivo inversor: no hay clasificación ni puntuación.
10. Recomendaciones de terceros: ninguna.
11. Diseño: tarjetas con igual jerarquía; estado editorial, no veredicto financiero.
12. Acciones: abrir páginas educativas locales; sin contacto ni contratación.
13. Remuneración/afiliación: sin cambios ni nuevos incentivos.
14. Agente vinculado: separación profesional intacta.
15. Datos personales: ninguno nuevo; sin formularios o almacenamiento.
16. IA: no interviene en el producto.
17. Límites: no se certifican vigencia fiscal ni datos; cada herramienta conserva
    sus supuestos. Planificación no se presenta como cuestionario o plan personal.
18. Controles: pruebas de rutas y nombres, estados editoriales, navegación,
    vistas conservadas, contraste, teclado y matriz de escritorio/tablet.

Clasificación interna **verde** para esta reorganización informativa, no
validación jurídica global de contenidos o herramientas enlazadas.

## Exclusiones

- Firebase, Firestore, nueva base, autenticación y persistencia remota.
- Cuestionario patrimonial, consejo personalizado o captación de contactos.
- Actualización de noticias, reglas fiscales o datos financieros.
- Compilación de `dist/`, confirmación de cambios y publicación.
- Móvil y pantallas autenticadas de empresas.

## Resultado y pruebas

**210 combinaciones verificadas: 30 vistas × siete anchos.** Todos los procesos
finales terminan con código 0. Sin nuevos fallos detectados de contraste,
tipografía, estructura, superficies, cabecera, desbordes, controles, foco,
estados, navegación o contenido dentro de la cobertura comprobada.

| Registro en `output/entrega-5a-1/` | Cobertura | Resultado |
| --- | --- | --- |
| `validate-final.log` | Validación estática, contratos, análisis y 30 vistas a 1440 px | 30/30, código 0 |
| `matrix-wide-final.log` | 30 vistas a 1280 y 1180 px | 60/60, código 0 |
| `matrix-middle-final.log` | 30 vistas a 1024 y 900 px | 60/60, código 0 |
| `matrix-tablet-final.log` | 30 vistas a 820 y 768 px | 60/60, código 0 |

Las pruebas específicas de los cuatro destinos, sus regresos y los cuatro
alias pasan en los siete anchos. Los pilotos previos también finalizaron
correctamente. La comprobación de cambios no encuentra errores de formato.
El navegador y el servidor temporales de revisión quedan cerrados.

Este bloque cierra la entrada de Patrimonio, no toda la Entrega 5A. Se mantienen
las exclusiones y las advertencias heredadas que se detallan a continuación.

## Cambios aplicados

- `temas.html` sin parámetro muestra «Patrimonio», no «Jubilación».
- La portada, el menú y el pie comparten ese destino. Se añade «Portada de
  Patrimonio» a 17 cabeceras, contando la plantilla reutilizable.
- Cuatro tarjetas de igual jerarquía: Vivienda y coste de vida, Impuestos,
  Jubilación y Planificación patrimonial. Disponibilidad expresada con texto,
  sin códigos de atractivo financiero o prioridad de inversión.
- Planificación conserva sus tres contenidos previstos y añade una explicación
  explícita de lo que todavía no está disponible, con regreso al espacio.
- La vista anterior de jubilación permanece en `temas.html?topic=jubilacion`.
  Los accesos a su simulador no cambian.
- Las rutas antiguas `?topic=vivienda`, `?topic=vivienda-coste-vida`,
  `?topic=fiscalidad` y `?topic=mis-impuestos` redirigen a sus páginas existentes.
  Un parámetro desconocido muestra la portada del espacio.
- Bienestar conserva su nombre canónico y no recibe selector ni regreso
  interno de Patrimonio.
- La descripción social de `temas.html` describe Patrimonio; el título de
  pestaña usa «NUVIA · [tema]» y coincide con la vista que está abierta.

## Controles añadidos

- `docs/nuvia-patrimonio-entry.test.mjs`: ejecuta el controlador con un entorno
  local simulado, sin red, y comprueba portada, vistas conservadas, alias,
  cuatro tarjetas, disponibilidad y ausencia de formulario patrimonial.
- `scripts/check-patrimonio-entry.mjs`: recorre los cuatro enlaces reales,
  vuelve al espacio desde cada destino y comprueba los cuatro alias. También
  verifica el estado de Planificación y la separación de Bienestar.
- Las pruebas existentes de navegación y portada se actualizan al nuevo
  destino explícito, conservando todos los demás enlaces esperados.
- La matriz visual incorpora la vista antigua de jubilación de forma explícita:
  pasa de 29 a 30 vistas. Los anchos siguen siendo 1440, 1280, 1180, 1024,
  900, 820 y 768 px; no se prueba ni diseña una versión móvil.
- Inspección manual en navegador local: portada de Patrimonio, estados de las
  tarjetas, planificación en preparación y regreso al espacio.

## Límites de la entrega

«Disponible» significa que la herramienta o guía enlazada ya existe y se puede
abrir; no acredita por sí solo la actualidad de las normas o datos que contiene.
No se han revisado jurídicamente todos esos contenidos en este bloque.

Las advertencias heredadas se mantienen: `guia-impuestos.html` está en
preparación y fuera de las vistas visuales; la portada conserva dos avisos por
imágenes sin carga diferida. Los mensajes conocidos de parseo inicial de SVG
en Academia, Jubilación y Fiscalidad siguen contándose por separado. Una
validación visual sin fallos no certifica toda la accesibilidad ni los servicios
externos, que permanecen bloqueados durante las pruebas.

No se alteran las fórmulas ni los controladores de las calculadoras. En las
demás páginas únicamente se añade el enlace de cabecera; en la portada se
cambia además el destino de Patrimonio, sin modificar su composición visual.
Se preservan los cambios locales de las entregas anteriores y el trabajo
ajeno sobre la nueva base y configuración.

Siguiente bloque propuesto: aclarar la entrada de Economía y Finanzas y la
relación entre Mercados y Cartera, usando exclusivamente páginas desarrolladas.
Después quedan los demás vacíos estáticos de 5A, la confianza de 5B y las
actuaciones de vídeo y publicación, cada una con su propio alcance.

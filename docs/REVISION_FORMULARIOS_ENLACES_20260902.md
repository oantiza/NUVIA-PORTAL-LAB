# NUVIA · Formularios, calculadoras y destinos pendientes

Autorización: «haz ambos». Trabajo local mientras el fundador completa la base de datos. Se conservan los cambios anteriores y la rama visual; sin Firebase, descargas, cargas, activación de empresas ni publicación.

## Revisión previa · marco §12–§13

Clasificación: **ÁMBAR** para controles de herramientas con datos económicos del usuario; **VERDE** para identificación de enlaces pendientes. La revisión autoriza el desarrollo correctivo local, no sustituye las puertas pendientes de publicación.

1. Necesidad: impedir que una entrada inválida parezca un resultado válido y que un enlace prometa una función inactiva.
2. Datos: campos ya existentes, introducidos por el lector; pruebas ficticias. No se añaden perfiles ni consultas remotas.
3. Transformación: validación de números, límites y relaciones; asociación accesible de errores; comprobación de destinos y anclas.
4. Salidas: error junto al campo, resultados ocultos mientras haya errores y estado «En preparación» antes de navegar.
5. Instrumentos: no se añaden; cartera conserva su universo y disponibilidad pendientes.
6. Circunstancias personales: solo las entradas existentes, sin nuevas inferencias.
7. Conducta inversora: ninguna sugerencia nueva de operación.
8. Valor/precio: no hay opiniones ni modificaciones de fórmulas.
9. Mérito: ninguna clasificación financiera nueva.
10. Terceros: no se añaden recomendaciones.
11. Interfaz: estados técnicos, no semáforos de atractivo.
12. Acción: corregir datos o navegar a contenido; no contratación ni derivación.
13. Remuneración: sin cambios.
14. Agente: sin conexión con sistemas profesionales.
15. Privacidad: sin campos, persistencia, telemetría o transferencias nuevos; las pruebas de navegador bloquean conexiones externas.
16. IA: no interviene en las funciones.
17. Fuentes y límites: HTML, lógica y contratos locales. Se conservan las fórmulas y las hipótesis fiscales existentes; no se certifica su vigencia jurídica mediante esta revisión técnica.
18. Regresión: pruebas de valores vacíos/negativos/no finitos, límites, relaciones incoherentes, destinos/anclas, teclado, nombres accesibles y escritorio/tablet.

## Diseño de control

- Alcance de entradas: Vivienda (cinco herramientas), Jubilación, calculadora de Academia, ejercicio del Curso, simulador de Ahorro, organizador de Sucesiones y campos numéricos locales de Cartera. Los controles sin cálculo se revisan para nombres y navegación.
- Un campo vacío no equivale a cero. Se conserva el cero explícito donde sea válido; el importe opcional de cartera puede quedar vacío.
- Se respetan mínimos y máximos ya declarados. Se añaden límites técnicos explícitos a campos que no los tenían para evitar importes no finitos o simulaciones desmesuradas: importes hasta 10^12 y porcentajes hasta 100, salvo un máximo existente más restrictivo. Las hipótesis de rentabilidad/inflación admiten valores negativos válidos, superiores a −100 % cuando la fórmula lo exige.
- Se comprueban relaciones de entrada/precio, tramo fijo/plazo, amortización/capital pendiente, edad objetivo/actual y rendimientos EPSV/saldo de su bloque. No se corrigen valores silenciosamente.
- Mientras hay un error visible se ocultan los resultados afectados y se bloquean acciones de calcular/guardar/imprimir de ese formulario. Los campos y la navegación general siguen accesibles. En Vivienda se exige corregir los datos antes de pasar a otra de sus cinco herramientas para no dejar un escenario incoherente oculto.
- Se conserva el motor de cálculo. La validación intercepta entradas numéricas inválidas antes de sus manejadores y vuelve a comprobar tras repintados.
- Empresas, planificación y bienestar conservan destinos informativos; se señalan como pendientes sin activar contenido, cuentas o conexión de datos.

## Resultados

**Ambos bloques implementados y verificados en local el 02/09/2026. Sin publicación.**

### Formularios y calculadoras

- Se diferencia vacío de cero, se señalan negativos no admitidos, números no finitos, límites y relaciones incoherentes. Los pasos de incremento no fuerzan a redondear importes válidos.
- Los campos tienen nombre accesible y mensajes enlazados mediante `aria-describedby` y `aria-invalid`; al intentar calcular o guardar con errores el foco vuelve al primer campo pendiente.
- En las guías de Ahorro y Sucesiones, Enter no recarga la página ni incorpora las entradas a la URL.
- Jubilación invalida la estimación anterior al cambiar datos, modalidad EPSV, cargar un caso, vaciar o restablecer; también ante un error del motor. El ejercicio del Curso vuelve a pedir cálculo tras editar las entradas.
- Academia: se detectó un recorte real de «Aportación» a 820 px (30 px útiles para mostrar el número). Se apilan parámetros y resultados hasta 1024 px. Tras el ajuste, el campo dispone de 517 px útiles a 820 px y muestra el valor completo. Escritorio conserva las dos columnas.
- Cartera: se conserva el importe opcional vacío, se amplía su ancho y el error de un peso se coloca bajo la fila completa, evitando que se parta letra a letra. No se han modificado fórmulas, universo, históricos ni disponibilidades de instrumentos.

### Enlaces y estados

- Los enlaces a Empresas, Planificación patrimonial y Cuerpo, mente y salud muestran «En preparación». Se conservan sus rutas informativas; no se activan módulos ni funcionalidades.
- Los cuatro atajos de Cartera hacia resultados aún inexistentes indican «Tras calcular» y no navegan hasta que existe el destino. La condición se revierte al desaparecer los resultados o bloquearlos por un error.
- El mensaje de Empresas deja de afirmar incondicionalmente que cartera y modelos «funcionan con normalidad»: expresa su dependencia de los datos disponibles en la alfa.
- Auditoría de **18 páginas, 524 enlaces internos y 66 anclas**, incluidas las cuatro anclas generadas por el cálculo: sin destinos estáticos rotos. Se excluye `_plantilla.html`, que no es una página publicable.
- Los **12 enlaces de plantilla** se distinguen del inventario estático. En navegador se revisaron las vistas predeterminadas de Curso, Fiscalidad, Calendario, Sucesiones y Ahorro: ningún enlace quedó con una plantilla sin resolver. Se verificaron también la imagen y los apuntes PDF del capítulo disponible. No se han visitado ni certificado los destinos externos.

### Evidencia de pruebas

1. `npm run test:interfaz-local`: **10 pruebas automáticas aprobadas**, más la auditoría local de destinos. Integrado en `test:analisis` y, por extensión, en la validación habitual.
2. Validaciones estáticas y de regresión existentes: parity, sitio, consistencia, lenguaje, banners, navegación, definición, metadatos, contenido externo, privacidad del módulo de empresas, noticias editoriales, reglas offline y análisis: aprobadas. No se ejecutó el auditor de render que consulta datos externos.
3. Navegador, **9 vistas a 1440 y 820 px**: Vivienda, Jubilación, Academia/calculadora, Curso, Ahorro, Sucesiones, Empresas, Planificación y Bienestar. Sin desbordamiento horizontal; sin controles visibles sin nombre accesible; sin iframes cargados.
4. Revisión adicional de las **cinco herramientas de Vivienda a 820 px** y Academia a **768, 1180 y 1440 px**: sin recortes internos de los números predeterminados ni desbordamiento horizontal.
5. Interacción: entrada superior al precio, amortización superior al capital, inflación −100 %, hipótesis −2 % válida, edad objetivo igual a la actual, herederos fraccionarios, ganancias negativas, corrección posterior y Enter sin recarga. Comprobados cambios de estimación en Jubilación y Curso.
6. Cartera probada con un instrumento ficticio y almacenamiento simulado: vacío opcional válido, importe negativo y peso 101 rechazados, guardado bloqueado y foco correcto. Se inspeccionó y corrigió visualmente el mensaje en tablet.

La prueba de navegador utiliza un servidor local con conexiones externas bloqueadas y almacenamiento en memoria. El aviso de base no disponible que aparece en esa prueba es esperado y **no constituye un diagnóstico de la base real**. Las capturas inspeccionadas son de escritorio/tablet, no de móvil. Esta revisión no equivale a una auditoría integral de accesibilidad ni a la validación fiscal de los motores.

### Archivos y límites de entrega

- Nuevos módulos: `js/nuvia-formularios.js` y `js/nuvia-estados.js`; integración en `nuvia-site-unified.js`.
- Ajustes de presentación y estados en `estilos/nuvia-pages.css`, `cartera.html`, `curso.html` y `jubilacion.html`.
- Pruebas en `docs/nuvia-formularios.test.mjs` y `scripts/check-destinos-locales.mjs`; utilidades de prueba aisladas en `output/formularios/`, ignoradas por Git.
- Se preservan los cambios locales previos. No se han ejecutado commit, push, merge, despliegue ni cambios de rama; tampoco consultas o escrituras a Firebase o proveedores reales, ni cambios en `company-analysis/`.
- La validación de la base y del recorrido completo con datos reales sigue aplazada hasta el aviso del fundador. La puerta jurídica/compliance de publicación de funciones ámbar sigue pendiente; las pruebas técnicas no la sustituyen.

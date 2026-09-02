# NUVIA · Plan operativo sobre la web desarrollada

**Fecha:** 2 de septiembre de 2026  
**Estado:** plan ejecutable sobre el producto actual  
**Ámbito:** escritorio y tableta, repositorio oficial `NUVIA-PORTAL-LAB`  
**Publicación:** GitHub Pages mediante GitHub Actions  

---

## 1. Propósito

Este plan no parte de una web nueva. Organiza el trabajo sobre lo que NUVIA ya tiene desarrollado para consolidarlo, corregir sus desviaciones y elevar su calidad sin abrir todavía frentes de infraestructura que no están maduros.

La prioridad es conseguir que el producto actual sea coherente, estable, comprensible y verificable antes de añadir funciones complejas. Se preservan la portada, la identidad, las calculadoras, las rutas, los contenidos dinámicos locales y la copia independiente de `company-analysis/`.

El orden de trabajo será:

1. cerrar correctamente lo que está en curso;
2. corregir inconsistencias del producto existente;
3. homogeneizar la experiencia por familias de páginas;
4. completar los vacíos que pueden resolverse con contenido y desarrollo local;
5. validar el conjunto y publicarlo por entregas controladas.

---

## 2. Restricción superior: Firebase queda fuera del plan

Por decisión del fundador, Firebase no es todavía la infraestructura definitiva ni está desarrollado como backend final de NUVIA.

Durante la ejecución de este plan:

- no se modificará Firestore ni se escribirán datos;
- no se modificarán ni publicarán reglas;
- no se tocarán Authentication, Cloud Functions, usuarios, Storage ni la configuración del proyecto;
- no se alterarán permisos o listas de acceso provisionales;
- no se tomarán decisiones de arquitectura apoyadas en el estado actual de Firebase;
- no se ejecutarán despliegues, previsualizaciones ni comandos de Firebase;
- no se presentará como terminada ninguna función que dependa de persistencia, seguridad o autorización remota.

Esta exclusión no bloquea los cambios puramente locales de HTML, CSS, JavaScript, contenido, imágenes, pruebas, accesibilidad o compilación estática.

---

## 3. Punto de partida real

### 3.1. Completado y que debe conservarse

- Definición canónica de NUVIA y sus cinco espacios.
- Portada y página «Qué es NUVIA» alineadas con la nueva arquitectura.
- Cartera integrada dentro de Economía y Finanzas.
- Planificación patrimonial situada dentro de Patrimonio.
- Cabecera y pie homogeneizados en las páginas principales.
- Cabecera de tableta corregida en el rango previsto.
- Metadatos, vistas previas sociales y controles básicos de indexación.
- Mejoras de teclado, foco y formularios ya aplicadas.
- Carga bajo consentimiento de contenidos externos de TradingView y YouTube.
- Fuentes locales en el módulo de análisis de empresas y retirada de la traducción externa no documentada.
- Compilación estática y publicación oficial mediante GitHub Pages.
- Batería de validaciones funcionales, regulatorias, de navegación y de render.

### 3.2. En curso

- Sistema editorial de noticias y mercados.
- Modelo de fechas reales de publicación, selección e intento de actualización.
- Estado visible de actualidad o fallo de actualización.
- Adaptación de la noticia principal a titulares largos.
- Prueba automática del esquema editorial.
- Actualización de las cuatro noticias visibles y sus imágenes.

Este bloque existe ya en el árbol local, pero no debe considerarse terminado hasta superar la validación completa y resolver el tratamiento de las imágenes.

### 3.3. Avanzado, pero no cerrado

- Homogeneización tipográfica de páginas interiores.
- Normalización de héroes, contenedores, tarjetas, botones, tablas y formularios.
- Densidad y legibilidad de algunas herramientas en tableta.
- Portadas o destinos inequívocos para Economía y Finanzas, Patrimonio y Familia, Salud y Bienestar.
- Profundidad de Academia y criterios editoriales de Lecturas con Criterio.
- Páginas públicas de confianza: existen borradores internos, pero faltan datos del titular y validación jurídica.

### 3.4. Aplazado

- Backend definitivo y migración de datos.
- Cuenta definitiva, permisos, roles y recuperación de acceso.
- Comunidad de Lecturas, opiniones, votaciones y moderación.
- Suscripciones, pagos y renovaciones.
- Cuestionario patrimonial con almacenamiento o salida personalizada.
- Cualquier función que trate datos familiares, patrimoniales o sanitarios en remoto.
- Publicación de textos jurídicos no completados o no validados.

---

## 4. Secuencia ejecutiva

| Entrega | Objetivo | Duración orientativa | Dependencia | Resultado |
|---|---|---:|---|---|
| 3A | Cerrar noticias y mercados | 1–2 jornadas | Ninguna | Actualidad trazable y noticia sin cortes |
| 3B | Estabilizar todo lo ya publicado | 2–3 jornadas | 3A | Cero regresiones funcionales o visuales |
| 4A | Homogeneizar fundamentos visuales | 2–4 jornadas | 3B | Tipografía, color, espacios y contenedores comunes |
| 4B | Homogeneizar componentes y páginas | 5–8 jornadas | 4A | Un mismo sistema en todas las áreas |
| 5A | Completar vacíos estáticos de producto | 4–7 jornadas | 4B | Destinos claros para los cinco espacios |
| 5B | Reforzar confianza sin backend | 2–4 jornadas | 3B | Metodología y límites explicados con hechos verificables |
| 6 | Vídeo institucional | 4–7 jornadas | 5A y ficha regulatoria | Explicación breve, accesible y coherente |
| 7 | Cierre y publicación consolidada | 1–2 jornadas | Todas las anteriores | Versión estable, documentada y desplegada |

Las duraciones son estimaciones de ejecución y revisión, no fechas contractuales. Cada entrega se publica solo si cumple sus criterios de aceptación.

---

## 5. Entrega 3A · Cierre de noticias y mercados

### Objetivo

Terminar el bloque que ya está desarrollado localmente y resolver el problema original: noticias desactualizadas y noticia económica principal cortada.

### Acciones

1. Completar el esquema editorial de `data/daily-content.json` con:
   - fecha ISO de publicación;
   - fecha de selección;
   - último intento de actualización;
   - última actualización correcta;
   - estado `ok`, `degraded` o `failed`;
   - fuente, URL y modo de selección.
2. Calcular la actualidad desde la fecha real del medio y no desde la fecha de comprobación de NUVIA.
3. Mostrar uno de cuatro estados: del día, reciente, última disponible o archivo.
4. Conservar la última selección si una fuente falla, indicando el fallo sin cambiar la fecha de la noticia.
5. Garantizar que el título principal admite al menos tres líneas naturales sin recorte, solape ni pérdida de metadatos.
6. Validar la página en 1440, 1280, 1180, 1024, 900, 820 y 768 píxeles.
7. Ejecutar la prueba editorial de esquema, fechas, fuentes, duplicados y estados.
8. Resolver la procedencia de las imágenes:
   - opción preferente: utilizar recursos propios o con licencia documentada;
   - opción alternativa: acreditar y archivar el permiso de republicación;
   - hasta resolverlo, no declarar jurídicamente cerrada la entrega.
9. Registrar responsable editorial y procedimiento de corrección cuando el titular lo designe.

### Criterios de aceptación

- Ningún contenido antiguo se denomina «del día».
- Las cuatro noticias muestran fuente, enlace y fecha verificable.
- Un fallo de fuente es visible y no inventa contenido nuevo.
- El bloque principal no se corta en ningún ancho del alcance.
- La validación completa del repositorio termina en verde.
- La situación jurídica de las imágenes queda resuelta o bloqueada de forma explícita.

---

## 6. Entrega 3B · Estabilización del producto actual

### Objetivo

Establecer una línea base fiable antes de comenzar cambios visuales transversales.

### Acciones

1. Compilar la copia local de `company-analysis/` sin modificar su programa fuente original externo ni su backend.
2. Ejecutar todas las pruebas de cartera, cálculos, navegación, lenguaje, metadatos, contenido externo y noticias.
3. Auditar todas las vistas canónicas renderizadas a 1440 píxeles.
4. Auditar la matriz de escritorio y tableta en las páginas y herramientas con mayor densidad.
5. Revisar errores de consola y diferenciar ruido conocido de regresiones nuevas.
6. Confirmar que las rutas, parámetros, calculadoras y estados actuales siguen funcionando.
7. Generar una matriz de páginas con estas columnas:
   - arquetipo;
   - función;
   - estado;
   - riesgo regulatorio;
   - desviación visual;
   - prioridad;
   - prueba que la cubre.
8. Guardar capturas de referencia de portada, Mercados, Cartera, Vivienda, Academia, Lecturas y «Qué es NUVIA» en escritorio y tableta.

### Criterios de aceptación

- Cero enlaces locales rotos.
- Cero desbordes o colisiones no justificadas.
- Cero fallos AA en los componentes modificados.
- Todas las herramientas conservan sus cálculos y contenidos.
- Las desviaciones conocidas quedan enumeradas, no ocultas.

---

## 7. Entrega 4A · Fundamentos de homogeneización

### Objetivo

Convertir la identidad que ya funciona en reglas comunes, sin rediseñar la marca ni la portada.

### Acciones

1. Fijar cinco arquetipos:
   - institucional;
   - portada de espacio;
   - herramienta;
   - editorial o formativo;
   - módulo integrado.
2. Mantener Fraunces para aperturas y títulos editoriales, e Inter para navegación, datos, formularios, herramientas y acciones.
3. Cerrar una escala tipográfica única y sustituir los tamaños fluidos que caen fuera de ella.
4. Reducir los fondos a roles documentados: institucional, lectura, herramienta y contraste.
5. Fijar contenedores para lectura, herramienta, formulario y ancho general.
6. Consolidar la escala de espacios y eliminar valores improvisados cuando no estén justificados.
7. Separar tokens decorativos de tokens válidos para texto y estados.
8. Añadir controles que detecten nuevos colores directos, tamaños no autorizados y excepciones innecesarias.

### Criterios de aceptación

- Toda página pertenece a un arquetipo.
- Cada nivel tipográfico tiene una función definida.
- Los títulos no cambian de personalidad entre áreas equivalentes.
- Los contenedores y espacios responden a una regla común.
- No se altera la promesa visual de la portada.

---

## 8. Entrega 4B · Componentes y revisión por familias

### Orden de consolidación

1. Cabecera y navegación.
2. Pie y destinos de los cinco espacios.
3. Héroes y aperturas.
4. Botones y enlaces de acción.
5. Tarjetas y láminas.
6. Pestañas y navegación interna.
7. Formularios, ayudas y errores.
8. Tablas, gráficos y resúmenes de resultados.
9. Avisos, estados vacíos y mensajes de actualización.

### Lotes de páginas

#### Lote 1 · Institucional

- `index.html`
- `que-es-nuvia.html`
- `temas.html`

#### Lote 2 · Economía y Finanzas

- `mercados.html`
- `cartera.html`
- copia local `company-analysis/`

#### Lote 3 · Patrimonio

- `vivienda.html`
- `fiscalidad.html`
- `jubilacion.html`
- guías fiscales y de planificación existentes

#### Lote 4 · Academia y Lecturas

- `academia.html`
- `curso.html`
- `lecturas.html`

#### Lote 5 · Familia, Salud y Bienestar

- vista actual de `temas.html?topic=bienestar`
- futura portada estática del espacio, si se aprueba dentro de esta entrega

### Criterios de aceptación por lote

- Cabecera, héroe, cuerpo y pie forman una jerarquía continua.
- Acciones equivalentes usan el mismo patrón.
- Formularios tienen etiquetas, instrucciones y errores asociados.
- Tablas y gráficos funcionan a 768 píxeles sin desplazamiento accidental.
- No existe un salto visual injustificado al entrar en el módulo de empresas.
- El lenguaje permanece educativo, descriptivo y no prescriptivo.

---

## 9. Entrega 5A · Vacíos que pueden resolverse sin backend

### Economía y Finanzas

- Crear un destino claro del espacio utilizando Mercados, Cartera y análisis de empresas ya existentes.
- Explicar la relación entre información económica, comprensión de cartera y análisis descriptivo.
- No añadir rankings, oportunidades ni conclusiones de inversión.

### Patrimonio

- Convertir el concentrador actual en una entrada inequívoca a Vivienda, Coste de vida, Impuestos, Jubilación y Planificación patrimonial educativa.
- Mantener la planificación como contenido en preparación.
- No desarrollar todavía un cuestionario que almacene datos o genere un «plan personal».

### Familia, Salud y Bienestar

- Crear una portada estática de propósito, categorías, fuentes y límites.
- Reutilizar y ordenar el contenido general ya existente.
- Evitar diagnóstico, tratamiento o consejo individual.

### Academia NUVIA

- Hacer visible un itinerario de aprendizaje basado en contenidos existentes.
- Distinguir conocimientos esenciales, cursos, guías y vídeos.
- Mostrar niveles y siguiente paso sin guardar progreso remoto.
- No prometer acreditación ni resultados financieros.

### Lecturas con Criterio

- Publicar los criterios de selección.
- Clasificar las fichas existentes por espacios o temas.
- Preparar visualmente filtros estáticos si el catálogo los justifica.
- Mantener opiniones, propuestas, votos y foro como funciones futuras no activas.

### Criterio de aceptación

Los cinco espacios disponen de un destino comprensible y honesto, aunque algunas funciones avanzadas sigan identificadas como «en preparación».

---

## 10. Entrega 5B · Confianza verificable sin infraestructura nueva

### Se puede ejecutar ahora

- Página de metodología y fuentes basada en métodos, datos y procesos reales.
- Declaración de independencia y límites regulatorios.
- Declaración de accesibilidad basada en comprobaciones realizadas.
- Inventario interno de terceros y cargas externas.
- Acceso permanente para revisar la preferencia sobre contenido externo, siempre que sea almacenamiento local.
- Registro de procedencia y licencia de imágenes y recursos.

### No debe publicarse todavía

- Aviso legal con datos del titular sin confirmar.
- Política de privacidad que describa un backend definitivo inexistente.
- Condiciones de uso sin identidad, canal, jurisdicción y validación jurídica.
- Política de cookies que no refleje exactamente el comportamiento publicado.

### Criterio de aceptación

Cada texto público describe hechos comprobados. Los borradores jurídicos permanecen internos hasta completar sus campos y obtener validación documentada.

---

## 11. Entrega 6 · Vídeo institucional

### Recomendación

Sí conviene producirlo, pero después de estabilizar las portadas de los cinco espacios. El vídeo debe resumir la página «Qué es NUVIA», no añadir una segunda definición.

### Formato

- Duración: 90–120 segundos.
- Sin reproducción automática ni sonido inicial.
- Archivo local optimizado; sin incorporar seguimiento adicional.
- Subtítulos revisados y transcripción completa.
- Imagen de portada propia.
- Ubicación principal: después de la introducción de «Qué es NUVIA».
- Enlace secundario desde la portada.

### Contenido

1. El problema: muchas familias no comprenden bien su economía cotidiana.
2. La propuesta: aprender a entender el dinero y desarrollar criterio propio.
3. Los cinco espacios.
4. Academia como centro de aprendizaje.
5. Independencia y límites.
6. Cierre: «NUVIA informa, explica y calcula. Tú comprendes y decides».

### Condición previa

Si aparece el fundador, debe completarse antes una ficha específica sobre la separación entre NUVIA y su actividad profesional vinculada.

---

## 12. Entrega 7 · Cierre, publicación y control

### Procedimiento

1. Separar cada entrega en cambios coherentes y reversibles.
2. Ejecutar validación completa antes de cada publicación.
3. Compilar `dist/` mediante el flujo oficial.
4. Integrar en `main` únicamente con la rama validada.
5. Comprobar el despliegue de GitHub Actions.
6. Verificar en producción las rutas, estilos, recursos y contenidos principales.
7. Registrar el resultado, incidencias y decisiones pendientes.
8. Mantener un mecanismo de retirada rápida para contenido editorial incorrecto.

### Puerta final

No se publicará una entrega si:

- introduce recomendación o personalización incompatible;
- rompe una calculadora o una ruta existente;
- depende de Firebase;
- necesita datos jurídicos no confirmados;
- incorpora imágenes o contenidos sin procedencia suficiente;
- falla la matriz de escritorio y tableta;
- presenta una función futura como si estuviera operativa.

---

## 13. Decisiones que deberá aportar el fundador durante el plan

No bloquean el inicio de las tareas técnicas, pero sí sus cierres correspondientes:

1. Responsable editorial de noticias.
2. Solución definitiva para las imágenes de noticias.
3. Destino principal de Patrimonio mientras no exista una portada propia.
4. Alcance inicial de Familia, Salud y Bienestar.
5. Criterios editoriales definitivos de Lecturas con Criterio.
6. Aparición o no del fundador en el vídeo.
7. Datos del titular y validación jurídica para las páginas legales.

Ninguna de estas decisiones autoriza cambios en Firebase.

---

## 14. Indicadores de éxito

### Producto

- Los cinco espacios tienen destino y relato coherentes.
- No hay páginas que parezcan pertenecer a otra web.
- Las funciones en preparación están claramente identificadas.

### Actualidad

- Cero noticias antiguas presentadas como actuales.
- Cien por cien de las noticias con fecha, fuente y URL.
- Estado de actualización visible y honesto.

### Diseño

- Cero bloques principales cortados.
- Cero colisiones entre 768 y 1440 píxeles.
- Cero tamaños tipográficos no autorizados en los componentes consolidados.
- Uso coherente de Fraunces e Inter.

### Accesibilidad

- Cero controles sin nombre accesible en las páginas revisadas.
- Navegación completa mediante teclado.
- Cero fallos AA en los componentes modificados.

### Calidad

- Validación local y de `dist/` en verde.
- Sin enlaces locales rotos ni activos ausentes.
- Sin regresiones en las calculadoras y módulos existentes.

### Cumplimiento

- Cada cambio material dispone de revisión regulatoria.
- Ninguna función decide por el usuario.
- Ningún texto público describe un sistema técnico o jurídico que todavía no existe.
- Cero actuaciones sobre Firebase durante la vigencia de esta restricción.

---

## 15. Recomendación de inicio

La siguiente acción debe ser cerrar la **Entrega 3A, noticias y mercados**, porque ya está desarrollada localmente y responde al fallo visible que originó la revisión. Después debe congelarse una línea base validada y comenzar la homogeneización por componentes, no página por página de forma aislada.

Este orden aprovecha el trabajo ya realizado, reduce regresiones y evita que NUVIA acumule nuevas funciones sobre una base visual o editorial todavía desigual.

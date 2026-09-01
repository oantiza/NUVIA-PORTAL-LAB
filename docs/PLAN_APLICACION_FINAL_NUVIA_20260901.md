# NUVIA

## Plan final detallado de aplicación de recomendaciones en la web

**Fecha:** 1 de septiembre de 2026  
**Estado:** Hoja de ruta propuesta para aprobación y ejecución  
**Ámbito:** NUVIA Portal Lab, escritorio y tablet  
**Canal oficial:** repositorio NUVIA-PORTAL-LAB y publicación mediante GitHub Pages.

---

## 1. Objetivo del plan

Aplicar las conclusiones del informe consolidado sin perder las rutas, calculadoras, contenidos dinámicos ni la integración local del módulo de análisis de empresas. El plan prioriza la confianza del usuario, la coherencia conceptual, la homogeneización visual, la accesibilidad y el cumplimiento regulatorio.

Este plan distingue entre:

- Decisiones que debe aprobar el fundador.
- Reparaciones técnicas independientes que pueden comenzar de inmediato.
- Cambios de contenido y arquitectura.
- Mejoras transversales de diseño y calidad.
- Proyectos futuros que requieren un expediente previo.

---

## 2. Principios de ejecución

1. El marco regulatorio obligatorio prevalece sobre cualquier texto, diseño o función.
2. La definición canónica se actualiza antes que sus representaciones públicas.
3. NUVIA informa, explica y calcula; no decide ni recomienda por el usuario.
4. Solo se trabaja sobre el repositorio y la carpeta oficial.
5. Escritorio y tablet son el alcance de esta etapa.
6. Cada entrega debe poder publicarse de forma completa y verificable.
7. No se mezclan reparaciones urgentes con funciones futuras de alto riesgo.
8. Toda función material pasa su ficha regulatoria antes de diseño o desarrollo.
9. Los cambios visuales deben conservar rutas, cálculos y contenidos dinámicos.
10. Ninguna página se considera terminada sin prueba automática y revisión visual humana.

---

## 3. Decisiones previas de dirección

**Estado:** cerradas el 1 de septiembre de 2026. Véase `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md`. Las ideas futuras no activas quedan separadas en `docs/IDEAS_FUTURAS_NO_ACTIVAS_NUVIA_20260901.md`.

Estas decisiones quedaron registradas y ratificadas en `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md`. La Entrega 1 debe aplicar su redacción vigente.

### D1. Cinco espacios definitivos

**Aprobada:**

1. Economía y Finanzas.
2. Patrimonio.
3. Familia, Salud y Bienestar.
4. Academia NUVIA.
5. Lecturas con Criterio.

**Reglas:** analítica de cartera pertenece a Economía y Finanzas; planificación patrimonial pertenece a Patrimonio.

### D2. Definición central

**Aprobada:**

> NUVIA es un lugar donde las familias aprenden a entender su dinero.

### D3. Subtítulo de portada

**Aprobada:**

> Información, formación y herramientas para familias que quieren comprender su dinero y pensar a largo plazo.

### D4. Lenguaje institucional

**Aprobado:** adoptar lenguaje educativo e independiente en lugar de formulaciones que sugieran acompañamiento patrimonial individualizado. La regla alcanza también los lemas visuales del hero.

### D5. Norma tipográfica

**Aprobada:** tipografía editorial en aperturas y títulos de contenido; tipografía funcional en navegación, datos, herramientas, formularios y acciones.

### D6. Estado de proyectos futuros

Registrar el cuestionario patrimonial, la comunidad de Lecturas, las nuevas funciones personalizadas de salud y la suscripción como «en estudio» o «no aprobadas». La cuenta básica opcional ya existe y mantiene abiertas sus tareas de privacidad y gobernanza.

**Criterio de cierre:** las seis decisiones están fechadas, aprobadas y trasladadas a la documentación del proyecto.

---

## 4. Fase urgente - Confianza, actualidad y funcionamiento

**Objetivo:** resolver fallos que afectan hoy a la credibilidad y al uso.  
**Duración orientativa:** 3 a 5 jornadas de trabajo.  
**Dependencias:** ninguna, salvo aprobación editorial para sustituir contenidos.

### U1. Actualidad de noticias

**Acciones:**

1. Identificar la fuente y fecha real de todas las noticias visibles.
2. Retirar o actualizar los contenidos caducados.
3. Añadir fecha y hora de actualización del bloque.
4. Definir un umbral de caducidad por tipo de contenido.
5. Renombrar u ocultar "Informe diario" cuando no exista un informe del día.
6. Crear un estado alternativo: "No hay actualización disponible".
7. Añadir una prueba automática que detecte fechas fuera del umbral.
8. Documentar responsable, frecuencia, fuentes y procedimiento de corrección.

**Aceptación:** ningún contenido antiguo se presenta como noticia del día y siempre se conoce su fecha de referencia.

### U2. Noticia económica principal cortada

**Acciones:**

1. Eliminar alturas rígidas que recorten título o entradilla.
2. Definir variantes para títulos de una, dos y tres líneas.
3. Establecer límites editoriales de longitud.
4. Ajustar la zona segura de la fotografía y el degradado.
5. Mantener fecha, fuente y acción visibles.
6. Probar el bloque en 1440, 1280, 1180, 1024, 900, 820 y 768 px.

**Aceptación:** no existe texto cortado, solapado o fuera del contenedor en ningún ancho del alcance.

### U3. Contraste y escala de portada

**Acciones:**

1. Sustituir el bronce claro por el token de texto editorial oscuro en numeración y etiquetas pequeñas.
2. Mantener el bronce claro solo en usos decorativos compatibles.
3. Reemplazar tamaños de 11, 15 y 17 px por valores de la escala aprobada.
4. Garantizar un mínimo funcional de 14 px, salvo etiquetas breves a 12 px con contraste alto.
5. Ejecutar la auditoría de contraste.

**Aceptación:** cero fallos AA detectados en la portada y cero tamaños no autorizados en los componentes modificados.

### U4. Cobertura de "Qué es NUVIA"

**Acciones:**

1. Añadir la página a la auditoría principal de render.
2. Comprobar la presencia de hero, cinco espacios, principios y cierre.
3. Declarar Playwright como dependencia reproducible del proyecto.
4. Configurar el navegador en integración continua.
5. Evitar que la ausencia del motor de render se omita silenciosamente.

**Aceptación:** la página se prueba localmente y en integración continua y un fallo de render bloquea la validación.

### U5. Cabecera de tablet

**Acciones:**

1. Diseñar un modo específico entre 768 y 1199 px.
2. Elegir entre botón "Secciones" o navegación en dos niveles.
3. Conservar acceso visible a las áreas principales.
4. Añadir una prueba de colisión basada en rectángulos reales.
5. Probar navegación con teclado.

**Aceptación:** cero solapes de logotipo, navegación y acciones en toda la matriz de anchos.

### U6. Imágenes pesadas

**Acciones:**

1. Optimizar las tres imágenes pesadas que están realmente activas.
2. Confirmar si el PNG de Lecturas no se utiliza y retirarlo o archivarlo.
3. Generar variantes WebP o AVIF según compatibilidad.
4. Añadir dimensiones explícitas y carga diferida fuera de la primera pantalla.
5. Revisar banners históricos de Academia y portada.

**Aceptación:** reducción significativa del peso transferido sin degradación visual perceptible ni saltos de diseño.

### Entrega U

- Cambios publicados en una única entrega urgente.
- Validación completa.
- Capturas comparativas de portada y cabecera.
- Registro de contenidos actualizados.
- Sin alteraciones conceptuales pendientes de aprobación.

---

## 5. Fase 1 - Definición y arquitectura canónica

**Objetivo:** asegurar que toda la web cuenta la misma historia.  
**Duración orientativa:** 3 a 4 jornadas.  
**Dependencia:** decisiones D1 a D4.

### A1. Actualizar la definición canónica

**Acciones:**

1. Sustituir la clasificación anterior por los cinco espacios.
2. Integrar analítica de cartera en Economía y Finanzas.
3. Añadir Familia, Salud y Bienestar.
4. Situar planificación patrimonial dentro de Patrimonio.
5. Distinguir contenidos existentes y futuros.
6. Mantener el principio "NUVIA informa, explica y calcula. Tú comprendes y decides".
7. Registrar versión, fecha y motivo del cambio.

### A2. Ficha regulatoria de la definición pública

**Acciones:**

1. Completar la prueba regulatoria obligatoria.
2. Confirmar que salud se mantiene en información general.
3. Confirmar que planificación patrimonial se mantiene en organización educativa.
4. Confirmar que comunidad y suscripción son prospectivas.
5. Revisar la separación respecto de la actividad profesional del fundador.

### A3. Página "Qué es NUVIA"

**Acciones:**

1. Conservar diseño, fotografía, manifiesto, valores y cierre.
2. Sustituir las puertas actuales por los cinco espacios.
3. Corregir el lugar de cartera y planificación patrimonial.
4. Añadir estados "Disponible" o "En preparación" cuando sea necesario.
5. Añadir la acción principal "Explorar NUVIA".
6. Mantener "Volver al inicio" como acción secundaria.
7. Actualizar las pruebas de contenido.

### A4. Portada

**Acciones:**

1. Incorporar el subtítulo aprobado.
2. Añadir un único enlace "Descubre qué es NUVIA".
3. No añadir otro bloque largo de definición.
4. Verificar que las cinco áreas coinciden con la definición.

### A5. Navegación y pie

**Acciones:**

1. Aplicar los mismos nombres y orden de áreas.
2. Reorganizar el pie en identidad, espacios, herramientas y confianza.
3. Retirar documentación interna del pie público.
4. Sustituir el lenguaje patrimonial de servicio por lenguaje educativo.
5. Revisar migas, retornos y estados seleccionados.

**Criterio de cierre de fase:** definición, cabecera, portada, página institucional y pie utilizan una taxonomía única y no contienen contradicciones regulatorias.

---

## 6. Fase 2 - Accesibilidad, confianza y compartición

**Objetivo:** hacer el sitio comprensible, compartible y confiable.  
**Duración orientativa:** 5 a 8 jornadas.  
**Dependencias:** Fase 1 y revisión jurídica para textos legales.

### C1. Formularios accesibles

**Acciones:**

1. Asociar los 41 controles de Vivienda con sus etiquetas.
2. Relacionar instrucciones y mensajes de error.
3. Revisar nombres accesibles de botones y pestañas.
4. Comprobar el orden de tabulación.
5. Probar todos los formularios con teclado.
6. Auditar los demás formularios con la misma regla.

**Aceptación:** todos los controles tienen nombre accesible, ayudas asociadas y un orden lógico.

### C2. Estados de foco y contraste sobre imagen

**Acciones:**

1. Inventariar anulaciones del foco global.
2. Corregir únicamente las excepciones insuficientes.
3. Verificar contraste sobre fotografías en todos los anchos.
4. Asegurar que ningún estado depende solo del color.

### C3. Metadatos y descubrimiento

**Acciones:**

1. Inventariar páginas públicas, canónicas e indexables.
2. Excluir páginas internas, redirecciones y variantes por parámetros.
3. Añadir título, descripción, canonical, Open Graph y Twitter Card.
4. Crear imágenes sociales con derechos y proporción consistentes.
5. Crear `robots.txt`.
6. Crear `sitemap.xml` solo con URL canónicas.
7. Añadir datos estructurados cuando exista un tipo adecuado.

**Aceptación:** los enlaces públicos generan una vista previa correcta y no se indexan rutas internas o duplicadas.

### C4. Páginas de confianza

**Acciones previas:**

1. Inventario de datos, formularios, almacenamiento y proveedores.
2. Inventario de analítica, vídeos, cookies y transferencias.
3. Identificación de base jurídica y plazos de conservación.

**Páginas:**

- Privacidad.
- Condiciones de uso.
- Accesibilidad.
- Metodología y fuentes.
- Declaración de independencia.
- Cookies o tecnologías de almacenamiento cuando resulte aplicable.

**Aceptación:** los textos reflejan el funcionamiento real y disponen de validación jurídica documentada.

---

## 7. Fase 3 - Sistema visual y homogeneización integral

**Objetivo:** transformar las decisiones visuales existentes en un sistema coherente.  
**Duración orientativa:** 10 a 15 jornadas, por componentes.  
**Dependencias:** norma tipográfica D5 y arquitectura estable.

### V1. Inventario y mapa de páginas

Clasificar todas las páginas como display, área, herramienta o editorial. Registrar para cada una hero, contenedor, componentes, estados, excepciones y nivel de riesgo.

### V2. Tipografía

1. Documentar usos editoriales y funcionales.
2. Adoptar una escala cerrada.
3. Corregir tamaños improvisados.
4. Revisar interlineado, ancho de línea y jerarquías.
5. Evitar tipografía editorial en datos, tablas, navegación y formularios.

### V3. Color

1. Separar tokens decorativos y tokens de texto.
2. Consolidar azul, verde, bronce, fondos y estados.
3. Eliminar nuevos hexadecimales sin función documentada.
4. Verificar combinaciones reales y no solo colores aislados.

### V4. Contenedores y puntos de ruptura

1. Definir contenedor general, de herramienta, de lectura y de formulario.
2. Reducir gradualmente máximos y puntos de ruptura duplicados.
3. Mantener excepciones justificadas.
4. Probar antes de reemplazar reglas antiguas.

### V5. Componentes

Orden de consolidación:

1. Cabecera.
2. Pie.
3. Botones y enlaces.
4. Tarjetas y láminas.
5. Pestañas.
6. Formularios.
7. Tablas y gráficos.
8. Avisos y estados.

Cada componente necesita variantes, estados, accesibilidad, tokens y ejemplos de uso.

### V6. Código y mantenimiento

1. Generar cabecera y pie desde una fuente única durante la construcción.
2. Dividir progresivamente la hoja de estilos monolítica después de consolidar componentes.
3. Añadir verificaciones para nuevos colores y usos de `!important`.
4. Mantener utilidades de una sola vez fuera de las rutas operativas.

**Criterio de cierre:** el usuario reconoce un mismo sistema en todas las páginas y las excepciones están documentadas.

---

## 8. Fase 4 - Sistema editorial de noticias y mercados

**Objetivo:** garantizar actualidad, trazabilidad y contexto.  
**Duración orientativa:** 4 a 7 jornadas después de la reparación urgente.  
**Dependencias:** decisión editorial sobre fuentes y frecuencia.

### E1. Política editorial

Definir:

- Fuentes permitidas.
- Frecuencia de actualización.
- Responsable editorial.
- Umbral de caducidad.
- Correcciones y retirada.
- Atribución y enlaces.
- Diferencia entre noticia, análisis, indicador e informe.

### E2. Modelo de datos

Cada elemento debe incluir:

- Título.
- Resumen.
- Fuente.
- URL original.
- Fecha de publicación.
- Fecha de actualización o captura.
- Categoría.
- Imagen y derechos.
- Estado de caducidad.

### E3. Presentación

1. Mostrar una actualización general coherente.
2. Mostrar fecha de referencia por indicador.
3. No utilizar "del día" sin contenido vigente.
4. Comunicar errores de fuente sin inventar datos.
5. Mantener clara la diferencia entre selección editorial y contenido automatizado.

### E4. Controles

1. Prueba de fechas futuras o antiguas.
2. Prueba de campos obligatorios.
3. Prueba de enlaces y fuentes.
4. Alerta de fallo de actualización.
5. Revisión humana de la pieza destacada.

**Criterio de cierre:** todas las noticias y datos muestran fecha, fuente y estado de actualidad verificables.

---

## 9. Fase 5 - Vídeo institucional

**Objetivo:** explicar NUVIA de forma humana y breve.  
**Duración orientativa:** 5 a 8 jornadas de guion, producción e integración.  
**Dependencias:** Fases 1 y 2 cerradas.

### P1. Guion

Duración objetivo: 90 a 120 segundos. Escenas:

1. Problema de origen.
2. Convicción.
3. Qué es NUVIA.
4. Los cinco espacios.
5. Academia como centro de aprendizaje.
6. Independencia y límites.
7. Principio de decisión del usuario.
8. Invitación final.

### P2. Producción

- Fundador al inicio y al final.
- Capturas o recursos de la propia web.
- Lenguaje natural y sin teoría adicional.
- Master 1080p.
- Subtítulos revisados.
- Transcripción accesible.
- Imagen de portada optimizada.

> **Salvedad registrada en la adopción (01-09-2026):** la aparición del fundador en cámara requiere una ficha regulatoria propia y la verificación de compatibilidad con la separación de su actividad profesional (BASES §5 y visión §6) antes de producir el vídeo.

### P3. Integración

1. Bloque después del hero o introducción de "Qué es NUVIA".
2. Carga bajo demanda.
3. Sin sonido ni reproducción automática.
4. MP4 y WebM comprimidos.
5. Enlace secundario desde la portada.
6. Medición de reproducción sin introducir seguimiento innecesario.

**Criterio de cierre:** el vídeo comunica exactamente la arquitectura aprobada, carga sin perjudicar el rendimiento y dispone de subtítulos y transcripción.

---

## 10. Fase 6 - Expedientes de futuro, sin desarrollo inmediato

### F1. Planificación patrimonial

**Antes de diseñar:** ficha regulatoria, evaluación de privacidad, definición de datos mínimos, almacenamiento, borrado y revisión de compliance.

**Salida permitida:** mapa educativo de situación, documentación y asuntos que conviene comprender.

**Salidas prohibidas:** perfil de inversión, idoneidad, cartera adecuada, producto recomendado, señal de compra o derivación comercial.

### F2. Familia, Salud y Bienestar

Definir propósito diferencial, categorías, fuentes, revisión profesional, avisos y límites frente al consejo individual.

### F3. Academia

Diseñar itinerario, niveles, objetivos, prerequisitos, duración y criterios de finalización. Evitar promesas comparativas de superioridad.

### F4. Lecturas con Criterio

Etapas:

1. Criterios editoriales y fichas.
2. Opiniones moderadas.
3. Propuestas y votaciones.
4. Conversación comunitaria.

Cada etapa debe resolver identidad, moderación, privacidad, propiedad intelectual y conflictos.

### F5. Suscripción y cuentas

Distinguir el código preparatorio existente de una oferta comercial activa. Antes de publicar: propuesta de valor, precios, impuestos, renovación, cancelación, desistimiento, soporte, seguridad y tratamiento de datos.

---

## 11. Trabajo técnico de fondo

Estas tareas se ejecutan cuando no bloqueen las fases prioritarias:

- Validación profesional de supuestos del simulador de cartera.
- Eliminación de errores conocidos de consola.
- Consolidación de cabecera y pie en compilación.
- División progresiva de estilos después del sistema de componentes.
- Limpieza de activos no utilizados.
- Organización de utilidades de una sola ejecución.
- Revisión periódica de dependencias.
- Pruebas adversariales de funciones de IA cuando existan.

---

## 12. Secuencia de entregas

| Entrega | Contenido | Condición de publicación |
|---|---|---|
| 0 | Decisiones D1-D6 y reparación urgente U1-U6 | Aprobaciones registradas, actualidad corregida y render en verde |
| 1 | Definición, ficha regulatoria, "Qué es NUVIA", portada, navegación y pie | Taxonomía única y lenguaje aprobado |
| 2 | Accesibilidad, metadatos y confianza | Revisión jurídica donde corresponda |
| 3 | Sistema editorial de noticias y mercados | Fechas, fuentes y caducidad verificables |
| 4 | Homogeneización visual por componentes | Matriz visual completa y cero regresiones funcionales |
| 5 | Vídeo institucional | Guion y arquitectura finales, rendimiento validado |
| 6 | Expedientes futuros | Documentación aprobada, sin publicación automática de funciones |

La homogeneización visual puede comenzar con inventario durante las entregas 1 y 2, pero los cambios transversales deben publicarse por familias de componentes.

---

## 13. Método de cada entrega

1. Crear una rama de trabajo con prefijo `codex/` o la convención aprobada.
2. Registrar objetivo, alcance y páginas afectadas.
3. Completar la prueba regulatoria si el cambio es material.
4. Añadir o actualizar pruebas antes de modificar la interfaz.
5. Implementar el cambio preservando rutas y cálculos.
6. Ejecutar validación completa.
7. Ejecutar auditoría de render real.
8. Revisar 1440, 1280, 1180, 1024, 900, 820 y 768 px.
9. Probar teclado, foco y formularios afectados.
10. Revisar consola, rendimiento y activos.
11. Realizar revisión visual humana.
12. Integrar en `main`.
13. Confirmar compilación y despliegue de `dist/` mediante GitHub Actions.
14. Verificar la producción oficial en GitHub Pages.
15. Registrar resultado, incidencias y posibles tareas posteriores.

---

## 14. Responsabilidades recomendadas

| Rol | Responsabilidad |
|---|---|
| Dirección de NUVIA | Aprobar identidad, cinco espacios, tono y prioridades |
| Producto y contenido | Definición, arquitectura, política editorial y Academia |
| Diseño | Sistema visual, arquetipos, componentes y revisión en tablet |
| Desarrollo | Implementación, rendimiento, accesibilidad técnica y pruebas |
| Responsable editorial | Actualidad, fuentes, caducidad y correcciones |
| Jurídico/compliance | Funciones ámbar, textos legales, datos y compatibilidad profesional |
| Revisión humana final | Coherencia visual, claridad y ausencia de efectos prescriptivos |

Una persona puede asumir varios roles, pero cada aprobación debe dejar claro desde qué función se realiza.

---

## 15. Indicadores de éxito

### Confianza y contenido

- Cero noticias presentadas como actuales fuera del umbral.
- Cien por cien de noticias con fecha y fuente.
- Cero bloques principales cortados.

### Coherencia

- Una única taxonomía en documentos y páginas.
- Cero usos públicos de analítica como sexto espacio.
- Cero ubicaciones incorrectas de planificación patrimonial.

### Accesibilidad

- Cero fallos AA conocidos en textos modificados.
- Cien por cien de controles con nombre accesible.
- Navegación funcional con teclado.

### Calidad visual

- Cero colisiones en la matriz de anchos.
- Cero tamaños tipográficos fuera de la escala en componentes consolidados.
- Reducción verificable del peso de imágenes.

### Pruebas y publicación

- Todas las páginas canónicas cubiertas.
- Render real ejecutado localmente y en integración continua.
- Cero regresiones en rutas, calculadoras y módulos integrados.

### Cumplimiento

- Cien por cien de cambios materiales con prueba regulatoria.
- Funciones ámbar con validación documentada antes de publicar.
- Cero recomendaciones, señales o derivaciones incompatibles.

---

## 16. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cambiar demasiadas áreas a la vez | Entregas pequeñas por prioridad y componente |
| Perder personalidad al homogeneizar | Conservar arquetipos y excepciones documentadas |
| Presentar información antigua | Caducidad, estado alternativo y alerta automática |
| Convertir educación en asesoramiento implícito | Prueba regulatoria sobre texto, orden, color y acciones |
| Publicar textos legales genéricos | Inventario real y revisión jurídica |
| Crear una comunidad sin capacidad de moderación | Desarrollo por etapas y puerta de gobernanza |
| Grabar un vídeo que quede obsoleto | Producirlo después de cerrar arquitectura y copy |
| Ocultar fallos por falta del navegador de pruebas | Dependencia reproducible y error explícito en CI |

---

## 17. Decisión recomendada

Aprobar este plan como hoja de ruta, con dos reglas de inicio:

1. Cerrar de inmediato las seis decisiones de dirección.
2. Ejecutar en paralelo la fase urgente, comenzando por actualidad de noticias, recorte de la noticia principal, contraste, cabecera de tablet y cobertura real de render.

Después debe avanzarse por entregas completas. No conviene iniciar todavía el cuestionario patrimonial, el foro, la suscripción o nuevas funciones sanitarias. La prioridad es que la NUVIA ya visible sea coherente, actual, accesible y confiable.

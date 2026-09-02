# Borrador interno · Declaración de accesibilidad de NUVIA

> **NO PUBLICAR COMO DECLARACIÓN FORMAL.** La auditoría técnica está verificada, pero faltan revisión humana, módulo de empresas y canal de contacto.

**Fecha de la evaluación interna:** 2 de septiembre de 2026

## 1. Compromiso

NUVIA quiere que sus contenidos y herramientas puedan utilizarse con teclado, tecnologías de asistencia y diferentes necesidades visuales. La interfaz pública se diseña para escritorio y tableta y mantiene una escala tipográfica, contraste, foco visible y estructura común.

## 2. Estado de la revisión

La evaluación automática interna cubre 23 vistas públicas a 1440 píxeles y controles representativos a 820 píxeles. Comprueba:

- contraste de texto;
- suelo y escala tipográfica;
- desbordes y colisiones;
- nombres accesibles y ayudas asociadas;
- foco perceptible;
- semántica de estados activos;
- selección, orden y navegación por teclado de pestañas;
- presencia del contenido mínimo esperado.

En las vistas auditadas, los controles de accesibilidad anteriores quedan sin incidencias. Esta comprobación no equivale a una certificación completa ni sustituye pruebas humanas.

## 3. Limitaciones conocidas

- El módulo embebido `company-analysis/` no forma todavía parte de la auditoría visual común.
- Falta una revisión humana completa con lectores de pantalla y navegación por voz.
- La vista de Cartera conserva a 820 píxeles una desviación tipográfica de 30 píxeles ya reservada a la Entrega 4; no afecta al foco ni a la semántica de controles.
- El portal no se ha diseñado ni evaluado como versión móvil, de acuerdo con el alcance actual del producto.
- Algunos contenidos externos dependen de interfaces de terceros cuya accesibilidad debe revisarse por separado.

## 4. Preparación de esta declaración

Método actual: autoevaluación técnica mediante pruebas de código y navegador real. La declaración pública deberá indicar el método validado, fecha de última revisión y alcance exacto después de incorporar el módulo de empresas y la revisión humana.

## 5. Comunicación de problemas

Si una persona encuentra una barrera, debe poder indicar la página, el control, el dispositivo, el navegador y la ayuda técnica utilizada.

- Canal accesible de contacto: **[PENDIENTE C04]**
- Plazo y procedimiento de respuesta: **[PENDIENTE]**
- Procedimiento de reclamación: **[PENDIENTE de validación jurídica]**

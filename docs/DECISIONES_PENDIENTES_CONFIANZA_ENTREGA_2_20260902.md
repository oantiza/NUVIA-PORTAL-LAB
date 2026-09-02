# NUVIA · Decisiones pendientes para cerrar las páginas de confianza

**Fecha:** 2 de septiembre de 2026

**Estado:** documento interno de trabajo

**Publicación:** NO PUBLICAR hasta completar los campos obligatorios y obtener validación jurídica documentada

## 1. Resultado del contraste

El código permite redactar la estructura y gran parte del contenido factual de las páginas de confianza, pero no permite identificar ni decidir por sí solo quién asume las obligaciones jurídicas. Los borradores adjuntos separan, por tanto, tres clases de contenido:

- **hecho técnico verificado**, que puede conservarse;
- **decisión pendiente**, que aparece entre corchetes;
- **propuesta sujeta a validación jurídica**, que no debe convertirse automáticamente en texto público.

La estructura se ha contrastado con:

- [artículo 10 de la LSSI-CE](https://www.boe.es/eli/es/l/2002/07/11/34/con), sobre información general del prestador;
- [artículo 22 de la LSSI-CE](https://www.boe.es/eli/es/l/2002/07/11/34/con), sobre almacenamiento y recuperación de información en el dispositivo;
- [artículo 13 del RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es), sobre información al recoger datos personales;
- [Guía sobre el uso de las cookies de la AEPD](https://www.aepd.es/recurso-multimedia/guia-sobre-el-uso-de-las-cookies), incluida la equivalencia visual y funcional entre aceptar y rechazar.

## 2. Decisiones que necesita aportar el titular

| Código | Decisión o evidencia | Por qué bloquea | Resultado esperado |
|---|---|---|---|
| C01 | Nombre o denominación del titular | Identifica al prestador y al responsable | Dato confirmado para aviso y privacidad |
| C02 | NIF/CIF y forma jurídica, si procede | Completa la identificación legal | Dato confirmado o indicación de no aplicabilidad |
| C03 | Domicilio o establecimiento | Información del prestador y ejercicio de derechos | Dirección publicable confirmada |
| C04 | Correo o canal efectivo de contacto | Avisos, privacidad y accesibilidad | Buzón operativo y responsable de respuesta |
| C05 | Datos registrales, si proceden | Información del prestador | Registro, tomo, folio, hoja o no aplicabilidad |
| C06 | Responsable de protección de datos y DPD, si procede | Información RGPD | Identidad/canal o decisión documentada de no designación |
| C07 | Base jurídica por finalidad | No debe deducirse solo del código | Matriz validada por tratamiento |
| C08 | Plazos de conservación y copias de seguridad | Información RGPD obligatoria | Plazo o criterio por dato y sistema |
| C09 | Encargados, contratos y localización efectiva | Destinatarios y transferencias | Lista contractual verificada |
| C10 | Garantías de transferencias internacionales | Información RGPD | Decisión de adecuación, cláusulas u otra garantía aplicable |
| C11 | Canal y procedimiento de derechos fuera del autoservicio | El autoservicio no cubre todas las incidencias | Procedimiento, plazo y responsables |
| C12 | Política de menores | La web trata economía familiar y permite cuentas | Edad mínima y procedimiento validado |
| C13 | Política de incidentes y seguridad | Gobernanza del tratamiento | Responsable, registro y protocolo |
| C14 | Reglas reales de Firestore y Cloud Functions | El control del cliente no acredita seguridad | Revisión de reglas y prueba de autorización |
| C15 | Licencias de EODHD, TradingView y traducción | Puede afectar a redistribución y uso público | Condiciones y plan contratado archivados |
| C16 | Ley aplicable y resolución de controversias | Condiciones de uso | Texto validado según identidad y actividad |

## 3. Correcciones técnicas previas a una publicación jurídica definitiva

### Mitigación completada el 2 de septiembre de 2026

- TradingView ya no se descarga al visitar Mercados.
- Los vídeos de YouTube de Academia y Curso ya no crean un iframe al abrir la página.
- Cada bloque explica el proveedor, mantiene el contenido cerrado y solo inicia la conexión tras una acción expresa.
- La auditoría renderizada prueba tanto la ausencia inicial de la conexión como la creación del vídeo después de pulsar el control.
- El módulo de empresas utiliza las copias locales de Inter y Fraunces y ya no solicita Google Fonts.
- La descripción de la compañía se presenta en el idioma original del proveedor y ya no se envía al endpoint no documentado de Google Translate.

### Prioridad crítica

1. Retirar del cliente las listas de correos autorizados de `js/nuvia-datos.js` y `company-analysis/src/firebase.js`; la autorización real debe depender del servidor.
2. Verificar y documentar las reglas de Firestore y las comprobaciones de autorización de cada Cloud Function.

### Prioridad alta

5. Llevar al servidor la prueba de cualquier consentimiento opcional que llegue a activarse. El registro exclusivamente local no demuestra el consentimiento si la persona cambia de navegador o borra el almacenamiento.
6. Confirmar plazos de conservación, borrado de copias de seguridad y registros técnicos.
7. Inventariar las respuestas y metadatos reales de las funciones en la nube.
8. Revisar la licencia de redistribución del proveedor de datos antes de ampliar el acceso público.

### Prioridad media

9. Incorporar un acceso permanente para revisar la elección sobre contenido externo.
10. Extender la auditoría de accesibilidad al módulo `company-analysis/` y realizar una revisión humana con lector de pantalla.
11. Mantener una prueba automática que bloquee la publicación si aparece un dominio externo no inventariado.

## 4. Borradores preparados

- `BORRADOR_AVISO_LEGAL_ENTREGA_2_20260902.md`
- `BORRADOR_PRIVACIDAD_ENTREGA_2_20260902.md`
- `BORRADOR_TECNOLOGIAS_ALMACENAMIENTO_ENTREGA_2_20260902.md`
- `BORRADOR_CONDICIONES_USO_ENTREGA_2_20260902.md`
- `BORRADOR_DECLARACION_ACCESIBILIDAD_ENTREGA_2_20260902.md`

Ninguno debe copiarse al pie público ni transformarse en HTML hasta cerrar C01–C16 según corresponda y registrar la validación jurídica.

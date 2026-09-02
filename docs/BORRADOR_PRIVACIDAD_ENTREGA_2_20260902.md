# Borrador interno · Política de privacidad de NUVIA

> **NO PUBLICAR.** Contenido factual verificado sobre el código, pendiente de responsable, bases jurídicas, conservación, contratos y validación jurídica.

**Última revisión del borrador:** 2 de septiembre de 2026

## 1. Responsable

- Responsable del tratamiento: **[PENDIENTE C01]**
- NIF/CIF y domicilio: **[PENDIENTE C02–C03]**
- Contacto de privacidad: **[PENDIENTE C04]**
- Delegado de protección de datos, si procede: **[PENDIENTE C06]**

## 2. Qué datos trata actualmente NUVIA

### Navegación y uso sin cuenta

- La mayoría de guías y calculadoras funciona en el navegador.
- Los supuestos introducidos en Vivienda, Jubilación, Fiscalidad, Curso y Academia se procesan localmente, salvo que una función indique expresamente otra cosa.
- Cartera puede abrir una sesión técnica anónima, de forma perezosa, cuando la persona solicita una consulta a la base de activos.
- El dispositivo puede conservar carteras de visitante, preferencias fiscales, escenarios, progreso y preferencias visuales mediante almacenamiento local.
- Los proveedores de alojamiento y los servicios externos pueden recibir datos técnicos de conexión, como dirección IP, fecha, cabeceras y datos de dispositivo, según su configuración y condiciones.

### Cuenta opcional

- Correo electrónico.
- Contraseña enviada al proveedor de identidad; NUVIA no la guarda expresamente en su código local.
- Identificadores y tokens de sesión, caducidad y tipo de cuenta.
- Nombre de las carteras, identificadores de activos, pesos y metadatos necesarios para recuperarlas.
- Decisiones opcionales de consentimiento, actualmente almacenadas en el dispositivo y sin activar comunicaciones ni analítica.

NUVIA no solicita actualmente teléfono, documento de identidad, perfil de inversión ni cuestionario de idoneidad para crear una cuenta básica.

## 3. Finalidades

| Finalidad | Datos principales | Estado | Base jurídica |
|---|---|---|---|
| Servir el portal y proteger su funcionamiento | datos técnicos y registros necesarios | activa | **[PENDIENTE C07]** |
| Responder a consultas de activos solicitadas | sesión anónima, consulta y respuesta | activa al usar la función | **[PENDIENTE C07]** |
| Crear y mantener una cuenta opcional | correo, credenciales y sesión | activa a petición del usuario | **[PENDIENTE C07]** |
| Guardar y recuperar carteras en la nube | cuenta, nombre, activos y pesos | activa cuando se guarda | **[PENDIENTE C07]** |
| Permitir acceso, rectificación, descarga y supresión | cuenta y datos vinculados | activa | **[PENDIENTE C07]** |
| Comunicaciones opcionales | correo y elección | no activa | No activar sin base, información y prueba de consentimiento |
| Analítica de uso opcional | elección y futuros eventos | no activa | No activar sin definición y consentimiento válido |

## 4. Conservación

Los plazos no pueden deducirse del código y deben definirse antes de publicar esta política:

- sesión anónima y tokens: **[PENDIENTE C08]**;
- cuenta registrada: **[PENDIENTE C08]**;
- carteras en la nube: **[PENDIENTE C08]**;
- copias de seguridad y registros de seguridad: **[PENDIENTE C08 y C13]**;
- elecciones de consentimiento: **[PENDIENTE C08]**;
- solicitudes de derechos: **[PENDIENTE C08 y C11]**.

La supresión disponible en la cuenta elimina las carteras, el rastro local asociado y la cuenta del proveedor mediante el flujo implementado. Debe confirmarse el efecto y el plazo sobre copias de seguridad y registros técnicos.

## 5. Proveedores y destinatarios

Inventario técnico pendiente de confirmación contractual:

- GitHub Pages y GitHub Actions, para alojamiento y publicación.
- Google Firebase, Identity Toolkit, Secure Token, Firestore y Cloud Functions, para identidad, sesiones, datos y funciones.
- Proveedor de datos de mercado utilizado por la API, sujeto a confirmación de licencia y contrato.
- TradingView, cuando se carga el panel de índices.
- YouTube en modo de privacidad mejorada, cuando se carga o reproduce vídeo.
- Google Translate, actualmente invocado por el módulo de empresas.

Para cada proveedor deben confirmarse función, contrato, ubicación, subencargados, transferencias y garantías: **[PENDIENTE C09–C10 y C15]**.

## 6. Transferencias internacionales

**[PENDIENTE C10.]** La política definitiva deberá identificar las transferencias que realmente se produzcan y las garantías aplicables. La mera ubicación declarada de una Cloud Function en `europe-west1` no acredita por sí sola que todos los tratamientos permanezcan en el Espacio Económico Europeo.

## 7. Derechos

La cuenta implementa funciones de acceso, descarga en JSON, modificación de contraseña, cambio verificado de correo y supresión. Además debe existir un canal externo para ejercer derechos, resolver incidencias y solicitar limitación u oposición cuando proceda:

- Canal: **[PENDIENTE C04 y C11]**
- Verificación de identidad: **[PENDIENTE C11]**
- Reclamación ante la autoridad de control: la política definitiva debe informar de la Agencia Española de Protección de Datos y facilitar su dirección oficial.

Retirar un consentimiento no afecta a la licitud del tratamiento anterior a su retirada. Esta formulación solo debe conservarse para finalidades que realmente se basen en consentimiento.

## 8. Decisiones automatizadas y elaboración de perfiles

NUVIA no debe adoptar decisiones con efectos jurídicos o similares sobre la persona usuaria. Las herramientas describen, explican y calculan a partir de datos y supuestos; no evalúan idoneidad ni generan una recomendación individual de inversión.

Las futuras funciones de planificación, comunidad, suscripción o analítica no quedan cubiertas por este borrador y requieren una evaluación propia antes de desarrollarse.

## 9. Menores

**[PENDIENTE C12.]** Deben definirse edad mínima, información dirigida a familias y procedimiento ante cuentas o datos de menores.

## 10. Seguridad e incidentes

NUVIA debe documentar controles de acceso, cifrado, separación de entornos, registros, copias, respuesta a incidentes y revisión de proveedores. Las listas de correos en el cliente no constituyen un control de acceso y deben retirarse: **[PENDIENTE C13–C14]**.

## 11. Cambios y contacto

La versión pública deberá mostrar fecha de entrada en vigor, historial de cambios relevantes y un contacto efectivo: **[PENDIENTE C04]**.

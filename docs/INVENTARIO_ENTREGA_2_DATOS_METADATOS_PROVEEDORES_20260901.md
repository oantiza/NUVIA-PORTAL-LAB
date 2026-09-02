# NUVIA · Inventario inicial de la Entrega 2

**Fecha:** 1 de septiembre de 2026  
**Estado:** inventario técnico verificado; no sustituye revisión jurídica  
**Ámbito:** accesibilidad, metadatos, almacenamiento, datos y proveedores del portal oficial

## 1. Perímetro y criterio regulatorio

Este inventario se ha elaborado sobre el código real de NUVIA Portal Lab y aplica el marco regulatorio obligatorio. Su finalidad es describir el funcionamiento actual antes de redactar páginas de privacidad, condiciones, cookies o independencia.

La mejora de títulos, canonicales, `robots.txt` y `sitemap.xml` es **verde**: no modifica funciones, datos ni decisiones del usuario. Los textos legales y la determinación definitiva de bases jurídicas, conservación, responsables y transferencias quedan **pendientes de validación jurídica documentada**.

## 2. Páginas públicas e indexables

El portal tiene 16 páginas canónicas indexables:

1. Portada.
2. Academia NUVIA.
3. Cartera y analítica.
4. Curso «Dinero con criterio».
5. Mis impuestos.
6. Guía de fiscalidad del ahorro.
7. Calendario fiscal.
8. Guía fiscal de la EPSV.
9. Guía de planificación de la jubilación.
10. Sucesiones y donaciones.
11. Jubilación.
12. Lecturas con Criterio.
13. Economía y Finanzas.
14. Qué es NUVIA.
15. Patrimonio.
16. Vivienda y coste de vida.

Quedan fuera del sitemap:

- `_plantilla.html`, por ser una plantilla interna no publicada;
- `guia-impuestos.html`, por ser un reenvío en preparación con `noindex`;
- `sistema-visual.html`, por ser documentación interna con `noindex`;
- variantes mediante parámetros, que reutilizan la URL canónica de su página;
- `company-analysis/`, porque funciona como módulo embebido dentro de Cartera y no como página editorial independiente.

## 3. Formularios y datos introducidos

Los formularios y controles del portal se concentran en:

- Vivienda: datos y supuestos de hipoteca, alquiler, ingresos, deudas y ofertas introducidos por el usuario.
- Jubilación: edad, pensión, patrimonio, EPSV, supuestos fiscales y escenarios.
- Fiscalidad y guías: residencia fiscal, preferencias, comprobaciones y datos de ejercicios educativos.
- Curso y Academia: cantidades y supuestos para ejercicios y calculadoras educativas.
- Cartera: activos, pesos y nombre de carteras; cuenta opcional mediante correo y contraseña.

La mayoría de cálculos se realizan en el navegador. La excepción principal es Cartera, que consulta la base maestra y permite guardar carteras en la nube cuando la persona inicia sesión.

## 4. Almacenamiento en el dispositivo

Claves identificadas en `localStorage`:

| Clave o grupo | Contenido | Finalidad actual |
|---|---|---|
| `nuvia.maestra-sesion.v1` | tokens de sesión, caducidad, tipo y correo cuando existe cuenta | mantener sesión anónima o registrada |
| `nuvia.carteras-visitante.v1` | carteras locales con activos y pesos | recuperar carteras del visitante |
| `nuvia.consentimientos.v1` | decisiones opcionales por correo y fecha | registrar permisos en el navegador |
| `nuvia.suscripcion.v1` | marcador local por correo | código preparatorio; no existe oferta activa |
| `nuvia-vivienda-maqueta-v1` | escenario de vivienda y ofertas | guardar y recuperar el ejercicio local |
| `nuvia-tax-preference` | preferencia territorial/fiscal | adaptar guías fiscales en el dispositivo |
| claves del calendario | perfiles y revisiones marcadas | recuperar el progreso local |
| `nuvia-company-description-es:*` | traducciones de descripciones de empresas | evitar traducciones repetidas |
| `nuvia-company-analysis-theme` | preferencia visual | conservar el tema del módulo embebido |

No se ha identificado analítica de uso activa ni lectura publicitaria de estas claves. Los consentimientos opcionales de comunicaciones y análisis de uso existen como controles preparatorios, pero el propio código declara que hoy no activan esos tratamientos.

## 5. Datos y servicios en la nube

### Cuenta y base maestra

- Proveedor técnico: Firebase/Google Identity Toolkit y Secure Token.
- Proyecto: `bbdd-activos-financieros`.
- Región declarada de Cloud Functions: `europe-west1`.
- Sesión anónima: se abre para permitir consultas de solo lectura.
- Cuenta opcional: correo y contraseña; la contraseña se envía al proveedor de identidad y no se guarda expresamente en el código local.
- Persistencia local: tokens de sesión y correo cuando la cuenta está iniciada.
- Funciones: búsqueda y detalle de activos, series, desgloses y carteras guardadas.
- Carteras en la nube: identificadores de activos, pesos, nombre y metadatos necesarios; los cálculos se rehacen al abrir.
- Derechos implementados en autoservicio: acceso, descarga JSON, cambio de contraseña, cambio verificado de correo y supresión.

### Módulo de análisis de empresas

- Es una copia local de NUVIA que se compila y publica embebida dentro de Cartera.
- Utiliza Firebase Authentication, Firestore y una API propia en Cloud Functions.
- La API exige token y mantiene una caché temporal en memoria.
- Incluye traducción mediante `translate.googleapis.com` y carga tipografías de Google en el módulo.
- El código contiene una lista de correos autorizados; esta exposición debe revisarse dentro del análisis de minimización y seguridad.

### Vídeo

- Academia y Curso incorporan vídeos mediante `youtube-nocookie.com`.
- Desde el 2 de septiembre de 2026, los iframes no existen al abrir la página: se crean únicamente después de que la persona pulse «Reproducir vídeo».
- La barrera contextual explica el proveedor, ofrece un enlace alternativo y declara que no existe conexión mientras el vídeo permanece cerrado.
- El modo sin cookies y la carga voluntaria reducen el tratamiento previo, pero no eliminan la necesidad de informar sobre la conexión, IP, cabeceras y posibles tratamientos cuando se reproduce o abre el contenido externo.

### Panel de mercado externo

- El panel de índices utiliza el componente de TradingView.
- Desde el 2 de septiembre de 2026, el script externo permanece fuera del documento inicial y solo se añade después de pulsar «Cargar panel de índices».
- La persona puede mantenerlo cerrado o abrir TradingView directamente; no se recuerda la elección en el dispositivo.

### Publicación

- El portal se sirve mediante GitHub Pages.
- La actualización de datos y el despliegue se realizan mediante GitHub Actions.

## 6. Elementos no encontrados

En el código público revisado no se han encontrado:

- Google Analytics, Tag Manager u otra analítica activa;
- píxeles publicitarios;
- afiliación, pasarela de pago o contratación activa;
- cookies propias de seguimiento creadas por el portal;
- formularios de captación o derivación hacia entidades o profesionales financieros.

La ausencia debe volver a comprobarse antes de cada publicación material.

## 7. Vacíos que impiden cerrar textos legales

Antes de publicar páginas legales definitivas faltan decisiones o evidencias sobre:

1. identidad y datos de contacto del responsable;
2. bases jurídicas de cada tratamiento;
3. plazos de conservación y copias de seguridad;
4. encargados, contratos y ubicación efectiva de los datos;
5. transferencias internacionales y garantías aplicables;
6. procedimiento de atención de derechos fuera del autoservicio;
7. política de menores;
8. seguridad, gestión de incidentes y registro de accesos;
9. alcance real de Firestore y de cada Cloud Function;
10. licencias y condiciones de los proveedores de datos y traducción;
11. necesidad de evaluación de impacto;
12. revisión de la lista pública de correos autorizados del módulo de empresas.

Hasta resolverlos, NUVIA puede avanzar en accesibilidad técnica y metadatos, pero no debe presentar una política jurídica como validada.

## 8. Próximos pasos de la Entrega 2

1. Mantener etiquetas, ayudas y nombres accesibles mediante la auditoría renderizada incorporada.
2. Mantener foco visible, estados semánticos y navegación de pestañas mediante la nueva prueba de teclado.
3. Mantener Open Graph, Twitter Card y la imagen social propia de NUVIA mediante la prueba automática incorporada.
4. Confirmar el inventario con la configuración real del backend y de los proveedores.
5. Mantener los borradores de páginas de confianza preparados el 2 de septiembre de 2026 claramente marcados como internos y pendientes.
6. Solicitar validación jurídica antes de publicarlos como textos definitivos.

## 9. Borradores internos preparados

Se han creado borradores separados de aviso legal, privacidad, tecnologías de almacenamiento, condiciones de uso y declaración de accesibilidad. Los acompaña una matriz de decisiones que identifica los datos y evidencias que no pueden deducirse del código.

Los borradores:

- describen únicamente funciones verificadas en el portal;
- distinguen hechos, decisiones y propuestas sujetas a revisión;
- no se han convertido en HTML ni enlazado desde el pie público;
- no se consideran políticas vigentes;
- no deben publicarse hasta completar la identidad del titular, bases jurídicas, conservación, proveedores, transferencias, derechos, menores, seguridad y licencias.

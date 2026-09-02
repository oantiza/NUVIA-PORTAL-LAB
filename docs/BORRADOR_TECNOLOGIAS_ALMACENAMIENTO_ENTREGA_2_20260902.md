# Borrador interno · Cookies, almacenamiento local y contenido externo

> **NO PUBLICAR.** Inventario técnico para construir la información y el mecanismo de elección. Debe actualizarse después de aplicar las mitigaciones.

**Última revisión del borrador:** 2 de septiembre de 2026

## 1. Resumen comprensible

NUVIA no ha incorporado analítica publicitaria ni píxeles de seguimiento. Sí utiliza almacenamiento local para que determinadas herramientas recuerden sesiones, carteras, preferencias y progreso. TradingView y los vídeos de YouTube permanecen cerrados hasta que la persona solicita cargarlos. El módulo de empresas conserva conexiones técnicas de Google que todavía deben retirarse o regularizarse.

La política definitiva debe distinguir entre:

- almacenamiento estrictamente necesario para una función solicitada;
- preferencias elegidas por la persona;
- contenido externo opcional;
- futuros usos de análisis o comunicaciones, que hoy no están activos.

## 2. Almacenamiento propio identificado

| Clave o grupo | Contenido | Finalidad | Momento | Duración |
|---|---|---|---|---|
| `nuvia.maestra-sesion.v1` | tokens, caducidad, tipo y correo cuando existe cuenta | sesión anónima o registrada | al solicitar servicio o iniciar sesión | **[PENDIENTE C08]** |
| `nuvia.carteras-visitante.v1` | carteras, activos y pesos | recuperar el trabajo local | al guardar como visitante | hasta borrado local, salvo cambio documentado |
| `nuvia.consentimientos.v1` | elecciones opcionales y fecha | recordar elecciones | al decidir | **[PENDIENTE C08]** |
| `nuvia.suscripcion.v1` | marcador preparatorio | función no activa | no debería escribirse públicamente | retirar o documentar antes de activar |
| `nuvia-vivienda-maqueta-v1` | escenario y ofertas | recuperar ejercicio | al guardar | hasta borrado local |
| `nuvia-tax-preference` | preferencia territorial | adaptar guías | al elegir | hasta borrado local |
| claves del calendario | perfiles y revisiones | conservar progreso | al usar la guía | hasta borrado local |
| `nuvia-company-description-es:*` | traducciones | evitar traducciones repetidas | al traducir | **[PENDIENTE C08]** |
| `nuvia-company-analysis-theme` | preferencia visual | conservar tema | al elegir | hasta borrado local |

La política definitiva debe incluir instrucciones claras para borrar o revisar estas preferencias desde la propia web, no solo desde el navegador.

## 3. Contenido y servicios externos actuales

| Servicio | Carga actual | Finalidad | Medida necesaria |
|---|---|---|---|
| TradingView | voluntaria mediante «Cargar panel de índices» | panel de índices | mantener la barrera y documentar el tratamiento posterior |
| YouTube `youtube-nocookie.com` | voluntaria mediante «Reproducir vídeo» | vídeo educativo | mantener la barrera y documentar el tratamiento posterior |
| Google Fonts en `company-analysis/` | automática al abrir el módulo | tipografía | autoalojar |
| Google Translate no documentado | cuando el módulo traduce | descripción en castellano | retirar o sustituir por servicio y contrato adecuados |
| Firebase/Google Identity | perezosa al consultar o iniciar sesión | servicio solicitado | documentar como infraestructura necesaria y confirmar contrato/transferencias |

## 4. Diseño del mecanismo de elección

Mientras solo existan contenidos externos opcionales, la solución preferente es una barrera contextual en cada bloque:

1. mostrar título, proveedor y explicación antes de conectar;
2. ofrecer **Cargar este contenido** y un enlace directo alternativo;
3. no establecer el `src` ni descargar el script antes de la elección;
4. permitir recordar o no la elección, explicando el efecto;
5. incluir un acceso permanente para cambiarla.

Si se adopta un panel global, **Aceptar** y **Rechazar** deben mostrarse simultáneamente con una visibilidad equivalente, y el rechazo no puede exigir más pasos que la aceptación. La opción granular debe separar, como mínimo, contenidos externos de cualquier futura analítica.

## 5. Elementos no activos

No se han encontrado en el portal público:

- Google Analytics o Tag Manager;
- píxeles publicitarios;
- afiliación o seguimiento de conversiones;
- cookies propias de publicidad;
- pasarela de pago activa.

Esta ausencia debe validarse automáticamente en cada publicación y actualizarse si cambia el código.

## 6. Información pendiente

- Duración y finalidad definitiva de cada clave: **[PENDIENTE C08]**.
- Cookies o almacenamiento creados por cada tercero: **[PENDIENTE C09–C10]**.
- Contratos y licencias: **[PENDIENTE C09 y C15]**.
- Texto y diseño final del mecanismo: pendiente de mitigación técnica y revisión jurídica.

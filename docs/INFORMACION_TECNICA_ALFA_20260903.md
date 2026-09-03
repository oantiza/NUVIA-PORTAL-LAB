# NUVIA · Información de funcionamiento de la alfa

Fecha: 03-09-2026. Texto técnico actualizado y propuesta editorial interna.
No es una política jurídica aprobada ni un aviso de identidad del titular.
Sustituye como descripción técnica las hipótesis de cuentas y backend provisional
de los borradores del 02-09-2026; no modifica decisiones ni firmas.

## Texto comprensible para el visitante

### Qué puedes hacer

Esta alfa permite consultar contenidos educativos, noticias e indicadores,
utilizar simuladores y explorar la composición de una cartera y las cifras de
una empresa. No necesitas crear una cuenta. Las funciones de contratación,
pagos y almacenamiento de carteras en una cuenta no están activas.

### De dónde salen los datos

La cartera consulta el catálogo y las series disponibles en la base propia de
NUVIA. El análisis de empresas consulta los fundamentales de EODHD cargados en
esa misma base. No son datos en tiempo real. Cada cálculo de cartera identifica
el periodo efectivamente utilizado; la última fecha del catálogo no implica
que todas las series lleguen hasta ese día.

Al consultar una empresa se muestran la identidad y la procedencia. Si la lectura
no puede completarse y existe un respaldo local válido, se identifica como tal:
no equivale a una consulta actualizada de la base. El respaldo no cubre todo el
catálogo. Las fechas de dividendos se consultan por separado; su ausencia o fallo
no hace desaparecer las cuentas de la empresa.

Los estados financieros conservan las cifras recibidas. Las monedas ausentes,
escalas no acreditadas y periodos distintos se explican en la ficha. Una raya
significa dato ausente, no cero. Las fechas de presentación declaradas por el
proveedor no se presentan como fechas documentales verificadas individualmente.
No se muestran PER estimado, BPA previsto ni dividendos estimados.

### Noticias e indicadores

Las noticias proceden de los medios enlazados. La selección se realiza
automáticamente y muestra la fecha de publicación declarada por la fuente y la
fecha de selección. Los textos temáticos de NUVIA son contexto general: no
resumen ni verifican cada artículo. La noticia completa se consulta en el medio
original. La ilustración es un recurso decorativo propio, no una fotografía del
hecho noticioso. Los indicadores identifican la fecha y la fuente de cada serie.

Si una actualización no se completa, se conserva la copia disponible con su
fecha. No se cambia esa fecha para aparentar actualidad.

### Qué permanece en tu navegador

Al guardar una cartera local o un escenario de vivienda, se conserva en ese
navegador. Algunas guías recuerdan preferencias y marcas de seguimiento, y la
cartera guarda una caché técnica del catálogo y las series. Este almacenamiento
no es una copia de seguridad en una cuenta de NUVIA: puede perderse al borrar
los datos del sitio, usar otro navegador o cambiar de dispositivo.

Para borrar una cartera concreta, utiliza el control de borrado de la herramienta.
Para retirar todo el almacenamiento local, borra los datos de este sitio desde
tu navegador; antes, conserva fuera del navegador lo que necesites. No se ofrece
un botón de borrado global en la web que no esté implementado.

### Contenido externo

Los paneles de TradingView y los vídeos de YouTube se cargan cuando eliges abrirlos.
Esos proveedores reciben la conexión necesaria para servir su contenido; no se
promete anonimato de red. Las fuentes tipográficas de la web se sirven localmente.
El módulo activo no utiliza la traducción automática ni el inicio de sesión del
programa original. La consulta de datos propios también implica una conexión de
red al servicio que los aloja; no es un funcionamiento enteramente sin conexión.

## Inventario de implementación comprobado

| Zona | Persistencia y origen actuales | Evidencia de código |
|---|---|---|
| Cartera guardada | Local, a petición; sin traslado automático a una cuenta | `js/nuvia-guardado-local.js`, controles de `js/nuvia-constructor.js` y pruebas de alfa |
| Catálogo y precios | Lectura propia y caché técnica local por versión | `js/nuvia-datos.js` |
| Empresas | Lectura de ficha/current y complemento de dividendos; respaldo por empresa | `company-analysis/src/alfa/remote.js`, `catalog.js`, `App.jsx` |
| Vivienda | Escenario local cuando se pulsa guardar | `vivienda.html`, clave `nuvia-vivienda-maqueta-v1` |
| Fiscalidad y calendario | Preferencia territorial y seguimiento local | `fiscalidad.html`, `guia-calendario.html` |
| Academia | Itinerario y navegación; no progreso remoto ni suscripción activada | `academia.html`, batería `nuvia-academy-entry.test.mjs` |
| Noticias | Archivo local de entrega; actualización en el proceso existente | `scripts/update-daily-news.mjs`, `data/daily-content.json` |
| Terceros opcionales | Carga por acción del visitante | pruebas `nuvia-external-content.test.mjs` y revisión renderizada |

Los registros técnicos del proveedor de alojamiento, su conservación contractual
y la identidad del responsable no se pueden certificar leyendo el código del
cliente. Este inventario no afirma que terceros carezcan de registros de red.

## Información pendiente de indicar por el fundador

Por decisión del fundador de 03-09-2026, este paso se deja sin completar por el
momento y no bloquea el desarrollo de la alfa:

1. Identidad pública o titular: **Pendiente de indicar**.
2. Canal público de contacto: **Pendiente de indicar**.
3. Persona o equipo que atenderá errores y revisará la selección editorial:
   **Pendiente de indicar**.
4. Datos organizativos y contractuales que deban figurar en los documentos
   definitivos: **Pendiente de indicar**; no deducirlos de cuentas del ordenador
   ni de documentación bancaria.

Estos estados son exclusivamente internos. No deben aparecer como campos vacíos
ni como textos provisionales en la web visible.

No se han publicado identidades inventadas, añadido formularios que recojan datos,
ni almacenado información personal para completar este texto. La validación
jurídica externa sigue fuera de la alfa conforme a la orden del fundador.

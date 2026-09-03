# NUVIA · Fase 1: fiabilidad de los datos de la alfa

Fecha: 2 de septiembre de 2026. Autorización: continuar con la fase 1 tras el cierre local de la fase 0. Trabajo exclusivamente local; sin consultas, cargas ni cambios en Firebase real, sin commits ni publicación. Se conservan los cambios pendientes de la fase 0 y no se modifica `company-analysis/` ni la rama visual.

## Revisión previa y límites (marco §12–§13)

Clasificación **ÁMBAR**, conservando la de la alfa: las correcciones afectan a resultados descriptivos sobre instrumentos identificables. Esta revisión documenta el desarrollo correctivo local; no constituye validación jurídica ni autorización de publicación.

1. Necesidad: no mezclar históricos antiguos con precios nuevos, no presentar una geografía inventada y no preparar cargas con archivos residuales.
2. Entradas: datos del contrato actual de la alfa y selección del usuario; las pruebas utilizan datos ficticios y respuestas de red simuladas.
3. Transformación: invalidación de caché por versión del manifiesto, propagación de ausencias por dimensión y aislamiento de cada generación de archivos preparada.
4. Salidas: mismas series históricas rebasadas y distribuciones descriptivas, con el peso sin datos declarado; conjunto local de documentos coherente con su catálogo.
5. Instrumentos identificables: sí en el producto existente; no se amplía ni modifica el universo en esta intervención.
6. Circunstancias personales: ninguna nueva; no se solicitan perfiles ni datos del usuario.
7. Comprar, vender, mantener o no actuar: no se añade ninguna sugerencia.
8. Valor o precio: solo histórico; no se emite opinión ni objetivo de precio.
9. Mérito inversor: no se incorpora puntuación, selección ni ordenación por atractivo.
10. Recomendaciones de terceros: ninguna nueva.
11. Interfaz: no cambia el diseño; los datos desconocidos no pueden convertirse en un gráfico estimado de la alfa.
12. Acción comercial: ninguna; no se habilita contratación, contacto, ejecución ni activación de empresas.
13. Remuneración o conflicto: sin cambios respecto de la ficha de la alfa.
14. Condición de agente: se conserva el aislamiento; no se accede a bases, credenciales ni programas profesionales.
15. Datos personales: ninguna recogida nueva; las carteras locales existentes no se borran ni se migran. Solo se invalida la caché técnica afectada.
16. IA: ninguna en estas funciones; reglas deterministas.
17. Fuentes, fechas y fórmulas: mismas fuentes y fórmulas; la versión del manifiesto identifica la caché, y el informe local identifica la generación preparada. Una prueba ficticia no acredita datos publicados.
18. Regresiones: reproducir los tres defectos antes de corregirlos; probar recarga y pestaña persistente, ausencia parcial y total, generaciones sucesivas, fallos de preparación y manipulación de inventario; ejecutar las baterías existentes y revisar el diff.

Estados prohibidos: reutilizar una serie de otra versión, estimar la dimensión marcada sin datos, incorporar archivos de otra generación, escribir datos reales desde las pruebas o interpretar el éxito local como autorización de publicación.

## Decisiones de implementación

- Históricos: comprobar el manifiesto antes de pedir series; asociar los años cerrados a su versión. Mantener la reutilización si la versión coincide y descartar las entradas antiguas sin versión. Un error de lectura no se convierte silenciosamente en éxito con caché obsoleta.
- Desgloses: tratar sectores y regiones de manera independiente. Conservar la dimensión conocida y declarar la desconocida. La falta explícita de exposición a renta variable tampoco se convierte en cero.
- Preparación: crear una generación local independiente para cada proyección y seleccionar únicamente una generación terminada y validada. Conservar las anteriores, sin limpieza destructiva; el lector rechaza el formato heredado hasta regenerar y comprueba inventario, catálogo y recuentos antes de permitir una futura carga.

## Resultados

**Correcciones terminadas y verificadas en local. Sin confirmar ni publicar.** La publicación mantiene las condiciones pendientes registradas en la fase 0.

### 1. Históricos y cachés de las vistas

- Antes de consultar series se revalida el manifiesto. Los años cerrados se reutilizan únicamente cuando coinciden proyecto y `updated_at`; las entradas antiguas sin versión se ignoran y se reemplazan al obtener datos válidos.
- Con una versión estable se conserva la caché de años cerrados. El año en curso se consulta de nuevo, como antes. Si falta versión, no se reutilizan series persistentes.
- Un cambio de versión invalida las búsquedas y fichas en memoria. Los desgloses del análisis quedan asociados al cliente y a su versión.
- El constructor conservaba además una promesa resuelta indefinidamente para cada conjunto de instrumentos. Ahora comparte solo solicitudes simultáneas: un recálculo posterior vuelve a pasar por la validación del cliente.
- Una caída de la consulta produce un error y permite reintentar; no convierte automáticamente el contenido antiguo en un resultado actualizado. Las carteras guardadas por el usuario no se borran.
- Coste explícito: cada nueva consulta de series añade la lectura del manifiesto. Un cambio de versión obliga a descargar de nuevo los años necesarios. No se añade un temporizador ni refresco automático de la pantalla en reposo.

### 2. Ausencias parciales y cobertura

- Sectores y regiones se comprueban por separado. Si solo hay sectores, se conservan y la geografía figura sin datos; si solo hay regiones, no se deduce un sector del nombre.
- Un mapa vacío, de suma cero o con pesos negativos/no numéricos no se considera un desglose válido. No se rellena con una estimación de la alfa.
- Una exposición a renta variable desconocida no se convierte en cero. Una exposición conocida de cero sí se respeta: no requiere desglose de renta variable.
- Se conserva la forma de salida existente y su aviso de cobertura. En la prueba de una cartera con un 40 % sin regiones y un 60 % conocido, se declara el 40 % sin datos y el gráfico representa únicamente la parte conocida.
- El comportamiento heredado con campos `undefined` queda intacto; el adaptador de la alfa entrega ausencias explícitas como `null`, también por dimensión.

### 3. Preparación de archivos sin residuos

Cada proyección crea `output/mercado-alfa/publicable/generaciones/{identificador}/`. Dentro se guardan fichas, series, desgloses, catálogo, resumen e inventario con huellas SHA-256. La referencia `publicable/actual.json` se sustituye al final mediante un renombrado local, después de validar todo el conjunto.

La carga solo lee los archivos del inventario de la generación seleccionada. Comprueba integridad, identidades, pertenencia de documentos, versión de las fichas, catálogo reconstruido y recuentos. Rechaza inventarios o archivos alterados y rutas fuera del formato admitido. El resumen utilizado por el publicador procede de esa misma generación, no de un resumen suelto anterior.

Las generaciones anteriores, las incompletas y la estructura heredada **se conservan**. No se implementa borrado ni limpieza automática; los archivos que no figuran en el inventario no se incorporan a la carga. Las huellas detectan cambios accidentales, no constituyen una firma ni protegen frente a alguien que controle todos los archivos locales.

**Migración operativa pendiente, para una ejecución futura autorizada:** ejecutar primero `proyectar` para generar el nuevo formato y después revisar `publicar --dry-run`. El lector rechaza una carpeta heredada sin `actual.json`. En esta fase no se han ejecutado esas órdenes sobre la descarga real ni se ha realizado ninguna carga. Las pruebas invocan la proyección sobre carpetas temporales de datos ficticios.

### Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| Regresiones iniciales antes de corregir | Ocho casos fallaron y reprodujeron cachés obsoletas, estimaciones indebidas y residuos de proyección |
| `npm run test:fase1` | **16 pruebas correctas**; sin red real, con bloqueo de `fetch` no inyectado |
| Navegador recurrente frente a nuevo, simulado | Mismo histórico tras una corrección. Antes devolvían 110 y 220 con datos ficticios; ahora ambos devuelven 220 |
| Consumidores del constructor y del análisis | Revalidación en consultas sucesivas, deduplicación simultánea, fichas y desgloses renovados; clientes aislados |
| Proyección sucesiva de 201 instrumentos a uno | Dos trozos de catálogo pasan a uno; el desglose retirado no reaparece; la generación anterior sigue intacta |
| Proyección fallida y conjunto incoherente | No sustituyen la selección anterior |
| Archivos alterados, inventario modificado y referencia inválida | Rechazados por el lector local |
| `npm run test:analisis` | Las 14 baterías anteriores y la nueva batería de fase 1 terminan correctamente |
| `npm run test:reglas` | Correcto, sin red; se conserva la protección de fase 0 |
| Controles estáticos de `validate` | Paridad, sitio estático, consistencia, lenguaje, portada, Lecturas, navegación, definición, metadatos, contenido externo, privacidad de empresas y sistema editorial correctos |
| Revisión de cambios | Sin cambios en Firebase, universo, estilos, páginas HTML, módulo de empresas ni rama visual; cambios de fase 0 conservados |

Persisten los cuatro avisos previos de consistencia (cabecera, pie y `noindex` de la guía de impuestos; imágenes de portada sin carga diferida). No se ha ejecutado `auditar`, una prueba visual de navegador, la compilación de `dist/` ni una verificación en producción. Las pruebas de navegador recurrente/pestaña abierta son simulaciones del cliente y sus consumidores, no capturas de una sesión real. No se presenta esta entrega como un `validate` completo.

### Archivos de esta fase

- `js/nuvia-datos.js`: versión de caché y normalización de ausencias.
- `js/nuvia-concentracion.js`: ausencia por dimensión y exposición RV de cero conocida.
- `js/nuvia-constructor.js`: caché de series limitada a solicitudes simultáneas.
- `js/nuvia-analisis.js`: invalidación de desgloses y eliminación de la segunda caché permanente de fichas.
- `scripts/mercado-alfa/publicable.mjs`: generaciones, inventario, validación y selección local.
- `scripts/mercado-alfa/run.mjs`: integración del nuevo formato; funciones de preparación importables para probarlas sin ejecutar la orden principal.
- `docs/nuvia-fase1.test.mjs` y `package.json`: batería específica integrada en las comprobaciones habituales.
- Este documento: revisión previa, alcance, evidencia, migración y límites.

### Límites que no resuelve esta fase

- No cambia la estructura ni los datos del servidor. Una futura publicación sigue teniendo las características del cargador existente: no es una transacción global de todos los documentos. La coherencia durante un cambio de versión en pleno proceso de carga requiere revisión específica antes de publicar.
- No borra documentos remotos que hubieran quedado de cargas antiguas. El aislamiento implantado evita preparar archivos locales residuales; no equivale a una limpieza de Firebase.
- No modifica las carteras modelo ni incorpora los instrumentos que les faltan. Ese es el siguiente bloque del plan, con las decisiones de composición reservadas al fundador.
- No reactiva Análisis y valoración de empresas. La copia se conserva hasta resolver su contrato de datos en su fase específica.
- No resuelve ni sustituye la validación jurídica o de compliance pendiente de la alfa.

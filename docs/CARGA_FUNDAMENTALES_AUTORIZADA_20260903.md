# Carga de fundamentales autorizada · 03-09-2026

> **Último estado:** la [carga adicional autorizada de Aena y Ferrovial](EJECUCION_IDENTIDADES_AENA_FERROVIAL_20260903.md)
> eleva el total comprobado a **73 fundamentales**. Sus nuevas identidades tienen
> precios idénticos a los originales conservados. Este acta describe la primera
> carga de 71, no la migración posterior ni una publicación del portal.

> **Actuación posterior:** [conexión local a la base propia](CONEXION_FUNDAMENTALES_BASE_PROPIA_20260903.md)
> implementada y 71 fichas comprobadas por lectura. Las referencias de este acta
> al lector estático describen el instante de la carga, anterior a esa conexión.

Orden del fundador: «carga los datos que necesites», tras comprobar la ausencia
de fundamentales en las fichas y subcolecciones de acciones de la base propia.

## Alcance de la ejecución

- Proyecto único `nuvia-family-wealth`, base `(default)`.
- Nuevos documentos `assets/{ISIN}/fundamentals/current`, separados del documento
  de catálogo y de los precios. No se cambian reglas, índices ni permisos.
- Información de empresas del catálogo actual, descargada de EODHD mediante
  la clave ya disponible. No se cambian las filas de inclusión del CSV antiguo.
- Proyección positiva antes de guardar: no se conservan los crudos de EODHD,
  personas, directivos ni accionistas nominales. Se excluyen PER estimado,
  BPA previsto, dividendos estimados, consenso, ratings y objetivos de precio.
- Se registran fecha de descarga real y huella del JSON recibido; la huella
  se calcula en memoria, antes de descartar el original.
- Ferrovial no se migra en esta operación: el catálogo conserva el ISIN antiguo
  y su sucesión necesita un cambio separado de identidad y referencias.
- Preparación local, revisión y después creación con precondición de inexistencia.
  No se sobreescribe nada. Un único lote atómico y lectura posterior de verificación.
- Sin despliegue ni publicación del sitio. Cargar los datos no activa por sí solo
  una lectura automática en el módulo, que sigue usando su instantánea local.

## Revisión previa de las 18 cuestiones del marco

1. Necesidad: disponer de estados y cifras de las empresas que el usuario consulta.
2. Entradas: catálogo de acciones propio y respuestas empresariales de EODHD.
3. Transformación: proyección explícita y formato de almacenamiento; no valoración.
4. Salida: cifras históricas, metadatos y limitaciones, sin decisiones.
5. Emisores identificables: sí; se mantiene la revisión interna de la alfa.
6. Circunstancias personales del usuario: ninguna.
7. Compra, venta o mantenimiento: no se sugieren.
8. Opinión de valor o precio: ninguna.
9. Atractivo inversor: sin puntuación ni ordenación por mérito.
10. Recomendaciones de terceros: no se trasladan.
11. Interfaz: esta actuación no cambia la presentación ni añade veredictos.
12. Contratación, contacto o ejecución: no existen.
13. Remuneración o afiliación: sin cambios.
14. Separación profesional: solo base propia y clave de EODHD ya destinada a NUVIA.
15. Datos personales: no se almacenan; los campos nominales se descartan en memoria.
16. IA en el producto: no se introduce.
17. Fuentes: EODHD, descarga real, ISIN y mercado contrastados con catálogo; moneda
    por ejercicio y escala desconocida conservadas sin inferencias.
18. Pruebas: lista positiva, ausencia de previsiones/personas, identidad estricta,
    destinos fijos, creación sin sobrescritura y lectura comparada después de cargar.

La excepción jurídica de la alfa permanece. No se ratifican decisiones en nombre
del fundador ni se añaden bloqueos: cualquier discrepancia nueva se informa.

## Resultado

**Carga realizada y verificada:** 71 documentos creados en una operación atómica,
el 03-09-2026 a las `08:24:28.427390Z`. La lectura posterior de los 71 coincide
con los datos preparados, comparando objetos completos sin depender del orden
de las claves de Firestore. No se han sobreescrito documentos existentes.

Se descargaron 72 respuestas de fundamentales (720 unidades contabilizadas por
el cliente de EODHD), sin fallos de consulta. Se proyectaron y cargaron 71; Aena
presentó un segundo cambio de ISIN y no se le asignaron cifras de otra identidad.
Ferrovial quedó fuera de esta descarga, pendiente de la corrección específica.

Pruebas: 17/17 de recuperación e ingestión. La validación real de las 71 entradas
también supera el lector de la alfa. Las pruebas de ingestión están incorporadas
al comando `test:fundamentales-alfa`. Una comprobación adicional sin autenticación
leyó correctamente Iberdrola, BBVA y TSK, sin cambiar las reglas publicadas.

Evidencia local, excluida de Git y del sitio:

- `output/carga-fundamentales/preparado-2026-09-03T08-23-50-211Z.json`.
- `output/carga-fundamentales/resultado-2026-09-03T08-24-30-394Z.json`.
- El resultado identifica el plan de creación previo, destinos y llamadas.

## Cinco ejercicios de fundamentales

Orden posterior: «carga 5 años de datos históricos». Se ha comprobado el contenido
que acaba de cargarse:

- 70 de las 71 empresas tienen al menos cinco filas anuales con cifras en cada
  uno de los tres estados: resultados, balance y flujos. Esto no implica que
  todos los campos estén completos ni que los tres últimos cierres coincidan.
- TSK dispone de tres ejercicios en EODHD: 2023, 2024 y 2025. No se han inventado
  2021/2022 ni repetido cifras para alcanzar cinco.
- Se conservan los años anteriores que aporta la fuente; pedir cinco años no
  se ha interpretado como autorización para borrar el resto.
- Los precios son un conjunto distinto; su cobertura se documenta en
  [Cobertura de cinco años de precios](COBERTURA_CINCO_ANIOS_PRECIOS_20260903.md).

## Identidades pendientes y fuentes primarias

### Ferrovial

Catálogo: `ES0118900010`; archivo de fundamentales: `NL0015001FS8`.
El cambio corresponde a la fusión efectiva el 16-06-2023 y a la sustitución de
las acciones de Ferrovial S.A. por las de Ferrovial SE. No es suficiente cambiar
un texto: hay que tratar identificador del activo, catálogo y continuidad de
referencias e históricos. No se ha ejecutado esa migración.

Fuentes: [aviso de ICE con ISIN antiguo y nuevo](https://www.ice.com/publicdocs/liffe/corporate_actions/2023/CA-2023-199-Lo.pdf)
y [comunicación de Ferrovial sobre el canje](https://www.ferrovial.com/es/accionistas-e-inversores/hechos-relevantes/procedimiento-de-canje-de-sus-acciones-por-acciones-de-nueva-emision-de-ferrovial-international-se/).

### Aena

Catálogo: `ES0105046009`; respuesta nueva de EODHD: `ES0105046017`.
El aviso oficial de BME registra el cambio por desdoblamiento de una acción
antigua en diez nuevas, efectivo el 19-06-2025. No se han multiplicado precios,
acciones, BPA ni ninguna otra magnitud para intentar resolverlo automáticamente.

Fuente: [aviso de exclusión y admisión de BME](https://www.bolsasymercados.es/dam/descargas/regulacion/renta-variable/bolsa-madrid/notas/2025/split-aena-aviso.pdf).

La autorización de carga se ha aplicado a las identidades coincidentes. Las
correcciones de estos dos identificadores y sus referencias se presentan como
el siguiente paso concreto para aprobación del fundador.

## Diferencia entre base y página

Los 71 fundamentales están ahora en Firestore. La web no ha sido desplegada ni
se ha cambiado en esta actuación su lector: la página sigue utilizando su
instantánea local anterior de 52 empresas. Conectar o regenerar esa presentación
con la nueva carga es el siguiente paso de integración, no una tarea ya hecha.

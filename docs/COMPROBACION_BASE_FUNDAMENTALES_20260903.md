# Comprobación directa de fundamentales en la base de NUVIA

Fecha: 3 de septiembre de 2026. Última lectura: 08:19:57 UTC, 10:19:57 en Madrid.
Orden: «compruébalo». Alcance: diagnóstico, sin escrituras remotas.

> **Estado posterior:** tras este diagnóstico, el fundador autorizó la carga.
> A las 08:24:28 UTC se crearon y verificaron 71 documentos de fundamentales.
> La ausencia descrita a continuación es el estado previo comprobado, no el
> estado actual. Véase [carga autorizada](CARGA_FUNDAMENTALES_AUTORIZADA_20260903.md).
> La [conexión posterior del módulo](CONEXION_FUNDAMENTALES_BASE_PROPIA_20260903.md)
> ya lee esas 71 fichas; las 52 del archivo local solo son respaldo identificado.

## Resultado

**Los estados financieros y ratios fundamentales no están cargados en las fichas
ni en las subcolecciones de las 73 acciones del catálogo que utiliza el portal.**
No hay una colección raíz de fundamentales en esta base. El campo `metrics`
contiene medidas calculadas sobre precios, no PER, BPA, balance o resultados.

Por tanto, la recuperación actual del módulo sigue dependiendo de sus archivos
locales: 52 empresas con cifras, veinte sin archivo y Ferrovial con una discrepancia
de identidad. La presencia de las veinte empresas en el catálogo remoto no implica
que sus fundamentales estén almacenados allí.

## Qué se ha consultado

- Proyecto único: `nuvia-family-wealth`. No se han consultado otros proyectos.
- Inventario de bases: una, `(default)`, situada en `europe-west1`.
- Colecciones raíz, listado completo sin paginación pendiente:
  `assets`, `catalog_chunks`, `catalog_manifest` y `sync_runs`.
- Manifiesto público y cuatro fragmentos del catálogo: 698 instrumentos,
  de los que 73 son acciones. Actualización declarada del manifiesto:
  `2026-09-02T19:30:47.355Z`.
- Las 73 fichas de acciones, incluidos los veinte símbolos pendientes.
- Enumeración de subcolecciones de cada una de las 73 fichas: todas devuelven
  únicamente `series`.
- Campos de las fichas y estructura de sus métricas y procedencia.

Campos encontrados dentro de `metrics`:

```text
as_of_date
return_1y
return_3y_annualized
volatility_1y
volatility_3y
max_drawdown_3y
method
```

Se han encontrado identidad, clasificación, exposiciones, historia, calidad y
procedencia de los datos de cartera. No bloques de cuenta de resultados,
balance, flujos de caja, BPA publicado o múltiplos fundamentales.

## Qué explica la carencia local

La comprobación anterior del descargador mostró que las veinte acciones sin
archivo tienen `incluir=no` en su CSV local. Ese proceso trabaja con una selección
antigua de 161 instrumentos, distinta del catálogo remoto actual de 698.
La discrepancia explica por qué no hay que volver a publicar el catálogo usando
esa lista antigua ni cambiarla indiscriminadamente.

## Alcance y límites de la conclusión

Se ha comprobado la base que usa NUVIA y la estructura de sus acciones; no se
afirma que EODHD carezca de esos datos. Tampoco se ha inventariado el contenido
de otros proyectos, archivos externos, copias de seguridad ni posibles datos
almacenados fuera de la estructura de acciones del portal.

No se han cambiado datos, reglas, índices, permisos, identificadores, históricos,
catálogo ni código de la web. No se ha llamado a EODHD ni guardado información
personal. Las credenciales existentes se utilizaron solo en memoria para leer;
no se mostraron ni se escribieron en archivos. Las peticiones POST utilizadas
fueron exclusivamente `listCollectionIds` y `batchGet`, operaciones de lectura.

## Siguiente actuación propuesta, aún no ejecutada

Preparar el contrato y la carga de fundamentales propios a partir de la fuente
autorizada, separados de catálogo y series de precios. La propuesta debe precisar
destinos, campos, procedencia, fechas, identidades y forma de actualización;
previsualizar el resultado localmente antes de solicitar permiso para escribir.

No incorporar PER estimado, BPA previsto, dividendos estimados ni datos personales.
No resolver por inferencia el ISIN de Ferrovial. El permiso para modificar la base
debe referirse a una operación concreta; «compruébalo» no autoriza esa carga.

## Evidencia local

La última pasada tiene 81 solicitudes de lectura registradas, todas con HTTP 200:
`output/cierre-alfa/inventario-fundamentales-2026-09-03T08-19-57-062Z.json`.
Registra proyecto, colecciones, campos, identidades y estados de las solicitudes,
sin contenidos crudos ni credenciales. Hubo comprobaciones previas de contraste;
el recuento de 81 corresponde a esta pasada, no a la suma de todas las consultas.

El diagnóstico está en `output/comprobar-colecciones-fundamentales.mjs`, fuera de
la web publicada. La salida y el diagnóstico están ignorados por Git.

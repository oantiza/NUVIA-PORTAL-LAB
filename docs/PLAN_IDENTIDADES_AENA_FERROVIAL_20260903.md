# Aena y Ferrovial · diagnóstico y corrección propuesta

> **Autorización recibida, 03-09-2026:** el fundador respondió «sí» a corregir
> referencias y cargar fundamentales, conservando históricos y registros, sin
> borrar ni publicar. Se ejecuta de forma compatible: crear los 16 documentos
> actuales y registrar correspondencias/versionado en el manifiesto. Los dos
> identificadores visibles del catálogo bruto se conservan durante la transición,
> para no romper la web publicada. La copia local los resolverá al código actual.
> No se modifica `catalog_chunks/003` hasta una publicación compatible autorizada.
> La operación de esta fase afecta a 17 documentos (16 creaciones y manifiesto),
> y conserva sin cambios todos los documentos antiguos y los cuatro trozos.

Fecha: 03-09-2026. Estado vigente: **corrección autorizada ejecutada y verificada**.
Véase [acta de ejecución](EJECUCION_IDENTIDADES_AENA_FERROVIAL_20260903.md): 16
creaciones, manifiesto actualizado, cero borrados y 73 fundamentales disponibles.
Los apartados siguientes conservan el diagnóstico y la propuesta anteriores a la
autorización. La activación del catálogo bruto y la publicación siguen separadas.

## 1. Qué se ha confirmado

| Empresa | Identificador del catálogo | Identificador actual en EODHD | Hecho documentado |
|---|---|---|---|
| Aena (`AENA.MC`) | ES0105046009 | ES0105046017 | Desdoblamiento 1 acción antigua por 10 nuevas, efectivo 19-06-2025 |
| Ferrovial (`FER.MC`) | ES0118900010 | NL0015001FS8 | Fusión con canje 1 por 1, efectiva 16-06-2023 |

Fuentes primarias consultadas:

- [Aviso de Bolsa de Madrid sobre Aena](https://www.bolsasymercados.es/dam/descargas/regulacion/renta-variable/bolsa-madrid/notas/2025/split-aena-aviso.pdf).
- [Aviso de ICE sobre Ferrovial](https://www.ice.com/publicdocs/liffe/corporate_actions/2023/CA-2023-199-Lo.pdf).

Ambas respuestas nuevas de EODHD confirman esos ISIN, sus símbolos y cotización
en EUR. EODHD todavía denomina a Ferrovial «Ferrovial S.A.»: se conserva como nombre
de la fuente, sin interpretar que todos los ejercicios pertenecen al mismo emisor
jurídico. La transición debe mostrarse con su fecha y fuente.

### Base propia observada

- Universo: 698 instrumentos; ambas referencias están en `catalog_chunks/003`,
  posiciones 30 y 54 (índices desde cero). Las posiciones son evidencia de esta
  lectura, no direcciones que un ejecutor deba asumir sin revalidación.
- Existen las fichas antiguas y seis documentos anuales de precios por empresa:
  2021–2026, con 1.450 puntos cada una, del 04-01-2021 al 02-09-2026.
- No existen las fichas en los dos identificadores actuales, ni sus series ni
  documentos `fundamentals/current`. Tampoco hay fundamentales bajo los antiguos.
- Se han contrastado los **2.900 puntos** con una nueva lectura de EODHD: coinciden
  exactamente después de la normalización existente a seis decimales. Cero
  diferencias en fechas, longitud o valores. No se escribe ningún precio.
- Aena ya contiene precios ajustados: alrededor del desdoblamiento no se debe
  volver a dividir la serie por diez. El contraste no constituye una orden para
  modificar BPA, dividendos o número de acciones.

### Fundamentales preparados, no cargados

Se generaron dos candidatos locales mediante el contrato positivo existente,
usando los identificadores actuales **solo en esos candidatos**, sin cambiar las
fichas leídas. Ambos pasan la comprobación de identidad y de campos permitidos.

| Empresa | Resultados | Balance | Flujos |
|---|---|---|---|
| Aena | 15 ejercicios, 2011–2025 | 15, 2011–2025 | 15, 2011–2025 |
| Ferrovial | 26 ejercicios, 2000–2025 | 26, 2000–2025 | 22, 2004–2025 |

Los recuentos son filas de la fuente, no una garantía de que cada celda esté
completa ni de comparabilidad entre todos los ejercicios. Sin estimaciones,
datos personales, crudos conservados ni cifras inventadas.

## 2. Corrección recomendada, una vez autorizada

No basta con sustituir el texto del ISIN. Hoy `asset_id` también identifica la
ruta de la ficha, las series, las posiciones de cartera y las comprobaciones de
disponibilidad. La migración debe mantener compatibles esas referencias.

1. **Preparación y reversibilidad.** Releer exactamente ambas fichas, sus series,
   el trozo del catálogo y el manifiesto. Guardar respaldo local y versiones de
   los documentos. Verificar que nadie los haya modificado entre preparación y
   aplicación. No regenerar los 698 instrumentos desde el CSV antiguo.
2. **Compatibilidad local antes de activar el catálogo.** Preparar la resolución
   explícita antiguo → actual en búsqueda, disponibilidad, detalle y series.
   Conservar los pesos e importes de las carteras antiguas y su fichero guardado;
   no reescribirlos automáticamente. Detectar la misma empresa bajo ambos códigos
   sin duplicarla ni sumar posiciones silenciosamente. Actualizar el índice del
   módulo y comprobar la identidad recibida, sin eliminar sus validaciones.
3. **Crear destinos actuales, sin borrar los anteriores.** Dos fichas de activo,
   doce documentos anuales de precios y dos fundamentales: **16 documentos nuevos**
   previstos según el inventario actual. Los valores y fechas de precios se copian
   sin recálculo; solo cambia su referencia de activo. Se documenta la sucesión
   histórica y su fuente. Creación con condición de inexistencia; nunca sobrescribir
   un destino que otro editor haya creado entretanto.
4. **Activación coordinada.** Sustituir las dos referencias en
   `catalog_chunks/003` y actualizar la versión del `catalog_manifest/public`,
   con las correspondencias necesarias para las referencias antiguas. Son dos
   documentos existentes a actualizar, preservando todos sus otros datos. El
   catálogo sigue teniendo 698 instrumentos, no 700. La sustitución pública no
   debe adelantarse a un cliente compatible: si requiere publicar la web, se
   consulta esa publicación por separado. Una carga preparatoria no autoriza
   activar el catálogo ni romper clientes ya publicados.
5. **Comprobación posterior.** Lectura de todos los documentos afectados; igualdad
   de precios antes/después, 73 fichas de fundamentales esperadas si no cambia el
   universo, búsqueda sin duplicados y consultas por ambos identificadores.
   Comprobar carteras antiguas con datos ficticios, fechas, pesos, reintentos,
   cachés y cambio rápido de empresa en escritorio/tablet.
6. **Seguimiento.** Mantener los documentos anteriores recuperables; no borrarlos
   ni alterar reglas, permisos o índices. Impedir que una carga posterior desde
   referencias antiguas deshaga la corrección. No ampliar a otros instrumentos.

La cifra de 18 documentos afectados es una previsión (16 nuevos y 2 existentes),
no un lote listo para ejecutar. Su aplicación requiere la autorización, preparar
la compatibilidad y revalidar las versiones reales. No se ha escrito un ejecutor
remoto ni se ha enviado ninguna operación de creación, modificación o borrado.

## 3. Control de alcance de la función (§12)

1. Finalidad: recuperar las dos fichas y conservar la continuidad documental.
2. Datos: identidad, catálogo, cifras y precios públicos de las dos empresas.
3. Transformación: referencias y copias verificadas; sin ajustes económicos nuevos.
4. Salida: las mismas fichas descriptivas, con identificadores y procedencia correctos.
5. Emisores identificables: sí; revisión interna ámbar conservada.
6. Circunstancias personales: no se solicitan ni se almacenan.
7. Sugerencia de operar: ninguna.
8. Valor o precio futuro: ninguna opinión ni estimación añadida.
9. Atractivo inversor: ningún ranking, selección o comparación por mérito.
10. Recomendaciones de terceros: no se incorporan.
11. Interfaz: nota documental de sucesión, sin veredicto inversor.
12. Ejecución o contratación: ninguna.
13. Remuneración o publicidad: sin cambios.
14. Separación profesional: exclusivamente `nuvia-family-wealth`.
15. Datos personales: ninguno en la base; no se accede a carteras reales del usuario.
16. IA: no interpreta ni modifica los datos del producto.
17. Fuentes y límites: avisos primarios, EODHD, fechas, divisas y escalas acreditadas
    o ausentes; identidad histórica distinguida de la actual.
18. Regresión: contrato positivo, precios idénticos, compatibilidad de referencias,
    versiones concurrentes, lectura posterior y revisión visual proporcionada.

Se mantienen las órdenes alfa: sin bloqueos nuevos unilaterales y sin exigir
validación jurídica externa. Esta propuesta no firma ni ratifica por el fundador.
Publicación, datos personales y cualquier ampliación de alcance quedan separados.

## 4. Evidencia y consulta pendiente

- `output/identidades-pendientes/diagnostico-2026-09-03T09-20-42-965Z.json`:
  inventario, referencias y dos candidatos saneados; 0 escrituras en base.
- `output/identidades-pendientes/precios-2026-09-03T09-21-48-091Z.json`:
  contraste íntegro de los precios; 0 diferencias, 0 escrituras.
- Las salidas están excluidas de Git y de la web. Las descargas de esta revisión
  consumieron 24 unidades contabilizadas por el cliente: 20 por fundamentales y
  cuatro consultas de precios (dos acotadas en presentación y dos completas).

**Consulta:** autorizar la corrección controlada de referencias de Aena y Ferrovial
y la carga de sus fundamentales, conservando históricos y registros anteriores,
sin datos personales ni publicación. Si la activación afecta a la versión ya
publicada, coordinarla y obtener autorización de publicación antes de esa fase.

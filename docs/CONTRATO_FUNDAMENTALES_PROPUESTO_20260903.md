# Fundamentales de empresas: contrato propuesto para revisión

## Situación del borrador tras la recuperación de la alfa

Este contrato de registros normalizados sigue siendo una **propuesta técnica**;
no es el contrato del JSON que consume actualmente `src/alfa/`. La entrada
activa utiliza una proyección local de campos declarados, con cobertura y
limitaciones explícitas. No se ha implementado una conexión nueva a Firebase.

Las exclusiones provisionales que este borrador recoge para capitalización,
EV monetario y BPA histórico, así como las referencias a cuarentena, no ordenan
ocultar esas cifras en la alfa actual: se muestran como valores originales de
la fuente y se señalan los metadatos desconocidos. Los tres campos futuros
expresamente excluidos por el fundador siguen fuera. El marco vigente es v1.2;
cualquier duda que requiera cambiar el alcance se consulta, sin introducir
bloqueos nuevos por aplicar este borrador antiguo.

La identidad de Ferrovial sigue requiriendo confirmación; no se ha fusionado
información entre ISIN distintos. Matriz de paridad, evidencia de pruebas y
pendientes actuales en [el acta de cierre local](CIERRE_LOCAL_ALFA_20260903.md).

**Alcance actualizado (03-09-2026):** por orden del fundador, validación jurídica
externa fuera de alcance y no bloqueante en la alfa, conforme al [marco v1.1 §0](MARCO_REGULATORIO_OBLIGATORIO.md).
Se mantienen validación del contrato, fuentes, identidad, unidades, pruebas y
autorizaciones operativas. Las referencias anteriores a dictamen externo no son
un requisito para avanzar en la alfa.

Fecha: 3 de septiembre de 2026. Estado: **borrador técnico local, no desplegado**.
Versión: `nuvia-fundamentals-draft.v1`.

Esta propuesta no modifica colecciones, permisos, procesos de carga ni el cliente
actual del portal. Su validador está en `company-analysis/local/contract.mjs`.
Validar la forma de un registro NO certifica sus importes, identidad, derechos
de difusión, compatibilidad profesional ni autorización de publicación.

## 1. Identidad y separación de datos

- Usar `asset_id` canónico de la alfa, ISIN confirmado y símbolo con mercado.
- Antes de generar registros, deben coincidir ISIN, símbolo/mercado y moneda de
  cotización entre ficha y fuente. No basta coincidir por nombre o ticker.
- Un mismo ISIN con varias cotizaciones se revisa; no se escoge la primera.
- No cambiar identificadores de activos existentes ni sus históricos para encajar
  un fundamental. Ferrovial es un caso bloqueado hasta resolver el conflicto.
- Mantener precios y catálogo separados de estados contables y ratios. Las fichas
  de cartera no deben descargar décadas de estados para mostrar una búsqueda.
- Entidades lógicas propuestas: un registro por empresa/estado/ejercicio y una
  instantánea independiente de ratios. Las rutas físicas y reglas de Firebase
  se decidirán con autorización; este documento no las crea.

## 2. Campos comunes

| Campo | Contenido y regla |
|---|---|
| `schema_version` | Versión exacta; rechazar versiones desconocidas. |
| `asset_id` | ISIN canónico de la alfa; validar además identidad contra catálogo. |
| `symbol` | Símbolo del proveedor con mercado. |
| `kind` | `annual` o `ratios`; no mezclarlos. |
| `source.provider` | `EODHD`, para esta versión. |
| `source.symbol` | Debe coincidir con `symbol`. |
| `source.provider_updated_on` | Fecha declarada por proveedor; `null` si se desconoce. |
| `source.downloaded_at` | Instante UTC de descarga de ESTE fundamental; `null` si no existe evidencia. |
| `source.raw_sha256` | Huella del archivo fuente concreto para trazabilidad; nunca una clave del proveedor. |

La fecha de modificación de un archivo no prueba cuándo se obtuvo del proveedor.
Tampoco se debe reutilizar sin comprobación el `fetched_at` de los metadatos
compartidos con precios: puede corresponder a una actualización de cotizaciones.
La fecha de consulta a la alfa no es la fecha de los estados contables.

## 3. Registro anual

Campos adicionales:

- `statement`: `income`, `balance` o `cash_flow`.
- `period_end`: cierre del ejercicio, no año de descarga. Mantener día y mes.
- `filed_on`: fecha de presentación, `null` cuando no conste; sin fechas futuras
  ni anteriores al cierre para estos registros anuales.
- `currency`: moneda de ESE estado y ejercicio, o `null`. No heredar de la
  cotización ni de otros ejercicios. El formato de tres letras no acredita por
  sí solo que el código monetario sea correcto: revisar el código y su contexto.
- `scale`: 1, 1.000 o 1.000.000, únicamente con evidencia de la escala de origen;
  `null` si no está acreditada. No deducirla del tamaño de la empresa.
- `values`: todos los campos permitidos de su estado, con número finito o `null`.
  Una ausencia debe ser explícita; cero, cifra negativa y dato ausente son distintos.

| Estado | Campo propio ← campo de origen |
|---|---|
| Resultados | `revenue` ← `totalRevenue`; `gross_profit` ← `grossProfit`; `operating_income` ← `operatingIncome`; `net_income` ← `netIncome`; `ebitda` ← `ebitda`. |
| Balance | `assets` ← `totalAssets`; `liabilities` ← `totalLiab`; `equity` ← `totalStockholderEquity`; `cash` ← `cash`; `net_debt` ← `netDebt`; `total_debt` ← `shortLongTermDebtTotal`. |
| Caja | `operating_cash_flow` ← `totalCashFromOperatingActivities`; `capex` ← `capitalExpenditures`; `free_cash_flow` ← `freeCashFlow`; `dividends_paid` ← `dividendsPaid`. |

Mapear un campo no prueba equivalencia contable entre emisores. Antes de integrar,
documentar definiciones, signo de capex/dividendos y criterio de deuda. No inferir
FCF automáticamente restando capex sin confirmar esos signos y definiciones.

Si faltan moneda o escala, conservar el dato en cuarentena técnica pero no mostrar
un importe monetario etiquetado como validado. Si cambia la moneda entre ejercicios,
no dibujar una serie comparable sin una política explícita de conversión o separación.
Los datos anuales de todos los bloques no tienen por qué cerrar en la misma fecha.

## 4. Instantánea de ratios

Campos adicionales: `observed_on` (fecha de observación de la instantánea) y
`values`. Cada ratio contiene `value`, `unit` y `period_end`.

- `unit = multiple`: `pe_ttm`, `price_sales_ttm`, `price_book_mrq`, `ev_revenue`,
  `ev_ebitda`.
- `unit = fraction`: `operating_margin_ttm`, `net_margin_ttm`, `roe_ttm`,
  `roa_ttm`, `revenue_growth_yoy`, `earnings_growth_yoy`.
- `period_end = null` si la fuente no identifica el cierre al que se refiere el
  dato. No usar la fecha de actualización como cierre TTM ni copiar el cierre anual.
- La interfaz convierte una fracción a porcentaje una sola vez. Un 0,15 se muestra
  como 15 %, no como 0,15 % ni 1.500 %. El dato fuente se conserva como fracción.
- No recalcular estos ratios usando precios de otra fecha. Diferenciar snapshot,
  TTM, último trimestre y variación interanual en la explicación de cada métrica.

Por ahora no entran capitalización, EV monetario ni BPA agregado: requieren
resolver su moneda específica. No entran previsiones, consenso ni objetivos de precio.

## 5. Cautelas sectoriales y de presentación

El diagnóstico detecta bancos, aseguradoras y otras entidades financieras para
revisión del esquema, NO para recomendar o calificar. Antes de integrar hay que
acordar qué métricas son pertinentes por subtipo y documentar su interpretación.
No imponer a un banco una plantilla industrial porque el proveedor rellene EBITDA
o deuda. Una cifra existente no demuestra comparabilidad entre sectores.

No se incorporan rankings, señales, puntuaciones de atractivo, recomendaciones,
texto editorial o bloques completos del proveedor. La lista positiva del contrato
rechaza campos nuevos por defecto. Los importes no se agregan entre monedas.

## 6. Proceso de incorporación propuesto

1. Resolver las identidades y cruzar catálogo y documentos fuente.
2. Completar fuentes que falten con el responsable de datos, sin claves en web.
3. Registrar fecha de descarga específica y huella del fundamental.
4. Extraer solo campos permitidos; verificar divisa/escala por ejercicio y semántica
   contable; conservar huecos y registrar incidencias sin rellenarlos.
5. Ejecutar el validador estructural y revisar las limitaciones del dato. Verificar
   con una muestra de cuentas del emisor las cifras, escalas y definiciones.
6. Revisar el contrato con el responsable de la base. Decidir esquema físico,
   actualización, revisión de versiones, protección y permisos antes de ejecutarlos.
7. Obtener autorización expresa para tocar base/backend. La aceptación del borrador
   no autoriza por sí sola una carga ni un cambio de permisos.
8. Adaptar la lectura del módulo, repetir pruebas y revisión humana. Resolver
   licencia, validación jurídica/compliance y conformidad profesional aplicables
   antes de publicar. Mantener una retirada reversible de la función sin borrar datos.

Pruebas locales: `npm run test:fundamentales-contrato`. Solo entradas sintéticas;
no consulta ni escribe en Firebase. El validador no se ha integrado en el cargador
existente ni convierte el esquema actual en otro formato.

## 7. Muestra de aceptación local, sin integración

El paso posterior autorizado genera una muestra offline con `normalize.mjs` y
`sample.mjs` dentro de `company-analysis/local/`. Su alcance y resultados figuran
en `docs/MUESTRA_NORMALIZADA_FUNDAMENTALES_20260903.md`: 90 registros de seis
empresas, con incertidumbres explícitas y bloqueo de publicación. No se modifica
el contrato ni se resuelven por suposición sus campos desconocidos.

En esta muestra, `observed_on` significa fecha UTC de **lectura del archivo local**,
no fecha de nueva observación del mercado. El paquete conserva esa advertencia,
la observación previa de catálogo y su huella. No utilizar ese campo por sí solo
para considerar actuales los ratios. Las puertas de integración siguen pendientes.

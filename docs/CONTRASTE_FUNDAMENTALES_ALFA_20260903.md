# Análisis fundamental: contraste con la alfa y siguiente entrega

Fecha: 3 de septiembre de 2026. Consulta válida iniciada a las 00:02:53 UTC
(02:02:53, Madrid). Estado: diagnóstico y contrato local; **sin cambios de base**.

## Conclusión

La copia recuperada funciona, pero no es todavía el módulo conectado al catálogo
vigente. El cruce confirma **52 coincidencias de identidad**, **20 acciones sin
archivo fundamental local** y **1 conflicto de ISIN** dentro de las 73 acciones
de la alfa. No debe habilitarse una conexión automática basándose en el nombre.

Una coincidencia de identidad no significa que la contabilidad esté validada,
que todos los campos existan ni que la publicación esté autorizada.

## 1. Evidencia y alcance

| Control | Resultado |
|---|---|
| Catálogo de la alfa | 698 instrumentos, 73 acciones. |
| Archivos de acciones locales | 54 legibles y con identidad interna coherente. |
| Coincidencia de ISIN, símbolo/mercado y moneda de cotización | 52. |
| Sin archivo local coincidente | 20. Esto no demuestra que el proveedor no tenga esos datos. |
| Conflicto de ISIN | Ferrovial. |
| Archivo local sin candidato en el catálogo | Siemens Gamesa (`SGRE.MC`). |
| Fichas de acciones consultadas | Las 73; ninguna contiene bloques de fundamentales en sus campos principales. |
| Mutaciones de Firebase / publicación | Ninguna. |

Se consultó manifiesto, cuatro trozos de catálogo, 73 fichas y manifiesto final:
79 GET en el diagnóstico válido. El manifiesto permaneció estable; las fichas no
se leyeron en una transacción atómica. No se inspeccionaron todas las colecciones
o subcolecciones: no se afirma que no existan otros datos fuera del contrato leído.

Hubo una primera ejecución descartada al comparar objetos por orden de claves;
se corrigió la comparación y se repitió. Ambas fueron de solo lectura. No se
contactó con el proveedor para descargar fundamentales nuevos.

Evidencia detallada, ignorada por Git y no publicable:

- `output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json`.
- `output/fundamentales-contraste/periodos-2026-09-03T00-08-11-214Z.json`.

## 2. Identidad que debe resolverse

**Ferrovial:** la ficha de la alfa usa `ES0118900010`; el archivo `FER.MC` declara
`NL0015001FS8`. Aunque el nombre y el símbolo coincidan, no se reasigna ni se
fusiona automáticamente. El responsable de datos debe confirmar identificador,
periodos y continuidad del histórico antes de cambiar nada. Este informe no
determina cuál debe sustituir al otro ni solicita migrar posiciones guardadas.

**Siemens Gamesa:** `SGRE.MC` / `ES0143416115` está en la caché, no en el catálogo.
Sus últimos estados locales cierran el 30/09/2022. Se mantiene como archivo de
prueba; no debe incorporarse silenciosamente a la alfa por estar en el disco.

## 3. Veinte fundamentales que faltan en esta caché

| Empresa en catálogo | Símbolo que debe contrastarse |
|---|---|
| Acciona | ANA.MC |
| Acerinox | ACX.MC |
| ACS | ACS.MC |
| adidas | ADS.XETRA |
| Adyen | ADYEN.AS |
| Aena | AENA.MC |
| Airbus | AIR.PA |
| Amadeus | AMS.MC |
| ArcelorMittal | MT.AS |
| BBVA | BBVA.MC |
| Banco Sabadell | SAB.MC |
| Banco Santander | SAN.MC |
| Bankinter | BKT.MC |
| Bayer | BAYN.XETRA |
| BMW | BMW.XETRA |
| BNP Paribas | BNP.PA |
| CaixaBank | CABK.MC |
| Cellnex | CLNX.MC |
| Logista / Cia de Distribucion Integral | LOG.MC |
| Vonovia | VNA.XETRA |

La lista es una necesidad técnica de cobertura, no una selección de inversión.
No se han descargado, insertado ni sustituido sus datos en esta intervención.

## 4. Calidad y fechas: hallazgos de los archivos

- Se revisaron **3.955 registros anuales de estado/ejercicio**, no 3.955 ejercicios
  diferentes de una sola empresa. No se detectaron fechas discordantes entre la
  clave del registro y su fecha interna ni cierres futuros en la proyección.
- **152 registros carecen de fecha de presentación**. No sustituirla por la fecha
  de descarga o actualización. Mantener `null` y explicarlo cuando corresponda.
- **317 registros carecen de moneda en la fila**. Además hay monedas históricas
  distintas de la cabecera global. No basta una moneda única para toda la serie.
- En varias empresas españolas aparecen filas históricas marcadas `ESP`; en Intesa
  Sanpaolo aparecen filas `USD` con cabecera `EUR`. Son datos del archivo que deben
  comprobarse, no autorización para convertirlos ni prueba de su corrección.
- Pernod Ricard carece de moneda en la cabecera del balance y en su última fila;
  otras filas antiguas sí declaran EUR. No permiten inferir la moneda del último año.
- Prosus y TotalEnergies cotizan en EUR y sus estados declaran USD.
- Hay **6 registros completamente vacíos** entre los campos revisados, repartidos
  en Acciona Energía, Colonial, Kering, Merlin y Telefónica. No convertirlos en años
  con cifras cero ni calificarlos como datos completos.
- En el último estado de Solaria falta `dividendsPaid`. En TSK faltan EBITDA,
  deuda total en el campo revisado y dividendos pagados. Son ausencias, no ceros.
- El nombre de TSK contiene posibles errores de codificación; no se ha reinterpretado.
- Nueve compañías del inventario local activan la revisión de plantilla financiera:
  Deutsche Bank, Deutsche Börse, ING, Intesa Sanpaolo, Mapfre, Munich Re, Nordea,
  Unicaja y UniCredit. No se debe asumir igual interpretación de métricas para
  bancos, aseguradoras, bolsas y compañías industriales.

La revisión acredita estructura y coherencia de la fuente local, no auditoría de
cuentas ni exactitud de todos los importes. Queda pendiente contrastar una muestra
con documentación del emisor y confirmar unidades, signos y definiciones.

## 5. Trabajo preparado, no desplegado

- Herramienta de cruce reproducible: `company-analysis/local/audit-alfa.mjs`.
  Requiere `--read-alfa` explícito; solo GET a rutas del proyecto propio, sin claves
  ni SDK administrativo. Un error de lectura no se interpreta como dato ausente.
- Revisión de metadatos históricos sin red: `company-analysis/local/audit-cache.mjs`.
- Reglas puras de cruce y revisión: `company-analysis/local/coverage.mjs`.
- Borrador y validador de contrato: `company-analysis/local/contract.mjs` y
  `docs/CONTRATO_FUNDAMENTALES_PROPUESTO_20260903.md`.
- **10 pruebas sintéticas** de identidad, ambigüedad, monedas por ejercicio,
  nulos, campos prohibidos, fechas, escalas y unidades de ratios.

La vista local continúa separada y no usa estos diagnósticos para alterar su lista.
No se ha modificado el importador actual ni su esquema `nuvia-alfa-asset.v1`.

## 6. Orden de actuación recomendado

1. Revisar este contraste con el responsable de la base, particularmente Ferrovial.
2. Completar los 20 archivos que falten cuando se autorice esa descarga/proceso;
   verificar que cada fuente corresponda al identificador y mercado esperado.
3. Acordar el contrato propuesto, moneda por ejercicio, escala, fechas, política de
   revisiones y plantillas sectoriales. Corregir huecos solo con evidencia.
4. Preparar localmente la normalización y una muestra de aceptación. No copiar
   todos los bloques del proveedor ni dar los ratios históricos como actuales.
5. Con autorización expresa, incorporar los datos a la base propia y adaptar el
   lector del módulo. No reactivar la conexión profesional anterior.
6. Superar las pruebas funcionales, documentar licencia y validación regulatoria y
   profesional aplicables; solo entonces integrar y publicar la ruta de empresas.

**Punto de parada de esta entrega:** contraste terminado y contrato propuesto con
pruebas. No carga de datos, no cambios de Firebase, no despliegue ni commit/push.

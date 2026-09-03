# Paso 1 · Logista y Pernod Ricard

> **Decisión posterior del fundador, 03-09-2026:** «de momento ya lo arreglaré yo».
> Logista y Pernod quedan aparcadas por decisión suya. No enviar la consulta,
> no modificar sus datos y no mantenerlas como bloqueo de la secuencia alfa.
> El expediente queda disponible como evidencia técnica, sin actuación externa.

03-09-2026. Orden: «Sigue uno por uno». Diagnóstico y expediente local;
no es una orden de carga, publicación o comunicación externa.

## Revisión previa y alcance

Se aplica la revisión de 18 puntos de
`APLICACION_ACLARACIONES_FUNDAMENTALES_20260903.md`: necesidad informativa,
emisores ya presentes, sin recomendaciones, estimaciones, personas, bloqueos,
modificaciones de datos ni reclasificación regulatoria. La ampliación de diagnóstico
consulta exclusivamente partidas históricas para reconstruir definiciones de
beneficio bruto, EBITDA, deuda y flujo libre. Se guardan solo campos declarados
y cifras, no respuestas completas ni credenciales. No se importa en la web.

Las fuentes originales ya contrastadas se conservan con sus huellas. Se revisan
las tablas relevantes y la documentación pública del proveedor; una igualdad
aritmética no se considera prueba suficiente de equivalencia contable.

## Estado de la nueva consulta

Lectura a las 17:06 UTC: dos solicitudes filtradas a EODHD y cuatro GET a la base,
sin escrituras ni errores. Las 12 filas recientes no muestran cambios en los
campos comparados. Pernod mantiene resultados/flujos hasta 2025 y balance hasta
2026 en el endpoint consultado. Persisten las tres filas sin moneda.

Evidencia: `output/metadatos-fuentes/proveedor-2026-09-03T17-06-04-658Z.json`.

## Siguiente contraste local

Reconstruir las partidas del proveedor con una consulta acotada a LOG.MC
FY2024/FY2025 y RI.PA FY2026, sin cambiar el contrato o los datos de la web.
Completar después el expediente con conclusiones comprobadas y cuestiones
precisas que solo el proveedor puede responder.

## Resultado del puente de partidas

Dos consultas filtradas, cero lecturas/escrituras de base y cero datos personales.
Se contrastan únicamente cinco filas históricas. Resultado completo:
`output/metadatos-fuentes/puente-2026-09-03T17-08-42-950Z.json`.

### Logista

- El `grossProfit` del proveedor es internamente exacto: ingresos menos
  `costOfRevenue`. En FY2025, su coste de ingresos equivale a compras más costes
  de personal, transporte y oficinas provinciales de la red logística. Por eso
  da 906,898 millones y no los 1.808,711 millones que Logista titula «Gross profit»
  inmediatamente después de compras. En FY2024 se reproduce la misma convención.
  Se cierra como **diferencia de definición**, no error aritmético.
- El EBITDA también es internamente exacto: `ebit` más
  `depreciationAndAmortization`; 311,928 + 91,046 = 402,974 millones en FY2025.
  La tabla de Logista muestra 168,043 millones de depreciación/amortización total.
  Falta que el proveedor identifique por qué utiliza solo 91,046 millones y qué
  ajustes forman el `ebit` de 311,928 millones. La fórmula genérica no concilia
  por sí sola las partidas del emisor.
- El FCF es internamente exacto en ambos años: flujo operativo menos capex.
  El problema queda reducido al perímetro variable de `capitalExpenditures`:
  FY2024 coincide con inversión material más intangible; FY2025, solo con la
  material. La documentación pública define capex de forma general, pero no
  explica este cambio de composición.

### Pernod Ricard

- La caja de EODHD, 1.993 millones, coincide con la línea de caja y equivalentes
  de la conciliación de deuda del emisor. La tabla de activos presenta 1.999
  millones porque añade derivados corrientes. Se cierra como **diferencia de
  perímetro**, no como error.
- La deuda neta de EODHD, 10.685 millones, es aritméticamente exacta dentro de
  su ficha: deuda total 12.678 menos caja 1.993. Pernod publica 10.662 millones
  tras coberturas e incluyendo 449 millones de arrendamientos. Queda pendiente
  explicar la diferencia neta de 23 millones y la composición exacta de la deuda
  total de EODHD. No se reemplaza una definición por la otra.
- La cobertura FY2026 de resultados y flujos sigue ausente en la respuesta
  consultada; el proveedor indica públicamente que no todas las compañías tienen
  todos los campos, pero eso no explica este caso concreto.

Fuentes revisadas: cuentas consolidadas FY2025 de Logista, comunicación FY2026
de Pernod y glosario público de EODHD. Las copias PDF locales conservan las huellas
ya registradas; la revisión no introduce nombres personales en la evidencia nueva.

## Cuestiones finales para soporte

1. Logista FY2024/FY2025: origen de `ebit` y componentes incluidos en
   `depreciationAndAmortization`, especialmente el salto entre 165,467/168,043
   millones de depreciación reconciliada/flujo y 91,794/91,046 millones usados
   en EBITDA.
2. Logista: criterio exacto para incluir intangibles en `capitalExpenditures`
   FY2024 y excluirlos en FY2025.
3. Pernod FY2026: componentes de `shortLongTermDebtTotal=12.678` millones y
   explicación de los 23 millones frente a la deuda neta publicada, incluyendo
   coberturas, derivados y arrendamientos.
4. Pernod: fecha prevista o causa de ausencia de resultados y flujos FY2026 en
   el endpoint original; moneda ausente en la fila de balance FY2026.
5. Logista: moneda ausente en resultados y flujos FY2025, y significado de
   `filing_date` igual al cierre en esas filas.

No hace falta preguntar ya por la definición genérica de beneficio bruto, FCF,
caja o deuda neta: el glosario y la aritmética la explican. Sí hacen falta los
componentes y criterios específicos anteriores.

## Control y estado

Cuatro pruebas nuevas cubren identidad, filtrado positivo, periodos, nulos,
ceros, pérdidas y ausencia. No se guardan bloques de directivos, estimaciones
ni respuestas completas. El diagnóstico no tiene modo de carga. Paso 1 resuelto
hasta el límite de las fuentes disponibles; queda la aclaración externa acotada.

Consulta lista para enviar, sin datos personales completados:
`CONSULTA_EODHD_LOGISTA_PERNOD_20260903.md`. No se ha enviado ni firmado en nombre
del fundador. Una eventual respuesta se contrastará antes de proponer cualquier
cambio en la base.

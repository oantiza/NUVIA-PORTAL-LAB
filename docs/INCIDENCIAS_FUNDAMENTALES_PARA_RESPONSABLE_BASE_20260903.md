# Fundamentales NUVIA: revisión para el responsable de la base

> **Cierre local posterior:** [saldo consolidado](CIERRE_PENDIENTES_CONSOLIDADO_20260903.md).
> El nombre de TSK ya se corrige en presentación y búsqueda, con grafía contrastada
> en el aviso legal del emisor, sin editar la base ni cambiar identidad o cifras.
> Sus huecos contables no se dan por resueltos. El detalle institucional consultado
> devuelve NA para las 73 identidades; la cobertura agregada se conserva.

> **Actualización 03-09-2026, 10:36 UTC:** las 73 fichas están disponibles y
> las identidades Aena/Ferrovial resueltas. F01, F02 y F06 ya no describen
> incidencias abiertas de disponibilidad. Las fechas de descarga están registradas
> en la base, no reconstruidas en los respaldos antiguos. La [auditoría actual
> de metadatos](AUDITORIA_METADATOS_FUNDAMENTALES_20260903.md) sustituye los recuentos
> históricos para F03/F05/F07: tres filas recientes sin moneda y escala pendiente
> de acreditación y modelado. Las instrucciones posteriores son antecedentes,
> no autorizaciones de carga ni bloqueos vigentes. Cero escrituras en esta revisión.

## Actualización operativa tras la recuperación de la alfa

El diagnóstico que sigue se conserva como antecedente. **La ruta de empresas ya
está activa en la versión local**, con una instantánea saneada de 73 entradas:
52 con cifras, 20 sin archivo disponible y Ferrovial pendiente de resolver su
identidad. Las frases posteriores sobre una ruta pública bloqueada describen
el estado anterior, no una orden vigente. No se ha publicado esta recuperación.

La referencia vigente es el marco v1.2 y las órdenes del fundador para la alfa:
no introducir bloqueos regulatorios nuevos sin consulta; no guardar datos
personales en la base sin su autorización; excluir PER estimado, BPA previsto
y dividendos estimados. La interfaz conserva las cifras originales con avisos
de metadatos ausentes, sin atribuirles una escala o moneda no acreditadas.

F01–F08 siguen siendo solicitudes de evidencia, no instrucciones de modificación
de Firebase. Una nueva lectura el 03-09-2026 a las 06:55:53 UTC confirma los
698 instrumentos del catálogo; no constituye un inventario de todas las posibles
colecciones de fundamentales. Véanse los resultados y límites actuales en
[el acta de cierre local](CIERRE_LOCAL_ALFA_20260903.md).

**Actualización posterior del fundador (03-09-2026):** la validación jurídica externa
queda fuera del alcance de la alfa y no bloquea su avance; [marco v1.1 §0](MARCO_REGULATORIO_OBLIGATORIO.md).
Las solicitudes de este informe se centran en contrato, identidad, unidades, fechas
y cobertura. Las referencias anteriores a dictamen jurídico externo quedan
sustituidas por esta orden. No se autoriza modificar la base ni publicar por esta nota.

Fecha: 3 de septiembre de 2026.
Destinatario previsto: responsable de la base propia / trabajo con Fable 5.1.
Estado: documento preparado para revisión; **no enviado y no ejecutado como orden**.

## 1. Situación y objetivo de la respuesta

Se ha recuperado una vista local del módulo de empresas, elaborado un contrato
propuesto y generado una muestra normalizada offline. La alfa no se ha conectado
a esta muestra y su ruta pública de empresas continúa bloqueada.

Se necesita confirmar qué datos pueden leerse, con qué contrato y con qué
garantías. Este documento solicita aclaraciones y evidencias: **no autoriza** a
modificar colecciones, reglas, índices, históricos, identificadores, backend o
Hosting. Tampoco solicita credenciales, claves privadas ni una exportación de
datos personales o de la actividad bancaria.

Referencias del repositorio oficial:

- `docs/CONTRASTE_FUNDAMENTALES_ALFA_20260903.md`.
- `docs/CONTRATO_FUNDAMENTALES_PROPUESTO_20260903.md`.
- `docs/MUESTRA_NORMALIZADA_FUNDAMENTALES_20260903.md`.

## 2. Evidencia comprobada y lo que no demuestra

La consulta archivada del 03/09/2026 a las 00:02:53 UTC recoge 698 instrumentos,
73 de ellos acciones. Cruzados con la caché local: 52 coincidencias de identidad,
20 acciones sin archivo local y un conflicto de ISIN, Ferrovial. Hay además un
archivo de Siemens Gamesa fuera del catálogo observado.

Las 73 fichas leídas no incluían fundamentales en sus campos principales.
**No se ha inventariado toda la base ni se afirma que los fundamentales no existan
en otras colecciones o en desarrollos posteriores.** En esta entrega no hubo una
nueva consulta a Firebase ni al proveedor: se usa la evidencia archivada.

La muestra de seis empresas produce 90 registros válidos en su estructura,
pero no listos para publicación: 84 anuales sin escala acreditada, 90 sin fecha
de descarga específica, un balance sin moneda y 14 valores numéricos ausentes.
El detalle por campo está en el informe de muestra y su revisión local.

## 3. Incidencias y respuesta necesaria

### F01 · Contrato de lectura realmente disponible

Confirmar si la base final dispone ya de fundamentales separados de catálogo y
precios. Si existen, aportar una descripción de su contrato, versión, claves de
identidad, estados de disponibilidad y un ejemplo minimizado sin credenciales.
Identificar quién actualiza los datos y cómo se notifica una corrección.

Aceptación: poder relacionar una ficha con estados y ratios mediante identidad
inequívoca, sin descargar décadas de contabilidad al buscar una empresa y sin
recurrir al backend profesional anterior. Si no existen, declararlo; no crear
colecciones como consecuencia automática de este informe.

### F02 · Ferrovial: conflicto de identidad

- Catálogo/ficha observada: `ES0118900010`, símbolo `FER.MC`.
- Archivo local: `NL0015001FS8`, mismo símbolo.

Aportar evidencia del identificador aplicable, fechas de vigencia y tratamiento
de continuidad histórica. Separar la resolución de identidad de cualquier futura
migración de carteras o series. No basta con que coincidan nombre y ticker.

Aceptación: decisión de identidad documentada, con periodos y procedencia claros,
sin asignar un fundamental al ISIN distinto ni fusionar históricos por defecto.
El control local ya rechaza el caso; no se ha alterado ninguna de las identidades.

### F03 · Escalas y definiciones monetarias

La muestra no aporta evidencia suficiente para afirmar si todos los importes
son unidades, miles o millones. No completar `scale: 1` por convención o por el
tamaño aparente de las cifras.

Aportar documentación del origen y contraste con una muestra de cuentas del
emisor. Especificar alcance por estado/campo y tratamiento de cambios históricos.
Confirmar definiciones de deuda, efectivo, EBITDA, capex y dividendos, incluidos
sus signos. No calcular FCF para sustituir un campo ausente sin definición revisada.

Aceptación: evidencia que permita etiquetar importe, moneda y escala de cada
registro. Los 84 registros monetarios de esta muestra siguen en revisión mientras
su escala permanezca desconocida.

### F04 · Fechas de descarga, cierre y actualización

Confirmar si existe registro de descarga específico de cada fundamental y su
vinculación con el archivo o versión concreta. El `fetched_at` de un refresco de
precios no basta. La fecha del proveedor tampoco demuestra descarga reciente.

Si no hay evidencia recuperable, mantener `downloaded_at: null` en el archivo
histórico y acordar cómo registrar este dato en futuras cargas autorizadas.
No reconstruirlo con fecha de modificación del archivo ni fechar el pasado como hoy.

Aceptación: cuatro conceptos separados —cierre, presentación, actualización del
proveedor y descarga—; observación local de ratios identificada como tal. Si se
desconoce su periodo TTM/trimestral, conservarlo nulo. Definir después política
de vigencia y refresco; no presentar una instantánea archivada como cotización actual.

### F05 · Pernod Ricard: moneda ausente y cierres distintos

La fila de balance al 30/06/2026 no declara moneda. Los balances anteriores
declaran EUR, pero no prueban la moneda de esa fila. Además, resultados y caja
terminan al 30/06/2025 mientras el balance llega a 2026.

Aceptación: evidencia específica para la moneda del balance afectado, o estado
explícito de moneda desconocida. Mantener por separado las fechas de los tres
estados. No comparar ni combinar sus últimas filas como si fueran del mismo año.

### F06 · Veinte acciones sin archivo en esta caché

Símbolos observados:

```text
ANA.MC  ACX.MC  ACS.MC  ADS.XETRA  ADYEN.AS
AENA.MC AIR.PA  AMS.MC  MT.AS      BBVA.MC
SAB.MC  SAN.MC  BKT.MC  BAYN.XETRA BMW.XETRA
BNP.PA  CABK.MC CLNX.MC LOG.MC     VNA.XETRA
```

Confirmar cuáles existen ya en la base final o en archivos autorizados. Si falta
información, describirla como ausente; esto no demuestra falta de cobertura del
proveedor. Una nueva descarga o incorporación se decidirá aparte.

Aceptación: inventario de disponibilidad por ISIN y símbolo/mercado, sin completar
el catálogo con cifras de otra cotización o un emisor de nombre parecido.

### F07 · Huecos de TSK y Solaria; integridad histórica

- TSK: solo tres ejercicios por estado (2023–2025); nueve fechas de presentación
  ausentes y nueve valores numéricos ausentes en la muestra. Afectan a EBITDA,
  deuda total, deuda neta de 2023 y dividendos pagados de 2023/2025.
- Solaria: dividendos pagados ausentes en los cinco ejercicios 2021–2025.
- TSK: nombre con posible error de codificación. Confirmar texto correcto desde
  una fuente acreditada, sin sustituir la identidad de la ficha.
- La auditoría histórica más amplia detectó filas completamente vacías y monedas
  `ESP`, además de discrepancias USD/EUR. Esos años antiguos no forman parte de
  los cinco ejercicios seleccionados en la presente muestra.

Aceptación: conservar nulos donde no exista evidencia y no confundirlos con cero.
Las monedas históricas no se convierten ni se heredan de la cabecera. Toda
rectificación deberá preservar procedencia y versión, sin sobrescritura silenciosa.

### F08 · Entidades financieras y datos fuera del catálogo

Intesa se incluye como caso bancario de revisión, no como plantilla industrial
validada. Acordar pertinencia e interpretación de campos por subtipo de entidad;
la existencia de un número del proveedor no acredita comparabilidad sectorial.

Siemens Gamesa permanece fuera de la muestra normalizada porque no figura en el
catálogo observado. No reintroducirla por disponer de un archivo antiguo. Si se
desea un archivo histórico navegable, será una función separada que requiere decisión.

Aceptación: separación explícita de catálogo vigente y archivo; reglas sectoriales
descriptivas, sin puntuaciones de atractivo, señales o veredictos de inversión.

## 4. Formato útil para devolver la revisión

Para cada incidencia F01–F08:

1. Estado: confirmado, pendiente de evidencia o fuera del alcance actual.
2. Evidencia: documento o archivo y versión/fecha, sin claves ni datos personales.
3. Identidades, ejercicios y campos afectados.
4. Tratamiento propuesto y efectos sobre lectura/históricos; no ejecutarlo todavía.
5. Incertidumbre restante y siguiente responsable.

Si el contrato final difiere del borrador, añadir la correspondencia de campos,
unidades y estados de ausencia. No adaptar la base al borrador únicamente porque
exista un validador: primero contrastar ambos contratos y documentar la decisión.

## 5. Orden de continuación

1. Recibir y revisar las aclaraciones, especialmente contrato, identidad, unidades
   y fechas. Prioridad técnica, no prioridad de inversión.
2. Comprobar localmente ejemplos autorizados y ejecutar otra muestra con trazabilidad.
3. Acordar los campos que pueden mostrarse y los que deben permanecer ausentes o
   bloqueados. Cobertura parcial no se oculta ni se completa por inferencia.
4. Obtener autorización expresa si es necesario tocar base o backend. Diseñar
   entonces lectura, refresco y pruebas sin recuperar conexiones anteriores.
5. Antes de publicar, revisar fuente/licencia, presentación, privacidad y puertas
   jurídicas o de compliance y conformidad profesional que resulten aplicables.

La propuesta mantiene el módulo en ÁMBAR. Un informe técnico favorable, una
prueba que pasa o la recepción de este documento no equivalen a autorización
regulatoria, profesional, de tratamiento de datos o de despliegue.

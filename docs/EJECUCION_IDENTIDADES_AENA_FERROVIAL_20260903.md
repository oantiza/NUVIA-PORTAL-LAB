# Aena y Ferrovial · corrección autorizada y carga completada

Fecha: 03-09-2026. Base propia `nuvia-family-wealth`, Firestore `(default)`.
Estado: **datos cargados y verificados; integración local, no publicada**.

## 1. Autorización y alcance

El fundador respondió «sí» a corregir las referencias de ambas empresas y cargar
sus fundamentales, conservando históricos y registros anteriores, sin borrar
nada ni publicar todavía. Se aplica el [plan revisado](PLAN_IDENTIDADES_AENA_FERROVIAL_20260903.md)
y su prueba de 18 preguntas. No se modifica el marco, su clasificación ni las
órdenes permanentes: sin nuevos bloqueos regulatorios unilaterales, sin datos
personales y sin PER estimado, BPA previsto ni dividendos estimados.

La ejecución remota terminó el **03-09-2026 a las 09:29:41 UTC**:

- **16 documentos creados:** dos activos actuales, doce series anuales y dos
  documentos `fundamentals/current`.
- **Un documento actualizado:** `catalog_manifest/public`, exclusivamente para
  registrar los alias de identidad y renovar `updated_at`.
- **Cero borrados.** Las dos fichas antiguas, sus doce series y los cuatro trozos
  de catálogo mantienen exactamente sus campos y versiones: 18 originales
  verificados sin modificación después de la operación.
- Ningún cambio de reglas, índices, permisos, Authentication, Hosting o backend.
  No se consultan ni almacenan personas o carteras de visitantes.

## 2. Identidades y precios

| Empresa | Referencia anterior conservada | Referencia actual | Continuidad documentada |
|---|---|---|---|
| Aena · AENA.MC | ES0105046009 | ES0105046017 | Desdoblamiento 1 por 10, 19-06-2025 |
| Ferrovial · FER.MC | ES0118900010 | NL0015001FS8 | Fusión y canje 1 por 1, 16-06-2023 |

Fuentes documentales: [Bolsa de Madrid, Aena](https://www.bolsasymercados.es/dam/descargas/regulacion/renta-variable/bolsa-madrid/notas/2025/split-aena-aviso.pdf)
y [ICE, Ferrovial](https://www.ice.com/publicdocs/liffe/corporate_actions/2023/CA-2023-199-Lo.pdf).
La identidad recibida de EODHD coincide con los identificadores actuales y EUR.
El nombre «Ferrovial S.A.» se conserva como denominación de la fuente, junto con
una nota de sucesión. No se afirma que toda la historia corresponda al mismo
emisor jurídico ni se reescriben países, denominaciones o cifras históricas.

Se han copiado **1.450 precios por empresa**, del 04-01-2021 al 02-09-2026,
distribuidos en seis documentos anuales, 2021–2026. Los **2.900 puntos** coinciden
íntegramente, fecha y valor, entre las rutas antiguas y actuales. El contraste
previo con EODHD también coincidió. No se ha vuelto a aplicar el split de Aena
ni se han recalculado precios, BPA, acciones o dividendos.

## 3. Fundamentales disponibles

La lectura anónima posterior, con el mismo cliente del módulo, confirma **73 de
73 empresas con ficha válida**, sin ausencias ni errores de identidad o contrato.
Antes de esta ejecución eran 71. Son datos descargados y cargados, no una ingesta
automática en segundo plano.

| Empresa incorporada | Resultados | Balance | Flujos |
|---|---|---|---|
| Aena | 15 ejercicios, 2011–2025 | 15, 2011–2025 | 15, 2011–2025 |
| Ferrovial | 26 ejercicios, 2000–2025 | 26, 2000–2025 | 22, 2004–2025 |

Los recuentos son filas anuales disponibles, no garantía de cada celda completa
ni de comparabilidad entre ejercicios. Se mantienen nulos, ceros y negativos.
No se añade moneda o escala donde la fuente no la declara. **72 de las 73 empresas**
tienen al menos cinco filas anuales en los tres estados. TSK conserva tres
ejercicios: esta corrección no inventa el histórico que falta. La igualdad de
precios ajustados no acredita que el BPA o los dividendos históricos estén
ajustados homogéneamente por el split; no se aplica un ajuste adicional a esas cifras.

## 4. Compatibilidad y transición de publicación

**El catálogo bruto conserva deliberadamente los identificadores antiguos.**
Tiene 698 instrumentos, no 700. Las nuevas fichas no son nuevas empresas añadidas
al universo: son destinos actuales compatibles con los registros conservados.
Así, la web que ya está publicada puede seguir leyendo las rutas antiguas.

La copia local preparada ahora:

- Reconoce búsquedas por ISIN antiguo o actual y muestra una sola empresa.
- Consulta identidad y fundamentales en los destinos actuales, con validación.
- Conserva las claves, pesos e importes de las posiciones antiguas; no reescribe
  carteras guardadas ni combina posiciones automáticamente.
- Detecta como repetida la misma empresa al intentar añadir su otro código.
- Resuelve fichas y precios al destino actual, pero devuelve la clave que usa
  cada cartera. La comprobación real de la ventana vigente produjo 765 fechas
  alineadas por empresa, con series idénticas para ambos códigos.
- Informa de la sucesión en pantalla y enlaza su fuente documental.
- Mantiene el catálogo bruto en la caché compartida para no introducir códigos
  nuevos en una versión anterior. El manifiesto renovado invalida las cachés
  de datos; no se toca el almacenamiento de carteras.
- Normaliza solo las dos identidades autorizadas en futuras cargas preparadas
  desde CSV, sin reescribir el fichero ni sus inclusiones. Las proyecciones
  conservan las notas y los alias. No se ha ejecutado una recarga del universo.

El índice local de búsqueda sigue conteniendo 73 empresas; las altas futuras no
se sincronizan solas. Se descarta cualquier respaldo local asociado a la identidad
antigua de estas dos empresas: no se le cambia el ISIN para hacerlo pasar por nuevo.
Las demás fichas conservan el mecanismo de respaldo explícitamente identificado.

## 5. Seguridad de la ejecución y evidencias

El ejecutor prepara un respaldo local y revalida las versiones de los originales
dentro de una transacción. Los 16 destinos exigen inexistencia. El manifiesto
exige su versión anterior; las 17 escrituras se confirman conjuntamente y se
releen después. Ante un resultado incierto no hay reintento automático de carga.
No se ha eliminado ni se eliminará un registro como reversión automática.

Evidencias locales, excluidas de Git y de la web, bajo `output/identidades-pendientes/`:

- `plan-2026-09-03T09-27-59-495Z.json`: plan y respaldo de los originales.
- `resultado-2026-09-03T09-29-42-825Z.json`: confirmación, 16 creaciones, una
  actualización, cero borrados y 18 originales sin cambios.
- `lectura-2026-09-03T09-33-27-603Z.json`: 73 fichas válidas, igualdad íntegra de
  precios, búsqueda y compatibilidad antigua/actual. Esta comprobación no escribe.

La comprobación puede repetirse con `node scripts/check-company-identities-live.mjs`.
Ese diagnóstico solo permite GET y `batchGet`, no usa credenciales y no accede a
cuentas. El ejecutor de migración no debe volver a aplicarse: los destinos ya existen.

## 6. Verificación de software

- **32 pruebas de fundamentales superadas**, incluidas cinco nuevas de migración,
  identidad, carteras antiguas y futuras cargas. Sin estimaciones ni datos personales.
- Las baterías de datos, constructor, fiabilidad de caché y proyección de mercado
  también han superado la ejecución de validación.
- **Compilación completa superada** (`npm run build`, salida 0): validación,
  auditoría de 30 vistas a 1440 px y comprobaciones sobre `dist/`. Sin fallos de
  contraste, tipografía, estructura, superficies, desbordes o fugas en la auditoría.
- Módulo comprobado a **1440, 1280, 1024, 820 y 768 px**, incluidos identidad,
  búsqueda por ISIN anterior/actual, procedencia, estados de ausencia y error,
  reintento, respaldo y cancelación. Cero desbordes o errores JavaScript. La API
  de estas pruebas está simulada y no comunica cifras sintéticas a la base real.
- Revisión manual contra la base real en el navegador, a 909 px: Ferrovial muestra
  el ISIN actual y su nota de sucesión; Aena se encuentra usando su ISIN antiguo,
  aparece una sola coincidencia y carga el ISIN actual. Procedencia real visible,
  cuatro tablas de Aena (cinco ejercicios por estado y veinte periodos de BPA),
  sin desborde horizontal. Capturas inspeccionadas visualmente.
- `git diff --check` superado. No se ha retirado el bloqueo de Git preexistente
  ni se han descartado cambios de otras actuaciones.

## 7. Qué queda fuera de esta entrega

No se han hecho commits, push, merge ni despliegues. La activación del catálogo
con los códigos actuales se coordinará con una **publicación compatible autorizada**;
no se adelantará a ella ni eliminará las referencias históricas.

No cambia el periodo de cálculo de cartera (tres años), la cobertura de otros
instrumentos, las composiciones de los dos ETF ausentes, ni la revisión editorial.
El vídeo sigue reservado para el final. Ninguna limitación se presenta como un
nuevo bloqueo regulatorio de la alfa.

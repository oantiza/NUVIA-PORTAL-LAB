# Fundamentales · paridad complementaria de dividendos y accionariado

Fecha: 03-09-2026. Orden de continuación: «sigue».
Estado: contraste completado. **Actualización posterior:** el fundador autorizó
la consulta y carga selectiva de fechas, ya ejecutada en 73 documentos separados.
Véase [resultado y cobertura real](CARGA_FECHAS_DIVIDENDOS_20260903.md).
La [integración visual local posterior](INTEGRACION_FECHAS_DIVIDENDOS_20260903.md)
ya está completada y verificada. Sin publicación.
Las referencias a permiso pendiente que siguen documentan el estado del diagnóstico
anterior y quedan sustituidas por dicha autorización solo en cuanto a las fechas.

## Resultado ejecutivo

La ficha activa conserva el dividendo por acción TTM, rentabilidad por dividendo,
pay-out, acciones en circulación y porcentajes agregados de institucionales e
insiders. Las fechas de dividendo/exdividendo y el listado nominal anterior no
forman parte del contrato servido al módulo.

No puede afirmarse que se hayan perdido datos disponibles de pago o de instituciones:
**los 53 archivos locales coincidentes no contienen fechas de pago ni filas de
instituciones**. En cambio, 52 sí contienen una fecha de exdividendo. La ausencia
en esta caché no demuestra falta de cobertura actual del proveedor.

No se traslada automáticamente esa caché a la ficha actual: solo 18 de esos
archivos tienen la misma huella de respuesta que el fundamental remoto. Los otros
35 son respuestas distintas, aunque la identidad coincida. Veinte empresas no
tienen archivo local en esta carpeta.

## Evidencia comprobada

Lectura iniciada el **03-09-2026 a las 10:59:35 UTC**:

| Comprobación | Resultado |
|---|---:|
| Empresas del índice vigente | 73 |
| Fundamentales propios disponibles y válidos | 73 |
| Consultas GET a ficha y fundamentales | 146 |
| Fichas activas con bloque de fechas o lista nominal | 0 |
| Archivos locales con identidad coincidente | 53 |
| Empresas sin archivo local | 20 |
| Archivos con huella idéntica a la respuesta usada en la base | 18 |
| Fechas de pago declaradas en los archivos | 0 |
| Fechas de exdividendo declaradas | 52 |
| Fechas exdividendo pasadas o del día de la consulta | 44 |
| Fechas exdividendo posteriores al día de la consulta | 8 |
| Archivo coincidente sin exdividendo | 1: TSK |
| Filas institucionales en los archivos coincidentes | 0 |
| Solicitudes nuevas al proveedor / escrituras remotas | 0 / 0 |

Las ocho fechas posteriores aparecen en ENI.XETRA, FDR.MC, ITX.MC, MC.PA,
PRX.AS, TTE.PA, UNI.MC y DG.PA. No se han contrastado con anuncios corporativos
ni se presentan como calendario confirmado o pago garantizado.

La comparación con la base está limitada al contrato de las fichas consumidas
por el módulo. **No es un inventario de todas las colecciones de la base**.
No se ha deducido ausencia de eventos en ubicaciones ajenas a este lector.

Reproducción: `node scripts/check-company-complementary.mjs`.
Evidencia local: `output/paridad-complementaria/lectura-2026-09-03T10-59-35-650Z.json`.
Repetición a las **11:01:17 UTC**, con los mismos resultados y cero contenedores
institucionales ilegibles: `output/paridad-complementaria/lectura-2026-09-03T11-01-17-889Z.json`.
Cada ejecución realizó 146 GET; ninguna escribió en la base.
Los informes contienen recuentos, fechas e identidades empresariales; no copian
nombres de tenedores, contactos, ejecutivos ni transacciones personales.

## Qué mostraba el componente anterior

Referencia: `company-analysis/src/views/tabs/FundamentalTab.jsx`, conservada dentro
del repositorio oficial; no se ha consultado ni modificado el programa externo.

| Campo anterior | Situación / tratamiento propuesto |
|---|---|
| `DividendDate` bajo «Próximo pago» | El rótulo supone algo que el dato aislado no acredita. Usar «Fecha de pago declarada por el proveedor», con fecha de consulta y ausencia explícita. |
| `ExDividendDate` | Recuperable como fecha declarada, no como importe estimado ni señal operativa. |
| `ForwardAnnualDividendRate` y `ForwardAnnualDividendYield` | Excluidos por orden del fundador; no son trabajo pendiente de recuperación. |
| `Holders.Institutions` | La tabla antigua toma los primeros ocho elementos. No ordena ni acredita que sean los ocho mayores. |
| `totalShares` | Porcentaje de acciones, no número absoluto; no multiplicar de nuevo por cien. |
| `currentShares` | Número de acciones; no confundirlo con `totalShares`. |
| `date` de la posición institucional | Debe acompañar a cada fila; la tabla anterior no la mostraba. |

La [documentación de EODHD](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds)
distingue las fechas de pago y exdividendo de los campos de dividendo futuro, y
define `totalShares` como porcentaje y `currentShares` como número de acciones.
También contempla la fecha propia de cada posición institucional. Que un campo
esté documentado no demuestra que esté poblado para las 73 empresas.

## Propuesta de recuperación, todavía no ejecutada

### Primero: fechas, sin estimaciones ni nombres

1. Comprobar en solo lectura si ya existe un contrato de eventos aprovechable
   para estas identidades. No crear un duplicado de información sin esa comprobación.
2. Si no existe, consultar selectivamente identidad y las dos fechas a EODHD para
   las 73 empresas. Mantener correspondencia exacta entre ISIN, símbolo y mercado;
   sin descargar listas de personas, opiniones o bloques completos innecesarios.
3. Separar la carga de fechas del fundamental contable para no sobrescribir
   históricos ni fingir que toda la ficha se ha actualizado.
4. Destino propuesto: hasta **73 documentos nuevos**
   `assets/{ISIN}/fundamentals/dividends`, con un esquema propio versionado.
   Contenido limitado a ISIN, símbolo, fecha de pago, fecha de exdividendo,
   fuente, fecha real de consulta/carga, huella y estado de disponibilidad.
   Si existe alguno, no sobrescribirlo: revisar su procedencia y consultar el alcance.
5. Validar las fechas de calendario. Nulo significa «no informado», no «no paga
   dividendo». Una fecha posterior a la consulta se etiqueta como tal, sin afirmar
   que su anuncio se ha verificado ni garantizar el pago. No se añaden importes futuros.
6. Integrar lectura diferida del complemento al consultar la empresa; un error
   de ese complemento no debe hacer desaparecer sus fundamentales contables.
   Conservar la procedencia separada y el comportamiento del respaldo existente.
7. Comprobar identidad, nulos, fechas pasadas/posteriores, respuesta tardía y
   errores; revisar escritorio/tablet e impresión. Publicación por orden separada.

**Permiso pendiente:** consulta/carga selectiva de estas fechas y creación del
complemento cuando no exista un contrato previo. No comprende reglas, permisos,
catálogo, precios, cuentas, backend externo, estimaciones ni datos personales.
No se ha enviado una petición al proveedor ni se ha escrito en Firestore en esta revisión.

### Después: listado institucional, si existe cobertura

- No montar una tabla vacía bajo la apariencia de recuperación completa. Por
  ahora permanecen los porcentajes agregados existentes, sin ninguna retirada.
- Determinar cobertura con una consulta delimitada; el inventario local tiene
  cero filas y no prueba cobertura real futura.
- Definir y acreditar qué registros corresponden a organizaciones. La ubicación
  bajo `Institutions` o un sufijo del nombre no basta como control automático de
  naturaleza jurídica. No clasificar personas mediante una conjetura.
- Propuesta de campos mínimos, sujeta a esa comprobación: nombre de organización,
  fecha de posición, porcentaje y, si está disponible y se decide incluirlo,
  número de acciones. Sin contactos, ejecutivos ni transacciones personales.
- Mostrar origen, fecha y cobertura parcial. Si se limita la cantidad, declararla;
  no titular «Principales» a ocho filas tomadas sin criterio acreditado.
- Cualquier dato personal sigue requiriendo autorización expresa separada. No se
  deduce de la autorización de fechas ni de una orden general de continuar.
- Si se confirma la cobertura, presentar el lote exacto antes de escribirlo.
  No se introduce una prohibición ni un bloqueo nuevo a una función existente.

## Qué se ha cambiado ahora y qué no

- Añadidos diagnóstico local reproducible y tres pruebas: fechas, minimización e identidad.
- Documentados resultados y actualizado el orden de pendientes.
- Sin modificar el contrato activo, la interfaz, el índice, respaldos, cifras o fuentes remotas.
- Sin publicación, commits, cambios de reglas o permisos ni datos personales guardados.
- No se declara la paridad complementaria implementada: queda el permiso de carga
  de fechas y la comprobación específica de cobertura institucional.
- El vídeo permanece al final.

## Revisión previa del diagnóstico · §12

1. Necesidad: identificar qué información descriptiva anterior falta y cómo recuperarla.
2. Datos: código local, archivos ya existentes del catálogo y fichas empresariales propias.
3. Transformación: comparación de campos, validación de fechas y recuentos de cobertura.
4. Salida: informe técnico minimizado, sin copiar nombres de tenedores.
5. Emisores identificados: sí; se mantiene la clasificación vigente del módulo.
6. Circunstancias personales de visitantes: ninguna.
7. Consejo de operar: ninguno.
8. Valores futuros: no se producen estimaciones; una fecha declarada no acredita un pago.
9. Atractivo: no se puntúan empresas ni se ordenan inversores como recomendación.
10. Recomendaciones de terceros: ninguna.
11. Interfaz: sin activar, retirar o bloquear funciones durante este diagnóstico.
12. Acciones: lectura e informe local; sin contratación ni derivación.
13. Remuneración: sin cambios.
14. Separación profesional: únicamente proyecto y base propios.
15. Personas: no se guardan ni muestran nombres de los archivos de accionariado;
    se cuentan campos sin clasificar personas como instituciones por su nombre.
16. IA: no interviene en la aplicación.
17. Fuente: se distingue archivo antiguo, fecha del proveedor y lectura de la base.
18. Pruebas: recuentos, fechas inválidas, identidad y ausencia de nombres en la salida.

El diagnóstico no cambia el contrato activo ni la lista positiva de ingestión.
La recuperación remota se delimitará y consultará al fundador. No se aplica ningún
bloqueo nuevo ni se exige dictamen jurídico externo para continuar la alfa.

## Verificaciones

- Tres pruebas nuevas superadas sobre el diagnóstico puro.
- Lectura real: 73/73 empresas válidas; 146 GET; sin respaldos ni escrituras.
- **46/46 casos de regresión del módulo superados**, además de las tres pruebas
  nuevas. No se ha regenerado la web: no ha cambiado su ruta de producción.
- Sintaxis y formato de diferencias comprobados. Ninguna prueba queda en ejecución.

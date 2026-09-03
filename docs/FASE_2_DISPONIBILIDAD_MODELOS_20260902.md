# NUVIA · Fase 2: disponibilidad de las carteras modelo

Fecha: 2 de septiembre de 2026. Alcance: revisión de disponibilidad y correcciones de los controles de acceso, sin modificar composiciones, pesos, universo, datos reales, Firebase, empresas ni publicación. Se conservan los cambios locales de las fases 0 y 1.

## Revisión previa (marco §12–§13)

Clasificación **ÁMBAR**: información y cálculos sobre instrumentos identificables. Se documenta el desarrollo correctivo local; no es validación jurídica ni autorización de publicación.

1. Necesidad: distinguir una composición educativa conservada de un análisis disponible y evitar analizar una cartera distinta por falta de datos.
2. Entradas: cuatro composiciones existentes y presencia de sus identificadores en el catálogo; las pruebas usan catálogos y fichas simulados.
3. Transformación: comparación exacta de identificadores, recuento de disponibilidad y comprobación de integridad antes de abrir un análisis.
4. Resultado: disponible, incompleta o sin verificar, con instrumentos ausentes identificados y posibilidad de reintentar una consulta.
5. Instrumentos identificables: sí; se conservan los existentes, sin añadir ni sustituir ninguno.
6. Circunstancias personales: ninguna.
7. Compra, venta, mantenimiento o inacción: no se sugiere ninguna conducta inversora.
8. Valor o precio: no se emite opinión ni precio objetivo.
9. Mérito inversor: no se puntúa ni ordena por atractivo. Disponibilidad significa presencia de datos, no calidad de inversión.
10. Recomendaciones de terceros: no se añaden.
11. Interfaz: estados operativos descriptivos, sin semáforos de atractivo. El botón se bloquea ante ausencia o falta de verificación.
12. Acción: abrir el análisis existente, no copiar una cartera ni contratar productos.
13. Remuneración o conflicto: sin cambios respecto del expediente de la alfa.
14. Condición de agente: sin acceso a sistemas ni datos profesionales, sin derivación comercial.
15. Datos personales: ninguna recogida nueva; las carteras locales del usuario no se alteran.
16. IA: no interviene en las comprobaciones.
17. Fuentes y límites: composiciones del repositorio, CSV y fotografía local del catálogo con su fecha. No se realiza una nueva consulta a producción ni se da por verificada la identidad de nuevas clases o cotizaciones.
18. Regresiones: carga lenta, error, catálogo parcial, comprobación incompleta, reintento, cambio de disponibilidad, ficha ausente, preservación de nombres/identificadores/pesos y bloqueo de un análisis fijo sin todas sus series.

Estados prohibidos: acceso antes de verificar; interpretar un error de consulta como disponibilidad; descartar posiciones y recalcular pesos silenciosamente en una cartera fija; modificar el CSV o publicar por esta intervención.

## Diagnóstico local

Fuente: `output/mercado-alfa/publicable/catalog/manifest.json` y `chunk-000.json`, fotografía heredada de **2026-09-02T17:51:25.078Z**, 159 instrumentos; contraste con `universo/universo-alfa.csv` y `js/nuvia-modelos.js`. Es una revisión de archivos locales, no del estado actual de Firestore. No se ejecuta el cargador heredado ni se modifica esa carpeta.

| Cartera | Presentes / total | Ausentes en esa fotografía |
|---|---:|---|
| Bolsa mundial indexada | 2 / 4 | iShares MSCI World y Vanguard S&P 500 |
| Grandes cotizadas españolas | 3 / 5 | Santander y BBVA |
| Value de gestoras independientes | 0 / 4 | Los cuatro fondos |
| Mitad bolsa mundial, mitad bonos en euros | 3 / 4 | iShares MSCI World |

Son **ocho instrumentos distintos**, no nueve: iShares se repite en dos carteras.

| Identificador | Nombre guardado en la composición | Situación en el CSV |
|---|---|---|
| IE00B4L5Y983 | iShares Core MSCI World UCITS ETF USD (Acc) | No existe fila |
| IE00B3XXRP09 | Vanguard S&P 500 UCITS ETF | No existe fila |
| ES0113900J37 | Banco Santander S.A. | `incluir=no`, símbolo `SAN.MC` |
| ES0113211835 | Banco Bilbao Vizcaya Argentaria S.A. | `incluir=no`, símbolo `BBVA.MC` |
| LU0563745743 | Bestinver Tordesillas SICAV Iberia A | `incluir=no`, símbolo `LU0563745743.EUFUND` |
| LU1372006947 | Cobas Selection Fund P Acc EUR | `incluir=no`, símbolo `LU1372006947.EUFUND` |
| LU1333148903 | Azvalor International R | `incluir=no`, símbolo `LU1333148903.EUFUND` |
| LU1330191542 | Magallanes European Equity R EUR | `incluir=no`, símbolo `LU1330191542.EUFUND` |

Los símbolos son los que constan en el CSV; esta revisión no certifica que el proveedor los sirva, que corresponda la clase exacta ni que tengan histórico suficiente. Tampoco se deduce una cotización en euros a partir del ISIN o del nombre de un ETF.

## Decisiones de implementación

- Mantener las composiciones y pesos actuales como referencia histórica, aclarando que no todos sus instrumentos están disponibles en la alfa.
- Botones inicialmente bloqueados; habilitación solo tras una comprobación completa y explícita del catálogo. Un fallo o respuesta parcial deja el análisis cerrado, con explicación y reintento.
- Revalidar la disponibilidad al abrir una cartera y exigir todas sus fichas. No descartar un fallo individual silenciosamente.
- No permitir que el motor de una cartera fija descarte instrumentos sin historial y normalice los restantes como si fuesen la composición original.
- No ampliar el universo ni cambiar símbolos. La decisión de incluir estos instrumentos queda reservada al fundador y su ejecución técnica necesitará comprobaciones previas y autorización de carga separada.

## Cierre

**Correcciones técnicas implementadas y verificadas en local. La activación efectiva de las cuatro carteras sigue pendiente y no forma parte de esta autorización.**

### Cambios realizados

1. `js/nuvia-modelos.js`: botones bloqueados durante la consulta; distinción entre ausencia confirmada y disponibilidad sin verificar; recuento por composición y nombres/ISIN ausentes; opción de reintento. Se aclara que los criterios del catálogo corresponden a la fecha de fijación de las composiciones.
2. Antes de abrir una cartera se vuelve a comprobar el catálogo y se exigen todas las fichas, con identidad coincidente, nombre, tipo y clase económica. Un error o ficha incompleta no produce un análisis parcial. Si una selección anterior deja de estar disponible al reintentar, se retira su estado seleccionado y se avisa de que el análisis ya abierto no se ha actualizado.
3. `js/nuvia-datos.js`: la comprobación de presencia acepta refresco explícito del catálogo. No se altera el contrato de los consumidores que no lo solicitan.
4. `js/nuvia-constructor.js`: las composiciones de solo lectura se bloquean si alguna posición carece de una serie válida. No se eliminan esas posiciones ni se redistribuyen sus pesos. El comportamiento de la cartera editable del usuario no se cambia en esta fase.
5. `docs/nuvia-modelos-disponibilidad.test.mjs` y `package.json`: nueve pruebas de regresión nuevas, integradas en `test:analisis`.

### Verificación efectuada

| Comprobación | Resultado y límite |
|---|---|
| Nueve pruebas de disponibilidad y constructor | 9/9 correctas: carga, error, reintento, respuestas incompletas, ausencias, cambio al pulsar, fichas fallidas/incompletas/de otra identidad, preservación de posiciones y bloqueo real del constructor de solo lectura |
| Batería de análisis | Correcta, incluidas las 14 baterías anteriores, las 16 pruebas de fase 1 y las 9 nuevas |
| Reglas | `test:reglas` correcto: contrato y protecciones locales, sin red. No se repite el emulador ni se certifican las reglas desplegadas |
| Comprobaciones estáticas | Paridad, sitio estático, consistencia, lenguaje, banners, navegación, definición, metadatos, contenido externo, privacidad de empresas y noticias: correctas |
| Avisos de consistencia | Se conservan cuatro: cabecera, pie y `noindex` de `guia-impuestos.html`, más dos imágenes de portada sin `loading="lazy"`. No se interviene sobre ellos |
| Navegador aislado a 1440 y 820 px | Tarjetas revisadas en escritorio y tablet: cuatro y dos columnas respectivamente, sin desborde horizontal de página ni de tarjetas. Comprobados estados parcial, error, carga lenta, recuperación, selección y cambio posterior de disponibilidad |
| Integridad de las composiciones | El bloque completo `CARTERAS_MODELO` es idéntico a `HEAD`: nombres, temas, criterios, identificadores y pesos sin cambios |
| Alcance del árbol | Sin cambios en CSV/universo, estilos, HTML, `company-analysis/`, reglas ni configuración Firebase. Se mantienen los cambios previos de fases 0 y 1 |
| Higiene | `git diff --check` sin errores. Sin commit, merge, push, compilación completa ni publicación |

La prueba visual usa los módulos y estilos reales con un cliente simulado en `output/fase2-modelos/qa.html`, ignorado por Git, y una política `connect-src 'none'`. No consulta Firebase, BCE ni el proveedor. **No sustituye una auditoría integral de `cartera.html`, de todo el portal o del despliegue**, ni acredita datos reales actuales. El servidor de prueba se ha detenido y la pestaña temporal se ha cerrado.

Referencias de integridad al cerrar: rama `codex/entrega-2b-base-alfa`, `HEAD` `061a201a023c484c70ba140dabb67e95a668eeb0`; rama visual `prueba/tipografia-empresas` sin mover (`cba47068d036593b2d946f31e9161979be23035a`); árbol de empresas conservado (`38f61426a5586ba88f49380eebbee432331abb26`).

### Decisión y siguiente paso

El fallo de acceso queda corregido; la falta de instrumentos sigue siendo una cuestión de cobertura. Con la fotografía local revisada, **0 de 4 composiciones están completas**. Eso no se resuelve sustituyendo instrumentos ni habilitando botones por defecto.

El fundador debe decidir si mantiene esas composiciones temporalmente no disponibles o si autoriza preparar la incorporación de los ocho instrumentos. Si opta por incorporarlos:

1. Confirmar la inclusión de las seis filas marcadas `incluir=no`, sin presuponer que su exclusión fue accidental.
2. Verificar los dos ETF sin fila: identidad/clase exacta, símbolo del proveedor, mercado de cotización, divisa e histórico. No inventar símbolos ni confundir divisa de la clase y divisa de cotización.
3. Preparar y revisar el cambio de universo, sin sustituir identificadores ni modificar pesos. Contrastar cobertura y fichas; documentar las limitaciones encontradas.
4. Ejecutar pruebas locales y simulación de la carga. Una carga real o cambio en Firebase requiere autorización separada.
5. Tras disponer de los datos y con autorización para su lectura, verificar las cuatro composiciones completas y el historial de todas sus posiciones en la alfa. No afirmar disponibilidad hasta completar esa comprobación.

El módulo de empresas permanece fuera de esta fase. La puerta de publicación ámbar continúa pendiente conforme al expediente vigente; superar estas pruebas no la da por cumplida.

# NUVIA · Consolidación local y pendientes de cierre

> **Saldo posterior vigente:** [cierre de pendientes consolidado](CIERRE_PENDIENTES_CONSOLIDADO_20260903.md).
> Incluye BPA por periodos reales, impresión ampliada, grafía de TSK, selección
> editorial, consola SVG y paquete limpio. Esta acta conserva los resultados de
> su propia ejecución; no utilizar sus cifras históricas como inventario actual.

Fecha: 3 de septiembre de 2026. Ejecución de la orden «deja el vídeo para el final y procede con todo lo demás».

> **Mejora local posterior:** [índice ligero y respaldos por empresa](CARGA_LIGERA_FUNDAMENTALES_20260903.md)
> implementados: se conserva la cobertura, sin descargar 1,2 MB al abrir. Ninguna
> escritura remota ni publicación. Las identidades ya cargadas siguen resueltas.

> **Estado más reciente, 03-09-2026, 09:29 UTC:** [corrección autorizada de Aena y Ferrovial](EJECUCION_IDENTIDADES_AENA_FERROVIAL_20260903.md)
> ejecutada. **73/73 fundamentales** válidos; dos identidades actuales y sus series
> disponibles, originales conservados sin borrar. El cliente local es compatible
> con ambos códigos. Catálogo bruto aún antiguo por compatibilidad con la versión
> publicada. No se ha desplegado ni confirmado en Git; las notas siguientes
> describen hitos anteriores, no el saldo actual de escrituras autorizadas.

> **Conexión posterior, 03-09-2026:** el módulo ya consulta por lectura anónima
> los fundamentales de la base propia, con 71 fichas verificadas y dos identidades
> pendientes. El archivo de 52 empresas queda como respaldo explícito, no como
> origen principal. [Implementación y comprobaciones](CONEXION_FUNDAMENTALES_BASE_PROPIA_20260903.md).
> No se han cambiado datos remotos, precios, identidades ni reglas en esta conexión.

> **Actualización posterior, 03-09-2026, 08:27 UTC:** el fundador autorizó «carga
> los datos que necesites» y solicitó cinco años también de precios. Se han creado
> y verificado 71 fundamentales en la base propia; 70 cubren al menos cinco
> ejercicios por estado y TSK aporta tres. Ferrovial y Aena necesitan corregir
> sendos ISIN históricos. La base ya cubre cinco años de precios para 661 de 698
> instrumentos; EODHD no aporta más historia para los otros 37. No se han reescrito
> precios ni cambiado la ventana de análisis o el lector estático de la web.
> Las menciones de «sin escrituras» del acta original describen la entrega local
> anterior a esa autorización. Resultados actuales: [carga de fundamentales](CARGA_FUNDAMENTALES_AUTORIZADA_20260903.md)
> y [cobertura de precios](COBERTURA_CINCO_ANIOS_PRECIOS_20260903.md).

## 1. Resultado y alcance

Se han integrado en el árbol activo las mejoras visuales y de navegación que estaban conservadas en `cba4706`, junto con la recuperación de fundamentales, las correcciones de datos y los formularios actuales. Se han combinado los cambios; no se ha sustituido el árbol actual por aquella versión antigua.

Esta es una entrega local, no una declaración de que toda la alfa esté publicada o de que todos sus datos estén completos. No se han realizado commits, push, despliegues ni escrituras en Firebase. La comprobación de la base propia ha sido exclusivamente de lectura. El vídeo no se ha iniciado y sigue siendo el último paso.

Continúan las órdenes del fundador: sin nuevos bloqueos regulatorios unilaterales, sin almacenar datos personales en la base, sin cuentas, y sin PER estimado, BPA previsto ni dividendos estimados. La validación jurídica externa no se convierte en una condición de la alfa.

## 2. Cambios ejecutados

### 2.1. Periodos y respuestas de la cartera

- El pie de cada resultado utiliza ahora las fechas de la serie realmente analizada y su número de observaciones. Ya no busca una fecha en `coverage.last_date`, un campo que no devolvía ese cliente.
- Una serie corta no se presenta en ese pie como tres años completos. Las fechas inválidas o desordenadas no generan un periodo inventado.
- Vaciar la cartera invalida también las consultas pendientes. Una respuesta tardía ya no puede reemplazar el estado de cartera vacía por el error de una consulta anterior.
- Al cambiar de composición se retiran las cifras anteriores mientras se consulta la nueva. No quedan temporalmente bajo otro nombre.
- Los dos últimos fallos se reprodujeron primero con pruebas que fallaban y después pasaron con la corrección. Esto demuestra esos defectos concretos; no prueba por sí solo que fueran la única causa de todas las incidencias transitorias anteriores.
- No se han alterado las fórmulas, los pesos de las composiciones, su universo ni los niveles de acceso vigentes.

### 2.2. Presentación de la web

Integración local de las entregas 4A, 4B y 5A existentes:

- Escala tipográfica y anchuras compartidas, superficies, espacios, tablas y resultados.
- Cabeceras, pies, navegación de teclado, foco, estados, botones y formularios.
- Entrada de Patrimonio con cuatro ámbitos; Economía y Finanzas con mercados y cartera; Familia, Salud y Bienestar separado de Patrimonio.
- Recorrido de Academia y criterios, filtros y fichas de Lecturas.
- Conservación de rutas, alias, calculadoras, contenidos dinámicos y módulo local de empresas.

Se han resuelto solapamientos con el trabajo reciente: anchura del importe de cartera, mensajes de formularios, guardado local, carga diferida y altura del módulo de empresas. El aviso de acceso autorizado de la versión visual se ha sustituido por la situación real de la alfa: abierta, sin cuentas, base propia para cartera e instantánea local para fundamentales.

El auditor detectó rótulos «Tras calcular» a 9,6 px; se han corregido al tamaño mínimo común. El módulo independiente de empresas importa los mismos tokens del portal para tipografía, anchuras y superficies. Sus leyendas y notas son legibles y los gráficos largos separan las etiquetas de años sin quitar barras ni filas de las tablas.

En Lecturas se ha corregido una carrera de foco: el cierre inmediato devolvía el foco al botón, pero su evento diferido podía volver a quitarlo al filtro que se acababa de seleccionar. La devolución se hace ahora una sola vez. Se ha incorporado una regresión que cierra la ficha, pasa al filtro y espera el evento diferido, comprobando que el foco permanece en el filtro.

### 2.3. Fundamentales y PDF

- Se conserva la búsqueda por nombre, ticker e ISIN, las tres vistas y los selectores de ejercicios.
- Se ha recuperado el margen neto de cada ejercicio en la tabla anual, además del margen del último cierre y los ratios TTM.
- Un archivo estructuralmente corrupto produce un error legible y permite reintentar, en lugar de fallar durante el dibujo de las filas. La instantánea real disponible supera la misma prueba.
- Los datos ausentes permanecen como ausentes, no cero. Se conservan pérdidas, ceros y divisas por ejercicio; no se inventa escala ni fecha de descarga.
- Se ha probado la impresión desde «Resumen»: el PDF incluye también estados, gráficos, BPA publicado y accionariado agregado.
- Se han corregido títulos aislados, cabeceras partidas y notas separadas. Las limitaciones que están plegadas en pantalla se imprimen completas.

El PDF de prueba de Iberdrola, cinco ejercicios y los comunicados de BPA que presenta ese selector, tiene ocho páginas A4 apaisadas. Se han renderizado y revisado visualmente las ocho páginas después del último ajuste. No se afirma que se hayan revisado manualmente todas las combinaciones empresa × ejercicios en PDF. El selector «todos» sí está probado en pantalla, incluyendo ausencia de solapamientos en las etiquetas de los gráficos.

Evidencia reproducible: `node scripts/check-company-alpha-render.mjs --pdf`, después de compilar el módulo. Salida local en `output/cierre-alfa/fundamentales/`, excluida de Git. La prueba usa un navegador de regresión aislado; no reutiliza sesiones personales ni consulta servicios externos.

### 2.4. Noticias e indicadores

- Se ha ejecutado la actualización de noticias y la de los cinco indicadores oficiales el 03-09-2026. El validador editorial ha pasado.
- Se ha añadido la actualización macroeconómica al flujo de GitHub Pages, antes de construir. Noticias y macro se ejecutan en secuencia sobre el archivo de contenido.
- La lectura numérica ya no convierte `null`, celdas vacías o valores inválidos en cero. Las observaciones se ordenan por periodo.
- El indicador obtenido del índice armonizado se identifica como «IPCA España».
- Si no se verifican las cinco series, el actualizador macro conserva la copia anterior y su fecha. No se cambia esa fecha para aparentar actualidad.
- La auditoría visual de publicación se aísla de servicios externos; las lecturas de datos se comprueban aparte. No es un bloqueo de servicios en la web publicada.

Límite editorial que sigue abierto: los resúmenes y explicaciones de las noticias son plantillas temáticas automáticas; no equivalen a un resumen contrastado artículo por artículo. La actualización exitosa no certifica esa calidad editorial. Si una ejecución futura falla, se conserva la selección incluida en el repositorio, no necesariamente la última generada por una ejecución anterior de GitHub Actions. No se ha añadido persistencia remota del contenido.

## 3. Matriz de paridad del módulo de fundamentales

Comparación de la copia anterior `src/views/tabs/FundamentalTab.jsx` con la entrada activa `src/alfa/`:

| Información | Situación en la entrada activa |
|---|---|
| Identidad, ISIN, ticker, mercado, sector, industria, país y divisa de cotización | Presente; empresa elegida por el usuario |
| PER TTM, P/Ventas, P/Valor contable, EV/Ventas y EV/EBITDA | Presentes como cifras del proveedor, sin recalcular con cotización actual |
| Márgenes bruto, operativo y neto, ROE, ROA y crecimientos interanuales | Presentes; unidades porcentuales declaradas |
| Ingresos, beneficio bruto, EBITDA, beneficio operativo y neto | Presentes por ejercicio; margen neto anual recuperado en esta entrega |
| Activos, pasivos, patrimonio, caja, deuda neta y deuda total | Presentes por ejercicio |
| Flujo operativo, Capex, FCF y dividendos pagados | Presentes por ejercicio cuando la fuente los aporta |
| Capitalización, EV, BPA TTM y valor contable por acción | Presentes como magnitudes originales, sin atribuir una moneda o escala no acreditadas |
| Dividendo por acción, rentabilidad por dividendo y pay-out | Presentes; no se usan los campos de dividendo futuro |
| BPA publicado por periodo y fecha de publicación | Presente, sin columna de consenso ni sorpresa respecto de estimaciones |
| Acciones en circulación, porcentaje institucional y porcentaje de insiders | Presentes de forma agregada |
| Gráficos y ejercicios | Preservados, con selección 5/10/todos, monedas separadas y tablas completas |
| Informe imprimible | Presente; verificación visual realizada sobre el caso descrito |
| PER estimado, BPA previsto y dividendos estimados | Excluidos por orden expresa del fundador; no son trabajo pendiente de recuperación |
| Fechas de dividendo/exdividendo y listado nominal de instituciones del componente antiguo | No trasladados a la entrada activa; queda por contrastar su recuperación específica, sin equipararlos automáticamente a estimaciones ni imponer una prohibición nueva |
| Ratings, precio objetivo y otras opiniones de terceros | No incorporados en esta recuperación; no se cambia su alcance mediante este acta |

No se declara paridad de todas las funciones de la aplicación original externa: no se ha modificado ni reactivado su backend, autenticación o módulos de recomendación.

## 4. Base propia: estado comprobado, no supuesto

Lectura realizada el 03-09-2026 a las 06:55:53 UTC, con diez solicitudes de lectura, registrada en `output/cierre-alfa/base-solo-lectura-2026-09-03T06-55-53-903Z.json`.

- 698 instrumentos únicos: 617 fondos, ocho ETF y 73 acciones.
- El manifiesto declara último cierre máximo 02-09-2026 y mínimo 27-08-2026. Un máximo global no significa que todas las series lleguen a ese día.
- Grandes cotizadas españolas: 5/5 instrumentos, 765 cierres comunes, del 04-09-2023 al 02-09-2026.
- Value de gestoras independientes: 4/4, 744 cierres comunes, del 04-09-2023 al 31-08-2026.
- Bolsa mundial indexada: 2/4 instrumentos disponibles.
- Mitad bolsa mundial, mitad bonos en euros: 3/4 disponibles.

Las dos últimas composiciones comparten las ausencias: `IE00B4L5Y983` y `IE00B3XXRP09`. Son dos instrumentos distintos, no ocho. No se han sustituido ni incorporado automáticamente.

Comprobación adicional en la vista local compilada: los dos modelos disponibles muestran respectivamente 764 y 743 observaciones de rentabilidad, con esos mismos extremos de fechas. La diferencia de una observación frente a los cierres se debe al cálculo entre dos precios consecutivos. No había desborde horizontal en esa revisión a 1440 px.

La instantánea de fundamentales no ha cambiado de cobertura: 73 entradas, 52 con cifras, 20 sin archivo en la copia y un conflicto de identidad, Ferrovial. La aplicación muestra esos estados y no afirma que el proveedor carezca de datos. Las fechas de preparación y observación del catálogo no se presentan como descarga del fundamental.

## 5. Verificación

- 98/98 pruebas combinadas de la recuperación, contrato, muestra, lector, formularios, periodos, modelos y observaciones oficiales.
- Batería de analítica y construcción completa integradas en el flujo de comprobación. La última construcción, después de corregir el cierre diferido de Lecturas, terminó correctamente y regeneró `dist/`; registro en `output/cierre-build-verificado.log`.
- 30 vistas a 1440 px, sin fallos del auditor en esa construcción final. Incluye comprobaciones de estructura, superficie, contraste, tipografía, foco, navegación y estados.
- Enlaces locales: 560 destinos internos y 75 anclas verificados; cuatro dependen de calcular y doce enlaces de plantilla quedan reservados a las pruebas de interfaz.
- Barrido adicional de las 30 vistas a 1280, 1180, 1024, 900, 820 y 768 px: no detectó fallos de disposición, contraste ni escala, pero sí devolución de foco en Lecturas a 820/768 px y una espera agotada de navegación a Bienestar a 768 px. La repetición aislada de Bienestar pasó sin modificar su funcionalidad; se amplió el diagnóstico, no el plazo ni la condición de la prueba.
- Una repetición posterior detectó el segundo defecto de foco diferido en Lecturas a 1440 px. Se corrigió y se añadió una regresión específica. No se presenta el barrido inicial de 210 combinaciones como una ejecución completamente verde.
- Repetición final tras esa corrección: **35/35 combinaciones correctas**, las cinco páginas retocadas (portada, mercados, cartera, Lecturas y Bienestar) en los siete anchos de 1440 a 768 px. Incluye ambos casos que habían fallado; registro en `output/cierre-matriz-cambios-verificada.log`. Las demás vistas conservan el barrido previo y la construcción final a 1440 px.
- Fundamentales: pruebas a 1440, 1280, 1024, 820 y 768 px, sin desborde global, errores JavaScript ni solicitudes externas; consulta, selección de ejercicios y estados de ausencia/conflicto comprobados.
- Ocho páginas del PDF de prueba inspeccionadas después de los ajustes.

La auditoría del portal conserva un inventario de mensajes conocidos del motor de plantillas SVG; «sin fallos del auditor» no significa que se hayan eliminado todos esos mensajes históricos. La revisión visual automatizada no certifica accesibilidad completa de toda interacción humana ni certifica los servicios externos.

## 6. Pendiente real y siguiente orden de ejecución

### Estado operativo posterior a las cargas y a la conexión

Los pasos históricos sobre localizar o cargar los veinte fundamentales y resolver
Aena/Ferrovial **están completados**: 73 fichas verificadas, con conexión a la base
y compatibilidad de identidades. La optimización del índice también está implementada.
Las secciones de diagnóstico que siguen se conservan como trazabilidad, no se
reactivan sus órdenes de carga ni describen la cobertura actual.

El orden restante es:

1. Auditoría de moneda, escala y comparabilidad **realizada**: [73 empresas,
   hallazgos y ajustes locales](AUDITORIA_METADATOS_FUNDAMENTALES_20260903.md).
   Queda acreditar unidades y las tres filas recientes sin moneda; ninguna cifra
   se ha transformado ni se ha escrito en la base. No repetir la carga por esta nota.
2. Paridad complementaria **contrastada**: [fechas y accionariado](PARIDAD_COMPLEMENTARIA_FUNDAMENTALES_20260903.md).
   [Fechas consultadas y cargadas con permiso](CARGA_FECHAS_DIVIDENDOS_20260903.md):
   73 complementos nuevos verificados, 71 exdividendos y una fecha de pago antigua;
   dos empresas sin fechas. [Integración visual local completada](INTEGRACION_FECHAS_DIVIDENDOS_20260903.md),
   con reintento independiente y sin retirar fundamentales ante un fallo de fechas.
   La cobertura institucional sigue pendiente de comprobación; no estaba incluida
   en la autorización de fechas. Sin publicación.
3. Consultar la incorporación de los dos ETF ausentes o una modificación explícita
   de las composiciones. No se sustituyen instrumentos ni se escribe por un «sigue».
4. Afinar el contenido de noticias y acordar responsable editorial y los datos de
   contacto publicables que falten. No activar persistencia o automatizaciones nuevas.
5. Coordinar revisión y preparación de Git; confirmar, integrar y publicar solo
   por orden del fundador. Coordinar entonces el catálogo de identidades y comprobar
   la web publicada, sin publicar en Firebase Hosting.
6. Vídeo institucional al final, una vez fijado el texto que debe reproducir.

### Contraste del primer paso · 03-09-2026

Tras la orden «vamos por orden», se han vuelto a comprobar los veinte símbolos
sin fundamental: ninguno tiene su archivo en la caché utilizada y los veinte
figuran con `incluir=no` en `universo/universo-alfa.csv`. El descargador local
procesa únicamente las filas incluidas. Su último informe corresponde a 161
instrumentos, mientras que el catálogo observado de la base contiene 698,
incluidas esas veinte acciones. Esto explica la falta de archivos en este flujo
local; no demuestra falta de datos en EODHD ni en otras colecciones de la base.

No se ha cambiado el CSV: usar esa selección antigua para volver a publicar
podría afectar a un universo distinto del catálogo actual. Primero debe
identificarse el contrato de fundamentales de la base definitiva o acordarse
una obtención local limitada a los veinte símbolos, sin reproyectar ni publicar
el catálogo. No se ha ejecutado ninguna descarga nueva ni escritura remota
en esta comprobación.

El fundador ha aclarado que la base puede modificarse **con su permiso previo**.
Esto permite proponer una modificación concreta, pero no es autorización general
para ejecutarla. Cada solicitud debe identificar los datos o estructura afectados,
el motivo y su alcance; los datos personales conservan su autorización separada.

### Orden pendiente

**Comprobación posterior en vivo, 03-09-2026 a las 08:19:57 UTC:** no hay colección
raíz de fundamentales ni estados/ratios fundamentales en las 73 fichas de acciones.
Todas tienen únicamente la subcolección `series`; `metrics` contiene rentabilidad,
volatilidad y drawdown históricos. Queda resuelta la duda sobre su ubicación en
la estructura de acciones de esta base, no su carga. Detalle y límites en
[Comprobación directa de la base](COMPROBACION_BASE_FUNDAMENTALES_20260903.md).

1. **Datos de fundamentales.** Resolver los veinte archivos ausentes y documentar la fuente/contrato de actualización de la base definitiva. La web usa hoy una instantánea local, no un refresco automático de fundamentales desde Firestore.
2. **Identidad Ferrovial.** Confirmar con el fundador la correspondencia entre el ISIN del catálogo `ES0118900010` y el del archivo `NL0015001FS8`. No fusionarlos ni cambiar el universo por inferencia.
3. **Monedas, escalas y cobertura.** Completar metadatos acreditados; mantener visibles los números originales mientras no existan. No interpretar las carencias como una orden para ocultar la función.
4. **Composiciones.** Decidir la incorporación de los dos ETF o una modificación explícita de las composiciones. No sustituirlos silenciosamente.
5. **Paridad complementaria.** Contrastar las fechas de dividendos y el listado institucional indicados en la matriz; confirmar qué se desea recuperar y con qué campos acreditados.
6. **Contenido.** Afinar los resúmenes informativos y los criterios de selección de noticias; decidir un responsable editorial. No presentar las plantillas actuales como lectura exhaustiva de cada artículo.
7. **Entrega.** Revisión independiente en solo lectura, coordinación con los demás editores y orden del fundador para confirmar/integrar/publicar. Comprobar después la URL oficial y GitHub Actions. No publicar en Firebase Hosting.
8. **Vídeo institucional, al final.** Partir de «Qué es NUVIA», sin ampliar la teoría ni prometer funciones no desarrolladas. No condiciona las actuaciones anteriores.

No están incluidos por defecto nuevos foros, pagos, cuentas, persistencia de información personal o versión móvil. Requieren su propia decisión de producto y autorización.

## 7. Preparación de la entrega y trazabilidad

La rama activa sigue siendo `codex/entrega-2b-base-alfa`. El último commit confirmado al comenzar era `061a201a023c484c70ba140dabb67e95a668eeb0`. Los cambios descritos aún no se han convertido en commits y no se atribuye a esos commits antiguos la validación del árbol actual.

La rama visual y su commit se han conservado. No se han hecho reset, checkout destructivo ni borrados del trabajo de otro editor. El archivo `.git/index.lock` preexistente no se ha eliminado.

Antes de confirmar, revisar los archivos nuevos de `company-analysis/alfa/`, `src/alfa/`, el JSON saneado de `company-analysis/public/data/`, los validadores y los documentos. No añadir los crudos, PDF de prueba, capturas, salidas temporales o datos privados de `output/`. Coordinar cualquier retirada del bloqueo de Git con los procesos que lo puedan estar utilizando.

Este acta actualiza el seguimiento operativo, no sustituye la definición canónica ni firma decisiones en nombre del fundador.

Estado al terminar esta ejecución: lote local construido y comprobado; pendientes
de datos, contraste complementario, contenido y publicación según §6. No queda
una prueba iniciada sin resultado de las enumeradas arriba. El vídeo continúa
sin iniciar y reservado al final.

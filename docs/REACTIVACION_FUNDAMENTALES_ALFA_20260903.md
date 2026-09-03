# Recuperación del módulo de fundamentales en la alfa

Fecha: 03-09-2026. Orden directa del fundador: continuar y arreglar lo pendiente,
empezando por fundamentales, recuperando los datos anteriormente aprobados.
Marco vigente: v1.2 §0. La validación jurídica externa está fuera de la alfa.

## Estado más reciente · continuación «SIGUE» del 03-09-2026

La integración local del menú queda corregida: ya no añade «En preparación» a
empresas ni a sus alias. Retira también marcas antiguas de los enlaces internos,
sin modificar los externos ni las indicaciones de resultados pendientes de cálculo.
Los apartados posteriores conservan las evidencias históricas de la primera entrega.

- Se releyó el estado compartido antes del ajuste. La condición anterior exigía
  marcar empresas mientras su página fuera un cartel; esa página ya carga el módulo.
  La orden de continuar permite proseguir este ajuste, pero no se registra como
  confirmación de exclusividad ni como permiso para sobrescribir cambios ajenos.
- Se corrigió el regreso con el historial a los alias `technical` y `fundamental`:
  ahora conservan la vista de empresas, igual que al abrirlos directamente.
- Se añadieron pruebas de carga diferida, conservación del iframe al cambiar de
  vista, alias en el historial, procedencia de mensajes de altura, valores inválidos
  y retirada de escuchas al desmontar. No se amplía el contenido financiero.
- **77 de 77 pruebas combinadas correctas**, incluidas 12 del módulo alfa y
  11 de formularios/estados. La ejecución final secuencial evita los avisos de
  puerto ocupado observados al ejecutar simultáneamente varios renderizadores.
- La batería completa `test:analisis` pasó; los 525 enlaces internos y 66 anclas
  revisados no presentan destinos estáticos rotos.
- Compilación del módulo y montaje de `dist/` correctos. Comprobaciones de sitio
  estático (19 páginas), navegación, definición, metadatos, privacidad, contenido
  externo, sistema editorial, banners, paridad, lenguaje y consistencia correctas.
  Persisten los cuatro avisos anteriores de consistencia, sin nuevas modificaciones.
- Navegador: acceso integrado, cambio a modelos y regreso a empresas, alias antiguo
  convertido a `companies`, cero marcas obsoletas, iframe cargado y altura recibida.
  Revisión visual del acceso a 1440 y 820 px sin desborde horizontal de página.
  No es una nueva auditoría visual de todo el sitio ni de un PDF exportado.
- Siguen fuera PER estimado, BPA previsto y dividendos estimados. No se ha
  regenerado el archivo de datos, modificado Firebase/backend, publicado ni confirmado
  cambios en Git. Tampoco se ha ejecutado la cadena completa `npm run build`.

Pendiente de datos: 20 empresas sin archivo y la identidad de Ferrovial; la copia
conserva 52 empresas con cifras. Sigue pendiente validar visualmente la exportación
PDF y revisar el resto de la web en conjunto. El siguiente paso de datos exige
resolver esas incidencias con su responsable; no se deducen cifras ni identidades.

## Alcance de esta entrega

Reconectar la ruta de empresas con una entrada independiente de la base profesional,
sin cuentas, SDK de autenticación, escrituras ni datos personales. Recuperar búsqueda,
identidad, ratios históricos, estados anuales, gráficos, accionariado agregado e
informe imprimible. Conservar el archivo antiguo y las pruebas normalizadas.

Se utiliza una instantánea explícita de los archivos propios existentes, proyectada
mediante campos permitidos; no es una conexión nueva a fundamentales en Firestore
ni se presenta como actualización automática. El catálogo conserva las acciones
de la evidencia propia existente, incluidas las que no tienen archivo. No se
fusionan identidades distintas. No se altera Firebase, el universo ni los crudos.

Las cifras originales vuelven a ser consultables: una escala desconocida se indica
como tal, sin afirmar que el número representa euros, miles o millones de euros.
Las abreviaturas representan magnitudes del número recibido, no una escala contable
acreditada. Cada fila conserva su moneda declarada o su ausencia. Los datos ausentes
siguen ausentes. No se sustituye la fecha de descarga desconocida por la del empaquetado.

Consulta resuelta por el fundador el 03-09-2026: «PER estimado, BPA previsto y
dividendos estimados. NO». Esas tres estimaciones quedan fuera de la nueva vista
alfa por decisión expresa del fundador. Se mantienen el PER histórico, el BPA
real y los datos históricos de dividendos. No se retira código de las vistas
antiguas no cargadas por esta entrada ni se amplía esta decisión a otros campos.

## Revisión previa 1–18

1. Necesidad: comprender las cifras de una empresa elegida por el usuario.
2. Entradas: catálogo archivado de la alfa y caché propia EODHD, sin nueva descarga.
3. Transformaciones: selección expresa de campos, orden temporal, formato numérico,
   porcentajes y margen neto; no estimar ni completar datos ausentes.
4. Salidas: identidad, ratios, tres estados, gráficos e informe con procedencia.
5. Emisores identificados: sí; se mantiene la clasificación interna ámbar.
6. Circunstancias personales: ninguna.
7. Operaciones recomendadas: ninguna.
8. Precios objetivo o valor futuro: no se incorporan. PER, BPA y dividendos estimados:
   excluidos de esta vista por respuesta expresa del fundador del 03-09-2026.
9. Orden: alfabético y temporal. Sin ranking de atractivo; las comparaciones objetivas
   no se declaran prohibidas por el marco (§§5–6).
10. Recomendaciones ajenas: no se copian.
11. Colores: serie o signo aritmético, nunca veredicto de inversión.
12. Acciones: buscar, abrir, consultar ejercicios, imprimir. Sin contratación.
13. Remuneración: no se introduce monetización.
14. Separación: entrada y compilación independientes, sin acceso a base profesional.
15. Datos personales: no se reciben ni guardan; solo datos de emisores y agregados.
16. IA: ninguna en tiempo de ejecución.
17. Fuente: EODHD; fechas de catálogo, proveedor, cierre y empaquetado diferenciadas;
   descarga específica desconocida, moneda por fila y escala explícita.
18. Pruebas: proyección positiva, identidad, nulos/cero, fechas, errores de lectura,
   render de datos, navegación, impresión, escritorio/tablet y bundle sin SDK anterior.

## Evidencias y límites

El contrato de la muestra normalizada y la selección positiva local ya existían;
no se reemplazan por una lista negra. Los dos supuestos huecos de estimaciones del
informe anterior no se reprodujeron: estaban protegidos en el modo histórico.

Referencia del proveedor consultada para distinguir campos históricos y previsiones:
[API de fundamentales EODHD](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds).
Esta documentación no basta para acreditar todas las escalas de los archivos antiguos.

No se incluyen en esta orden un despliegue, commit, push, modificación de backend,
carga de datos a Firebase ni cambio de identidad de Ferrovial. Las incidencias se
comunican al fundador y no se usan para detener los emisores con información disponible.

## Resultado inicial implementado y verificado

- Entrada alfa independiente en `company-analysis/src/alfa/`, cargada desde la
  ruta existente de Cartera mediante el módulo local compilado, con altura adaptable.
- Catálogo de 73 empresas: 52 con cifras, 20 sin archivo en esta caché y Ferrovial
  con el conflicto ya conocido. Se conservan las 73 entradas; no se cambia el universo.
- Estados, ratios, gráficos, accionariado agregado, capitalización, EV, BPA real
  e información de dividendos del proveedor. Selección de 5, 10 o todos los ejercicios.
- Instantánea saneada en `company-analysis/public/data/fundamentals.json`, con
  huella de cada archivo de origen. Sin datos personales, autenticación o accesos
  antiguos en el paquete compilado. Esta copia no es una conexión a Firestore.
- El informe puede prepararse en pantalla para imprimir/guardar PDF. La hoja de
  impresión está implementada; no se afirma una validación visual de un PDF generado.
- 8 pruebas nuevas del módulo pasan. La batería combinada de 72 pruebas tiene
  70 correctas y 2 fallos de estado del menú, explicados abajo; no está toda en verde.
- Se renderizaron 104 combinaciones de las 52 fichas (5 ejercicios e histórico
  completo), sin NaN ni infinito. Con los últimos cinco ejercicios se recuperan
  3.849 celdas numéricas y se mantienen 21 ausentes. Este recuento corresponde a
  los tres estados, no incluye ratios ni BPA.
- Comprobados en navegador búsqueda, selección, cambio de pestañas, históricos,
  Iberdrola, Prosus (USD/EUR), Pernod Ricard (moneda ausente y cierres distintos)
  y Santander sin archivo. Revisados escritorio y tablet, sin versión móvil.
- Compilación del módulo y montaje local de `dist/` correctos. Paridad, navegación,
  referencias estáticas, privacidad y consistencia pasan. Persisten cuatro avisos
  previos de consistencia ajenos a fundamentales; no se han corregido en esta entrega.

## Antecedente de edición concurrente y consultas

Durante esta entrega otro proceso reescribió `js/nuvia-estados.js` después del
cambio de recuperación, reponiendo la etiqueta «En preparación». La página ya
carga fundamentales, pero la etiqueta vuelve a añadirse a los enlaces; dos pruebas
lo detectan. No se sobrescribió de nuevo el archivo compartido tras detectar la
colisión. Se pidió al fundador confirmar un único ejecutor y revisión ajena en
solo lectura. En ese momento la sincronización del menú quedó pendiente;
la continuación y su resultado se recogen en «Estado más reciente».

La consulta sobre PER estimado, BPA previsto y dividendos estimados queda resuelta
con el NO expreso del fundador. Se añade una prueba con previsiones numéricas
rellenas en origen para comprobar su exclusión sin retirar los datos históricos.
Esta respuesta no resuelve la consulta independiente sobre edición concurrente.

Verificación posterior a esa respuesta: las 9 pruebas del módulo alfa pasan.
La instantánea fuente y la copia montada en `dist/`, ambas con 73 entradas,
no contienen campos `ForwardPE`, `EPSEstimate*`, `epsEstimate` ni
`ForwardAnnualDividend*`. No se ha regenerado la instantánea ni se han cambiado
datos en Firebase. Esta comprobación no equivale a repetir la batería completa.

La entrega no se considera cerrada ni publicada. La consulta sobre identidad de
Ferrovial y la incorporación de los 20 archivos faltantes continúan pendientes.
No se ejecutó la cadena completa `npm run build`, ni commit, push o despliegue;
el montaje de `dist/` solo sirve para las comprobaciones locales descritas.

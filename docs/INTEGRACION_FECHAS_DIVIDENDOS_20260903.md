# Integración visual de fechas de dividendos

03-09-2026 · Orden: «sigue», tras la carga autorizada y verificada.
Estado: integración y baterías locales completadas. Ámbito local, sin publicación.

## Revisión previa · §12

1. Necesidad: recuperar las fechas descriptivas de pago y exdividendo en la ficha.
2. Entrada: complemento ya cargado de la empresa elegida por el usuario.
3. Transformación: validar identidad, calendario y procedencia; formato de fecha.
4. Salida: ambas fechas o ausencia explícita, con fuente y consulta separadas.
5. Emisores identificables: sí; se mantiene la clasificación ámbar del módulo.
6. Circunstancias personales: ninguna.
7. Consejo de operar: ninguno.
8. Precio o valor futuro: ninguno; las fechas posteriores no garantizan pagos.
9. Atractivo: sin puntuaciones, clasificación o señal.
10. Recomendaciones de terceros: ninguna.
11. Diseño: mismo sistema visual del portal, sin semáforos ni veredictos.
12. Acciones: lectura y reintento; sin contacto, contratación ni ejecución.
13. Remuneración: sin cambios.
14. Separación profesional: únicamente la copia y base propias de NUVIA.
15. Datos personales: ninguno; sin cuentas, persistencia o escrituras remotas.
16. IA: no interviene en los datos ni genera estimaciones.
17. Procedencia: proveedor, actualización declarada, consulta y carga del
    complemento; no sustituye las fechas de los estados contables.
18. Pruebas: identidad, ausencia, error, cancelación tardía, cambio de empresa,
    independencia de los fundamentales, escritorio/tablet e impresión.

Se muestran fechas antiguas y posteriores como tales respecto de la consulta,
no como «próximo pago». No se presume que ambas fechas describan el mismo evento.
Un fallo del complemento no retira las cuentas ni las magnitudes existentes.
No se descargan datos nuevos de EODHD, ni se cambian documentos, reglas o permisos.
Vídeo al final. La publicación conserva su autorización separada.

## Implementación

- Bloque «Fechas de dividendos» en Resumen, Fundamentales e Informe; incluido
  también al imprimir desde Resumen. Sigue las tipografías y superficies del módulo.
- Una lectura adicional del complemento de la empresa seleccionada, únicamente
  después de tener sus fundamentales. Sin descargar el universo de fechas.
- Reintento propio: no vuelve a descargar cuentas, ratios ni respaldos.
- Estados separados de consulta, documento no cargado, fechas no informadas y
  error recuperable. Todos conservan disponibles los fundamentales de la empresa.
- Identidad y lista positiva revalidadas antes de mostrar los datos. Fechas
  independientes del respaldo contable y de su fecha de descarga.
- Cancelación al cambiar de empresa, reintentar o desmontar la vista. La instancia
  se identifica por ISIN para no conservar fechas de una selección anterior.
- Formato de calendario en UTC para no desplazar un día según la zona del visitante;
  consulta y carga muestran fecha, hora y zona. La relación pasado/futuro se refiere
  expresamente al día de la consulta al proveedor, no a un calendario confirmado.

## Verificación local

- Siete pruebas nuevas de lectura, identidad, campos permitidos, ausencia, error,
  cancelación, presentación y aislamiento, integradas en las baterías de compilación.
- Regresión visual del módulo a **1440, 1280, 1024, 820 y 768 px**: sin desbordes
  globales ni errores JavaScript. Se mantienen las cuatro tablas y los selectores.
- Transporte simulado de fechas: HTTP 503, HTTP 404, dos nulos, identidad cruzada,
  reintento de un solo documento y respuesta tardía tras seleccionar otra empresa.
  Las cuatro tablas contables permanecen disponibles durante fallos y esperas.
- Informe de impresión de prueba: nueve páginas A4 horizontales; bloque completo
  de fechas en la tercera. Nueve páginas revisadas visualmente. Poppler produjo
  un aviso de fuente y omitió parte de texto en la sexta; el contraste con PDFium
  mostró esa página completa, sin cambiar el PDF ni los datos.
- Capturas y PDF son pruebas con **datos de transporte simulados**, no una nueva
  certificación financiera ni una entrega de cifras actualizadas de Iberdrola.

Evidencias: `output/cierre-alfa/fundamentales/fechas-{ancho}.png`,
`INFORME_PRUEBA_IBERDROLA.pdf` y `impresion-fechas-*.png` en esa misma carpeta.
La primera comprobación de respuesta retenida se adelantaba al repintado de React;
se corrigió la prueba para esperar el estado visible de consulta antes de medirlo.
No se relajaron las comprobaciones de ausencia de fechas antiguas ni de aislamiento.

## Compilación del portal

`npm run build` completado: **63 pruebas del módulo**, controles estáticos y
regresiones generales superados. Auditoría de **30 vistas a 1440 px**, sin fallos
de los controles de contraste, tipografía, estructura, superficies, desborde o
fugas. Se mantienen avisos de consola históricos identificados por el auditor;
no se afirma que toda la consola del portal esté vacía.

La compilación volvió a superar la matriz del módulo en los cinco anchos y
regeneró `dist/` localmente. Registro: `output/cierre-alfa/build-dividendos.log`.
No equivale a publicar: no se ha confirmado, integrado ni enviado nada a GitHub,
ni se ha desplegado en GitHub Pages o Firebase Hosting.

## Comprobación con datos reales

En la vista local actualizada, leyendo la base existente sin credenciales de
usuario ni escrituras:

- Iberdrola: pago no informado y exdividendo 06-07-2026.
- BMW: pago 21-05-2024 y exdividendo 14-05-2026, sin llamarlo próximo pago ni
  vincular ambos eventos. Reintento propio comprobado e inspección visual realizada.
- Adyen: ambas fechas «No informada» y ratios visibles.
- Inditex: pago no informado y exdividendo 29-10-2026, identificado como posterior
  a la consulta, sin presentarlo como pago confirmado.

Se deja Iberdrola abierta en la vista local. No se han guardado datos personales,
realizado cargas nuevas, cambiado permisos ni contactado de nuevo con EODHD.
La comprobación visual real no sustituye las pruebas simuladas de fallos.

## Pendiente después de este paso

La visualización de fechas ya no es pendiente. Continúan separados la acreditación
de monedas y escalas, la comprobación de cobertura institucional y cualquier
decisión sobre su carga, los dos ETF ausentes, el contenido editorial y la entrega
coordinada por orden del fundador. El vídeo sigue al final. No se cambia el alcance
de permisos por cerrar esta integración.

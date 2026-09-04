# Técnico: velas, volumen y ATR integrados en la copia local

Fecha: 04-09-2026. Orden directa: «Go», después de la carga OHLCV autorizada.
Alcance: interfaz, lectura y cálculos de `company-analysis/` en NUVIA Portal Lab.
No se modifica la aplicación original, Firebase, reglas ni el backend. No se
publica ni se confirma en Git por esta orden de integración.

## Revisión interna y decisiones

Se aplica la prueba de 18 puntos de
[preparación OHLCV](PREPARACION_OHLCV_ALFA_20260904.md): información histórica
de emisores concretos, clasificación interna ámbar, cálculos descriptivos sin
señales, recomendaciones, estimaciones ni circunstancias personales. La
validación jurídica externa sigue fuera del alcance alfa; no se presenta como
obtenida. No se añaden restricciones regulatorias ni se retiran funciones.

La única ampliación respecto a la preparación es conectar los datos ya cargados
a la pantalla. Se mantiene la lista blanca de datos, sin IA, cuentas, contactos,
operaciones, personalización decisoria ni almacenamiento de personas.

## Implementación

- Selector **Serie de datos**: histórico OHLCV y cierres anteriores. Se consulta
  únicamente la opción elegida. OHLCV es la opción inicial; los cierres previos
  permanecen accesibles, incluso si falla la descarga OHLCV.
- Selector **Velas ajustadas / Línea de cierre**, con periodos 6 meses, 1, 3 y
  5 años y bandas de Bollinger. Los cambios de representación o periodo no
  provocan nuevas consultas remotas.
- Cinco gráficos: precio y medias, volumen, ATR, RSI y MACD. Azul y violeta en
  las velas describen cierre respecto a apertura, no atractivo ni instrucciones.
- Apertura, máximo y mínimo de las velas se derivan multiplicando originales
  por `adjusted_close / close`. Se declara que no son precios negociados.
  Medias, RSI, MACD, Bollinger y ATR usan la misma descarga y escala ajustada.
- Volumen en acciones tal como llega del proveedor, ya ajustado por splits.
  No se reajusta. Ausente y cero se mantienen distintos.
- ATR de Wilder (14), semilla y reinicio tras huecos según el motor preparado.
  No se inventan indicadores sin calentamiento suficiente. Su gráfico utiliza
  un rango vertical mínimo de un céntimo a cada lado del centro (limitado a cero
  por abajo), evitando magnificar ruido numérico en valores casi constantes;
  no se alteran los cálculos ni los datos.
- Tabla desplazable, con originales, factor, velas derivadas, volumen, ATR y
  resto de indicadores. Etiquetas y fórmulas disponibles por teclado.
- Impresión de los cinco gráficos mediante captura local de sus lienzos,
  métodos desplegados y conservación del informe fundamental existente.

## Integridad y aislamiento

El lector `src/alfa/ohlcv.js` realiza GET anónimos a las subcolecciones nuevas de
la empresa elegida. Comprueba identidad actual, EUR, esquema, procedencia,
tipos de ajuste, cobertura, orden, rangos y valores; contrasta huellas SHA-256
anuales y la revisión conjunta, y relee el manifiesto al terminar.

No consulta EODHD directamente ni usa credenciales del navegador. No escribe,
no persiste los datos y no utiliza la API autenticada del módulo antiguo.
Los fallos son explícitos y recuperables. No mezcla silenciosamente la nueva
serie con `/series/` ni muestra cifras antiguas como resultado de un reintento.
Se cancelan consultas al cambiar empresa, serie o pestaña, y tras 20 segundos.

Cada conjunto muestra su propia fecha. En la muestra real de Iberdrola, OHLCV
termina el 03-09-2026 y la serie anterior el 02-09-2026; elegir una no actualiza
ni modifica la otra. La tabla y los indicadores corresponden al conjunto elegido.

## Verificación realizada

1. **76 pruebas de la compilación del módulo**, incluidas seis nuevas de lector
   y coherencia de cálculos. Identidades, monedas, fuentes, rangos, nulos/ceros,
   hashes, cobertura, ausencias, revisión concurrente, cancelación y alias aprobado
   de Ferrovial: correctos. Compilación Vite correcta.
2. **Lectura pública de las 73 empresas** mediante el lector nuevo: 104.356
   registros, revisiones verificadas y cálculos ejecutados. Cero escrituras.
   Esta comprobación no certifica independientemente la exactitud del proveedor.
3. **Regresión a 1440, 1280, 1024, 820 y 768 px** con datos sintéticos en memoria:
   cinco gráficos, representación, periodos, Bollinger, tabla, porcentajes y ATR.
   Sin desbordes ni errores JavaScript. No se prueba una versión móvil.
4. A 1440 px: fallos de red, ausencia e integridad OHLCV, acceso a los cierres
   anteriores durante esos fallos, recuperación, cambio de pestaña y cambio de
   empresa con una respuesta OHLCV retenida. Sin mezcla ni respuesta tardía.
   Las pruebas simuladas no consultan servicios externos ni escriben en la base.
5. **Navegador real local**: Iberdrola, cinco gráficos y 256 observaciones en
   un año hasta 03-09-2026; cierre 19,75 EUR, ATR 0,27 EUR, volumen 8.036.969.
   Selección de cierres anteriores conserva el corte de 02-09-2026.
6. **TSK real**: al pedir cinco años muestra únicamente 13-05-2026 a 03-09-2026,
   82 observaciones y aviso de cobertura corta; SMA 200 y métricas sin historial
   suficiente permanecen como «—». Cierre 6,00 EUR, ATR 0,23 EUR, volumen 44.279.
7. **PDF de regresión de 15 páginas** revisado visualmente: gráficos, ejes,
   indicadores, metodología y cuentas legibles. Se corrigió la escala del ATR
   casi constante y se volvió a generar y revisar. Datos sintéticos; no es un
   informe real para entregar. Persiste el aviso de Poppler sobre un glifo Type 3;
   no se certifica PDF/UA ni accesibilidad completa del PDF.
8. **Construcción completa `npm run build` correcta**: validadores del portal,
   regresiones, 30 vistas a 1440 px, generación de `dist/`, comprobación estática
   y nueva ejecución de la matriz de cinco anchos del módulo. Es construcción
   local, no publicación remota.

Evidencias generadas y excluidas del paquete:

- `output/cierre-alfa/ohlcv/reader-2026-09-04T01-38-13-650Z.json`.
- `output/cierre-alfa/fundamentales/tecnico-precios-{ancho}.png`.
- `output/cierre-alfa/fundamentales/tecnico-indicadores-{ancho}.png`.
- `output/cierre-alfa/fundamentales/PRUEBA_TECNICO.pdf` y renders `ohlcv-final-*`.

## Estado de entrega

Velas, volumen y ATR ya están integrados localmente, no pendientes de datos ni
de conexión visual. La carga previa permanece intacta. No hay nuevas escrituras
remotas en esta actuación. Confirmación en Git y publicación: pendientes de orden
específica. No se activa una actualización periódica de datos.

## Orden posterior de publicación · 04-09-2026

Tras comunicar «Queda confirmar y publicar esta tanda», el fundador respondió
«Dale». Quedan autorizadas la confirmación de esta entrega y su publicación en
GitHub Pages mediante el flujo oficial de `main`. No autoriza nuevas cargas,
Firebase Hosting, cambios del backend ni actualización periódica de OHLCV.
La validación completa local anterior se conserva; el resultado del despliegue
debe verificarse en GitHub Actions y en la página publicada antes de anunciarlo.

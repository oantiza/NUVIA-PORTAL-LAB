# Recuperación del análisis técnico en la alfa

Orden: «hazlo», tras detectar que la pestaña técnica no se integró en la alfa.
Alcance: copia local del módulo, sin backend, escrituras ni publicación automática.

## Revisión previa · marco §12

1. Recuperar la lectura histórica de precios de la empresa elegida.
2. Entrada: identidad del índice y cierres ajustados ya publicados en la base propia.
3. Cálculos locales: SMA, EMA, RSI de Wilder, MACD, Bollinger, variabilidad y cambios históricos.
4. Salida: gráficos y cifras descriptivos, con fechas, método y ausencias explícitas.
5. Emisor identificable: sí; clasificación ámbar, con el perímetro de la ficha de empresas.
6. Sin circunstancias personales.
7. Sin sugerencias de operar.
8. Sin opinión de precio futuro.
9. Sin puntuaciones ni ordenación por atractivo.
10. Sin recomendaciones de terceros.
11. Colores identifican series o signos aritméticos, no veredictos.
12. Sin ejecución, contacto ni contratación.
13. Sin remuneración ni patrocinio nuevos.
14. Sin sistemas ni datos de la actividad profesional.
15. Sin datos personales, cuentas ni persistencia nueva.
16. Sin IA en las salidas.
17. Fuente EODHD a través de la base propia; cierre ajustado, fechas y ventanas explícitos.
18. Pruebas numéricas, de transporte, cancelación, identidad, ausencia y render en escritorio/tableta.

## Evidencia y límite de los datos

La proyección existente conserva `points: [{date, value}]`, donde `value` procede
de `adjusted_close`. La consulta de Iberdrola confirmó este formato y cierre hasta
02-09-2026. No hay apertura, máximo, mínimo ni volumen en estas series.
No se obtienen velas ni ATR a partir de cierres. Su recuperación completa necesita
una ampliación de datos que se consultará al fundador antes de escribir.

Se conserva el componente técnico heredado sin conectarlo a su API autenticada.
El nuevo lector es independiente de los fundamentales: una ficha contable ausente
no impide consultar los precios existentes. Solo se consulta al abrir «Técnico».

## Implementación y comprobaciones terminadas

- Cuarta pestaña de la alfa: «Técnico». Línea de cierres ajustados, SMA 50/200,
  RSI 14, MACD 12/26/9 e histograma, Bollinger opcional, cambios históricos,
  volatilidad, caída máxima y extremos de **cierres**, no intradiarios.
- Ventanas de seis meses, uno, tres y cinco años. Se muestran fechas y número
  efectivo de observaciones. Los datos anteriores preparan los indicadores;
  una cobertura corta no se presenta como cinco años completos.
- Lectura anónima GET, sin credenciales ni persistencia nueva. Comprueba identidad,
  moneda, procedencia, fechas, valores positivos, orden, recuentos y versión de
  la ficha antes/después. Cancela al salir, cambiar de empresa o superar el plazo.
  La relectura de ficha detecta cambios de esa ficha; no es una transacción ni
  acredita actualizaciones remotas que modifiquen solo las series sin versionarla.
- Un salto de más de diez días naturales separa tramos y reinicia indicadores.
  No se imputan sesiones ni se enlazan gráficamente los tramos separados.
- Tabla accesible por teclado y explicación de fórmulas, ajustes y ventanas.
  No se incorporan estimaciones, cuentas de usuario ni señales operativas.
- Impresión: captura local de los gráficos, sin transmisión ni almacenamiento
  nuevo; ancho estable, etiquetas completas y métodos desplegados en el PDF.
  Después se restaura el estado previo del desplegable. Desde Técnico se añade
  esta vista al informe fundamental existente, si la ficha está disponible.

### Pruebas

1. Nueve pruebas nuevas de motor, casos manuales de SMA/RSI/MACD/Bollinger,
   calentamiento, series planas y descendentes, fechas, discontinuidades,
   transporte, cancelación, identidad y ausencia. Todas correctas.
2. Compilación del módulo: 62 pruebas correctas y compilación Vite correcta.
3. Construcción completa del portal correcta, con validadores y auditoría de
   30 vistas a 1440 px. Tras los remates de impresión se recompiló y volvió a
   comprobar el módulo, se regeneró dist y pasó su comprobación estática.
4. Regresión del módulo con datos sintéticos a 1440, 1280, 1024, 820 y 768 px:
   tres gráficos, periodos, Bollinger, tabla, independencia de los fundamentales,
   reintento, fallo de red, documento ausente, identidad incorrecta y cancelación.
   Cero desbordes, errores JS o solicitudes externas no simuladas en esos casos.
5. Revisión real de Iberdrola en navegador local, escritorio y tableta: 1.450
   cierres cargados, último 02-09-2026. Ventana anual de 256 observaciones y de
   cinco años de 1.279. Cierre 19,665 EUR, RSI 31,10, SMA50 20,71, SMA200 19,32,
   volatilidad anualizada 11,1 %. Se corrigió durante QA la conversión de
   fracciones a porcentajes; una prueba de presentación evita esa regresión.
   Esta muestra no certifica todos los valores de las 73 empresas.
6. PDF de prueba de 13 páginas revisado visualmente: gráficos, métodos y cuentas.
   Los precios son sintéticos y el fundamental es una fixture; no es un informe
   real de Acciona ni se entrega como tal. Sin páginas vacías ni gráficos cortados.
   Poppler mantiene el aviso conocido de fuentes Type 3; no se certifica PDF/UA.

Evidencias locales, fuera del paquete publicado:

- `output/cierre-alfa/build-tecnico.log` (construcción completa).
- `output/cierre-alfa/build-modulo-tecnico.log` (última compilación del módulo).
- `output/cierre-alfa/render-tecnico-pdf.log` (última regresión de cinco anchos).
- `output/cierre-alfa/fundamentales/tecnico-*.png` y `PRUEBA_TECNICO.pdf`.

## Saldo y siguiente paso

Recuperación local terminada para los cierres disponibles. Sin commits, push,
fusiones, despliegue ni escrituras en la base en esta actuación. La web publicada
no contiene todavía esta tanda. Velas, volumen y ATR necesitan datos OHLCV: antes
de ampliar la carga se presentarán destinos, alcance y autorización al fundador.
No se equipara esta recuperación con la paridad total del módulo heredado.

Actualización 04-09-2026: autorización recibida y [carga OHLCV completada](CARGA_OHLCV_ALFA_20260904.md).
Los datos nuevos ya están en la base, sin alterar los cierres anteriores. Sigue
pendiente su integración visual; el aviso local distingue ahora datos disponibles
de funciones todavía no conectadas. No se ha publicado esta tanda.

Actualización posterior por orden «Go»: [integración OHLCV terminada localmente](INTEGRACION_TECNICO_OHLCV_ALFA_20260904.md).
Velas, volumen y ATR ya se muestran con lector independiente, sin mezclar los
cierres anteriores ni modificar la base. Pendiente confirmar y publicar la tanda.

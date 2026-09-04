# Ajuste visual del módulo de empresas · 04-09-2026

## Encargo y alcance

El fundador autoriza corregir las pestañas, reproducir la estética de sus capturas,
colocar el volumen bajo el precio y retirar los logotipos repetidos si es posible.
Solo copia local `company-analysis/`. No incluye publicación, backend ni escrituras
de datos. La referencia es visual: se conservan métricas, métodos y contenido
descriptivo existentes; no se incorporan los veredictos de la captura.

## Revisión previa (§12)

1. Necesidad: lectura clara, navegación sin recortes y relación temporal precio/volumen.
2. Datos: empresa y serie elegidas por el usuario, fuentes actuales sin modificaciones.
3. Transformación: solo representación y distribución; motores financieros intactos.
4. Resultado: mismos precios, volumen, indicadores y periodos; volumen en escala propia.
5. Emisores identificables: sí, conserva la clasificación ámbar del módulo.
6. Circunstancias personales: ninguna.
7. Consejo de actuación: ninguno; no se añaden señales.
8. Opinión de valor/precio futuro: ninguna.
9. Ordenación por atractivo: ninguna.
10. Recomendaciones de terceros: no se trasladan desde la referencia visual.
11. Colores: verde/rojo solo describen cierre respecto a apertura; no veredictos.
12. Ejecución/contacto: ninguno; único enlace nuevo de crédito técnico.
13. Remuneración: ninguna; atribución de biblioteca, no afiliación.
14. Separación profesional: se conserva, sin menciones ni conexiones bancarias.
15. Datos personales: no se reciben ni guardan.
16. IA en el producto: ninguna añadida.
17. Fuentes/fechas/métodos: se conservan; crédito visible a TradingView y fuente EODHD.
18. Regresión: tests existentes, geometría de pestañas, volumen integrado,
    ausencia de logos por gráfico, crédito visible, impresión y escritorio/tablet.

## Licencia y decisión de implementación

Lightweight Charts 4.2.3 permite desactivar `layout.attributionLogo` si se mantiene
el enlace visible a TradingView y el aviso de atribución. Se conserva el aviso
de la versión utilizada en los activos distribuidos y se añade crédito común.

- https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/LayoutOptions#attributionlogo
- https://github.com/tradingview/lightweight-charts/blob/v4.2.3/NOTICE
- https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-and-volume

## Implementación y validación

- Cuatro pestañas de ancho según su texto, subrayado granate y controles en fila
  propia. Se comprueba el límite real del texto dentro de cada botón.
- Paneles blancos rectangulares, líneas finas, títulos/cifras Fraunces y KPI de
  22 px con etiquetas de 14 px. No se modifica la tipografía del resto de la web.
- Precio/velas y volumen en un mismo lienzo: precio en la zona superior y volumen
  con escala independiente en el 18 % inferior, sincronizados en desplazamiento
  y ampliación. Ausencias de volumen siguen siendo ausencias, no ceros.
- RSI y MACD a continuación; ATR conservado en un panel adicional. Todas las
  métricas, tablas, periodos, fuentes y métodos siguen disponibles.
- Sin logotipos superpuestos. Crédito común visible y archivos NOTICE y LICENSE
  originales distribuidos como activos locales de la compilación.
- Compilación y batería del módulo correctas (76 pruebas).
- Regresión de render e impresión correcta a 1440, 1280, 1024, 820 y 768 px:
  pestañas, cuatro gráficos, KPI, fuentes, tablas, cancelación y errores. Sin
  desbordes ni errores de JavaScript; ninguna conexión nueva a TradingView.
- Revisión visual en navegador con Iberdrola real a 1280 y 820 px: pestañas
  completas, volumen inferior y ausencia de logos; ajuste de notas sin cajas verdes.
- Verificación del sitio estático compilado, privacidad y contrato de resultados:
  correctos. `git diff --check` sin incidencias.

Prueba de impresión: `output/cierre-alfa/fundamentales/PRUEBA_TECNICO.pdf`.
Publicación autorizada expresamente por el fundador el 04-09-2026 («publica»).
Canal: GitHub Pages del repositorio oficial, mediante su flujo de compilación y
validación. La autorización no incluye Firebase ni cambios en la base de datos.
El resultado del despliegue queda registrado en GitHub Actions para el commit
que incorpora este documento.

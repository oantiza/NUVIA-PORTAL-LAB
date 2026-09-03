# Verificación de la base lista · NUVIA

Fecha: 2 de septiembre de 2026. Aviso del fundador: «la base está lista».

## Veredicto

**La conexión del portal local con la base propia funciona. El catálogo contiene 698 instrumentos y se han obtenido análisis reales de dos carteras modelo y de una muestra mixta. No están completas las cuatro composiciones.**

Comprobación en lectura, sin autenticación, contra el proyecto configurado en `js/nuvia-datos.js`: `nuvia-family-wealth`. No se ha cambiado la base, sus reglas, la configuración, el universo, las composiciones ni el código publicable. No se ha publicado ni confirmado ningún cambio. Esta revisión continúa las verificaciones técnicas aplazadas; no sustituye la validación jurídica/compliance pendiente del expediente ámbar.

## 1. Catálogo real

Lectura registrada a las **21:20:15 UTC**. Revisión declarada por el manifiesto: **2026-09-02T19:30:47.355Z**.

| Comprobación | Resultado |
|---|---:|
| Instrumentos declarados / leídos | 698 / 698 |
| Identificadores únicos | 698 |
| Fragmentos del catálogo | 4 |
| Fondos | 617 |
| ETF | 8 |
| Acciones | 73 |
| Entradas sin identificador, nombre o tipo | 0 |
| Cierre más reciente declarado | 02/09/2026 |
| Cierre mínimo declarado | 27/08/2026 |

El catálogo antiguo revisado en la fase 2 tenía 159 instrumentos. Las conclusiones de aquella fotografía no deben usarse como si describiesen el estado actual. La actualización a 698 no significa que todos los instrumentos tengan el mismo cierre ni que estén disponibles todos los productos de las composiciones históricas.

## 2. Carteras modelo

| Composición | Componentes presentes | Comprobación |
|---|---:|---|
| Bolsa mundial indexada | 2 / 4 | Se mantiene bloqueada; faltan dos ETF |
| Grandes cotizadas españolas | 5 / 5 | Fichas e históricos disponibles; análisis abierto en navegador |
| Value de gestoras independientes | 4 / 4 | Fichas e históricos disponibles; análisis abierto en navegador |
| Mitad bolsa mundial, mitad bonos en euros | 3 / 4 | Se mantiene bloqueada; falta un ETF |

Hay **dos identificadores distintos ausentes**, porque uno se repite en dos composiciones:

- `IE00B4L5Y983`: iShares Core MSCI World UCITS ETF USD (Acc).
- `IE00B3XXRP09`: Vanguard S&P 500 UCITS ETF.

No se han sustituido por productos parecidos ni cambiado sus pesos. Incorporarlos requiere confirmar cotización, divisa y cobertura del histórico, y autorización independiente para modificar o cargar la base. El aviso «base lista» se ha utilizado para reanudar la lectura, no como autorización para escribir.

## 3. Fichas e históricos comprobados

Se leyeron **15 fichas**: las 13 referencias presentes de las composiciones y dos instrumentos adicionales para completar la muestra de tipos. Todas respondieron con identidad, tipo, clase económica y divisa EUR. Este resultado es muestral: no certifica individualmente las 698 fichas ni todos sus históricos.

| Recorrido | Series recibidas | Cierres comunes | Desde | Hasta |
|---|---:|---:|---|---|
| Cotizadas españolas | 5 / 5 | 765 | 04/09/2023 | 02/09/2026 |
| Gestoras independientes | 4 / 4 | 744 | 04/09/2023 | 31/08/2026 |
| Fondo + ETF + acción | 3 / 3 | 764 | 04/09/2023 | 01/09/2026 |

Las series entregadas tienen igual longitud dentro de cada recorrido y valores numéricos finitos y positivos. Los cálculos de rentabilidad utilizan una observación menos que el número de cierres, al calcular diferencias entre precios consecutivos; no es una pérdida de datos.

Muestra mixta, elegida únicamente como prueba funcional, no como propuesta de cartera:

- Fidelity MSCI World Index Fund EUR P Acc, `IE00BYX5NX33`.
- Accion IBEX 35 Cotizado Armonizado FI, `ES0105336038`.
- Acciona, `ES0125220311`.

El script diagnóstico utiliza el cliente real con almacenamiento nulo. Su ejecución completa registrada realizó 27 peticiones de lectura, además de comprobaciones puntuales iniciales y las lecturas de la interfaz. `batchGet` usa POST, pero es una operación de lectura de documentos; no se invocó ninguna operación de escritura.

## 4. Prueba de interfaz

- Catálogo cargado en el portal local con 698 instrumentos.
- Búsqueda por ISIN, selección y adición de fondo, ETF y acción a una cartera temporal: correctas.
- Secciones «Qué tienes», «Cuánto se mueve», «Apuestas repetidas» y «Escenarios» generadas con datos reales.
- Los dos modelos completos abren análisis conservando sus cinco y cuatro posiciones, respectivamente. Cambio de fondos a cotizadas y de vuelta a fondos comprobado en sesión limpia.
- Los modelos incompletos permanecen bloqueados e identifican los instrumentos ausentes.
- En los fondos sin desglose aparecen avisos explícitos. En la muestra mixta se declara la cobertura parcial: el 33 % carece de desglose sectorial y el 67 % de desglose regional. No se presenta esa parte desconocida como exposición cero.
- Lecturas de escritorio a 1280 px y del modelo de fondos a 820 px sin desbordamiento horizontal. Se inspeccionó visualmente la tabla de resultados de fondos en tablet. No se probó móvil ni se realizó una nueva auditoría visual de todo el portal.

**Incidencia observada:** un primer intento de pasar de cotizadas al modelo de fondos mostró el aviso genérico de que no se habían podido preparar todas las fichas y mantuvo el análisis anterior. Las fichas respondían correctamente en lectura directa; una nueva sesión abrió ambos modelos y permitió cambiarlos en ambos sentidos. No se ha determinado la causa de aquel fallo transitorio ni se afirma haberlo corregido. Se conserva como punto a vigilar en la revisión final.

## 5. Pendiente concreto de la web: fecha del resultado

La cabecera utiliza el cierre máximo del catálogo, **02/09/2026**, pero los resultados de cada combinación pueden acabar antes: el modelo de fondos termina el **31/08/2026** y la muestra mixta el **01/09/2026**.

Además, el pie de las métricas muestra «Datos de cierre» sin la fecha concreta. La causa identificada en el código es que `nuvia-constructor.js` busca `payload.coverage.last_date`, mientras que `seriesRebasadas()` entrega `dates` y `series`, sin `coverage`. Los cierres sí existen en `dates`.

**Recomendación para el siguiente cambio local:** mostrar el comienzo y el último cierre del historial común a partir de las fechas efectivamente usadas, y diferenciarlo de la fecha general de actualización del catálogo. No requiere escribir en Firebase ni cambiar cálculos. No se ha implementado durante esta comprobación de lectura.

## 6. Pasos siguientes

1. Corregir localmente la fecha visible de cada análisis y añadir una prueba de regresión de ese contrato.
2. Resolver la cobertura de los dos ETF: mantener las composiciones bloqueadas, o preparar su incorporación tras confirmar identidad/cotización y autorización de carga. No reemplazarlos automáticamente.
3. Repetir las pruebas con la versión local definitiva; incluir cambios consecutivos de modelo y registrar el error concreto si reaparece el fallo transitorio.
4. Hacer la revisión independiente de la entrega y completar las puertas funcionales y regulatorias antes de publicar.

«Análisis y valoración de empresas» sigue siendo un trabajo de integración independiente. La existencia del catálogo no activa ese módulo.

## Evidencia y alcance técnico

Diagnóstico y resultado JSON: `output/base-lista/revisar.mjs` y `resultado.json`, ignorados por Git. Servidor de prueba: `output/base-lista/serve.mjs`; permite únicamente lectura del proyecto propio y recursos locales, con almacenamiento en memoria y marcos externos bloqueados. Se añadió al servidor una traza de errores de modelos únicamente para diagnóstico, sin editar el módulo original. Las sesiones no contienen carteras reales del fundador.

No se ha utilizado el cargador de mercado, accedido al proveedor con credenciales, intentado escribir para probar permisos, modificado Firebase, activado empresas ni desplegado nada. Las pruebas corresponden al árbol local y a lecturas reales de la base; **no certifican que el despliegue público incluya ya los cambios locales**.

# NUVIA · Ficha regulatoria de la base de datos propia de la alfa

**Fecha:** 2 de septiembre de 2026 (tarde)

**Entrega:** 2b · Base propia de la alfa (proyecto `nuvia-family-wealth`)

**Redacta:** Claude Fable 5.1, a propuesta. **Clasifica y firma:** el fundador.

**Clasificación:** **ÁMBAR**, confirmada por el fundador el 2 de septiembre de 2026 (tarde), con las tres decisiones registradas al final de esta ficha (§ Decisiones del fundador).

**Clasificación propuesta (texto original):** **ÁMBAR.** La función muestra instrumentos financieros identificables (fondos, ETF y acciones con ISIN y nombre comercial), permite compararlos y calcular sobre ellos, y el universo lo ha elegido el fundador, que es agente financiero vinculado. Ninguno de esos tres hechos es una recomendación, pero los tres están en la lista de supuestos ámbar del marco §12 («instrumento concreto», «comparación sensible», «posible conflicto»). No hay datos personales, IA, llamada a la acción ni remuneración, así que no hay ningún supuesto rojo. Es la misma lógica con la que se clasificó ámbar el análisis de empresas (`FICHA_REGULATORIA_ANALISIS_EMPRESAS.md`).

---

## Cambio

El laboratorio de cartera deja de leer la base de datos profesional del fundador (`bbdd-activos-financieros`, a través de funciones en la nube) y pasa a leer una base **propia, nueva y aislada** en el proyecto Firebase `nuvia-family-wealth`, plan gratuito, región `europe-west1`. Esa base contiene, para un universo cerrado de 161 instrumentos en euros elegido por el fundador: identificación (ISIN, nombre, tipo, clase económica), precios diarios ajustados desde 2021, métricas históricas calculadas por NUVIA con fórmulas publicadas, y, solo para ETF y acciones, la ficha descriptiva que publica el proveedor (domicilio, gastos corrientes, distribución por clase de activo, regiones, sectores y las diez mayores posiciones). Los fondos entran con nombre, clase y precios; el proveedor no publica su desglose.

Los datos se descargan de EODHD con la clave personal del fundador mediante un script que corre en su ordenador y escribe en Firestore; la clave nunca entra en el repositorio ni en la web. **La base se lee en abierto**, sin sesión ni cuenta: cualquiera que abra el laboratorio puede usarla. No hay registro, consentimientos, datos personales ni carteras en la nube: las carteras que el usuario compone se guardan solo en su navegador. «Análisis y valoración de empresas» queda «En preparación» y fuera de la publicación.

---

## Prueba regulatoria (marco §12)

1. **Necesidad educativa o informativa.** Permitir que una persona componga una cartera hipotética con instrumentos reales y vea, con datos históricos y métodos tradicionales, cómo se habría comportado, cómo se reparte y cuánto se solapan sus fondos. Sin base de datos no hay laboratorio; la base profesional del fundador no puede usarse para NUVIA (marco §8, separación).

2. **Datos que recibe y quién los elige.** Dos entradas. (a) El universo de instrumentos, elegido por el fundador en `universo/universo-alfa.csv` con criterios **de cobertura, no de mérito**: instrumentos en euros con histórico disponible en el proveedor, repartidos por clase (fondos de bolsa, de bonos, mixtos, monetarios, ETF, acciones del IBEX y grandes europeas) e incluyendo los cuatro fondos que el laboratorio usa como referencia de bolsa y bonos. La lista no lleva ninguna columna de valoración, puntuación u orden de preferencia. (b) La composición de la cartera hipotética: la elige el usuario, activo a activo y peso a peso, entre los instrumentos disponibles.

3. **Cálculo o transformación.** En el script de carga: rentabilidad a 1 y 3 años, volatilidad anualizada (log-retornos diarios, √252), caída máxima a 3 años, todo sobre el precio ajustado del proveedor, con el método escrito en cada documento (`metrics.method`). En el navegador: lo que el laboratorio ya calcula hoy (evolución rebasada, reparto por clase, sectores y regiones cuando hay datos, solapamiento entre ETF, frontera y proyección), sin cambios de fórmula. No se calcula Sharpe en la base; no se calcula nada que requiera un tipo sin riesgo elegido por NUVIA.

4. **Resultado exacto que muestra.** El catálogo («instrumentos disponibles en la alfa», ordenado por clase y nombre, sin orden de mérito); la ficha de cada instrumento (nombre, tipo, clase, divisa, y para ETF y acciones sector, región, gastos corrientes y desglose del proveedor); las métricas históricas con su fecha y su método; las series rebasadas; y los resultados del laboratorio sobre la cartera que el usuario ha compuesto. Siempre con «Datos a fecha …» del último refresco.

5. **Instrumentos o emisores identificables.** Sí: 161 instrumentos con ISIN y nombre comercial, y las diez mayores posiciones de cada ETF con nombre y país. Es el supuesto ámbar por definición. Mitigación: ningún instrumento se destaca, puntúa ni ordena por atractivo; la ficha muestra hechos del proveedor y cálculos históricos; el lenguaje del laboratorio ya pasa la regresión de expresiones prescriptivas (`check-lenguaje.mjs`).

6. **Circunstancias personales del usuario.** No se piden ni se tratan. No hay perfil, edad, patrimonio, horizonte ni tolerancia al riesgo. La cartera hipotética que compone el usuario se guarda en su navegador y no llega a NUVIA.

7. **Sugerencia de comprar, vender, mantener o no actuar.** No. Se conservan las regresiones actuales de lenguaje y se añade la comprobación de que ningún documento de la base contiene campos de valoración de terceros (§9).

8. **Opinión sobre valor o precio.** No. Se muestran precios históricos y estadísticas descriptivas; no hay precio objetivo, ni «caro/barato», ni previsiones. Las proyecciones del laboratorio siguen presentadas como simulaciones con supuestos a la vista, como hoy.

9. **Puntuar, seleccionar, destacar u ordenar por atractivo.** Este es el punto que exige más cuidado, por dos vías. (a) El universo es una selección: se documenta aquí que el criterio es de cobertura y disponibilidad de datos, no de calidad, y en pantalla se presenta como «instrumentos disponibles en la alfa», nunca como «seleccionados» o «recomendados». (b) El proveedor publica para ETF campos de valoración de terceros (`MorningStar`, `Performance`, `Valuations_Growth`) y para acciones objetivos de precio de analistas (`Highlights`): **el script no los copia** y la batería falla si aparecen en la base. La única ordenación del catálogo es por clase y alfabética.

10. **Recomendación de un tercero reproducida.** No. Los desgloses del proveedor son datos descriptivos de la cartera del ETF, no opiniones. El texto `Description` del emisor tampoco se copia.

11. **Color, diseño o navegación como veredicto.** No cambian respecto del laboratorio actual, que ya fue revisado (fichas de diseño interior y sistema editorial). Los instrumentos sin desglose se marcan como «sin datos», no como cero ni como peor.

12. **Llamada a la acción, contacto, contratación o ejecución.** No existe. No hay enlaces a comercializadores, ni botón de contratar, ni exportación hacia una cuenta real.

13. **Remuneración, patrocinio, afiliación o conflicto.** Ninguna remuneración. El proveedor de datos cobra al fundador una suscripción; NUVIA no le paga ni cobra por él. Posible conflicto: ver 14.

14. **Impacto sobre la condición de agente vinculado.** El fundador elige el universo. Para que esa elección no pueda leerse como orientación profesional: el criterio de cobertura queda escrito aquí y en `universo/universo-alfa.LEEME.md`; la lista no lleva mérito; no se distingue en pantalla entre instrumentos que la entidad representada distribuye y los que no; y no hay ninguna relación técnica con la base profesional (regresión «sin maestra» sobre el código y sobre `dist/`). **Pregunta abierta para el fundador:** confirmar si algún instrumento del universo está vinculado a la entidad representada y, en su caso, si prefiere retirarlo o dejar constancia expresa de que su presencia responde al mismo criterio de cobertura que los demás.

15. **Datos personales y base jurídica.** **Ninguno.** No hay cuentas, registro, correo, consentimientos ni identificadores de usuario en la base. Lo que el navegador guarda localmente (carteras hipotéticas, caché del catálogo) no sale del dispositivo del usuario y se informa en el aviso de tecnologías de almacenamiento (borrador de la Entrega 2). Firestore recibe las lecturas del navegador con la dirección IP del usuario como cualquier servidor web; no se registra ni se explota. Los tratamientos de cuentas se aplazan a una fase posterior con su propia ficha.

16. **IA.** No interviene ninguna IA en la función.

17. **Fuentes, fechas, fórmulas, supuestos y limitaciones mostradas.** Fuente: EODHD, con símbolo y fecha de descarga en cada documento (`source`). Fecha: «Datos a fecha …» visible en el laboratorio, del manifiesto. Fórmulas: `metrics.method` en cada activo y documentación en `docs/INFORME_PARA_CODEX_BASE_DATOS_ALFA_20260902.md` §6. Limitaciones declaradas en pantalla: universo limitado en euros; fondos sin desglose de sectores y regiones (el proveedor no lo publica); desglose de ETF limitado a las diez mayores posiciones; datos de mercado que pueden tener días de retraso; carteras guardadas solo en el navegador. La base se lee en abierto, lo que significa que cualquiera puede consultarla también fuera de la web; es una característica de la alfa, no un tratamiento adicional.

18. **Prueba automática y revisión humana.** Automáticas: batería del script (`docs/nuvia-mercado-alfa.test.mjs`: divisa confirmada, nulos donde no hay dato, ausencia de campos de valoración, métricas sobre serie sintética); batería del portal (`nuvia-datos.test.mjs`, `nuvia-concentracion.test.mjs`); regresión «sin maestra» ampliada (ninguna cadena de la base profesional, de funciones en la nube, de Auth ni de claves en `js/`, `scripts/`, `cartera.html`, flujos de CI y `dist/`); `check-static-site` sin el universo ni el módulo de empresas en `dist/`; `check-lenguaje` sobre los textos nuevos. Humanas: prueba manual del fundador con un fondo, un ETF y una acción antes de integrar; verificación independiente de Claude antes de publicar (recuentos, reglas, pestaña Red, `grep` de `dist/`).

---

## Clasificación y puertas (marco §12–§13)

**Propuesta: ÁMBAR**, por instrumentos identificables, comparación entre ellos y elección del universo por un agente vinculado. No hay supuesto rojo: sin recomendación, señal, precio objetivo, idoneidad, ejecución, derivación ni datos personales.

Consecuencias que el marco impone al ámbar y cómo se cubren:

| Puerta | Cómo se cumple en la alfa |
|---|---|
| Antes del diseño: ficha, clasificación, datos, fuentes, terceros, impacto sobre el agente | Esta ficha; fuentes y terceros en 13, 17; impacto en 14 |
| Antes de programar: resultados y lenguaje permitidos, estados prohibidos, arquitectura revisada, controles previstos | Resultados en 4; lenguaje: el del laboratorio actual más los textos de `docs/PENDIENTE_ALFA_NUVIA_20260902.md` §5.2; estados prohibidos: campos de mérito, estimaciones de lo desconocido, cualquier vínculo con la base profesional; arquitectura en el informe v2 §6–§8; controles en 18 |
| Antes de integrar: revisión de código y contenido, pruebas, verificación de fuentes y fórmulas, sin derivación ni reutilización de datos | Batería completa en verde y prueba manual del fundador; las fórmulas se prueban con serie sintética; sin derivación por diseño |
| Antes de publicar: validación funcional y regulatoria registrada; **validación jurídica o de compliance por ser ámbar**; avisos legales; retirada inmediata | Funcional y regulatoria: verificación de Claude (paso 7) registrada en `docs/`. **Jurídica: pendiente de decisión del fundador** (ver abajo). Avisos: textos de la Entrega 2 en borrador, el de almacenamiento debe estar publicado con la alfa. Retirada: vaciar el proyecto `nuvia-family-wealth` y restaurar la portada «En preparación» del laboratorio; menos de una hora |

**Sobre la validación jurídica.** El marco la exige antes de publicar una función ámbar. La alfa se publica en abierto en la web, así que formalmente aplica. El fundador tiene tres salidas, todas defendibles si quedan escritas: (a) obtener una revisión de compliance breve sobre esta ficha antes de integrar en `main`; (b) publicar la alfa con la validación funcional y regulatoria interna registrada y **anotar en el acta que la validación jurídica queda pendiente y por qué** (fase alfa sin datos personales, sin comercialización, sin recomendación, con retirada inmediata), aceptando el riesgo de forma expresa; (c) reclasificar a verde argumentando que la selección es de cobertura y que no hay comparación distinta de la que el laboratorio ya hacía con la base anterior; esta redactora no lo recomienda porque el marco lista «instrumento concreto» como ámbar sin excepción y porque el análisis de empresas se clasificó ámbar por los mismos motivos.

**Una aprobación interna de producto no equivale a validación jurídica** (marco §13); la opción elegida se anota en el acta con fecha.

---

## Controles

- Regresión «sin maestra» en `check-lenguaje.mjs` y `check-static-site.mjs` (cadenas: `bbdd-activos-financieros`, `nuvia-market-data`, `cloudfunctions.net`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `apiKey` antigua, `api_token=` sin variable).
- Batería del script: divisa confirmada en EUR para todo lo publicado; `exposures` en `null` cuando no hay dato; ausencia de `MorningStar`, `Performance`, `Valuations_Growth`, `Highlights`, `WallStreetTargetPrice`, `rating`, `stars`, `rank`; métricas sobre serie sintética; recuentos por año.
- Batería del portal: sin cabecera de autorización ni llamadas a Auth; catálogo sin orden de mérito; «sin datos de desglose» declarado; carteras solo en el navegador.
- Lectura pública y escritura denegada probadas contra las reglas publicadas.
- Revisión manual del fundador y verificación independiente antes de publicar.

## Decisiones del fundador (2 de septiembre de 2026, tarde)

1. **Clasificación: ámbar.** Confirmada tal como se propone.
2. **Pregunta 14.** El fundador confirma que en el universo de la alfa **hay instrumentos que distribuye la entidad que representa**. Se mantienen. Queda constancia escrita de que **su presencia responde exactamente al mismo criterio de cobertura que el resto** (instrumentos en euros con histórico en el proveedor, repartidos por clase), que la lista no lleva ninguna columna de mérito, que en pantalla no se distingue entre unos y otros y que el catálogo se ordena por clase y nombre. Ningún instrumento se destaca, puntúa ni recomienda; los cálculos son los mismos para todos.
3. **Validación jurídica: opción (b).** La alfa se publica con la validación funcional y regulatoria interna registrada (batería en verde, prueba manual del fundador, verificación independiente de Claude) y **la validación jurídica o de compliance queda expresamente pendiente**, por decisión consciente del fundador y con estos motivos escritos: fase alfa, sin datos personales ni cuentas, sin comercialización, sin recomendación ni señal, datos de mercado bajo la suscripción del fundador, y mecanismo de retirada inmediata (vaciar el proyecto `nuvia-family-wealth` y devolver el laboratorio a «En preparación», menos de una hora). Antes de cualquier apertura comercial, de recogida de datos personales o de ampliación del alcance, la validación jurídica pasa a ser obligatoria.

**Una aprobación interna de producto no equivale a validación jurídica** (marco §13): ambas quedan diferenciadas aquí.

## Resultado

**Apta para desarrollar y para publicar como alfa** con clasificación ámbar y validación jurídica pendiente por decisión expresa del fundador. La verificación independiente de Claude (paso 7) se registra en `docs/` tras la publicación.

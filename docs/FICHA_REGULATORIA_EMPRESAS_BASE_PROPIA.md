# NUVIA · Ficha regulatoria · «Análisis y valoración de empresas» sobre la base propia

> **Estado posterior, 03-09-2026:** [ejecutada la corrección autorizada de Aena y Ferrovial](EJECUCION_IDENTIDADES_AENA_FERROVIAL_20260903.md).
> La lectura confirma **73/73 fichas**, con continuidad documental visible y
> precios conservados. No se añade función inversora, estimación ni dato personal;
> no se modifica clasificación o firma. Los 71 siguientes son el hito anterior.

> **Contraste de implementación, 03-09-2026:** el texto siguiente conserva la propuesta original, no describe por completo el módulo activo. Ver [acta de consolidación y matriz de paridad](CIERRE_LOCAL_ALFA_20260903.md). La entrada actual es `src/alfa/`: lectura anónima de la base propia con 71 fichas verificadas y respaldo local explícito; sin API antigua ni escrituras. Ver [conexión y prueba de función](CONEXION_FUNDAMENTALES_BASE_PROPIA_20260903.md). Muestra cálculos de margen y porcentajes, magnitudes originales y fechas reales disponibles, sin inventar escala ni descarga. Los huecos de estimaciones descritos en la pregunta 8 no están presentes en la entrada activa y su exclusión tiene prueba con valores numéricos. La pregunta 9 no es una cita literal del marco: sus §§5–6 contemplan comparaciones descriptivas por variables objetivas. No se adopta aquella prohibición general como una nueva decisión del fundador. Cualquier ampliación se consulta conforme al marco v1.2 §0; no se implementan aquí comparadores. La clasificación y las firmas no se sustituyen ni se atribuyen al fundador mediante esta nota.

**Fecha:** 3 de septiembre de 2026 · **Marco:** v1.1, §12 (prueba de 18 preguntas) y §13 (puertas).

**Función:** reconstrucción del módulo de empresas (`company-analysis/`) sobre la base propia de la alfa, sustituyendo la lectura de la base profesional y de las funciones en la nube.

**Redacta:** Claude Opus 5, a petición del fundador. **Clasifica y firma:** el fundador.

**Clasificación propuesta: ÁMBAR.** Muestra emisores identificables y ratios calculados sobre ellos. No hay supuesto rojo: sin recomendación, señal, precio objetivo propio, idoneidad, ejecución, derivación ni datos personales.

**Estado:** ficha previa al desarrollo, sometida a la decisión del fundador. Conforme a las órdenes permanentes de 03-09-2026 (`ORDENES_PERMANENTES_FUNDADOR_ALFA_20260903.md`), **esta ficha no bloquea nada**: expone hechos, norma y salidas para que el fundador ordene. El trabajo local existente (`company-analysis/local/`, `src/local/`, `local.html`) continúa salvo orden en contrario suya.

---

## Decisiones del fundador ya incorporadas (03-09-2026)

1. **Los ratios entran.** El fundador declara no ver conflicto regulatorio en PER, ROE, ROA, márgenes, crecimientos, P/VC, P/Ventas, EV/Ventas y EV/EBITDA. Esta ficha los admite **como hechos calculados sobre cuentas publicadas** y fija abajo el límite exacto (§ pregunta 9).
2. **Validación jurídica fuera de alcance en la alfa**, conforme al marco v1.1 §0 y a la orden expresa del fundador. No es una puerta pendiente ni un bloqueo. Fuera de la alfa se aplica el régimen general.

Estas dos decisiones **no reclasifican la función a verde**: sigue siendo ámbar y conserva todas las revisiones internas.

---

## Prueba regulatoria (marco §12)

**1. Necesidad educativa o informativa.** Permitir que una persona entienda cómo se lee una empresa cotizada: de dónde salen sus ingresos, qué margen deja, cuánto debe y cuánta caja genera, y qué significan los ratios que la prensa financiera cita sin explicar. Es contenido formativo con datos reales, no un buscador de oportunidades.

**2. Datos que recibe y quién los elige.** Dos entradas. (a) El universo: las acciones ya presentes en el universo cerrado de la alfa (`universo/universo-alfa.csv`), elegidas con criterio de cobertura, no de mérito; no se amplía el universo por este módulo. (b) La empresa concreta: la elige el usuario buscando en el catálogo. El módulo **no propone** ninguna empresa, ni destacada, ni por defecto, ni «populares».

**3. Cálculo o transformación.** Ninguno propio sobre el futuro. Se conservan de EODHD los tres estados anuales (resultados, balance, flujos) tal como los publica el emisor, y los ratios históricos que el proveedor calcula sobre cuentas ya publicadas. NUVIA no recalcula, no anualiza, no estima y no rellena huecos. Cuando falta un dato, se muestra «sin dato»: nunca cero, nunca inferido.

**4. Resultado exacto que muestra.** Ficha de identidad (nombre, ISIN, ticker, mercado, sector, industria, país, divisa); tres estados por ejercicio con su cierre, su moneda y su escala declaradas; ratios históricos con su fecha de observación; y los avisos de calidad de cada registro. Siempre con fuente y fecha a la vista.

**5. Instrumentos o emisores identificables.** Sí, por definición: es el supuesto ámbar. Mitigación: ninguna empresa se destaca, puntúa ni ordena por atractivo; solo se muestra la que el usuario ha buscado.

**6. Circunstancias personales del usuario.** Ninguna. No hay perfil, patrimonio, horizonte ni tolerancia al riesgo. No hay cuentas en la alfa.

**7. Sugerencia de comprar, vender, mantener o no actuar.** No. Se mantiene la regresión de lenguaje (`check-lenguaje.mjs`) y la puerta `check-company-regulatory.mjs`, ampliada a `src/local`.

**8. Opinión sobre valor o precio.** No, y aquí está el límite más delicado del módulo. **Se admite el ratio histórico; se prohíbe toda estimación de terceros sobre el futuro.** Quedan expresamente fuera:

| Campo | Motivo |
|---|---|
| `ForwardPE` («PER estimado») | previsión de consenso sobre beneficios futuros |
| `EPSEstimateNextYear`, `epsEstimate` | estimación de analistas |
| `ForwardAnnualDividendRate` («Dividendo anual estimado») | previsión, no hecho |
| `WallStreetTargetPrice` | precio objetivo de terceros (supuesto rojo) |
| `MorningStar`, `Valuations_Growth`, `Performance`, `rating`, `rank`, `score` | mérito y puntuación de terceros |

**Incidencia detectada al redactar esta ficha:** el componente `FundamentalTab.jsx` oculta «PER estimado» y el BPA estimado tras la bandera `historicalOnly`, pero **«Dividendo anual estimado» (línea 151) y `epsEstimate` (línea 200) no están tras esa bandera**. Hoy salen vacíos porque el adaptador local no los alimenta, pero el hueco existe y debe cerrarse antes de programar nada más.

**9. Puntuar, seleccionar, destacar u ordenar por atractivo.** No, y esta es la frontera que fija la decisión del fundador sobre los ratios:

> **El dato, sí. La ordenación, no.** Mostrar el PER, el ROE o el EV/EBITDA de la empresa que el usuario ha buscado es informar sobre un hecho calculado. Ordenar, filtrar, comparar o colorear un conjunto de empresas por cualquiera de esos ratios es puntuar por atractivo inversor, que el marco §12-9 prohíbe sin excepción.

En consecuencia queda **prohibido en este módulo**: cribadores y filtros por ratio, listas «mejores/peores», rankings, ordenaciones por valor de un ratio, comparativas entre empresas basadas en ratios, semáforos o colores que califiquen un ratio como bueno o malo, y percentiles o comparaciones contra sector o índice. Se permite: la ficha de **una** empresa cada vez, y la serie temporal de **esa misma** empresa.

**10. Recomendación de un tercero reproducida.** No. Ni precios objetivo, ni consenso, ni ratings, ni el texto descriptivo del emisor.

**11. Color, diseño o navegación como veredicto.** No. Los ratios se muestran en texto neutro, sin verde/rojo de valoración. Rojo y verde quedan reservados a cifras contables negativas y positivas, que es su significado aritmético, no un juicio. «Sin dato» se marca como ausencia, nunca como cero ni como peor.

**12. Llamada a la acción, contacto, contratación o ejecución.** Ninguna. Sin enlaces a comercializadores, sin botón de contratar, sin exportación hacia una cuenta real.

**13. Remuneración, patrocinio, afiliación o conflicto.** Ninguna remuneración. El proveedor cobra al fundador una suscripción; NUVIA no cobra ni paga por él.

**14. Impacto sobre la condición de agente vinculado.** El universo ya está fijado por la ficha de la alfa con criterio de cobertura y contiene instrumentos que distribuye la entidad representada, con constancia escrita. **Este módulo no amplía el universo ni distingue en pantalla entre unos emisores y otros.** Se mantiene la separación técnica total respecto de `bbdd-activos-financieros`: la reconstrucción sustituye `company-analysis/src/api.js` (que hoy apunta a las funciones de la base profesional y exige sesión) por lectura REST de la base propia sin sesión, y la regresión «sin maestra» se extiende a `company-analysis/`.

**15. Datos personales y base jurídica.** Ninguno. Sin cuentas, sin registro, sin identificadores de usuario. Lo que el navegador guarde localmente no sale del dispositivo.

**16. IA.** No interviene ninguna IA en la función. Los textos explicativos de indicadores son estáticos y revisados.

**17. Fuentes, fechas, fórmulas, supuestos y limitaciones.** Fuente: EODHD, bajo la suscripción del fundador, con símbolo y huella del archivo de origen. Cuatro fechas separadas y nunca intercambiables: **cierre del ejercicio, presentación, actualización del proveedor y descarga**. Limitaciones declaradas en pantalla: cobertura parcial (solo las acciones del universo de la alfa); escala y moneda declaradas por estado y nunca supuestas; ejercicios ausentes mostrados como ausentes; entidades financieras señaladas como no comparables con la plantilla industrial; datos que pueden estar desactualizados respecto del último cierre publicado.

**18. Prueba automática y revisión humana.** Automáticas: `check-company-regulatory.mjs` (ampliada a `src/local`); regresión «sin maestra» extendida a `company-analysis/`; validador del contrato (`local/contract.mjs`) y sus baterías; y —**requisito nuevo de esta ficha**— una batería que falle si aparece cualquiera de los campos prohibidos de la pregunta 8 y si existe cualquier ordenación, filtro o comparación entre empresas por un ratio. Humanas: revisión del fundador antes de integrar y verificación independiente antes de publicar.

---

## Control de campos: propuesta técnica sometida al fundador

El control vigente, `clavesProhibidasEn` en `scripts/mercado-alfa/proyecta.mjs`, funciona **por nombre de clave**: bloquea que aparezca un objeto llamado `Highlights`. El adaptador local copia los valores de `Highlights` a un objeto llamado `metrics`, de modo que el control deja de verlos. No es una infracción —los campos elegidos son legítimos— pero **el control ha dejado de proteger**.

Propuesta que se somete a su decisión, no condición impuesta:

1. El contrato de fundamentales declara una **lista blanca cerrada** de campos admitidos.
2. La batería falla si aparece un campo **no declarado**, en lugar de fallar solo ante nombres conocidos.
3. La lista de la pregunta 8 se comprueba además por nombre, como red de seguridad.

---

## Identidad: consulta al fundador

Se propone no generar fundamentales para un instrumento cuyo ISIN, símbolo/mercado y divisa no coincidan entre el catálogo de la alfa y el proveedor. **Ferrovial es el único caso detectado**: `ES0118900010` en el catálogo frente a `NL0015001FS8` en EODHD, siendo el neerlandés el identificador vigente. No se bloquea por iniciativa propia: **el fundador decide** si se corrige el universo, si se excluye el valor mientras tanto o si se deja como está.

---

## Puertas (marco §13)

| Puerta | Estado |
|---|---|
| Antes del diseño: ficha, clasificación, datos, fuentes, impacto sobre el agente | **Esta ficha**, a la espera de la orden del fundador |
| Antes de programar: resultados y lenguaje permitidos, estados prohibidos, arquitectura, controles | Preguntas 4, 8, 9 y 11; lista blanca y batería de mérito propuestas, a la espera de su orden |
| Antes de integrar: revisión de código y contenido, pruebas, fuentes y fórmulas, sin derivación | Pendiente |
| Antes de publicar: validación funcional y regulatoria; **validación jurídica: fuera de alcance en la alfa** (marco v1.1 §0); avisos; retirada | **La publicación la ordena y autoriza el fundador.** La retirada, si alguna vez procede, también |

---

## Resultado propuesto

**Apta para desarrollar** con clasificación **ámbar**. El desarrollo continúa.

Cinco puntos se someten a la decisión del fundador, sin detener el trabajo mientras decide:

1. Firma de esta ficha y de su clasificación ámbar.
2. Cierre de los dos huecos de estimación del componente («Dividendo anual estimado» y `epsEstimate`).
3. Sustitución del control por lista blanca de campos declarados.
4. Identidad de Ferrovial.
5. Prohibición explícita, en código y en batería, de cualquier ordenación o comparación entre empresas por ratio.

**La publicación la ordena y autoriza el fundador**, conforme a las órdenes permanentes de 03-09-2026.

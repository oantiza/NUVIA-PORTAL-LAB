# Fundamentales · monedas, escalas y comparabilidad

Fecha: 03-09-2026. Continuación del plan mediante «sigue».
Estado: diagnóstico en vivo, ajustes locales y verificaciones completados.
Sin escrituras remotas, publicación, conversiones ni retirada de datos.

> **Continuación:** [contraste documental de Logista y Pernod Ricard](CONTRASTE_EMISORES_METADATOS_20260903.md).
> Moneda de las tablas originales acreditada; diferencias de definición y fechas
> pendientes, sin completar la base. Las comprobaciones de fechas siguientes son
> de formato/ausencia y temporalidad, no certificación de la presentación oficial.

## 1. Conclusión ejecutiva

Las 73 empresas responden correctamente desde la base propia. Disponibilidad y
validez estructural no equivalen a exactitud contable o comparabilidad de todos
sus históricos. Se han revisado 219 estados, con 5.331 filas anuales, y 5.089
comunicados de BPA. La revisión no es una conciliación de cada cifra con cuentas
auditadas del emisor.

Los problemas de metadatos se concentran en los históricos antiguos, salvo tres
filas recientes sin moneda: resultados y flujos de Logista al 30-09-2025, y balance
de Pernod Ricard al 30-06-2026. Ninguno se ha rellenado por inferencia.

La escala requiere un trabajo adicional: el proyector actual asigna `scale: null`
y el contrato solo admite ese valor. Por tanto, encontrar 5.331 escalas nulas
demuestra una limitación del dato servido y de su modelo, **no demuestra que el
proveedor carezca de toda documentación sobre unidades**. No procede completar
`scale: 1` de forma masiva ni añadir euros a todas las cifras.

## 2. Alcance y evidencia reproducible

- Inicio: **03-09-2026, 10:36:30 UTC**.
- Índice compilado de 73 empresas; dos documentos por identidad: ficha del activo
  y `fundamentals/current`. **146 GET**, sin credenciales, sesión ni respaldo local.
- 73 respuestas de fundamentales válidas; cero fallos; cero escrituras remotas.
- Sin descarga nueva del proveedor, sin lectura de cuentas o carteras de personas.
- Auditor reproducible: `node scripts/check-company-metadata-live.mjs`.
- Resultado detallado local: `output/auditoria-metadatos/lectura-2026-09-03T10-36-30-092Z.json`.
  Incluye fechas, procedencia y periodos afectados por empresa; no guarda crudos
  con personas ni consulta colecciones ajenas a estas fichas.

El auditor queda fuera de la compilación: construir la web no lanza esta revisión
en vivo. La lectura mide lo que existe en ese momento, no verifica actualización
automática posterior ni sustituye una conciliación con fuentes primarias.

## 3. Resultados

| Comprobación | Resultado | Interpretación |
|---|---:|---|
| Empresas disponibles | 73/73 | Contrato e identidad correctos en la lectura |
| Estados anuales | 219 | Tres por empresa |
| Filas anuales | 5.331 | Todo el histórico servido, no solo cinco ejercicios |
| Moneda EUR declarada | 4.759 | Se conserva el código recibido |
| Moneda USD declarada | 219 | No se convierte por cotizar en euros |
| Código ESP declarado | 23 | Histórico conservado, separado de EUR |
| Moneda sin informar | 330 | No se hereda de otra fila ni de la cabecera |
| Escala no acreditada en el contrato | 5.331 | Limitación del modelo actual y evidencia pendiente |
| Fecha de presentación ausente | 206 | No se sustituye por cierre o descarga |
| Filas sin ninguna de las cifras seleccionadas | 12 | Nulos; no significa que el informe original completo esté vacío |
| Moneda de fila distinta de la cotización | 242 | Diferencia de conceptos, no necesariamente error |
| Moneda de fila distinta de la cabecera del estado | 25 | Requiere contextualizar; no sobrescribir la fila |
| Empresas con últimos cierres distintos | 1 | Pernod Ricard |
| Fechas anuales futuras a la observación | 0 | Cierre y presentación comprobados |
| Comunicados de BPA | 5.089 | Historial del proveedor |
| Comunicados de BPA sin moneda | 863 | Sin completar con la moneda de cotización |
| Comunicados de BPA con fechas futuras | 0 | Periodo y publicación comprobados |
| Periodos de BPA repetidos | 0 | No detectados en esta lectura |

Los cinco últimos registros por estado suman **1.089 filas**: 1.041 EUR, 45 USD
y 3 sin moneda. Son cinco registros disponibles, no una certificación de cinco
ejercicios consecutivos y completos. TSK mantiene solo tres por estado.

### Casos concretos

1. **Logista (`LOG.MC`)**: resultados y flujos del 30-09-2025 sin moneda tanto
   en la fila como en la cabecera respectiva. El balance sí declara EUR. Esa
   diferencia no autoriza a propagar la moneda a los otros dos estados.
2. **Pernod Ricard (`RI.PA`)**: balance al 30-06-2026 sin moneda; resultados y
   flujos llegan al 30-06-2025. No combinar sus últimas filas como un mismo año.
3. **ArcelorMittal, Prosus y TotalEnergies**: los cinco últimos registros de los
   tres estados declaran USD, mientras la cotización consultada es EUR. Mantener
   ambos conceptos diferenciados es correcto; no es una petición de conversión.
4. **`IES.XETRA`**: los tres estados de 2014 declaran USD frente a cabeceras EUR.
   Se conserva la discrepancia y se advierte junto a los estados seleccionados.
5. **ESP frente a EUR**: 23 filas antiguas con ESP; 22 difieren de una cabecera
   EUR y una tiene cabecera ausente. Más los tres casos de IES: 25 discrepancias.
   No se aplica ningún tipo de cambio o redenominación sin evidencia del registro.
6. **Filas sin cifras seleccionadas**: balances de BBVA (1989/1990), Santander
   (1987–1990), Kering (2002), Merlin (2013), Telefónica (1986); resultados y
   balance de ANE (2017), y resultados de Colonial (2000). Permanecen visibles
   como ausencias, no se eliminan ni se convierten en cero.
7. **Aena**: la continuidad de identidad y el ajuste de precios ya verificados
   no prueban un ajuste homogéneo del BPA o del dividendo por acción. La interfaz
   lo aclara sin dividir cifras por diez ni aplicar un segundo ajuste.

## 4. Contraste documental

La [documentación de fundamentales de EODHD](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds)
distingue estados, fechas y moneda, pero la página consultada no acredita una
escala uniforme para todas estas filas históricas. No se extrapola una muestra
a todo el catálogo.

El [glosario del propio proveedor](https://eodhd.medium.com/fundamentals-glossary-common-stock-bbdd45a01e58)
define `CurrencyCode` como moneda de negociación; `EarningsShare` como BPA
diluido TTM; `DividendShare` como dividendo pagado por acción TTM; `BookValue`
como valor contable por acción MRQ; y `epsActual` del historial como BPA no GAAP.
Esto permite precisar etiquetas, no afirmar que las distintas series son equivalentes.

El mismo glosario asocia `CountryName` al país del mercado. Por ello, el valor
España en la cotización madrileña de Ferrovial no demuestra, por sí solo, un error
en el domicilio del emisor. No se modifica ese campo ni se interpreta como
evidencia del domicilio societario actual.

## 5. Ajustes locales aplicados

- Se sustituye la afirmación genérica «no se mezclan monedas» de los gráficos por
  una leyenda precisa. Si no hay moneda, se explica que la agrupación de filas
  desconocidas no acredita una divisa común ni su comparabilidad. Con moneda
  conocida, tampoco se promete una escala contable homogénea.
- Se muestran avisos específicos junto al estado cuando los registros elegidos
  tienen monedas distintas, moneda ausente o contradicen la cabecera. Se conservan
  todas las tablas, filas, barras y cifras, incluidas pérdidas y ceros.
- Se precisan los rótulos de BPA diluido TTM, dividendo por acción TTM, rentabilidad
  por dividendo TTM, pay-out TTM y valor contable por acción MRQ. Se mantienen
  ayudas explicativas interactivas para los cinco rótulos.
- El historial de BPA distingue su definición no GAAP y declara que no se ha
  acreditado un ajuste uniforme por desdoblamientos. No se transforma en BPA
  contable ni se construye una comparación con series no equivalentes.
- Se aclara el alcance real del selector de BPA: cinco/diez limita a veinte/
  cuarenta comunicados; no garantiza cinco/diez años completos. El número de
  registros y los datos disponibles permanecen igual; cambiar la selección a
  ejercicios fiscales exactos es una mejora separada pendiente.
- Se añade diagnóstico reproducible por empresa, sin integrarlo como puntuación,
  semáforo, filtro de atractivo o bloqueo de acceso.

## 6. Revisión del cambio · §12 del marco

1. Necesidad: describir las limitaciones sin atribuir unidades no demostradas.
2. Entradas: datos empresariales saneados existentes; ningún perfil de visitante.
3. Transformación: recuentos, detección de discrepancias y presentación; sin ajustes.
4. Salida: las mismas cifras, acompañadas de rótulos y avisos más precisos.
5. Emisores: presentes; se conserva la clasificación vigente de la función.
6. Circunstancias personales: ninguna.
7. Consejo de operar: ninguno.
8. Previsión: no se añade; siguen excluidos PER, BPA y dividendos estimados.
9. Atractivo: no se puntúan ni ordenan empresas mediante el diagnóstico.
10. Recomendaciones de terceros: ninguna.
11. Diseño: no se añaden veredictos ni semáforos de inversión.
12. Acción: consulta e impresión existentes; no contratación ni derivación.
13. Remuneración: sin cambios.
14. Separación profesional: solo proyecto y base propios autorizados.
15. Datos personales: no se consultan ni se almacenan.
16. IA: no se introduce en la interpretación automática de la web.
17. Fuente: se conservan procedencia, fechas y valores; evidencia con límites explícitos.
18. Pruebas: diagnóstico puro, ausencia de mutaciones, render y regresión del portal.

No se cambia el marco, no se introduce un bloqueo regulatorio, no se exige
validación jurídica externa para avanzar en la alfa ni se autoriza publicación.

## 7. Pendientes y siguiente paso

La **auditoría de metadatos queda realizada**; la acreditación y eventual
corrección de los datos no está cerrada. Orden propuesto, sin ejecutar escrituras:

1. Obtener evidencia específica de las tres filas recientes de Logista/Pernod
   Ricard; contrastar los cierres de esta última con documentos del emisor.
2. Documentar por campo la unidad original, moneda, escala y tratamiento de
   revisiones. No basta con observar el tamaño de una cifra. Priorizar casos
   industriales, financieros, USD/EUR y una transición histórica.
3. Si la evidencia permite completar metadatos, preparar una evolución versionada
   del contrato. El esquema actual no admite escalas acreditadas distintas de
   nulo. Detallar la migración y pedir permiso antes de escribir en la base.
4. Mantener pendientes los ajustes por acción hasta acreditar alcance y método;
   no usar una corrección de precios como prueba de corrección del BPA.
5. Continuar ahora con la **paridad complementaria**: fechas de dividendos y
   campos institucionales. Delimitar campos y disponibilidad; no cargar nombres
   personales ni datos nuevos sin la autorización correspondiente.

Siguen después las decisiones sobre dos ETF, contenido editorial y preparación
de entrega. Confirmación, integración, publicación y cambios remotos requieren
sus órdenes concretas. El vídeo permanece al final.

## 8. Verificación

- Lectura real: 73/73 empresas; 146 consultas GET; cero escrituras.
- Pruebas específicas de diagnóstico y render: superadas, incluidos ceros,
  pérdidas, moneda ausente, moneda distinta de cabecera y advertencias de BPA.
- **46/46 pruebas de fundamentales superadas**, cuatro nuevas de diagnóstico y
  regresión de las nuevas leyendas, rótulos y botones de ayuda.
- **Compilación completa del portal superada**: 30 vistas a 1440 px sin fallos
  del auditor y comprobación del sitio generado. Persisten los mensajes de
  consola conocidos del motor de plantillas; no se afirma haberlos eliminado.
- Tras el último ajuste de ayudas se ha vuelto a compilar el módulo, generar
  `dist/`, verificar sus 19 páginas estáticas y repetir la matriz del módulo a
  **1440, 1280, 1024, 820 y 768 px**: cero desbordes o errores JavaScript,
  manteniendo pruebas de respaldo, reintento y cancelación. No se ha probado móvil.
- Navegador real a 909 px, con Pernod Ricard desde la base: leyenda de moneda
  desconocida, nota de BPA y alcance de comunicados presentes; ayuda del BPA
  abierta y cerrada, captura inspeccionada y cero desborde horizontal.
- Comprobación de formato de diferencias correcta. No quedan pruebas en marcha.

La compilación completa precedió al último añadido de textos de ayuda; este
último cambio se verificó en el módulo y paquete final, sin repetir las 30 vistas
del portal que no se modificaron. No se ha regenerado ni revisado un PDF en esta
entrega; la cobertura de impresión anterior queda como antecedente.

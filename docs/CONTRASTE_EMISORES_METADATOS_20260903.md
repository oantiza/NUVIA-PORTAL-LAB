# Fundamentales · contraste de las tres filas recientes sin moneda

Fecha: 03-09-2026. Continuación del plan de cierre por orden «sigue».

> **Continuación posterior:** [lectura actual del proveedor y aclaraciones locales](APLICACION_ACLARACIONES_FUNDAMENTALES_20260903.md).
> Las carencias persisten en la respuesta consultada. Se precisan fechas y avisos
> en pantalla/impresión sin cambiar cifras ni escribir en la base.

**Resultado:** evidencia documental obtenida y contraste local reproducible. No
se han corregido cifras, completado metadatos remotos, cambiado contratos,
ocultado funciones ni publicado la web. La acreditación global del histórico no
queda cerrada con esta muestra.

## 1. Qué se ha aclarado

Las tablas originales identifican EUR en los tres estados pendientes. Además de
esa ausencia de metadatos, aparecen diferencias de definición que impiden
certificar en bloque sus quince campos. La igualdad numérica, tras expresar la
referencia en unidades base, no prueba por sí sola equivalencia contable.

La copia almacenada no es una reproducción literal de todas las líneas del emisor.
Conviene separar cuatro hechos: moneda del documento, unidad de su tabla,
definición del campo y transformación del proveedor. Ninguno se hereda
automáticamente del mercado en el que cotiza la empresa.

## 2. Logista · cierre 30-09-2025

Las [cuentas consolidadas FY25](https://www.logista.com/content/dam/documents/logista-corporate/economic-financial-information/financial-reports/en/3.%20Consolidated%20Report%20-%20Logista%20%20FY25.pdf)
presentan resultados y flujos en **miles de euros**, páginas físicas 12 y 15.
Se ha inspeccionado la traducción inglesa; el documento indica que prevalece el
original español. Tabla siguiente expresada en millones para facilitar la lectura:

| Campo | Base | Referencia | Conclusión |
|---|---:|---:|---|
| Ingresos | 13.536,241 | 13.536,241 | Coincide |
| Beneficio bruto | 906,898 | 1.808,711 | Definición pendiente |
| Resultado operativo | 318,401 | 318,401 | Coincide |
| Resultado atribuible a la dominante | 281,072 | 281,072 | Coincide; no es el resultado total |
| EBITDA | 402,974 | — | Sin conciliar |
| Flujo operativo | 601,178 | 601,178 | Coincide |
| Inversión material | 44,838 | −44,838 | Coincide en magnitud, no signo |
| Flujo libre | 556,340 | 601,178 − 44,838 | Derivado; no línea publicada equivalente |
| Dividendos pagados | 275,943 | −275,943 | Coincide en magnitud, no signo |

**Comparabilidad pendiente:** el capex almacenado de 2024 coincide con material
más intangible (38,674 + 8,411 = 47,085); en 2025 coincide solo con material,
excluyendo 9,598 de intangibles. Esto afecta al FCF derivado. No se sustituye
ninguno por una fórmula nueva ni se califica automáticamente como error del proveedor.

## 3. Pernod Ricard · cierre 30-06-2026

La [presentación FY26 del emisor](https://www.pernod-ricard.com/system/files/2026-08/Pernod%20Ricard%20FY26%20Financial%20Communication.pdf)
se publicó el **27-08-2026**. El balance, páginas 60–61, está en **millones de
euros**. El cierre 2026 es real, no una fecha futura errónea. La presentación
advierte que el informe de los auditores aún debía emitirse; no se presenta como
el documento anual definitivo auditado. Importes en millones:

| Campo | Base | Referencia | Conclusión |
|---|---:|---:|---|
| Activos | 37.297 | 37.297 | Coincide |
| Pasivos | 20.757 | 15.744 + 5.013 | Coincide con suma identificada |
| Patrimonio atribuible al grupo | 15.500 | 15.500 | Excluye minoritarios |
| Caja | 1.993 | 1.999 | Referencia incluye derivados; no equivalencia acreditada |
| Deuda neta | 10.685 | 10.662 | Diferencia de 23; definición pendiente, página 19 |
| Deuda total | 12.678 | — | Sin conciliar |

Nuestra copia conserva resultados y flujos hasta junio de 2025, aunque el emisor
ya comunicó resultados de 2026. Es una actualización parcial de la **copia
guardada**, no prueba de que la API actual del proveedor carezca de esos datos.
No se consultó de nuevo esa API ni se cargó el ejercicio faltante.

## 4. Fechas: validación formal no equivale a acreditación

Las tres filas almacenan `reportedAt` igual al cierre. Para Logista, la página 1
del documento sitúa la formulación el 05-11-2025; para Pernod, la comunicación
está fechada el 27-08-2026. Esas fechas **no son sustitutos automáticos de la
fecha de presentación oficial**.

El [glosario del proveedor](https://eodhd.medium.com/fundamentals-glossary-common-stock-bbdd45a01e58)
distingue `filing_date` de la fecha de cierre. La auditoría anterior comprobó
ausencias, formato y fechas futuras; no certificó la presentación efectiva de
cada fila. Se precisa su alcance, sin cambiar retrospectivamente los datos.

## 5. Cómo se ha hecho y qué queda entregado

- Lectura anónima de dos activos y sus dos documentos `fundamentals/current`,
  seguida de una repetición registrada: **8 GET a la base en esta actuación**,
  cero escrituras, sin respaldo local, credenciales o consultas de personas.
- Dos PDF descargados de los emisores; comprobación de tablas renderizadas y
  extracción de texto. Sus huellas SHA-256 quedan registradas.
- [Registro de evidencia por campo](evidence/fundamentales-emisores-20260903.json):
  quince campos, tres filas, identidad, periodo, página física, moneda, unidad
  del documento, correspondencia y límites. No se incluye en la web.
- Comparador: `node scripts/check-company-issuer-evidence.mjs`. Exige los PDF
  locales con su hash y el índice compilado; consulta exclusivamente las dos
  identidades. No descarga documentos silenciosamente ni utiliza claves de API.
- Resultado de la repetición: `output/metadatos-fuentes/contraste-2026-09-03T12-30-54-000Z.json`.
  Conserva valores seleccionados, fechas, procedencia y huellas del proveedor.

El comparador transforma exclusivamente la **referencia de contraste**, nunca
los importes guardados. Seis correspondencias directas coinciden numéricamente;
dos son derivadas; dos requieren la convención de desembolso positivo; tres
muestran diferencias sin equivalencia resuelta; dos carecen de referencia
conciliada. Esto no es una nota de calidad, clasificación de inversión o bloqueo.

Las cifras de referencia están transcritas y revisadas: el programa verifica la
aritmética contra esa transcripción, no interpreta automáticamente los PDF.
El análisis del capex 2024 es documental y no forma parte de las quince
comparaciones automáticas, limitadas a las tres filas recientes.

## 6. Aplicación propuesta, por orden

1. **Aclarar definiciones:** beneficio bruto y EBITDA de Logista; perímetro del
   capex/FCF por ejercicio; caja y deuda de Pernod. Contrastar primero el dato
   disponible y su documentación. No sobrescribir discrepancias con otra magnitud.
2. **Comprobar cobertura FY26 de Pernod:** preparar una lectura acotada de
   resultados y flujos del proveedor, sin estimaciones ni personas. Si hay
   registros nuevos, elaborar una propuesta de carga con identidad, campos,
   periodos, diferencias y documento de destino exactos.
3. **Diseñar metadatos trazables:** distinguir multiplicador de la tabla original
   del multiplicador del valor almacenado; registrar fuente, página, ejercicio,
   revisión y definición por campo. Un PDF en miles no autoriza a multiplicar
   por mil una cifra de la base que ya viene en unidades completas.
4. **Presentar el cambio exacto y pedir permiso antes de escribir.** No hay
   permiso nuevo para editar la base en este «sigue». El contrato vigente exige
   `scale: null`: una evolución exige diseño y pruebas previas, sin migración
   masiva ni completar las 5.331 escalas por extrapolación.
5. **Después de una carga autorizada:** repetir el contraste, verificar que los
   campos ajenos no cambian y comprobar pantalla/impresión. Mantener visibles
   los datos y sus límites; consultar cualquier decisión de alcance.

Mientras se resuelve este bloque se puede continuar con la cobertura
institucional, las decisiones sobre los dos ETF y el cierre editorial, sin
escrituras implícitas. El vídeo sigue al final.

## 7. Verificación y límites del cierre

- Seis pruebas unitarias superadas: identidad, cierre duplicado/ausente,
  conservación de nulos/ceros/pérdidas, signo, escala de referencia, definición
  pendiente y exclusión de campos fuera de la lista permitida.
- Repetida la batería existente de fundamentales: **63/63 correctas**, más las
  seis pruebas nuevas ejecutadas aparte mediante
  `node --test docs/nuvia-issuer-evidence.test.mjs`: **69/69 en conjunto**.
  El diagnóstico en vivo no se añade a la compilación ni a esas pruebas sin red.
- Comparador en vivo completado: 2/2 empresas, 4 GET en la repetición, cero fallos
  de lectura/contrato. Las discrepancias numéricas se informan, no se ocultan.
- No se ha cambiado interfaz, motor de cálculo, paquete servido, reglas,
  permisos, contrato ni cargas. No corresponde atribuir a este paso una nueva
  validación visual de toda la web o una compilación completa.
- La revisión se mantiene dentro del alcance de diagnóstico del §12 ya
  documentado en la auditoría: sin datos personales, previsiones, instrucciones
  inversoras, clasificación nueva ni validación jurídica externa como condición
  de desarrollo. No se ha modificado el marco.

**Cerrado:** contraste documental y herramienta local de las tres filas.
**Pendiente:** equivalencia completa de campos, fechas de presentación reales,
contrato de metadatos y cualquier corrección/carga que se autorice expresamente.

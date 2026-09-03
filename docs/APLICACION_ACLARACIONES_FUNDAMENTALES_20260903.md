# Fundamentales · aclaraciones y propuesta de metadatos

03-09-2026 · Orden: «sigue sin preguntar».
Trabajo local y lecturas acotadas; no constituye autorización de escrituras,
publicación ni modificación del marco.

## Alcance previo al cambio · revisión interna §12

1. Necesidad: distinguir fechas declaradas de verificadas y precisar la carencia de escala del modelo.
2. Datos: estados empresariales ya aprobados; consulta explícita de dos empresas al proveedor.
3. Transformación: comparación de valores y avisos de coincidencia de fechas; sin conversiones de datos.
4. Salida: mismas cifras y fechas, con explicación y asterisco cuando presentación coincide con cierre.
5. Emisores: identificables; no cambia la clasificación vigente de la función.
6. Circunstancias personales: ninguna.
7. Conducta inversora sugerida: ninguna.
8. Valor futuro: ninguna previsión; se mantienen las tres estimaciones excluidas.
9. Mérito inversor: ningún filtro, puntuación, ordenación o selección.
10. Recomendaciones de terceros: ninguna.
11. Diseño: notas descriptivas, sin nuevos semáforos ni restricciones.
12. Acción: lectura, navegación e impresión existentes; ninguna contratación.
13. Remuneración: sin cambios.
14. Separación profesional: solo copia local y proveedores propios del proyecto.
15. Datos personales: ninguna consulta de cuentas ni almacenamiento personal.
16. IA: no se añade interpretación automática en la web.
17. Trazabilidad: lecturas con fecha, huella y campos seleccionados; no inferir una escala universal.
18. Control: pruebas de conservación de datos, fechas, filtrado positivo, regresión y escritorio/tablet.

Se conserva toda función y dato visible. No se cambian permisos, base, contrato
contable ni reglas. La validación jurídica externa permanece fuera del alcance alfa.

## Resultado de la lectura actual

Lectura de las 12 filas más recientes (dos por cada uno de seis estados) a las
12:37:35 UTC: **sin diferencias** en los campos contables comparados, moneda y
fecha de presentación; tampoco cambian las seis monedas de cabecera. La fecha
general de actualización de Logista sí avanza a 03-09-2026. Una fecha general más
reciente no significa que se hayan revisado esas filas.

La consulta filtrada de EODHD sigue ofreciendo resultados y flujos de Pernod
hasta junio de 2025, y balance hasta junio de 2026. Persiste la ausencia de moneda
en las tres filas identificadas. Repetir la carga actual no las corregiría.
Este resultado corresponde al endpoint, filtro y momento consultados; no demuestra
ausencia de cobertura en todos los productos del proveedor.

- Programa reproducible: `node scripts/check-company-provider-revision.mjs`.
- 2 solicitudes filtradas al proveedor y 4 GET anónimos a la base; cero escrituras.
- Solo identidad y estados anuales; sin bloque de estimaciones, titulares o personas.
- Resultado local: `output/metadatos-fuentes/proveedor-2026-09-03T12-37-35-826Z.json`.
- No se guarda respuesta cruda ni URL con clave. No existe modo de aplicación.

El filtro de secciones y campos está documentado en la
[API de fundamentales de EODHD](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds).
Se utiliza el endpoint original ya integrado; no se ha migrado de versión.

## Cambios locales aplicados

- Columna de presentación identificada como dato declarado por el proveedor.
- Asterisco cuando su fecha coincide con el cierre, con explicación al lado de
  la tabla; no sustituirla por fecha de publicación, formulación o descarga.
- Aviso de escala corregido: el modelo servido no tiene escalas acreditadas;
  no afirmar que el proveedor o los documentos originales carecen de unidades.
- Mantener avisos desconocidos y transformar solo el texto heredado identificado,
  sin mutar la ficha recibida. Mismo tratamiento en pantalla y al imprimir.
- La revisión de navegador detectó que una explicación dentro del caption de
  la tabla podía quedar fuera de vista en tablet. Se movió al párrafo anterior,
  fuera del desplazamiento horizontal, y se añadió una prueba específica.

## Propuesta concreta para datos · preparada, no aplicada

**No proponer una recarga idéntica ni sustituir importes por los del informe del
emisor.** Se conserva `fundamentals/current` v1. La alternativa acotada es un
complemento de evidencia, separado del dato del proveedor, pendiente de decisión.

Destinos candidatos, no creados:

- `assets/ES0105027009/fundamentals/accounting-evidence`.
- `assets/FR0000120693/fundamentals/accounting-evidence`.

Contenido propuesto, limitado a tres estados/ejercicios:

| Dimensión | Tratamiento |
|---|---|
| Identidad y revisión | ISIN, símbolo, versión y fecha de revisión |
| Vinculación | Huella de la proyección de los campos revisados; no reutilizar una conclusión si cambian |
| Fuente | URL oficial, huella del PDF y página física |
| Unidad original | EUR y multiplicador de la tabla: 1.000 Logista / 1.000.000 Pernod |
| Unidad guardada | Solo acreditable por campo conciliado; no un `scale: 1` general |
| Correspondencia | Directa, magnitud de desembolso, derivada, definición pendiente o no conciliada |
| Fecha oficial | Nula hasta tener prueba de la presentación; publicación y formulación separadas |
| Correcciones numéricas | Ninguna en esta propuesta |

El [registro local de evidencia](evidence/fundamentales-emisores-20260903.json)
ya recoge las referencias y correspondencias. **No es todavía un contrato remoto
ni un lote de escritura.** Antes de convertirlo en complemento real: validar
esquema y huellas por campo, inventariar solo los destinos, comprobar que no hay
un documento existente, probar con datos ficticios y presentar el cambio exacto
para su autorización. Una fecha de carga o una huella del PDF no bastan para
certificar una equivalencia contable.

## Diferencias que no se dan por resueltas

Beneficio bruto/EBITDA y perímetro capex/FCF de Logista; caja/deuda y cobertura
FY26 de Pernod. Los detalles y fuentes oficiales están en el
[contraste documental anterior](CONTRASTE_EMISORES_METADATOS_20260903.md).
No se envía ninguna comunicación de soporte al proveedor en nombre del fundador.
Las consultas a su API son las dos lecturas técnicas descritas arriba.

### Expediente técnico preparado para soporte · no enviado

Solicitar correspondencia de campos, no una sustitución por aproximación:

1. `LOG.MC`, FY2025: origen y definición de `grossProfit=906898000` y
   `ebitda=402974000`; pedir las líneas contables de origen y ajustes aplicados.
2. Logista, FY2024/FY2025: aclarar si `capitalExpenditures` incluye intangibles
   en ambos ejercicios y cómo se deriva `freeCashFlow`.
3. `RI.PA`, FY2026: definición de `cash=1993000000`, `netDebt=10685000000` y
   `shortLongTermDebtTotal=12678000000`, con tratamiento de derivados y arrendamientos.
4. Pernod: disponibilidad de resultados y flujos anuales FY2026 en el endpoint
   utilizado y causa de que el balance esté actualizado sin los otros dos estados.
5. Ambas: moneda ausente en las filas indicadas, unidad de los importes servidos
   y significado de `filing_date` cuando coincide con el cierre.

Adjuntar solo símbolos/ISIN, periodos, campos, hora de lectura y referencias
oficiales del contraste anterior. No adjuntar claves, respuestas crudas, cuentas
del usuario ni datos de personas. Una contestación debe permitir verificar la
equivalencia; una fórmula genérica no cierra por sí sola estas diferencias.

## Verificación

- **74/74 pruebas de fundamentales superadas**, incluidas las seis del contraste
  documental y las tres del lector filtrado, ahora incorporadas a la batería
  habitual sin efectuar red al ejecutarlas.
- Compilación del módulo y generación de `dist/` correctas; 19 páginas estáticas
  verificadas. Recursos, catálogo y respaldos se mantienen en su diseño existente.
- Matriz repetida tras el ajuste final a **1440, 1280, 1024, 820 y 768 px**:
  cero desbordes del documento, errores JavaScript o llamadas externas en las
  pruebas simuladas. Las tablas conservan su desplazamiento horizontal interno.
- La nueva prueba comprueba que las tres explicaciones de fechas están fuera de
  las tablas desplazables y caben en su propio ancho. Se conservan pruebas de
  selección, reintento, respaldo, cancelación y aislamiento de dividendos.
- Ficha real de Logista revisada en navegador: datos conservados, asteriscos y
  explicación completa. Las lecturas de interfaz son adicionales a los 4 GET
  contabilizados por el programa de contraste.
- PDF de prueba de Iberdrola regenerado: **9 páginas**. Revisión visual completa;
  en la última iteración seis páginas son idénticas a las ya inspeccionadas y
  las tres modificadas se han vuelto a revisar. Poppler repite el aviso conocido
  de fuentes Type 3 en flujos; PDFium confirma que fechas y columnas están completas.
  Es evidencia de impresión con datos de prueba, no un informe financiero nuevo.
- No se cambia ningún documento remoto, dato personal, permiso o cifra contable.
  Sin confirmación Git, integración de ramas ni publicación.

**Construcción completa del portal superada** después del último ajuste:
`npm run build`, con salida correcta. Incluye auditoría de 30 vistas a 1440 px,
validaciones de contenido e integración y nueva repetición de la matriz de
fundamentales. Se conservan los mensajes de consola conocidos del motor de
plantillas; no se afirma haberlos eliminado. Registro:
`output/cierre-alfa/build-aclaraciones-completo.log`.

El vídeo permanece al final. Quedan pendientes las definiciones de datos
enumeradas, las decisiones de cobertura y la publicación autorizada; esta tanda
no declara terminada toda la alfa.

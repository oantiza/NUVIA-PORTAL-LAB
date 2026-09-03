# Carga autorizada · fechas de dividendos

Fecha: 03-09-2026. Estado: carga autorizada completada y verificada. Pendiente la
integración visual del complemento; no se ha publicado ni modificado la pantalla.

**Actualización posterior:** [integración visual local completada](INTEGRACION_FECHAS_DIVIDENDOS_20260903.md).
Los pendientes de pantalla descritos en esta acta corresponden al cierre de la
carga anterior; ya no requieren repetirse. La carga no se ha vuelto a ejecutar.

## Autorización y límites

El fundador respondió **«si»** a la consulta: «¿Me autorizas a consultar y cargar
las fechas de pago y exdividendo disponibles para las 73 empresas, en documentos
separados, sin alterar los fundamentales actuales ni incorporar estimaciones o
datos personales?».

Se autoriza esta carga concreta, no otras migraciones, listas institucionales,
importes previstos, reglas, cuentas, publicaciones o un refresco automático.
Destino autorizado y utilizado: `assets/{ISIN}/fundamentals/dividends`.
Si hay datos existentes incompatibles, se conserva su estado y se consulta.

## Revisión previa · §12

1. Necesidad: recuperar dos fechas descriptivas separadas de los estados contables.
2. Entrada: identidad de las 73 empresas y campos seleccionados del proveedor.
3. Transformación: validación de identidad y calendario, sin calcular importes.
4. Salida: documento separado con fechas, disponibilidad y procedencia.
5. Emisores identificables: sí; se conserva la clasificación del módulo.
6. Circunstancias personales de visitantes: ninguna.
7. Operación aconsejada: ninguna.
8. Valor futuro: ninguno; una fecha posterior no garantiza un pago.
9. Atractivo o clasificación inversora: ninguno.
10. Recomendación de terceros: ninguna.
11. Diseño: no se añade ningún veredicto.
12. Acción: carga técnica autorizada; sin contratación o derivación.
13. Remuneración: sin cambios.
14. Separación profesional: proyecto propio; ningún origen profesional externo.
15. Datos personales: no se solicitan ni almacenan; proyección positiva estricta.
16. IA: no interviene en las cifras.
17. Fuente: EODHD, campos consultados, actualización declarada y descarga real.
18. Pruebas: fechas, minimización, identidad, destinos exactos, no sobrescritura,
    lectura posterior e integridad de los documentos contables preexistentes.

La autorización no convierte los metadatos pendientes en datos acreditados, no
retira controles ni crea bloqueos regulatorios. El vídeo sigue para el final.

## Resultado comprobado

| Comprobación | Resultado |
|---|---:|
| Empresas consultadas en el lote definitivo | 73 |
| Respuestas con identidad y formato válidos | 73 |
| Documentos nuevos creados y releídos | 73 |
| Empresas con fecha de exdividendo | 71 |
| Empresas con fecha de pago | 1 |
| Empresas sin ninguna de las dos fechas | 2 |
| Exdividendos posteriores al día de consulta | 10 |
| Documentos previos con contenido y actualización sin cambios | 151 |
| Documentos existentes modificados / borrados por esta operación | 0 / 0 |
| Lecturas públicas posteriores válidas, sin credenciales | 73 / 73 |

Los 151 documentos protegidos son las 73 fichas de activos, sus 73 fundamentales
contables, el manifiesto público y cuatro fragmentos de catálogo. Se compararon
su contenido y marca de actualización antes y después. Ninguna escritura de
este lote apunta a precios, documentos contables, catálogo, reglas o permisos.
No se han verificado de nuevo individualmente todas las series de precios.

Se guardan fechas e identidad empresarial, procedencia, huella de la respuesta y
fechas reales de consulta y carga. No se han solicitado bloques de personas,
listas de tenedores, ejecutivos ni importes de dividendos estimados.

## Cobertura y límites de interpretación

- **Adyen (`ADYEN.AS`) y TSK (`TSK.MC`):** el proveedor no informa
  ninguna de las dos fechas en esta consulta. Se almacena `notReported`, con
  ambas fechas nulas. No significa dividendo cero ni que nunca paguen dividendos.
- **BMW (`BMW.XETRA`):** única fecha de pago devuelta, **21-05-2024**. Su fecha de
  exdividendo es **14-05-2026**. No se presentan como dos fechas del mismo evento
  ni se titula el pago «próximo»; esa vinculación no está acreditada.
- Las diez fechas de exdividendo posteriores a la consulta corresponden a
  MT.AS, BNP.PA, ENI.XETRA, FDR.MC, ITX.MC, MC.PA, PRX.AS, TTE.PA, UNI.MC y DG.PA.
  Son fechas declaradas por el proveedor: no se han contrastado individualmente
  con anuncios corporativos y no implican un pago garantizado.
- Este complemento **no es un historial de todos los dividendos**, un calendario
  confirmado ni un refresco de los estados contables. La consulta puntual no
  activa actualizaciones periódicas.

### Incidencia de formato resuelta antes de escribir

La primera preparación produjo una respuesta válida y 72 rechazos, sin escribir
en la base. La comprobación selectiva mostró el marcador literal `NA` en fechas
no disponibles. Se añadió su normalización explícita a `null` y una prueba;
no se aceptan silenciosamente fechas inválidas, vacíos u otros formatos ambiguos.
La segunda preparación validó las 73 respuestas, sin fallos. El primer lote no
se aplicó y se conserva como evidencia del diagnóstico.

## Protección de la carga y evidencias

Antes de crear, se inventariaron las colecciones raíz y las subcolecciones de
las 73 fichas. En cada una solo existía `fundamentals/current`, sin documentos
anidados; no había un complemento `dividends` que sobrescribir. Este inventario
se limita a esas ubicaciones: no afirma haber inspeccionado cada dato de la base.

La aplicación releyó los 151 documentos protegidos y los 73 destinos dentro de
una transacción. Solo creó los destinos inexistentes, con precondición de no
existencia. No usó actualizaciones de fundamentales ni borrados. El diseño se
apoya en las [lecturas transaccionales de Firestore](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/batchGet)
y su [confirmación atómica](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/commit).

Evidencia local, en la carpeta ignorada por Git `output/carga-fechas-dividendos/`:

- `preparado-2026-09-03T11-08-42-554Z.json`: primer intento, no aplicado.
- `preparado-2026-09-03T11-13-23-134Z.json`: lote definitivo de 73 documentos.
- `resultado-2026-09-03T11-14-19-233Z.json`: resultado y enlaces a plan y recibo.
- `lectura-publica-2026-09-03T11-14-49-339Z.json`: 73 GET anónimos válidos.

No se conservan credenciales ni URLs con claves. Las consultas previas y la
repetición de la preparación consumieron solicitudes adicionales al proveedor;
las 73 de la tabla son únicamente las del lote definitivo.

## Pruebas y continuación

- Siete pruebas nuevas sobre fechas, procedencia, identidad, campos permitidos,
  marcador `NA`, nulos y escritura solo de creación.
- Cuarenta y seis regresiones anteriores del módulo y tres pruebas del
  diagnóstico complementario superadas: **56 casos** en total, incorporados a
  `npm run test:fundamentales-alfa`.
- Lectura anónima reproducible: `node scripts/check-dividend-dates-live.mjs`.
- No se ha regenerado ni publicado el portal: el código de su pantalla no cambió
  en esta actuación. No se afirman nuevas pruebas visuales por esta carga.

**Siguiente paso:** leer el complemento al seleccionar una empresa y mostrar
las dos fechas con su procedencia independiente. Un fallo o ausencia del
complemento no debe ocultar los fundamentales. Revisar escritorio, tablet e
impresión, incluidos nulos, fechas antiguas/posteriores y cambios de selección.
El listado institucional queda separado, con cobertura y alcance pendientes;
no estaba incluido en esta autorización. El vídeo permanece al final.

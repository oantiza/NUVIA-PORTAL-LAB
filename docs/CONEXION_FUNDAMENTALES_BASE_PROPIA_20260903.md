# Conexión del módulo a los fundamentales de la base propia

Fecha: 03-09-2026. Alcance: desarrollo y comprobación local de la alfa.

> **Optimización local posterior:** [buscador ligero y respaldo por empresa](CARGA_LIGERA_FUNDAMENTALES_20260903.md).
> El inicio descarga 13.450 bytes de índice, no el archivo conjunto de 1,2 MB.
> Los 52 respaldos se conservan y se consultan individualmente solo si hacen falta.
> Sin nuevas cargas ni cambios de cifras o identidades.

> **Actualización posterior:** la [corrección autorizada de Aena y Ferrovial](EJECUCION_IDENTIDADES_AENA_FERROVIAL_20260903.md)
> ya está ejecutada y la lectura real confirma **73/73 fichas válidas**. El cliente
> resuelve los dos códigos anteriores a sus destinos actuales; originales y
> precios permanecen conservados. El catálogo bruto no se ha activado con los
> códigos nuevos para proteger la web publicada. Las cifras de 71 y las menciones
> de «no se migran» que siguen corresponden al hito anterior de conexión.

## Decisión y límites

Continuación solicitada por el fundador tras cargar los fundamentales. Se conecta
la ficha a `nuvia-family-wealth`, únicamente por lectura anónima de la empresa
seleccionada. No se escriben documentos, reglas, cuentas ni datos personales.
No se migran los identificadores de Aena o Ferrovial. No se cambia el periodo de
tres años del cálculo de cartera ni se publica el portal.

El índice local de 73 empresas sirve para buscar; no acredita por sí solo la
disponibilidad actual de fundamentales. Al elegir una empresa se comprueban su
documento de activo y `fundamentals/current`. La copia local solo sirve de respaldo
identificado cuando falla la lectura, nunca para sustituir otra identidad.

## Prueba de función (§12 del marco)

1. Necesidad: consultar las cifras empresariales ya cargadas en la base propia.
2. Entrada: ticker/ISIN de la empresa elegida; documentos públicos empresariales.
3. Transformación: decodificación, comprobación de identidad y contrato positivo;
   se mantienen las fórmulas de presentación existentes.
4. Resultado: identidad, ratios descriptivos, cuentas, gráficos y procedencia.
5. Emisores identificables: sí, exclusivamente el elegido por el visitante.
6. Circunstancias personales: no.
7. Sugerencia de operar: no.
8. Opinión sobre precio futuro: no; se mantienen fuera las estimaciones excluidas.
9. Ordenación por atractivo: no; búsqueda alfabética existente.
10. Recomendaciones de terceros: no.
11. Diseño: mismos componentes neutrales, sin semáforos inversores.
12. Acción: consultar, reintentar e imprimir; ninguna contratación o ejecución.
13. Remuneración: no se añade ninguna.
14. Separación profesional: solo la base propia, nunca servicios profesionales.
15. Datos personales: ninguno almacenado; sin sesión, SDK de autenticación ni
    registro de búsquedas o analítica añadida.
16. IA: no interviene en las cifras ni en su interpretación.
17. Procedencia: EODHD, fechas declarada, descargada y cargada separadas; respaldo
    local identificado; moneda y escala desconocidas no se infieren.
18. Controles: contrato compartido con carga, pruebas de lectura GET sin credenciales,
    identidad, ausencia, errores, cancelación, estimaciones excluidas y revisión
    visual en escritorio/tablet. Las pruebas no escriben en la base.

Clasificación interna: ámbar por emisor identificable; desarrollo alfa conforme a
las órdenes del fundador. No equivale a dictamen jurídico ni a autorización de
publicación. Cualquier nueva duda o restricción se consulta antes de decidirla.

## Resultado de comprobaciones

- Lectura real, sin credenciales, de las 73 entradas con el nuevo cliente: **71
  fichas válidas**, cero errores de lectura/contrato, dos sin documento
  (`AENA.MC`, `FER.MC`). Ninguna escritura remota en esta actuación.
- 70 fichas tienen al menos cinco filas anuales en los tres estados; TSK tiene
  tres en cada estado. Se conservan todos los ejercicios recibidos, sin inventar
  cinco años donde no existen. La cobertura numérica de la carga está en su acta.
- **27 pruebas unitarias** superadas: carga, proyección, lectura, exclusiones,
  identidad, cero/nulo/negativos, ausencia, error, cancelación y privacidad.
- **Compilación completa del portal superada** (`npm run build`, salida 0),
  incluida la auditoría de 30 vistas a 1440 px y las comprobaciones sobre `dist/`.
  Sin fallos de contraste, tipografía, estructura, superficies, desborde o fugas
  en esa auditoría. No equivale a despliegue. `git diff --check` también correcto.
- Módulo compilado comprobado a **1440, 1280, 1024, 820 y 768 px**: cuatro tablas,
  selección de ejercicios, gráficos sin etiquetas superpuestas, sin desbordes ni
  errores JavaScript. Se simula la API en esas pruebas: no dependen de la red ni
  mezclan sus cifras sintéticas con datos publicados.
- Pruebas adicionales de interfaz: recuperación de una ficha sin respaldo,
  respaldo local explícito al caer la red, reintento, y cambio rápido de empresa
  con respuesta anterior retrasada. No reaparecen cifras bajo otra identidad.
- Navegador del usuario contra la base real: Acciona muestra procedencia de base
  propia, descarga/carga de 03-09-2026, estados con cinco ejercicios y cuatro
  tablas (la de BPA contiene periodos trimestrales). Sin desborde horizontal;
  procedencia, acciones y cifras inspeccionadas visualmente.

## Alcance que sigue pendiente

- Esta conexión está desarrollada localmente; no se ha confirmado ni publicado.
- Las identidades de Ferrovial/Aena fueron corregidas con autorización posterior,
  según el acta enlazada al comienzo. Sigue pendiente la publicación compatible
  y la activación coordinada del catálogo bruto; no otra corrección de cifras.
- La consulta obtiene la última **carga disponible**, no ejecuta ingesta EODHD ni
  actualizaciones de fundamentales en segundo plano.
- El índice de búsqueda sigue siendo local y contiene 73 empresas; futuras
  altas/bajas del catálogo requieren actualizarlo. Se contrasta la identidad
  con el activo remoto al elegirlo. No se afirma que el índice se sincronice solo.
- La descarga conjunta del índice y los 52 respaldos se ha sustituido por carga
  diferida, según el acta de optimización. El archivo completo sigue conservado
  como entrada de compilación; no se descarga al abrir el módulo.
- Metadatos de escala/divisa, cobertura anterior de TSK, dos ETF ausentes de
  composiciones, revisión editorial, coordinación de Git y vídeo final conservan
  el alcance y las decisiones pendientes de sus actas. El periodo de cálculo de
  cartera permanece en tres años.

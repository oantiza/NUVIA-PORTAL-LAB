# Fundamentales · buscador ligero y respaldo por empresa

Fecha: 03-09-2026. Continuación local solicitada mediante «ok sigue».
Estado: **implementación local y verificaciones completadas**.
Sin publicación ni escrituras remotas.

## Motivo y alcance

El módulo ya consulta las 73 empresas desde la base propia. Sin embargo, al abrir
descarga `fundamentals.json`: 1.211.639 bytes con el índice y todos los respaldos.
Se separará un índice pequeño de los respaldos individuales. La fuente local
original se conserva; ninguna cifra, fecha, identidad o cobertura se actualiza
por empaquetar de nuevo. Aena y Ferrovial mantienen las correspondencias autorizadas.

## Revisión previa de la función · §12

1. Necesidad: abrir y buscar sin descargar cifras de empresas no consultadas.
2. Entrada: índice y respaldo saneados existentes; empresa elegida por el visitante.
3. Transformación: empaquetado y carga diferida, sin cálculos financieros nuevos.
4. Salida: mismas fichas y procedencia, con respaldo identificado cuando procede.
5. Emisores: sí; se mantiene la revisión ámbar de la función, sin reclasificarla.
6. Circunstancias personales: ninguna.
7. Consejo de operar: ninguno.
8. Valor futuro: no se incorporan estimaciones ni opiniones.
9. Atractivo: no se cambia la búsqueda ni su orden alfabético.
10. Recomendaciones de terceros: ninguna.
11. Diseño: no se añade ningún veredicto ni semáforo.
12. Acción: consulta y reintento; sin contratación ni derivación.
13. Remuneración: sin cambios.
14. Separación profesional: solo artefactos locales saneados y base propia vigente.
15. Datos personales: ninguno; sin cuentas, persistencia ni escrituras en base.
16. IA: no interviene en la aplicación ni interpreta cifras.
17. Fuentes y fechas: se conservan; empaquetar no acredita una nueva descarga.
18. Pruebas: tamaño y ausencia de cifras en el índice, integridad de respaldos,
    identidad, cancelación, reintento y revisión visual de escritorio/tablet.

No se altera el marco ni se crean restricciones regulatorias. Se conserva el
tratamiento vigente de errores y las tres exclusiones expresas del fundador.
No se publica, no se toca el catálogo remoto y el vídeo sigue para el final.

## Resultado

| Elemento | Antes | Ahora |
|---|---|---|
| Datos locales descargados al abrir | 1.211.639 bytes | 13.450 bytes de índice |
| Empresas que se pueden buscar | 73 | 73 |
| Respaldos disponibles | 52, juntos | 52, separados por empresa |
| Consulta correcta a la base | Índice con todos los respaldos + dos documentos remotos | Índice + dos documentos remotos; ningún respaldo |
| Fallo de la base con respaldo disponible | Copia incluida en la descarga inicial | Descarga de una sola copia local |

La reducción del archivo inicial de datos es **98,89 %**, medida sin compresión;
no es una medición de tiempo de carga ni del peso total de JavaScript, fuentes o
de la web. Se mantienen en el paquete todos los respaldos existentes: no se han
eliminado para obtener esta reducción.

### Implementación y conservación

- El fichero original `company-analysis/public/data/fundamentals.json` permanece
  intacto como entrada saneada de compilación. No se relee EODHD ni se consulta
  Firestore para producir los nuevos archivos.
- La compilación genera `data/company-index.json` y un archivo por respaldo bajo
  `data/backups/`, con ISIN y huella SHA-256 en el nombre. El archivo conjunto no
  se copia a la web generada. El modo de desarrollo sirve el mismo formato.
- No se incorporan estados, ratios, personas ni URLs arbitrarias al índice.
  Las rutas de respaldo se construyen localmente; no se siguen redirecciones ni
  se envían sesión o referente en esas consultas.
- Antes de presentar un respaldo se verifica la huella, el contrato positivo y
  la identidad de la empresa. Se conservan números, nulos y fechas, incluida la
  ausencia de fecha de descarga de las copias históricas. La base sigue exigiendo
  una fecha de descarga acreditada: no se ha relajado ese contrato.
- Un documento remoto ausente o una discrepancia de identidad no se convierten
  en una copia antigua. Se mantiene el comportamiento ya existente de la función.
- Si falta el respaldo o está dañado se explica el fallo y se permite reintentar;
  no se presentan las cifras de otra empresa. Los controles son de integridad del
  dato, no una restricción regulatoria nueva.
- Aena y Ferrovial siguen con los identificadores actuales y sin reasignar un
  respaldo de la identidad antigua. No cambian las 73 fichas disponibles en base,
  las 52 copias históricas ni el periodo de cálculo de cartera.

### Pruebas completadas

- **42 pruebas de fundamentales correctas**, diez nuevas sobre índice y respaldo
  diferido. Incluyen igualdad exacta de los 52 respaldos con la fuente original,
  generación determinista, rechazo de campos no declarados, huellas, fechas,
  referencias, lectura selectiva, fallo de red, reintento y cancelación tardía.
- Módulo compilado a **1440, 1280, 1024, 820 y 768 px**, con la base simulada en
  memoria. Al abrir sin seleccionar: un índice, cero lecturas de empresas. Al
  consultar con éxito: dos documentos propios, cero respaldos. Cuando falla:
  un único respaldo, identificado explícitamente.
- Pruebas de archivo local dañado y ausente, recuperación posterior, respuesta
  remota retrasada y respaldo retrasado tras cambiar de empresa. Sin sustituir
  la selección actual ni mostrar datos de la anterior.
- Modo de desarrollo comprobado con lecturas HTTP locales: índice de 73 entradas,
  respaldo individual disponible y fichero conjunto no servido. Sin red externa.
- **Compilación completa del portal correcta** (`npm run build`, salida 0), con
  auditoría de 30 vistas a 1440 px, verificación del paquete `dist/` y la matriz
  del módulo en cinco anchos. Sin fallos del auditor ni errores JavaScript en
  la matriz del módulo. Se conservan los mensajes conocidos del portal ya
  documentados; no se afirma haberlos eliminado.
- Lectura real de las **73 empresas del nuevo índice compilado**, todas con ficha
  válida e identidad coincidente. Solo dos documentos de base por empresa;
  ninguna escritura ni consulta de respaldos en esa comprobación.
- Revisión manual del navegador a 909 px: entrada sin selección predeterminada,
  búsqueda de Iberdrola, ficha de la base propia con procedencia y fechas visibles,
  sin desborde horizontal. Captura inspeccionada, conservando la presentación.
- Paquete final: índice de 73 y los 52 respaldos referenciados presentes, sin el
  archivo monolítico. Verificación de formato de diferencias de Git correcta.

### Límites y pendientes

No es una nueva copia offline de las 73 empresas: las 21 que no tenían respaldo
siguen requiriendo la base. No se descarga por anticipado una empresa no elegida.
No se crea persistencia de visitantes ni se registran sus búsquedas. El índice
sigue siendo local y no sincroniza altas automáticamente.

No se han hecho commits ni publicación. No se activa el catálogo remoto, no se
modifican reglas o permisos y no se han escrito datos remotos. El vídeo queda
para el final. El empaquetado usa la [API oficial de plugins de Vite](https://vite.dev/guide/api-plugin.html)
y desactiva la copia íntegra del [directorio público](https://vite.dev/config/shared-options.html#publicdir).

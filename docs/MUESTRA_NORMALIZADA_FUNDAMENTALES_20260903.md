# Muestra local de fundamentales y preparación de incidencias

Fecha: 3 de septiembre de 2026. Estado: preparación local para revisión.
No es una carga de base, una conexión de la alfa ni una entrega publicable.

## Revisión previa del marco obligatorio

1. Necesidad: comprobar que la información histórica puede trasladarse al contrato
   propuesto sin inventar datos ni mezclar emisores.
2. Entradas: archivos EODHD ya existentes y evidencia local del catálogo consultado
   el 3 de septiembre. Selección acotada por casos técnicos, no por inversión.
3. Transformación: lista positiva de campos, conversión estricta a número finito,
   conservación de nulos, fechas y moneda de cada ejercicio, huella de los bytes.
4. Salida: JSON local de revisión y acta de incidencias, sin nueva pantalla pública.
5. Emisores identificables: sí; se mantiene la clasificación ÁMBAR del módulo.
6. Circunstancias personales: ninguna.
7. Sugerencia de operar: ninguna.
8. Opinión sobre precio o valor: ninguna; ratios atribuidos a la copia del proveedor.
9. Selección: cobertura de casos normales, ausentes y conflictivos; no clasificación
   por mérito financiero ni propuesta de cartera.
10. Recomendaciones ajenas: excluidas por lista positiva, junto con previsiones y
    precios objetivo. Los bloques crudos no se incorporan al informe.
11. Presentación: estados de calidad técnica, sin colores de atractivo financiero.
12. Acción: ninguna conexión, contratación, contacto ni envío al responsable de base.
13. Remuneración y licencia: ninguna nueva; difusión de datos pendiente de revisión.
14. Separación profesional: sin información ni sistemas bancarios. Se mantienen las
    puertas de conformidad profesional que procedan antes de publicar.
15. Datos personales: ninguno; resultados en `output/`, ignorado por Git y fuera
    de los directorios que se empaquetan para el sitio.
16. IA: no interviene en la transformación ni completa cifras.
17. Trazabilidad: huella real del archivo, fecha de lectura separada de actualización
    del proveedor; descarga y escala desconocidas permanecen nulas. La observación
    del catálogo es la de la evidencia previa, no una nueva consulta en vivo.
18. Controles: pruebas sintéticas de identidad, tipos, nulos/cero, fechas, monedas,
    exclusión de campos, límites de muestra, cuarentena y validación del contrato;
    revisión de los resultados antes de cualquier integración.

## Arquitectura y límites acordados antes de programar

Normalizador local y generador sin red, sin credenciales y sin cliente de base.
Se verifica de nuevo la identidad de cada archivo seleccionado contra la evidencia
de catálogo: no se acepta un ISIN distinto, otro mercado ni moneda de cotización
incompatible. Los casos sin identidad o archivo quedan separados, sin registros.
Los registros con fechas incoherentes quedan fuera de la muestra normalizada.

Se conservan como máximo cinco ejercicios por estado y una observación de ratios
por empresa aceptada. El cierre anual no se utiliza como periodo TTM. La moneda
se toma exclusivamente de la fila del ejercicio, nunca de la cotización ni de la
cabecera. No se estima la escala ni se usa el refresco de precios como descarga
de fundamentales. No se calcula flujo de caja libre cuando falta en el origen.

Los archivos de salida se crean en una carpeta nueva dentro de `output/`, sin
sobrescribir crudos ni resultados anteriores. Cada paquete lleva un bloqueo
explícito de publicación. La validez estructural no certifica veracidad, vigencia,
licencia ni cumplimiento de las puertas de integración y publicación.

La revisión interna permite esta prueba local acotada; no sustituye la validación
jurídica o de compliance. No se modifica la vista local anterior ni se reactiva
la ruta de empresas de la alfa. Firebase, backend, despliegue y comunicación
externa continúan fuera del alcance.

## Resultado ejecutado

Generación: **2026-09-03, 02:58:15 UTC (04:58:15, Madrid)**. Nueve casos técnicos,
seis con registros y tres rechazados antes de normalizar. Los seis casos admitidos
producen **90 registros: 84 de estado/ejercicio y 6 instantáneas de ratios**.
No son 84 años distintos ni 90 empresas. No hubo rechazos de filas anuales entre
las seleccionadas; esto no equivale a ausencia de limitaciones.

| Caso | Registros | Resultado y límite principal |
|---|---:|---|
| Iberdrola · IBE.MC | 16 | Cinco ejercicios por estado, 2021–2025, y ratios. Sin huecos numéricos en la selección; escala y descarga siguen sin acreditar. |
| Prosus · PRX.AS | 16 | Estados USD, cotización EUR; cierres de marzo de 2022–2026. Sin conversión. |
| Pernod Ricard · RI.PA | 16 | Balance 2026 sin moneda; resultados/caja llegan a junio de 2025. No se alinean artificialmente. |
| Intesa Sanpaolo · IES.XETRA | 16 | Cinco ejercicios 2021–2025, revisión sectorial bancaria pendiente. |
| TSK · TSK.MC | 10 | Solo tres ejercicios disponibles por estado, 2023–2025; no se fabrican dos adicionales. |
| Solaria · SLR.MC | 16 | Dividendos pagados desconocidos en los cinco ejercicios 2021–2025. |
| Ferrovial · FER.MC | 0 | Rechazado por ISIN incompatible. |
| Siemens Gamesa · SGRE.MC | 0 | Fuera del catálogo observado; no se asigna un activo ni se necesita leer su crudo para este control. |
| Santander · SAN.MC | 0 | Figura en catálogo, pero no existe su archivo local. |

Los criterios de selección son exclusivamente técnicos. No son recomendaciones
ni una clasificación de las compañías.

### Qué significa que la muestra pase

- Los 90 registros cumplen la **forma** del contrato propuesto.
- Cada registro procede de campos expresamente permitidos y de una identidad
  contrastada con el catálogo archivado, no con una nueva consulta en vivo.
- Las huellas de los archivos fuente y de la evidencia de catálogo se comprobaron
  de nuevo después de generar; las huellas de las salidas coinciden con el manifiesto.
- La muestra se guarda aparte, no reemplaza ningún archivo existente.
- No acredita exactitud contable, escala, vigencia, licencia ni permiso de publicar.

### Limitaciones que permanecen abiertas

1. **84/84 registros anuales con escala nula.** No existe en esta entrega evidencia
   suficiente para declarar unidades, miles o millones. No se utiliza `1` por defecto.
2. **90/90 registros sin fecha acreditada de descarga de fundamentales.** La lectura
   de hoy, el refresco de precios y `General.UpdatedAt` son fechas distintas.
3. **Un balance sin moneda:** Pernod Ricard, cierre 30/06/2026. La moneda de sus
   balances anteriores no permite completar esa fila.
4. **14 valores numéricos ausentes:** nueve en TSK y cinco en Solaria. Permanecen
   nulos, sin calcular sustitutos ni concluir que no hubo dividendos o deuda.
5. **Nueve fechas de presentación ausentes en TSK**, una por estado y ejercicio.
6. **Pernod Ricard tiene cierres desalineados:** resultados/caja 2021–2025 y balance
   2022–2026, todos en junio. No combinar el último dato de cada bloque como si
   perteneciera a un mismo ejercicio.
7. **Ratios:** su fecha de observación es lectura de archivo local; no es un refresco
   de cotizaciones. Su periodo específico sigue nulo; no se infiere del cierre anual.
8. **Intesa:** el marcador sectorial no valida la pertinencia o comparabilidad de
   cada métrica bancaria. La muestra reciente tampoco resuelve sus divergencias
   históricas de moneda detectadas en la auditoría más amplia.

## Archivos entregados y reproducción

Carpeta local generada:
`output/fundamentales-muestra/2026-09-03-SrbBSW/`.

- `muestra.json`: registros normalizados y contexto de uso exclusivamente local.
- `revision.json`: resumen por caso, incidencias por campo/ejercicio, selección y
  omisiones por límite de muestra. No contiene los importes del crudo completo.
- `integridad.json`: huellas de las dos salidas para verificar que no cambian.

Los importes permanecen en `output/`, excluido de Git y de la lista de carpetas
publicadas. No mover esta muestra a `data/`, `public/`, `dist/` ni adjuntarla a un
servicio externo sin resolver los derechos y la autorización correspondientes.

El catálogo de referencia es
`output/fundamentales-contraste/contraste-2026-09-03T00-02-53-007Z.json`.
La presente ejecución realiza **cero peticiones de red**. Si la base cambia después
de esa observación, será necesario contrastar de nuevo antes de integrar.

Desde la carpeta oficial:

```powershell
npm run test:fundamentales-muestra
npm run test:fundamentales-contrato
npm run test:empresas-local
npm run muestra:fundamentales-local
```

El último comando vuelve a leer los archivos existentes y genera otra carpeta
única. No descarga, no conecta y no actualiza la muestra anterior. La selección
está fijada a los nueve casos; no admite rutas, claves ni opciones de ampliación.
Un archivo de evidencia inexistente o un catálogo ambiguo detienen el proceso.

Código local: `company-analysis/local/normalize.mjs` y `sample.mjs`.
El validador `contract.mjs` permanece como borrador independiente; no se ha
incorporado al cargador de la base ni a la aplicación publicada.

## Comprobaciones de esta entrega

- 15 pruebas nuevas de normalización superadas.
- 10 pruebas existentes de contrato y 14 de recuperación local superadas:
  **39 pruebas en total**, sin conexión al proveedor ni a la base.
- Relectura independiente de los 90 registros y comprobación del contrato y de
  huellas de fuentes, evidencia y salidas: correctas.
- Puertas existentes de empresas, privacidad, paridad, referencias estáticas y
  lenguaje: superadas. La puerta de empresas mantiene su ámbito de 17 archivos;
  la nueva transformación se verifica además con las 15 pruebas específicas.
- Comprobación de espacios de cambios en Git: sin errores; únicamente avisos de
  finales de línea en archivos que ya estaban modificados.
- No se ha ejecutado compilación completa, revisión visual nueva, despliegue ni
  commit/push. Esta entrega no cambia pantallas ni exige pruebas móviles.

## Siguiente decisión

Se ha preparado
`docs/INCIDENCIAS_FUNDAMENTALES_PARA_RESPONSABLE_BASE_20260903.md`, **no enviado**.
El siguiente paso es recibir aclaraciones y evidencia sobre identidad, escala,
fechas, cobertura y contrato de lectura. Se podrán comprobar localmente antes
de decidir una integración. Ninguna respuesta autoriza por sí sola cambios de
Firebase o backend: esa intervención requiere una petición expresa.

## Continuación: lector y vista local

El paso posterior queda registrado en
`docs/LECTOR_MUESTRA_FUNDAMENTALES_20260903.md`. Añade una vista independiente
que verifica esta muestra y su fuente, distingue importes pendientes de datos
ausentes y conserva fechas/divisas por ejercicio. No altera los archivos de
la muestra ni supone conexión con la base. Las incidencias de datos y puertas
de publicación continúan abiertas.

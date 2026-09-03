# Recuperación local del análisis fundamental

Fecha: 3 de septiembre de 2026. Alcance autorizado: primera versión local con
los archivos ya descargados. No se autoriza modificar Firebase, el backend
anterior, el programa original, ni publicar. Se conserva el bloqueo de empresas
en la alfa y en la compilación del portal.

## Revisión previa: marco obligatorio, preguntas 1–18

1. Necesidad: comprender los estados financieros históricos de una empresa.
2. Entrada: caché EODHD existente en `output/mercado-alfa/crudo`, dentro del
   repositorio oficial. Solo acciones; usuario elige empresa. No se descarga nada.
3. Transformación: lista explícita de campos descriptivos, números finitos,
   fechas y monedas; margen neto = beneficio neto / ingresos × 100, únicamente
   cuando ambos datos existen y el denominador no es cero. Sin proyecciones.
4. Salida: ficha, múltiplos históricos del proveedor, resultados, balance y caja;
   resumen e informe en pantalla. Sin cotización en tiempo real ni noticias.
5. Emisores identificables: sí. Clasificación propuesta ÁMBAR, no verde.
6. Circunstancias personales: ninguna.
7. Sugerencias de operación: ninguna; no hay llamadas a invertir.
8. Opinión sobre precio: ninguna. Los múltiplos son cifras atribuidas al proveedor,
   no precios objetivo ni veredictos propios.
9. Selección: disponibilidad local, orden alfabético; sin ranking por mérito.
10. Recomendaciones ajenas: se excluyen objetivos, consenso, ratings y estimaciones;
    no se sirve la respuesta cruda ni bloques completos no revisados del proveedor.
11. Diseño: misma base visual local, sin semáforos de atractivo. Color en cifras
    históricas significa signo, no consejo. Dato ausente no se representa como cero.
12. Acción: solo búsqueda y lectura; sin contratación, contacto ni ejecución.
13. Remuneración: ninguna añadida; proveedor contratado por el fundador. La licencia
    y las condiciones de difusión deben resolverse antes de compartir/publicar.
14. Agente vinculado: separación estricta; no se cargan credenciales, sistemas,
    correos ni datos de la base profesional. Su conformidad, si procede, sigue pendiente.
15. Datos personales: ninguno. No hay acceso, cuentas ni guardado en nube. Elección
    de empresa y pestaña solo en memoria; servidor en bucle local, no en la red local.
16. IA: ninguna en la función ni conclusiones generadas.
17. Fuente: EODHD, copia local; fecha declarada por proveedor diferenciada de lectura
    del archivo; periodo y moneda de cada estado. No se promete refresco periódico.
    «—» significa sin dato; se separa moneda de cotización y de estados financieros.
18. Controles: pruebas de listas permitidas, nulos/cero/infinito, periodos/monedas,
    catálogo, errores y transporte local; revisión visual escritorio/tablet y
    prueba de búsqueda/cambio de empresa. No consultar ni escribir en Firebase.

## Arquitectura y puertas

Revisión técnica previa: entrada independiente de desarrollo dentro de
`company-analysis/`, reutilizando componentes descriptivos sin importar `App`,
`api` ni `firebase` antiguos. Servicio de fixtures exclusivamente de desarrollo,
ligado a 127.0.0.1, con lista permitida de rutas y rechazo de escrituras. Lee
archivos existentes y devuelve una proyección en memoria, nunca los crudos ni
secretos. No es una nueva API desplegada ni una duplicación del backend antiguo.

Resultados permitidos y casos límite quedan definidos arriba. La preparación
local puede continuar con estos controles; integración en la alfa, nuevo contrato
de base y publicación quedan fuera del alcance. ÁMBAR exige validación jurídica
o de compliance antes de publicar; este registro técnico no la sustituye.

## Resultado de esta entrega local

Primera versión funcional con buscador por nombre, ticker e ISIN, y las pestañas
Resumen, Fundamental e Informe. El informe es una vista de lectura: no exporta
PDF ni archiva en nube. Las listas personales se han dejado fuera de esta entrada.
El módulo anterior permanece conservado, pero no se importa desde la prueba.

La vista Fundamental reutiliza la pestaña existente y sus componentes de tablas,
gráficos y explicaciones. El modo histórico evita estimaciones y contenido de
analistas, incluso si se añadieran por accidente a su entrada. Se han corregido
nulos convertidos en margen cero, ratios cero ocultos, infinitos formateados como
números y barras correspondientes a datos ausentes.

La proyección local se genera en memoria desde una lista positiva de campos. No
guarda una copia publicable de los fundamentales ni altera los archivos crudos.
EV monetario, capitalización y BPA agregado se omiten de esta primera versión
hasta confirmar su divisa específica. La moneda de cotización no sustituye a la
moneda de los estados. Los múltiplos son datos del proveedor, no cálculos con una
cotización actual.

### Cobertura comprobada

- 54 archivos de acciones válidos, todos con series anuales de resultados,
  balance y caja; 0 errores de lectura/identidad al cargar.
- Este es el inventario de la caché local, NO una certificación de 54 empresas
  actuales del catálogo de la alfa. Antes de integrar hay que cruzar ambos
  inventarios, revisar identidad, vigencia, fechas y cobertura campo por campo.
- Prosus y TotalEnergies: cotización en EUR, estados en USD; se distinguen.
- Pernod Ricard: el proveedor no informa la moneda del balance; se avisa y no se
  asigna EUR por defecto.
- TSK: el nombre trae posibles problemas de codificación; se conserva y se avisa.
- Las tablas muestran los cinco últimos ejercicios disponibles de cada estado;
  el resumen indica la extensión total de la serie. Fechas entre estados pueden
  diferir. Datos ausentes se muestran con «—», no se rellenan ni se estiman.
- No se afirma que los importes hayan sido contrastados con cuentas auditadas:
  esta entrega verifica lectura, transformación y presentación de la fuente local.

### Pruebas ejecutadas

- `npm run test:empresas-local`: **14 pruebas superadas**, con datos sintéticos.
  Incluye transformación, filtros, fechas, divisas, margen, formato, protección de
  rutas, rechazo de escrituras/orígenes ajenos y compilación y render de JSX.
  El render de servidor solo verifica HTML; se filtra exclusivamente el aviso
  esperado de posicionamiento de tooltips fuera del navegador, no errores reales.
- `npm run test:analisis`: batería existente superada, incluida la fiabilidad de
  datos, disponibilidad de modelos, guardado local y formularios.
- Puerta de empresas: 17 archivos revisados. Privacidad del módulo, referencias
  estáticas, lenguaje y paridad: superados. Consistencia: sin errores; conserva
  cuatro avisos previos sobre guía fiscal y carga diferida de imágenes de portada.
- Navegador: búsqueda, apertura de Iberdrola, cambio a Prosus y Pernod Ricard,
  Resumen/Fundamental/Informe, teclado de pestañas y búsqueda sin resultados.
- Sin desbordamiento de página ni de tarjetas en la ficha Fundamental a
  **1440, 1280, 1024, 820 y 768 px**. Revisión visual de escritorio y tablet;
  no se ha creado ni probado una versión móvil.
- La prueba no importa el SDK ni las conexiones del sistema anterior. Sirve solo
  rutas expresas en `127.0.0.1:18792`, con CSP limitada al propio origen, sin
  cargar archivos de entorno. La configuración rechaza compilación y preview.
- No se ha ejecutado `build` completo, desplegado, confirmado en Git ni modificado
  Firebase. Las puertas de exclusión de empresas en el portal permanecen intactas.

### Abrir y repetir la prueba

Desde la carpeta oficial:

```powershell
npm run dev:empresas-local
```

Abrir `http://127.0.0.1:18792/local.html`. Usa las dependencias ya instaladas en
`company-analysis/`. No ejecuta instalación, descarga de datos ni publicación.
El servidor carga los archivos al iniciar; después de cambiar datos o el lector,
hay que reiniciarlo. Para detenerlo, Ctrl+C en su terminal. No usar `--host` para
exponerlo a otros equipos ni compartir los datos de esta prueba.

Pruebas específicas: `npm run test:empresas-local`. Requieren las dependencias de
la copia para verificar JSX, pero no requieren los archivos reales ni acceso a red.

### Próxima entrega propuesta, todavía no ejecutada

1. Cruzar el inventario de archivos con las acciones vigentes de la alfa, comprobar
   campos necesarios, divisas, escalas, fechas, ejercicios y métricas bancarias.
2. Definir y revisar el contrato definitivo de fundamentales y su refresco;
   no copiar bloques completos del proveedor ni mezclar estados anuales y TTM.
3. Obtener autorización expresa para cambios de base o backend. Solo entonces,
   incorporar y conectar los datos propios; sin volver al backend anterior.
4. Repetir pruebas y revisión humana; resolver licencia, validación jurídica o
   de compliance y conformidad profesional aplicables antes de publicar.
5. Reactivar la ruta de empresas y su empaquetado únicamente tras esas puertas.

Técnico, noticias, listas/archivo en nube, exportación y publicación siguen fuera
de esta entrega. No dar por conectado el módulo a la base propia ni por publicado.

## Ampliación autorizada: contraste y contrato, 3 de septiembre

El «sigue» posterior autoriza avanzar en los pasos 1–2, no ejecutar el paso 3.
Revisión previa bajo las preguntas 1–18: (1) comprobar fiabilidad informativa;
(2) caché propia y catálogo/fichas de acciones de la alfa en solo lectura;
(3) cruzar ISIN y símbolo con mercado, inventariar campos, fechas y monedas;
(4) informe técnico y propuesta de contrato, sin nueva salida de inversión;
(5) emisores identificables, se mantiene ÁMBAR; (6) sin circunstancias personales;
(7–11) sin consejo, valoración propia, ranking de atractivo, consenso ni semáforos
financieros; (12) sin contratación; (13–14) mismas cautelas de licencia y separación
profesional; (15) sin datos personales; (16) sin IA en la función; (17) consulta
fechada, fuente y limitaciones por campo; (18) pruebas sintéticas del cruce,
rechazo de identidades ambiguas y validación del contrato. La coincidencia de
identidad nunca certifica que los datos contables sean correctos o actuales.

Arquitectura de esta ampliación: herramienta de diagnóstico local, con GET
limitados al proyecto propio y rutas expresas; sin SDK administrativo, credenciales,
escrituras remotas ni descarga nueva al proveedor. Evidencia detallada en `output/`
ignorado, informe y contrato versionables en `docs/`. El contrato es una propuesta
para revisión, no una migración ni modificación de reglas o colecciones. No cambia
la selección de empresas de la vista local ni la publicación.

## Continuación: muestra normalizada local

El «go» posterior se concreta en la muestra y revisión previa documentadas en
`docs/MUESTRA_NORMALIZADA_FUNDAMENTALES_20260903.md`. Se generan 90 registros
de seis empresas, y se rechazan tres casos de identidad/cobertura. No se utiliza
esta muestra para sustituir la entrada de la vista existente ni para conectar
Firebase. La revisión dirigida al responsable está preparada en
`docs/INCIDENCIAS_FUNDAMENTALES_PARA_RESPONSABLE_BASE_20260903.md`, sin envío.
Los pasos de integración, autorización y publicación continúan pendientes.

# NUVIA · Fase 0: protección y preparación de la alfa

**Nota posterior, 03-09-2026:** registro histórico. Su criterio de bloqueo por
validación jurídica externa queda sustituido por nueva orden del fundador y
[marco v1.1 §0](MARCO_REGULATORIO_OBLIGATORIO.md): fuera de alcance y no bloqueante
en la alfa. Los controles técnicos y las prohibiciones de operaciones destructivas
de esta fase se conservan.

Fecha: 2 de septiembre de 2026. Alcance autorizado: fase 0 del plan de actuación, no las fases de corrección de datos ni recuperación de empresas.

## Estado de partida y separación

- Rama de trabajo: `codex/entrega-2b-base-alfa`; punto de partida `061a201a023c484c70ba140dabb67e95a668eeb0`, árbol limpio.
- Entregas visuales 4A/4B/5A: conservadas en `prueba/tipografia-empresas`, commit `cba47068d036593b2d946f31e9161979be23035a`. No se fusionan, trasladan ni modifican.
- Copia de empresas conservada en `company-analysis/`. Árbol Git de referencia: `38f61426a5586ba88f49380eebbee432331abb26`. No se modifica ni compila; sigue fuera de la publicación.
- Git conserva la referencia recuperable del módulo. No se crea otra carpeta ni otra versión activa de NUVIA.
- No se cambian datos, reglas desplegadas, cuentas, permisos, servicios ni configuración de Firebase. No se ejecutan cargas, commits, push ni despliegues.

## Ficha previa de esta intervención (marco §12)

Esta ficha se refiere exclusivamente a las herramientas locales de prueba y a la aclaración documental. No reclasifica la alfa ni sustituye su revisión pendiente.

1. Necesidad: impedir que una prueba de permisos dañe datos reales y distinguir preparación técnica de autorización para publicar.
2. Entradas: reglas locales del repositorio y documentos de prueba sintéticos elegidos por la batería; sin datos del catálogo real.
3. Transformación: comprobar el contrato estático y ejecutar operaciones de prueba únicamente en un emulador local.
4. Salida: resultados técnicos, con separación entre comprobación estática, protección del transporte y ejecución real de reglas en emulador.
5. Instrumentos identificables: ninguno en las pruebas nuevas; los identificadores son ficticios.
6. Circunstancias personales: ninguna.
7. Sugerencias de inversión: ninguna.
8. Opiniones sobre valor o precio: ninguna.
9. Clasificación por atractivo: ninguna.
10. Recomendaciones de terceros: ninguna.
11. Interfaz como veredicto: no hay cambios en pantallas ni resultados financieros.
12. Contratación, contacto o ejecución: ninguno.
13. Remuneración o patrocinio: ninguno nuevo.
14. Condición de agente: refuerza el aislamiento; no utiliza sistemas ni datos profesionales.
15. Datos personales: no se reciben. La prueba aislada solo maneja objetos ficticios.
16. IA en la función: ninguna; el programa de pruebas es determinista.
17. Fuentes y límites: `firestore.rules`, marco interno y API del emulador; un resultado local no certifica las reglas desplegadas.
18. Controles: destino literal de bucle local, proyecto fijo `demo-nuvia-reglas`, rechazo del modo antiguo en vivo, sin credenciales externas, redirecciones rechazadas, pruebas adversariales y revisión del diff.

Clasificación técnica de esta intervención: **VERDE**, por ser control interno sin salida financiera ni efecto sobre usuarios. La función pública de la alfa mantiene su clasificación **ÁMBAR**.

## Condiciones de desarrollo y publicación

- Se conservan las decisiones históricas del fundador, identificadas como tales; no se les atribuye una nueva aprobación.
- ~~El marco §13 exige validación jurídica o de compliance antes de publicar una función ámbar.~~ **Criterio sustituido el 03-09-2026:** por orden expresa del fundador, la validación jurídica queda fuera del alcance de la alfa (marco v1.1 §0). Su ausencia no bloquea el desarrollo, la integración ni la publicación de la alfa.
- La documentación no debe reflejar ningún estado de bloqueo por este motivo. Conforme a las órdenes permanentes de 03-09-2026, **no se bloquea nada en la alfa sin consulta previa al fundador**.
- Esta fase no altera lo ya desplegado. Cualquier actuación sobre producción requiere una petición expresa.
- Las fases siguientes necesitan su revisión previa y sus pruebas. Empresas no se reactiva en la fase 0.

## Pruebas de reglas: diseño seguro

La orden histórica `node docs/nuvia-reglas.test.mjs` deja de enviar peticiones al proyecto real. Por defecto verifica el contrato local y las protecciones del transporte sin red.

La prueba efectiva de permisos se solicita con `--emulador`: solo acepta `FIRESTORE_EMULATOR_HOST=127.0.0.1:PUERTO` y usa el proyecto ficticio fijo `demo-nuvia-reglas`. Carga las reglas locales, crea documentos sintéticos en el emulador y comprueba lecturas, escrituras y borrados sin sesión. No lee credenciales ni la configuración del proyecto real. Los documentos ficticios se dejan en la memoria del emulador hasta detenerlo; no se borra una base completa para limpiar pruebas.

El modo antiguo `NUVIA_REGLAS_EN_VIVO=1` falla antes de cualquier petición. No se degrada a pruebas en producción si falta el emulador.

## Verificación y cierre

**Fase 0 terminada en local. Sin confirmar ni publicar.**

### Resultados ejecutados

| Control | Resultado y alcance |
|---|---|
| `npm run test:reglas` | Correcto, sin red. Contrato estático, cuatro mutaciones detectadas, rechazo de destinos y rutas no permitidos, ausencia de autorización en las operaciones del visitante y rechazo de redirecciones |
| Modo antiguo `NUVIA_REGLAS_EN_VIVO=1` | Rechazado con salida 2 antes de la red; comprobado con un proceso hijo |
| `--emulador` sin destino o con destino remoto | Rechazado con salida 1; no existe alternativa automática contra producción |
| `npm run test:reglas:emulador` | **36 comprobaciones correctas**: 6 lecturas públicas, 3 lecturas privadas denegadas, 18 intentos de modificación/borrado denegados y 9 verificaciones de integridad |
| Entorno de la prueba efectiva | Emulador Firestore 1.21.0 ya instalado, JDK Microsoft 21, dirección `127.0.0.1:18787`, proyecto fijo `demo-nuvia-reglas`; nueve documentos ficticios, sin importar datos ni usar credenciales reales |
| Controles estáticos y de contenido de `validate` | Correctos: paridad, sitio estático, consistencia, lenguaje, portada/Academia, Lecturas, navegación, definición, metadatos, contenido externo, privacidad de empresas y sistema editorial |
| `npm run test:analisis` | Las 14 baterías existentes terminan correctamente. Este resultado no demuestra la ausencia de los defectos ya identificados para la fase 1 |
| Preservación | HEAD y rama visual mantienen sus referencias iniciales. Sin diferencias en `company-analysis/`, `firestore.rules`, configuración Firebase, `js/` ni `cartera.html`. La copia de empresas coincide también con la rama visual |
| `git diff --check` | Sin errores de espacios. Aviso de normalización CRLF/LF en el documento de pendientes, sin cambio funcional |

El emulador se ha detenido tras la prueba y se ha comprobado el cierre del puerto. No se ha exportado ni conservado una base de prueba persistente.

Permanecen los cuatro avisos de consistencia ya existentes: cabecera y pie propios y `noindex` de `guia-impuestos.html`, más el aviso de dos imágenes sin carga diferida en `index.html`. No se corrigen dentro de esta fase. Tampoco se ha ejecutado la auditoría visual, la compilación de `dist/` ni ninguna comprobación contra producción: no hay cambios de interfaz y **no se presenta este resultado como un `validate` completo ni como autorización de publicación**.

### Archivos de la entrega

- `docs/nuvia-reglas.test.mjs`: sustituye la batería peligrosa; ejecución predeterminada sin red y modo explícito de emulación.
- `scripts/reglas-alfa-local.mjs`: contrato estricto, transporte limitado y prueba efectiva de permisos sobre datos ficticios.
- `package.json`: órdenes de prueba y control sin red añadido a `validate`, sin nuevas dependencias.
- `docs/FICHA_REGULATORIA_ALFA_BASE_PROPIA.md`: separa la conclusión histórica de la condición vigente de publicación.
- `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md`: aclaración posterior, sin alterar las decisiones históricas del fundador.
- `docs/PENDIENTE_ALFA_NUVIA_20260902.md`: distingue el plan inicial del estado actual y retira la alternativa de pruebas de escritura manuales sobre datos reales.
- Este registro: alcance, ficha previa, referencias de conservación, resultados y límites.

### Reproducción local de la prueba efectiva

Desde la carpeta oficial, en una terminal independiente y sin ejecutar el CLI de Firebase ni seleccionar un proyecto real:

```powershell
& 'C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin\java.exe' -jar 'C:\Users\oanti\.cache\firebase\emulators\cloud-firestore-emulator-v1.21.0.jar' --host 127.0.0.1 --port 18787 --project_id demo-nuvia-reglas --single_project_mode --single_project_mode_error --rules firestore.rules
```

Usar un puerto libre y una instancia exclusiva de prueba. En otra terminal, también desde la carpeta oficial:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:18787'
npm run test:reglas:emulador
```

Detener la instancia con Ctrl+C al terminar. Las rutas anteriores describen el entorno instalado de esta verificación; no son dependencias incorporadas al repositorio. La comprobación predeterminada `npm run test:reglas` no necesita Java ni emulador.

### Siguiente paso propuesto

Fase 1: corregir la actualización de históricos cacheados, tratar las ausencias parciales de sectores/regiones sin estimaciones y aislar las salidas de cada proyección de datos. Primero, pruebas de regresión que reproduzcan cada defecto con datos ficticios; después, cambios mínimos y nueva verificación. No incluye cargas reales ni publicación. Empresas permanece en preparación hasta su fase específica y la validación del contrato de datos.

La validación jurídica o de compliance de la alfa sigue pendiente. Esta fase deja clara la condición; no la resuelve ni modifica el estado del sitio que ya estaba publicado.

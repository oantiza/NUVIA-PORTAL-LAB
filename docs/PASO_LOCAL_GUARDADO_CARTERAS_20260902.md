# NUVIA · Protección de carteras guardadas en el navegador

Fecha: 2 de septiembre de 2026. Paso independiente elegido mientras el fundador completa la base de datos. No se consulta ni modifica Firebase, el catálogo, el universo o la descarga de datos; no se activa empresas ni se toca la rama visual. Se conservan los cambios locales de fases 0–2.

## Revisión previa (marco §12–§13)

Clasificación **ÁMBAR** por conservación local de composiciones potencialmente patrimoniales e instrumentos identificables. Se documenta una corrección de la función existente, no una nueva recogida de datos ni validación jurídica. Publicación pendiente de las puertas del expediente de la alfa.

1. Necesidad: informar con veracidad del guardado y evitar la pérdida accidental de carteras del navegador.
2. Datos: nombre, identificadores, etiquetas y pesos ya seleccionados por el usuario. Pruebas con datos ficticios y almacenamiento aislado.
3. Transformación: validar el formato existente, comprobar lectura/escritura y detectar cambios desde la última lectura visible.
4. Resultado: confirmación solo tras escritura comprobada; error legible ante almacenamiento inaccesible, datos ilegibles o conflicto.
5. Instrumentos: los existentes, sin ampliar el catálogo ni elegir productos.
6. Circunstancias personales: no se solicitan nuevas; no se infiere ningún perfil.
7. Conducta inversora: ninguna sugerencia de comprar, vender, mantener o no actuar.
8. Valor o precio: sin opiniones ni cálculos nuevos.
9. Mérito: ninguna puntuación, clasificación o selección por atractivo.
10. Terceros: no se reproducen recomendaciones.
11. Interfaz: estados operativos de guardado, sin valoración financiera ni rediseño.
12. Acción: guardar, cargar o borrar exclusivamente en el navegador; ninguna contratación o derivación.
13. Remuneración/conflicto: sin cambios.
14. Agente vinculado: sin sistemas ni datos profesionales; sin reutilización comercial.
15. Datos personales: se mantienen finalidad, ubicación y campos de la persistencia existente. No hay nube, telemetría, migración ni nuevas categorías. El almacenamiento local no equivale por sí solo a exención de obligaciones.
16. IA: no interviene en la función.
17. Fuentes y límites: código y contrato local existentes. El estado de almacenamiento se comprueba en el momento de la operación; no se garantiza conservación futura si el usuario borra datos o cambia de dispositivo.
18. Controles: pruebas sin red de cuota agotada, permisos denegados, JSON/formato inválido, conservación de entradas, cambios entre pestañas, nombre automático y regresión de guardado/carga/borrado.

## Fallos observados en el código

- `escribeGuardadas` silencia cualquier error y la interfaz informa de éxito igualmente.
- `leeGuardadas` convierte JSON ilegible en `[]` y filtra elementos sin avisar: guardar después puede sustituir datos previos desconocidos.
- El botón de borrado conserva un índice antiguo, pero vuelve a leer la lista: si otra pestaña la cambia, puede borrar una cartera distinta.
- El nombre automático basado en la longitud puede coincidir con una cartera existente tras un borrado y sustituirla sin que el usuario haya escrito ese nombre.

## Alcance de implementación

- Mantener la clave y el formato de persistencia; sin migraciones, limpieza, exportación ni borrado automático.
- Bloquear escrituras cuando no se puede leer/validar lo anterior; conservar los datos originales para revisión, sin intentar repararlos a ciegas.
- Comprobar el resultado de la escritura antes de anunciar éxito; conservar el nombre introducido si falla.
- Rechazar operaciones basadas en una lista que ha cambiado y mostrar la lista actual para que el usuario repita conscientemente.
- No presentar el control de versiones local como transacción entre pestañas: la API de almacenamiento no ofrece una transacción de lectura y escritura conjunta.
- Reutilizar estilos del portal. Verificación visual aislada en escritorio y tablet, sin conexiones de datos.

## Cierre

**Corrección terminada en local, sin confirmar ni publicar.** Este paso continúa la estabilización del producto ya desarrollado; no depende de terminar la base de datos ni autoriza su carga.

### Resultado funcional

- Se conserva `nuvia.carteras-visitante.v1` y su estructura de nombres, posiciones y pesos. No hay migración, borrado preventivo ni modificación de carteras reales durante las pruebas.
- La lista se valida entera. Si no se puede leer o interpretar, el guardado queda bloqueado y no se descartan entradas parcialmente válidas.
- Guardar o borrar exige que la lista no haya cambiado respecto de la última lectura visible. Si cambia, se muestra la nueva lista y se pide repetir la acción. Cargar también comprueba que la versión visible sigue vigente.
- Solo se anuncia éxito tras escribir y leer de nuevo el mismo contenido. Si no se puede confirmar, se informa de incertidumbre y no se intenta restaurar una versión anterior que pueda pisar otra pestaña.
- Un fallo conserva el nombre escrito. Hay un botón para volver a comprobar las carteras; no repara ni elimina los datos por sí mismo.
- Los nombres automáticos buscan uno libre. Se mantiene el comportamiento preexistente de actualizar cuando el usuario escribe expresamente un nombre que ya existe.

### Pruebas y límites

| Comprobación | Resultado |
|---|---|
| Antes de corregir | Siete de los ocho casos iniciales no superaban los controles; reproducidos el falso éxito al guardar/borrar, la sobrescritura de datos ilegibles, el borrado por índice obsoleto y la colisión de nombre automático |
| Nueva batería | **13/13 pruebas correctas**, con almacenamiento simulado, datos ficticios y red no inyectada bloqueada |
| Regresión existente | `test:analisis` correcto, incluidas las baterías anteriores, las 16 pruebas de fase 1, las 9 de modelos y las 13 de guardado |
| Reglas y estáticos | `test:reglas` sin red y comprobaciones estáticas, contenido, navegación, metadatos y lenguaje correctos |
| Escritorio/tablet | Verificación aislada a **1440 y 820 px**, sin desbordes horizontales del documento o panel de guardado; avisos y acciones legibles |
| Interacción en navegador | Fallo de escritura sin falso éxito; recuperación; bloqueo por datos ilegibles; reintento; conflicto de pestaña con lista B/C conservada; borrado posterior explícito de B dejando C |
| Alcance | Sin consultas a Firebase, cambios de universo, scripts de descarga/carga, empresas, HTML, rama visual, commit o publicación en esta intervención |

La habilidad de navegador permitió detectar que el estilo compartido del botón anulaba su atributo `hidden`. Se añadió **una regla CSS limitada al botón nuevo**, comprobando después que desaparece cuando no hay error. No se ha rediseñado el portal.

El banco visual está en `output/guardado-local/qa.html`, ignorado por Git: usa el constructor y estilos reales, un almacenamiento inyectado exclusivamente en memoria y `connect-src 'none'`. No lee el almacenamiento real del navegador. El historial financiero está deliberadamente fuera de la prueba; su mensaje de falta de conexión no es un fallo de guardado. Servidor temporal detenido y pestaña cerrada.

Persisten los cuatro avisos previos de consistencia. No se ejecuta la auditoría visual integral, la compilación completa de `dist/`, una prueba del despliegue ni el emulador. No se presenta este resultado como un `validate` completo ni como validación jurídica.

**Límites:** no se garantiza atomicidad entre dos escrituras exactamente simultáneas de distintas pestañas; el control evita aplicar una operación a una versión ya cambiada y comprueba el resultado inmediato. No recupera datos ilegibles, no añade copias de seguridad y no evita que el usuario borre los datos del navegador. Los adaptadores heredados de cuentas/nube permanecen sin activar y fuera de esta corrección.

### Archivos

- `js/nuvia-guardado-local.js`: lectura, validación, control de versión local y escritura comprobada.
- `js/nuvia-constructor.js`: integración en el guardado local y nombres automáticos no repetidos; cambios previos de fases 1–2 conservados.
- `estilos/nuvia-pages.css`: ocultación correcta del botón de reintento cuando lleva `hidden`.
- `docs/nuvia-guardado-local.test.mjs` y `package.json`: pruebas e incorporación a `test:analisis`.
- Este documento: diagnóstico, revisión previa, resultados y límites.

Las comprobaciones de cobertura y las incorporaciones al catálogo continúan aplazadas hasta que el fundador avise de que la base está lista. La publicación conserva las puertas pendientes del expediente ámbar.

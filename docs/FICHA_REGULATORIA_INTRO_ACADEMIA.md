# Ficha regulatoria — retirada de la apertura audiovisual de Academia NUVIA

**Fecha de retirada:** 28 de agosto de 2026

**Elemento:** vídeo de entrada previo a la visualización de `academia.html`

**Estado:** RETIRADO

**Clasificación del cambio:** VERDE

**Marco aplicado:** `docs/MARCO_REGULATORIO_OBLIGATORIO.md`

## Alcance

Academia NUVIA abre directamente en su contenido. Se han retirado la capa de
presentación, la reproducción automática, los controles, el controlador, los
estilos exclusivos y el archivo MP4 de entrada. Los vídeos educativos incluidos
en los cursos permanecen sin cambios.

## Prueba regulatoria

- No recibe, infiere ni conserva datos del usuario.
- No altera cálculos, instrumentos, comparaciones ni resultados financieros.
- No introduce recomendaciones, personalización, contratación ni derivación.
- No afecta a la separación entre NUVIA, el agente financiero vinculado y la
  entidad representada.
- Reduce una barrera previa al acceso al contenido educativo.

## Control de regresión

`docs/nuvia-academy-intro.test.mjs` comprueba que la página no vuelva a
cargar la capa, el controlador, los estilos o el MP4 retirados.

## Conclusión

La retirada es compatible con el perímetro educativo e informativo de NUVIA y
no requiere validación jurídica o de compliance adicional.

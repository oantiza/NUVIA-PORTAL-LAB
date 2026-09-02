# NUVIA · Ficha regulatoria de contenido externo

**Fecha:** 2 de septiembre de 2026

**Entrega:** 2 · Privacidad y confianza

**Clasificación:** VERDE

## Cambio

TradingView deja de cargarse automáticamente al abrir Mercados. Los vídeos de YouTube dejan de crear sus iframes al abrir Academia o Curso. Cada bloque se sustituye por una explicación contextual, una acción de carga y un enlace alternativo al proveedor.

La acción no se recuerda: cerrar o recargar la página devuelve el contenido externo al estado cerrado.

## Prueba regulatoria

1. **Finalidad:** reducir conexiones y tratamientos previos no solicitados.
2. **Datos nuevos:** ninguno.
3. **Datos evitados antes de la acción:** conexión técnica con el tercero, incluida la transmisión previa de IP y cabeceras desde el navegador.
4. **Acción del usuario:** carga voluntaria de un vídeo o panel claramente identificado.
5. **Información previa:** proveedor, efecto de la carga, ausencia de conexión mientras permanece cerrado y enlace alternativo.
6. **Cálculos y resultados:** no cambian.
7. **Recomendaciones:** no se generan.
8. **Contratación o derivación:** no existe; los enlaces externos se identifican y abren aparte.
9. **Almacenamiento:** no se añade ninguna clave ni se recuerda la elección.
10. **Separación profesional:** sin cambios.
11. **Limitación:** la información definitiva sobre el tratamiento posterior de cada tercero sigue pendiente de contratos, transferencias y validación jurídica.
12. **Clasificación:** VERDE; el cambio reduce exposición sin ampliar el tratamiento.

## Controles

- Prueba estática: bloquea cualquier script de TradingView en la cabecera y cualquier iframe inicial de YouTube en las páginas afectadas.
- Prueba de navegador: comprueba que el contenido externo no existe antes de la acción y que el vídeo se crea después de pulsar «Reproducir».
- Auditoría visual: contraste, foco, nombres accesibles, estados, desbordes y contenido en escritorio y tableta.

## Referencia de diseño

La [Guía sobre el uso de las cookies de la AEPD](https://www.aepd.es/recurso-multimedia/guia-sobre-el-uso-de-las-cookies) exige información previa y mecanismos visibles de aceptación y rechazo cuando el consentimiento sea necesario. Esta barrera contextual no pretende sustituir la validación jurídica del tratamiento de cada proveedor; aplica minimización técnica y evita la conexión hasta una solicitud expresa.

## Resultado

**Apto para publicación como mitigación técnica.** Las políticas jurídicas siguen en borrador y no deben publicarse como definitivas por este cambio.

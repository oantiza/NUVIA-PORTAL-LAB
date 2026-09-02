# NUVIA · Ficha regulatoria de terceros del módulo de empresas

**Fecha:** 2 de septiembre de 2026

**Entrega:** 2 · Privacidad y confianza

**Clasificación:** VERDE

## Cambio

El módulo local `company-analysis/` deja de solicitar las tipografías Fraunces y Roboto Flex a Google. Utiliza las copias autoalojadas de Fraunces e Inter que ya forman parte del portal.

También se retira la traducción automática de la descripción mediante el endpoint no documentado `translate.googleapis.com`. La interfaz presenta el texto original del proveedor, advierte que puede estar en inglés y declara que NUVIA no lo traduce automáticamente.

## Prueba regulatoria

1. **Finalidad:** reducir proveedores y transferencias desde el navegador.
2. **Datos nuevos:** ninguno.
3. **Datos evitados:** conexión de fuente e IP a Google Fonts; envío de la descripción y datos técnicos al traductor.
4. **Contenido mostrado:** descripción original, sin alteración ni inferencia.
5. **Cálculos:** no cambian.
6. **Orden, ranking o recomendación:** no cambian.
7. **Acceso:** no se modifica la autenticación ni el backend.
8. **Privacidad:** se elimina tratamiento, no se añade.
9. **Limitación:** la descripción puede aparecer en inglés; se informa de forma visible.
10. **Clasificación:** VERDE.

## Controles

- El build falla si reaparece `fonts.googleapis.com`, `fonts.gstatic.com`, `Roboto Flex` o la función de traducción retirada.
- El build comprueba que Inter y Fraunces se declaran mediante recursos locales.
- La compilación del módulo y las pruebas regulatorias existentes deben seguir en verde.

## Resultado

**Apto para publicación.** Reduce dependencias de terceros sin cambiar el perímetro financiero ni el acceso al módulo.

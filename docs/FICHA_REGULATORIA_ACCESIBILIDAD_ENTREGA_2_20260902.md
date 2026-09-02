# NUVIA · Ficha regulatoria de accesibilidad técnica

**Fecha:** 2 de septiembre de 2026
**Entrega:** 2 · Accesibilidad de teclado, foco y estados
**Clasificación:** VERDE
**Ámbito:** portal público de escritorio y tableta

## Necesidad que resuelve

Permitir que las personas que navegan con teclado o tecnología de asistencia identifiquen el elemento activo, comprendan el estado de selectores y pestañas y recorran los controles sin perder el foco.

## Cambios incorporados

- Foco visible común con doble contraste: banda blanca para fondos oscuros y aro verde para superficies claras.
- Protección del foco frente a sombras decorativas locales.
- Asociación automática de grupos de selección con `aria-pressed`.
- Pestañas con una única opción seleccionada, orden de tabulación móvil y panel asociado.
- Navegación de pestañas mediante flechas, Inicio y Fin.
- Estado accesible para las opciones del caso práctico del curso y para el selector de vista del calendario fiscal.
- Auditoría automática de foco, estados, pestañas, controles sin nombre y ayudas no asociadas.
- Inclusión permanente de las vistas internas de Activos y Glosario de Academia en la auditoría renderizada.

## Prueba regulatoria

1. **Finalidad:** accesibilidad y comprensión de la interfaz.
2. **Datos recibidos:** ninguno nuevo.
3. **Transformación:** únicamente atributos semánticos, orden de foco y estilos visuales.
4. **Resultado mostrado:** el mismo contenido y los mismos cálculos existentes.
5. **Instrumentos o emisores:** no se añade ninguno.
6. **Circunstancias personales:** no se incorporan ni se transmiten datos.
7. **Recomendación:** no se genera ninguna sugerencia de actuación.
8. **Orden o ranking:** no se modifica el orden económico de resultados.
9. **Contratación o derivación:** inexistente.
10. **Separación profesional:** no se altera la separación entre NUVIA, el agente vinculado y la entidad representada.
11. **Privacidad:** no se crean nuevos tratamientos, cookies, almacenamiento ni proveedores.
12. **IA:** no se utiliza IA en tiempo de ejecución.
13. **Fuentes y fechas:** no se modifican datos editoriales, financieros ni fiscales.
14. **Limitaciones:** la prueba automática no sustituye una evaluación humana completa con lectores de pantalla.
15. **Supervisión:** la validación bloquea la construcción cuando detecta un control sin foco perceptible, un estado visual sin semántica o una pestaña incoherente.
16. **Revisión futura:** las nuevas vistas interactivas deben incorporarse al inventario de render.
17. **Clasificación:** VERDE; no cambia el perímetro funcional ni regulatorio del producto.

## Verificación registrada

- Escritorio, 1440 px: foco, estados, pestañas, nombres y ayudas sin incidencias en todas las vistas auditadas.
- Tableta, 820 px: las dimensiones de accesibilidad quedan en cero. Se mantiene únicamente la desviación tipográfica de 30 px de Cartera ya reservada a la Entrega 4; no procede de este cambio.
- Las vistas `academia.html?tab=activos` y `academia.html?tab=glosario` verifican además el cambio de pestaña con flecha derecha.

## Resultado

**Apto para publicación.** El bloque mejora el acceso al contenido sin alterar cálculos, lenguaje financiero, datos, proveedores ni decisiones del usuario.

# Criterios del proyecto NUVIA Portal Lab

## Orden vigente del fundador · alfa · 03-09-2026

- **No se bloquea nada en la alfa sin consulta previa al fundador.** No decidir
  unilateralmente desactivar, ocultar, retirar, restringir ni añadir bloqueos a
  funciones, datos, módulos o pasos del desarrollo. Presentar evidencia y opciones;
  el fundador decide y autoriza.
- **No guardar datos personales de nadie en la base de datos sin autorización
  previa y expresa del fundador**, tampoco mediante importaciones, pruebas,
  migraciones o escrituras automáticas. Una orden general de continuar no la concede.
- Continuar el desarrollo completo bajo sus órdenes expresas. **Solo el fundador
  decide y autoriza** cambios de alcance y actuaciones que requieran autorización;
  los informes y las opiniones de colaboradores no sustituyen su decisión.
- Toda duda regulatoria o conflicto con lo decidido anteriormente **se consulta
  al fundador antes de actuar**. Conservar el estado existente mientras responde
  y continuar las tareas autorizadas que no dependan de esa decisión.
- Registrar la consulta y su respuesta sin firmar ni ratificar por él. No falsear
  pruebas ni datos. Esta orden no implica retirar bloqueos existentes, publicar,
  activar funciones ni modificar Firebase/backend automáticamente.
- Esta orden de procedimiento prevalece, durante la alfa, sobre instrucciones
  internas anteriores de bloqueo unilateral. Su referencia canónica es
  `docs/MARCO_REGULATORIO_OBLIGATORIO.md`, v1.2, §0; debe leerse antes de actuar.

## Definición canónica de NUVIA

- `docs/DEFINICION_NUVIA.md` es el documento vivo que define qué es NUVIA,
  para qué existe y cuál es su espíritu. Debe tratarse como contexto esencial
  en las tareas de producto, contenido, diseño y comunicación.
- La definición está sujeta a retoques finales. Si cambia, debe actualizarse
  primero ese documento para conservar una única versión canónica.
- Si alguna formulación entra en conflicto con el marco regulatorio obligatorio,
  prevalece siempre el marco regulatorio.

## Cumplimiento regulatorio obligatorio

- Antes de diseñar, programar, modificar, revisar o publicar cualquier elemento
  se debe leer y aplicar íntegramente
  `docs/MARCO_REGULATORIO_OBLIGATORIO.md`.
- Ese marco se aplica a todo el portal, incluidos textos, interfaz, cálculos,
  gráficos, IA, datos, APIs, colaboradores, monetización y la copia local de
  `company-analysis/`.
- Es una norma superior del proyecto. Si otro documento, petición funcional o
  implementación entra en conflicto con ella, prevalece el marco regulatorio.
- Orden del fundador de 03-09-2026: la validación jurídica externa queda fuera
  del alcance de la alfa y no se utiliza como bloqueo. Aplicar la excepción del
  §0 del marco; mantener controles internos, límites del producto y calidad de datos.
- NUVIA puede calcular y explicar métodos financieros académicos, incluidos
  máximo Sharpe, mínima volatilidad y frontera eficiente, pero no puede convertir
  el resultado en una recomendación, juicio de idoneidad o llamada a operar.
- Cada nueva función o cambio material debe someterse a la prueba regulatoria y
  las puertas de control definidas en el marco. En la alfa, cualquier duda o
  propuesta de bloqueo se consulta previamente al fundador; no se bloquea por
  iniciativa del ejecutor. Fuera de la alfa se aplica la regla general del marco.
  Un descargo no corrige una función incompatible.
- Debe preservarse la separación estricta entre NUVIA, la actividad profesional
  del agente financiero vinculado y la entidad a la que representa.

- El repositorio único y oficial del proyecto es `https://github.com/oantiza/NUVIA-PORTAL-LAB.git`.
- La carpeta local única y oficial de trabajo es `C:\Users\oanti\Documents\NUVIA-PORTAL-LAB`.
- NUVIA Portal Lab es la única versión activa de este proyecto: no se deben leer, modificar, sincronizar ni publicar otras carpetas o repositorios de NUVIA.
- La producción oficial se publica en GitHub Pages en `https://oantiza.github.io/NUVIA-PORTAL-LAB/`.
- Estas referencias deben utilizarse en todas las tareas relacionadas con este proyecto, sin recuperar rutas o repositorios anteriores.
- Cada actualización de `main` debe compilar y desplegar `dist/` mediante GitHub Actions.
- Firebase Hosting deja de ser el canal oficial y no debe publicarse salvo petición expresa del usuario.

- El producto se diseña, revisa y presenta únicamente para escritorio y tablet.
- No se debe crear, optimizar, probar ni mostrar una versión móvil salvo petición expresa del usuario.
- La portada y, en especial, su hero son la referencia visual para mantener homogéneas todas las páginas.
- Deben conservarse las rutas, calculadoras, contenidos dinámicos y la integración de la suite de cartera al aplicar cambios visuales.

- El módulo `Análisis y valoración de empresas` vive como copia independiente en `company-analysis/` dentro de este repositorio.
- La vista de cartera debe cargar esa copia local y no la aplicación externa original.
- No se debe modificar ni publicar el programa fuente original. Cualquier cambio del módulo se realizará únicamente sobre la copia de NUVIA Portal Lab.
- La copia mantiene conexión con la API de datos existente; cualquier modificación o duplicación de ese backend requiere una petición expresa del usuario.

# Informe de traspaso para Claude Fable 5.1

## Revisión independiente de las Fases 1 y 0 de NUVIA Portal Lab

**Fecha:** 1 de septiembre de 2026  
**Proyecto:** NUVIA Portal Lab  
**Estado:** informe para contraste; no autoriza publicación ni desarrollo adicional  
**Siguiente fase prevista:** Fase 2 · Texto y arquitectura canónica

---

## 1. Objeto de este informe

Este documento permite a Claude Fable 5.1 realizar una segunda revisión independiente del trabajo efectuado después de consolidar las auditorías de ChatGPT y Claude.

La revisión solicitada debe comprobar:

1. si las decisiones de la Fase 0 representan fielmente la visión expresada por el fundador;
2. si mantienen una frontera regulatoria clara entre educación, información, cálculo y asesoramiento;
3. si existe alguna contradicción entre el acta, la definición canónica, el plan final y el marco regulatorio;
4. si la Fase 2 puede comenzar sin decisiones de identidad pendientes;
5. qué ajustes concretos recomienda antes de trasladar estas decisiones a la web.

Este informe no pide a Claude que modifique archivos. Se solicita primero una revisión con hallazgos priorizados, evidencia y propuesta de corrección. Tampoco autoriza commits, publicación, despliegue ni desarrollo de funciones futuras.

---

## 2. Reglas superiores del proyecto

Antes de emitir conclusiones, Claude debe leer íntegramente:

1. `docs/MARCO_REGULATORIO_OBLIGATORIO.md`.
2. `docs/DEFINICION_NUVIA.md`.
3. `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md`.
4. `docs/IDEAS_FUTURAS_NO_ACTIVAS_NUVIA_20260901.md`.
5. `docs/PLAN_APLICACION_FINAL_NUVIA_20260901.md`.

Jerarquía aplicable:

1. legislación y obligaciones vinculantes;
2. compatibilidad profesional del agente financiero vinculado;
3. marco regulatorio obligatorio de NUVIA;
4. definición canónica;
5. actas, informes y planes;
6. implementación.

Una redacción atractiva no es admisible si sugiere recomendación, gestión, idoneidad, promesa de resultado, captación o derivación comercial. Un descargo no corrige una función o experiencia incompatible.

---

## 3. Entorno oficial y límites de alcance

- **Repositorio único:** `https://github.com/oantiza/NUVIA-PORTAL-LAB.git`.
- **Carpeta oficial:** `C:\Users\oanti\Documents\NUVIA-PORTAL-LAB`.
- **Producción:** `https://oantiza.github.io/NUVIA-PORTAL-LAB/`.
- **Canal de publicación:** GitHub Pages mediante GitHub Actions.
- **Dispositivos dentro de alcance:** escritorio y tableta.
- **Móvil:** fuera de alcance salvo petición expresa.
- **Referencia visual:** portada y hero de NUVIA.
- **Estado de publicación de estos cambios:** no publicados ni confirmados en Git.

Debe preservarse el trabajo previo que ya existe sin confirmar en el directorio. No debe interpretarse que todo cambio visible en el árbol de trabajo procede de esta intervención.

---

## 4. Visión expresada por el fundador

NUVIA nace de una preocupación principal: muchas personas están desorientadas respecto a su dinero, el ahorro y las decisiones económicas. Economía y Finanzas es por ello una base importante, aunque no se desea presentar públicamente una jerarquía que reste valor al resto del proyecto.

La visión se organiza en cinco espacios:

1. **Economía y Finanzas:** mercados, noticias, conceptos, cartera y analítica.
2. **Patrimonio:** vivienda, coste de la vida, impuestos, jubilación y planificación patrimonial.
3. **Familia, Salud y Bienestar:** familia, cuerpo, mente, hábitos, bienestar y salud general.
4. **Academia NUVIA:** centro de conocimiento, conceptos esenciales, guías, vídeos, herramientas y cursos progresivos.
5. **Lecturas con Criterio:** libros, informes y ensayos relacionados con el espíritu de NUVIA, con una posible dimensión comunitaria futura.

Ideas relevantes expresadas durante la conversación:

- cartera no debe convertirse en un espacio principal independiente;
- planificación patrimonial pertenece a Patrimonio, no a Salud y Bienestar;
- Academia puede llegar a ser el corazón formativo de NUVIA;
- Lecturas no pretende recomendar literatura general, sino obras vinculadas con economía, patrimonio, comportamiento, psicología, bienestar, aprendizaje y criterio;
- opiniones, votaciones y foro de Lecturas son posibilidades futuras, no producto actual;
- el futuro cuestionario patrimonial debería ordenar temas vitales y económicos, pero no puede transformarse en perfil de inversión, recomendación o asesoramiento;
- la página «Qué es NUVIA» gusta al fundador y debe conservarse en gran medida;
- un vídeo basado en esa misma página puede ser útil, sin añadir teoría ni alargar el mensaje.

---

## 5. Fase 1 ejecutada: reparaciones urgentes

La primera entrega aplicada resolvió los problemas que afectaban de forma inmediata a confianza, actualidad y presentación.

### 5.1. Noticias y mercados

- Se actualizó la noticia económica con fuente y fecha de publicación reales.
- Se añadió un estado de frescura: del día, reciente o última disponible.
- Si la última comprobación supera 36 horas, el contenido deja de presentarse como noticia «del día».
- Se eliminó la presentación engañosa de un «Informe diario» antiguo.
- La sección de informes muestra ahora «En preparación» hasta que exista una edición revisada.
- Se corrigió la composición de la noticia principal para admitir títulos y entradillas completos.

### 5.2. Portada, tipografía y contraste

- Se corrigieron numeraciones y etiquetas pequeñas que no alcanzaban contraste suficiente.
- Se sustituyeron tamaños fuera de la escala prioritaria.
- Se ajustó el título introductorio de la portada.

### 5.3. Cabecera de tableta

- Se implantó una cabecera de dos niveles entre 768 y 1199 px.
- Se añadió una comprobación automática de colisiones basada en los rectángulos reales de logotipo y navegación.

### 5.4. Página «Qué es NUVIA»

- Se incorporó a la auditoría automática de render.
- Se añadieron mínimos de contenido esperados.
- Se corrigieron desviaciones tipográficas y un desbordamiento lateral.
- La revisión visual a 820 px confirma que el hero conserva legibilidad una vez finaliza su animación de entrada.

### 5.5. Imágenes

Se optimizaron las tres imágenes nuevas realmente activas de mayor peso:

- portada de Patrimonio;
- banner de Academia;
- hero de «Qué es NUVIA».

El peso conjunto aproximado pasó de 7,5 MB a 551 KB. El PNG de Lecturas señalado por la auditoría no estaba publicado y no se eliminó durante esta entrega.

### 5.6. Pruebas

- Playwright quedó declarado como dependencia reproducible.
- La ausencia del navegador ya no omite silenciosamente la auditoría.
- La integración continua prepara Chromium antes de validar.
- Inicio, Mercados y «Qué es NUVIA» pasaron la matriz 1440, 1280, 1180, 1024, 900, 820 y 768 px.
- La compilación final comprobó 19 vistas a 1440 px sin fallos de contraste, tipografía, desbordamiento, cabecera o contenido mínimo.
- `npm run build` finalizó correctamente; `dist/` quedó en unos 12,1 MB.

### 5.7. Precisión sobre el cierre

La entrega urgente está cerrada dentro de su alcance. Una auditoría completa de todas las páginas en todos los anchos intermedios detectó desviaciones tipográficas anteriores en páginas no urgentes. Esas desviaciones no afectan al cierre de la noticia, la portada, la página institucional o la cabecera y se han reservado para la Fase 4 de homogeneización integral.

Claude debe señalar si considera que esta separación de alcance contradice literalmente algún criterio de cierre del plan consolidado.

---

## 6. Fase 0 cerrada: decisiones de dirección

Las decisiones se documentaron en `docs/ACTA_DECISIONES_FASE_0_NUVIA_20260901.md`.

### D1. Arquitectura

Se fijan cinco espacios: Economía y Finanzas; Patrimonio; Familia, Salud y Bienestar; Academia NUVIA; Lecturas con Criterio.

### D2. Definición central

> NUVIA es un lugar donde las familias aprenden a entender su dinero.

Se mantiene además:

> NUVIA informa, explica y calcula. Tú comprendes y decides.

### D3. Subtítulo de portada

> Información, formación y herramientas para familias que quieren comprender su dinero y pensar a largo plazo.

### D4. Lenguaje institucional

Se adopta un registro educativo, independiente y no prescriptivo. Para el pie se aprueba:

> NUVIA reúne información, formación y herramientas para comprender la economía familiar y pensar a largo plazo.

Esta frase sustituirá al texto que afirma que NUVIA acompaña a preservar, hacer crecer y transferir patrimonio.

### D5. Norma tipográfica

Se adopta la solución de doble función:

- Fraunces para aperturas y títulos editoriales, manifiestos, citas y composición expresiva;
- sans serif para navegación, acciones, formularios, datos, herramientas, tablas, estados y metadatos;
- mínimo funcional de 14 px;
- 12 px solo para etiquetas breves de contraste alto.

### D6. Futuro no activo

Se separan y registran como ideas en estudio:

- cuestionario de planificación patrimonial;
- opiniones, propuestas, votaciones y foro de Lecturas;
- cuentas y suscripción;
- nuevas funciones de Salud y Bienestar;
- personalización con datos familiares, patrimoniales, fiscales o sanitarios.

No están aprobadas para diseño, desarrollo o publicación.

---

## 7. Valoración preliminar del cierre de la Fase 0

El cierre es coherente porque:

- recoge literalmente los cinco espacios expresados por el fundador;
- conserva la frase central ya presente en la definición canónica y en la página institucional;
- elimina verbos que podrían presentar a NUVIA como prestadora de un servicio patrimonial;
- mantiene Academia como corazón formativo posible sin convertirla en una promesa de superioridad;
- protege las ideas de comunidad, cuestionario, salud y suscripción frente a un desarrollo prematuro;
- convierte la tipografía que ya da carácter al sitio en una norma verificable;
- permite comenzar la Fase 2 con decisiones escritas.

Punto que Claude debe valorar especialmente: la instrucción del usuario fue «sigue con fase 0». El acta considera las recomendaciones consolidadas adoptadas para ejecución. Si Claude entiende que alguna de las seis decisiones exige una ratificación individual adicional del fundador, debe identificar exactamente cuál, por qué y qué alternativa propone.

---

## 8. Siguiente trabajo previsto: Fase 2

No debe ejecutarse dentro de esta revisión. Su orden acordado es:

1. actualizar `docs/DEFINICION_NUVIA.md` con los cinco espacios;
2. actualizar la ficha regulatoria de «Qué es NUVIA»;
3. sustituir las puertas de `que-es-nuvia.html` sin rediseñar el resto de la página;
4. aplicar el subtítulo aprobado y añadir un único enlace hacia «Qué es NUVIA» en la portada;
5. unificar nombres y agrupaciones en navegación y pie;
6. actualizar las pruebas de definición y navegación;
7. validar y revisar visualmente antes de publicar.

---

## 9. Preguntas concretas para Claude Fable 5.1

Claude debe responder por prioridad y con referencias exactas a archivos y apartados:

1. ¿Existe alguna contradicción material entre las decisiones D1–D6 y el marco regulatorio?
2. ¿La definición central y el subtítulo diferencian suficientemente NUVIA de un servicio de asesoramiento o gestión?
3. ¿El texto institucional aprobado para el pie es claro, atractivo y seguro?
4. ¿La separación entre Economía y Finanzas, Patrimonio y Academia evita duplicidades?
5. ¿Familia, Salud y Bienestar está suficientemente acotada antes de su futura definición editorial?
6. ¿El registro de ideas futuras bloquea adecuadamente cuestionario, comunidad, salud personalizada y suscripción?
7. ¿La norma tipográfica es suficientemente concreta para aplicarse sin homogeneizar en exceso la personalidad visual?
8. ¿Debe ratificarse individualmente alguna decisión antes de comenzar la Fase 2?
9. ¿Qué tres cambios, como máximo, mejoraría Claude en el acta antes de trasladarla a la web?

---

## 10. Formato de respuesta solicitado

1. **Conclusión ejecutiva:** apta o no apta para comenzar la Fase 2.
2. **Hallazgos críticos:** solo incompatibilidades o decisiones realmente bloqueantes.
3. **Hallazgos importantes:** ambigüedades que conviene corregir antes de editar la web.
4. **Mejoras opcionales:** refinamientos que no bloquean.
5. **Propuesta de redacción:** únicamente para los textos que Claude considere necesario cambiar.
6. **Veredicto por decisión:** D1, D2, D3, D4, D5 y D6 — aprobar, ajustar o ratificar.

No se considera útil una reescritura general del proyecto. Se necesita contraste crítico, concreto y trazable.


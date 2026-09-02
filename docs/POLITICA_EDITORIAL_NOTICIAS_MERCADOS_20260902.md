# NUVIA · Política editorial de noticias y mercados

**Versión:** 1.0  
**Fecha:** 2 de septiembre de 2026  
**Estado:** norma interna operativa de la Entrega 3

## 1. Finalidad

La sección de noticias existe para aportar contexto económico comprensible. No pretende anticipar el mercado, seleccionar inversiones ni convertir la actualidad en una recomendación.

NUVIA diferencia siempre:

- la fecha de publicación del medio;
- la fecha en que NUVIA selecciona el contenido;
- la fecha del último intento automático de actualización;
- la fecha de la última actualización completada.

Ninguna comprobación técnica convierte una noticia antigua en una noticia «del día».

## 2. Fuentes iniciales permitidas

En esta versión se consultan únicamente los canales RSS de:

- EL PAÍS Economía;
- Expansión.

Añadir otra fuente exige comprobar atribución, estabilidad, condiciones de uso, calidad de fechas y adecuación temática. La inclusión en esta lista no acredita por sí sola derechos para reproducir fotografías, artículos o fragmentos protegidos.

## 3. Selección

La selección es automática y utiliza reglas iguales para todos los medios:

- antigüedad máxima de 72 horas para elegir una pieza nueva;
- exclusión de opinión, firmas, consultorios personales y temas ajenos al ámbito económico;
- puntuación por relevancia económica y cercanía temporal;
- eliminación de titulares duplicados o muy similares;
- exactamente una noticia principal y tres lecturas breves cuando la actualización se completa.

La selección automática debe identificarse como tal. «Seleccionada por NUVIA» no equivale a una revisión humana ni a una recomendación.

## 4. Estados de actualidad

El estado se calcula con la fecha real de publicación del medio:

| Estado | Regla visible |
|---|---|
| Del día | Publicada en la fecha actual de Madrid y actualización completada |
| Reciente | Publicada hace como máximo 36 horas |
| Última disponible | Publicada hace más de 36 y hasta 72 horas, o el último intento ha fallado |
| Archivo económico | Publicada hace más de 72 horas; nunca se presenta como actual |

Si falla la actualización, se conserva la última selección con su fecha y fuente, se muestra que la actualización está pendiente y no se modifica la fecha de publicación.

## 5. Modelo mínimo de cada noticia

Cada pieza debe incluir:

- identificador estable dentro de la edición;
- título;
- resumen editorial neutral;
- categoría;
- fuente y URL original HTTPS;
- fecha de publicación legible y fecha ISO verificable;
- fecha de selección;
- imagen decorativa propia, texto alternativo y procedencia documentada;
- contexto y explicación de por qué la variable económica importa;
- modo de selección automática o humana.

## 6. Lenguaje y límites

- No se utilizarán llamadas a comprar, vender o mantener.
- No se presentará un medio, empresa o activo como recomendado.
- No se convertirá el movimiento de una sesión en una instrucción patrimonial.
- Los resúmenes de NUVIA serán propios, breves y atribuidos; no copiarán el cuerpo del artículo.
- La fuente original permanecerá accesible mediante enlace.
- Los errores de fuente se comunicarán sin inventar contenido ni fechas.

## 7. Imágenes

La actualización no descarga ni republica fotografías de los medios. Todas las noticias utilizan como apoyo visual decorativo un activo propio de NUVIA, generado el 1 de septiembre de 2026 y documentado en `src/assets/social/README.md`. La imagen no se presenta como fotografía del acontecimiento ni como material aportado por la fuente.

Incorporar en el futuro otra imagen exige documentar su autoría o licencia antes de publicarla. La existencia de una URL en un RSS o una página no acredita el derecho a reproducirla.

## 8. Frecuencia y responsabilidad

- Intento automático: una vez al día mediante el proceso de publicación.
- Ventana prevista: después de actualizar las referencias oficiales diarias.
- Responsable editorial: pendiente de designación por el titular.
- Corrección o retirada: cualquier pieza con fecha, fuente o atribución errónea debe retirarse o corregirse en la siguiente publicación, dejando registro interno.

## 9. Criterio de cierre

La Entrega 3 solo se considerará cerrada cuando:

1. las cuatro noticias tengan fecha ISO, fuente y URL válidas;
2. el estado visible dependa de la publicación real y no de la última comprobación;
3. un fallo conserve el contenido sin llamarlo actual;
4. el diseño admita titulares largos sin corte;
5. las pruebas impidan fechas futuras, duplicados y estados engañosos;
6. la procedencia de las imágenes esté documentada y la actualización no realoje fotografías de prensa.

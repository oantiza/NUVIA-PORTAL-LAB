# Cierre de la Entrega 3B · Línea base estabilizada

**Proyecto:** NUVIA Portal Lab  
**Fecha:** 2 de septiembre de 2026  
**Estado:** apta para confirmar y publicar  
**Ámbito:** web ya desarrollada, exclusivamente en escritorio y tableta  

## 1. Objetivo y límites

La Entrega 3B fija una línea base fiable antes de iniciar la homogeneización visual de la Entrega 4A. Su finalidad no es rediseñar páginas ni ampliar el producto, sino comprobar que lo existente funciona, identificar desviaciones con datos reproducibles y corregir únicamente regresiones reales.

Se han respetado los siguientes límites:

- no se ha abierto, modificado ni publicado Firebase, Firestore, Authentication, Functions, Storage, usuarios o configuración;
- no se ha adoptado ninguna decisión condicionada por la futura base de datos;
- no se ha activado el panel externo de TradingView durante la auditoría;
- no se ha abierto la vista embebida de empresas, porque su ejecución puede iniciar conexiones con la infraestructura provisional;
- la integración de empresas se ha verificado de forma estática y mediante sus pruebas existentes;
- no se ha trabajado sobre móvil: la matriz cubre únicamente escritorio y tableta, de 768 a 1440 px;
- no se han incorporado a la entrega documentos no confirmados relativos al futuro backend.

## 2. Inventario auditado

La auditoría de render comprende 23 vistas funcionales:

1. `index.html`
2. `mercados.html`
3. `mercados.html?vista=cotizaciones`
4. `cartera.html`
5. `cartera.html?vista=models`
6. `academia.html`
7. `academia.html?tab=activos`
8. `academia.html?tab=glosario`
9. `curso.html`
10. `lecturas.html`
11. `vivienda.html`
12. `fiscalidad.html`
13. `jubilacion.html`
14. `temas.html`
15. `temas.html?topic=bienestar`
16. `temas.html?topic=planificacion-patrimonial`
17. `guia-calendario.html`
18. `guia-ahorro.html`
19. `guia-sucesiones.html`
20. `guia-planificacion.html`
21. `guia-fiscal.html`
22. `sistema-visual.html`
23. `que-es-nuvia.html`

Estas vistas representan seis familias actuales:

- **institucional:** portada, Qué es NUVIA, Temas y sistema visual;
- **actualidad y mercados:** Mercados, noticias, indicadores y cotizaciones;
- **laboratorio financiero:** cartera propia y carteras modelo;
- **herramientas patrimoniales:** vivienda, impuestos y jubilación;
- **conocimiento:** Academia, conocimientos esenciales, glosario y curso;
- **editorial:** Lecturas con Criterio y guías.

`guia-impuestos.html` se mantiene como redirección temporal con `noindex`; la validación estática la incluye, pero no constituye una vista independiente de la matriz de render.

## 3. Cobertura de la comprobación

### 3.1 Matriz visual

Se han comprobado las 23 vistas en siete anchos:

- 1440 px;
- 1280 px;
- 1180 px;
- 1024 px;
- 900 px;
- 820 px;
- 768 px.

El resultado equivale a **161 combinaciones de página y ancho**.

En cada combinación se han comprobado:

- contraste AA;
- texto inferior a 12 px;
- escala de títulos fluidos;
- desbordamiento horizontal;
- colisiones de cabecera;
- controles sin etiqueta;
- ayudas y mensajes;
- foco visible;
- estados de componentes;
- pestañas;
- contenido externo;
- fugas o contenidos inesperados;
- errores de consola, distinguiendo los ya conocidos.

### 3.2 Validación funcional y normativa

La validación completa ha quedado en verde para:

- paridad de archivos;
- estructura del sitio estático;
- consistencia editorial;
- lenguaje regulatorio;
- definición canónica de NUVIA;
- metadatos;
- navegación;
- contenido externo;
- privacidad de la copia local del módulo de empresas;
- política editorial de noticias y mercados;
- Academia y Lecturas;
- cálculos, gráficos, constructor, cuenta, informes, modelos y etiquetado de cartera.

## 4. Resultado consolidado

### 4.1 Controles sin incidencias

En las 161 combinaciones se han obtenido los siguientes resultados:

- **0 fallos de contraste AA**;
- **0 textos ilegibles por tamaño inferior al mínimo**;
- **0 colisiones de cabecera**;
- **0 controles sin etiqueta**;
- **0 fallos de ayuda, foco, estados o pestañas**;
- **0 fugas de contenido**;
- **0 activaciones no consentidas de contenido externo**;
- **0 desbordamientos horizontales**, después de aplicar la corrección descrita en el apartado 5.

### 4.2 Consola

No se han encontrado regresiones nuevas. El auditor conserva como ruido conocido:

- 10 avisos en cada vista dinámica de Academia;
- 4 avisos en Jubilación;
- 1 aviso en Fiscalidad.

Estos avisos no bloquean la navegación ni los cálculos y quedan como deuda técnica identificada para una entrega posterior.

### 4.3 Avisos estáticos no bloqueantes

La validación estática mantiene cuatro avisos conocidos:

- `guia-impuestos.html` no usa la cabecera común;
- `guia-impuestos.html` no usa el pie común;
- `guia-impuestos.html` tiene `noindex`;
- la portada contiene dos imágenes principales sin carga diferida.

Los tres primeros corresponden a una redirección temporal en preparación. El cuarto es correcto para recursos visuales prioritarios de la portada, que no deben retrasarse.

## 5. Corrección aplicada

### Desbordamiento del sistema visual a 768 px

**Problema:** el encabezado de `sistema-visual.html` medía 715 px dentro de un espacio disponible de 672 px.  
**Causa:** logotipo, navegación y distintivo de estado permanecían obligados a una sola línea.  
**Corrección:** a partir de 860 px el contenedor puede reorganizarse, y la navegación ocupa una segunda fila distribuida en todo el ancho.  
**Resultado:** 820 y 768 px quedan sin desbordamiento y conservan todos los enlaces visibles.

En la misma página se han actualizado dos datos de coherencia:

- `En uso · 13 páginas` pasa a `En uso · 18 páginas`;
- `Academia Nuvia` pasa a la denominación oficial `Academia NUVIA`.

## 6. Desviaciones visuales reservadas para la Entrega 4A

No son fallos funcionales ni bloquean la publicación. Son títulos que se apartan de la escala tipográfica común y deben resolverse dentro de la homogeneización, no mediante correcciones aisladas.

| Vista | Ancho | Tamaño observado | Elemento |
|---|---:|---:|---|
| Cartera | 1280 | 38,4 px | Cabecera del laboratorio y dos cabeceras de fase |
| Cartera modelo | 1280 | 38,4 px | Cabecera del laboratorio y dos cabeceras de fase |
| Curso | 1280 | 38,4 px | Hero y cuerpo de capítulo |
| Lecturas | 1280 | 38,4 px | Texto del hero |
| Jubilación | 1280 | 38,4 px | Cuadrícula del hero |
| Guía calendario | 1280 | 38,4 px | Título principal |
| Guía ahorro | 1280 | 38,4 px | Título principal |
| Guía sucesiones | 1280 | 38,4 px | Título principal |
| Guía planificación | 1280 | 38,4 px | Título principal |
| Guía fiscal | 1280 | 38,4 px | Título principal |
| Cartera y cartera modelo | 1180 | 35,4 px | Dos cabeceras de fase |
| Cartera y cartera modelo | 1024 | 30,72 px | Dos cabeceras de fase |
| Cartera y cartera modelo | 900, 820 y 768 | 30 px | Dos cabeceras de fase |

### Prioridad propuesta para 4A

1. Definir una escala canónica de títulos por arquetipo, no por página.
2. Normalizar primero Cartera, porque repite la desviación en seis anchos.
3. Normalizar conjuntamente las cinco guías para evitar cinco soluciones distintas.
4. Ajustar Curso, Lecturas y Jubilación respetando su personalidad editorial.
5. Repetir la matriz completa y exigir cero desviaciones antes de cerrar 4A.

## 7. Revisión visual cualitativa

Se han inspeccionado capturas representativas de Portada, Mercados, Cartera, Vivienda, Academia, Lecturas, Qué es NUVIA y Sistema visual a 1440 y 768 px.

Conclusiones:

- la portada conserva una entrada clara, jerarquía adecuada y transición coherente hacia el proyecto y los cinco espacios;
- los banners inferiores de Academia y Lecturas se muestran completos al entrar en pantalla; su ausencia aparente en una captura completa era consecuencia de la carga diferida, no un fallo de la web;
- la noticia económica de Mercados ya se muestra completa y legible, sin recorte del titular;
- las tarjetas de noticias mantienen altura, lectura y llamadas a la acción coherentes;
- Cartera mantiene sus tres entradas y el laboratorio no presenta desbordamientos;
- Vivienda conserva calculadora, pestañas y contenido introductorio sin pérdida de información;
- Academia es funcional y coherente, aunque su profundidad de contenido deberá crecer en una fase posterior;
- Lecturas mantiene una personalidad editorial propia sin romper la estructura común;
- Qué es NUVIA funciona como pieza institucional diferenciada y presenta correctamente el propósito;
- el sistema visual vuelve a ser usable en tableta después de la corrección del encabezado.

## 8. Integración de análisis de empresas

La integración se ha comprobado sin ejecutarla:

- la pestaña `Análisis y valoración de empresas` continúa presente;
- el `iframe` conserva la ruta local `company-analysis/index.html?embedded=web2`;
- la ruta local existe tanto en la fuente como en la compilación actual;
- las pruebas confirman fuentes autoalojadas y ausencia del traductor externo no documentado.

La ejecución interactiva queda expresamente aplazada mientras pueda depender de la infraestructura provisional.

## 9. Veredicto

**La Entrega 3B es apta para confirmar y publicar.**

La web existente queda funcionalmente estable y dispone de una línea base medible para la Entrega 4A. No se recomienda introducir más correcciones puntuales de estilo antes de definir la escala y los componentes comunes de esa entrega, porque hacerlo aumentaría la fragmentación que precisamente se quiere eliminar.

## 10. Siguiente paso autorizado

Iniciar la **Entrega 4A · Homogeneización visual**, limitada a la interfaz ya desarrollada:

1. cerrar tokens de tipografía, anchos, espaciado y radios;
2. definir patrones canónicos de cabecera, hero, pestañas, tarjetas, formularios y pie;
3. aplicar primero a una página piloto de cada familia;
4. validar el piloto en 1440, 1024 y 768 px;
5. extender el patrón al resto de vistas;
6. repetir las 161 comprobaciones y la revisión regulatoria;
7. no modificar ni conectar la base de datos durante el proceso.

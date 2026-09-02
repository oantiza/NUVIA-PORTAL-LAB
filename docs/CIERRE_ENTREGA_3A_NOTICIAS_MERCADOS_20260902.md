# NUVIA · Cierre de la Entrega 3A · Noticias y Mercados

**Fecha:** 2 de septiembre de 2026  
**Estado:** cierre técnico y regulatorio en verde  
**Ámbito:** `mercados.html`, actualización editorial, datos, estilos y pruebas  
**Infraestructura:** trabajo local y publicación estática; Firebase no se ha consultado ni modificado

---

## 1. Resultado

La Entrega 3A resuelve los dos fallos que originaron la revisión:

1. las noticias ya no aparentan estar actualizadas por la fecha de comprobación técnica, sino que muestran la fecha real de publicación del medio;
2. la noticia económica principal admite titulares largos sin corte, solape ni pérdida de contenido en escritorio y tableta.

La selección vigente al cerrar la entrega es:

- **Título:** «Cómo entender la actual paradoja de los bonos y las acciones».
- **Fuente:** Expansión.
- **Publicación:** 2 de septiembre de 2026.
- **Estado editorial:** actualización correcta.
- **Fuentes consultadas:** EL PAÍS Economía y Expansión.

## 2. Cambios implantados

### Actualidad y trazabilidad

- Fecha ISO de publicación para la noticia principal y las tres noticias breves.
- Fecha de selección de cada pieza.
- Fecha del último intento y del último éxito de actualización.
- Estado técnico `ok`, `degraded` o `failed`.
- Lista de fuentes correctas y fuentes fallidas.
- Cálculo visible de cuatro estados: del día, reciente, última disponible y archivo.
- Conservación de la última selección si falla la actualización, sin alterar su fecha.

### Selección editorial

- Ventana máxima de 72 horas.
- Exclusión de opinión, firmas, blogs y consultorios personales.
- Deduplificación de titulares y enlaces.
- Una noticia principal y exactamente tres lecturas breves.
- Resúmenes neutrales mediante reglas cerradas, sin recomendación ni llamada a operar.

### Imágenes

- Eliminada la descarga y republicación de fotografías de los medios.
- Sustitución por un activo editorial propio de NUVIA.
- Procedencia documentada en `src/assets/social/README.md`.
- Imagen tratada como decoración, no como fotografía del acontecimiento.
- La prueba automática impide recuperar el sistema anterior de imágenes de prensa.

### Interfaz

- Estado de actualización visible mediante `aria-live`.
- Fecha principal y fechas secundarias mediante elementos `time` con `datetime`.
- Titular principal sin `line-clamp` y con salto de palabra seguro.
- Tarjetas secundarias preparadas para titulares largos.
- Estado de archivo diferenciado sin convertirlo en una noticia actual.
- Sustitución de «informes diarios» por «contexto económico» mientras la sección de informes está en preparación.
- Sustitución de «datos oficiales revisados a diario» por «última comprobación de datos oficiales».

## 3. Política y ficha regulatoria

Se incorporan:

- `docs/POLITICA_EDITORIAL_NOTICIAS_MERCADOS_20260902.md`;
- `docs/FICHA_REGULATORIA_SISTEMA_EDITORIAL_ENTREGA_3_20260902.md`;
- `docs/nuvia-news-editorial.test.mjs`.

La clasificación es verde: información económica atribuida y fechada, sin personalización, recomendación, ejecución, derivación ni selección por atractivo inversor.

## 4. Validación ejecutada

### Código fuente

- Paridad funcional: correcta.
- Referencias locales: correctas.
- Consistencia y lenguaje: correctos.
- Definición, navegación, metadatos, contenido externo y privacidad del módulo de empresas: correctos.
- Pruebas del laboratorio de cartera: en verde.
- Prueba editorial específica: en verde.
- Render general: 23 vistas a 1440 px sin fallos.

### Mercados

La página se ha renderizado en:

- 1440 px;
- 1280 px;
- 1180 px;
- 1024 px;
- 900 px;
- 820 px;
- 768 px.

Resultado en todos los anchos:

- contraste AA: 0 fallos;
- tamaños inferiores al mínimo: 0;
- escala tipográfica: 0 desviaciones;
- desbordes: 0;
- colisiones de cabecera: 0;
- controles y ayudas: 0 fallos;
- foco: 0 fallos;
- estados: 0 fallos;
- contenido esperado: presente;
- consola: limpia.

### Compilación

- Módulo local `company-analysis/`: compilado correctamente.
- Puerta regulatoria del módulo de empresas: superada.
- `dist/`: generado correctamente.
- Sitio estático compilado: verificado.
- Prueba editorial sobre `dist/`: superada.

## 5. Decisiones conscientes

- Los indicadores macroeconómicos mantienen sus periodos oficiales originales. La interfaz muestra ahora la fecha de la última comprobación, sin afirmar que se actualizan diariamente.
- La sección «Informes de mercado» continúa identificada como «En preparación» y no se presenta como informe diario.
- Las tres miniaturas pueden compartir la misma imagen propia porque su función es decorativa; la identificación de cada noticia depende de título, categoría, fecha y fuente.
- El responsable editorial continúa pendiente de designación por el titular. Esta decisión organizativa no altera la corrección técnica de la página.

## 6. Exclusión de Firebase

No se ha ejecutado ninguna operación sobre Firebase. No se han modificado Firestore, reglas, Authentication, Cloud Functions, usuarios, Storage, configuración, permisos ni datos.

## 7. Conclusión

La Entrega 3A puede confirmarse y publicarse mediante el flujo oficial de GitHub Pages. El siguiente bloque del plan es la **Entrega 3B: estabilización del producto actual y congelación de una línea base visual y funcional**.

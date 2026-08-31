# Cabecera común y categoría Planificación patrimonial

Fecha: 31 de agosto de 2026. Marco obligatorio leído íntegramente.
Clasificación previa: VERDE. Alcance local, sin publicación.

1. Necesidad: organizar los accesos educativos por áreas, con la misma cabecera
   en Inicio y páginas interiores.
2. Entradas: rutas locales y selección de categoría por el usuario.
3. Transformación: agrupación de enlaces y estado activo de navegación.
4. Resultado: Economía y Finanzas (Mercados y noticias, Cartera); Patrimonio
   (Vivienda y coste de vida, Jubilación, Impuestos, Planificación patrimonial);
   Familia, Salud y Bienestar (Cuerpo, mente y salud); Academia (Academia NUVIA,
   Conocimientos esenciales, Cursos). Lecturas e Inicio se conservan.
5. Instrumentos/emisores: ninguno nuevo; no se cambia la suite de cartera.
6. Personalización: ninguna decisoria; solo página o pestaña activa.
7. Consejo de operación: ninguno.
8. Opiniones de valor/precio: ninguna.
9. Ordenación por atractivo: ninguna; categorías temáticas.
10. Recomendaciones de terceros: ninguna nueva.
11. Diseño: activo indica ubicación, nunca idoneidad ni mérito inversor.
12. Acciones: navegación a recursos existentes; nueva categoría meramente
    descriptiva de planificación patrimonial, sin asesoramiento ni contratación.
13. Remuneración, patrocinio o afiliación: sin cambios.
14. Separación profesional: sin contactos, captación ni marca bancaria.
15. Datos personales: ninguno nuevo; sin persistencia o telemetría.
16. IA: no se incorpora ninguna función de IA.
17. Fuentes: estructura y contenidos locales; sin cifras o normativa nueva.
18. Controles: cabeceras iguales en todas las páginas, enlaces válidos,
    parámetros de Academia y Temas correctos, pruebas de contenido neutro,
    cierre y teclado de desplegables, escritorio/tablet y compilación.

Planificación patrimonial se añade como tema informativo independiente:
balance de activos y deudas, objetivos y horizontes, documentación y continuidad
familiar. No se transforma la guía de jubilación en una prestación distinta ni
se añaden recomendaciones, diagnósticos o resultados personalizados.

Análisis y valoración de empresas conserva su ruta y acceso dentro de Cartera.
Los banners, hero, imágenes, calculadoras, APIs y módulos existentes no cambian.
La reversión se realiza mediante Git. Este ajuste no autoriza publicar.

Ampliación solicitada: cada página interior incorpora «Volver al menú principal»
en su ruta de navegación, con destino index.html. Se conserva la estructura y
el resto de migas; puntos 1, 4 y 12 incluyen ese enlace de retorno, sin nuevos
datos o acciones financieras. Punto 18 comprueba su presencia y destino.

El título exterior del bloque económico de Inicio se denomina «Economía y
Finanzas», como la cabecera. No cambian su contenido, fotografía ni destino.

## Validación local — 31 de agosto de 2026

- Compilación completa y validaciones existentes correctas. La auditoría de
  render genérica se omite por ausencia de Playwright; se ha realizado revisión
  interactiva con el navegador integrado.
- Prueba nueva: 16 cabeceras en origen (incluida la plantilla) y 15 públicas en
  dist, estructura idéntica, enlaces locales válidos y regreso único en todas
  las páginas interiores.
- Navegador: los diez destinos de los desplegables muestran el contenido
  correspondiente, el área activa y el regreso visible. Sin desbordamiento
  horizontal a 1024 px. Revisión visual a 1280 y 1440 px, sin pruebas móviles.
- Verificados regreso desde Mercados y Cartera, pestañas de Academia, cierre
  de desplegables al pulsar fuera, exclusión mutua y Escape con foco restaurado.
- La copia preparada en dist conserva el acceso a empresas dentro de Cartera
  y el título «Economía y Finanzas» en Inicio. Banners e imágenes intactos.
- Revisión de contenido y navegación: VERDE, sin nuevas funciones financieras,
  recomendaciones, recopilación de datos ni derivación comercial.
- Durante la revisión local no se hizo commit, push ni despliegue.

## Autorización de publicación — 31 de agosto de 2026

El usuario solicita «Pubblicalo» tras revisar la versión local. Se autoriza
publicar exclusivamente estos cambios validados de navegación y denominación
en GitHub Pages mediante el flujo oficial de main. Los prototipos de
docs/previews permanecen locales y no forman parte de la publicación.
Se mantiene la clasificación VERDE: no cambian los avisos legales, privacidad,
cookies, consumo, APIs, cálculos, datos ni funcionalidades financieras.
La retirada, si fuera necesaria, se realiza revirtiendo el commit publicado y
dejando que GitHub Actions reconstruya y despliegue dist.

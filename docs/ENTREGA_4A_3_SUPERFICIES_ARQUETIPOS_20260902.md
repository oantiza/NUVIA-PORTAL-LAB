# Entrega 4A · Bloque 3: superficies y arquetipos

Fecha: 2 de septiembre de 2026. Estado: aplicado y validado en local;
sin confirmar ni publicar.

## Decisión y alcance previo

Ordenar los fondos existentes por función, sin cambiar la paleta de marca ni
asignar colores de conveniencia financiera. La cabecera de Cartera adoptará el
mismo fondo institucional de las demás aperturas interiores. Se retira su velo
decorativo propio, sin modificar tamaño, contenido, navegación ni resultados.

Se conservan las excepciones expresas: portada fotográfica, composición de
«Qué es NUVIA», lámina de Lecturas sin degradado y colores de series o categorías.
Firebase, la nueva base de datos, sus archivos y los servicios remotos quedan
fuera del trabajo. No se modifica ni se abre el módulo de empresas.

## Ficha regulatoria previa

1. Necesidad: continuidad visual y lectura clara entre páginas existentes.
2. Datos: estilos y contenido local ya presente; sin nuevas entradas.
3. Transformación: roles de fondo y retirada de una excepción decorativa.
4. Resultado: idéntica información, con fondos compartidos por función.
5. Instrumentos identificables: no se incorporan ni se destacan.
6. Circunstancias personales: no se utilizan.
7. Operaciones: no se sugieren compras, ventas, mantenimiento ni inacción.
8. Valor o precio: no se añade ninguna opinión.
9. Atractivo inversor: no se puntúa, selecciona ni ordena.
10. Recomendaciones de terceros: no se reproducen.
11. Diseño: el cambio es de cabecera y superficies; los colores de cifras,
    gráficos, estados y resultados se conservan sin convertirlos en veredictos.
12. Acciones: no se añaden llamadas, contratación ni contactos.
13. Remuneración o afiliación: sin cambios.
14. Agente vinculado: se mantiene íntegra la separación profesional.
15. Datos personales: no se añaden tratamientos ni almacenamiento.
16. IA: no se introduce ninguna función de IA en el producto.
17. Fuentes, fechas y métodos: se conservan los existentes.
18. Controles: contrato de arquetipos, pruebas de roles y colores, medición del
    fondo calculado, matriz de escritorio/tableta y revisión visual aislada.

Clasificación interna: verde para este cambio de presentación. No acredita
cumplimiento jurídico del producto completo ni funcionamiento del backend.

## Roles de superficie

| Función | Rol | Aplicación |
|---|---|---|
| Lienzo de páginas interiores | `--nv-surface-page` | Nube existente, alrededor del contenido |
| Contenido, tarjetas y campos | `--nv-surface` | Blanco existente |
| Área técnica | `--nv-surface-technical` | Azul grisáceo existente |
| Lectura editorial | `--nv-surface-editorial` | Papel claro existente |
| Énfasis editorial | `--nv-surface-editorial-strong` | Papel cálido existente, no estado financiero |
| Apertura institucional | `--nv-surface-institutional` | Degradado azul compartido |
| Contraste | `--nv-surface-deep` | Azul NUVIA sólido existente |

Los roles no obligan a que todas las páginas tengan el mismo fondo. Describen
para qué sirve cada superficie y evitan añadir un color distinto por página.

## Inventario por arquetipo y excepciones

| Arquetipo | Páginas o vistas | Decisión |
|---|---|---|
| Institucional | `index.html`, `que-es-nuvia.html` | Conservar foto, velos, composición, colores y escala de sus aperturas |
| Portada de espacio | `mercados.html`, `academia.html`, `temas.html` y sus vistas | Base institucional común; acentos identifican áreas, no mérito financiero |
| Herramienta | `cartera.html`, `vivienda.html`, `fiscalidad.html`, `jubilacion.html` | Apertura institucional; controles, resultados y series sin cambios |
| Editorial/formativo | `lecturas.html`, `curso.html` y las cinco guías activas | Papel para lectura; guías y curso mantienen cabecera azul y controles existentes |
| Módulo integrado | Copia local de `company-analysis/`, acceso desde Cartera | Excepción aislada, no revisada ni modificada en este bloque; pendiente del lote 4B |

Casos auxiliares documentados en el contrato: `sistema-visual.html` muestra los
roles comunes; `guia-impuestos.html` es una página de estado en preparación,
no una guía activa. La plantilla interna y los prototipos no cuentan como páginas
canónicas. No se ha creado ninguna portada o funcionalidad futura.

Excepciones que permanecen:

- La foto y los velos de Inicio mantienen la referencia visual aprobada.
- «Qué es NUVIA» conserva su cubierta y secuencia de manifiesto; no es una
  calculadora ni debe adoptar la densidad de una herramienta.
- Lecturas conserva su lámina ilustrada sin degradado: no se le impone el héroe
  azul ni se modifica la imagen. El recorte de portadas de libros sigue en 4B.
- El aro decorativo de Cartera conserva su geometría; ya no necesita un fondo
  propio distinto del institucional.
- Las series analíticas y categorías formativas conservan sus colores y leyendas.
- Los tonos heredados de detalles internos de Academia y otras tarjetas quedan
  para la revisión de componentes 4B, no se consideran normalizados por completo.

## Hallazgo adicional corregido

Hallazgo adicional de la revisión visual: las ocho muestras de paleta de
`sistema-visual.html` tienen etiqueta, pero sus cajas carecen de color asignado
y se ven todas blancas. Se añaden clases explícitas vinculadas a los tokens ya
existentes y pruebas que verifican etiqueta, rol y color calculado. Es una muestra
de diseño, no un indicador financiero; no cambia la clasificación regulatoria.
También se sustituye la regla antigua «Máximo tres superficies» por una
explicación de superficies por función, coherente con el sistema en uso.

## Archivos y controles

- `estilos/nuvia-tokens.css`: roles de lienzo, énfasis editorial y fondo
  institucional, con los colores existentes. El fondo global heredado se conserva.
- `estilos/nuvia-components.css`: apertura institucional y filete decorativo
  consumen los roles comunes.
- `estilos/nuvia-pages.css`: Cartera adopta la apertura institucional sin el velo
  adicional; lienzos y algunas superficies editoriales usan roles equivalentes.
- `estilos/sistema-visual.css` y `sistema-visual.html`: referencia institucional
  común, ocho muestras de color corregidas y explicación de fondos actualizada.
- `scripts/nuvia-visual-contract.mjs`: inventario de las 18 páginas y reglas de
  superficies. Solo se usa en pruebas, no se carga en el producto.
- `docs/nuvia-surfaces.test.mjs`: comprueba cobertura del inventario, colores
  aprobados, roles, excepciones y correspondencia de las muestras con etiquetas.
- `scripts/check-render.mjs`: añade medición del fondo calculado y comprueba
  que Cartera no recupera un velo propio ni Lecturas un degradado.
- `docs/nuvia-lecturas-banner.test.mjs`: comprueba ahora la cadena del rol de
  superficie hasta el blanco original; mantiene las comprobaciones de imágenes,
  tamaño, accesibilidad y ausencia de degradado. No se elimina la protección.
- `package.json`: incorpora la nueva prueba a validación y comprobaciones de
  compilación futura.

Los primeros ensayos detectaron dos dependencias de pruebas sobre nombres
literales: se conservó `--nv-bg` sin cambios y se adaptó la prueba del blanco de
Lecturas para comprobar también su valor final. No se alteraron los colores de
la portada ni se rebajaron umbrales de contraste o escala.

## Validación y cierre

| Comprobación | Resultado |
|---|---|
| Piloto de Cartera, Lecturas y Sistema visual, 1440 y 768 px | 6 combinaciones correctas |
| Validación general inicial, incluidas pruebas locales de analítica y 23 vistas a 1440 px | Correcta, salida 0 |
| 23 vistas a 1280 y 1180 px | 46 correctas |
| 23 vistas a 1024 y 900 px | 46 correctas |
| 23 vistas a 820 y 768 px | 46 correctas |
| Revalidación de Sistema visual tras corregir la paleta | Siete anchos correctos |
| Validación general final tras el último cambio | Correcta, salida 0; 23 vistas a 1440 px |
| Pruebas de roles, inventario y lámina de Lecturas | Correctas |
| Revisión de diferencias de archivos propios | Sin errores de formato |

Se cubren **161 combinaciones únicas de vista y ancho**, con repeticiones para
validar el último cambio en Sistema visual. Cero fallos detectados por la matriz
en contraste evaluado, escala, desbordes, estructura, superficies, cabecera,
controles, ayudas, foco, estados, pestañas y contenido requerido. No hubo errores
nuevos de consola. Los avisos ya conocidos no se ocultan ni se eliminan.

Revisión visual mediante navegador: Cartera a 1440 y 768 px; Lecturas a 768 px;
Sistema visual y sus muestras a 1280 y 768 px. Las pruebas se ejecutaron con
conexiones externas bloqueadas. No acreditan funcionamiento de datos remotos,
cuentas o APIs ni constituyen certificación completa de accesibilidad.

Evidencias locales, ignoradas por Git, en `output/entrega-4a-3/`:
`piloto.log`, `validate.log`, `matrix-wide.log`, `matrix-middle.log`,
`matrix-tablet.log`, `paleta-final.log` y `validate-final.log`.

No se ha generado `dist/`, confirmado cambios ni publicado. El árbol comparte
trabajo en curso sobre la base de datos que no debe mezclarse con la entrega
visual. No se ha modificado ni conectado Firebase, Firestore o la nueva base.

### Siguiente paso

Continuar con 4B: revisión de navegación y componentes, incluyendo las tarjetas
de Lecturas cuyo recorte en tableta permanece pendiente. La normalización de
fondos no cierra por sí sola todas las excepciones de componentes, la densidad
de las herramientas ni la revisión del módulo integrado.

Reproducción de la validación aislada:

```powershell
$env:NUVIA_RENDER_OFFLINE = '1'
npm run validate
npm run auditar:completo
```

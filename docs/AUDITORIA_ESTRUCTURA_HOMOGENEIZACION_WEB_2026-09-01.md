# Auditoría integral de estructura y homogeneización de NUVIA

**Fecha:** 1 de septiembre de 2026  
**Ámbito:** estructura de producto, arquitectura de información, identidad visual, tipografía, composición, navegación, componentes, accesibilidad, adaptación a escritorio y tableta, mantenimiento y coherencia regulatoria.  
**Estado:** diagnóstico y recomendaciones; no implica que los cambios estén aprobados o implantados.

---

## 1. Dictamen ejecutivo

NUVIA ya transmite una identidad propia, reconocible y de calidad. La portada, la paleta, el uso de fotografía, el tono sereno y la combinación de azul, verde, crema y bronce forman un conjunto con personalidad. No estamos ante una web desordenada ni ante un diseño que deba rehacerse desde cero. La base es buena y merece conservarse.

El problema principal es otro: la web ha crecido por capas y la coherencia conceptual avanza más deprisa que la estructura técnica. El resultado es una experiencia visualmente sólida en muchas pantallas, pero todavía irregular al recorrer el conjunto. Conviven:

- una navegación que ya presenta las cinco áreas correctas;
- una página «Qué es NUVIA» y un documento canónico que aún describen la organización anterior;
- páginas institucionales muy cuidadas junto a herramientas más densas y funcionales;
- un sistema visual que declara reglas claras, pero cuya implementación no siempre las cumple;
- una cabecera correcta en escritorio ancho, pero rota en parte del intervalo de tableta;
- contenidos diarios actualizados junto a un informe diario antiguo en la misma página.

Mi valoración global es **7,8 sobre 10**. La identidad visual merece una nota superior; la arquitectura, la accesibilidad de algunos formularios y la homogeneización técnica reducen la valoración. Con una fase de consolidación bien dirigida, NUVIA puede situarse con realismo por encima de 9 sin perder lo que ya funciona.

Las cuatro prioridades son:

1. **Fijar una única arquitectura canónica de cinco espacios** y trasladarla a definición, página «Qué es NUVIA», portada, navegación y pie.
2. **Reparar la cabecera de tableta**, porque hoy el menú invade el logotipo en varios anchos reales.
3. **Convertir el sistema visual en una norma efectiva**, especialmente para tipografía, héroes, fondos, contenedores y componentes.
4. **Completar los vacíos de experiencia y confianza**, en especial Familia, Salud y Bienestar, planificación patrimonial, accesibilidad de Vivienda, páginas legales y política de actualización de contenidos.

---

## 2. Alcance y método de la auditoría

La revisión se ha realizado exclusivamente sobre el repositorio oficial NUVIA Portal Lab y sobre su compilación local. Se han inspeccionado las páginas públicas principales, las guías, las herramientas, la página «Qué es NUVIA», el sistema visual y la integración local de «Análisis y valoración de empresas».

Se han combinado cuatro capas de comprobación:

- lectura de la definición canónica de NUVIA y del marco regulatorio obligatorio;
- revisión del HTML, las hojas de estilo, las rutas, la jerarquía de contenidos y las dependencias comunes;
- inspección visual real en navegador;
- mediciones en 1440, 1280, 1180, 1120, 1024, 900, 820 y 768 píxeles de ancho.

La validación automática del proyecto pasa correctamente en navegación, referencias locales, consistencia, lenguaje regulatorio y cálculos. Presenta cuatro avisos no bloqueantes: el documento de redirección `guia-impuestos.html` no usa cabecera ni pie común, mantiene `noindex`, y la portada conserva dos imágenes sin carga diferida, una de ellas correctamente por ser el héroe. La comprobación automatizada de render se omite porque Playwright no está instalado; esta auditoría ha suplido esa carencia con navegación e inspección visual directa.

La revisión se ha limitado a escritorio y tableta, conforme a las reglas del proyecto. No se ha diseñado ni evaluado una versión móvil.

---

## 3. Lo que ya funciona y debe preservarse

### 3.1. Identidad reconocible

NUVIA no parece una plantilla financiera genérica. La combinación de azul marino, verde sobrio, bronce y superficies claras crea una imagen de criterio, patrimonio y largo plazo. La fotografía familiar evita que el proyecto se perciba como una mera terminal de mercados.

### 3.2. Portada con una promesa clara

«Información clara, decisiones con propósito» funciona bien. Es breve, memorable y encaja con el principio regulatorio de informar y explicar sin decidir por el usuario. El bloque «Detrás de cada decisión patrimonial hay una forma de vivir» es uno de los mejores elementos de la web porque une economía y vida familiar sin sentimentalismo excesivo.

### 3.3. Cabecera conceptual correcta en escritorio ancho

La navegación principal ya refleja la estructura que se ha definido en la conversación:

- Economía y Finanzas;
- Patrimonio;
- Familia, Salud y Bienestar;
- Academia;
- Lecturas con Criterio.

«Qué es NUVIA» aparece como acceso institucional separado. Esta decisión es correcta.

### 3.4. Buen armazón común

Las páginas públicas comparten logotipo, cabecera, pie, contenedor, saltos al contenido y una jerarquía básica estable. La mayoría cuenta con un único `h1`, imágenes con texto alternativo, migas de pan y foco visible común. No se detectó desplazamiento horizontal general en 1440 ni en 900 píxeles.

### 3.5. Herramientas visualmente integradas

Vivienda, Jubilación y Cartera han dejado de parecer aplicaciones ajenas. Mantienen el fondo, las tarjetas, la paleta y el lenguaje NUVIA. La copia local de análisis de empresas conserva una personalidad propia, pero está correctamente contenida dentro de Cartera y no sustituye la navegación principal.

### 3.6. «Qué es NUVIA» tiene fuerza

La página final es visualmente atractiva y llama la atención. Tiene una apertura potente, una narrativa de manifiesto, buen ritmo fotográfico y una frase de cierre acertada: «NUVIA informa, explica y calcula. Tú comprendes y decides». Es una base válida y no recomiendo sustituirla por una página convencional de texto.

---

## 4. Arquitectura de información: el principal vacío estratégico

### 4.1. Hay que fijar formalmente los cinco espacios

La estructura que debe considerarse definitiva es:

1. **Economía y Finanzas:** mercados y noticias; cartera; análisis y valoración de empresas como función integrada en Cartera.
2. **Patrimonio:** vivienda y coste de la vida; impuestos; jubilación; planificación patrimonial.
3. **Familia, Salud y Bienestar:** familia; cuerpo; mente; salud; hábitos y equilibrio cotidiano.
4. **Academia:** conocimientos esenciales; guías; vídeos; cursos; itinerarios de aprendizaje.
5. **Lecturas con Criterio:** libros, informes y otras lecturas alineadas con el espíritu de NUVIA, con participación de la comunidad cuando exista una solución moderada y jurídicamente revisada.

La navegación ya se acerca a esta organización, pero la definición canónica y «Qué es NUVIA» todavía enumeran Economía y mercados, Patrimonio, Academia, Analítica de cartera y Lecturas. Familia, Salud y Bienestar no aparece como una de las cinco puertas y Cartera se presenta como puerta independiente. Es la incoherencia conceptual más importante.

La corrección debe empezar por `docs/DEFINICION_NUVIA.md`, porque es la fuente canónica. Después deben sincronizarse la página «Qué es NUVIA», la portada, los textos de navegación, las pruebas de definición y los documentos estratégicos.

### 4.2. Las cinco áreas no tienen hoy la misma entidad navegable

Academia y Lecturas tienen página propia. Economía y Finanzas y Patrimonio son desplegables sin portada de área. Familia, Salud y Bienestar conduce a una variante de una página genérica. Esto produce una arquitectura asimétrica: el usuario puede «entrar» en unas áreas, pero solo elegir una herramienta en otras.

Recomendación:

- crear una portada breve para cada uno de los cinco espacios;
- hacer que cada desplegable incluya primero «Vista general»;
- mantener debajo las funciones concretas;
- no duplicar Cartera como sexto espacio;
- reservar `temas.html` como motor temporal, no como destino final de varias áreas con identidad propia.

### 4.3. `temas.html` es demasiado genérica para funciones estratégicas

La misma ruta cambia según parámetros para mostrar Jubilación, Bienestar o Planificación patrimonial. Esta solución sirve durante el desarrollo, pero crea problemas de orientación, títulos, enlaces compartidos, analítica y posicionamiento. Además, el acceso directo sin parámetro presenta Jubilación, aunque la página se llame genéricamente «Temas».

Recomendación:

- crear `planificacion-patrimonial.html` cuando el test esté definido y validado;
- crear `familia-salud-bienestar.html` como portada de área;
- decidir si Cuerpo, Mente y Salud requiere una página propia;
- mantener redirecciones estables desde las rutas antiguas.

### 4.4. El pie no refleja el modelo de cinco espacios

El pie actual se organiza como «Navegación», «Recursos» e «Información», pero mezcla páginas de primer y segundo nivel. Incluye Mercados, Analítica de cartera y Análisis de empresas, mientras Patrimonio, Familia y «Qué es NUVIA» no reciben el mismo tratamiento.

Recomendación:

- una primera columna institucional: Qué es NUVIA, metodología y contacto general no comercial;
- una segunda columna con los cinco espacios;
- una tercera con herramientas y formación;
- una cuarta con privacidad, cookies, condiciones, accesibilidad y avisos;
- retirar «Sistema visual» del pie público: es documentación interna, está marcada `noindex` y no aporta valor al visitante final.

---

## 5. Cabecera y navegación

### 5.1. Fallo prioritario en tableta

La cabecera se rompe visualmente en varios anchos. A 768 píxeles, los dos primeros grupos del menú invaden el logotipo; a 820 siguen solapándose dos grupos; a 900 todavía hay una colisión. El problema desaparece cerca de 1024, pero reaparece alrededor de 1180 cuando el logotipo aumenta de anchura antes de que exista espacio suficiente. No hay desplazamiento horizontal, por lo que una prueba que solo mida el ancho del documento no lo detecta.

Es un fallo de prioridad alta porque tableta forma parte del producto oficial.

Recomendación:

- definir un modo de navegación de tableta entre 768 y aproximadamente 1199 píxeles;
- conservar el logotipo legible y sin compresión;
- sustituir los seis accesos horizontales por un botón «Secciones» o por una barra de dos niveles expresamente diseñada para tableta;
- mantener «Qué es NUVIA» visible si el espacio lo permite;
- probar no solo 768, 900 y 1024, sino también los anchos intermedios donde cambian las reglas del logotipo;
- añadir una prueba de colisión basada en rectángulos de los hijos del menú, no solo en `scrollWidth`.

### 5.2. Demasiados puntos de ruptura

Las hojas de estilo contienen umbrales en 820, 850, 900, 1024, 1050, 1080, 1100, 1120, 1180 y 1340 píxeles. Esta proliferación explica algunos comportamientos discontinuos.

Recomendación: reducirlos a un pequeño sistema documentado, por ejemplo:

- escritorio amplio;
- escritorio compacto;
- tableta horizontal;
- tableta vertical.

No se trata de imponer cuatro números exactos, sino de evitar que cada página introduzca su propio punto de ruptura.

### 5.3. Desplegables accesibles, pero con margen de mejora

El uso de `details` y `summary` aporta funcionamiento sin depender por completo de JavaScript. Debe conservarse. Conviene, no obstante, garantizar:

- cierre al pulsar fuera;
- navegación completa por teclado;
- estado visual claro de la sección activa;
- que ningún submenú quede fuera de la pantalla en los extremos;
- que los textos del desplegable no alteren la anchura del menú cerrado.

---

## 6. Tipografía

### 6.1. El sistema declarado es bueno

La norma escrita es clara:

- Inter para navegación, datos, herramientas y títulos institucionales;
- Fraunces para Lecturas, informes, citas y contenidos editoriales.

Es una distinción adecuada. Inter aporta precisión; Fraunces añade patrimonio y pausa. No recomiendo introducir una tercera familia tipográfica.

### 6.2. La implementación contradice la norma

Fraunces aparece en numerosos títulos de calculadoras, paneles y secciones funcionales de Mercados, Vivienda, Cartera, Jubilación y guías. La hoja de páginas contiene muchas asignaciones directas a la familia editorial. A la vez, la propia página del sistema visual afirma que «Inter es la norma».

Hay dos caminos posibles; recomiendo el primero:

1. **Conservar la norma estricta:** Inter en interfaz y herramientas; Fraunces en Lecturas, informes, citas, manifiesto y páginas editoriales.
2. Ampliar oficialmente la norma para permitir Fraunces en encabezados de contenido, pero nunca en formularios, datos ni navegación.

La primera opción produce mayor claridad funcional y refuerza el carácter especial de Lecturas y «Qué es NUVIA».

### 6.3. Escalas de títulos

En escritorio conviven tres escalas principales:

- aproximadamente 58 píxeles en portadas institucionales;
- aproximadamente 43 píxeles en herramientas y guías;
- aproximadamente 132 píxeles en el manifiesto «Qué es NUVIA».

En tableta estas escalas se reducen a 44, 36 y 90/77 píxeles. La diferencia puede ser correcta si responde a tipos de página. Hoy no está suficientemente explicitada.

Recomendación:

- `display`: solo portada y aperturas de marca;
- `hero`: portadas de área;
- `tool`: calculadoras y laboratorios;
- `editorial`: Lecturas, guías e informes;
- documentar tamaño, ancho máximo, interlineado y comportamiento de tableta de cada nivel.

### 6.4. Densidad de texto

Las herramientas muestran tipografía pequeña cuando se ven a página completa. Los textos son legibles en uso normal, pero algunos paneles combinan etiqueta de 12 px, cuerpo de 14 px y cifras en espacios muy densos. Debe revisarse especialmente Mercados, Cartera y tablas de Vivienda.

Recomendación: no reducir el cuerpo funcional por debajo de 14 px y reservar 12 px para etiquetas breves, fechas y metadatos, con contraste alto.

---

## 7. Héroes y aperturas de página

El sistema define tres héroes: fotográfico, institucional y editorial. En la práctica:

- el fotográfico se usa correctamente en la portada;
- el institucional se usa en casi todas las herramientas y también en las guías;
- el editorial común apenas se utiliza;
- Lecturas y «Qué es NUVIA» tienen héroes propios.

Esto no es necesariamente un problema visual, pero sí una contradicción del sistema. Las guías se comportan como páginas institucionales aunque la documentación diga que deberían ser editoriales.

Recomendación:

- conservar el héroe fotográfico exclusivamente en Inicio;
- usar el institucional en las cinco portadas de área y en herramientas;
- usar una variante editorial crema, con Fraunces, en guías, informes y Lecturas;
- mantener «Qué es NUVIA» como excepción de marca documentada;
- evitar que cada nueva página cree un cuarto o quinto héroe sin necesidad.

La altura también debe responder al tipo de página: las herramientas no necesitan 460 píxeles si el usuario viene a calcular; las portadas sí pueden permitirse una entrada más generosa.

---

## 8. Fondos, contenedores, espaciado y ritmo

### 8.1. Dos fondos generales sin una regla visible

Inicio, Cartera y «Qué es NUVIA» utilizan el fondo azul grisáceo `mist`; la mayoría de las demás páginas utiliza `cloud`, más claro. Ambos pertenecen a la paleta, pero el criterio de uso no está explicado.

Recomendación:

- `mist` para páginas de marca y laboratorios técnicos;
- `cloud` para portadas y herramientas de contenido;
- `paper` para editorial y lectura;
- blanco para tarjetas y zonas de trabajo.

La regla debe escribirse en el sistema visual y aplicarse por arquetipo.

### 8.2. Contenedores demasiado variados

Existe un contenedor canónico de 1240 px, pero las hojas reúnen numerosos máximos: 1340, 1240, 1180, 1120, 1100, 1080, 1050, 1024, 980, 900, 880, 860, 850, 820, 760, 720 y otros. Algunos son necesarios por legibilidad, pero demasiados son decisiones locales acumuladas.

Recomendación: reducirlos a roles:

- ancho de sitio;
- ancho de herramienta;
- ancho de lectura;
- ancho estrecho de formulario;
- ancho de contenido inmersivo.

### 8.3. Escala de espaciado declarada, pero no respetada

El sistema afirma que la separación sigue una escala de 8 px y que no deben usarse rellenos fuera de los tokens. Sin embargo, las hojas contienen muchos valores literales de 7, 9, 11, 13, 17, 26, 28, 30, 34, 36, 38, 42, 52, 54, 72 y 76 px.

No recomiendo una sustitución mecánica. Debe hacerse por componentes, verificando el resultado visual. El objetivo es reducir excepciones, no convertir cada cifra en una variable sin criterio.

### 8.4. Ritmo entre páginas

Las portadas de Academia y Lecturas son muy breves; «Qué es NUVIA» es muy extensa; algunas guías superan ampliamente la longitud de las herramientas. La longitud no debe igualarse artificialmente. Sí debe igualarse el ritmo:

- apertura;
- contexto;
- contenido principal;
- siguiente paso;
- cierre y pie.

Academia necesita una vista más clara del recorrido formativo; Lecturas necesita explicar selección y participación; «Qué es NUVIA» puede mantener su narrativa larga si añade navegación interna o un resumen inicial.

---

## 9. Componentes: tarjetas, botones, formularios y tablas

### 9.1. Tarjetas

Las tarjetas comparten bordes suaves, fondos blancos y radios coherentes, pero hay muchas variantes locales. Conviene consolidar cinco familias:

- institucional;
- herramienta;
- dato o indicador;
- editorial;
- estado o aviso.

Cada familia debe tener reglas de borde, sombra, radio, título, texto, acción y comportamiento en tableta.

### 9.2. Botones y enlaces de acción

Los botones primarios azul marino y los enlaces verdes funcionan. Las páginas mezclan, sin embargo, botones rellenos, pastillas, pestañas y enlaces con flecha para acciones de peso parecido.

Recomendación:

- botón primario: iniciar, calcular, guardar o continuar;
- botón secundario: recuperar, comparar o volver;
- enlace con flecha: navegar a otro contenido;
- pestaña: cambiar vista sin abandonar la función;
- nunca utilizar el color como única diferencia entre estados.

### 9.3. Vivienda: fallo de accesibilidad

Los doce campos principales de la calculadora de vivienda muestran etiquetas visuales, pero esas etiquetas no están asociadas semánticamente a los controles. Los campos no tienen `id` enlazado mediante `label for`, ni nombre accesible alternativo.

Esto afecta a lectores de pantalla, dictado por voz y selección de etiqueta. Debe corregirse antes de considerar la calculadora terminada.

Criterio de aceptación:

- cada campo tiene un nombre accesible único;
- la etiqueta visible activa el campo al pulsarla;
- la unidad no sustituye la etiqueta;
- el mensaje de ayuda y el error se relacionan con `aria-describedby` cuando corresponda.

### 9.4. Tablas

Las tablas de amortización y las comparativas fiscales son útiles, pero en tableta deben verificarse con datos largos, no solo con cifras de ejemplo. Recomendación:

- cabecera fija solo si no tapa contenido;
- alineación numérica consistente;
- unidades en cabecera;
- explicación previa de qué representa la tabla;
- desplazamiento horizontal interno, nunca de toda la página, si no cabe;
- alternativa resumida para usuarios que no necesiten el detalle completo.

---

## 10. Accesibilidad y legibilidad

La base accesible es mejor de lo habitual: existe enlace «Ir al contenido» en las páginas públicas, un solo título principal, nombres en botones y enlaces, foco visible común y ausencia general de identificadores duplicados.

Las mejoras prioritarias son:

- corregir las doce etiquetas de Vivienda;
- probar la cabecera completa solo con teclado;
- verificar que las animaciones de entrada de «Qué es NUVIA» no oculten contenido si falla JavaScript;
- conservar la versión para movimiento reducido, ya contemplada en los estilos;
- revisar contrastes reales sobre fotografías, no solo colores aislados;
- asegurar que las tarjetas completamente pulsables mantengan un nombre claro;
- mantener `alt=""` solo en imágenes realmente decorativas;
- añadir declaración pública de accesibilidad y un canal para comunicar incidencias.

La gran apertura de «Qué es NUVIA» permanece prácticamente invisible durante el primer instante de la animación y se revela después. Visualmente funciona, pero el contenido esencial debería estar visible por defecto y animarse desde un estado legible mediante mejora progresiva.

---

## 11. Coherencia editorial y actualización de contenidos

### 11.1. Mercados ha mejorado, pero aún mezcla fechas

La noticia económica principal y las tres noticias breves ya están actualizadas al 1 de septiembre de 2026 y el nuevo diseño evita el corte del titular. Este problema concreto queda resuelto visualmente.

Sin embargo, el bloque «Informe diario» sigue fechado el 5 de agosto de 2026. En la misma página conviven actualidad del 1 de septiembre, indicadores revisados el 14 de agosto y un informe diario de casi un mes antes. Los indicadores pueden ser legítimamente anteriores porque dependen de calendarios oficiales; un «informe diario» no.

Recomendación:

- una sola marca de «Última actualización» para la sección de noticias;
- fecha de referencia específica en cada indicador;
- ocultar o renombrar «Informe diario» cuando no haya informe del día;
- automatizar también ese bloque o sustituirlo por «Último informe disponible»;
- bloquear la publicación si la noticia destacada o el informe superan el umbral de antigüedad definido;
- registrar fuente, fecha de publicación y fecha de comprobación.

### 11.2. Tono y nomenclatura

Conviven «Economía y Finanzas», «Economía y mercados», «Mercados NUVIA», «Analítica de cartera», «Mi cartera», «Mis impuestos» y «Patrimonio». Todos pueden funcionar, pero necesitan una relación jerárquica explícita.

Recomendación: cada página debe mostrar, en ese orden:

- espacio;
- subsección;
- función o título editorial.

Ejemplo: Patrimonio → Impuestos → Mis impuestos.

---

## 12. Revisión específica de la página «Qué es NUVIA»

### 12.1. Valoración

La página está bien planteada, es distinta y sí llama la atención. La combinación de imagen, manifiesto, propósito, horizonte familiar, áreas, valores y cierre crea una narración más memorable que una página corporativa convencional. Mi valoración visual es **8,5 sobre 10**.

No recomiendo hacerla más larga ni añadir más teoría general. La prioridad es corregir y concentrar.

### 12.2. Cambios necesarios

- sustituir las cinco puertas antiguas por los cinco espacios definitivos;
- integrar Cartera dentro de Economía y Finanzas;
- incorporar Familia, Salud y Bienestar;
- describir Planificación patrimonial como parte de Patrimonio, sin presentar todavía el test como asesoramiento o plan personalizado aprobado;
- mantener Academia como corazón formativo, sin convertirla en una promesa de superioridad frente al ciudadano medio;
- ampliar Lecturas con Criterio para explicar selección, opinión y comunidad, dejando la funcionalidad de foro para una fase con moderación y protección de datos;
- añadir un pequeño índice de salto si se mantiene la longitud actual;
- mantener el principio final «NUVIA informa, explica y calcula. Tú comprendes y decides».

### 12.3. ¿Conviene un vídeo?

Sí. Un vídeo breve puede ser muy eficaz, pero debe duplicar la comprensión, no duplicar la longitud de la página.

Recomendación:

- duración objetivo de 90 a 150 segundos;
- ubicación después de la apertura y antes del manifiesto largo, o como acción secundaria visible en el héroe;
- título «NUVIA en dos minutos»;
- cartel estático coherente con la página;
- reproducción voluntaria, sin sonido automático;
- subtítulos incrustados y transcripción accesible;
- cinco capítulos visuales, uno por espacio;
- misma promesa y mismos límites que el texto;
- cierre con una invitación a explorar, no a contratar ni a recibir una recomendación.

El vídeo debe ser una versión condensada de la página. No debe introducir servicios, capacidades o promesas que la web aún no ofrece.

---

## 13. Coherencia regulatoria y de confianza

La web incluye avisos correctos en el pie y muchas herramientas declaran supuestos y límites. La frase «NUVIA informa, explica y calcula» es especialmente adecuada.

Hay, no obstante, expresiones que conviene revisar:

- «Planificación patrimonial y financiera para familias» puede sonar a prestación profesional;
- «Acompañamos a familias a preservar, hacer crecer y transferir su patrimonio» aparece en el pie de todas las páginas y sugiere un servicio continuado;
- «Family Wealth», por sí solo, puede reforzar esa lectura si la explicación educativa no está cerca.

No afirmo que esas frases sean ilícitas de forma aislada. El riesgo está en el efecto conjunto que exige valorar el marco regulatorio. Recomiendo sustituir el texto del pie por una formulación inequívocamente educativa, por ejemplo: «Información, formación y herramientas para comprender la economía familiar y el patrimonio con perspectiva de largo plazo».

También faltan destinos públicos de confianza que deberían existir antes del lanzamiento con cuentas y tratamiento de datos:

- privacidad;
- cookies y tecnologías utilizadas;
- condiciones de uso;
- accesibilidad;
- metodología y fuentes;
- identidad y separación expresa respecto de cualquier entidad financiera o actividad profesional externa.

El enlace al sistema visual no cubre ninguna de estas necesidades.

La futura planificación patrimonial, el foro de Lecturas y cualquier personalización deben superar sus fichas regulatorias antes de desarrollarse. Un descargo no corrige una función que, por su funcionamiento real, resulte incompatible.

---

## 14. Homogeneización técnica y mantenibilidad

### 14.1. Fortalezas

El proyecto ya dispone de tokens, componentes y estilos de página separados. Las fuentes están autoalojadas. Los colores principales tienen roles semánticos y existen reglas de foco y movimiento reducido.

### 14.2. La hoja de páginas es demasiado grande

`nuvia-pages.css` supera las nueve mil líneas físicas y concentra muchas etapas de migración, páginas y excepciones. El tamaño no es un problema por sí mismo, pero dificulta conocer qué regla pertenece a qué arquetipo y aumenta el riesgo de colisiones.

Recomendación de división progresiva:

- `pages/home.css`;
- `pages/about.css`;
- `pages/markets.css`;
- `pages/academy.css`;
- `pages/portfolio.css`;
- `pages/tools.css`;
- `pages/guides.css`;
- `pages/readings.css`.

No debe hacerse antes de consolidar componentes, porque dividir deuda no la elimina.

### 14.3. Excepciones que contradicen las reglas

La hoja declara «sin hexadecimales» y «sin `!important`», pero aún contiene colores directos en una portada del laboratorio y varios `!important` en secciones migradas. También hay numerosos rellenos literales fuera de la escala.

Recomendación:

- registrar cada excepción real;
- reemplazar colores directos por roles;
- eliminar `!important` al corregir el orden o la especificidad;
- añadir una comprobación que falle ante nuevos hexadecimales fuera de tokens;
- añadir una comprobación que falle ante nuevos `!important`, salvo la excepción de movimiento reducido.

### 14.4. Cabecera y pie duplicados en HTML

La cabecera y el pie se repiten en muchas páginas. Las pruebas actuales detectan inconsistencias, lo que reduce el riesgo, pero cualquier modificación exige editar numerosos archivos.

Recomendación: generar ambos fragmentos durante la compilación a partir de una única plantilla. El HTML final puede seguir siendo estático; no hace falta introducir un framework en el navegador.

### 14.5. Redirección antigua

`guia-impuestos.html` es una redirección controlada hacia Fiscalidad, con `noindex`. Es correcto que no tenga cabecera ni pie, pero el validador debería reconocerla como redirección deliberada para no producir avisos repetitivos que oculten problemas nuevos.

---

## 15. Revisión por página y área

### Inicio

**Estado:** fuerte.  
**Mantener:** héroe, promesa, bloque del proyecto, fotografía y tono.  
**Corregir:** texto de servicio potencial, orden del sumario, simetría de las cinco áreas y acceso claro a sus portadas.

### Mercados

**Estado:** visualmente integrado y ya sin el corte principal.  
**Mantener:** indicadores, columna de cotizaciones y jerarquía de noticia principal más tres breves.  
**Corregir:** informe diario obsoleto, política de frescura, densidad de metadatos y coherencia tipográfica.

### Cartera

**Estado:** sólido como laboratorio.  
**Mantener:** integración local del análisis de empresas y límites descriptivos.  
**Corregir:** presentar Cartera siempre dentro de Economía y Finanzas, reducir el cambio visual al entrar en el módulo incrustado y revisar la altura fija del marco en tableta.

### Vivienda

**Estado:** herramienta útil y visualmente clara.  
**Mantener:** resumen de escenario, separación entre entrada y resultado, tabla de amortización.  
**Corregir:** etiquetas accesibles, densidad en tableta, validación de errores y consistencia de unidades.

### Fiscalidad y guías fiscales

**Estado:** buen enfoque territorial y prudente.  
**Mantener:** selección previa de territorio, fuentes y avisos.  
**Corregir:** decidir un patrón editorial único para las guías, separar contenido estable de calendario anual y sustituir la antigua redirección cuando deje de aportar valor.

### Jubilación

**Estado:** completa y bien encuadrada como simulación.  
**Mantener:** supuestos visibles y separación por bloques.  
**Corregir:** reducir carga inicial, reforzar el resumen previo y comprobar tablas y gráficos con 768 px.

### Academia

**Estado:** conceptualmente central, pero su portada resulta demasiado breve para el papel que se le atribuye.  
**Mantener:** «Saber es patrimonio» y la división Conocimientos/Cursos.  
**Corregir:** mostrar itinerario, nivel de avance, formatos disponibles y siguiente paso, sin prometer un resultado académico o financiero no acreditado.

### Curso

**Estado:** rico y visualmente trabajado.  
**Mantener:** estructura por capítulos y materiales.  
**Corregir:** reducir la complejidad de estilos heredados, revisar textos invisibles usados por componentes de interpolación y asegurar que todo el recorrido mantiene una sola jerarquía.

### Lecturas con Criterio

**Estado:** identidad editorial clara, pero todavía catálogo mínimo.  
**Mantener:** banner, Fraunces, crema y fichas.  
**Corregir:** explicar criterio de selección, clasificar por los cinco espacios, añadir búsqueda o filtros cuando crezca y diseñar la futura participación con identidad, moderación, privacidad y reglas de publicación.

### Qué es NUVIA

**Estado:** muy buena base de marca.  
**Mantener:** concepto, imágenes, manifiesto, valores y cierre.  
**Corregir:** cinco espacios, índice interno, precisión regulatoria y vídeo breve accesible.

### Familia, Salud y Bienestar

**Estado:** principal vacío de producto.  
**Mantener:** su presencia visible como área «en preparación».  
**Corregir:** definir propósito, límites, fuentes, categorías y portada. No debe convertirse en consejo médico, psicológico o familiar personalizado sin el marco y la supervisión correspondientes.

### Planificación patrimonial

**Estado:** idea estratégica relevante, aún no producto maduro.  
**Mantener:** visión integral de edad, familia, objetivos, seguros, testamento y futuro.  
**Corregir:** evitar que el test emita un «plan personal» o recomendación de productos. Debe organizar información, detectar asuntos pendientes y ofrecer escenarios o preguntas para preparar una conversación con profesionales habilitados.

---

## 16. Plan priorizado de corrección

### Prioridad 0: antes de añadir nuevas funciones

- actualizar la definición canónica con los cinco espacios;
- corregir las cinco puertas de «Qué es NUVIA»;
- arreglar la cabecera entre 768 y 1199 px;
- asociar las etiquetas de los doce campos de Vivienda;
- actualizar u ocultar el informe diario antiguo;
- sustituir el enlace público «Sistema visual» por páginas de confianza;
- revisar la frase del pie que puede sugerir asesoramiento o gestión patrimonial.

### Prioridad 1: consolidación del sistema

- definir los arquetipos de página y sus héroes;
- normalizar el uso de Inter y Fraunces;
- reducir fondos y contenedores a roles documentados;
- consolidar tarjetas, botones, pestañas, formularios y tablas;
- crear portadas de Economía y Finanzas, Patrimonio y Familia, Salud y Bienestar;
- reorganizar el pie alrededor de los cinco espacios;
- añadir páginas de privacidad, cookies, condiciones, accesibilidad, metodología e independencia.

### Prioridad 2: crecimiento de contenido

- ampliar Academia con itinerarios y progreso;
- convertir Planificación patrimonial en un orientador educativo validado;
- ampliar Lecturas por áreas y diseñar participación moderada;
- producir el vídeo «NUVIA en dos minutos»;
- separar las páginas definitivas que hoy dependen de `temas.html`.

### Prioridad 3: mantenimiento y control de calidad

- generar cabecera y pie desde una fuente única;
- dividir progresivamente la hoja de páginas;
- bloquear nuevos colores directos y nuevos `!important`;
- instalar una auditoría de render en integración continua;
- añadir capturas de referencia en escritorio y tableta;
- comprobar colisiones, etiquetas, foco, contraste y frescura de contenido en cada publicación.

---

## 17. Criterios de aceptación de la homogeneización

La fase debe considerarse terminada cuando:

- las cinco áreas aparecen con el mismo nombre y orden en definición, portada, «Qué es NUVIA», cabecera y pie;
- Cartera no se presenta como sexto espacio;
- cada área tiene una portada o destino principal inequívoco;
- no existe colisión entre marca y navegación de 768 a 1440 px;
- todos los formularios tienen etiquetas accesibles y mensajes asociados;
- cada página pertenece a un arquetipo visual documentado;
- Inter y Fraunces se usan conforme a una regla única;
- héroes, fondos, contenedores, tarjetas y botones proceden del sistema común;
- no se añaden colores hexadecimales fuera de tokens ni excepciones de especificidad sin justificar;
- las noticias, indicadores e informes muestran fechas coherentes con su naturaleza;
- el pie ofrece información legal y de confianza, no documentación interna;
- el texto institucional no induce a confundir NUVIA con asesoramiento, gestión o captación;
- las pruebas automáticas incluyen render real de escritorio y tableta.

---

## 18. Conclusión

La web está más cerca de necesitar una **consolidación** que un rediseño. La portada funciona, la identidad funciona y «Qué es NUVIA» funciona como pieza de marca. No conviene deshacerlas. Conviene conseguir que el resto del portal esté a su altura y que todas las decisiones respondan a una misma arquitectura.

El orden correcto es: definición, navegación, cabecera de tableta, accesibilidad, sistema visual, portadas de área y crecimiento de contenidos. Si se intenta ampliar Academia, Familia, Planificación patrimonial o Lecturas antes de cerrar esa base, la deuda de coherencia crecerá.

Mi recomendación final es conservar el lenguaje visual actual, corregir sus contradicciones y hacer visible una idea sencilla en todas partes: NUVIA es un espacio educativo e independiente que ayuda a comprender la economía familiar, el patrimonio y las decisiones de largo plazo; no decide por el usuario ni mezcla esa función con una actividad profesional externa.

# NUVIA · Verificación independiente de la Entrega 1

**Revisor:** Claude Fable 5.1  
**Fecha:** 1 de septiembre de 2026 (noche)  
**Objeto:** acta corregida, registro de ideas futuras corregido y Entrega 1 (definición y arquitectura canónica) en el árbol de trabajo local `C:\Users\oanti\Documents\NUVIA-PORTAL-LAB` (HEAD `58f599a` + 33 archivos modificados y 15 nuevos sin confirmar)  
**Método:** lectura directa del árbol local; validación estática ejecutada en el propio PC; árbol replicado en la nube (parche + activos nuevos) y auditoría de render reejecutada con un Chromium independiente.  
**Estado:** verificación; no autoriza publicación.

---

## 1. Veredicto

**Entrega 1: APROBADA para confirmar y publicar.** Las ocho correcciones del contraste están incorporadas en el acta y en el registro de ideas; la definición, la página institucional, la portada, las 17 cabeceras y los 17 pies cuentan la misma historia con los cinco nombres oficiales; toda la batería está en verde con mi propia ejecución. Quedan cuatro notas menores, ninguna bloqueante, y dos de ellas pertenecen ya a la Entrega 2.

---

## 2. Acta y registro de ideas: las ocho correcciones

| Corrección | Dónde está | Estado |
|---|---|---|
| Cuenta básica existente deja de ser idea futura | ACTA D6 (párrafo «La cuenta opcional con datos mínimos…»); IDEAS §1 y §4 «Cuenta básica existente y suscripción futura» con tareas pendientes de privacidad | ✓ |
| Suscripción y funciones adicionales separadas | ACTA D6.3; IDEAS §4, regla «Pagar o registrarse no podrá desbloquear…» | ✓ |
| D3 y D4 ratificadas | ACTA §2 «Ratificaciones del fundador» | ✓ (ver nota N1) |
| «Proteger · Crecer · Legado» → «Comprender · Cuidar · Transmitir» | ACTA D4 último bloque; `index.html` barra de pilares | ✓ |
| Numeración por entregas | ACTA: «Entrega 1», «Entrega 4», §3 | ✓ salvo un resto (N1) |
| Entradas existentes «En preparación» | ACTA D1 (párrafo tras las reglas); IDEAS §2 y §5; `temas.html` etiqueta de tarjetas; `index.html` insignia de la lámina Familia, Salud y Bienestar | ✓ |
| Precisiones tipográficas, propiedad de contenidos, marca | ACTA D5 (regla del número, títulos de herramientas, Inter vía `--nv-font-sans`, 4,5:1); D1 «Regla de propiedad de los contenidos»; D4 excepción «NUVIA Family Wealth» | ✓ |
| Límites sanitarios adicionales | IDEAS §5 «no enlazar, recomendar ni promocionar productos, suplementos, servicios o profesionales sanitarios concretos» | ✓ |

**N1 (menor, texto).** En ACTA D4 queda un resto de la numeración antigua: «Esta frase sustituirá, en la Fase 2, a:». Debe decir «en la Entrega 1». Y la ratificación de D3 y D4 se apoya en la instrucción «contrasta y seguimos»; es válida porque el fundador la ha confirmado por escrito en esta misma conversación, pero el acta gana si lo dice de forma directa: «ratificadas por el fundador el 1 de septiembre de 2026».

---

## 3. Entrega 1 en el código

### 3.1. Definición canónica (`docs/DEFINICION_NUVIA.md`)

«Qué vas a encontrar» pasa de cinco entradas antiguas (Economía y mercados / Patrimonio / Academia NUVIA / Analítica de cartera / Lecturas con criterio) a los cinco espacios con su grafía oficial. Cartera y analítica quedan dentro de Economía y Finanzas «sin convertir el resultado en una recomendación»; planificación patrimonial educativa dentro de Patrimonio; Familia, Salud y Bienestar «sin diagnóstico ni consejo sanitario individual». Texto compatible con el marco §1, §3 y §5. Se conservan intactos «Para qué existe», «Nuestro espíritu» y el principio «NUVIA informa, explica y calcula. Tú comprendes y decides.».

Un detalle editorial, no regulatorio: Patrimonio pierde «con datos de tu territorio». Era una de las pocas frases que diferenciaban a NUVIA (los simuladores de Bizkaia) y no tenía ningún problema de perímetro. Si se quitó a propósito, nada que objetar; si fue por hacer sitio, merece volver.

### 3.2. «Qué es NUVIA» (`que-es-nuvia.html`)

Las cinco puertas (`h3` 01–05) reproducen literalmente la definición; `docs/nuvia-definicion.test.mjs` confirma **26 enunciados canónicos** presentes (antes 18+). El cierre ofrece «Explorar los cinco espacios →» como acción principal y «Volver al inicio» como secundaria, tal como pedía el plan A3.5-6. Cabecera, diseño, fotografía (ahora `.webp`), manifiesto, valores y cierre se conservan. La captura `cinco-espacios-820.png` muestra las cinco puertas legibles en tableta.

**N2 (menor).** «Explorar los cinco espacios» enlaza a `index.html#mercados`, el ancla de la lámina de Economía y Finanzas. Funciona porque es la primera de las cinco láminas, pero el nombre del ancla es heredado y si algún día se reordenan las láminas el enlace dejará de significar «los cinco espacios». Conviene un ancla propia (`id="espacios"`) en el contenedor de las cinco láminas.

### 3.3. Portada (`index.html`)

- Subtítulo del hero: «Información, formación y herramientas para familias que quieren comprender su dinero y pensar a largo plazo.» ✓ (D3).
- Barra de pilares: 01 Comprender · 02 Cuidar · 03 Transmitir ✓ (D4). Eyebrow «Perspectiva · Disciplina · Legado» se mantiene; correcto: son temas, no promesas.
- Un único enlace «Descubre qué es NUVIA →» dentro de «El proyecto» ✓ (D3, sin párrafo adicional).
- Lámina Familia, Salud y Bienestar con insignia «En preparación» ✓.
- Captura `inicio-1280.png`: cabecera de dos niveles limpia, hero completo, sin cortes.

### 3.4. Cabecera (17 páginas)

`Academia` → `Academia NUVIA` como nombre de espacio; el subenlace pasa a «Portada de Academia». Los cinco nombres coinciden con D1 en las 17 cabeceras (`docs/nuvia-navigation.test.mjs` los comprueba con la grafía oficial en las líneas 45-100). La cabecera de dos niveles se amplía a `max-width: 1319px` (`estilos/nuvia-components.css:946`) para absorber el ancho extra de «Academia NUVIA»: en mi auditoría **no hay ninguna colisión** de cabecera en ninguna de las 19 vistas a 1440, 1280, 1180 ni 820 px.

### 3.5. Pie (17 páginas + `_plantilla.html`)

Estructura nueva: marca + frase D4 / **Los cinco espacios** / **Herramientas** (Cartera y analítica, Análisis y valoración de empresas, Vivienda y coste de vida, Impuestos, Jubilación) / **Información** (Qué es NUVIA, aviso educativo). «Acompañamos a familias…» ha desaparecido de las 17 páginas y de la plantilla (solo sobrevive en `scripts/unify-shell.mjs`, que está marcado obsoleto y no se ejecuta). «Sistema visual» retirado del pie público: la única referencia restante es la propia `sistema-visual.html`. Captura `pie-820.png` limpia.

**N3 (importante-menor, decisión de contenido).** En «Los cinco espacios», el enlace **Patrimonio** apunta a `temas.html?topic=planificacion-patrimonial`, es decir, a la única entrada de Patrimonio que está «En preparación». Quien pulse «Patrimonio» en el pie aterriza en tres tarjetas vacías. Mientras Patrimonio no tenga portada propia, es mejor que el pie lo lleve a `temas.html` (el concentrador «Temas clave», que ya lista vivienda, impuestos, jubilación y planificación) o a `vivienda.html`. Es un cambio de un atributo en 17 archivos y `_plantilla.html`; puede ir en la confirmación de esta entrega o en la siguiente.

**N4 (para la Entrega 2, C3).** Los `<title>` aún no siguen ni la grafía oficial ni la forma «NUVIA · [sección]» que fija el acta: «Academia Nuvia | NUVIA», «Lecturas con criterio | NUVIA Family Wealth», «Analítica de cartera | NUVIA Family Wealth», «NUVIA Family Wealth» (portada). El acta lo deja como «preferentemente», así que no incumple nada; es la primera tarea natural del inventario de metadatos. En ese inventario, `guia-impuestos.html` (sin cabecera ni pie comunes, con `noindex`) debe quedar fuera del sitemap hasta que se termine.

### 3.6. Ficha regulatoria

`docs/FICHA_REGULATORIA_QUE_ES_NUVIA.md` incorpora la sección «Entrega 1 — arquitectura de cinco espacios y lenguaje institucional», clasificación VERDE, con once puntos que cubren exactamente lo que cambió: planificación como ámbito educativo, salud general sin productos ni profesionales concretos, comunidad y suscripción solo en documentación prospectiva, cuenta básica sin cambios, tríada visual como acciones de la familia, marca como wordmark histórico, acciones sin derivación. Coherente con el marco §12 y con la puerta «antes de publicar» del §13 (validación funcional y regulatoria registrada; verde, no exige validación jurídica).

---

## 4. Validación reejecutada de forma independiente

| Prueba | Dónde | Resultado |
|---|---|---|
| `check-parity`, `check-static-site`, `check-consistencia`, `check-lenguaje`, banners, navegación, definición | PC de Óscar, árbol local | ✓ 23 páginas y referencias; 18 páginas sin errores; lenguaje descriptivo; 17 cabeceras; 26 enunciados canónicos. 4 avisos no bloqueantes preexistentes (`guia-impuestos.html` sin cabecera/pie comunes y `noindex`; 2 imágenes del hero sin `lazy`, correcto) |
| `test:analisis` (13 baterías del laboratorio, incluida `nuvia-cuenta`) | nube, árbol replicado | ✓ sin fallos |
| Render 19 vistas a 1440 px | nube, Chromium independiente | ✓ AA:0, <12px:0, escala:0, desbordes:0, cabecera:0, fugas:0 |
| Render `index`, `mercados`, `que-es-nuvia` × 1440/1280/1180/1024/900/820/768 | nube | ✓ 21 vistas sin fallos |
| Render de las 19 vistas × 1280/1180/820 (más allá de lo que exige la entrega) | nube | Cabecera, contraste, desbordes y fugas: **0 fallos en las 57 vistas**. Fallan solo por «fuera de escala» los títulos fluidos de 9 páginas no urgentes (14 vistas) (38,4 px a 1280; 35,4 px a 1180; 30 px a 820 en `cartera.html`, `curso.html`, `lecturas.html`, `jubilacion.html` y las cinco guías) |

Las desviaciones de escala son las mismas que quedaron documentadas en la Entrega U como pendiente de la homogeneización (Entrega 4): son `clamp()` de títulos que a anchos intermedios caen entre dos pasos de la escala. No las introduce esta entrega, no afectan a las páginas que esta entrega toca (`index`, `que-es-nuvia`, `mercados` pasan la matriz completa) y no las cubre el criterio de cierre de la Entrega 1 (taxonomía única y lenguaje aprobado). Las anoto con página y ancho para que la Entrega 4 no tenga que redescubrirlas.

En el PC, `check-render` **falla en alto** por falta de Chromium, como debe: «No hay un Chromium disponible». Para que la validación completa pueda ejecutarse también allí, y no solo en CI y en la nube, falta `npx playwright install chromium` en esa máquina (o `NUVIA_CHROMIUM` apuntando a un binario).

---

## 5. Qué confirmar y en qué orden

1. Aplicar N1 (dos líneas del acta) y, si se acepta, N3 (enlace de Patrimonio en el pie) antes del commit; N2 y N4 pueden esperar a la Entrega 2.
2. Confirmar en `main` **en dos commits separados**: primero la Entrega U (lo que ya estaba sin confirmar antes de hoy: noticias, cabecera de tableta, WebP, Playwright en CI) y después la Entrega 1 (definición, ficha, «Qué es NUVIA», portada, cabeceras, pies, acta e ideas). Hoy todo vive junto en el árbol de trabajo y un solo commit mezclaría dos entregas que el plan quiere verificables por separado.
3. Dejar que GitHub Actions compile y verificar en producción los cinco puntos visibles: subtítulo y pilares del hero, enlace «Descubre qué es NUVIA», cinco puertas en «Qué es NUVIA», pie nuevo, «Academia NUVIA» en la cabecera.
4. Entrega 2 (accesibilidad, metadatos y confianza): la documentación de privacidad de la cuenta existente es la pieza con más peso regulatorio (marco §11) y conviene abrirla con el inventario real de datos y flujos de `js/nuvia-cuenta.js`, `js/nuvia-datos.js` y Firebase antes de redactar ningún texto.

**Nota de limpieza.** Para replicar el árbol en la nube dejé en el PC la carpeta `output\entrega-1\_claude\` (parche y activos comprimidos, 1,6 MB). Está dentro de `output/`, que Git ignora, y no puedo borrarla desde aquí; se puede eliminar sin más.

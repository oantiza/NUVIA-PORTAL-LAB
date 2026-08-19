# Plan de acción · Sección de análisis de cartera

**Fecha:** 18 de agosto de 2026
**Depende de:** `BASES_ANALISIS_CARTERA.md` — leerlo antes de cualquier fase.

Orden por dependencia, no por importancia: cada fase desbloquea la siguiente.
Las estimaciones son órdenes de magnitud, no compromisos.

---

## Sobre la elección de modelo

**La regla, en una línea:** Fable 5 para trabajo intensivo de código y para
todo lo que tenga que salir correcto a la primera; cualquiera de los dos para
conversación, decisiones y redacción.

Fable 5 está en la gama Mythos, por encima de Opus, así que en capacidad bruta
debería rendir mejor en construcción. Pero conviene tener presente dos cosas:

- **No es una medición.** Es lo que se sabe de la gama, no una comparación
  verificada entre ambos sobre este proyecto.
- **Buena parte del valor no está en el modelo.** En la sesión que produjo estas
  bases, los hallazgos reales salieron de medir con un navegador, leer ficheros
  y contrastar hipótesis —no de razonar mejor—. Y los errores salieron de
  afirmar sin comprobar. Un modelo más capaz falla menos, pero no elimina eso:
  lo elimina la verificación.

**Lo que sí es determinante, con cualquier modelo:** empezar cada sesión dando
las bases. Ningún modelo recuerda la sesión anterior.

---

## Fase 0 · Cerrar las decisiones abiertas

**Sin código. Bloquea todo lo demás.** Modelo: cualquiera — es conversación.

| Decisión | Bloquea |
|---|---|
| Qué análisis va en cada nivel | El diseño de todas las pantallas |
| Unidad de «prueba» del visitante | La lógica de límites |
| Periodicidad de los datos precalculados | El proceso de la fase 1 |
| Infraestructura de cuentas | Las fases 4 y 5 |
| Validación de los supuestos de mercado | La credibilidad de las cifras |

**Entregable:** secciones 6 y 8 de las bases actualizadas.
**Señal de que está hecha:** se puede dibujar en papel qué ve cada nivel.

---

## Fase 1 · Integración con la base maestra

**Ya no es "el cuello de botella real" — se resolvió el problema de fondo al
decidir reutilizar `bbdd-activos-financieros`.** El trabajo pasa de construir
un pipeline de datos propio a conectar con Cloud Functions ya existentes, de
solo lectura. Modelo: **Fable 5** para la integración técnica; el riesgo ya no
es de cálculo, es de coste e integración correcta.

1. **Firebase Anonymous Auth** en el portal, para que el visitante consulte
   sin registrarse (las Cloud Functions exigen `request.auth != null`).
2. **Conectar con las Cloud Functions existentes**: `search_assets`,
   `get_asset_detail`, `get_asset_holdings`, `get_price_series`.
3. **Resolver la matriz de correlaciones.** Ninguna función la sirve hoy.
   Confirmar si sale de `get_price_series` calculada en cliente, o si hace
   falta una función nueva en el repositorio de la plataforma profesional
   —eso último requiere acuerdo explícito, no es "solo consulta".
4. **Medir el coste real** por invocación, y proyectarlo a volumen.
5. **Definir el catálogo visible** en el portal por criterio propio, sobre el
   catálogo completo de la maestra.

> **Consecuencia que hay que asumir.** Esto cambia el principio de "sin
> backend por usuario": ya no es un fichero estático, es una llamada real a
> Cloud Functions por visitante. Tiene coste, aunque pequeño.
---

## Fase 2 · Completar el motor de cálculo

Modelo: **Fable 5**. Cálculo financiero: la corrección importa más que el estilo.

1. **Migrar a correlaciones entre pares** en `nuvia-cartera.js`.
2. **Portar el solapamiento** desde `src/core/overlap.ts` de la plataforma,
   resolviendo sus dependencias de tipos. Es prioritario: es el ejemplo más
   claro de algo que el usuario no ve en ningún otro sitio.
3. **Concentración sectorial y geográfica**, con look-through en fondos.
4. **Frontera y Monte Carlo** sobre activos reales, no sobre clases.

**Verificación:** carteras de prueba con resultado conocido. Una cartera de un
solo activo debe dar 0 % de ahorro por diversificar; dos activos muy
correlacionados, casi 0; una diversificada de verdad, varios puntos.

---

## Fase 3 · El nivel de visitante

Modelo: cualquiera para el diseño; **Fable 5** si se generan muchos componentes.

Es el nivel más importante: si no engancha, no hay registro ni suscripción.

1. **Pantallas** con la identidad de NUVIA (`nuvia-tokens.css`), no la de la
   plataforma profesional.
2. **Buscador sobre el catálogo completo** — visible para todos desde el primer
   momento.
3. **Cinco posiciones, 3–4 carteras, guardado local**, con el aviso de que se
   pierde al limpiar el navegador.
4. **Los gráficos**, uno por idea. Ver bases, sección 4.

> **Revisar el lenguaje una a una.** Títulos, etiquetas y textos de métricas.
> Una palabra mal puesta en un encabezado tiene más alcance que un párrafo. Ver
> bases, sección 2: se muestra la métrica y se explica qué significa; la
> conclusión la saca el usuario.

**Verificación obligatoria antes de publicar:** contraste AA en todo, suelo
tipográfico de 12 px, sin desbordes a 1440 / 1024 / 390 px, y que la página
renderice sin JavaScript.

---

## Fase 4 · Cuentas y niveles

Modelo: **Fable 5**. Autenticación y datos personales: terreno donde un fallo
tiene consecuencias.

1. **Decidir infraestructura** (fase 0). La app de empresas ya usa Firebase Auth.
2. **Registro con datos mínimos** y consentimiento granular.
3. **Persistencia en la nube** para registrado y suscriptor.
4. **Migración de local a cuenta** con permiso explícito. Nunca en silencio.
5. **Derechos RGPD operativos** desde el primer día: acceso, rectificación,
   supresión, portabilidad.

**Antes de esta fase: revisión jurídica.** Ver bases, «Pendiente de validación
jurídica». No es un trámite posterior.

---

## Fase 5 · Suscripción y pago por uso

Modelo: **Fable 5** para la integración; conversación para el diseño de la oferta.

1. **Pasarela de pago** y facturación.
2. **Extras de pago por uso**, con el criterio de las bases: se cobra aparte lo
   que se percibe como extra desde el principio, nunca un trozo del análisis que
   se le ha quitado.
3. **Informes genéricos sin firma personal.**

---

## Transversal · Contenido y carteras modelo

Modelo: cualquiera, con las bases delante. **La sección 5 es de obligado
cumplimiento** al redactar.

- Carteras temáticas publicadas, idénticas para todo el que llegue a ellas.
- Informes con estructura fija: qué hace la compañía, cómo gana dinero, cifras,
  situación financiera, contexto sectorial, riesgos.
- **Prueba antes de publicar:** leer el texto entero y preguntarse si de él se
  deduce qué debería hacer un lector con su dinero. Si la respuesta es sí, se
  reescribe —aunque cada frase por separado sea cierta.

---

## Cómo empezar cada sesión

1. **Dar las bases.** `docs/BASES_ANALISIS_CARTERA.md`. Sin eso, cualquier
   modelo empieza de cero y propone cosas que ya se descartaron.
2. **Decir en qué fase se está** y qué se cerró en la anterior.
3. **Exigir verificación, no afirmación.** Medir con navegador, leer el fichero,
   comprobar el dato. Es de donde salió el valor de la sesión que produjo estas
   bases, y de donde salieron también sus errores cuando no se hizo.
4. **Actualizar las bases al terminar** si algo ha cambiado. Es el documento que
   manda; si se queda atrás, se repite el problema de la guía de OAA.

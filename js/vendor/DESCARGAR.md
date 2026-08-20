# Dependencias autoalojadas

React y ReactDOM se cargan con dos `<script defer>` que van **antes** que
`support.js` en el `<head>` de las dieciséis páginas. `loadReactUmd()` empieza
comprobando si ya están en `window` y, si lo están, devuelve sin tocar el CDN.

**No usar `window.__resources` para esto.** El mecanismo existe y funciona para
redirigir la carga, pero `boot()` usa la misma variable para decidir otra cosa:

```js
if (!window.__resources) {
  fetch(location.href).then(...)          // vuelve a leer el HTML servido
    .then((t) => runtime.updateHtml(rootName, parseDcText(t).template));
}
```

Ese segundo `fetch` es imprescindible. El analizador de HTML del navegador
**expulsa fuera de la tabla** cualquier elemento desconocido que encuentre
dentro de `<table>`, así que el `<sc-for>` que genera las filas de la tabla de
cotizaciones de Mercados desaparece del DOM vivo. Solo se recupera releyendo el
HTML en crudo. Asignar `__resources` desactiva ese rescate y la tabla se queda
con una fila vacía — pasó, se publicó, y se tardó en ver porque la página no da
ningún error.

Si algún día hace falta `__resources` para otra cosa, hay que resolver antes el
rescate de la plantilla.

Los ficheros deben ser byte a byte los del CDN: su `sha384` tiene que coincidir
con `REACT_SRI` y `REACT_DOM_SRI` de `support.js`.

Para descargarlos (una sola vez, y al actualizar versión):

```bash
mkdir -p js/vendor
curl -fL -o js/vendor/react.production.min.js \
  https://unpkg.com/react@18.3.1/umd/react.production.min.js
curl -fL -o js/vendor/react-dom.production.min.js \
  https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js
```

Las copias deben ser byte a byte las del CDN: el runtime aplica el mismo
hash de integridad (`REACT_SRI` / `REACT_DOM_SRI` en `support.js`).

Al subir de versión de React hay que actualizar las tres cosas a la vez:
la URL de `window.__resources`, el hash y estos ficheros.

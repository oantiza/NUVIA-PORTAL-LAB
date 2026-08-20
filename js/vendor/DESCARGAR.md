# Dependencias autoalojadas

`support.js` redirige React y ReactDOM a esta carpeta mediante
`window.__resources`, que asigna `js/recursos.js`. Ese fichero va antes que
`support.js` en el `<head>` de las quince páginas con componente, y los dos
llevan `defer`, que conserva el orden del documento.

Si los ficheros no están, el navegador cae de vuelta al CDN, así que la web no
se rompe — pero se pierde la ventaja, que es no depender de unpkg para
arrancar. Comprobado bloqueando unpkg entero: las quince páginas pintan
exactamente los mismos píxeles.

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

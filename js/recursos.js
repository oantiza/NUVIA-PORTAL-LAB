/* Dependencias del arranque, servidas por el propio sitio.
   ─────────────────────────────────────────────────────────────────────────────
   support.js carga React y ReactDOM con <script src> apuntando a unpkg. El
   mecanismo para no depender del CDN ya estaba escrito —cdnScriptFor() mira
   window.__resources y usa la ruta que encuentre— pero nadie asignaba nunca esa
   variable y la carpeta js/vendor/ estaba vacía. Resultado: si unpkg no
   responde, no arranca ninguna página con componente. Que son quince.

   Los dos ficheros de js/vendor/ son byte a byte los del CDN: su sha384
   coincide con REACT_SRI y REACT_DOM_SRI de support.js. Al subir de versión de
   React hay que cambiar las tres cosas a la vez —la URL, el hash y estos
   ficheros—, y js/vendor/DESCARGAR.md dice cómo.

   Este fichero va antes que support.js en el <head> y los dos llevan defer, que
   conserva el orden del documento.
   ─────────────────────────────────────────────────────────────────────────── */
window.__resources = {
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js': 'js/vendor/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': 'js/vendor/react-dom.production.min.js'
};

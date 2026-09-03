import React from 'react';
import { createRoot } from 'react-dom/client';
import AlphaApp from './App.jsx';
import '../theme.css';
import '../theme-b.css';
import '../../../estilos/nuvia-tokens.css';
import './theme.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><AlphaApp /></React.StrictMode>);
// Solo comunica tamaño a su contenedor del mismo origen. No envía datos financieros.
if (window.parent !== window) {
  let previous = 0;
  const observer = new ResizeObserver(() => {
    const height = Math.ceil(document.getElementById('root').getBoundingClientRect().height + 24);
    if (height !== previous) { previous = height; window.parent.postMessage({ type: 'nuvia-company-height', height }, location.origin); }
  });
  observer.observe(document.getElementById('root'));
}

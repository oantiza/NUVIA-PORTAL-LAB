import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { applyInitialTheme, ThemeProvider } from './components/Theme.jsx';
import './theme.css';

applyInitialTheme();

const embeddedInNuvia = new URLSearchParams(window.location.search).get('embedded') === 'web2';
if (embeddedInNuvia) document.documentElement.classList.add('nuvia-company-embedded');

function startEmbeddedBridge() {
  if (!embeddedInNuvia || window.parent === window) return;
  const notifyHeight = () => window.parent.postMessage({
    source: 'nuvia-company-analysis',
    type: 'resize',
    height: Math.ceil(document.documentElement.scrollHeight),
  }, window.location.origin);
  const root = document.getElementById('root');
  const observer = new ResizeObserver(notifyHeight);
  if (root) observer.observe(root);
  window.addEventListener('load', notifyHeight, { once: true });
  window.requestAnimationFrame(() => window.requestAnimationFrame(notifyHeight));
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);

startEmbeddedBridge();

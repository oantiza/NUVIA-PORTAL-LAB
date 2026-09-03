import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { loadCompanies } from './local/data.mjs';
import { loadReviewSample } from './local/review.mjs';
import { allowedRequest, localMiddleware, LOCAL_CSP } from './local/server.mjs';

export default defineConfig(async ({ command, isPreview }) => {
  if (command !== 'serve' || isPreview) throw new Error('La recuperación local solo admite desarrollo; no compila ni sirve publicaciones.');
  const dataset = await loadCompanies();
  const review = await loadReviewSample();
  console.log(`Fundamentales locales: ${dataset.companies.length} compañías; ${dataset.issues.length} incidencias. Sin conexión a bases de datos.`);
  const fonts = new Map();
  for (const file of ['nuvia-fonts.css', 'fuentes/inter-latin.woff2', 'fuentes/inter-latin-ext.woff2',
    'fuentes/fraunces-latin.woff2', 'fuentes/fraunces-latin-ext.woff2']) {
    fonts.set(`/estilos/${file}`, await readFile(new URL(`../estilos/${file}`, import.meta.url)));
  }
  return {
    base: '/', publicDir: false, envDir: false,
    optimizeDeps: { entries: ['local.html'] },
    plugins: [{ name: 'nuvia-local-only', configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const font = fonts.get(req.url?.split('?')[0]);
        if (!font) return next();
        if (!allowedRequest(req) || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(403); return res.end(); }
        res.setHeader('Content-Type', req.url.includes('.css') ? 'text/css' : 'font/woff2');
        res.setHeader('Content-Security-Policy', LOCAL_CSP);
        res.end(req.method === 'HEAD' ? undefined : font);
      });
      server.middlewares.use(localMiddleware(dataset, review));
    } }, react()],
    server: { host: '127.0.0.1', port: 18792, strictPort: true, cors: false, hmr: false,
      watch: { ignored: ['**/local/**', '**/output/**'] }, fs: { strict: true } },
  };
});

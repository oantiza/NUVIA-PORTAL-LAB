import { catalogOf } from './data.mjs';

export const LOCAL_ORIGIN = 'http://127.0.0.1:18792';
export const LOCAL_CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

// Guard on EVERY request, not just fixtures: no raw directory or legacy app
// can be reached by requesting a file directly through the development server.
export function allowedRequest(req) {
  if (req.headers.host !== '127.0.0.1:18792') return false;
  if (req.headers.origin && req.headers.origin !== LOCAL_ORIGIN) return false;
  if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return false;
  return true;
}

export function localMiddleware(dataset, review = { state: 'unavailable', message: 'La muestra revisada no está cargada.' }) {
  const bySymbol = new Map(dataset.companies.map(c => [c.symbol, c]));
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', LOCAL_CSP);
    const send = (code, body) => {
      res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(body));
    };
    if (!allowedRequest(req)) return send(403, { error: 'Solo acceso desde este equipo y este origen.' });
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, { error: 'Vista de solo lectura.' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, LOCAL_ORIGIN).pathname); }
    catch { return send(400, { error: 'Ruta no válida.' }); }
    if (pathname === '/__local-company__/review') return send(200, review);
    if (pathname === '/__local-company__/catalog') return send(200, catalogOf(dataset));
    if (pathname.startsWith('/__local-company__/company/')) {
      const company = bySymbol.get(pathname.slice('/__local-company__/company/'.length));
      return company ? send(200, company) : send(404, { error: 'Esta compañía no está en la copia local.' });
    }
    if (pathname === '/') { res.writeHead(302, { Location: '/local.html' }); return res.end(); }
    // Vite modules needed by this entry only. Legacy entry, SDK, configs,
    // output/, @fs, environment and all unrelated repository files are denied.
    const allowed = pathname === '/local.html' || pathname === '/@vite/client' || pathname === '/@react-refresh'
      || /^\/src\/local\/[\w.-]+\.(jsx|js|css)$/.test(pathname)
      || /^\/src\/lib\/(format|financial)\.js$/.test(pathname)
      || /^\/src\/components\/(Kpi|SvgCharts|IndicatorInfo)\.jsx$/.test(pathname)
      || pathname === '/src/views/tabs/FundamentalTab.jsx'
      || /^\/src\/theme(?:-b)?\.css$/.test(pathname)
      || /^\/node_modules\/\.vite\/deps\/(?:react[\w.-]*|chunk-[\w-]+|rolldown-runtime-[\w-]+)\.js(?:\.map)?$/.test(pathname)
      || pathname === '/node_modules/vite/dist/client/env.mjs';
    if (!allowed) return send(404, { error: 'Ruta fuera de la prueba local.' });
    next();
  };
}

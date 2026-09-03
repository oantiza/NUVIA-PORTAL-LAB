import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { packSnapshot } from './pack.mjs';
const source = new URL('../public/data/fundamentals.json', import.meta.url);
const load = async () => packSnapshot(JSON.parse(await readFile(source, 'utf8')));

export function companyDataPlugin() {
  let building = false;
  return {
    name: 'nuvia-company-data',
    configResolved(config) { building = config.command === 'build'; },
    async buildStart() {
      this.addWatchFile(fileURLToPath(source));
      if (!building) return;
      const { files } = await load();
      for (const [fileName, content] of files) this.emitFile({ type: 'asset', fileName, source: content });
    },
    async configureServer(server) {
      let packed = await load();
      server.watcher.on('change', async path => {
        if (path.replaceAll('\\', '/').endsWith('/public/data/fundamentals.json')) {
          try { packed = await load(); } catch { packed = null; }
        }
      });
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url, 'http://local.test').pathname.slice(1);
        if (!path.startsWith('data/')) return next();
        const content = packed?.files.get(path);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (!content || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end('{}'); return; }
        res.end(req.method === 'HEAD' ? undefined : content);
      });
    },
  };
}

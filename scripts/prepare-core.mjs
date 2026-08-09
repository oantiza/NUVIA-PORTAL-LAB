import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const coreRoot = resolve(process.argv[2] || 'core');
const indexPath = resolve(coreRoot, 'index.html');
await access(indexPath);

const html = await readFile(indexPath, 'utf8');
const bridgeTag = '    <script src="../web2-core-bridge.js"></script>';
const updated = html.includes('web2-core-bridge.js')
  ? html
  : html.replace('  </body>', `${bridgeTag}\n  </body>`);
await writeFile(indexPath, updated, 'utf8');

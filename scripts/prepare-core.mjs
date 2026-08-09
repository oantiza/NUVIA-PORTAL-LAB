import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const coreRoot = resolve(process.argv[2] || 'core');
const indexPath = resolve(coreRoot, 'index.html');
const assetsPath = resolve(coreRoot, 'assets');
await access(indexPath);

const html = await readFile(indexPath, 'utf8');
const assetFiles = await readdir(assetsPath);
const portfolioBundle = assetFiles.find((filename) => /^PortfolioAnalyticsSuite-(?!Web2).*\.js$/.test(filename));
if (!portfolioBundle) throw new Error('No se ha encontrado el módulo de analítica de cartera del núcleo');

const adapterFilename = 'PortfolioAnalyticsSuite-Web2.js';
const adapterSource = `import PortfolioAnalyticsSuite from './${portfolioBundle}?original=1';

export default PortfolioAnalyticsSuite;
`;
await writeFile(resolve(assetsPath, adapterFilename), adapterSource, 'utf8');

const importMap = `    <script type="importmap">
      {
        "imports": {
          "./assets/${portfolioBundle}": "./assets/${adapterFilename}"
        }
      }
    </script>`;
const bridgeTag = '    <script src="../web2-core-bridge.js"></script>';
let updated = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, `\n${importMap}`);
if (!updated.includes('PortfolioAnalyticsSuite-Web2.js')) {
  updated = updated.replace(/(\s*<script type="module"[^>]*>)/, `\n${importMap}$1`);
}
if (!updated.includes('web2-core-bridge.js')) {
  updated = updated.replace('  </body>', `${bridgeTag}\n  </body>`);
}
await writeFile(indexPath, updated, 'utf8');

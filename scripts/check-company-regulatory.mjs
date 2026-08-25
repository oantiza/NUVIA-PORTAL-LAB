import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const root = path.join(projectRoot, 'company-analysis', 'src');
const folders = ['views', 'components'];
const files = [];

function collect(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.(jsx|js)$/.test(entry.name)) files.push(full);
  }
}

for (const folder of folders) collect(path.join(root, folder));

const blocked = [
  { label: 'consulta de consenso de analistas', re: /api\s*\(\s*[`'"]\/consensus/i },
  { label: 'componente de recomendación de analistas', re: /\b(?:AnalystRatings|RatingBars|EstadoTag)\b/ },
  { label: 'precio objetivo propio o de consenso', re: /\b(?:targetMean|targetHigh|targetLow|priceTarget)\b/i },
  { label: 'clasificación operativa', re: /['"`](?:Compra fuerte|Comprar|Vender|Venta fuerte)['"`]/i },
];

const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of blocked) {
    if (rule.re.test(source)) {
      failures.push(`${path.relative(projectRoot, file)}: ${rule.label}`);
    }
  }
}

if (failures.length) {
  console.error('La puerta regulatoria del módulo de empresas ha fallado:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Puerta regulatoria de empresas superada (${files.length} archivos revisados).`);

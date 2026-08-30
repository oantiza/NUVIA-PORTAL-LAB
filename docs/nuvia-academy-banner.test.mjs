import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Se ejecuta sobre el código fuente y sobre dist para evitar que el banner
// vuelva a quedarse solo en el proyecto de Remotion.
const root = resolve(process.argv[2] ?? resolve(import.meta.dirname, '..'));
const asset = 'src/assets/education/nuvia-academy/nuvia-academy-banner-approved-v2.jpeg';
const expectedHash = '58405702998e4e388432c83f75d55ff6ecbeaf920bf40b51075c863e9018200b';
const html = await readFile(resolve(root, 'academia.html'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const bytes = await readFile(resolve(root, asset));
const header = html.match(/<section\b[^>]*id="academy"[\s\S]*?<\/section>/)?.[0];
assert.ok(header, 'Academia debe conservar su cabecera y ancla');
assert.ok(header.includes(`src="${asset}"`), 'La cabecera debe usar la imagen aprobada');
assert.ok(header.includes('width="3552" height="1184"'), 'Debe reservarse la proporción 3:1');
assert.ok(header.includes('fetchpriority="high"'), 'El banner debe cargar con prioridad');
assert.ok(header.includes('id="academy-title"'), 'Debe conservarse el título accesible');
assert.ok(header.includes('alt="Academy. Saber es patrimonio.'), 'La imagen necesita texto alternativo');
assert.ok(header.includes('{{ pestanas }}') && header.includes('{{ p.abrir }}'), 'Las pestañas deben seguir conectadas');
assert.ok(!header.includes('nv-hero--institutional'), 'El hero genérico no debe sustituir al banner');
assert.ok(!html.includes('data-academy-intro'), 'No se debe reintroducir la entradilla');
assert.ok(!home.includes(asset), 'La home general no debe cambiar de banner');
assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash,
  'El archivo publicado debe coincidir exactamente con la imagen aprobada');
console.log(`OK Banner Academy: referencia, navegación, accesibilidad e imagen original en ${root}`);

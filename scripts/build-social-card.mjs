import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = resolve(process.argv[2] || '.');
const source = resolve(root, 'src/assets/social/nuvia-social-source-generated-v1.png');
const logo = resolve(
  root,
  'src/assets/brand/nuvia-family-wealth-exact-2026-v2/logo-horizontal.svg',
);
const output = resolve(root, 'src/assets/social/nuvia-social-card-2026-v1.webp');

const width = 1200;
const height = 630;

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const headline = [
  'Un lugar donde las familias',
  'aprenden a entender su dinero.',
];

const textLayer = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .headline { font-family: Georgia, 'Times New Roman', serif; font-size: 46px; font-weight: 400; fill: #fffaf0; }
    .topics { font-family: Arial, Helvetica, sans-serif; font-size: 19px; font-weight: 500; letter-spacing: 3px; fill: #e8edf3; }
    .principle { font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 500; letter-spacing: 1.6px; word-spacing: 4px; fill: #b8d95a; }
  </style>
  <rect x="76" y="243" width="52" height="3" rx="1.5" fill="#b8d95a"/>
  ${headline.map((line, index) => `<text class="headline" x="76" y="300" dy="${index * 58}">${escapeXml(line)}</text>`).join('\n  ')}
  <text class="topics" x="76" y="438">INFORMACIÓN · FORMACIÓN · HERRAMIENTAS</text>
  <text class="principle" x="76" y="540">NUVIA INFORMA, EXPLICA Y CALCULA. TÚ COMPRENDES Y DECIDES.</text>
</svg>`);

const gradientLayer = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="navy" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#092443" stop-opacity="0.99"/>
      <stop offset="0.42" stop-color="#092443" stop-opacity="0.96"/>
      <stop offset="0.67" stop-color="#092443" stop-opacity="0.52"/>
      <stop offset="1" stop-color="#092443" stop-opacity="0.10"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0.54" stop-color="#092443" stop-opacity="0"/>
      <stop offset="1" stop-color="#092443" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#navy)"/>
  <rect width="${width}" height="${height}" fill="url(#floor)"/>
</svg>`);

const logoSvg = (await readFile(logo, 'utf8'))
  .replaceAll('#0e2d58', '#fffaf0')
  .replaceAll('#41641f', '#b8d95a');

const logoLayer = await sharp(Buffer.from(logoSvg))
  .resize({ width: 405, withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(source)
  .resize(width, height, { fit: 'cover', position: 'centre' })
  .composite([
    { input: gradientLayer, left: 0, top: 0 },
    { input: logoLayer, left: 76, top: 62 },
    { input: textLayer, left: 0, top: 0 },
  ])
  .webp({ quality: 90, effort: 6 })
  .toFile(output);

const metadata = await sharp(output).metadata();
if (metadata.width !== width || metadata.height !== height) {
  throw new Error(`Dimensiones inesperadas: ${metadata.width} × ${metadata.height}`);
}

console.log(`Tarjeta social regenerada: ${output} (${metadata.width} × ${metadata.height})`);

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, 'artifacts', 'logos-nuvia-academy');
const outputDir = path.join(root, 'artifacts', 'logos-nuvia-academy-opciones');

const navy = '#0e2d58';
const green = '#41641f';
const gold = '#b58a46';
const ink = '#050913';

await mkdir(outputDir, { recursive: true });

const [verticalSource, emblemSource, linealSource] = await Promise.all([
  readFile(path.join(sourceDir, '01-NUVIA-Academy-vertical.svg'), 'utf8'),
  readFile(path.join(sourceDir, '04-NUVIA-Academy-emblema-subrayado.svg'), 'utf8'),
  readFile(path.join(sourceDir, '03-NUVIA-Academy-lineal-oscuro.svg'), 'utf8'),
]);

function replaceAcademyText(svg, { color, size, tracking, y = 700 }) {
  return svg.replace(
    /<text x="375" y="700"[^>]*>ACADEMY<\/text>/,
    `<text x="375" y="${y}" text-anchor="middle" fill="${color}" font-family="Roboto, Arial, sans-serif" font-size="${size}" font-weight="500" letter-spacing="${tracking}">NUVIA ACADEMY</text>`,
  );
}

const optionA = replaceAcademyText(
  verticalSource.replaceAll(gold, green),
  { color: green, size: 31, tracking: 7.5 },
).replace('Logotipo vertical NUVIA Academy', 'Opción A, logotipo vertical clásico NUVIA Academy');

const optionB = replaceAcademyText(verticalSource, {
  color: gold,
  size: 31,
  tracking: 7.5,
}).replace('Logotipo vertical NUVIA Academy', 'Opción B, logotipo vertical dorado NUVIA Academy');

const optionC = emblemSource
  .replace('Logotipo NUVIA Academy con emblema y subrayado', 'Opción C, emblema limpio NUVIA Academy')
  .replaceAll('fill="#ffffff"', `fill="${navy}"`)
  .replaceAll(ink, '#ffffff')
  .replaceAll(gold, green)
  .replace(
    /<text x="600" y="555"[^>]*>NUVIA ACADEMY<\/text>/,
    `<text x="600" y="555" text-anchor="middle" fill="${navy}" font-family="Roboto, Arial, sans-serif" font-size="56" font-weight="500" letter-spacing="12">NUVIA ACADEMY</text>`,
  );

const optionD = linealSource
  .replace('Logotipo horizontal NUVIA Academy sobre fondo oscuro', 'Opción D, firma lineal oscura NUVIA Academy')
  .replace(
    /<text x="306" y="121"[^>]*>ACADEMY<\/text>/,
    '<text x="306" y="121" fill="#ffffff" font-family="Roboto, Arial, sans-serif" font-size="16" font-weight="500" letter-spacing="3.2">NUVIA ACADEMY</text>',
  );

const options = [
  {
    id: 'A',
    title: 'CLÁSICA VERDE',
    subtitle: 'Sustitución literal del maestro',
    svg: optionA,
    width: 1000,
    height: 1000,
  },
  {
    id: 'B',
    title: 'ACADEMY ORO',
    subtitle: 'Misma estructura, acento editorial',
    svg: optionB,
    width: 1000,
    height: 1000,
  },
  {
    id: 'C',
    title: 'EMBLEMA LIMPIO',
    subtitle: 'La frase aparece una sola vez',
    svg: optionC,
    width: 1200,
    height: 700,
  },
  {
    id: 'D',
    title: 'LINEAL OSCURO',
    subtitle: 'Para vídeo, portadas y cabeceras',
    svg: optionD,
    width: 1200,
    height: 294,
  },
];

for (const option of options) {
  const baseName = `${option.id}-NUVIA-Academy-${option.title.toLowerCase().replaceAll(' ', '-')}`;
  const svgPath = path.join(outputDir, `${baseName}.svg`);
  const pngPath = path.join(outputDir, `${baseName}.png`);
  await writeFile(svgPath, option.svg, 'utf8');
  await sharp(Buffer.from(option.svg)).png().toFile(pngPath);
  option.pngPath = pngPath;
}

const cardWidth = 820;
const cardHeight = 590;
const previewWidth = 700;
const previewHeight = 410;
const boardWidth = 1800;
const boardHeight = 1450;

const composites = [];
for (let index = 0; index < options.length; index += 1) {
  const option = options[index];
  const col = index % 2;
  const row = Math.floor(index / 2);
  const left = 70 + col * 870;
  const top = 170 + row * 620;
  const preview = await sharp(option.pngPath)
    .flatten({ background: '#ffffff' })
    .resize(previewWidth, previewHeight, {
      fit: 'contain',
      withoutEnlargement: true,
      background: '#ffffff',
    })
    .png()
    .toBuffer();
  const meta = await sharp(preview).metadata();
  composites.push({
    input: preview,
    left: Math.round(left + (cardWidth - (meta.width ?? previewWidth)) / 2),
    top: Math.round(top + 84 + (previewHeight - (meta.height ?? previewHeight)) / 2),
  });
}

const labels = options.map((option, index) => {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const left = 70 + col * 870;
  const top = 170 + row * 620;
  return `
    <rect x="${left}" y="${top}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="#ffffff" stroke="#d8dde4" stroke-width="2"/>
    <circle cx="${left + 46}" cy="${top + 44}" r="23" fill="${navy}"/>
    <text x="${left + 46}" y="${top + 52}" text-anchor="middle" fill="#ffffff" font-family="Roboto, Arial, sans-serif" font-size="22" font-weight="700">${option.id}</text>
    <text x="${left + 82}" y="${top + 41}" fill="${navy}" font-family="Roboto, Arial, sans-serif" font-size="23" font-weight="700" letter-spacing="1">${option.title}</text>
    <text x="${left + 82}" y="${top + 67}" fill="#687383" font-family="Roboto, Arial, sans-serif" font-size="17">${option.subtitle}</text>`;
}).join('');

const boardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${boardHeight}" viewBox="0 0 ${boardWidth} ${boardHeight}">
  <rect width="${boardWidth}" height="${boardHeight}" fill="#f3f5f7"/>
  <text x="70" y="72" fill="${navy}" font-family="Roboto, Arial, sans-serif" font-size="42" font-weight="700">NUVIA ACADEMY · OPCIONES DE LOGO</text>
  <text x="70" y="112" fill="#687383" font-family="Roboto, Arial, sans-serif" font-size="22">Símbolo maestro NUVIA · frase exacta “NUVIA ACADEMY”</text>
  ${labels}
  <text x="70" y="1390" fill="#687383" font-family="Roboto, Arial, sans-serif" font-size="18">Comparativa conceptual · SVG y PNG separados incluidos</text>
</svg>`;

await writeFile(path.join(outputDir, 'NUVIA-Academy-opciones.svg'), boardSvg, 'utf8');
await sharp(Buffer.from(boardSvg))
  .composite(composites)
  .png()
  .toFile(path.join(outputDir, 'NUVIA-Academy-opciones.png'));

console.log(outputDir);

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const root = process.cwd();
const inputVideo = 'D:\\CIERRE.mp4';
const inputLogo = 'D:\\B-NUVIA-Academy-academy-oro.svg';
const outputDir = path.join(root, 'deliverables', 'video');
const artifactDir = path.join(root, 'artifacts', 'video-cierre-academy');
const workDir = path.join(artifactDir, 'work');
const sourceFramesDir = path.join(workDir, 'source');
const renderedFramesDir = path.join(workDir, 'rendered');
const outputVideo = path.join(outputDir, 'CIERRE-NUVIA-ACADEMY.mp4');
const previewImage = path.join(artifactDir, 'CIERRE-NUVIA-ACADEMY-preview.png');

const fps = 24;
const frameCount = 240;
const canvasWidth = 1280;
const canvasHeight = 720;
const logoSize = 500;
const logoLeft = 379;
const logoTop = 84;
const patchLeft = 280;
const patchTop = 0;
const patchWidth = 720;
const patchHeight = 720;
const patchFeather = 54;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function framePath(dir, index) {
  return path.join(dir, `frame-${String(index).padStart(4, '0')}.png`);
}

await mkdir(outputDir, { recursive: true });
await mkdir(artifactDir, { recursive: true });
await rm(workDir, { recursive: true, force: true });
await mkdir(sourceFramesDir, { recursive: true });
await mkdir(renderedFramesDir, { recursive: true });

execFileSync(
  ffmpeg,
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    inputVideo,
    '-vsync',
    '0',
    path.join(sourceFramesDir, 'frame-%04d.png'),
  ],
  { stdio: 'inherit' },
);

const sourceFiles = (await readdir(sourceFramesDir))
  .filter((name) => name.endsWith('.png'))
  .sort();

if (sourceFiles.length !== frameCount) {
  throw new Error(`Se esperaban ${frameCount} fotogramas y se obtuvieron ${sourceFiles.length}.`);
}

const logoSvg = await readFile(inputLogo, 'utf8');
const taglineMatch = logoSvg.match(/<text x="375" y="700"[^>]*>NUVIA ACADEMY<\/text>/);
if (!taglineMatch) {
  throw new Error('No se encontró el texto NUVIA ACADEMY en el SVG facilitado.');
}

const bodySvg = logoSvg.replace(taglineMatch[0], '');
const wordmarkMarker = '<g transform="matrix(1, 0, 0, 1, 94, 525)">';
const wordmarkIndex = bodySvg.indexOf(wordmarkMarker);
const defsMatch = bodySvg.match(/<defs>[\s\S]*?<\/defs>/);
if (wordmarkIndex < 0 || !defsMatch) {
  throw new Error('No se pudieron separar el símbolo y el nombre NUVIA del SVG.');
}
const wordmarkContent = bodySvg.slice(wordmarkIndex, bodySvg.lastIndexOf('</svg>'));
const symbolSvg = `${bodySvg.slice(0, wordmarkIndex)}</svg>`;
const wordmarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 750 750">
  ${defsMatch[0]}
  ${wordmarkContent}
</svg>`;
const taglineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 750 750">
  ${taglineMatch[0]}
</svg>`;

const symbolPng = await sharp(Buffer.from(symbolSvg))
  .resize(logoSize, logoSize)
  .png()
  .toBuffer();
const wordmarkPng = await sharp(Buffer.from(wordmarkSvg))
  .resize(logoSize, logoSize)
  .png()
  .toBuffer();
const taglinePng = await sharp(Buffer.from(taglineSvg))
  .resize(logoSize, logoSize)
  .png()
  .toBuffer();

await writeFile(path.join(artifactDir, 'logo-symbol.png'), symbolPng);
await writeFile(path.join(artifactDir, 'logo-wordmark.png'), wordmarkPng);
await writeFile(path.join(artifactDir, 'logo-tagline.png'), taglinePng);

const symbolRaw = await sharp(symbolPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const wordmarkRaw = await sharp(wordmarkPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const taglineRaw = await sharp(taglinePng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const cleanFramePath = path.join(sourceFramesDir, sourceFiles[0]);
const cleanFrame = await sharp(cleanFramePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const cleanPatchRgb = await sharp(cleanFramePath)
  .extract({ left: patchLeft, top: patchTop, width: patchWidth, height: patchHeight })
  .removeAlpha()
  .raw()
  .toBuffer();
const patchRgba = Buffer.alloc(patchWidth * patchHeight * 4);

for (let y = 0; y < patchHeight; y += 1) {
  for (let x = 0; x < patchWidth; x += 1) {
    const rgbIndex = (y * patchWidth + x) * 3;
    const rgbaIndex = (y * patchWidth + x) * 4;
    const edgeDistance = Math.min(x, patchWidth - 1 - x);
    const alpha = Math.round(255 * smoothstep(edgeDistance / patchFeather));
    patchRgba[rgbaIndex] = cleanPatchRgb[rgbIndex];
    patchRgba[rgbaIndex + 1] = cleanPatchRgb[rgbIndex + 1];
    patchRgba[rgbaIndex + 2] = cleanPatchRgb[rgbIndex + 2];
    patchRgba[rgbaIndex + 3] = alpha;
  }
}

const cleanPatchPng = await sharp(patchRgba, {
  raw: { width: patchWidth, height: patchHeight, channels: 4 },
}).png().toBuffer();

await writeFile(path.join(artifactDir, 'clean-paper-patch.png'), cleanPatchPng);

for (let frameIndex = 0; frameIndex < sourceFiles.length; frameIndex += 1) {
  const sourcePath = path.join(sourceFramesDir, sourceFiles[frameIndex]);
  const current = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const time = frameIndex / fps;
  const symbolAnimated = Buffer.from(symbolRaw.data);
  const wordmarkAnimated = Buffer.from(wordmarkRaw.data);
  const taglineAnimated = Buffer.from(taglineRaw.data);
  const movementGate = smoothstep((time - 0.55) / 0.5);
  const symbolCompletion = smoothstep((time - 3.72) / 0.82);
  const wordmarkProgress = smoothstep((time - 4.28) / 0.92);
  const wordmarkEdge = 45 + wordmarkProgress * 430;
  const taglineProgress = smoothstep((time - 4.92) / 0.68);
  const taglineEdge = 55 + taglineProgress * 410;

  for (let y = 0; y < logoSize; y += 1) {
    const globalY = logoTop + y;
    if (globalY < 0 || globalY >= canvasHeight) continue;
    for (let x = 0; x < logoSize; x += 1) {
      const targetIndex = (y * logoSize + x) * 4;
      const symbolAlpha = symbolRaw.data[targetIndex + 3];
      const wordmarkAlpha = wordmarkRaw.data[targetIndex + 3];
      const taglineAlpha = taglineRaw.data[targetIndex + 3];
      if (symbolAlpha === 0 && wordmarkAlpha === 0 && taglineAlpha === 0) continue;

      const globalX = logoLeft + x;
      if (globalX < 0 || globalX >= canvasWidth) continue;
      const framePixel = (globalY * canvasWidth + globalX) * current.info.channels;
      const cleanPixel = (globalY * canvasWidth + globalX) * cleanFrame.info.channels;
      const dr = current.data[framePixel] - cleanFrame.data[cleanPixel];
      const dg = current.data[framePixel + 1] - cleanFrame.data[cleanPixel + 1];
      const db = current.data[framePixel + 2] - cleanFrame.data[cleanPixel + 2];
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      const cleanLuma = cleanFrame.data[cleanPixel] * 0.2126
        + cleanFrame.data[cleanPixel + 1] * 0.7152
        + cleanFrame.data[cleanPixel + 2] * 0.0722;
      const currentLuma = current.data[framePixel] * 0.2126
        + current.data[framePixel + 1] * 0.7152
        + current.data[framePixel + 2] * 0.0722;
      const darkening = Math.max(0, cleanLuma - currentLuma);
      const sampledReveal = clamp((distance + darkening * 0.8 - 14) / 72) * movementGate;
      const targetRed = symbolRaw.data[targetIndex];
      const targetGreen = symbolRaw.data[targetIndex + 1];
      const targetBlue = symbolRaw.data[targetIndex + 2];
      const isGold = targetRed > 120 && targetGreen > 80 && targetBlue < 100;
      if (isGold) {
        let leafStart = 4.0;
        if (y < 150) leafStart = 3.82;
        else if (x < 340) leafStart = 3.98;
        else leafStart = 4.12;
        const leafReveal = smoothstep((time - leafStart) / 0.36);
        symbolAnimated[targetIndex + 3] = Math.round(symbolAlpha * leafReveal);
      } else {
        const symbolReveal = Math.max(sampledReveal, symbolCompletion);
        symbolAnimated[targetIndex + 3] = Math.round(symbolAlpha * symbolReveal);
      }

      const wordmarkBrush = clamp((wordmarkEdge - x) / 34);
      const wordmarkReveal = wordmarkProgress * wordmarkBrush;
      wordmarkAnimated[targetIndex + 3] = Math.round(wordmarkAlpha * wordmarkReveal);

      const brushEdge = clamp((taglineEdge - x) / 28);
      const taglineReveal = taglineProgress * brushEdge;
      taglineAnimated[targetIndex + 3] = Math.round(taglineAlpha * taglineReveal);
    }
  }

  const symbolBuffer = await sharp(symbolAnimated, {
    raw: { width: logoSize, height: logoSize, channels: 4 },
  }).png().toBuffer();
  const wordmarkBuffer = await sharp(wordmarkAnimated, {
    raw: { width: logoSize, height: logoSize, channels: 4 },
  }).png().toBuffer();
  const taglineBuffer = await sharp(taglineAnimated, {
    raw: { width: logoSize, height: logoSize, channels: 4 },
  }).png().toBuffer();

  await sharp(sourcePath)
    .composite([
      { input: cleanPatchPng, left: patchLeft, top: patchTop },
      { input: symbolBuffer, left: logoLeft, top: logoTop },
      { input: wordmarkBuffer, left: logoLeft, top: logoTop },
      { input: taglineBuffer, left: logoLeft, top: logoTop },
    ])
    .png()
    .toFile(framePath(renderedFramesDir, frameIndex + 1));

  if ((frameIndex + 1) % 48 === 0) {
    console.log(`Fotogramas procesados: ${frameIndex + 1}/${frameCount}`);
  }
}

execFileSync(
  ffmpeg,
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-i',
    path.join(renderedFramesDir, 'frame-%04d.png'),
    '-i',
    inputVideo,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '17',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    '-shortest',
    '-y',
    outputVideo,
  ],
  { stdio: 'inherit' },
);

await sharp(framePath(renderedFramesDir, 240))
  .resize(960, 540)
  .png()
  .toFile(previewImage);

console.log(outputVideo);
console.log(previewImage);

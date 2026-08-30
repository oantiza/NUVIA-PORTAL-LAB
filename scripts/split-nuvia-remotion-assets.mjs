import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'remotion', 'nuvia-academy-cierre', 'public');
const sourcePath = path.join(publicDir, 'logo-symbol.png');
const source = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const navy = Buffer.from(source.data);
const leaves = Buffer.from(source.data);

for (let index = 0; index < source.data.length; index += 4) {
  const red = source.data[index];
  const green = source.data[index + 1];
  const blue = source.data[index + 2];
  const alpha = source.data[index + 3];
  if (alpha === 0) continue;

  const isGold = red > 110 && green > 75 && blue < 110;
  if (isGold) navy[index + 3] = 0;
  else leaves[index + 3] = 0;
}

await sharp(navy, { raw: source.info })
  .png()
  .toFile(path.join(publicDir, 'logo-symbol-navy.png'));
await sharp(leaves, { raw: source.info })
  .png()
  .toFile(path.join(publicDir, 'logo-leaves-gold.png'));

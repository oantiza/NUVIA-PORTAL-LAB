import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [motherRootArg, outputArg] = process.argv.slice(2);
if (!motherRootArg || !outputArg) {
  throw new Error('Uso: tsx export-mother-data.mts <ruta-nuvia> <salida-json>');
}

const motherRoot = resolve(motherRootArg);
const output = resolve(outputArg);
const newsModule = await import(pathToFileURL(resolve(motherRoot, 'src/data/dailyEconomicNews.ts')).href);
const macroModule = await import(pathToFileURL(resolve(motherRoot, 'src/data/dailyMacroIndicators.ts')).href);

const payload = {
  synchronizedAt: new Date().toISOString(),
  sourceRepository: 'oantiza/NUVIA',
  dailyEconomicNews: newsModule.dailyEconomicNews,
  macroIndicatorsUpdatedAt: macroModule.macroIndicatorsUpdatedAt,
  dailyMacroIndicators: macroModule.dailyMacroIndicators,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const canonicalPath = fileURLToPath(new URL('./DEFINICION_NUVIA.md', import.meta.url));
const [canonicalRaw, pageRaw] = await Promise.all([
  readFile(canonicalPath, 'utf8'),
  readFile(resolve(root, 'que-es-nuvia.html'), 'utf8'),
]);

const normalize = (value) => value
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[*_`#]/g, ' ')
  .replace(/[.,:;!?¿¡“”«»()[\]—–-]/g, ' ')
  .toLocaleLowerCase('es')
  .normalize('NFC')
  .replace(/\s+/g, ' ')
  .trim();

const canonicalBody = canonicalRaw.replace(/^---\s*[\s\S]*?\s*---\s*/, '');
const publicSentences = canonicalBody
  .split(/\r?\n\s*\r?\n/)
  .map((block) => block.trim())
  .filter((block) => block && block !== '---' && !block.startsWith('#'))
  .flatMap((block) => block.replace(/\r?\n/g, ' ').split(/(?<=[.!?])\s+/))
  .map(normalize)
  .filter(Boolean);

const pageText = normalize(pageRaw);
assert.ok(publicSentences.length >= 18, 'La definición canónica contiene el relato público esperado');
for (const sentence of publicSentences) {
  assert.ok(pageText.includes(sentence), `Falta en la presentación canónica: «${sentence}»`);
}

assert.match(pageRaw, /<link rel="canonical" href="https:\/\/oantiza\.github\.io\/NUVIA-PORTAL-LAB\/que-es-nuvia\.html">/,
  'La página pública mantiene la URL canónica oficial');
assert.match(pageRaw, /NUVIA informa, explica y calcula\.[\s\S]*Tú comprendes y decides\./,
  'El principio central canónico ocupa un bloque visible');

console.log(`Definición NUVIA: ${publicSentences.length} enunciados canónicos presentes en ${root}.`);

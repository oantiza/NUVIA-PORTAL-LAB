import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";


const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const oldBase = "src/assets/brand/nuvia-three-leaf-final-2026";
const newBase = "src/assets/brand/nuvia-family-wealth-exact-2026-v2";
const normalLogo = `${newBase}/nuvia-family-wealth-horizontal-transparent.png`;
const reversedLogo = `${newBase}/nuvia-family-wealth-horizontal-reversed.png`;


function htmlFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    if ([".git", "dist", "node_modules", "output"].includes(name)) return [];
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}


let changed = 0;
for (const path of htmlFiles(root)) {
  const original = readFileSync(path, "utf8");
  let updated = original.replaceAll(oldBase, newBase);

  const footerStart = updated.indexOf("<footer");
  if (footerStart >= 0) {
    const beforeFooter = updated.slice(0, footerStart);
    const footerAndAfter = updated.slice(footerStart).replaceAll(normalLogo, reversedLogo);
    updated = beforeFooter + footerAndAfter;
  }

  if (updated !== original) {
    writeFileSync(path, updated, "utf8");
    console.log(relative(root, path));
    changed += 1;
  }
}

console.log(`Marca V2 aplicada en ${changed} páginas.`);

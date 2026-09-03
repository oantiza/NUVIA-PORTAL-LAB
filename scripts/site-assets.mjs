// Una coincidencia de nombre (README.md, favicon, etc.) no acredita una ruta.
export const referencedAsset = (text, path) => text.includes(path.replaceAll('\\', '/'));

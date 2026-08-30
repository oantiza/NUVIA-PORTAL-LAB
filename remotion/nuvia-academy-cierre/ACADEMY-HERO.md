# Banner Academy seleccionado

Composición `NUVIA-Academy-Hero`: imagen estática proporcionada por el usuario,
sin capas superpuestas, recortes ni modificaciones de la imagen original.
El archivo original mide 3552 × 1184; el lienzo mide 1920 × 640 (3:1).

Desde esta carpeta:

```powershell
npm ci
npm run dev -- --no-open --port=3100
```

Abrir `http://localhost:3100/NUVIA-Academy-Hero`.

Validación y compilación:

```powershell
npm run lint
npm run build
```

El punto de entrada versionado es `src/academy-hero.ts`. El estudio local que
incluye otras composiciones puede seguir abriéndose con su entrada
`src/index.ts`; esas composiciones no forman parte de este cambio.

El mismo banner se integra también en la cabecera de `academia.html` mediante
una copia idéntica en `src/assets/education/nuvia-academy/`. La compilación del
portal incluye esa copia en `dist/` para GitHub Pages. Revisión de perímetro en
`../../docs/FICHA_REGULATORIA_HERO_ACADEMY.md`.

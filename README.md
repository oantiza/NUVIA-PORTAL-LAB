# NUVIA Portal Lab

Laboratorio oficial de NUVIA Portal. Su código de trabajo está exclusivamente en esta carpeta y se publica oficialmente en GitHub Pages. Ningún proceso de este proyecto modifica, sincroniza ni despliega otra versión de NUVIA.

## Entornos

- **Local:** desarrollo y revisión en `http://127.0.0.1:4173`.
- **Producción:** `https://oantiza.github.io/NUVIA-PORTAL-LAB/`.

El repositorio oficial es `https://github.com/oantiza/NUVIA-PORTAL-LAB.git`. Cada actualización de `main` ejecuta la validación, genera `dist/` y publica esa compilación en GitHub Pages.

## Trabajo local

Requisito: Node.js 20 o posterior.

```powershell
npm run serve
```

El comando valida el contenido, genera una publicación limpia en `dist/` y levanta la web local. La carpeta `dist/` es temporal y no se versiona.

## Validación y compilación

```powershell
npm run validate
npm run build
```

La validación comprueba las rutas funcionales, informes, materiales de Academia Nuvia, contenido diario, indicadores macroeconómicos y referencias locales de todas las páginas.

## Publicación

La publicación oficial se realiza automáticamente al enviar cambios a `main` mediante `.github/workflows/pages.yml`. Antes de enviar cambios se debe ejecutar:

```powershell
npm run build
```

GitHub Pages publica únicamente el artefacto generado en `dist/`. Firebase queda como infraestructura secundaria y no se publica salvo petición expresa.

## Contenido diario

La noticia económica y los cinco indicadores macroeconómicos se mantienen directamente en `data/daily-content.json`. La imagen editorial estable de portada está en `src/assets/home/daily-news/daily-news-desktop.webp`.

## Alcance

`core/` forma parte del contenido funcional de NUVIA Portal Lab y se trata como un componente local consolidado. No se descarga ni se reconstruye desde otra web durante el trabajo o la publicación.

# NUVIA Web 3

Proyecto local e independiente de NUVIA. Reúne el rediseño visual completo entregado, mantiene la suite de cartera y conserva las rutas, calculadoras y contenidos dinámicos de la versión anterior.

La experiencia está diseñada para escritorio y tablet. La portada y su hero definen el lenguaje visual común del resto de páginas.

## Entorno local

- **Dirección:** `http://127.0.0.1:4173`.
- **Carpeta de publicación local:** `dist/`.

Este proyecto no incluye acciones de publicación en Firebase ni modifica otras versiones de NUVIA.

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

La validación comprueba las rutas funcionales, informes, materiales de Academy, contenido diario, indicadores macroeconómicos y referencias locales de todas las páginas.

## Contenido diario

GitHub Actions comprueba y renueva automáticamente la noticia económica de portada todos los días, incluida su imagen editorial vinculada a la fuente seleccionada. Los cinco indicadores macroeconómicos oficiales se actualizan de lunes a viernes. Los datos se guardan en `data/daily-content.json` y la imagen vigente en `src/assets/home/daily-news/`.

## Alcance

`core/` forma parte del contenido funcional de NUVIA Web 3 y se trata como un componente local consolidado. No se descarga ni se reconstruye desde otra web durante el trabajo local.

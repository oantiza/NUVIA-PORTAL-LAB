# NUVIA Web 2

Proyecto autónomo de la segunda web de NUVIA. Su código de trabajo está exclusivamente en esta carpeta y se publica en Firebase Hosting. Ningún proceso de este proyecto modifica, sincroniza ni despliega otra versión de NUVIA.

## Entornos

- **Local:** desarrollo y revisión en `http://127.0.0.1:4173`.
- **Vista previa:** canal temporal de Firebase para revisar cambios sin afectar a los usuarios.
- **Producción:** `https://nuvia-family-wealth.web.app/`.

Git se mantiene como historial local. GitHub no forma parte del proceso de compilación ni de publicación.

## Trabajo local

Requisitos: Node.js 20 o posterior y Firebase CLI con acceso al proyecto `nuvia-family-wealth`.

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

## Publicación segura

Primero se crea una vista previa temporal:

```powershell
npm run firebase:preview
```

Solo después de revisarla se publica en producción:

```powershell
npm run firebase:deploy
```

Firebase publica únicamente `dist/`. Los scripts, configuraciones, archivos de trabajo y el repositorio Git nunca se envían a la web.

## Contenido diario

La noticia económica y los cinco indicadores macroeconómicos se mantienen directamente en `data/daily-content.json`. La imagen editorial estable de portada está en `src/assets/home/daily-news/daily-news-desktop.webp`.

## Alcance

`core/` forma parte del contenido funcional de NUVIA Web 2 y se trata como un componente local consolidado. No se descarga ni se reconstruye desde otra web durante el trabajo o la publicación.

# NUVIA · Acta de cierre P5 · integración y publicación

Fecha: 03-09-2026

Canal oficial: GitHub Pages

Estado: **cerrado y verificado**

## Resultado

La entrega de la alfa se revisó, confirmó, integró en `main` y publicó en el canal
oficial. La producción comprobada está en:

<https://oantiza.github.io/NUVIA-PORTAL-LAB/>

No se utilizó Firebase Hosting, no se modificó el backend y no se escribieron datos
personales ni datos de mercado en la base durante esta operación.

## Trazabilidad de Git

- `25e880d` · integra portal, cartera y análisis fundamental.
- `0b9f446` · documenta decisiones, verificaciones y cierre de la alfa.
- `bc4d09f` · integra el universo completo con el cierre de la alfa.
- Rama de trabajo: `codex/entrega-2b-base-alfa`.
- `main` se actualizó sin reescritura forzada.

La integración preservó el universo completo recibido y las incorporaciones de
IWDA y VUSA ya autorizadas. El CSV y el XLSX contienen 727 instrumentos. El catálogo
remoto de la alfa contiene 700 instrumentos disponibles después de 27 exclusiones
automáticas identificadas por los controles de la aplicación.

## Puertas técnicas

- Reconstrucción limpia: superada.
- Once etapas de validación: superadas.
- Pruebas del módulo fundamental: 88 de 88.
- Vistas principales y anchos de escritorio/tableta: superados.
- Artefacto final: 164 archivos y 14.336.772 bytes, idéntico a `dist`.
- Escrituras remotas durante las pruebas: cero.
- Ejecución de publicación `33788638186`: correcta en 3 min 58 s.

La única anotación externa fue el aviso de GitHub sobre la futura migración de sus
acciones de Node 20 a Node 24; no constituye un fallo de NUVIA ni afectó al despliegue.

## Comprobación remota

La versión publicada se comprobó con navegador independiente en 1440 px y 820 px:

- portada y cinco espacios correctos, sin desbordamiento horizontal;
- imágenes diferidas cargadas al entrar en pantalla;
- Economía y Finanzas actualizada al 3 de septiembre de 2026;
- noticia económica del día visible completa, sin texto cortado;
- cartera operativa y módulo cargado desde la copia local
  `company-analysis/index.html`;
- fichas de TSK, Aena y Ferrovial accesibles desde el índice y servidas desde la
  base propia;
- ausencia de PER estimado, BPA previsto y dividendos estimados;
- ausencia de errores o avisos en la consola durante la verificación final.

Se normalizaron además los títulos dinámicos de las vistas activas para que terminen
en `NUVIA`, sin alterar el nombre legal usado en el pie o en los recursos de marca.

## Saldo tras P5

- P1: cerrado.
- P2: aparcado por decisión del fundador.
- P3: cerrado para la alfa.
- P4: pendiente de indicar; no se muestran campos provisionales en la web.
- P5: cerrado y publicado.
- P6: cerrado.
- Vídeo «Qué es NUVIA»: se mantiene para el final, como se ordenó.

Este cierre no autoriza automáticamente futuras publicaciones, cambios de backend,
Firebase o nuevas cargas. Se mantienen las órdenes del fundador y el marco vigente.

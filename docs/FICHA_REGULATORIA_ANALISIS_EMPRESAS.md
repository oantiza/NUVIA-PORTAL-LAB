# Ficha regulatoria — Análisis y valoración de empresas

**Fecha de revisión:** 25 de agosto de 2026
**Ámbito:** copia local `company-analysis/` integrada en NUVIA Portal Lab
**Clasificación:** **Ámbar**. Se analizan emisores identificables, se muestran comparaciones sensibles y existe una lista personal. Requiere revisión documentada antes de publicar y revisión manual de la experiencia completa.

## Prueba obligatoria

1. **Necesidad:** organizar y explicar información histórica y objetiva de una compañía cotizada.
2. **Datos y elección:** el usuario elige la compañía; la API aporta fundamentales, cotizaciones, indicadores y noticias con fuente identificada.
3. **Transformación:** ratios, variaciones, medias e indicadores tradicionales con fórmulas deterministas.
4. **Resultado:** descripción del negocio, series históricas, estados financieros, múltiplos, indicadores técnicos descriptivos, noticias e informe exportable.
5. **Emisor identificable:** sí.
6. **Circunstancias personales:** no se utilizan para interpretar el resultado.
7. **Sugiere operar:** no. Se eliminan señales, estados y textos de comprar, vender o mantener.
8. **Opinión sobre valor o precio:** no se formula una opinión propia ni un precio objetivo.
9. **Orden por atractivo:** no. La búsqueda es por texto y la lista personal se ordena cronológicamente.
10. **Recomendación de terceros:** no se muestran precios objetivo, potencial ni recomendaciones agregadas.
11. **Diseño como veredicto:** no se usan puntuaciones, semáforos ni colores de aprobado o suspendido.
12. **Acción o ejecución:** no existe contratación, contacto comercial ni ejecución.
13. **Remuneración o conflicto:** no se incorpora publicidad, afiliación ni patrocinio.
14. **Agente vinculado:** no se usan marcas, recursos, datos ni canales de la entidad representada.
15. **Datos personales:** autenticación y lista personal; finalidad organizativa, acceso restringido y sin reutilización comercial.
16. **IA:** la traducción automática de la descripción se limita al texto de origen; no interpreta, puntúa ni aconseja.
17. **Transparencia:** fuentes, periodicidad, divisa, fecha y límites se muestran junto a cada familia de datos.
18. **Controles:** compilación, búsqueda automática de lenguaje prescriptivo, pruebas de ausencia de resultados operativos, auditoría de render a 1440 px y reglas responsive para escritorio y tablet.

## Salidas permitidas

- descripción del negocio y datos generales;
- cotización y comportamiento histórico;
- estados financieros y evolución;
- ratios y múltiplos con definición;
- indicadores técnicos como medidas históricas;
- noticias ordenadas por fecha y atribuidas;
- lista personal como función de archivo;
- informe descriptivo con el mismo perímetro.

## Estados bloqueados

- precio objetivo y potencial alcista o bajista;
- consenso de compra, venta o mantenimiento;
- señales, diagnósticos o alertas operativas;
- barata, cara, atractiva, oportunidad o equivalentes;
- puntuación global, ranking o selección por mérito inversor;
- llamada a contratar, contactar o ejecutar;
- cualquier uso comercial o bancario de la lista personal.

## Puertas de publicación

- build de producción correcto;
- ausencia de expresiones y componentes bloqueados;
- fuentes y límites visibles;
- revisión estructural de Dashboard, Resumen, Fundamental, Técnico, Noticias e Informe;
- despliegue únicamente por GitHub Pages mediante el flujo oficial del repositorio.

## Revisión visual de 25 de agosto de 2026

- Se compactan los KPI sin alterar valores, fórmulas, orden ni significado.
- El fondo blanco y los acentos cromáticos siguen identificando familias visuales, no resultados favorables o desfavorables.
- Los gráficos técnicos pasan a blanco sin introducir señales, estados ni llamadas a la acción.
- El lienzo blanco queda separado del cálculo de tamaño del gráfico; RSI y MACD normalizan únicamente valores numéricos finitos antes de dibujarse.
- Los banners de cartera y empresas comparten estructura y jerarquía; el cambio de paleta diferencia secciones y no califica instrumentos.

# Propuesta exacta · dos ETF pendientes de las carteras modelo

> **Actualización posterior:** el fundador autorizó la propuesta con «si» y la
> carga terminó el 03-09-2026 a las 16:30 UTC. Véase el
> [acta de ejecución y verificación](CARGA_ETF_MODELOS_AUTORIZADA_20260903.md).
> El resto de este documento conserva la comprobación previa, no el estado actual.

Fecha: 03-09-2026. Estado: identidad, precios y simulación comprobados; **sin
alta en el universo, escritura en la base, cambio de pesos ni publicación**.

## Resultado

EODHD resuelve sin ambigüedad las dos identidades en la cotización de Ámsterdam:

| ISIN | Símbolo EODHD | Nombre recibido | Tipo | Divisa | Actualización declarada |
|---|---|---|---|---|---|
| IE00B4L5Y983 | IWDA.AS | iShares Core MSCI World UCITS ETF USD (Acc) | ETF | EUR | 01-09-2026 |
| IE00B3XXRP09 | VUSA.AS | Vanguard S&P 500 UCITS ETF | ETF | EUR | 01-09-2026 |

El «USD» del primer nombre forma parte de la denominación/clase del ETF. La
cotización consultada `IWDA.AS` declara EUR; no se ha deducido la divisa por el
nombre. `resolve_ticker` devolvió además el mismo ISIN en ambos casos.

La consulta diaria 03-09-2021–03-09-2026 devolvió para cada instrumento **1.280
cierres**, desde 03-09-2021 hasta 02-09-2026, sin fechas ni `adjusted_close`
inválidos en el resumen comprobado. Esto acredita que el proveedor dispone de
historia suficiente para el uso previsto; todavía no acredita el futuro paquete
ni una escritura correcta en la base.

## Filas propuestas

```csv
IE00B4L5Y983,IWDA.AS,ETF,EQUITY,etf,iShares Core MSCI World UCITS ETF USD (Acc),EUR,si
IE00B3XXRP09,VUSA.AS,ETF,EQUITY,etf,Vanguard S&P 500 UCITS ETF,EUR,si
```

Se usa el grupo canónico `etf` que ya ordena el catálogo; no `etf-global`, que no
figura en el orden actual. La ordenación continúa siendo por grupo y nombre, no
por atractivo. La clase `EQUITY` coincide con el uso ya fijado en las carteras.

`node scripts/check-model-etf-proposal.mjs` añade esas filas únicamente en memoria,
valida su estructura y consulta el catálogo real en modo solo lectura. Sobre ese
catálogo simula las dos altas. Resultado: las cuatro carteras
modelo quedan completas en esa simulación, sin cambiar sus componentes ni pesos.
La prueba de disponibilidad no equivale a recalcular las carteras con datos reales.
El CSV y la base no contienen exactamente las mismas inclusiones: la primera
simulación basada solo en el CSV falló, porque hay componentes ya cargados cuyo
CSV todavía tiene `no`. Por ello la propuesta debe preservar el catálogo real;
no ejecutar una reconstrucción general usando exclusivamente el CSV actual.

Conteo comprobado: **725 filas del CSV, 161 incluidas actualmente** (163 con estas
dos altas virtuales), frente a **698 activos en la base**. Seis componentes de
modelos están cargados pero no incluidos en el CSV: `ES0113900J37`, `ES0113211835`,
`LU0563745743`, `LU1372006947`, `LU1333148903` y `LU1330191542`. No se han cambiado
sus flags. La simulación válida realizó dos consultas de lectura y cero escrituras.
Conciliar todo el universo maestro es una actuación distinta de estas dos altas.

## Revisión interna de la función · 18 preguntas

1. Resuelve la disponibilidad técnica de dos componentes ya fijados en modelos.
2. Recibe ISIN, cotización EUR y precios de EODHD; no los elige el usuario.
3. Valida identidad/divisa y prepara series históricas con el método existente.
4. Mostraría las mismas carteras y cálculos descriptivos que ya existen.
5. Sí, dos instrumentos identificables; revisión interna ámbar registrada.
6. No usa circunstancias personales.
7. No sugiere comprar, vender ni mantener.
8. No opina sobre valor o precio futuro.
9. No puntúa ni ordena por mérito; conserva modelos ya fijados y pesos iguales.
10. No reproduce recomendaciones de terceros.
11. No cambia color, jerarquía ni lenguaje de las carteras.
12. No añade contratación, contacto o ejecución.
13. No hay remuneración, afiliación ni patrocinio.
14. No usa datos, marca, clientes o canales de la entidad representada.
15. No trata ni guarda datos personales.
16. No interviene IA en la web.
17. Fuente EODHD; fechas, `adjusted_close`, EUR y método histórico existentes.
18. Antes de una carga: dry-run exacto, conteos y huellas; después, lectura de los
    dos destinos, cuatro carteras completas, cálculos finitos, interfaz y regresión.

La validación jurídica externa continúa fuera de la alfa. Esta revisión no bloquea
ninguna función ni autoriza la escritura.

## Plan de carga propuesto, después de autorización expresa

1. Añadir solo las dos filas anteriores al CSV, sin alterar las filas actuales.
2. Descargar desde 03-09-2021 precios y ficha ETF de ambos símbolos a la caché
   local ignorada por Git. Revisar ISIN, tipo, moneda, primer/último cierre y huecos.
3. Proyectar localmente los dos activos y sus seis años naturales de series
   (2021 parcial a 2026 parcial). Conservar `adjusted_close`; no convertir divisa.
4. Revisar el desglose ETF que entregue la fuente y que no existan claves prohibidas.
   Las posiciones de fondos son instrumentos, no datos personales; no cargar
   nombres de personas ni datos de usuarios.
5. Preparar un dry-run incremental de **creación** para `assets/{ISIN}`, sus series anuales y,
   si cumple contrato, su desglose. Actualizar catálogo y manifiesto sin borrar ni
   reescribir los 698 activos existentes. No usar `todo` ni `publicar` con una
   generación de solo dos activos: el pipeline general no es una operación de alta
   incremental y podría sustituir el catálogo completo por el subconjunto local.
6. Presentar el inventario de destinos y conteos. Ejecutar la escritura solo con
   autorización expresa para esta carga.
7. Leer de nuevo los dos activos y sus series; esperar catálogo total 700, ETF 10,
   fondos 617 y acciones 73. Comprobar alias anteriores sin cambios.
8. Repetir las cuatro carteras. Las dos hoy incompletas deben pasar a completas
   conservando 25 % por posición; las dos ya completas no deben cambiar.
9. Construir y probar escritorio/tablet. No publicar ni confirmar Git por la misma
   autorización salvo que la orden lo incluya expresamente.

## Alcance de la autorización necesaria

La orden requerida es concreta: incorporar estas dos filas y crear en la base
propia sus activos, precios anuales, posible desglose ETF y el catálogo/manifiesto
resultante. No incluye datos personales, otros instrumentos, cambios de pesos,
Firebase Hosting, Git ni publicación de la web.

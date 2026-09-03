# Universo de la alfa · cómo rellenar `universo-alfa.csv`

Esta carpeta (`universo/`) está **fuera de `data/`** a propósito:
`scripts/build-site.mjs` copia `data/` entera a `dist/` y la lista de la alfa no
debe publicarse en la web. El catálogo que ve el usuario procede de la base propia
y se consulta en modo de lectura, sin cuentas de usuario.

Una línea por instrumento. Columnas:

- `asset_id`: ISIN (es el identificador en la base y en las carteras guardadas).
- `eodhd_symbol`: símbolo de EODHD. Fondos europeos: `ISIN.EUFUND`. ETF: ticker y bolsa en EUR (`IWDA.AS` Ámsterdam, `XXXX.XETRA` Fráncfort, `XXXX.MI` Milán). Acciones: `TEF.MC` (Madrid), `.PA` (París), `.XETRA`, `.MI`, `.AS`. Si está vacío, el script `descargar` propone un candidato con `/api/search/{isin}` y no publica la línea hasta que se fije aquí.
- `instrument_type`: `FUND`, `ETF` o `STOCK`.
- `clase`: `EQUITY`, `FIXED_INCOME`, `MIXED`, `MONEY_MARKET` u `OTHER`. **Obligatoria para fondos**: EODHD no devuelve ficha de fondos europeos (comprobado el 02-09-2026 con dos fondos, `docs/fixtures/eodhd/muestra-fondo*.json`), así que la clase la pone esta lista. Para ETF y acciones el pipeline la deduce de EODHD, pero si se rellena aquí manda la lista.
- `grupo`: etiqueta interna para ordenar el catálogo (`referencia-bolsa`, `fondos-bolsa`, `fondos-bonos`, `fondos-mixtos`, `fondos-monetarios`, `fondos-otros`, `etf`, `acciones`). No se muestra como recomendación ni como ranking.
- `nombre`: nombre comercial. Para fondos es el que verá el usuario (EODHD puede no devolverlo); para ETF y acciones se usa si EODHD no trae nombre.
- `divisa`: divisa de cotización o valoración declarada; en la alfa **siempre `EUR`**. Viene del filtro con el que se construyó la lista y es una declaración, no una comprobación: el script `descargar` la contrasta con EODHD (`General.CurrencyCode` de la ficha en ETF y acciones; `/api/search/{isin}` en fondos) y deja fuera, con aviso, cualquier instrumento cuya divisa real no coincida.
- `incluir`: `si` o `no`. Con `no` la línea se conserva pero no se descarga ni se publica.

Reglas: todo en euros; los cuatro primeros son obligatorios (referencia del
laboratorio); sin columnas de rating, estrellas ni «mejores». Por decisión del
fundador, el universo operativo contiene ahora 727 instrumentos marcados con `si`:
los 725 de la lista completa y los dos ETF incorporados después para las carteras
modelo. La base contiene 700 instrumentos publicados tras aplicar los controles
automáticos de disponibilidad y calidad.

Formato del fichero: UTF-8, separador coma, saltos de línea `\r\n` o `\n` (el lector del pipeline acepta ambos y tolera BOM). Un nombre con coma debe ir entre comillas dobles.

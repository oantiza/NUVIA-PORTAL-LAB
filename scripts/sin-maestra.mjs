/**
 * Regresión «sin maestra» (Entrega 2b, alfa con base propia): las cadenas que
 * no pueden aparecer en el código publicado. Lista única, importada por
 * check-lenguaje.mjs (árbol de trabajo) y check-static-site.mjs (dist/).
 * Este fichero es el único sitio donde se escriben.
 */
export const CADENAS_SIN_MAESTRA = [
  ['bbdd-activos-financieros', 'la base profesional del fundador no se toca ni se nombra en el código'],
  ['nuvia-market-data', 'proyecto de sincronización antiguo: no se lee'],
  ['cloudfunctions.net', 'la alfa no usa funciones en la nube'],
  ['AIzaSyBTidBD5AIs_7RMkV8qhsQNbnhwD_U3NCg', 'apiKey del proyecto anterior'],
  ['identitytoolkit.googleapis.com', 'la alfa no tiene cuentas ni sesión'],
  ['securetoken.googleapis.com', 'la alfa no renueva tokens de sesión'],
];

/** Clave de EODHD pegada: `api_token=` seguido de algo que no sea una interpolación. */
export const PATRON_CLAVE_EODHD = /api_token=(?!\$\{)/;

/** Ficheros que declaran la lista y no deben contarse. */
export const FICHEROS_DE_LA_LISTA = ['scripts/sin-maestra.mjs'];

/**
 * MARAM Psicología — Recepción de leads en Google Sheets
 * ======================================================
 *
 * Pega este archivo entero en Extensiones → Apps Script de tu hoja de cálculo,
 * cambia el TOKEN de abajo y publícalo como aplicación web.
 * Los pasos exactos están en el README del proyecto, sección 3, opción B.
 *
 * No hace falta crear las columnas a mano: la primera vez que llegue un lead
 * se crean solas, con su cabecera, el formato de fecha y de importe, y un
 * desplegable en la columna Estado.
 */

/** Debe coincidir con la variable LEAD_WEBHOOK_TOKEN de Vercel.
 *  Pon cualquier texto largo y difícil de adivinar. Si lo dejas vacío,
 *  cualquiera que descubra la URL podría escribir en tu hoja. */
const TOKEN = 'CAMBIA-ESTO-POR-UN-TEXTO-SECRETO';

/** Pestaña donde se escriben los leads. Se crea si no existe. */
const NOMBRE_HOJA = 'Leads';

/**
 * Columnas de la hoja.
 *   clave  → el dato que envía la web ('' = columna que rellenáis vosotras)
 *   titulo → el encabezado que se ve en la hoja
 *   ancho  → opcional, en píxeles
 */
const COLUMNAS = [
  { clave: 'recibido',     titulo: 'Fecha',              ancho: 150 },
  { clave: 'nombre',       titulo: 'Nombre',             ancho: 160 },
  { clave: 'telefonoNacional', titulo: 'Teléfono',       ancho: 130 },
  { clave: 'motivo',       titulo: 'Motivo de consulta', ancho: 420 },
  { clave: 'utm_source',   titulo: 'utm_source',         ancho: 110 },
  { clave: 'utm_campaign', titulo: 'utm_campaign',       ancho: 140 },
  { clave: 'utm_content',  titulo: 'utm_content',        ancho: 120 },
  { clave: '',             titulo: 'Estado',             ancho: 130 },
  { clave: '',             titulo: 'Importe',            ancho: 100 },
  { clave: '',             titulo: 'Notas',              ancho: 300 }
];

/** Opciones del desplegable de la columna Estado. La primera es la que se
 *  pone sola en cada lead nuevo. */
const ESTADOS = [
  'Nuevo',
  'Contactado',
  'Cita agendada',
  'En proceso',
  'No contesta',
  'No interesa'
];

/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'sin cuerpo en la petición' });
    }

    const datos = JSON.parse(e.postData.contents);

    if (TOKEN && datos.token !== TOKEN) {
      return responder({ ok: false, error: 'token no válido' });
    }

    const hoja = obtenerHoja();
    const fila = COLUMNAS.map(function (col) {
      if (!col.clave) return col.titulo === 'Estado' ? ESTADOS[0] : '';
      return valor(col.clave, datos[col.clave]);
    });

    hoja.appendRow(fila);
    return responder({ ok: true, fila: hoja.getLastRow() });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/** Abrir la URL en el navegador sirve para comprobar que está publicada. */
function doGet() {
  return responder({ ok: true, mensaje: 'Conexión con MARAM lista. Esperando leads.' });
}

/* ------------------------------------------------------------------ */

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) hoja = libro.insertSheet(NOMBRE_HOJA);

  if (hoja.getLastRow() === 0) prepararHoja(hoja);
  return hoja;
}

function prepararHoja(hoja) {
  const titulos = COLUMNAS.map(function (c) { return c.titulo; });

  hoja.appendRow(titulos);
  hoja.getRange(1, 1, 1, titulos.length).setFontWeight('bold');
  hoja.setFrozenRows(1);

  COLUMNAS.forEach(function (col, i) {
    if (col.ancho) hoja.setColumnWidth(i + 1, col.ancho);
  });

  const indice = function (titulo) {
    return COLUMNAS.findIndex(function (c) { return c.titulo === titulo; }) + 1;
  };
  const filas = hoja.getMaxRows() - 1;

  hoja.getRange(2, indice('Fecha'), filas, 1).setNumberFormat('dd/MM/yyyy H:mm');
  hoja.getRange(2, indice('Importe'), filas, 1).setNumberFormat('#,##0.00\\ "€"');
  hoja.getRange(2, indice('Motivo de consulta'), filas, 1).setWrap(true);
  hoja.getRange(2, indice('Notas'), filas, 1).setWrap(true);

  hoja.getRange(2, indice('Estado'), filas, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build()
  );
}

/** La fecha entra como fecha real, para poder ordenar y filtrar por ella. */
function valor(clave, bruto) {
  if (bruto === undefined || bruto === null || bruto === '') return '';

  if (clave === 'recibido') {
    const fecha = new Date(bruto);
    if (!isNaN(fecha.getTime())) return fecha;
  }

  // Un texto que empiece por = + - @ lo interpretaría la hoja como fórmula.
  // El motivo lo escribe quien rellena el formulario y los utm vienen de la
  // URL del anuncio, así que conviene neutralizarlos. El teléfono llega en
  // formato nacional, sin prefijo, y no entra por aquí.
  const texto = String(bruto);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * MARAM — recepción de leads en Google Sheets.
 *
 * Pegar en Extensiones → Apps Script y publicar como aplicación web con acceso
 * para cualquier usuario. Las columnas se crean solas con el primer lead.
 */

/** Pestaña de destino. Se crea si no existe. */
const NOMBRE_HOJA = 'Leads';

/** clave: dato que envía la web ('' = columna manual). */
const COLUMNAS = [
  { clave: 'recibido',         titulo: 'Fecha',              ancho: 150 },
  { clave: 'nombre',           titulo: 'Nombre',             ancho: 160 },
  { clave: 'telefonoNacional', titulo: 'Teléfono',           ancho: 130 },
  { clave: 'motivo',           titulo: 'Motivo de consulta', ancho: 420 },
  { clave: 'utm_source',       titulo: 'utm_source',         ancho: 110 },
  { clave: 'utm_campaign',     titulo: 'utm_campaign',       ancho: 140 },
  { clave: 'utm_content',      titulo: 'utm_content',        ancho: 120 },
  { clave: '',                 titulo: 'Estado',             ancho: 130 },
  { clave: '',                 titulo: 'Importe',            ancho: 100 },
  { clave: '',                 titulo: 'Notas',              ancho: 300 }
];

/** La primera opción se pone sola en cada lead. */
const ESTADOS = [
  'Nuevo',
  'Contactado',
  'Cita agendada',
  'En proceso',
  'No contesta',
  'No interesa'
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'sin cuerpo en la petición' });
    }

    const datos = JSON.parse(e.postData.contents);
    const hoja = obtenerHoja();

    hoja.appendRow(COLUMNAS.map(function (col) {
      if (!col.clave) return col.titulo === 'Estado' ? ESTADOS[0] : '';
      return valor(col.clave, datos[col.clave]);
    }));

    return responder({ ok: true, fila: hoja.getLastRow() });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/** Comprobación rápida desde el navegador. */
function doGet() {
  return responder({ ok: true, mensaje: 'Conexión con MARAM lista. Esperando leads.' });
}

/**
 * Elegir esta función arriba y pulsar «Ejecutar»: escribe una fila de prueba.
 * Si aparece, la parte de Google está bien.
 */
function pruebaDeEscritura() {
  const respuesta = doPost({
    postData: {
      contents: JSON.stringify({
        recibido: new Date().toISOString(),
        nombre: 'PRUEBA — puedes borrar esta fila',
        telefonoNacional: '600000000',
        motivo: 'Fila escrita desde el editor de Apps Script.',
        utm_source: 'prueba',
        utm_campaign: 'instalacion',
        utm_content: 'manual'
      })
    }
  });
  Logger.log(respuesta.getContent());
}

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

/** La fecha entra como fecha real para poder ordenar por ella. */
function valor(clave, bruto) {
  if (bruto === undefined || bruto === null || bruto === '') return '';

  if (clave === 'recibido') {
    const fecha = new Date(bruto);
    if (!isNaN(fecha.getTime())) return fecha;
  }

  // La hoja interpretaría como fórmula un texto que empiece por = + - @.
  const texto = String(bruto);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

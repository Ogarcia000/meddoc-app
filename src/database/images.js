import { getDatabase } from './db';
import { generateId } from '../utils/id';
import { saveImagePermanently, deleteImageFile, deleteImageFiles } from '../utils/imageStorage';

function rowToImage(row) {
  return {
    id: row.id,
    recordId: row.record_id,
    uri: row.uri,
    caption: row.caption || '',
    position: row.position,
    createdAt: row.created_at,
  };
}

/**
 * Obtiene todas las imagenes de un registro, ordenadas por posicion.
 */
export async function getImagesByRecordId(recordId) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM images WHERE record_id = ? ORDER BY position ASC;',
    [recordId]
  );
  return rows.map(rowToImage);
}

/**
 * Obtiene todas las imagenes de multiples registros (batch).
 * Retorna un Map<recordId, image[]>.
 */
export async function getImagesByRecordIds(recordIds) {
  if (recordIds.length === 0) return new Map();
  const db = await getDatabase();
  const placeholders = recordIds.map(() => '?').join(',');
  const rows = await db.getAllAsync(
    `SELECT * FROM images WHERE record_id IN (${placeholders}) ORDER BY position ASC;`,
    recordIds
  );
  const map = new Map();
  for (const row of rows) {
    const img = rowToImage(row);
    if (!map.has(img.recordId)) map.set(img.recordId, []);
    map.get(img.recordId).push(img);
  }
  return map;
}

/**
 * Guarda una imagen: copia el archivo a almacenamiento permanente e inserta en DB.
 */
export async function insertImage(recordId, tempUri, caption = '', position = 0) {
  const permanentUri = await saveImagePermanently(tempUri);
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO images (id, record_id, uri, caption, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, recordId, permanentUri, caption || null, position, now]
  );

  return { id, recordId, uri: permanentUri, caption, position, createdAt: now };
}

/**
 * Elimina una imagen de DB y del filesystem.
 */
export async function deleteImageById(imageId) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT uri FROM images WHERE id = ?;', [imageId]);
  if (row) {
    await deleteImageFile(row.uri);
  }
  await db.runAsync('DELETE FROM images WHERE id = ?;', [imageId]);
}

/**
 * Elimina todas las imagenes de un registro (DB + archivos).
 */
export async function deleteImagesByRecordId(recordId) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT uri FROM images WHERE record_id = ?;',
    [recordId]
  );
  await deleteImageFiles(rows.map((r) => r.uri));
  await db.runAsync('DELETE FROM images WHERE record_id = ?;', [recordId]);
}

/**
 * Reordena las posiciones de las imagenes de un registro.
 */
export async function reorderImages(recordId, imageIds) {
  const db = await getDatabase();
  for (let i = 0; i < imageIds.length; i++) {
    await db.runAsync(
      'UPDATE images SET position = ? WHERE id = ? AND record_id = ?;',
      [i, imageIds[i], recordId]
    );
  }
}

/**
 * Actualiza el caption de una imagen.
 */
export async function updateImageCaption(imageId, caption) {
  const db = await getDatabase();
  await db.runAsync('UPDATE images SET caption = ? WHERE id = ?;', [caption || null, imageId]);
}

/**
 * Cuenta imagenes totales.
 */
export async function countImages() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM images;');
  return row?.count ?? 0;
}

import { getDatabase } from './db';
import { generateId } from '../utils/id';

/**
 * Convierte una fila de SQLite al formato de objeto que usa la app.
 */
function rowToRecord(row) {
  let images = [];
  try {
    images = JSON.parse(row.images || '[]');
  } catch {
    images = [];
  }

  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    category: row.category || '',
    description: row.description,
    images,
    createdAt: row.created_at,
  };
}

export async function getAllRecords() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM records ORDER BY date DESC;');
  return rows.map(rowToRecord);
}

export async function getRecordsByPatientId(patientId) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM records WHERE patient_id = ? ORDER BY date DESC;',
    [patientId]
  );
  return rows.map(rowToRecord);
}

export async function insertRecord(data) {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO records (id, patient_id, date, category, description, images, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.patientId,
      data.date,
      data.category || null,
      data.description,
      JSON.stringify(data.images || []),
      now,
    ]
  );

  return { ...data, id, createdAt: now, images: data.images || [] };
}

export async function updateRecordById(id, data) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE records
     SET date = ?, category = ?, description = ?, images = ?
     WHERE id = ?;`,
    [
      data.date,
      data.category || null,
      data.description,
      JSON.stringify(data.images || []),
      id,
    ]
  );
}

export async function deleteRecordById(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM records WHERE id = ?;', [id]);
}

/**
 * Paginacion: obtiene registros de un paciente con LIMIT/OFFSET.
 */
export async function getRecordsPaginated({ patientId, limit = 50, offset = 0 } = {}) {
  const db = await getDatabase();

  const countRow = await db.getFirstAsync(
    'SELECT COUNT(*) as total FROM records WHERE patient_id = ?;',
    [patientId]
  );

  const rows = await db.getAllAsync(
    `SELECT * FROM records WHERE patient_id = ?
     ORDER BY date DESC
     LIMIT ? OFFSET ?;`,
    [patientId, limit, offset]
  );

  return {
    data: rows.map(rowToRecord),
    total: countRow?.total ?? 0,
    hasMore: offset + rows.length < (countRow?.total ?? 0),
  };
}

export async function countRecords() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM records;');
  return row?.count ?? 0;
}

export async function countRecordsByPatientId(patientId) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM records WHERE patient_id = ?;',
    [patientId]
  );
  return row?.count ?? 0;
}

import { getDatabase } from './db';
import { generateId } from '../utils/id';

/**
 * Convierte una fila de SQLite al formato de objeto que usa la app.
 */
function rowToPatient(row) {
  return {
    id: row.id,
    name: row.name,
    internalId: row.internal_id,
    birthDate: row.birth_date || '',
    gender: row.gender || '',
    phone: row.phone || '',
    bloodType: row.blood_type || '',
    allergies: row.allergies || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

export async function getAllPatients() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM patients ORDER BY created_at DESC;'
  );
  return rows.map(rowToPatient);
}

export async function getPatientById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM patients WHERE id = ?;', [id]);
  return row ? rowToPatient(row) : null;
}

export async function insertPatient(data) {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO patients (id, name, internal_id, birth_date, gender, phone, blood_type, allergies, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.name,
      data.internalId,
      data.birthDate || null,
      data.gender || null,
      data.phone || null,
      data.bloodType || null,
      data.allergies || null,
      data.notes || null,
      now,
    ]
  );

  return { ...data, id, createdAt: now };
}

export async function updatePatientById(id, data) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE patients
     SET name = ?, internal_id = ?, birth_date = ?, gender = ?, phone = ?,
         blood_type = ?, allergies = ?, notes = ?
     WHERE id = ?;`,
    [
      data.name,
      data.internalId,
      data.birthDate || null,
      data.gender || null,
      data.phone || null,
      data.bloodType || null,
      data.allergies || null,
      data.notes || null,
      id,
    ]
  );
}

export async function deletePatientById(id) {
  const db = await getDatabase();
  // records se eliminan por ON DELETE CASCADE
  await db.runAsync('DELETE FROM patients WHERE id = ?;', [id]);
}

/**
 * Paginacion: obtiene pacientes con LIMIT/OFFSET.
 * Soporta busqueda y ordenamiento desde SQL.
 */
export async function getPatientsPaginated({ query = '', sortBy = 'name', limit = 50, offset = 0 } = {}) {
  const db = await getDatabase();

  let where = '';
  const params = [];

  if (query) {
    // LIKE con COLLATE NOCASE aprovecha idx_patients_name / idx_patients_internal_id
    where = `WHERE (p.name LIKE ? COLLATE NOCASE OR p.internal_id LIKE ? COLLATE NOCASE)`;
    const q = `%${query}%`;
    params.push(q, q);
  }

  let orderBy;
  if (sortBy === 'recent') orderBy = 'p.created_at DESC';
  else if (sortBy === 'records') orderBy = 'record_count DESC, p.name COLLATE NOCASE ASC';
  else orderBy = 'p.name COLLATE NOCASE ASC';

  const countRow = await db.getFirstAsync(
    `SELECT COUNT(*) as total FROM patients p ${where};`,
    params
  );

  // LEFT JOIN + GROUP BY en vez de subquery correlacionada por fila
  const rows = await db.getAllAsync(
    `SELECT p.*, COALESCE(rc.cnt, 0) as record_count
     FROM patients p
     LEFT JOIN (SELECT patient_id, COUNT(*) as cnt FROM records GROUP BY patient_id) rc
       ON rc.patient_id = p.id
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?;`,
    [...params, limit, offset]
  );

  return {
    data: rows.map((row) => ({ ...rowToPatient(row), _recordCount: row.record_count ?? 0 })),
    total: countRow?.total ?? 0,
    hasMore: offset + rows.length < (countRow?.total ?? 0),
  };
}

export async function countPatients() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM patients;');
  return row?.count ?? 0;
}

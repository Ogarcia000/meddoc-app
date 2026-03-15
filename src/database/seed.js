import { getDatabase } from './db';
import { MOCK_PATIENTS, MOCK_RECORDS } from '../mock/patients';

/**
 * Siembra datos iniciales solo si la tabla patients esta vacia.
 * Se llama una vez al arrancar la app.
 */
export async function seedIfEmpty() {
  const db = await getDatabase();

  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM patients;');
  if (row.count > 0) return false; // ya hay datos

  for (const p of MOCK_PATIENTS) {
    await db.runAsync(
      `INSERT INTO patients (id, name, internal_id, birth_date, gender, phone, blood_type, allergies, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
      [
        p.id,
        p.name,
        p.internalId,
        p.birthDate || null,
        p.gender || null,
        p.phone || null,
        p.bloodType || null,
        p.allergies || null,
        p.notes || null,
      ]
    );
  }

  for (const r of MOCK_RECORDS) {
    await db.runAsync(
      `INSERT INTO records (id, patient_id, date, category, description, images, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'));`,
      [
        r.id,
        r.patientId,
        r.date,
        r.category || null,
        r.description,
        JSON.stringify(r.images || []),
      ]
    );
  }

  return true;
}

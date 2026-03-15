import { getDatabase } from './db';
import { generateId } from '../utils/id';
import { hashPassword, generateSalt } from '../utils/crypto';

function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    specialty: row.specialty || '',
    photoUri: row.photo_uri || '',
    createdAt: row.created_at,
  };
}

export async function getUserByEmail(email) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT * FROM users WHERE email = ? COLLATE NOCASE;',
    [email.trim()]
  );
  return row;
}

export async function createUser({ name, email, password, specialty }) {
  const db = await getDatabase();

  const existing = await getUserByEmail(email);
  if (existing) throw new Error('EMAIL_EXISTS');

  const id = generateId();
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO users (id, name, email, password_hash, salt, specialty, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, name.trim(), email.trim().toLowerCase(), passwordHash, salt, specialty?.trim() || null, now]
  );

  return { id, name: name.trim(), email: email.trim().toLowerCase(), specialty: specialty?.trim() || '', createdAt: now };
}

export async function verifyUser(email, password) {
  const row = await getUserByEmail(email);
  if (!row) return null;

  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) return null;

  return rowToUser(row);
}

export async function updateUser(id, data) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE users SET name = ?, specialty = ? WHERE id = ?;',
    [data.name.trim(), data.specialty?.trim() || null, id]
  );
}

export async function updatePhotoUri(id, photoUri) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE users SET photo_uri = ? WHERE id = ?;',
    [photoUri || null, id]
  );
}

export async function changePassword(id, newPassword) {
  const db = await getDatabase();
  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  await db.runAsync(
    'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?;',
    [passwordHash, salt, id]
  );
}

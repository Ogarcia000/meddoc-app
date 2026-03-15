/**
 * Schema y migraciones de la base de datos SQLite.
 *
 * Cada migración sube la version de DB en 1.
 * Para agregar columnas o tablas en el futuro, agregar una nueva entrada al array.
 */

export const DB_NAME = 'meddoc.db';

export const MIGRATIONS = [
  // v1 — Tablas iniciales
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        internal_id TEXT NOT NULL,
        birth_date TEXT,
        gender TEXT,
        phone TEXT,
        blood_type TEXT,
        allergies TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY NOT NULL,
        patient_id TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT,
        description TEXT NOT NULL,
        images TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_records_patient ON records(patient_id);`,
      `CREATE INDEX IF NOT EXISTS idx_records_date ON records(date DESC);`,
    ],
  },
  // v2 — Tabla de usuarios
  {
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        specialty TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
    ],
  },
  // v3 — Tabla de imagenes dedicada
  {
    version: 3,
    statements: [
      `CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY NOT NULL,
        record_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        caption TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_images_record ON images(record_id, position);`,
    ],
  },
  // v4 — Safety: asegurar que users existe (fix para DBs que saltaron v2)
  {
    version: 4,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        specialty TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
    ],
  },
  // v5 — Foto de perfil del usuario
  {
    version: 5,
    statements: [
      `ALTER TABLE users ADD COLUMN photo_uri TEXT;`,
    ],
  },
  // v6 — Indices de rendimiento
  {
    version: 6,
    statements: [
      // Busqueda por nombre (COLLATE NOCASE para que LIKE sea case-insensitive sin LOWER())
      `CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name COLLATE NOCASE);`,
      // Busqueda por ID interno
      `CREATE INDEX IF NOT EXISTS idx_patients_internal_id ON patients(internal_id COLLATE NOCASE);`,
      // Ordenamiento por fecha de creacion
      `CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);`,
      // Compuesto para paginacion de registros por paciente + fecha
      `DROP INDEX IF EXISTS idx_records_patient;`,
      `CREATE INDEX IF NOT EXISTS idx_records_patient_date ON records(patient_id, date DESC);`,
      // Indice para conteo rapido de registros por paciente
      `CREATE INDEX IF NOT EXISTS idx_records_patient_count ON records(patient_id);`,
    ],
  },
];

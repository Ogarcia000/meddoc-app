import * as SQLite from 'expo-sqlite';
import { DB_NAME, MIGRATIONS } from './schema';

let _db = null;

/**
 * Abre (o reutiliza) la conexión a SQLite y ejecuta las migraciones pendientes.
 */
export async function getDatabase() {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // Habilitar foreign keys y WAL
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  // Obtener version actual
  const result = await _db.getFirstAsync('PRAGMA user_version;');
  let currentVersion = result?.user_version ?? 0;

  // Ejecutar migraciones pendientes
  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      for (const sql of migration.statements) {
        await _db.execAsync(sql);
      }
      await _db.execAsync(`PRAGMA user_version = ${migration.version};`);
      currentVersion = migration.version;
    }
  }

  return _db;
}

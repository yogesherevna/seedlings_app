import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'seedlings-mobile.db';
const DATABASE_VERSION = 2;

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Mobile-local SQLite database. This is local persistence only; Firebase remains
 * the source of truth for remote business data.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync(DATABASE_NAME);
    database.execSync(`PRAGMA journal_mode = WAL;`);
    database.execSync(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    database.execSync(`
      CREATE TABLE IF NOT EXISTS cart_items (
        cart_key TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        selected_weight TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        product_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    database.runSync(
      `INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)`,
      'database_version',
      String(DATABASE_VERSION),
    );
  }
  return database;
}

export function closeDatabaseForTests() {
  if (database) {
    database.closeSync();
    database = null;
  }
}

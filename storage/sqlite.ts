import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'seedlings-mobile.db';
const DATABASE_VERSION = 6;
const WEB_STORAGE_KEY = 'seedlings-mobile-web-storage-v1';

type AppMetaRow = { key: string; value: string };
type ProductCacheRow = { product_id: string; product_json: string; fetched_at: number };
type CustomerCacheRow = { customer_mobile: string; customer_json: string; cached_at: number };
type CartRow = {
  cart_key: string;
  product_id: string;
  selected_weight: string;
  quantity: number;
  product_json: string;
  updated_at: number;
};
type WebStore = {
  app_meta: AppMetaRow[];
  product_cache: ProductCacheRow[];
  cart_items: CartRow[];
  customer_cache: CustomerCacheRow[];
};

const emptyWebStore = (): WebStore => ({ app_meta: [], product_cache: [], cart_items: [], customer_cache: [] });

/**
 * Expo SQLite is used on native platforms. Expo SQLite's web implementation
 * requires SharedArrayBuffer/WASM support that is not available in every Expo
 * web/dev-server environment, so the web build uses localStorage for the same
 * local-only persistence contract. Firebase remains the source of truth.
 */
class WebDatabase {
  private read(): WebStore {
    if (typeof window === 'undefined') return emptyWebStore();
    try {
      const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
      if (!raw) return emptyWebStore();
      const parsed = JSON.parse(raw) as Partial<WebStore>;
      return {
        app_meta: Array.isArray(parsed.app_meta) ? parsed.app_meta : [],
        product_cache: Array.isArray(parsed.product_cache) ? parsed.product_cache : [],
        cart_items: Array.isArray(parsed.cart_items) ? parsed.cart_items : [],
        customer_cache: Array.isArray(parsed.customer_cache) ? parsed.customer_cache : [],
      };
    } catch {
      return emptyWebStore();
    }
  }

  private write(store: WebStore) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(store));
  }

  getFirstSync<T>(sql: string, ...params: unknown[]): T | null {
    const store = this.read();
    if (sql.includes('SELECT value FROM app_meta WHERE key')) {
      return (store.app_meta.find((row) => row.key === String(params[0])) ?? null) as T | null;
    }
    if (sql.includes('SELECT customer_json, cached_at FROM customer_cache WHERE customer_mobile')) {
      const row = store.customer_cache.find((item) => item.customer_mobile === String(params[0]));
      return (row ? { customer_json: row.customer_json, cached_at: row.cached_at } : null) as T | null;
    }
    if (sql.includes('SELECT MAX(fetched_at) AS fetched_at FROM product_cache')) {
      const fetchedAt = store.product_cache.reduce<number | null>(
        (max, row) => (max === null || row.fetched_at > max ? row.fetched_at : max),
        null,
      );
      return { fetched_at: fetchedAt } as T;
    }
    return null;
  }

  getAllSync<T>(sql: string): T[] {
    const store = this.read();
    if (sql.includes('FROM product_cache')) {
      return [...store.product_cache]
        .sort((a, b) => b.fetched_at - a.fetched_at)
        .map((row) => ({ product_json: row.product_json, fetched_at: row.fetched_at })) as T[];
    }
    if (sql.includes('FROM cart_items')) {
      return [...store.cart_items]
        .sort((a, b) => a.updated_at - b.updated_at)
        .map((row) => ({
          cart_key: row.cart_key,
          product_id: row.product_id,
          selected_weight: row.selected_weight,
          quantity: row.quantity,
          product_json: row.product_json,
        })) as T[];
    }
    return [];
  }

  runSync(sql: string, ...params: unknown[]) {
    const store = this.read();

    if (sql.includes('INSERT OR REPLACE INTO app_meta')) {
      const key = String(params[0]);
      const value = String(params[1]);
      const existing = store.app_meta.find((row) => row.key === key);
      if (existing) existing.value = value;
      else store.app_meta.push({ key, value });
      this.write(store);
      return;
    }

    if (sql.includes('DELETE FROM app_meta WHERE key')) {
      const key = String(params[0]);
      store.app_meta = store.app_meta.filter((row) => row.key !== key);
      this.write(store);
      return;
    }

    if (sql.includes('DELETE FROM customer_cache WHERE customer_mobile')) {
      store.customer_cache = store.customer_cache.filter((row) => row.customer_mobile !== String(params[0]));
      this.write(store);
      return;
    }

    if (sql.includes('INSERT OR REPLACE INTO customer_cache')) {
      const [mobile, customerJson, cachedAt] = params;
      const existing = store.customer_cache.find((row) => row.customer_mobile === String(mobile));
      const next = { customer_mobile: String(mobile), customer_json: String(customerJson), cached_at: Number(cachedAt) };
      if (existing) Object.assign(existing, next); else store.customer_cache.push(next);
      this.write(store);
      return;
    }

    if (sql.includes('DELETE FROM product_cache')) {
      store.product_cache = [];
      this.write(store);
      return;
    }

    if (sql.includes('INSERT INTO product_cache')) {
      const [productId, productJson, fetchedAt] = params;
      store.product_cache = store.product_cache.filter((row) => row.product_id !== String(productId));
      store.product_cache.push({
        product_id: String(productId),
        product_json: String(productJson),
        fetched_at: Number(fetchedAt),
      });
      this.write(store);
      return;
    }

    if (sql.includes('DELETE FROM cart_items')) {
      if (sql.includes('WHERE cart_key')) {
        const cartKey = String(params[0]);
        store.cart_items = store.cart_items.filter((row) => row.cart_key !== cartKey);
      } else {
        store.cart_items = [];
      }
      this.write(store);
      return;
    }

    if (sql.includes('INSERT INTO cart_items')) {
      const [cartKey, productId, selectedWeight, quantity, productJson, updatedAt] = params;
      const existing = store.cart_items.find((row) => row.cart_key === String(cartKey));
      const next: CartRow = {
        cart_key: String(cartKey),
        product_id: String(productId),
        selected_weight: String(selectedWeight),
        quantity: Number(quantity),
        product_json: String(productJson),
        updated_at: Number(updatedAt),
      };
      if (existing) Object.assign(existing, next);
      else store.cart_items.push(next);
      this.write(store);
    }
  }

  withTransactionSync(callback: () => void) {
    callback();
  }

  closeSync() {}
}

let database: SQLite.SQLiteDatabase | null = null;
let webDatabase: WebDatabase | null = null;

/**
 * Mobile-local persistence only. Firebase remains the source of truth for
 * remote business data. The web adapter deliberately avoids opening Expo
 * SQLite, preventing SharedArrayBuffer/WASM failures in Expo web dev builds.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (Platform.OS === 'web') {
    if (!webDatabase) webDatabase = new WebDatabase();
    return webDatabase as unknown as SQLite.SQLiteDatabase;
  }

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
      CREATE TABLE IF NOT EXISTS product_cache (
        product_id TEXT PRIMARY KEY NOT NULL,
        product_json TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
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
    database.execSync(`
      CREATE TABLE IF NOT EXISTS customer_cache (
        customer_mobile TEXT PRIMARY KEY NOT NULL,
        customer_json TEXT NOT NULL,
        cached_at INTEGER NOT NULL
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
  webDatabase = null;
}

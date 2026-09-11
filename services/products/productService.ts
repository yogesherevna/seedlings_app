import { collection, getDocs } from 'firebase/firestore';
import { db } from '../core/firebaseClient';
import { getDatabase } from '../../storage/sqlite';

export type Product = {
  id: string;
  name: string;
  sku?: string;
  slug?: string;
  description: string;
  price: number;
  mrp?: number;
  /** Display weight derived only from this salable product's own component. */
  weightGrams?: number;
  defaultWeight: string;
  image: string;
  popular: boolean;
  inStock: boolean;
  category: string;
  mood?: string;
  moods: string[];
  tags: string[];
  imageUrl?: string;
  type: 'single' | 'multiple';
  components: Array<{ productId: string; productName: string; productSku?: string; quantityGrams: number }>;
  oneTimePurchase: boolean;
  subscriptionPurchase: boolean;
  active: boolean;
  sortOrder: number;
  currency: string;
};

type SalesProductDocument = Record<string, unknown>;
const CACHE_TTL_MS = 30 * 60 * 1000;

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function stringValue(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback; }
function formatWeight(grams: number) {
  if (!grams) return '';
  return grams >= 1000 && grams % 1000 === 0 ? `${grams / 1000}Kg` : `${grams}g`;
}
function weightFromProduct(raw: SalesProductDocument) {
  const components = Array.isArray(raw.components) ? raw.components : [];
  const total = components.reduce((sum, component) => {
    const item = (component ?? {}) as Record<string, unknown>;
    return sum + numberValue(item.quantityGrams);
  }, 0);
  return total > 0 ? total : undefined;
}
function productMoods(raw: SalesProductDocument): string[] {
  const values = [
    ...(Array.isArray(raw.moods) ? raw.moods : []),
    ...(raw.mood ? [raw.mood] : []),
  ];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}
function normalize(docId: string, raw: SalesProductDocument): Product {
  const components = Array.isArray(raw.components)
    ? raw.components.map((component) => {
        const item = (component ?? {}) as Record<string, unknown>;
        return {
          productId: stringValue(item.productId),
          productName: stringValue(item.productName),
          ...(item.productSku ? { productSku: stringValue(item.productSku) } : {}),
          quantityGrams: numberValue(item.quantityGrams),
        };
      })
    : [];
  const weightGrams = weightFromProduct(raw);
  const imageUrl = stringValue(raw.imageUrl);
  const mrpValue = numberValue(raw.mrp, 0);
  const type = raw.type === 'multiple' ? 'multiple' : 'single';
  const active = raw.active === true;
  const moods = productMoods(raw);
  return {
    id: docId,
    name: stringValue(raw.name, 'Unnamed Product'),
    ...(raw.sku ? { sku: stringValue(raw.sku) } : {}),
    ...(raw.slug ? { slug: stringValue(raw.slug) } : {}),
    description: stringValue(raw.description ?? raw.shortDescription),
    price: numberValue(raw.sellingPrice),
    ...(mrpValue > 0 ? { mrp: mrpValue } : {}),
    ...(weightGrams ? { weightGrams } : {}),
    defaultWeight: formatWeight(weightGrams) || 'Pack',
    image: imageUrl,
    popular: raw.featured === true,
    inStock: numberValue(raw.packedStockQuantity, 0) > 0,
    category: stringValue(raw.category, type === 'multiple' ? 'Combo' : 'Microgreens'),
    ...(moods[0] ? { mood: moods[0] } : {}),
    moods,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    ...(imageUrl ? { imageUrl } : {}),
    type,
    components,
    oneTimePurchase: raw.oneTimePurchase === true,
    subscriptionPurchase: raw.subscriptionPurchase === true,
    active,
    sortOrder: numberValue(raw.sortOrder, 0),
    currency: stringValue(raw.currency, 'INR'),
  };
}

function readCachedProducts(): Product[] {
  const rows = getDatabase().getAllSync<{ product_json: string }>('SELECT product_json FROM product_cache ORDER BY fetched_at DESC');
  return rows.map((row) => JSON.parse(row.product_json) as Product);
}
function cachedAt(): number | null {
  const row = getDatabase().getFirstSync<{ fetched_at: number }>('SELECT MAX(fetched_at) AS fetched_at FROM product_cache');
  return row?.fetched_at ?? null;
}
function saveProducts(products: Product[]) {
  const database = getDatabase();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM product_cache');
    const now = Date.now();
    for (const product of products) database.runSync('INSERT INTO product_cache (product_id, product_json, fetched_at) VALUES (?, ?, ?)', product.id, JSON.stringify(product), now);
  });
}
async function fetchRemoteProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'salesProducts'));
  return snapshot.docs
    .map((doc) => normalize(doc.id, doc.data() as SalesProductDocument))
    .filter((product) => product.active)
    .sort((a, b) => {
      const featured = Number(b.popular) - Number(a.popular);
      if (featured !== 0) return featured;
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
}

/**
 * Website parity: use cached salable products immediately when available,
 * while callers may explicitly refresh in the background. Firebase remains
 * the only source of product/business data; SQLite is only a cache/offline fallback.
 */
export async function getProducts(options?: { forceRefresh?: boolean }): Promise<{ products: Product[]; fromCache: boolean }> {
  const cached = readCachedProducts();
  const age = cachedAt() === null ? Infinity : Date.now() - Number(cachedAt());
  if (!options?.forceRefresh && cached.length > 0 && age <= CACHE_TTL_MS) return { products: cached, fromCache: true };
  try {
    const products = await fetchRemoteProducts();
    saveProducts(products);
    return { products, fromCache: false };
  } catch (error) {
    if (cached.length > 0) return { products: cached, fromCache: true };
    throw error;
  }
}
export async function refreshProducts() {
  const products = await fetchRemoteProducts();
  saveProducts(products);
  return products;
}
export function getCachedProducts(): Product[] { return readCachedProducts(); }

export function isSubscriptionEligible(product: Product): boolean {
  if (product.active !== true || product.subscriptionPurchase !== true) return false;
  if (product.type === 'multiple') return false;
  if (!Array.isArray(product.components) || product.components.length !== 1) return false;
  const component = product.components[0];
  return Boolean(component?.productId) && Number(component?.quantityGrams) > 0;
}

export function productSlug(product: Product): string {
  const value = product.slug?.trim() || product.name?.trim() || product.id;
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || product.id;
}

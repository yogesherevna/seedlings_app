import { collection, getDocs } from 'firebase/firestore';
import { db } from '../core/firebaseClient';
import { getDatabase } from '../../storage/sqlite';

export type SaleOption = {
  id: string;
  label: string;
  weightGrams?: number;
  price: number;
  mrp?: number;
  inStock: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku?: string;
  slug?: string;
  description: string;
  price: number;
  mrp?: number;
  weights: string[];
  defaultWeight: string;
  image: string;
  popular: boolean;
  inStock: boolean;
  category: string;
  imageUrl?: string;
  type: 'single' | 'multiple';
  components: Array<{ productId: string; productName: string; productSku?: string; quantityGrams: number }>;
  oneTimePurchase: boolean;
  subscriptionPurchase: boolean;
  active: boolean;
  sortOrder: number;
  currency: string;
  saleOptions: SaleOption[];
};

type SalesProductDocument = Record<string, unknown>;

const CACHE_TTL_MS = 30 * 60 * 1000;

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}
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
function familyKey(product: Product) {
  // A single salable product represents one selling option of its production product.
  // Group those options so Product Detail can expose all active weights/prices.
  if (product.type === 'single' && product.components[0]?.productId) {
    return `single:${product.components[0].productId}`;
  }
  return `combo:${product.name.replace(/\s+(?:\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|kgs))$/i, '').trim().toLowerCase()}`;
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
  return {
    id: docId,
    name: stringValue(raw.name, 'Unnamed Product'),
    ...(raw.sku ? { sku: stringValue(raw.sku) } : {}),
    ...(raw.slug ? { slug: stringValue(raw.slug) } : {}),
    description: stringValue(raw.description ?? raw.shortDescription),
    price: numberValue(raw.sellingPrice),
    ...(mrpValue > 0 ? { mrp: mrpValue } : {}),
    weights: weightGrams ? [formatWeight(weightGrams)] : [],
    defaultWeight: formatWeight(weightGrams) || 'Pack',
    image: imageUrl,
    popular: raw.featured === true,
    inStock: numberValue(raw.packedStockQuantity, 0) > 0,
    category: type === 'multiple' ? 'Combo' : 'Microgreens',
    ...(imageUrl ? { imageUrl } : {}),
    type,
    components,
    oneTimePurchase: raw.oneTimePurchase !== false,
    subscriptionPurchase: raw.subscriptionPurchase === true,
    active,
    sortOrder: numberValue(raw.sortOrder, 0),
    currency: stringValue(raw.currency, 'INR'),
    saleOptions: [],
  };
}
function attachSaleOptions(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = familyKey(product);
    const group = groups.get(key) ?? [];
    group.push(product);
    groups.set(key, group);
  }
  for (const product of products) {
    const options = (groups.get(familyKey(product)) ?? [product])
      .map((option) => ({
        id: option.id,
        label: option.defaultWeight,
        ...(option.defaultWeight !== 'Pack' ? { weightGrams: Number(option.defaultWeight.replace(/[^0-9.]/g, '')) * (/Kg$/i.test(option.defaultWeight) ? 1000 : 1) } : {}),
        price: option.price,
        ...(option.mrp ? { mrp: option.mrp } : {}),
        inStock: option.inStock,
      }))
      .sort((a, b) => (a.weightGrams ?? Number.MAX_SAFE_INTEGER) - (b.weightGrams ?? Number.MAX_SAFE_INTEGER));
    product.saleOptions = options;
    product.weights = options.map((option) => option.label).filter((label, index, list) => label !== 'Pack' || index === 0 || !list.includes('Pack'));
  }
  return products;
}

function readCachedProducts(): Product[] {
  const rows = getDatabase().getAllSync<{ product_json: string; fetched_at: number }>('SELECT product_json, fetched_at FROM product_cache ORDER BY fetched_at DESC');
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
    for (const product of products) {
      database.runSync('INSERT INTO product_cache (product_id, product_json, fetched_at) VALUES (?, ?, ?)', product.id, JSON.stringify(product), now);
    }
  });
}
async function fetchRemoteProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'salesProducts'));
  const products = snapshot.docs
    .map((doc) => normalize(doc.id, doc.data() as SalesProductDocument))
    .filter((product) => product.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return attachSaleOptions(products);
}

export async function getProducts(options?: { forceRefresh?: boolean }): Promise<{ products: Product[]; fromCache: boolean }> {
  const cached = readCachedProducts();
  // Firebase is the source of truth whenever it is reachable. SQLite is the offline/stale fallback.
  // This prevents an old cached product from making the catalogue appear larger than Firebase.
  try {
    const products = await fetchRemoteProducts();
    saveProducts(products);
    return { products, fromCache: false };
  } catch (error) {
    if (cached.length > 0) return { products: attachSaleOptions(cached), fromCache: true };
    throw error;
  }
}
export async function refreshProducts() {
  const products = await fetchRemoteProducts();
  saveProducts(products);
  return products;
}
export function getCachedProducts(): Product[] {
  return attachSaleOptions(readCachedProducts());
}
export function getSaleOptionProduct(product: Product, optionId: string): Product {
  if (optionId === product.id) return product;
  const cached = getCachedProducts().find((item) => item.id === optionId);
  if (!cached) return product;
  return cached;
}

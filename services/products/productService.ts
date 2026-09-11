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
};

type SalesProductDocument = {
  id?: unknown;
  name?: unknown;
  sku?: unknown;
  slug?: unknown;
  description?: unknown;
  shortDescription?: unknown;
  imageUrl?: unknown;
  type?: unknown;
  components?: unknown;
  sellingPrice?: unknown;
  mrp?: unknown;
  oneTimePurchase?: unknown;
  subscriptionPurchase?: unknown;
  active?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
  currency?: unknown;
  packedStockQuantity?: unknown;
};

const CACHE_TTL_MS = 30 * 60 * 1000;

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
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

  const totalGrams = components.reduce((sum, item) => sum + item.quantityGrams, 0);
  const weight = totalGrams > 0 ? `${totalGrams >= 1000 && totalGrams % 1000 === 0 ? totalGrams / 1000 : totalGrams}${totalGrams >= 1000 && totalGrams % 1000 === 0 ? 'Kg' : 'g'}` : '';
  const type = raw.type === 'multiple' ? 'multiple' : 'single';
  const packedStockQuantity = numberValue(raw.packedStockQuantity, 0);
  const active = raw.active === true;
  const imageUrl = stringValue(raw.imageUrl);
  const mrpValue = numberValue(raw.mrp, 0);

  return {
    id: docId,
    name: stringValue(raw.name, 'Unnamed Product'),
    ...(raw.sku ? { sku: stringValue(raw.sku) } : {}),
    ...(raw.slug ? { slug: stringValue(raw.slug) } : {}),
    description: stringValue(raw.description ?? raw.shortDescription),
    price: numberValue(raw.sellingPrice),
    ...(mrpValue > 0 ? { mrp: mrpValue } : {}),
    weights: weight ? [weight] : [],
    defaultWeight: weight || 'Pack',
    image: imageUrl,
    popular: raw.featured === true,
    inStock: packedStockQuantity > 0,
    category: type === 'multiple' ? 'Combo' : 'Microgreens',
    ...(imageUrl ? { imageUrl } : {}),
    type,
    components,
    oneTimePurchase: raw.oneTimePurchase !== false,
    subscriptionPurchase: raw.subscriptionPurchase === true,
    active,
    sortOrder: numberValue(raw.sortOrder, 0),
    currency: stringValue(raw.currency, 'INR'),
  };
}

function readCachedProducts(): Product[] {
  const rows = getDatabase().getAllSync<{ product_json: string; fetched_at: number }>(
    'SELECT product_json, fetched_at FROM product_cache ORDER BY fetched_at DESC',
  );
  return rows.map((row) => JSON.parse(row.product_json) as Product);
}

function cachedAt(): number | null {
  const row = getDatabase().getFirstSync<{ fetched_at: number }>(
    'SELECT MAX(fetched_at) AS fetched_at FROM product_cache',
  );
  return row?.fetched_at ?? null;
}

function saveProducts(products: Product[]) {
  const database = getDatabase();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM product_cache');
    const now = Date.now();
    for (const product of products) {
      database.runSync(
        'INSERT INTO product_cache (product_id, product_json, fetched_at) VALUES (?, ?, ?)',
        product.id,
        JSON.stringify(product),
        now,
      );
    }
  });
}

async function fetchRemoteProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'salesProducts'));
  return snapshot.docs
    .map((doc) => normalize(doc.id, doc.data() as SalesProductDocument))
    .filter((product) => product.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getProducts(options?: { forceRefresh?: boolean }): Promise<{ products: Product[]; fromCache: boolean }> {
  const cached = readCachedProducts();
  const timestamp = cachedAt();
  const fresh = timestamp !== null && Date.now() - timestamp < CACHE_TTL_MS;

  if (!options?.forceRefresh && fresh && cached.length > 0) {
    return { products: cached, fromCache: true };
  }

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

export function getCachedProducts(): Product[] {
  return readCachedProducts();
}

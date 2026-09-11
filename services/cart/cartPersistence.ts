import type { Product } from '../products/productService';
import type { PurchaseMode } from './cartService';
import { getDatabase } from '../../storage/sqlite';

export type PersistedCartItem = Product & { quantity: number; selectedWeight: string; purchaseMode: PurchaseMode; subscriptionPlanId?: string };
function cartKey(productId: string) { return productId; }
export function loadCart(): PersistedCartItem[] {
  const rows = getDatabase().getAllSync<{ product_id:string; selected_weight:string; quantity:number; product_json:string }>('SELECT product_id, selected_weight, quantity, product_json FROM cart_items ORDER BY updated_at ASC');
  const byProduct = new Map<string, PersistedCartItem>();
  for (const row of rows) {
    const parsed = JSON.parse(row.product_json) as Product & { purchaseMode?: PurchaseMode; subscriptionPlanId?: string };
    const item: PersistedCartItem = { ...parsed, quantity: Math.max(1, Math.floor(row.quantity)), selectedWeight: parsed.defaultWeight || row.selected_weight || 'Pack', purchaseMode: parsed.purchaseMode === 'subscription' ? 'subscription' : 'one-time', ...(parsed.subscriptionPlanId ? { subscriptionPlanId: parsed.subscriptionPlanId } : {}) };
    const existing = byProduct.get(row.product_id);
    if (existing) existing.quantity += item.quantity;
    else byProduct.set(row.product_id, item);
  }
  const items = [...byProduct.values()];
  // Phase 21 could have stored the same salable product under multiple derived-weight keys.
  // Consolidate those legacy rows once so the Website-parity cart has one row per salable product.
  if (rows.length !== items.length) replaceCart(items);
  return items;
}
export function upsertCartItem(item: PersistedCartItem) {
  getDatabase().runSync(`INSERT INTO cart_items (cart_key, product_id, selected_weight, quantity, product_json, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(cart_key) DO UPDATE SET quantity = excluded.quantity, product_json = excluded.product_json, selected_weight = excluded.selected_weight, updated_at = excluded.updated_at`, cartKey(item.id), item.id, item.selectedWeight, item.quantity, JSON.stringify(item), Date.now());
}
export function removeCartItem(productId: string) { getDatabase().runSync(`DELETE FROM cart_items WHERE cart_key = ?`, cartKey(productId)); }
export function replaceCart(items: PersistedCartItem[]) { const db = getDatabase(); db.withTransactionSync(() => { db.runSync(`DELETE FROM cart_items`); for (const item of items) upsertCartItem(item); }); }
export function clearPersistedCart() { getDatabase().runSync(`DELETE FROM cart_items`); }

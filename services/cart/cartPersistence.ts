import type { Product } from '../products/productService';
import { getDatabase } from '../../storage/sqlite';

export type PersistedCartItem = Product & { quantity: number; selectedWeight: string };
function cartKey(productId: string, selectedWeight: string) { return `${productId}::${selectedWeight}`; }
export function loadCart(): PersistedCartItem[] {
  const rows = getDatabase().getAllSync<{ product_id:string; selected_weight:string; quantity:number; product_json:string }>('SELECT product_id, selected_weight, quantity, product_json FROM cart_items ORDER BY updated_at ASC');
  return rows.map((row) => ({ ...(JSON.parse(row.product_json) as Product), quantity: row.quantity, selectedWeight: row.selected_weight }));
}
export function upsertCartItem(item: PersistedCartItem) {
  getDatabase().runSync(`INSERT INTO cart_items (cart_key, product_id, selected_weight, quantity, product_json, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(cart_key) DO UPDATE SET quantity = excluded.quantity, product_json = excluded.product_json, updated_at = excluded.updated_at`, cartKey(item.id, item.selectedWeight), item.id, item.selectedWeight, item.quantity, JSON.stringify(item), Date.now());
}
export function removeCartItem(productId: string, selectedWeight: string) { getDatabase().runSync(`DELETE FROM cart_items WHERE cart_key = ?`, cartKey(productId, selectedWeight)); }
export function replaceCart(items: PersistedCartItem[]) { const db = getDatabase(); db.withTransactionSync(() => { db.runSync(`DELETE FROM cart_items`); for (const item of items) upsertCartItem(item); }); }
export function clearPersistedCart() { getDatabase().runSync(`DELETE FROM cart_items`); }

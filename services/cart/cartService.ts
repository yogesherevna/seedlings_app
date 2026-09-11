import type { Product } from '../products/productService';

export type PurchaseMode = 'one-time' | 'subscription';
export type CartItem = Product & {
  quantity: number;
  /** Kept only as the salable product's own display weight; it is not a variant selector. */
  selectedWeight: string;
  purchaseMode: PurchaseMode;
  subscriptionPlanId?: string;
};

export type CartTotals = {
  mrpSubtotal: number;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
};

/** Website parity: delivery is calculated during checkout/order creation, not in Cart. */
export function getCartTotals(items: CartItem[]): CartTotals {
  const mrpSubtotal = items.reduce((sum, item) => sum + (item.mrp && item.mrp > 0 ? item.mrp : item.price) * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = Math.max(0, mrpSubtotal - subtotal);
  return { mrpSubtotal, subtotal, savings, delivery: 0, total: subtotal };
}

export function findCartItem(items: CartItem[], productId: string) { return items.find((item) => item.id === productId); }
export function cartItemKey(item: Pick<CartItem, 'id'>) { return item.id; }

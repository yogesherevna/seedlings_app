import type { Product } from '../products/productService';

export type CartItem = Product & {
  quantity: number;
  selectedWeight: string;
};

export type SubscriptionCartItem = CartItem & {
  planId: string;
  planName: string;
  frequency?: string;
  deliveriesPerTerm?: number;
  deliveryChargeMode?: string;
  deliveryCharge?: number;
  startDate: string;
};

export type UnifiedCart = {
  oneTimeItems: CartItem[];
  subscriptionItems: SubscriptionCartItem[];
};

export type CartTotals = {
  mrpSubtotal: number;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
};

export function getUnifiedCartTotals(cart: UnifiedCart): CartTotals {
  const items = [...cart.oneTimeItems, ...cart.subscriptionItems];
  const mrpSubtotal = items.reduce((sum, item) => sum + (item.mrp && item.mrp > 0 ? item.mrp : item.price) * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = Math.max(0, mrpSubtotal - subtotal);
  return { mrpSubtotal, subtotal, savings, delivery: 0, total: subtotal };
}

export function getCartTotals(items: CartItem[]): CartTotals {
  return getUnifiedCartTotals({ oneTimeItems: items, subscriptionItems: [] });
}

export function findCartItem(items: CartItem[], productId: string) { return items.find((item) => item.id === productId); }

export function cartItemKey(item: Pick<CartItem, 'id'>) { return item.id; }

export function subscriptionCartItemKey(item: Pick<SubscriptionCartItem, 'id' | 'planId' | 'startDate'>) {
  return `subscription:${item.id}:${item.planId}:${item.startDate}`;
}

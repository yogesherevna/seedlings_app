import type { Product } from '../products/productService';

export type CartItem = Product & {
  quantity: number;
  selectedWeight: string;
};

export type CartTotals = {
  mrpSubtotal: number;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
};

export function getCartTotals(items: CartItem[]): CartTotals {
  const mrpSubtotal = items.reduce(
    (sum, item) => sum + (item.mrp && item.mrp > 0 ? item.mrp : item.price) * item.quantity,
    0,
  );
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = Math.max(0, mrpSubtotal - subtotal);
  const delivery = items.length > 0 ? 40 : 0;

  return {
    mrpSubtotal,
    subtotal,
    savings,
    delivery,
    total: subtotal + delivery,
  };
}

export function findCartItem(items: CartItem[], productId: string, weight?: string) {
  return items.find(
    (item) => item.id === productId && (weight ? item.selectedWeight === weight : true),
  );
}

export function cartItemKey(item: Pick<CartItem, 'id' | 'selectedWeight'>) {
  return `${item.id}::${item.selectedWeight}`;
}

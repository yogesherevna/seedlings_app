import { create } from 'zustand';
import type { Product } from '../data/products';
import {
  clearPersistedCart,
  loadCart,
  removeCartItem,
  upsertCartItem,
} from '../services/cart/cartPersistence';

type CartItem = Product & { quantity: number; selectedWeight: string };

type State = {
  mobile: string;
  authenticated: boolean;
  cart: CartItem[];
  cartHydrated: boolean;
  setMobile: (mobile: string) => void;
  login: () => void;
  logout: () => void;
  hydrateCart: () => void;
  addToCart: (product: Product, weight?: string) => void;
  removeFromCart: (id: string, weight?: string) => void;
  changeQuantity: (id: string, delta: number, weight?: string) => void;
  clearCart: () => void;
};

export const useAppStore = create<State>((set, get) => ({
  mobile: '',
  authenticated: false,
  cart: [],
  cartHydrated: false,
  setMobile: (mobile) => set({ mobile }),
  login: () => set({ authenticated: true }),
  logout: () => {
    clearPersistedCart();
    set({ authenticated: false, cart: [] });
  },
  hydrateCart: () => {
    try {
      set({ cart: loadCart(), cartHydrated: true });
    } catch {
      // Keep the app usable if local storage is temporarily unavailable.
      set({ cart: [], cartHydrated: true });
    }
  },
  addToCart: (product, weight) => {
    const selectedWeight = weight ?? product.defaultWeight;
    const existing = get().cart.find(
      (item) => item.id === product.id && item.selectedWeight === selectedWeight,
    );

    if (existing) {
      const updated = get().cart.map((item) =>
        item.id === product.id && item.selectedWeight === selectedWeight
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
      set({ cart: updated });
      const next = updated.find(
        (item) => item.id === product.id && item.selectedWeight === selectedWeight,
      );
      if (next) upsertCartItem(next);
      return;
    }

    const item: CartItem = { ...product, quantity: 1, selectedWeight };
    set((state) => ({ cart: [...state.cart, item] }));
    upsertCartItem(item);
  },
  removeFromCart: (id, weight) => {
    const existing = get().cart.find(
      (item) => item.id === id && (weight ? item.selectedWeight === weight : true),
    );
    if (!existing) return;
    set((state) => ({
      cart: state.cart.filter(
        (item) => !(item.id === id && item.selectedWeight === existing.selectedWeight),
      ),
    }));
    removeCartItem(id, existing.selectedWeight);
  },
  changeQuantity: (id, delta, weight) => {
    const existing = get().cart.find(
      (item) => item.id === id && (weight ? item.selectedWeight === weight : true),
    );
    if (!existing) return;

    const nextQuantity = Math.max(1, existing.quantity + delta);
    const updated = get().cart.map((item) =>
      item.id === id && item.selectedWeight === existing.selectedWeight
        ? { ...item, quantity: nextQuantity }
        : item,
    );
    set({ cart: updated });
    const next = updated.find(
      (item) => item.id === id && item.selectedWeight === existing.selectedWeight,
    );
    if (next) upsertCartItem(next);
  },
  clearCart: () => {
    clearPersistedCart();
    set({ cart: [] });
  },
}));

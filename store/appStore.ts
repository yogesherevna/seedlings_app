import { create } from 'zustand';
import { logoutCustomer, persistCustomerSession, restoreCustomerSession } from '../services/auth/customerSession';
import type { Product } from '../services/products/productService';
import {
  clearPersistedCart,
  loadCart,
  removeCartItem,
  upsertCartItem,
} from '../services/cart/cartPersistence';
import type { CartItem, PurchaseMode } from '../services/cart/cartService';

type State = {
  mobile: string;
  authenticated: boolean;
  cart: CartItem[];
  cartHydrated: boolean;
  sessionHydrated: boolean;
  setMobile: (mobile: string) => void;
  login: (mobile?: string) => void;
  logout: () => Promise<void>;
  hydrateCart: () => void;
  hydrateSession: () => Promise<void>;
  addToCart: (product: Product, weight?: string) => void;
  removeFromCart: (id: string, weight?: string) => void;
  changeQuantity: (id: string, delta: number, weight?: string) => void;
  clearCart: () => void;
  refreshCartProducts: (products: Product[]) => void;
  setCartPurchaseMode: (productId: string, mode: PurchaseMode) => void;
  setCartSubscriptionPlan: (productId: string, planId: string) => void;
};

export const useAppStore = create<State>((set, get) => ({
  mobile: '',
  authenticated: false,
  cart: [],
  cartHydrated: false,
  sessionHydrated: false,
  setMobile: (mobile) => set({ mobile }),
  login: (mobile) => {
    const customerMobile = mobile ?? get().mobile;
    persistCustomerSession(customerMobile);
    set({ mobile: customerMobile, authenticated: true });
  },
  logout: async () => {
    clearPersistedCart();
    try {
      await logoutCustomer();
    } finally {
      set({ mobile: '', authenticated: false, cart: [] });
    }
  },
  hydrateSession: async () => {
    try {
      const mobile = await restoreCustomerSession();
      set({ mobile: mobile ?? '', authenticated: Boolean(mobile), sessionHydrated: true });
    } catch {
      set({ mobile: '', authenticated: false, sessionHydrated: true });
    }
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
    const existing = get().cart.find((item) => item.id === product.id);
    if (existing) {
      const updated = get().cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      set({ cart: updated });
      const next = updated.find((item) => item.id === product.id);
      if (next) upsertCartItem(next);
      return;
    }
    const item: CartItem = { ...product, quantity: 1, selectedWeight, purchaseMode: 'one-time' };
    set((state) => ({ cart: [...state.cart, item] }));
    upsertCartItem(item);
  },
  removeFromCart: (id) => {
    const existing = get().cart.find((item) => item.id === id);
    if (!existing) return;
    set((state) => ({ cart: state.cart.filter((item) => item.id !== id) }));
    removeCartItem(id);
  },
  changeQuantity: (id, delta) => {
    const existing = get().cart.find((item) => item.id === id);
    if (!existing) return;
    const nextQuantity = Math.max(1, existing.quantity + delta);
    const updated = get().cart.map((item) => item.id === id ? { ...item, quantity: nextQuantity } : item);
    set({ cart: updated });
    const next = updated.find((item) => item.id === id);
    if (next) upsertCartItem(next);
  },
  refreshCartProducts: (products) => {
    const byId = new Map(products.map((product) => [product.id, product]));
    const updated = get().cart.map((item) => {
      const product = byId.get(item.id);
      return product ? { ...product, quantity: item.quantity, selectedWeight: product.defaultWeight, purchaseMode: item.purchaseMode, ...(item.subscriptionPlanId ? { subscriptionPlanId: item.subscriptionPlanId } : {}) } : item;
    });
    set({ cart: updated });
    for (const item of updated) upsertCartItem(item);
  },
  setCartPurchaseMode: (productId, mode) => {
    const updated = get().cart.map((item) => item.id === productId ? { ...item, purchaseMode: mode, ...(mode === 'one-time' ? { subscriptionPlanId: undefined } : {}) } : item);
    set({ cart: updated });
    const item = updated.find((x) => x.id === productId);
    if (item) upsertCartItem(item);
  },
  setCartSubscriptionPlan: (productId, planId) => {
    const updated = get().cart.map((item) => item.id === productId ? { ...item, subscriptionPlanId: planId || undefined } : item);
    set({ cart: updated });
    const item = updated.find((x) => x.id === productId);
    if (item) upsertCartItem(item);
  },
  clearCart: () => {
    clearPersistedCart();
    set({ cart: [] });
  },
}));

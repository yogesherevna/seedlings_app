import { create } from 'zustand';
import { logoutCustomer, persistCustomerSession, restoreCustomerSession } from '../services/auth/customerSession';
import type { Product } from '../services/products/productService';
import {
  clearPersistedCart,
  loadUnifiedCart,
  mergeGuestCartIntoCustomer,
  migrateLegacyCartToScope,
  removeCartItem,
  removeSubscriptionCartItem,
  replaceUnifiedCart,
  upsertCartItem,
  upsertSubscriptionCartItem,
  type CartScope,
} from '../services/cart/cartPersistence';
import type { CartItem, SubscriptionCartItem, UnifiedCart } from '../services/cart/cartService';

const guestScope: CartScope = { kind: 'guest' };

const customerScope = (mobile: string): CartScope => ({ kind: 'customer', mobile });

const emptyCart = (): UnifiedCart => ({ oneTimeItems: [], subscriptionItems: [] });

const normalizeMobile = (mobile: string) => String(mobile || '').replace(/\D/g, '');

const scopeFor = (state: Pick<State, 'authenticated' | 'mobile'>): CartScope =>
  state.authenticated && normalizeMobile(state.mobile)
    ? customerScope(state.mobile)
    : guestScope;

type State = {
  mobile: string;
  authenticated: boolean;
  cart: CartItem[];
  subscriptionCart: SubscriptionCartItem[];
  cartHydrated: boolean;
  sessionHydrated: boolean;
  setMobile: (mobile: string) => void;
  login: (mobile?: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateCart: () => void;
  hydrateSession: () => Promise<void>;
  addToCart: (product: Product, weight?: string) => void;
  addSubscriptionToCart: (product: Product, plan: { id: string; name?: string; frequency?: string; deliveriesPerTerm?: number; price?: number; deliveryChargeMode?: string; deliveryCharge?: number }, startDate: string, quantity?: number) => void;
  removeFromCart: (id: string, weight?: string) => void;
  removeSubscriptionFromCart: (productId: string, planId: string, startDate: string) => void;
  changeQuantity: (id: string, delta: number, weight?: string) => void;
  changeSubscriptionQuantity: (productId: string, planId: string, startDate: string, delta: number) => void;
  clearCart: () => void;
  refreshCartProducts: (products: Product[]) => void;
};

const applyCart = (set: any, cart: UnifiedCart) => {
  set({ cart: cart.oneTimeItems, subscriptionCart: cart.subscriptionItems, cartHydrated: true });
};

export const useAppStore = create<State>((set, get) => ({
  mobile: '', authenticated: false, cart: [], subscriptionCart: [], cartHydrated: false, sessionHydrated: false,
  setMobile: (mobile) => set({ mobile }),

  login: async (mobile) => {
    const customerMobile = normalizeMobile(mobile ?? get().mobile);
    if (!customerMobile) throw new Error('Invalid customer mobile number.');

    persistCustomerSession(customerMobile);

    // Preserve a pre-Phase-31 local cart exactly once, then merge any guest cart
    // into this account using the same one-time/subscription identity rules.
    migrateLegacyCartToScope(customerScope(customerMobile));
    const merged = mergeGuestCartIntoCustomer(customerMobile);

    set({
      mobile: customerMobile,
      authenticated: true,
      cart: merged.oneTimeItems,
      subscriptionCart: merged.subscriptionItems,
      cartHydrated: true,
    });
  },

  logout: async () => {
    // Do not delete the customer's persisted cart. It remains scoped to that
    // account and will be restored if the same customer logs in again.
    try { await logoutCustomer(); }
    finally { set({ mobile: '', authenticated: false, cart: [], subscriptionCart: [], cartHydrated: true }); }
  },

  hydrateSession: async () => {
    try {
      const mobile = await restoreCustomerSession();
      if (mobile) {
        migrateLegacyCartToScope(customerScope(mobile));
        const merged = mergeGuestCartIntoCustomer(mobile);
        set({ mobile, authenticated: true, sessionHydrated: true, cart: merged.oneTimeItems, subscriptionCart: merged.subscriptionItems, cartHydrated: true });
        return;
      }

      migrateLegacyCartToScope(guestScope);
      const cart = loadUnifiedCart(guestScope);
      set({ mobile: '', authenticated: false, sessionHydrated: true, cart: cart.oneTimeItems, subscriptionCart: cart.subscriptionItems, cartHydrated: true });
    } catch {
      migrateLegacyCartToScope(guestScope);
      const cart = loadUnifiedCart(guestScope);
      set({ mobile: '', authenticated: false, sessionHydrated: true, cart: cart.oneTimeItems, subscriptionCart: cart.subscriptionItems, cartHydrated: true });
    }
  },

  hydrateCart: () => {
    try {
      const cart = loadUnifiedCart(scopeFor(get()));
      applyCart(set, cart);
    } catch { applyCart(set, emptyCart()); }
  },

  addToCart: (product, weight) => {
    const selectedWeight = weight ?? product.defaultWeight;
    const existing = get().cart.find((item) => item.id === product.id);
    const scope = scopeFor(get());
    if (existing) {
      const updated = get().cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      set({ cart: updated });
      const next = updated.find((item) => item.id === product.id); if (next) upsertCartItem(scope, next);
      return;
    }
    const item: CartItem = { ...product, quantity: 1, selectedWeight };
    set((state) => ({ cart: [...state.cart, item] })); upsertCartItem(scope, item);
  },

  addSubscriptionToCart: (product, plan, startDate, quantity = 1) => {
    const planId = String(plan.id);
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const scope = scopeFor(get());
    const existing = get().subscriptionCart.find((item) => item.id === product.id && item.planId === planId && item.startDate === startDate);
    if (existing) {
      const updated = get().subscriptionCart.map((item) => item.id === product.id && item.planId === planId && item.startDate === startDate ? { ...item, quantity: item.quantity + normalizedQuantity } : item);
      set({ subscriptionCart: updated });
      const next = updated.find((item) => item.id === product.id && item.planId === planId && item.startDate === startDate); if (next) upsertSubscriptionCartItem(scope, next);
      return;
    }
    const subscriptionPrice = Number(plan.price ?? product.price ?? 0);
    const item: SubscriptionCartItem = { ...product, quantity: normalizedQuantity, selectedWeight: product.defaultWeight, price: subscriptionPrice, mrp: subscriptionPrice, planId, planName: plan.name || 'Subscription', ...(plan.frequency ? { frequency: plan.frequency } : {}), ...(Number.isFinite(Number(plan.deliveriesPerTerm)) ? { deliveriesPerTerm: Number(plan.deliveriesPerTerm) } : {}), ...(plan.deliveryChargeMode ? { deliveryChargeMode: plan.deliveryChargeMode } : {}), ...(Number.isFinite(Number(plan.deliveryCharge)) ? { deliveryCharge: Number(plan.deliveryCharge) } : {}), startDate };
    set((state) => ({ subscriptionCart: [...state.subscriptionCart, item] })); upsertSubscriptionCartItem(scope, item);
  },

  removeFromCart: (id) => { const scope = scopeFor(get()); set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })); removeCartItem(scope, id); },
  removeSubscriptionFromCart: (productId, planId, startDate) => { const scope = scopeFor(get()); set((state) => ({ subscriptionCart: state.subscriptionCart.filter((item) => !(item.id === productId && item.planId === planId && item.startDate === startDate)) })); removeSubscriptionCartItem(scope, productId, planId, startDate); },

  changeQuantity: (id, delta) => {
    const existing = get().cart.find((item) => item.id === id); if (!existing) return;
    const scope = scopeFor(get());
    const nextQuantity = Math.max(1, existing.quantity + delta); const updated = get().cart.map((item) => item.id === id ? { ...item, quantity: nextQuantity } : item);
    set({ cart: updated }); const next = updated.find((item) => item.id === id); if (next) upsertCartItem(scope, next);
  },

  changeSubscriptionQuantity: (productId, planId, startDate, delta) => {
    const existing = get().subscriptionCart.find((item) => item.id === productId && item.planId === planId && item.startDate === startDate); if (!existing) return;
    const scope = scopeFor(get());
    const nextQuantity = Math.max(1, existing.quantity + delta); const updated = get().subscriptionCart.map((item) => item.id === productId && item.planId === planId && item.startDate === startDate ? { ...item, quantity: nextQuantity } : item);
    set({ subscriptionCart: updated }); const next = updated.find((item) => item.id === productId && item.planId === planId && item.startDate === startDate); if (next) upsertSubscriptionCartItem(scope, next);
  },

  clearCart: () => { clearPersistedCart(scopeFor(get())); set({ cart: [], subscriptionCart: [] }); },

  refreshCartProducts: (products) => {
    const byId = new Map(products.map((product) => [product.id, product]));
    const oneTime = get().cart.map((item) => { const product = byId.get(item.id); return product ? { ...product, quantity: item.quantity, selectedWeight: product.defaultWeight } : item; });
    const subscriptions = get().subscriptionCart.map((item) => { const product = byId.get(item.id); return product ? { ...product, quantity: item.quantity, selectedWeight: product.defaultWeight, price: item.price, mrp: item.mrp, currency: item.currency, imageUrl: item.imageUrl, planId: item.planId, planName: item.planName, ...(item.frequency ? { frequency: item.frequency } : {}), ...(item.deliveriesPerTerm !== undefined ? { deliveriesPerTerm: item.deliveriesPerTerm } : {}), ...(item.deliveryChargeMode ? { deliveryChargeMode: item.deliveryChargeMode } : {}), ...(item.deliveryCharge !== undefined ? { deliveryCharge: item.deliveryCharge } : {}), startDate: item.startDate } : item; });
    const unified = { oneTimeItems: oneTime, subscriptionItems: subscriptions };
    set({ cart: oneTime, subscriptionCart: subscriptions });
    replaceUnifiedCart(scopeFor(get()), unified);
  },
}));

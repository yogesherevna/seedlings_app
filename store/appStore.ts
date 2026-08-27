import { create } from 'zustand';
import type { Product } from '../data/products';

type CartItem = Product & { quantity: number; selectedWeight: string };

type State = {
  mobile: string;
  authenticated: boolean;
  cart: CartItem[];
  setMobile: (mobile: string) => void;
  login: () => void;
  logout: () => void;
  addToCart: (product: Product, weight?: string) => void;
  removeFromCart: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
};

export const useAppStore = create<State>((set) => ({
  mobile: '',
  authenticated: false,
  cart: [],
  setMobile: (mobile) => set({ mobile }),
  login: () => set({ authenticated: true }),
  logout: () => set({ authenticated: false, cart: [] }),
  addToCart: (product, weight) => set((state) => {
    const selectedWeight = weight ?? product.defaultWeight;
    const existing = state.cart.find((item) => item.id === product.id && item.selectedWeight === selectedWeight);
    if (existing) {
      return { cart: state.cart.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item) };
    }
    return { cart: [...state.cart, { ...product, quantity: 1, selectedWeight }] };
  }),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
  changeQuantity: (id, delta) => set((state) => ({
    cart: state.cart.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item),
  })),
  clearCart: () => set({ cart: [] }),
}));

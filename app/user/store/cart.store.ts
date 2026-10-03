import { addCartItem, type AddCartItemBody } from '@/api/cart.api';
import { getApiError } from '@/api/client';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import { create } from 'zustand';

type CartState = {
  itemCount: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string;
  setItemCount: (count: number) => void;
  loadFromApi: () => Promise<void>;
  addItem: (body: AddCartItemBody) => Promise<CartSnapshot>;
};

export const useCartStore = create<CartState>((set, get) => ({
  itemCount: 0,
  status: 'idle',
  error: '',
  setItemCount: (itemCount) => set({ itemCount, status: 'ready', error: '' }),
  loadFromApi: async () => {
    set({ status: 'loading' });
    try {
      const { getCart } = await import('@/api/cart.api');
      const cart = await getCart();
      set({ itemCount: cart.itemCount ?? 0, status: 'ready', error: '' });
    } catch {
      set({ itemCount: 0, status: 'ready', error: '' });
    }
  },
  addItem: async (body) => {
    set({ status: 'loading', error: '' });
    try {
      const cart = await addCartItem(body);
      set({ itemCount: cart.itemCount ?? get().itemCount, status: 'ready', error: '' });
      return cart;
    } catch (err) {
      set({ status: 'error', error: getApiError(err) });
      throw err;
    }
  },
}));

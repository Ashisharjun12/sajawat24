import { create } from "zustand";
import {
  addCartItem,
  applyCartCoupon,
  getCart,
  mergeCart,
  patchCartItem,
  removeCartItem,
  removeCartCoupon,
  setCartLocation,
  setCartDeliveryGeo,
} from "@/api/cart.api";
import { getApiError } from "@/api/api";

const emptyCart = {
  id: null,
  cityId: null,
  pincode: null,
  scheduledAt: null,
  itemCount: 0,
  subtotalPaise: 0,
  discountPaise: 0,
  totalPaise: 0,
  appliedCoupon: null,
  items: [],
};

export const useCartStore = create((set, get) => ({
  open: false,
  cart: emptyCart,
  status: "idle",
  error: "",
  count: 0,

  setOpen: (open) => set({ open }),

  applyCart: (cart) =>
    set({
      cart: cart ?? emptyCart,
      count: cart?.itemCount ?? 0,
      status: "ready",
      error: "",
    }),

  load: async () => {
    set({ status: "loading", error: "" });
    try {
      const cart = await getCart();
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ status: "error", error: getApiError(err) });
      throw err;
    }
  },

  addItem: async (body, options = {}) => {
    const openDrawer = options.openDrawer !== false;
    set({ status: "loading", error: "" });
    try {
      const cart = await addCartItem(body);
      get().applyCart(cart);
      set({ open: openDrawer });
      return cart;
    } catch (err) {
      set({ status: "error", error: getApiError(err) });
      throw err;
    }
  },

  updateItem: async (id, quantity) => {
    try {
      const cart = await patchCartItem(id, { quantity });
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  removeItem: async (id) => {
    try {
      const cart = await removeCartItem(id);
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  setLocation: async (body) => {
    try {
      const cart = await setCartLocation(body);
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  setDeliveryGeo: async (body) => {
    try {
      const cart = await setCartDeliveryGeo(body);
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  merge: async () => {
    try {
      const cart = await mergeCart();
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  applyCoupon: async (code) => {
    try {
      const cart = await applyCartCoupon(code);
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },

  removeCoupon: async () => {
    try {
      const cart = await removeCartCoupon();
      get().applyCart(cart);
      return cart;
    } catch (err) {
      set({ error: getApiError(err) });
      throw err;
    }
  },
}));

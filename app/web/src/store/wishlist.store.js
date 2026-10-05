import { create } from "zustand";
import {
  addWishlistItem,
  getWishlist,
  mergeWishlist,
  removeWishlistItem,
} from "@/api/wishlist.api";
import { getApiError } from "@/api/api";
import { apiItemToRow, localEntryToRow } from "@/lib/wishlist-mapper";
import { loadWishlist, saveWishlist } from "@/lib/wishlist-storage";
import { useAuthStore } from "@/store/auth.store";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

function wishlistLocation() {
  const { city, pincode } = useLocationStore.getState();
  const cityId = city?.id && isBackendCityId(city.id) ? city.id : null;
  const code = pincode?.code?.replace(/\D/g, "").slice(0, 6) || null;
  return { cityId, pincode: code?.length === 6 ? code : null };
}

function isLoggedIn() {
  return Boolean(useAuthStore.getState().accessToken);
}

export const useWishlistStore = create((set, get) => ({
  rows: [],
  hydrated: false,
  status: "idle",
  error: "",

  hydrate: async () => {
    set({ status: "loading", error: "" });
    try {
      if (isLoggedIn()) {
        const location = wishlistLocation();
        if (!location.cityId && !location.pincode) {
          const local = loadWishlist();
          set({ rows: local.map(localEntryToRow), hydrated: true, status: "ready" });
          return;
        }
        const data = await getWishlist(location);
        set({ rows: data.items.map(apiItemToRow), hydrated: true, status: "ready" });
        return;
      }
      const local = loadWishlist();
      set({ rows: local.map(localEntryToRow), hydrated: true, status: "ready" });
    } catch (err) {
      set({ status: "error", error: getApiError(err), hydrated: true });
    }
  },

  refresh: async () => {
    await get().hydrate();
  },

  isWishlisted: (productId) => get().rows.some((row) => row.productId === productId),

  toggle: async (product) => {
    const wasOn = get().isWishlisted(product.id);
    const location = wishlistLocation();

    if (!isLoggedIn()) {
      const existing = loadWishlist();
      const next = wasOn
        ? existing.filter((row) => row.productId !== product.id)
        : [
            ...existing,
            {
              productId: product.id,
              title: product.name ?? product.title,
              imageUrl: product.imageUrl ?? product.images?.[0]?.url ?? null,
              pricePaise: product.pricePaise,
              compareAtPaise: product.compareAtPaise,
              addedAt: Date.now(),
            },
          ];
      saveWishlist(next);
      set({ rows: next.map(localEntryToRow) });
      return !wasOn;
    }

    const prev = get().rows;
    const optimistic = wasOn
      ? prev.filter((row) => row.productId !== product.id)
      : [
          {
            productId: product.id,
            addedAt: Date.now(),
            available: true,
            product: {
              id: product.id,
              name: product.name ?? product.title,
              title: product.name ?? product.title,
              slug: product.slug,
              imageUrl: product.imageUrl ?? null,
              pricePaise: product.pricePaise,
              compareAtPaise: product.compareAtPaise ?? null,
              rating: product.rating ?? null,
              reviewCount: product.reviewCount ?? null,
              instant: product.instant ?? null,
            },
          },
          ...prev,
        ];
    set({ rows: optimistic });

    try {
      const data = wasOn
        ? await removeWishlistItem(product.id, location)
        : await addWishlistItem(product.id, location);
      set({ rows: data.items.map(apiItemToRow), error: "" });
      return !wasOn;
    } catch (err) {
      set({ rows: prev, error: getApiError(err) });
      throw err;
    }
  },

  syncAfterLogin: async () => {
    const local = loadWishlist();
    const productIds = local.map((row) => row.productId);
    const location = wishlistLocation();
    try {
      if (productIds.length > 0 && (location.cityId || location.pincode)) {
        const data = await mergeWishlist(productIds, location);
        set({ rows: data.items.map(apiItemToRow), hydrated: true, status: "ready" });
        saveWishlist([]);
        return;
      }
      if (location.cityId || location.pincode) {
        const data = await getWishlist(location);
        set({ rows: data.items.map(apiItemToRow), hydrated: true, status: "ready" });
      }
      saveWishlist([]);
    } catch {
      await get().hydrate();
    }
  },

  resetForLogout: () => {
    const local = loadWishlist();
    set({ rows: local.map(localEntryToRow), hydrated: true, status: "ready", error: "" });
  },

  removeUnavailable: async (productId) => {
    if (isLoggedIn()) {
      const location = wishlistLocation();
      try {
        const data = await removeWishlistItem(productId, location);
        set({ rows: data.items.map(apiItemToRow) });
      } catch (err) {
        set({ error: getApiError(err) });
      }
      return;
    }
    const existing = loadWishlist();
    const next = existing.filter((row) => row.productId !== productId);
    saveWishlist(next);
    set({ rows: next.map(localEntryToRow) });
  },
}));

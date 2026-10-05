import {
  addWishlistItem,
  getWishlist,
  mergeWishlist,
  removeWishlistItem,
} from '@/api/wishlist.api';
import { getApiError } from '@/api/client';
import { apiItemToRow, localEntryToRow, rowToLocalEntry, type WishlistRow } from '@/lib/wishlist-mapper';
import type { WishlistEntry } from '@/lib/wishlist-storage';
import { loadWishlist, saveWishlist } from '@/lib/wishlist-storage';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useAuthStore } from '@/store/auth.store';
import { useLocationStore } from '@/store/location.store';
import { create } from 'zustand';

type WishlistState = {
  rows: WishlistRow[];
  hydrated: boolean;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  toggle: (
    product: Pick<HomeCatalogProduct, 'id' | 'title' | 'imageUrl' | 'pricePaise' | 'compareAtPaise'>,
  ) => Promise<boolean>;
  syncAfterLogin: () => Promise<void>;
  removeUnavailable: (productId: string) => Promise<void>;
  resetForLogout: () => Promise<void>;
};

function wishlistLocation() {
  const loc = useLocationStore.getState();
  return {
    cityId: loc.serviceCityId(),
    pincode: loc.pincodeCode(),
  };
}

function isLoggedIn() {
  return Boolean(useAuthStore.getState().accessToken);
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  rows: [],
  hydrated: false,
  status: 'idle',
  error: null,

  hydrate: async () => {
    set({ status: 'loading', error: null });
    try {
      if (isLoggedIn()) {
        const location = wishlistLocation();
        if (!location.cityId && !location.pincode) {
          const local = await loadWishlist();
          set({
            rows: local.map(localEntryToRow),
            hydrated: true,
            status: 'ready',
          });
          return;
        }
        const data = await getWishlist(location);
        set({
          rows: data.items.map(apiItemToRow),
          hydrated: true,
          status: 'ready',
        });
        return;
      }
      const local = await loadWishlist();
      set({
        rows: local.map(localEntryToRow),
        hydrated: true,
        status: 'ready',
      });
    } catch (err) {
      set({
        status: 'error',
        error: getApiError(err),
        hydrated: true,
      });
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
      const existing = await loadWishlist();
      const next: WishlistEntry[] = wasOn
        ? existing.filter((row) => row.productId !== product.id)
        : [
            ...existing,
            {
              productId: product.id,
              title: product.title,
              imageUrl: product.imageUrl,
              pricePaise: product.pricePaise,
              compareAtPaise: product.compareAtPaise,
              addedAt: Date.now(),
            },
          ];
      await saveWishlist(next);
      set({ rows: next.map(localEntryToRow) });
      return !wasOn;
    }

    const prev = get().rows;
    const optimistic: WishlistRow = wasOn
      ? prev.filter((row) => row.productId !== product.id)
      : [
          {
            productId: product.id,
            addedAt: Date.now(),
            available: true,
            product: {
              id: product.id,
              title: product.title,
              imageUrl: product.imageUrl,
              pricePaise: product.pricePaise,
              compareAtPaise: product.compareAtPaise ?? null,
              rating: null,
              reviewCount: null,
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
      set({ rows: data.items.map(apiItemToRow), error: null });
      return !wasOn;
    } catch (err) {
      set({ rows: prev, error: getApiError(err) });
      throw err;
    }
  },

  syncAfterLogin: async () => {
    const local = await loadWishlist();
    const productIds = local.map((row) => row.productId);
    const location = wishlistLocation();
    try {
      if (productIds.length > 0 && (location.cityId || location.pincode)) {
        const data = await mergeWishlist(productIds, location);
        set({ rows: data.items.map(apiItemToRow), hydrated: true, status: 'ready' });
        await saveWishlist([]);
        return;
      }
      if (location.cityId || location.pincode) {
        const data = await getWishlist(location);
        set({ rows: data.items.map(apiItemToRow), hydrated: true, status: 'ready' });
      }
      await saveWishlist([]);
    } catch {
      await get().hydrate();
    }
  },

  resetForLogout: async () => {
    const local = await loadWishlist();
    set({ rows: local.map(localEntryToRow), hydrated: true, status: 'ready', error: null });
  },

  removeUnavailable: async (productId: string) => {
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
    const existing = await loadWishlist();
    const next = existing.filter((row) => row.productId !== productId);
    await saveWishlist(next);
    set({ rows: next.map(localEntryToRow) });
  },
}));

/** Badge count — all saved rows. */
export function useWishlistCount() {
  return useWishlistStore((s) => s.rows.length);
}

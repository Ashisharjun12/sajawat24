import * as SecureStore from 'expo-secure-store';

const WISHLIST_KEY = 'sajawat_user_wishlist_v1';

export type WishlistEntry = {
  productId: string;
  title: string;
  imageUrl: string | null;
  pricePaise: number;
  compareAtPaise?: number | null;
  addedAt: number;
};

export async function loadWishlist(): Promise<WishlistEntry[]> {
  const raw = await SecureStore.getItemAsync(WISHLIST_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WishlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWishlist(items: WishlistEntry[]): Promise<void> {
  await SecureStore.setItemAsync(WISHLIST_KEY, JSON.stringify(items));
}

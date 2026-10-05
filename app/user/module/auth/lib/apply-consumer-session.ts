import type { AuthSessionPayload } from '@/lib/auth.types';
import { mergeCart } from '@/api/cart.api';
import { useAuthStore } from '@/store/auth.store';
import { useWishlistStore } from '@/store/wishlist.store';

/**
 * Persist session and merge guest bag + local wishlist into the account (best-effort).
 */
export async function applyConsumerSession(payload: AuthSessionPayload): Promise<void> {
  await useAuthStore.getState().setSession(payload);
  try {
    await mergeCart();
  } catch {
    // bag merge is best-effort after login
  }
  try {
    await useWishlistStore.getState().syncAfterLogin();
  } catch {
    await useWishlistStore.getState().hydrate();
  }
}

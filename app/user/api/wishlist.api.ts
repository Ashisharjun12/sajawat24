import { api, unwrap } from '@/api/client';

export type WishlistUnavailableReason = 'inactive' | 'not_in_city' | 'no_price';

export type WishlistApiProduct = {
  id: string;
  name: string;
  title: string;
  slug: string;
  pricePaise: number;
  compareAtPaise: number | null;
  imageUrl: string | null;
  ratingAvg: string | null;
  reviewCount: number;
  instant?: unknown;
};

export type WishlistApiItem = {
  productId: string;
  addedAt: string;
  available: boolean;
  unavailableReason?: WishlistUnavailableReason;
  product?: WishlistApiProduct;
};

export type WishlistListResponse = {
  items: WishlistApiItem[];
  meta: { total: number; capped?: boolean };
};

function locationParams(cityId?: string | null, pincode?: string | null) {
  const params: Record<string, string> = {};
  if (cityId) params.cityId = cityId;
  if (pincode) params.pincode = pincode;
  return params;
}

export function getWishlist({
  cityId,
  pincode,
}: {
  cityId?: string | null;
  pincode?: string | null;
}): Promise<WishlistListResponse> {
  return api.get('/wishlist', { params: locationParams(cityId, pincode) }).then(unwrap);
}

export function addWishlistItem(
  productId: string,
  location: { cityId?: string | null; pincode?: string | null },
): Promise<WishlistListResponse> {
  return api
    .post('/wishlist/items', { productId }, { params: locationParams(location.cityId, location.pincode) })
    .then(unwrap);
}

export function removeWishlistItem(
  productId: string,
  location: { cityId?: string | null; pincode?: string | null },
): Promise<WishlistListResponse> {
  return api
    .delete(`/wishlist/items/${productId}`, {
      params: locationParams(location.cityId, location.pincode),
    })
    .then(unwrap);
}

export function mergeWishlist(
  productIds: string[],
  location: { cityId?: string | null; pincode?: string | null },
): Promise<WishlistListResponse> {
  return api
    .post('/wishlist/merge', { productIds }, { params: locationParams(location.cityId, location.pincode) })
    .then(unwrap);
}

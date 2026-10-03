import { api, unwrap } from '@/api/client';
import { normalizeCart, type CartSnapshot } from '@/module/booking/lib/cart-types';

export type AddCartItemBody = {
  productId: string;
  quantity?: number;
  addons?: { addonId: string; quantity: number }[];
  pincode?: string;
  cityId?: string;
  scheduledAt?: string | null;
  fulfillmentType?: 'instant' | 'scheduled';
};

export function getCart(): Promise<CartSnapshot> {
  return api.get('/cart').then(unwrap).then(normalizeCart);
}

export function addCartItem(body: AddCartItemBody): Promise<CartSnapshot> {
  return api.post('/cart/items', body).then(unwrap).then(normalizeCart);
}

export function patchCartItem(
  id: string,
  body: { quantity?: number },
): Promise<CartSnapshot> {
  return api.patch(`/cart/items/${id}`, body).then(unwrap).then(normalizeCart);
}

export function removeCartItem(id: string): Promise<CartSnapshot> {
  return api.delete(`/cart/items/${id}`).then(unwrap).then(normalizeCart);
}

export function setCartLocation(body: { cityId: string; pincode: string }) {
  return api.post('/cart/location', body).then(unwrap).then(normalizeCart);
}

export function setCartDeliveryGeo(body: { latitude: number; longitude: number }) {
  return api.post('/cart/delivery-geo', body).then(unwrap).then(normalizeCart);
}

export function mergeCart() {
  return api.post('/cart/merge').then(unwrap).then(normalizeCart);
}

export function applyCartCoupon(code: string) {
  return api.post('/cart/coupon', { code }).then(unwrap).then(normalizeCart);
}

export function removeCartCoupon() {
  return api.delete('/cart/coupon').then(unwrap).then(normalizeCart);
}

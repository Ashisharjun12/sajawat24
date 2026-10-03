import { api, unwrap } from '@/api/client';
import type { AuthUser, VendorProfile } from '@/lib/auth.types';

export type VendorRegisterPayload = {
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  cityId: string;
  shopAddress: string;
  pincode: string;
  shopImageUploadId?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  baseGeoSource?: 'place_pin' | 'geocode_ola' | 'geocode_manual' | 'pincode_centroid' | 'device';
  androidAppHash?: string;
};

export type PresignShopImageResult = {
  uploadId: string;
  uploadUrl: string;
  publicUrl: string;
};

export type CompleteShopImageResult = {
  uploadId: string;
  publicUrl: string;
};

export type VendorReapplyPayload = Omit<VendorRegisterPayload, 'phone' | 'androidAppHash'>;

export function reapplyVendor(payload: VendorReapplyPayload) {
  return api.post('/vendor/reapply', payload).then(unwrap<{ user: AuthUser }>);
}

export function registerVendor(payload: VendorRegisterPayload) {
  return api
    .post('/vendor/register', payload, { timeout: 60_000 })
    .then(unwrap<{ phone: string; otp?: string }>);
}

export function presignShopImage(input: {
  phone: string;
  fileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}) {
  return api
    .post('/vendor/register/presign-shop-image', input, { timeout: 60_000 })
    .then(unwrap<PresignShopImageResult>);
}

export function completeShopImage(uploadId: string) {
  return api
    .post(`/vendor/register/complete-shop-image/${uploadId}`)
    .then(unwrap<CompleteShopImageResult>);
}

export function getDuty() {
  return api.get('/vendor/duty').then(unwrap<VendorProfile>);
}

export function getShopDuty() {
  return api.get('/vendor/shop-duty').then(unwrap<VendorProfile>);
}

export function patchDuty(isOnDuty: boolean) {
  return api
    .patch('/vendor/duty', { isOnDuty })
    .then(unwrap<{ vendor: VendorProfile; user: AuthUser }>);
}

export async function uploadImageFile(uploadUrl: string, uri: string, contentType: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image');
  }
}

/** @deprecated Use uploadImageFile */
export const uploadShopImageFile = uploadImageFile;

export type VendorProfilePatchPayload = {
  name: string;
  email: string;
  avatarUploadId?: string;
};

export function presignProfileAvatar(input: {
  fileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}) {
  return api.post('/vendor/profile/presign-avatar', input).then(unwrap<PresignShopImageResult>);
}

export function completeProfileAvatar(uploadId: string) {
  return api
    .post(`/vendor/profile/complete-avatar/${uploadId}`)
    .then(unwrap<CompleteShopImageResult>);
}

export function patchVendorProfile(payload: VendorProfilePatchPayload) {
  return api.patch('/vendor/profile', payload).then(unwrap<{ user: AuthUser }>);
}

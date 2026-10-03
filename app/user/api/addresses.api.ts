import { api, unwrap } from '@/api/client';

export type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  landmark: string | null;
  pincode: string;
  cityId: string | null;
  cityName: string;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
  geoSource: string | null;
};

export type CreateAddressBody = {
  label: string;
  address: string;
  landmark?: string;
  pincode: string;
  cityId: string;
  cityName?: string;
  setDefault?: boolean;
  latitude: number;
  longitude: number;
  geoSource?: 'geocode_google' | 'geocode_manual' | 'pincode_centroid' | 'device';
};

export type PatchAddressBody = Partial<CreateAddressBody> & {
  landmark?: string | null;
  cityId?: string | null;
};

export function listAddresses() {
  return api.get('/user/addresses').then(unwrap).then((data) => {
    const items = (data as { items?: CustomerAddress[] })?.items;
    return items ?? [];
  });
}

export function createAddress(body: CreateAddressBody) {
  return api.post('/user/addresses', body).then(unwrap).then((data) => {
    return (data as { address: CustomerAddress }).address;
  });
}

export function updateAddress(id: string, body: PatchAddressBody) {
  return api.patch(`/user/addresses/${id}`, body).then(unwrap).then((data) => {
    return (data as { address: CustomerAddress }).address;
  });
}

export function deleteAddress(id: string) {
  return api.delete(`/user/addresses/${id}`).then(unwrap);
}

export function setDefaultAddress(id: string) {
  return api.post(`/user/addresses/${id}/default`).then(unwrap).then((data) => {
    return (data as { address: CustomerAddress }).address;
  });
}

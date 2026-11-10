import { api, unwrap } from '@/api/client';

export type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  landmark: string | null;
  /** Optional on addresses saved before the structured form existed. */
  houseFloor?: string | null;
  buildingBlock?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
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
  houseFloor?: string;
  buildingBlock?: string;
  receiverName?: string;
  /** 10-digit Indian mobile, no +91. */
  receiverPhone?: string;
  pincode: string;
  cityId: string;
  cityName?: string;
  setDefault?: boolean;
  latitude: number;
  longitude: number;
  geoSource?: 'geocode_google' | 'geocode_manual' | 'pincode_centroid' | 'device';
};

/** For PATCH, `null` clears a field and leaving it out keeps the stored value. */
export type PatchAddressBody = Partial<
  Omit<CreateAddressBody, 'landmark' | 'houseFloor' | 'buildingBlock' | 'receiverName' | 'receiverPhone'>
> & {
  landmark?: string | null;
  houseFloor?: string | null;
  buildingBlock?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
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

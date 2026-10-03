import type { CustomerAddress } from '@/api/addresses.api';
import type { CreateAddressBody } from '@/api/addresses.api';

export type AddressFormState = {
  label: string;
  address: string;
  landmark: string;
  pincode: string;
  cityName: string;
  cityId: string | null;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
};

export const emptyAddressForm: AddressFormState = {
  label: '',
  address: '',
  landmark: '',
  pincode: '',
  cityName: '',
  cityId: null,
  isDefault: false,
  latitude: null,
  longitude: null,
};

export function addressFormFromCustomer(addr: CustomerAddress): AddressFormState {
  return {
    label: addr.label,
    address: addr.address,
    landmark: addr.landmark ?? '',
    pincode: addr.pincode,
    cityName: addr.cityName,
    cityId: addr.cityId,
    isDefault: addr.isDefault,
    latitude: addr.latitude,
    longitude: addr.longitude,
  };
}

export function buildCreateAddressBody(form: AddressFormState): CreateAddressBody | null {
  const pin = form.pincode.replace(/\D/g, '').slice(0, 6);
  if (
    !form.cityId ||
    pin.length !== 6 ||
    form.address.trim().length < 6 ||
    form.latitude == null ||
    form.longitude == null
  ) {
    return null;
  }
  return {
    label: form.label.trim() || 'Address',
    address: form.address.trim(),
    landmark: form.landmark.trim() || undefined,
    pincode: pin,
    cityId: form.cityId,
    cityName: form.cityName || undefined,
    setDefault: form.isDefault,
    latitude: form.latitude,
    longitude: form.longitude,
    geoSource: 'geocode_manual',
  };
}

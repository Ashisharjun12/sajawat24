import type { CustomerAddress } from '@/api/addresses.api';
import type { CreateAddressBody } from '@/api/addresses.api';
import { isValidIndianMobile, toLocalPhone } from '@/lib/phone';

export type AddressFormState = {
  label: string;
  /**
   * Street / area line (from the map's reverse geocode). The full address line saved to the
   * server is composed on save: house/floor, building/block, then this.
   */
  address: string;
  /** Bold place name from the map (display only, never saved). */
  areaTitle: string;
  houseFloor: string;
  buildingBlock: string;
  landmark: string;
  receiverName: string;
  /** 10 digits, no +91. */
  receiverPhone: string;
  pincode: string;
  cityName: string;
  cityId: string | null;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
  /**
   * Saved before house/floor existed: its whole line lives in `address`, so house/floor stays
   * optional when editing it.
   */
  isLegacy: boolean;
};

export const emptyAddressForm: AddressFormState = {
  label: '',
  address: '',
  areaTitle: '',
  houseFloor: '',
  buildingBlock: '',
  landmark: '',
  receiverName: '',
  receiverPhone: '',
  pincode: '',
  cityName: '',
  cityId: null,
  isDefault: false,
  latitude: null,
  longitude: null,
  isLegacy: false,
};

/** Saved address line is "<house>, <building>, <street>"; split it back for editing. */
function streetLineOf(addr: CustomerAddress): string {
  const parts = [addr.houseFloor?.trim(), addr.buildingBlock?.trim()].filter(Boolean) as string[];
  if (parts.length === 0) return addr.address;
  const prefix = `${parts.join(', ')}, `;
  return addr.address.startsWith(prefix) ? addr.address.slice(prefix.length) : addr.address;
}

export function addressFormFromCustomer(addr: CustomerAddress): AddressFormState {
  const hasParts = Boolean(addr.houseFloor?.trim() || addr.buildingBlock?.trim());
  return {
    label: addr.label,
    address: streetLineOf(addr),
    areaTitle: '',
    houseFloor: addr.houseFloor ?? '',
    buildingBlock: addr.buildingBlock ?? '',
    landmark: addr.landmark ?? '',
    receiverName: addr.receiverName ?? '',
    receiverPhone: toLocalPhone(addr.receiverPhone ?? ''),
    pincode: addr.pincode,
    cityName: addr.cityName,
    cityId: addr.cityId,
    isDefault: addr.isDefault,
    latitude: addr.latitude,
    longitude: addr.longitude,
    isLegacy: !hasParts,
  };
}

/** The single address line sent to the server (what orders and vendors read). */
export function composeAddressLine(form: AddressFormState): string {
  return [form.houseFloor.trim(), form.buildingBlock.trim(), form.address.trim()]
    .filter(Boolean)
    .join(', ');
}

export function buildCreateAddressBody(form: AddressFormState): CreateAddressBody | null {
  const pin = form.pincode.replace(/\D/g, '').slice(0, 6);
  const line = composeAddressLine(form);
  if (
    !form.cityId ||
    pin.length !== 6 ||
    line.length < 6 ||
    line.length > 500 ||
    form.latitude == null ||
    form.longitude == null
  ) {
    return null;
  }
  const receiverPhone = toLocalPhone(form.receiverPhone);
  return {
    label: form.label.trim() || 'Address',
    address: line,
    landmark: form.landmark.trim() || undefined,
    houseFloor: form.houseFloor.trim() || undefined,
    buildingBlock: form.buildingBlock.trim() || undefined,
    receiverName: form.receiverName.trim().length >= 2 ? form.receiverName.trim() : undefined,
    receiverPhone: isValidIndianMobile(receiverPhone) ? receiverPhone : undefined,
    pincode: pin,
    cityId: form.cityId,
    cityName: form.cityName || undefined,
    setDefault: form.isDefault,
    latitude: form.latitude,
    longitude: form.longitude,
    geoSource: 'geocode_manual',
  };
}

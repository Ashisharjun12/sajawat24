import type { CheckoutCustomerForm, CheckoutDeliveryForm } from '@/module/booking/lib/checkout-form-types';

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isValidIndianMobile(value = '') {
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
}

export function customerFormValid(customer: CheckoutCustomerForm) {
  return (
    customer.name.trim().length > 1 &&
    isValidIndianMobile(customer.phone) &&
    isValidEmail(customer.email)
  );
}

export function deliveryFormValid(delivery: CheckoutDeliveryForm, isInstantCart: boolean) {
  const pin = delivery.pincode.replace(/\D/g, '').slice(0, 6);
  const fieldsOk =
    delivery.pinStatus === 'ok' && delivery.address.trim().length > 5 && Boolean(delivery.cityId);
  const geoOk =
    !isInstantCart ||
    (delivery.latitude != null &&
      delivery.longitude != null &&
      delivery.deliveryGeoConfirmed);
  return fieldsOk && geoOk && pin.length === 6;
}

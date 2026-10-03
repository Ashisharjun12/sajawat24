export type CheckoutCustomerForm = {
  name: string;
  phone: string;
  email: string;
};

export type CheckoutDeliveryForm = {
  pincode: string;
  address: string;
  landmark: string;
  cityName: string;
  cityId: string | null;
  pinStatus: 'idle' | 'ok' | 'error';
  pinMessage: string;
  latitude: number | null;
  longitude: number | null;
  deliveryGeoConfirmed: boolean;
};

export type CheckoutPaymentMethod = '' | 'cod' | 'online';

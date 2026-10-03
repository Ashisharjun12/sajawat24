import type { CustomerAddress } from '@/api/addresses.api';
import type { CustomerUser } from '@/lib/auth.types';
import type { DeliverySnapshot } from '@/lib/delivery-location-storage';
import type {
  CheckoutCustomerForm,
  CheckoutDeliveryForm,
} from '@/module/booking/lib/checkout-form-types';
import { create } from 'zustand';

export const emptyCheckoutDelivery: CheckoutDeliveryForm = {
  pincode: '',
  address: '',
  landmark: '',
  cityName: '',
  cityId: null,
  pinStatus: 'idle',
  pinMessage: '',
  latitude: null,
  longitude: null,
  deliveryGeoConfirmed: false,
};

export function deliveryFromSnapshot(snapshot: DeliverySnapshot): CheckoutDeliveryForm {
  return {
    pincode: snapshot.pincode.replace(/\D/g, '').slice(0, 6),
    address: snapshot.address,
    landmark: snapshot.landmark ?? '',
    cityName: snapshot.cityName,
    cityId: snapshot.cityId,
    pinStatus: 'ok',
    pinMessage: '',
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    deliveryGeoConfirmed: snapshot.latitude != null && snapshot.longitude != null,
  };
}

export function deliveryFromAddress(addr: CustomerAddress): CheckoutDeliveryForm {
  return {
    pincode: addr.pincode.replace(/\D/g, '').slice(0, 6),
    address: addr.address,
    landmark: addr.landmark ?? '',
    cityName: addr.cityName,
    cityId: addr.cityId,
    pinStatus: addr.cityId ? 'ok' : 'error',
    pinMessage: addr.cityId ? '' : 'Address needs a serviceable city',
    latitude: addr.latitude,
    longitude: addr.longitude,
    deliveryGeoConfirmed: addr.latitude != null && addr.longitude != null,
  };
}

type CheckoutState = {
  customer: CheckoutCustomerForm;
  delivery: CheckoutDeliveryForm;
  deliveryLabel: string;
  /** Unpaid online order awaiting gateway completion. */
  pendingOrderId: string | null;
  paymentIncomplete: boolean;
  /** User closed the gateway vs bank/network failure (for payment retry copy). */
  paymentUserCancelled: boolean;
  /** While navigating to booking-confirmed after place order (cart clears). */
  suppressEmptyCartExit: boolean;
  /** Order id just placed — show confirmation hero while detail loads. */
  confirmedOrderId: string | null;
  setPendingOrderId: (orderId: string | null) => void;
  setPaymentIncomplete: (value: boolean) => void;
  setPaymentUserCancelled: (value: boolean) => void;
  clearPendingPayment: () => void;
  setSuppressEmptyCartExit: (value: boolean) => void;
  setConfirmedOrderId: (orderId: string | null) => void;
  setCustomer: (next: CheckoutCustomerForm) => void;
  setDelivery: (next: CheckoutDeliveryForm, label?: string) => void;
  setFromAddress: (addr: CustomerAddress) => void;
  setFromSnapshot: (snapshot: DeliverySnapshot) => void;
  hydrateCustomerFromUser: (user: CustomerUser | null) => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  customer: { name: '', phone: '', email: '' },
  delivery: emptyCheckoutDelivery,
  deliveryLabel: 'Home',
  pendingOrderId: null,
  paymentIncomplete: false,
  paymentUserCancelled: false,
  suppressEmptyCartExit: false,
  confirmedOrderId: null,
  setPendingOrderId: (pendingOrderId) => set({ pendingOrderId }),
  setPaymentIncomplete: (paymentIncomplete) => set({ paymentIncomplete }),
  setPaymentUserCancelled: (paymentUserCancelled) => set({ paymentUserCancelled }),
  clearPendingPayment: () =>
    set({ pendingOrderId: null, paymentIncomplete: false, paymentUserCancelled: false }),
  setSuppressEmptyCartExit: (value) => set({ suppressEmptyCartExit: value }),
  setConfirmedOrderId: (confirmedOrderId) => set({ confirmedOrderId }),

  setCustomer: (customer) => set({ customer }),
  setDelivery: (delivery, label) =>
    set((s) => ({
      delivery,
      deliveryLabel: label ?? s.deliveryLabel,
    })),
  setFromAddress: (addr) =>
    set({
      delivery: deliveryFromAddress(addr),
      deliveryLabel: addr.label || 'Home',
    }),
  setFromSnapshot: (snapshot) =>
    set({
      delivery: deliveryFromSnapshot(snapshot),
      deliveryLabel: snapshot.label || 'Home',
    }),
  hydrateCustomerFromUser: (user) => {
    if (!user) return;
    set((s) => ({
      customer: {
        name: s.customer.name || user.name || '',
        phone: s.customer.phone || user.phone || '',
        email: s.customer.email || user.email || '',
      },
    }));
  },
}));

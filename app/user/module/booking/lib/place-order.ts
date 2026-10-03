import { createOrder, type PublicOrder } from '@/api/orders.api';
import { verifyPayment } from '@/api/payments.api';
import { getApiError } from '@/api/client';
import type { CheckoutCustomerForm, CheckoutDeliveryForm } from '@/module/booking/lib/checkout-form-types';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import type { CheckoutPaymentMethod } from '@/module/booking/lib/checkout-form-types';
import {
  isPaymentCancelledMessage,
  OnlinePaymentIncompleteError,
} from '@/module/booking/lib/payment-flow-errors';
import {
  openOnlineCheckout,
  type OnlineCheckoutPayload,
} from '@/module/booking/lib/online-checkout-native';

export type PlaceOrderInput = {
  customer: CheckoutCustomerForm;
  delivery: CheckoutDeliveryForm;
  payment: CheckoutPaymentMethod;
  cart: CartSnapshot;
  idempotencyKey: string;
};

export type PlaceOrderResult = {
  orderId: string;
  status: PublicOrder['status'];
};

function buildCreatePayload(
  input: Omit<PlaceOrderInput, 'payment' | 'cart'> & {
    payment: 'cod' | 'online';
    cart: CartSnapshot;
  },
) {
  const { customer, delivery, payment, cart, idempotencyKey } = input;

  return {
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.replace(/\D/g, '').slice(-10),
      email: customer.email.trim(),
    },
    delivery: {
      pincode: delivery.pincode.replace(/\D/g, '').slice(0, 6),
      address: delivery.address.trim(),
      landmark: delivery.landmark.trim() || undefined,
      cityId: delivery.cityId!,
      ...(cart.deliveryLatitude != null && cart.deliveryLongitude != null
        ? {
            latitude: cart.deliveryLatitude,
            longitude: cart.deliveryLongitude,
          }
        : delivery.latitude != null && delivery.longitude != null
          ? { latitude: delivery.latitude, longitude: delivery.longitude }
          : {}),
    },
    paymentMethod: payment,
    idempotencyKey,
  };
}

function orderStatus(order: PublicOrder): PublicOrder['status'] {
  return order.status ?? 'CONFIRMED';
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { customer, delivery, payment, cart, idempotencyKey } = input;

  if (!delivery.cityId) {
    throw new Error('Enter a serviceable delivery PIN');
  }
  if (payment !== 'cod' && payment !== 'online') {
    throw new Error('Select a payment method');
  }

  const result = await createOrder(
    buildCreatePayload({ customer, delivery, payment, cart, idempotencyKey }),
  );
  const order = result.order;
  const orderId = order.id;
  const rawCheckout = result.checkout as OnlineCheckoutPayload | undefined;

  if (payment === 'online') {
    if (!rawCheckout) {
      throw new Error('Online checkout session missing');
    }
    const checkout = {
      ...rawCheckout,
      decoryOrderId: orderId,
    } as OnlineCheckoutPayload & { decoryOrderId: string };
    try {
      const verifyPayload = await openOnlineCheckout(checkout, customer);
      const confirmed = await verifyPayment(verifyPayload) as PublicOrder;
      const status = orderStatus(confirmed);
      if (status !== 'CONFIRMED') {
        throw new OnlinePaymentIncompleteError(
          orderId,
          'Payment is still processing. Try again in a moment.',
        );
      }
      return { orderId: confirmed.id ?? orderId, status };
    } catch (err) {
      if (err instanceof OnlinePaymentIncompleteError) throw err;
      const message = getApiError(err);
      const cancelled = isPaymentCancelledMessage(message);
      throw new OnlinePaymentIncompleteError(orderId, message, cancelled);
    }
  }

  const status = orderStatus(order);
  if (status !== 'CONFIRMED') {
    throw new Error('Order was not confirmed. Try again or choose another payment method.');
  }
  return { orderId, status };
}

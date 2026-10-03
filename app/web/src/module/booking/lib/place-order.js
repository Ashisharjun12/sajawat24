import { getApiError } from "@/api/api";
import { createOrder } from "@/api/orders.api";
import { verifyPayment } from "@/api/payments.api";
import { openCashfreeCheckout, openRazorpayCheckout } from "@/module/booking/lib/online-checkout";
import {
  isPaymentCancelledMessage,
  OnlinePaymentIncompleteError,
} from "@/module/booking/lib/payment-flow-errors";

export async function placeCheckoutOrder({ payload, payment, customer }) {
  const result = await createOrder(payload);
  const order = result?.order ?? result;
  const checkout = result?.checkout;
  const orderId = order.id;

  if (payment === "online" && checkout) {
    try {
      const verifyPayload =
        checkout.provider === "razorpay"
          ? await openRazorpayCheckout(
              {
                ...checkout,
                decoryOrderId: orderId,
              },
              customer,
            )
          : await openCashfreeCheckout(checkout);

      const confirmed = await verifyPayment(verifyPayload);
      const status = confirmed?.status ?? order.status;
      if (status !== "CONFIRMED") {
        throw new OnlinePaymentIncompleteError(
          orderId,
          "Payment is still processing. Try again in a moment.",
        );
      }
      return { orderId: confirmed?.id ?? orderId, status };
    } catch (err) {
      if (err instanceof OnlinePaymentIncompleteError) throw err;
      const message = getApiError(err);
      throw new OnlinePaymentIncompleteError(
        orderId,
        message,
        isPaymentCancelledMessage(message),
      );
    }
  }

  const status = order?.status ?? "CONFIRMED";
  if (payment === "cod" && status !== "CONFIRMED") {
    throw new Error("Order was not confirmed. Try again or choose another payment method.");
  }

  return { orderId, status };
}

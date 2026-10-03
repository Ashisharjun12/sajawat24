import { PaymentFactory } from "@/infrastructure/payment/payment.factory.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { CartRepository } from "@/modules/booking/carts/cart.repository.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { collectionService } from "@/modules/payments/collections/collection.service.js";
import { PaymentIntentRepository } from "@/modules/payments/intents/payment-intent.repository.js";
import { isDecoryOrderUuid } from "@/infrastructure/payment/provider/cashfree-cod.helpers.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { logger } from "@/utils/logger.js";

export class PaymentWebhookService {
    private readonly orders = new OrderRepository();
    private readonly carts = new CartRepository();
    private readonly intents = new PaymentIntentRepository();

    async process(
        provider: "razorpay" | "cashfree",
        headers: Record<string, string | string[] | undefined>,
        rawBody: Buffer | string,
    ): Promise<void> {
        const paymentProvider = PaymentFactory.getProvider(provider);
        const event = await paymentProvider.verifyWebhook(headers, rawBody);

        if (event.status !== "captured") {
            return;
        }

        if (event.kind === "collection") {
            await collectionService.handleWebhookCollectionEvent(event);
            return;
        }

        if (!isDecoryOrderUuid(event.orderId)) {
            const settled = await collectionService.handleWebhookCollectionEvent({
                ...event,
                kind: "collection",
            });
            if (settled) {
                return;
            }
            logger.warn(
                { orderId: event.orderId, provider: event.provider },
                "payment webhook ignored: not a Decory order id",
            );
            return;
        }

        const posted = await ledgerService.postPaymentCaptured(
            event.orderId,
            event.providerPaymentId,
            event.amountPaise,
        );
        if (!posted) return;

        const order = await this.orders.findById(event.orderId);
        if (!order) return;

        if (order.status === "PENDING_PAYMENT") {
            const confirmed = await this.orders.confirmOrder(event.orderId, order.userId);
            if (confirmed) {
                await this.intents.markPaid(event.orderId, event.providerPaymentId);
                const cart = await this.carts.findByUserId(order.userId);
                if (cart) {
                    await this.orders.clearCart(cart.id);
                }
            }
        }
    }

    async enqueueRetry(
        provider: "razorpay" | "cashfree",
        headers: Record<string, string | string[] | undefined>,
        rawBody: Buffer | string,
    ): Promise<void> {
        const queues = getQueues();
        await queues.paymentsWebhookRetry.add(
            "webhook",
            {
                provider,
                headers,
                rawBody: typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
            },
            { removeOnComplete: true, attempts: 5, backoff: { type: "exponential", delay: 2000 } },
        );
    }

}

export const paymentWebhookService = new PaymentWebhookService();

import { PaymentFactory } from "@/infrastructure/payment/payment.factory.js";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { PaymentIntentRepository } from "@/modules/payments/intents/payment-intent.repository.js";
import { ApiError } from "@/shared/errors/apiError.js";

export class RefundExecutionService {
    constructor(
        private readonly orders = new OrderRepository(),
        private readonly intents = new PaymentIntentRepository(),
        private readonly entries = new LedgerEntryRepository(),
    ) {}

    async hasLedgerReversal(orderId: string): Promise<boolean> {
        const ledger = await this.entries.listForOrder(orderId);
        return ledger.some((row) => String(row.idempotencyKey).startsWith("reverse:"));
    }

    async canRefundOnline(orderId: string): Promise<boolean> {
        const order = await this.orders.findById(orderId);
        if (!order) return false;
        const intent = await this.intents.findByOrderId(orderId);
        if (intent?.status !== "paid" || order.paymentMethod !== "ONLINE") {
            return false;
        }
        return !(await this.hasLedgerReversal(orderId));
    }

    async executeOrderRefund(
        orderId: string,
        reason: string,
    ): Promise<{ gatewayRefunded: boolean; idempotencyKey: string }> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }

        const intent = await this.intents.findByOrderId(orderId);
        const idempotencyKey = `refund:${orderId}`;
        let gatewayRefunded = false;

        if (intent?.providerPaymentId && intent.status === "paid") {
            const provider = PaymentFactory.getProvider(intent.provider);
            await provider.refund({
                providerRef: intent.providerPaymentId,
                amountPaise: orderPayablePaise(order),
                idempotencyKey,
            });
            gatewayRefunded = true;
        }

        await ledgerService.reverse(orderId, reason);
        return { gatewayRefunded, idempotencyKey };
    }
}

export const refundExecutionService = new RefundExecutionService();

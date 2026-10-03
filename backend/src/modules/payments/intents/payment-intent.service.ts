import { PaymentFactory } from "@/infrastructure/payment/payment.factory.js";
import type { VerifyClientPaymentInput } from "@/infrastructure/payment/payment.interface.js";
import { CartRepository } from "@/modules/booking/carts/cart.repository.js";
import type { OrderWithItems } from "@/modules/booking/orders/order.repository.js";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { PublicOrder } from "@/modules/booking/orders/order.service.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import { activeOnlineProvider } from "@/modules/ops/settings/payment-methods.js";
import { settingService } from "@/modules/ops/index.js";
import type { VerifyPaymentInput } from "@/modules/payments/intents/payment-intent.dto.js";
import type { IPaymentIntentRepository } from "@/modules/payments/intents/payment-intent.repository.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";

export type CheckoutPayload = {
    provider: "razorpay" | "cashfree";
    [key: string]: unknown;
};

export interface IPaymentIntentService {
    startCheckout(order: OrderWithItems): Promise<CheckoutPayload>;
    verifyAndConfirm(userId: string, input: VerifyPaymentInput): Promise<PublicOrder>;
    abandonCheckout(orderId: string): Promise<void>;
}

export class PaymentIntentService implements IPaymentIntentService {
    private readonly carts = new CartRepository();

    constructor(
        private readonly intents: IPaymentIntentRepository,
        private readonly orders: IOrderRepository,
        private readonly notifications: INotificationService,
        private readonly toPublic: (order: OrderWithItems) => PublicOrder,
        private readonly sendBookingConfirmedEmail: (userId: string, order: PublicOrder) => Promise<void>,
    ) {}

    async startCheckout(order: OrderWithItems): Promise<CheckoutPayload> {
        const platform = await settingService.getPaymentMethods();
        const providerName = activeOnlineProvider(platform);
        if (!providerName) {
            throw ApiError.badRequest("online payment is not enabled");
        }

        const existing = await this.intents.findByOrderId(order.id);
        if (existing?.status === "paid") {
            throw ApiError.badRequest("payment already completed");
        }

        const payablePaise = orderPayablePaise(order);
        const provider = PaymentFactory.getProvider(providerName);
        const result = await provider.createIntent({
            orderId: order.id,
            amountPaise: payablePaise,
            receipt: order.reference,
            customer: {
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail,
            },
        });

        if (!existing) {
            await this.intents.create({
                orderId: order.id,
                provider: providerName,
                providerRef: result.providerRef,
                amountPaise: payablePaise,
                status: "created",
            });
        }

        return {
            provider: providerName,
            ...result.payload,
        };
    }

    async verifyAndConfirm(userId: string, input: VerifyPaymentInput): Promise<PublicOrder> {
        const order = await this.orders.findByIdForUser(input.orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }

        const loaded = await this.orders.loadWithItems(order.id);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }

        const intent = await this.intents.findByOrderId(order.id);
        if (!intent) {
            throw ApiError.badRequest("payment intent not found");
        }

        if (intent.status === "paid" && order.status === "CONFIRMED") {
            return this.toPublic(loaded);
        }

        if (order.status !== "PENDING_PAYMENT") {
            throw ApiError.badRequest("order is not awaiting payment");
        }

        if (input.provider !== intent.provider) {
            throw ApiError.badRequest("payment provider mismatch");
        }

        const verifyInput: VerifyClientPaymentInput =
            input.provider === "razorpay"
                ? {
                      provider: "razorpay",
                      orderId: order.id,
                      amountPaise: order.subtotalPaise,
                      razorpayOrderId: input.razorpayOrderId,
                      razorpayPaymentId: input.razorpayPaymentId,
                      razorpaySignature: input.razorpaySignature,
                  }
                : {
                      provider: "cashfree",
                      orderId: order.id,
                      amountPaise: order.subtotalPaise,
                  };

        const provider = PaymentFactory.getProvider(input.provider);
        const verified = await provider.verifyClientPayment(verifyInput);

        const confirmed = await this.orders.confirmOrder(order.id, userId);
        if (!confirmed) {
            throw ApiError.internalServerError("failed to confirm order");
        }

        await this.intents.markPaid(order.id, verified.providerPaymentId);

        try {
            await ledgerService.postPaymentCaptured(
                order.id,
                verified.providerPaymentId,
                order.subtotalPaise,
            );
        } catch (err) {
            logger.error({ err, orderId: order.id }, "ledger post payment captured failed");
        }

        const cart = await this.carts.findByUserId(userId);
        if (cart) {
            await this.orders.clearCart(cart.id);
        }

        const confirmedLoaded = await this.orders.loadWithItems(order.id);
        if (!confirmedLoaded) {
            throw ApiError.notFound("order not found");
        }

        const publicOrder = this.toPublic(confirmedLoaded);
        try {
            await this.sendBookingConfirmedEmail(userId, publicOrder);
        } catch (err) {
            logger.error({ err, orderId: order.id }, "booking confirmed email failed");
        }
        return publicOrder;
    }

    async abandonCheckout(orderId: string): Promise<void> {
        await this.intents.markFailed(orderId);
    }
}

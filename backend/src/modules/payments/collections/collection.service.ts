import { eq } from "drizzle-orm";
import { _config } from "@/config/config.js";
import { db } from "@/db/postgres-client.js";
import { PaymentFactory } from "@/infrastructure/payment/payment.factory.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { activeOnlineProvider } from "@/modules/ops/settings/payment-methods.js";
import { settingService } from "@/modules/ops/index.js";
import { canSettleCodCollectionPayment } from "@/modules/payments/collections/collection-payment.guards.js";
import { CollectionRepository } from "@/modules/payments/collections/collection.repository.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import type { WebhookEvent } from "@/infrastructure/payment/payment.interface.js";
import {
    cashfreeWebhookCollectionProviderRefCandidates,
    isCashfreeCodCollectionMerchantOrderId,
    isCashfreeCollectPaymentLinkRef,
    isDecoryOrderUuid,
    type CashfreeWebhookPayload,
} from "@/infrastructure/payment/provider/cashfree-cod.helpers.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";
import type { OnlinePaymentProvider } from "@/modules/ops/settings/payment-methods.js";

const DEFAULT_QR_TTL_MS = 15 * 60 * 1000;
const COLLECT_SYNC_MIN_INTERVAL_MS = 2000;
const lastCollectSyncAt = new Map<string, number>();

function collectionSessionTtlMs(providerName: string): number {
    if (providerName === "cashfree") {
        const minutes = _config.CASHFREE_COD_QR_TTL_MINUTES;
        return minutes * 60 * 1000;
    }
    return DEFAULT_QR_TTL_MS;
}

export type CollectionStatusDto = {
    collectionStatus: string;
    collectionMethod: string | null;
    collectedAt: string | null;
    activeSession: {
        provider: string;
        qrImageUrl?: string;
        qrBase64?: string;
        shareUrl?: string;
        expiresAt: string;
    } | null;
};

export class CollectionService {
    private readonly collections = new CollectionRepository();
    private readonly orders = new OrderRepository();

    async getStatusForVendor(orderId: string): Promise<CollectionStatusDto> {
        await this.syncCollectPaymentIfPaid(orderId);
        return this.getStatus(orderId);
    }

    async syncCollectPaymentIfPaid(orderId: string): Promise<void> {
        const order = await this.orders.findById(orderId);
        if (!order || order.collectionStatus !== "pending") return;

        const active = await this.collections.findActiveByOrderId(orderId);
        if (!active) return;

        const now = Date.now();
        const last = lastCollectSyncAt.get(orderId) ?? 0;
        if (now - last < COLLECT_SYNC_MIN_INTERVAL_MS) return;
        lastCollectSyncAt.set(orderId, now);

        const providerName = active.provider as OnlinePaymentProvider;
        let provider;
        try {
            provider = PaymentFactory.getProvider(providerName);
        } catch {
            return;
        }

        const sync = await provider.syncCollectPayment(active.providerRef, active.amountPaise);
        if (!sync.paid) return;

        const paymentId = sync.providerPaymentId ?? active.providerRef;
        await this.handleQrPayment(active.providerRef, paymentId, active.amountPaise);
    }

    async getStatus(orderId: string): Promise<CollectionStatusDto> {
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");

        const active =
            order.collectionStatus === "pending"
                ? await this.collections.findActiveByOrderId(orderId)
                : undefined;
        const payload = active?.qrPayload as Record<string, string> | undefined;

        return {
            collectionStatus: order.collectionStatus,
            collectionMethod: order.collectionMethod,
            collectedAt: order.collectedAt?.toISOString() ?? null,
            activeSession:
                order.collectionStatus === "pending" && active
                    ? {
                          provider: active.provider,
                          qrImageUrl: payload?.qrImageUrl,
                          qrBase64: payload?.qrBase64,
                          shareUrl: payload?.shareUrl,
                          expiresAt: active.expiresAt.toISOString(),
                      }
                    : null,
        };
    }

    async collectCash(orderId: string, vendorId: string): Promise<CollectionStatusDto> {
        const order = await this.assertCodCollectable(orderId, vendorId);
        if (order.collectionStatus === "collected_cash") {
            return this.getStatus(orderId);
        }
        if (order.collectionStatus !== "pending") {
            throw ApiError.conflict("collection already settled");
        }

        await this.collections.expireActiveForOrder(orderId);
        await db
            .update(orders)
            .set({
                collectionStatus: "collected_cash",
                collectionMethod: "cash",
                collectedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        return this.getStatus(orderId);
    }

    async collectOnline(orderId: string, vendorId: string): Promise<CollectionStatusDto> {
        const order = await this.assertCodCollectable(orderId, vendorId);
        if (order.collectionStatus === "collected_online") {
            return this.getStatus(orderId);
        }
        if (order.collectionStatus === "collected_cash") {
            throw ApiError.conflict("cash already collected for this order");
        }

        const platform = await settingService.getPaymentMethods();
        const providerName = activeOnlineProvider(platform);
        if (!providerName) {
            throw ApiError.badRequest("online collection is not enabled");
        }

        await this.collections.expireActiveForOrder(orderId);
        const provider = PaymentFactory.getProvider(providerName);
        const sessionTtlMinutes =
            providerName === "cashfree" ? _config.CASHFREE_COD_QR_TTL_MINUTES : 15;
        const qr = await provider.createCollectQr({
            orderId,
            amountPaise: order.subtotalPaise,
            receipt: order.reference,
            customer: {
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail,
            },
            sessionTtlMinutes,
        });

        const expiresAt = new Date(Date.now() + collectionSessionTtlMs(providerName));
        await this.collections.create({
            orderId,
            provider: providerName,
            providerRef: qr.providerRef,
            amountPaise: order.subtotalPaise,
            status: "created",
            expiresAt,
            qrPayload: {
                qrImageUrl: qr.qrImageUrl,
                qrBase64: qr.qrBase64,
                shareUrl: qr.shareUrl,
            },
        });

        return this.getStatus(orderId);
    }

    async handleWebhookCollectionEvent(event: WebhookEvent): Promise<boolean> {
        const providerName = event.provider as OnlinePaymentProvider;
        let providerRef = event.providerRef;
        const paymentId = event.providerPaymentId;

        let session = await this.collections.findByProviderRef(providerRef);
        if (!session && event.orderId && isDecoryOrderUuid(event.orderId)) {
            session = await this.collections.findActiveByOrderId(event.orderId);
            if (session) {
                providerRef = session.providerRef;
            }
        }

        if (!session && event.raw) {
            const candidates = cashfreeWebhookCollectionProviderRefCandidates(
                event.raw as CashfreeWebhookPayload,
            );
            for (const ref of candidates) {
                if (
                    !isCashfreeCollectPaymentLinkRef(ref) &&
                    !isCashfreeCodCollectionMerchantOrderId(ref)
                ) {
                    continue;
                }
                const found = await this.collections.findByProviderRef(ref);
                if (found) {
                    session = found;
                    providerRef = ref;
                    break;
                }
            }
        }

        if (!session) {
            const provider = PaymentFactory.getProvider(providerName);
            const resolved = await provider.resolveCollectionWebhook?.(event.raw);
            if (resolved) {
                providerRef = resolved.providerRef;
                session = await this.collections.findByProviderRef(providerRef);
            }
        }

        if (!session) {
            logger.warn(
                { providerRef: event.providerRef, orderId: event.orderId },
                "COD collection webhook: no matching session",
            );
            return false;
        }

        await this.handleQrPayment(providerRef, paymentId, session.amountPaise);
        return true;
    }

    async handleQrPayment(
        providerRef: string,
        paymentId: string,
        amountPaise: number,
    ): Promise<void> {
        const session = await this.collections.findByProviderRef(providerRef);
        if (!session) {
            logger.warn({ providerRef }, "COD collection settlement skipped: session not found");
            return;
        }
        if (session.status === "paid") return;

        const order = await this.orders.findById(session.orderId);
        if (!order) return;

        const canSettle = canSettleCodCollectionPayment({
            collectionStatus: order.collectionStatus,
            sessionAmountPaise: session.amountPaise,
            orderSubtotalPaise: order.subtotalPaise,
            webhookAmountPaise: amountPaise,
        });
        if (!canSettle) {
            logger.warn(
                {
                    orderId: session.orderId,
                    providerRef,
                    collectionStatus: order.collectionStatus,
                    sessionAmountPaise: session.amountPaise,
                    orderSubtotalPaise: order.subtotalPaise,
                    webhookAmountPaise: amountPaise,
                },
                "COD collection settlement skipped: guard rejected",
            );
            return;
        }

        await ledgerService.postPaymentCaptured(session.orderId, paymentId, amountPaise);
        await this.collections.markPaid(session.id, paymentId);

        await db
            .update(orders)
            .set({
                collectionStatus: "collected_online",
                collectionMethod: "online",
                collectedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, session.orderId));
    }

    private async assertCodCollectable(orderId: string, vendorId: string) {
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");
        if (order.paymentMethod !== "COD") {
            throw ApiError.badRequest("collection is only required for COD orders");
        }
        if (order.status !== "ON_SITE") {
            throw ApiError.conflict("collection is only available when on site");
        }
        return order;
    }
}

export const collectionService = new CollectionService();

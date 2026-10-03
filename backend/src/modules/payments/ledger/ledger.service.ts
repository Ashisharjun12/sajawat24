import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import type { LedgerAccount } from "@/modules/payments/ledger/ledger-entry.schema.js";
import { orderFinancialService } from "@/modules/payments/order-financials/order-financial.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class LedgerService {
    private readonly entries = new LedgerEntryRepository();
    private readonly orders = new OrderRepository();

    async postPaymentCaptured(
        orderId: string,
        paymentId: string,
        amountPaise: number,
        vendorId?: string | null,
    ): Promise<boolean> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (order.subtotalPaise !== amountPaise) {
            throw ApiError.badRequest("payment amount mismatch");
        }

        const inserted = await this.entries.insert({
            orderId,
            vendorId: vendorId ?? null,
            debitAccount: "platform_cash",
            creditAccount: "order_escrow",
            amountPaise,
            idempotencyKey: `pay:${paymentId}`,
            metadata: { paymentId },
        });
        return inserted !== null;
    }

    async postOnComplete(orderId: string, vendorId: string): Promise<boolean> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (order.ledgerPostedAt) return false;

        const financials = await orderFinancialService.getByOrderId(orderId);
        if (!financials) {
            throw ApiError.internalServerError("order financial snapshot missing");
        }

        const { platformFeePaise, vendorSharePaise, grossPaise } = financials;
        const isCod = order.paymentMethod === "COD";
        const collectedOnline =
            order.collectionStatus === "collected_online" ||
            (!isCod && (order.paymentMethod === "ONLINE" || order.paymentMethod === "PREPAID"));

        return db.transaction(async (tx) => {
            if (collectedOnline) {
                const codDues = await this.getVendorCodDue(vendorId);
                const codSettle = Math.min(codDues, vendorSharePaise);
                const netVendorShare = vendorSharePaise - codSettle;

                if (platformFeePaise > 0) {
                    await this.postEntry(
                        {
                            orderId,
                            vendorId: null,
                            debitAccount: "order_escrow",
                            creditAccount: "platform_revenue",
                            amountPaise: platformFeePaise,
                            idempotencyKey: `complete:${orderId}:platform`,
                        },
                        tx,
                    );
                }

                if (netVendorShare > 0) {
                    await this.postEntry(
                        {
                            orderId,
                            vendorId,
                            debitAccount: "order_escrow",
                            creditAccount: "vendor_payable",
                            amountPaise: netVendorShare,
                            idempotencyKey: `complete:${orderId}:vendor`,
                            metadata: { kind: "earning" },
                        },
                        tx,
                    );
                }

                if (codSettle > 0) {
                    await this.postEntry(
                        {
                            orderId,
                            vendorId,
                            debitAccount: "order_escrow",
                            creditAccount: "vendor_cod_due",
                            amountPaise: codSettle,
                            idempotencyKey: `complete:${orderId}:cod-settle`,
                            metadata: { kind: "cod_settlement" },
                        },
                        tx,
                    );
                }
            } else if (isCod && order.collectionStatus === "collected_cash") {
                if (platformFeePaise > 0) {
                    await this.postEntry(
                        {
                            orderId,
                            vendorId,
                            debitAccount: "vendor_cod_due",
                            creditAccount: "platform_revenue",
                            amountPaise: platformFeePaise,
                            idempotencyKey: `complete:${orderId}:cod`,
                            metadata: { kind: "cod_due" },
                        },
                        tx,
                    );
                }
            } else {
                throw ApiError.conflict("order collection is not settled");
            }

            await tx
                .update(orders)
                .set({ ledgerPostedAt: new Date(), updatedAt: new Date() })
                .where(eq(orders.id, orderId));

            logger.info({ orderId, vendorId, grossPaise }, "ledger post-on-complete");
            return true;
        });
    }

    async reverse(orderId: string, reason: string): Promise<void> {
        const rows = await this.entries.listForOrder(orderId);
        if (!rows.length) return;

        for (const row of rows) {
            await this.entries.insert({
                orderId: row.orderId,
                vendorId: row.vendorId,
                debitAccount: row.creditAccount,
                creditAccount: row.debitAccount,
                amountPaise: row.amountPaise,
                idempotencyKey: `reverse:${row.id}`,
                metadata: { reason, reversedEntryId: row.id },
            });
        }
    }

    async reverseWithdrawal(vendorId: string, payoutRequestId: string, reason: string): Promise<void> {
        const key = `withdraw:${payoutRequestId}`;
        const existing = await this.entries.findByIdempotencyKey(key);
        if (!existing) return;

        await this.entries.insert({
            orderId: null,
            vendorId,
            debitAccount: "platform_cash",
            creditAccount: "vendor_payable",
            amountPaise: existing.amountPaise,
            idempotencyKey: `withdraw-reverse:${payoutRequestId}`,
            metadata: { reason, payoutRequestId, reversedEntryId: existing.id },
        });
    }

    async getVendorCodDue(vendorId: string): Promise<number> {
        const balance = await this.entries.accountBalance(vendorId, "vendor_cod_due");
        return Math.max(0, -balance);
    }

    async settleVendorPending(vendorId: string, holdDays: number): Promise<number> {
        const cutoff = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);
        const pendingBefore = await this.entries.sumVendorAccountBefore(
            vendorId,
            "vendor_pending",
            cutoff,
        );
        if (pendingBefore <= 0) return 0;

        const inserted = await this.entries.insert({
            orderId: null,
            vendorId,
            debitAccount: "vendor_pending",
            creditAccount: "vendor_payable",
            amountPaise: pendingBefore,
            idempotencyKey: `settle:${vendorId}:${cutoff.toISOString().slice(0, 10)}`,
            metadata: { cutoff: cutoff.toISOString() },
        });
        return inserted ? pendingBefore : 0;
    }

    private async postEntry(
        input: {
            orderId: string | null;
            vendorId: string | null;
            debitAccount: LedgerAccount;
            creditAccount: LedgerAccount;
            amountPaise: number;
            idempotencyKey: string;
            metadata?: Record<string, unknown>;
        },
        tx: DbTx,
    ): Promise<void> {
        if (input.amountPaise <= 0) return;
        const inserted = await this.entries.insert(
            {
                orderId: input.orderId,
                vendorId: input.vendorId,
                debitAccount: input.debitAccount,
                creditAccount: input.creditAccount,
                amountPaise: input.amountPaise,
                idempotencyKey: input.idempotencyKey,
                metadata: input.metadata ?? null,
            },
            tx,
        );
        if (!inserted) {
            const existing = await this.entries.findByIdempotencyKey(input.idempotencyKey);
            if (!existing) throw new Error("failed to post ledger entry");
        }
    }
}

export const ledgerService = new LedgerService();

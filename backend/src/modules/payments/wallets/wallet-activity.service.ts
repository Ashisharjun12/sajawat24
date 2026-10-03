import { desc, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { ledgerEntries } from "@/modules/payments/ledger/ledger-entry.schema.js";
import { payoutRequests } from "@/modules/payments/payouts/payout-request.schema.js";
import { paginationOffset, parsePagination } from "@/shared/http/pagination.js";

export type WalletActivityType =
    | "earning"
    | "cod_due"
    | "cod_settled"
    | "withdrawal"
    | "withdrawal_failed_reversal";

export type WalletActivityItem = {
    id: string;
    type: WalletActivityType;
    title: string;
    amountPaise: number;
    direction: "credit" | "debit";
    createdAt: string;
    orderId: string | null;
    orderReference: string | null;
    payoutRequestId: string | null;
    status: string | null;
};

const EARNINGS_TYPES: WalletActivityType[] = ["earning", "cod_settled"];
const COD_TYPES: WalletActivityType[] = ["cod_due", "cod_settled"];
const WITHDRAWAL_TYPES: WalletActivityType[] = ["withdrawal", "withdrawal_failed_reversal"];

export class WalletActivityService {
    async listForVendor(
        vendorId: string,
        query: { page?: number; limit?: number; type?: string; from?: string; to?: string },
    ) {
        const pagination = parsePagination(query);
        const offset = paginationOffset(pagination);
        const filterTypes = this.resolveFilterTypes(query.type);
        const items: WalletActivityItem[] = [];

        if (!filterTypes || filterTypes.some((t) => WITHDRAWAL_TYPES.includes(t))) {
            const payoutRows = await db
                .select()
                .from(payoutRequests)
                .where(eq(payoutRequests.vendorId, vendorId))
                .orderBy(desc(payoutRequests.createdAt));

            for (const row of payoutRows) {
                items.push({
                    id: `payout-${row.id}`,
                    type: "withdrawal",
                    title:
                        row.status === "failed"
                            ? "Withdrawal failed"
                            : row.status === "paid"
                              ? "Withdrawal paid"
                              : row.status === "processing"
                                ? "Withdrawal processing"
                                : "Withdrawal requested",
                    amountPaise: row.amountPaise,
                    direction: "debit",
                    createdAt: row.createdAt.toISOString(),
                    orderId: null,
                    orderReference: null,
                    payoutRequestId: row.id,
                    status: row.status,
                });
            }
        }

        const ledgerRows = await db
            .select({
                id: ledgerEntries.id,
                orderId: ledgerEntries.orderId,
                debitAccount: ledgerEntries.debitAccount,
                creditAccount: ledgerEntries.creditAccount,
                amountPaise: ledgerEntries.amountPaise,
                metadata: ledgerEntries.metadata,
                idempotencyKey: ledgerEntries.idempotencyKey,
                createdAt: ledgerEntries.createdAt,
                orderReference: orders.reference,
                paymentMethod: orders.paymentMethod,
                collectionStatus: orders.collectionStatus,
            })
            .from(ledgerEntries)
            .leftJoin(orders, eq(ledgerEntries.orderId, orders.id))
            .where(eq(ledgerEntries.vendorId, vendorId))
            .orderBy(desc(ledgerEntries.createdAt));

        for (const row of ledgerRows) {
            const mapped = this.mapLedgerRow(row);
            if (!mapped) continue;
            if (filterTypes && !filterTypes.includes(mapped.type)) continue;
            if (mapped.type === "withdrawal") continue;
            items.push(mapped);
        }

        const dateRange = this.resolveDateRange(query.from, query.to);
        const filtered = dateRange
            ? items.filter((item) => this.isWithinDateRange(item.createdAt, dateRange))
            : items;

        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = filtered.length;
        const pageItems = filtered.slice(offset, offset + pagination.limit);

        return {
            items: pageItems,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    private resolveDateRange(from?: string, to?: string): { fromMs: number; toMs: number } | null {
        if (!from && !to) return null;
        const fromMs = from ? this.startOfIstDay(from) : Number.NEGATIVE_INFINITY;
        const toMs = to ? this.endOfIstDay(to) : Number.POSITIVE_INFINITY;
        return { fromMs, toMs };
    }

    private startOfIstDay(date: string): number {
        return Date.parse(`${date}T00:00:00+05:30`);
    }

    private endOfIstDay(date: string): number {
        return Date.parse(`${date}T23:59:59.999+05:30`);
    }

    private isWithinDateRange(
        createdAt: string,
        range: { fromMs: number; toMs: number },
    ): boolean {
        const ms = new Date(createdAt).getTime();
        return ms >= range.fromMs && ms <= range.toMs;
    }

    private resolveFilterTypes(type?: string): WalletActivityType[] | null {
        if (!type) return null;
        if (type === "earnings") return EARNINGS_TYPES;
        if (type === "cod") return COD_TYPES;
        if (type === "withdrawals") return WITHDRAWAL_TYPES;
        const single = type as WalletActivityType;
        if (
            [
                "earning",
                "cod_due",
                "cod_settled",
                "withdrawal",
                "withdrawal_failed_reversal",
            ].includes(single)
        ) {
            return [single];
        }
        return null;
    }

    private mapLedgerRow(row: {
        id: string;
        orderId: string | null;
        debitAccount: string;
        creditAccount: string;
        amountPaise: number;
        metadata: unknown;
        idempotencyKey: string;
        createdAt: Date;
        orderReference: string | null;
        paymentMethod: string | null;
        collectionStatus: string | null;
    }): WalletActivityItem | null {
        const meta =
            row.metadata && typeof row.metadata === "object"
                ? (row.metadata as Record<string, unknown>)
                : {};
        const kind = typeof meta.kind === "string" ? meta.kind : "";
        const ref = row.orderReference ?? "Booking";

        if (String(row.idempotencyKey).startsWith("withdraw-reverse:")) {
            return {
                id: row.id,
                type: "withdrawal_failed_reversal",
                title: "Withdrawal reversed",
                amountPaise: row.amountPaise,
                direction: "credit",
                createdAt: row.createdAt.toISOString(),
                orderId: null,
                orderReference: null,
                payoutRequestId:
                    typeof meta.payoutRequestId === "string" ? meta.payoutRequestId : null,
                status: "failed",
            };
        }

        if (row.creditAccount === "vendor_payable" && kind === "earning") {
            const label =
                row.collectionStatus === "collected_online"
                    ? "QR payment"
                    : row.paymentMethod === "ONLINE" || row.paymentMethod === "PREPAID"
                      ? "Online payment"
                      : "Job completed";
            return {
                id: row.id,
                type: "earning",
                title: `${ref} · ${label}`,
                amountPaise: row.amountPaise,
                direction: "credit",
                createdAt: row.createdAt.toISOString(),
                orderId: row.orderId,
                orderReference: row.orderReference,
                payoutRequestId: null,
                status: null,
            };
        }

        if (row.debitAccount === "vendor_cod_due" && kind === "cod_due") {
            return {
                id: row.id,
                type: "cod_due",
                title: `${ref} · Cash commission owed`,
                amountPaise: row.amountPaise,
                direction: "debit",
                createdAt: row.createdAt.toISOString(),
                orderId: row.orderId,
                orderReference: row.orderReference,
                payoutRequestId: null,
                status: null,
            };
        }

        if (row.creditAccount === "vendor_cod_due" && kind === "cod_settlement") {
            return {
                id: row.id,
                type: "cod_settled",
                title: `${ref} · COD dues cleared`,
                amountPaise: row.amountPaise,
                direction: "credit",
                createdAt: row.createdAt.toISOString(),
                orderId: row.orderId,
                orderReference: row.orderReference,
                payoutRequestId: null,
                status: null,
            };
        }

        if (String(row.idempotencyKey).startsWith("withdraw:")) {
            return {
                id: row.id,
                type: "withdrawal",
                title: "Withdrawal requested",
                amountPaise: row.amountPaise,
                direction: "debit",
                createdAt: row.createdAt.toISOString(),
                orderId: null,
                orderReference: null,
                payoutRequestId: String(row.idempotencyKey).replace("withdraw:", ""),
                status: "pending",
            };
        }

        return null;
    }
}

export const walletActivityService = new WalletActivityService();

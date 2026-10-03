import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    ledgerEntries,
    type LedgerAccount,
    type LedgerEntry,
    type NewLedgerEntry,
} from "@/modules/payments/ledger/ledger-entry.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class LedgerEntryRepository {
    async insert(row: NewLedgerEntry, tx?: DbTx): Promise<LedgerEntry | null> {
        const client = tx ?? db;
        try {
            const [created] = await client.insert(ledgerEntries).values(row).returning();
            return created ?? null;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (/ledger_entries_idempotency_key|duplicate key/i.test(message)) {
                return null;
            }
            throw err;
        }
    }

    async findByIdempotencyKey(key: string): Promise<LedgerEntry | undefined> {
        const [row] = await db
            .select()
            .from(ledgerEntries)
            .where(eq(ledgerEntries.idempotencyKey, key))
            .limit(1);
        return row;
    }

    async listForVendor(
        vendorId: string,
        pagination: { limit: number; offset: number },
    ): Promise<{ items: LedgerEntry[]; total: number }> {
        const where = eq(ledgerEntries.vendorId, vendorId);
        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int` })
            .from(ledgerEntries)
            .where(where);
        const items = await db
            .select()
            .from(ledgerEntries)
            .where(where)
            .orderBy(desc(ledgerEntries.createdAt))
            .limit(pagination.limit)
            .offset(pagination.offset);
        return { items, total: countRow?.total ?? 0 };
    }

    async listForOrder(orderId: string): Promise<LedgerEntry[]> {
        return db
            .select()
            .from(ledgerEntries)
            .where(eq(ledgerEntries.orderId, orderId))
            .orderBy(ledgerEntries.createdAt);
    }

    async accountBalance(vendorId: string | null, account: LedgerAccount): Promise<number> {
        const vendorClause =
            vendorId === null
                ? sql`${ledgerEntries.vendorId} is null`
                : eq(ledgerEntries.vendorId, vendorId);

        const [creditRow] = await db
            .select({
                total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
            })
            .from(ledgerEntries)
            .where(and(vendorClause, eq(ledgerEntries.creditAccount, account)));

        const [debitRow] = await db
            .select({
                total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
            })
            .from(ledgerEntries)
            .where(and(vendorClause, eq(ledgerEntries.debitAccount, account)));

        return (creditRow?.total ?? 0) - (debitRow?.total ?? 0);
    }

    async sumVendorAccountBefore(
        vendorId: string,
        account: LedgerAccount,
        before: Date,
    ): Promise<number> {
        const [creditRow] = await db
            .select({
                total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
            })
            .from(ledgerEntries)
            .where(
                and(
                    eq(ledgerEntries.vendorId, vendorId),
                    eq(ledgerEntries.creditAccount, account),
                    sql`${ledgerEntries.createdAt} < ${before}`,
                ),
            );

        const [debitRow] = await db
            .select({
                total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
            })
            .from(ledgerEntries)
            .where(
                and(
                    eq(ledgerEntries.vendorId, vendorId),
                    eq(ledgerEntries.debitAccount, account),
                    sql`${ledgerEntries.createdAt} < ${before}`,
                ),
            );

        return (creditRow?.total ?? 0) - (debitRow?.total ?? 0);
    }

    async sumVendorEarningsThisMonthIst(vendorId: string): Promise<number> {
        const [row] = await db
            .select({
                total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
            })
            .from(ledgerEntries)
            .where(
                and(
                    eq(ledgerEntries.vendorId, vendorId),
                    sql`${ledgerEntries.creditAccount} in ('vendor_payable', 'vendor_pending')`,
                    sql`date_trunc('month', ${ledgerEntries.createdAt} at time zone 'Asia/Kolkata') = date_trunc('month', now() at time zone 'Asia/Kolkata')`,
                ),
            );
        return row?.total ?? 0;
    }
}

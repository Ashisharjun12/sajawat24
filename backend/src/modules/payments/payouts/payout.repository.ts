import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import {
    payoutRequests,
    type NewPayoutRequest,
    type PayoutRequest,
} from "@/modules/payments/payouts/payout-request.schema.js";

export class PayoutRepository {
    async create(row: NewPayoutRequest): Promise<PayoutRequest> {
        const [created] = await db.insert(payoutRequests).values(row).returning();
        if (!created) throw new Error("failed to create payout request");
        return created;
    }

    async findById(id: string): Promise<PayoutRequest | undefined> {
        const [row] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, id)).limit(1);
        return row;
    }

    async hasActiveRequest(vendorId: string): Promise<boolean> {
        const [row] = await db
            .select({ total: count() })
            .from(payoutRequests)
            .where(
                and(
                    eq(payoutRequests.vendorId, vendorId),
                    inArray(payoutRequests.status, ["pending", "processing"]),
                ),
            );
        return Number(row?.total ?? 0) > 0;
    }

    async updateStatus(
        id: string,
        input: {
            status: PayoutRequest["status"];
            failureReason?: string | null;
            processedAt?: Date | null;
            processedByAdminId?: string | null;
        },
    ): Promise<PayoutRequest | undefined> {
        const [updated] = await db
            .update(payoutRequests)
            .set({
                status: input.status,
                failureReason: input.failureReason ?? null,
                processedAt: input.processedAt ?? null,
                processedByAdminId: input.processedByAdminId ?? null,
                updatedAt: new Date(),
            })
            .where(eq(payoutRequests.id, id))
            .returning();
        return updated;
    }

    async list(input: {
        vendorId?: string;
        q?: string;
        status?: PayoutRequest["status"];
        limit: number;
        offset: number;
    }): Promise<{
        items: Array<{
            id: string;
            vendorId: string;
            vendorName: string;
            amountPaise: number;
            status: string;
            provider: string | null;
            createdAt: string;
        }>;
        total: number;
    }> {
        const filters = [];
        if (input.vendorId) {
            filters.push(eq(payoutRequests.vendorId, input.vendorId));
        }
        const q = input.q?.trim();
        if (q) {
            const pattern = `%${q}%`;
            filters.push(or(ilike(users.name, pattern), ilike(users.phone, pattern))!);
        }
        if (input.status) {
            filters.push(eq(payoutRequests.status, input.status));
        }
        const whereClause = filters.length ? and(...filters) : undefined;

        const [totalRow] = await db
            .select({ total: count() })
            .from(payoutRequests)
            .innerJoin(vendors, eq(payoutRequests.vendorId, vendors.id))
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(whereClause);

        const rows = await db
            .select({
                id: payoutRequests.id,
                vendorId: payoutRequests.vendorId,
                vendorName: users.name,
                amountPaise: payoutRequests.amountPaise,
                status: payoutRequests.status,
                provider: payoutRequests.provider,
                createdAt: payoutRequests.createdAt,
            })
            .from(payoutRequests)
            .innerJoin(vendors, eq(payoutRequests.vendorId, vendors.id))
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(whereClause)
            .orderBy(desc(payoutRequests.createdAt))
            .limit(input.limit)
            .offset(input.offset);

        return {
            items: rows.map((row) => ({
                id: row.id,
                vendorId: row.vendorId,
                vendorName: row.vendorName,
                amountPaise: row.amountPaise,
                status: row.status,
                provider: row.provider,
                createdAt: row.createdAt.toISOString(),
            })),
            total: Number(totalRow?.total ?? 0),
        };
    }
}

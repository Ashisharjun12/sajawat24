import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    adminEmailChangeRequests,
    type AdminEmailChangeRequest,
    type NewAdminEmailChangeRequest,
} from "@/modules/identity/admin-account/admin-email-change.schema.js";

export class AdminEmailChangeRepository {
    async insert(data: NewAdminEmailChangeRequest): Promise<AdminEmailChangeRequest> {
        const [row] = await db.insert(adminEmailChangeRequests).values(data).returning();
        return row;
    }

    async invalidatePendingForUser(userId: string): Promise<void> {
        const now = new Date();
        await db
            .update(adminEmailChangeRequests)
            .set({ usedAt: now })
            .where(
                and(
                    eq(adminEmailChangeRequests.userId, userId),
                    isNull(adminEmailChangeRequests.usedAt),
                ),
            );
    }

    async findByTokenHash(tokenHash: string): Promise<AdminEmailChangeRequest | undefined> {
        const [row] = await db
            .select()
            .from(adminEmailChangeRequests)
            .where(eq(adminEmailChangeRequests.tokenHash, tokenHash))
            .limit(1);
        return row;
    }

    async findActiveByTokenHash(tokenHash: string): Promise<AdminEmailChangeRequest | undefined> {
        const now = new Date();
        const [row] = await db
            .select()
            .from(adminEmailChangeRequests)
            .where(
                and(
                    eq(adminEmailChangeRequests.tokenHash, tokenHash),
                    isNull(adminEmailChangeRequests.usedAt),
                    gt(adminEmailChangeRequests.expiresAt, now),
                ),
            )
            .limit(1);
        return row;
    }

    async findLatestPendingForUser(userId: string): Promise<AdminEmailChangeRequest | undefined> {
        const now = new Date();
        const rows = await db
            .select()
            .from(adminEmailChangeRequests)
            .where(
                and(
                    eq(adminEmailChangeRequests.userId, userId),
                    isNull(adminEmailChangeRequests.usedAt),
                    gt(adminEmailChangeRequests.expiresAt, now),
                ),
            )
            .limit(1);
        return rows[0];
    }

    async markUsed(id: string): Promise<void> {
        await db
            .update(adminEmailChangeRequests)
            .set({ usedAt: new Date() })
            .where(eq(adminEmailChangeRequests.id, id));
    }
}

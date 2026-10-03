import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    collectionSessions,
    type CollectionSession,
    type NewCollectionSession,
} from "@/modules/payments/collections/collection-session.schema.js";

export class CollectionRepository {
    async create(row: NewCollectionSession): Promise<CollectionSession> {
        const [created] = await db.insert(collectionSessions).values(row).returning();
        if (!created) throw new Error("failed to create collection session");
        return created;
    }

    async findActiveByOrderId(orderId: string): Promise<CollectionSession | undefined> {
        const [row] = await db
            .select()
            .from(collectionSessions)
            .where(
                and(
                    eq(collectionSessions.orderId, orderId),
                    inArray(collectionSessions.status, ["created"]),
                ),
            )
            .orderBy(desc(collectionSessions.createdAt))
            .limit(1);
        return row;
    }

    async findByProviderRef(providerRef: string): Promise<CollectionSession | undefined> {
        const [row] = await db
            .select()
            .from(collectionSessions)
            .where(eq(collectionSessions.providerRef, providerRef))
            .limit(1);
        return row;
    }

    async markPaid(
        sessionId: string,
        providerPaymentId: string,
    ): Promise<CollectionSession | undefined> {
        const [row] = await db
            .update(collectionSessions)
            .set({
                status: "paid",
                providerPaymentId,
                paidAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(collectionSessions.id, sessionId))
            .returning();
        return row;
    }

    async expireActiveForOrder(orderId: string): Promise<void> {
        await db
            .update(collectionSessions)
            .set({ status: "expired", updatedAt: new Date() })
            .where(
                and(
                    eq(collectionSessions.orderId, orderId),
                    eq(collectionSessions.status, "created"),
                ),
            );
    }
}

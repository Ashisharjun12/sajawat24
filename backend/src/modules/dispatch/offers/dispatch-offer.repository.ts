import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    dispatchOffers,
    type DispatchOffer,
    type NewDispatchOffer,
} from "@/modules/dispatch/offers/dispatch-offer.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class DispatchOfferRepository {
    async insert(row: NewDispatchOffer, tx?: DbTx): Promise<DispatchOffer> {
        const client = tx ?? db;
        const [created] = await client.insert(dispatchOffers).values(row).returning();
        if (!created) throw new Error("failed to create dispatch offer");
        return created;
    }

    async findById(id: string): Promise<DispatchOffer | undefined> {
        const [row] = await db.select().from(dispatchOffers).where(eq(dispatchOffers.id, id)).limit(1);
        return row;
    }

    async findActiveOfferedForOrder(orderId: string): Promise<DispatchOffer | undefined> {
        const [row] = await db
            .select()
            .from(dispatchOffers)
            .where(and(eq(dispatchOffers.orderId, orderId), eq(dispatchOffers.status, "offered")))
            .orderBy(desc(dispatchOffers.offeredAt))
            .limit(1);
        return row;
    }

    async listTriedVendorIds(orderId: string): Promise<string[]> {
        const rows = await db
            .select({ vendorId: dispatchOffers.vendorId })
            .from(dispatchOffers)
            .where(
                and(
                    eq(dispatchOffers.orderId, orderId),
                    inArray(dispatchOffers.status, [
                        "offered",
                        "declined",
                        "expired",
                        "revoked",
                        "accepted",
                    ]),
                ),
            );
        return [...new Set(rows.map((r) => r.vendorId))];
    }

    async countOffersForOrder(orderId: string): Promise<number> {
        const rows = await db
            .select({ id: dispatchOffers.id })
            .from(dispatchOffers)
            .where(eq(dispatchOffers.orderId, orderId));
        return rows.length;
    }

    async updateStatus(
        id: string,
        status: DispatchOffer["status"],
        tx?: DbTx,
    ): Promise<DispatchOffer | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(dispatchOffers)
            .set({
                status,
                respondedAt: new Date(),
            })
            .where(and(eq(dispatchOffers.id, id), eq(dispatchOffers.status, "offered")))
            .returning();
        return row;
    }

    async revokeActiveForOrder(orderId: string, tx?: DbTx): Promise<void> {
        const client = tx ?? db;
        await client
            .update(dispatchOffers)
            .set({ status: "revoked", revokedAt: new Date(), respondedAt: new Date() })
            .where(and(eq(dispatchOffers.orderId, orderId), eq(dispatchOffers.status, "offered")));
    }

    async listForOrderAdmin(orderId: string): Promise<
        {
            id: string;
            vendorName: string;
            status: DispatchOffer["status"];
            offeredAt: Date;
            expiresAt: Date;
            respondedAt: Date | null;
            distanceMeters: number | null;
            round: number;
        }[]
    > {
        const rows = await db
            .select({
                id: dispatchOffers.id,
                vendorName: users.name,
                status: dispatchOffers.status,
                offeredAt: dispatchOffers.offeredAt,
                expiresAt: dispatchOffers.expiresAt,
                respondedAt: dispatchOffers.respondedAt,
                distanceMeters: dispatchOffers.distanceMeters,
                round: dispatchOffers.round,
            })
            .from(dispatchOffers)
            .innerJoin(vendors, eq(dispatchOffers.vendorId, vendors.id))
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(eq(dispatchOffers.orderId, orderId))
            .orderBy(asc(dispatchOffers.offeredAt));

        return rows.map((row) => ({
            ...row,
            vendorName: row.vendorName?.trim() || "Vendor",
        }));
    }
}

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    vendorPayoutMethods,
    type NewVendorPayoutMethod,
    type VendorPayoutMethod,
} from "@/modules/payments/payout-methods/vendor-payout-method.schema.js";

export class VendorPayoutMethodRepository {
    async listForVendor(vendorId: string): Promise<VendorPayoutMethod[]> {
        return db
            .select()
            .from(vendorPayoutMethods)
            .where(and(eq(vendorPayoutMethods.vendorId, vendorId), isNull(vendorPayoutMethods.deletedAt)))
            .orderBy(desc(vendorPayoutMethods.isDefault), desc(vendorPayoutMethods.createdAt));
    }

    async findById(id: string): Promise<VendorPayoutMethod | undefined> {
        const [row] = await db
            .select()
            .from(vendorPayoutMethods)
            .where(and(eq(vendorPayoutMethods.id, id), isNull(vendorPayoutMethods.deletedAt)))
            .limit(1);
        return row;
    }

    async findByIdForVendor(id: string, vendorId: string): Promise<VendorPayoutMethod | undefined> {
        const [row] = await db
            .select()
            .from(vendorPayoutMethods)
            .where(
                and(
                    eq(vendorPayoutMethods.id, id),
                    eq(vendorPayoutMethods.vendorId, vendorId),
                    isNull(vendorPayoutMethods.deletedAt),
                ),
            )
            .limit(1);
        return row;
    }

    async create(row: NewVendorPayoutMethod): Promise<VendorPayoutMethod> {
        const [created] = await db.insert(vendorPayoutMethods).values(row).returning();
        if (!created) throw new Error("failed to create payout method");
        return created;
    }

    async clearDefault(vendorId: string): Promise<void> {
        await db
            .update(vendorPayoutMethods)
            .set({ isDefault: false })
            .where(and(eq(vendorPayoutMethods.vendorId, vendorId), isNull(vendorPayoutMethods.deletedAt)));
    }

    async setDefault(id: string, vendorId: string): Promise<VendorPayoutMethod | undefined> {
        await this.clearDefault(vendorId);
        const [updated] = await db
            .update(vendorPayoutMethods)
            .set({ isDefault: true })
            .where(
                and(
                    eq(vendorPayoutMethods.id, id),
                    eq(vendorPayoutMethods.vendorId, vendorId),
                    isNull(vendorPayoutMethods.deletedAt),
                ),
            )
            .returning();
        return updated;
    }

    async softDelete(id: string, vendorId: string): Promise<boolean> {
        const [updated] = await db
            .update(vendorPayoutMethods)
            .set({ deletedAt: new Date(), isDefault: false })
            .where(
                and(
                    eq(vendorPayoutMethods.id, id),
                    eq(vendorPayoutMethods.vendorId, vendorId),
                    isNull(vendorPayoutMethods.deletedAt),
                ),
            )
            .returning();
        return Boolean(updated);
    }
}

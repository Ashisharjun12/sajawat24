import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    customerAddresses,
    type CustomerAddress,
    type NewCustomerAddress,
} from "@/modules/identity/addresses/customer-address.schema.js";

export type CustomerAddressPatch = Partial<
    Pick<
        CustomerAddress,
        | "label"
        | "addressLine"
        | "landmark"
        | "pincode"
        | "cityId"
        | "cityName"
        | "isDefault"
        | "latitude"
        | "longitude"
        | "geoSource"
    >
>;

export class CustomerAddressRepository {
    async listByUser(userId: string): Promise<CustomerAddress[]> {
        return db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.userId, userId))
            .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.updatedAt));
    }

    async findByIdForUser(id: string, userId: string): Promise<CustomerAddress | undefined> {
        const [row] = await db
            .select()
            .from(customerAddresses)
            .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
            .limit(1);
        return row;
    }

    async insert(data: NewCustomerAddress): Promise<CustomerAddress> {
        const [row] = await db.insert(customerAddresses).values(data).returning();
        return row;
    }

    async update(id: string, userId: string, patch: CustomerAddressPatch): Promise<CustomerAddress | undefined> {
        const [row] = await db
            .update(customerAddresses)
            .set({ ...patch, updatedAt: new Date() })
            .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
            .returning();
        return row;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const rows = await db
            .delete(customerAddresses)
            .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
            .returning({ id: customerAddresses.id });
        return rows.length > 0;
    }

    async clearDefaultForUser(userId: string): Promise<void> {
        await db
            .update(customerAddresses)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)));
    }
}

import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    orderFinancials,
    type NewOrderFinancial,
    type OrderFinancial,
} from "@/modules/payments/order-financials/order-financial.schema.js";

export class OrderFinancialRepository {
    async insert(row: NewOrderFinancial): Promise<OrderFinancial> {
        const [created] = await db.insert(orderFinancials).values(row).returning();
        if (!created) throw new Error("failed to snapshot order financials");
        return created;
    }

    async findByOrderId(orderId: string): Promise<OrderFinancial | undefined> {
        const [row] = await db
            .select()
            .from(orderFinancials)
            .where(eq(orderFinancials.orderId, orderId))
            .limit(1);
        return row;
    }
}

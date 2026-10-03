import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    paymentIntents,
    type NewPaymentIntent,
    type PaymentIntent,
} from "@/modules/payments/intents/payment-intent.schema.js";

export interface IPaymentIntentRepository {
    findByOrderId(orderId: string): Promise<PaymentIntent | undefined>;
    create(input: NewPaymentIntent): Promise<PaymentIntent>;
    markPaid(orderId: string, providerPaymentId: string): Promise<PaymentIntent | undefined>;
    markFailed(orderId: string): Promise<PaymentIntent | undefined>;
}

export class PaymentIntentRepository implements IPaymentIntentRepository {
    async findByOrderId(orderId: string): Promise<PaymentIntent | undefined> {
        const [row] = await db
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.orderId, orderId))
            .limit(1);
        return row;
    }

    async create(input: NewPaymentIntent): Promise<PaymentIntent> {
        const [row] = await db.insert(paymentIntents).values(input).returning();
        if (!row) throw new Error("failed to create payment intent");
        return row;
    }

    async markPaid(orderId: string, providerPaymentId: string): Promise<PaymentIntent | undefined> {
        const [row] = await db
            .update(paymentIntents)
            .set({
                status: "paid",
                providerPaymentId,
                updatedAt: new Date(),
            })
            .where(eq(paymentIntents.orderId, orderId))
            .returning();
        return row;
    }

    async markFailed(orderId: string): Promise<PaymentIntent | undefined> {
        const [row] = await db
            .update(paymentIntents)
            .set({
                status: "failed",
                updatedAt: new Date(),
            })
            .where(eq(paymentIntents.orderId, orderId))
            .returning();
        return row;
    }
}

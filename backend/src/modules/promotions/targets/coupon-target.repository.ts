import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    couponTargets,
    type CouponTarget,
    type NewCouponTarget,
} from "@/modules/promotions/targets/coupon-target.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ICouponTargetRepository {
    listByCouponId(couponId: string): Promise<CouponTarget[]>;
    replaceForCoupon(couponId: string, targets: NewCouponTarget[], tx?: DbTx): Promise<void>;
}

export class CouponTargetRepository implements ICouponTargetRepository {
    async listByCouponId(couponId: string): Promise<CouponTarget[]> {
        return db.select().from(couponTargets).where(eq(couponTargets.couponId, couponId));
    }

    async replaceForCoupon(couponId: string, targets: NewCouponTarget[], tx?: DbTx): Promise<void> {
        const client = tx ?? db;
        await client.delete(couponTargets).where(eq(couponTargets.couponId, couponId));
        if (targets.length === 0) return;
        await client.insert(couponTargets).values(targets);
    }
}

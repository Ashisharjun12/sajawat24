import { and, count, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { coupons } from "@/modules/promotions/coupons/coupon.schema.js";
import {
    couponRedemptions,
    type CouponRedemption,
    type NewCouponRedemption,
} from "@/modules/promotions/redemptions/redemption.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RedemptionListRow = {
    id: string;
    couponCode: string;
    orderReference: string;
    customerName: string;
    customerPhone: string;
    discountPaise: number;
    redeemedAt: Date;
};

export interface IRedemptionRepository {
    countForCoupon(couponId: string, tx?: DbTx): Promise<number>;
    countForCouponByUser(couponId: string, userId: string, tx?: DbTx): Promise<number>;
    insert(data: NewCouponRedemption, tx?: DbTx): Promise<CouponRedemption>;
    listAdmin(
        pagination: PaginationQuery,
        filter?: { q?: string },
    ): Promise<{ items: RedemptionListRow[]; total: number }>;
    sumDiscountSince(since: Date): Promise<number>;
    topCouponByUses(): Promise<{ code: string; uses: number } | null>;
    countAll(): Promise<number>;
}

export class RedemptionRepository implements IRedemptionRepository {
    async countForCoupon(couponId: string, tx?: DbTx): Promise<number> {
        const client = tx ?? db;
        const [row] = await client
            .select({ value: count() })
            .from(couponRedemptions)
            .where(eq(couponRedemptions.couponId, couponId));
        return Number(row?.value ?? 0);
    }

    async countForCouponByUser(couponId: string, userId: string, tx?: DbTx): Promise<number> {
        const client = tx ?? db;
        const [row] = await client
            .select({ value: count() })
            .from(couponRedemptions)
            .where(
                and(eq(couponRedemptions.couponId, couponId), eq(couponRedemptions.userId, userId)),
            );
        return Number(row?.value ?? 0);
    }

    async insert(data: NewCouponRedemption, tx?: DbTx): Promise<CouponRedemption> {
        const client = tx ?? db;
        const [row] = await client.insert(couponRedemptions).values(data).returning();
        if (!row) throw new Error("failed to create redemption");
        return row;
    }

    async listAdmin(
        pagination: PaginationQuery,
        filter: { q?: string } = {},
    ): Promise<{ items: RedemptionListRow[]; total: number }> {
        const q = filter.q?.trim();
        const conditions: SQL[] = [];
        if (q) {
            const pattern = `%${q.replace(/[%_\\]/g, "")}%`;
            const match = or(
                ilike(couponRedemptions.code, pattern),
                ilike(orders.reference, pattern),
                ilike(orders.customerName, pattern),
                ilike(orders.customerPhone, pattern),
            );
            if (match) conditions.push(match);
        }
        const where = conditions.length ? and(...conditions) : undefined;

        const [totalRow] = await db
            .select({ value: count() })
            .from(couponRedemptions)
            .innerJoin(orders, eq(couponRedemptions.orderId, orders.id))
            .where(where);

        const rows = await db
            .select({
                id: couponRedemptions.id,
                couponCode: couponRedemptions.code,
                orderReference: orders.reference,
                customerName: orders.customerName,
                customerPhone: orders.customerPhone,
                discountPaise: couponRedemptions.discountPaise,
                redeemedAt: couponRedemptions.redeemedAt,
            })
            .from(couponRedemptions)
            .innerJoin(orders, eq(couponRedemptions.orderId, orders.id))
            .where(where)
            .orderBy(desc(couponRedemptions.redeemedAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        return { items: rows, total: Number(totalRow?.value ?? 0) };
    }

    async sumDiscountSince(since: Date): Promise<number> {
        const [row] = await db
            .select({ value: sql<number>`coalesce(sum(${couponRedemptions.discountPaise}), 0)` })
            .from(couponRedemptions)
            .where(gte(couponRedemptions.redeemedAt, since));
        return Number(row?.value ?? 0);
    }

    async topCouponByUses(): Promise<{ code: string; uses: number } | null> {
        const rows = await db
            .select({
                code: coupons.code,
                uses: count(),
            })
            .from(couponRedemptions)
            .innerJoin(coupons, eq(couponRedemptions.couponId, coupons.id))
            .groupBy(coupons.code)
            .orderBy(desc(count()))
            .limit(1);
        const top = rows[0];
        if (!top) return null;
        return { code: top.code, uses: Number(top.uses) };
    }

    async countAll(): Promise<number> {
        const [row] = await db.select({ value: count() }).from(couponRedemptions);
        return Number(row?.value ?? 0);
    }
}

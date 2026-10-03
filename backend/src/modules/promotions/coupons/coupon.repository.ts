import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { couponRedemptions } from "@/modules/promotions/redemptions/redemption.schema.js";
import { coupons, type Coupon, type NewCoupon } from "@/modules/promotions/coupons/coupon.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CouponPatch = Partial<
    Pick<
        Coupon,
        | "code"
        | "name"
        | "description"
        | "type"
        | "valuePaise"
        | "percentBps"
        | "maxDiscountPaise"
        | "minOrderPaise"
        | "maxUses"
        | "maxUsesPerUser"
        | "cityId"
        | "scope"
        | "firstOrderOnly"
        | "allowedPaymentMethods"
        | "isActive"
        | "startsAt"
        | "endsAt"
    >
>;

export type CouponWithMeta = Coupon & {
    cityName: string | null;
    usedCount: number;
};

export interface ICouponRepository {
    findById(id: string): Promise<Coupon | undefined>;
    findByCode(code: string, tx?: DbTx): Promise<Coupon | undefined>;
    findByIdForUpdate(id: string, tx: DbTx): Promise<Coupon | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: { q?: string },
    ): Promise<{ items: CouponWithMeta[]; total: number }>;
    countActive(): Promise<number>;
    listCurrentlyActive(): Promise<CouponWithMeta[]>;
    insert(data: NewCoupon, tx?: DbTx): Promise<Coupon>;
    update(id: string, data: CouponPatch, tx?: DbTx): Promise<Coupon | undefined>;
}

function listWhere(filter: { q?: string } = {}): SQL | undefined {
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (!q) return undefined;
    const pattern = `%${q}%`;
    return or(ilike(coupons.code, pattern), ilike(coupons.name, pattern));
}

export class CouponRepository implements ICouponRepository {
    async findById(id: string): Promise<Coupon | undefined> {
        const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
        return row;
    }

    async findByCode(code: string, tx?: DbTx): Promise<Coupon | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .select()
            .from(coupons)
            .where(eq(coupons.code, code.toUpperCase()))
            .limit(1);
        return row;
    }

    async findByIdForUpdate(id: string, tx: DbTx): Promise<Coupon | undefined> {
        const [row] = await tx
            .select()
            .from(coupons)
            .where(eq(coupons.id, id))
            .for("update")
            .limit(1);
        return row;
    }

    async list(
        pagination: PaginationQuery,
        filter: { q?: string } = {},
    ): Promise<{ items: CouponWithMeta[]; total: number }> {
        const where = listWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(coupons).where(where);

        const usedCountSq = db
            .select({
                couponId: couponRedemptions.couponId,
                usedCount: count().as("used_count"),
            })
            .from(couponRedemptions)
            .groupBy(couponRedemptions.couponId)
            .as("usage");

        const rows = await db
            .select({
                coupon: coupons,
                cityName: cities.name,
                usedCount: sql<number>`coalesce(${usedCountSq.usedCount}, 0)`,
            })
            .from(coupons)
            .leftJoin(cities, eq(coupons.cityId, cities.id))
            .leftJoin(usedCountSq, eq(coupons.id, usedCountSq.couponId))
            .where(where)
            .orderBy(desc(coupons.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        return {
            items: rows.map((row) => ({
                ...row.coupon,
                cityName: row.cityName,
                usedCount: Number(row.usedCount),
            })),
            total: Number(totalRow?.value ?? 0),
        };
    }

    async countActive(): Promise<number> {
        const now = new Date();
        const [row] = await db
            .select({ value: count() })
            .from(coupons)
            .where(
                and(
                    eq(coupons.isActive, true),
                    sql`${coupons.startsAt} <= ${now}`,
                    sql`${coupons.endsAt} >= ${now}`,
                ),
            );
        return Number(row?.value ?? 0);
    }

    async listCurrentlyActive(): Promise<CouponWithMeta[]> {
        const now = new Date();
        const timeWhere = and(
            eq(coupons.isActive, true),
            sql`${coupons.startsAt} <= ${now}`,
            sql`${coupons.endsAt} >= ${now}`,
        );

        const usedCountSq = db
            .select({
                couponId: couponRedemptions.couponId,
                usedCount: count().as("used_count"),
            })
            .from(couponRedemptions)
            .groupBy(couponRedemptions.couponId)
            .as("usage");

        const rows = await db
            .select({
                coupon: coupons,
                cityName: cities.name,
                usedCount: sql<number>`coalesce(${usedCountSq.usedCount}, 0)`,
            })
            .from(coupons)
            .leftJoin(cities, eq(coupons.cityId, cities.id))
            .leftJoin(usedCountSq, eq(coupons.id, usedCountSq.couponId))
            .where(timeWhere)
            .orderBy(desc(coupons.createdAt));

        return rows.map((row) => ({
            ...row.coupon,
            cityName: row.cityName,
            usedCount: Number(row.usedCount),
        }));
    }

    async insert(data: NewCoupon, tx?: DbTx): Promise<Coupon> {
        const client = tx ?? db;
        const [row] = await client.insert(coupons).values(data).returning();
        if (!row) throw new Error("failed to create coupon");
        return row;
    }

    async update(id: string, data: CouponPatch, tx?: DbTx): Promise<Coupon | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(coupons)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(coupons.id, id))
            .returning();
        return row;
    }
}

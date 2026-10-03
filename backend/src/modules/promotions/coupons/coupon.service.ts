import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination, type Paginated } from "@/shared/http/pagination.js";
import { deriveCouponStatus } from "@/modules/promotions/lib/coupon-status.js";
import {
    buildCouponEligibilitySummary,
    type CouponTargetLabel,
} from "@/modules/promotions/lib/coupon-summary.js";
import { resolveCouponTargetLabels } from "@/modules/promotions/targets/coupon-target.resolver.js";
import type {
    CreateCouponInput,
    ListCouponsQuery,
    ListRedemptionsQuery,
    PatchCouponInput,
} from "@/modules/promotions/coupons/coupon.dto.js";
import type { ICouponRepository } from "@/modules/promotions/coupons/coupon.repository.js";
import type { ICouponTargetRepository } from "@/modules/promotions/targets/coupon-target.repository.js";
import type { IRedemptionRepository } from "@/modules/promotions/redemptions/redemption.repository.js";
import type { CouponTarget } from "@/modules/promotions/targets/coupon-target.schema.js";

export type PublicCoupon = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    eligibilitySummary: string;
    type: "flat" | "percent";
    valuePaise: number | null;
    percentBps: number | null;
    maxDiscountPaise: number | null;
    minOrderPaise: number;
    maxUses: number;
    usedCount: number;
    maxUsesPerUser: number;
    cityId: string | null;
    cityName: string | null;
    scope: "entire_cart" | "products" | "categories";
    targetIds: string[];
    targets: CouponTargetLabel[];
    firstOrderOnly: boolean;
    allowedPaymentMethods: string[];
    status: ReturnType<typeof deriveCouponStatus>;
    startsAt: string;
    endsAt: string;
    createdAt: string;
};

export type PublicRedemption = {
    id: string;
    couponCode: string;
    orderReference: string;
    customerName: string;
    customerPhone: string;
    discountPaise: number;
    redeemedAt: string;
};

export type PromotionsOverview = {
    activeCoupons: number;
    totalRedemptions: number;
    discountThisMonthPaise: number;
    topCoupon: { code: string; uses: number } | null;
};

function toTargetRows(
    couponId: string,
    scope: PublicCoupon["scope"],
    targetIds: string[] | undefined,
): { couponId: string; targetType: "product" | "category"; targetId: string }[] {
    if (scope === "entire_cart" || !targetIds?.length) return [];
    const targetType = scope === "products" ? "product" : "category";
    return targetIds.map((targetId) => ({ couponId, targetType, targetId }));
}

async function mapCoupon(
    row: Awaited<ReturnType<ICouponRepository["list"]>>["items"][number],
    targets: CouponTarget[],
): Promise<PublicCoupon> {
    const targetLabels = await resolveCouponTargetLabels(row.scope, targets);
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        eligibilitySummary: buildCouponEligibilitySummary(row, {
            cityName: row.cityName ?? (row.cityId ? null : "All cities"),
            targets: targetLabels,
        }),
        type: row.type,
        valuePaise: row.valuePaise,
        percentBps: row.percentBps,
        maxDiscountPaise: row.maxDiscountPaise,
        minOrderPaise: row.minOrderPaise,
        maxUses: row.maxUses,
        usedCount: row.usedCount,
        maxUsesPerUser: row.maxUsesPerUser,
        cityId: row.cityId,
        cityName: row.cityName ?? (row.cityId ? null : "All cities"),
        scope: row.scope,
        targetIds: targets.map((t) => t.targetId),
        targets: targetLabels,
        firstOrderOnly: row.firstOrderOnly,
        allowedPaymentMethods: row.allowedPaymentMethods,
        status: deriveCouponStatus(row),
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
    };
}

export class CouponAdminService {
    constructor(
        private readonly coupons: ICouponRepository,
        private readonly targets: ICouponTargetRepository,
        private readonly redemptions: IRedemptionRepository,
    ) {}

    async getOverview(): Promise<PromotionsOverview> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [activeCoupons, totalRedemptions, discountThisMonthPaise, topCoupon] = await Promise.all([
            this.coupons.countActive(),
            this.redemptions.countAll(),
            this.redemptions.sumDiscountSince(startOfMonth),
            this.redemptions.topCouponByUses(),
        ]);

        return { activeCoupons, totalRedemptions, discountThisMonthPaise, topCoupon };
    }

    async list(query: ListCouponsQuery): Promise<Paginated<PublicCoupon>> {
        const pagination = parsePagination(query);
        const { items, total } = await this.coupons.list(pagination, { q: query.q });
        const mapped = await Promise.all(
            items.map(async (item) => {
                const targetRows = await this.targets.listByCouponId(item.id);
                return mapCoupon(item, targetRows);
            }),
        );
        return { items: mapped, total, page: pagination.page, limit: pagination.limit };
    }

    async create(input: CreateCouponInput): Promise<PublicCoupon> {
        const existing = await this.coupons.findByCode(input.code);
        if (existing) {
            throw ApiError.conflict("coupon code already exists");
        }

        const created = await db.transaction(async (tx) => {
            const coupon = await this.coupons.insert(
                {
                    code: input.code,
                    name: input.name,
                    description: input.description ?? null,
                    type: input.type,
                    valuePaise: input.type === "flat" ? input.valuePaise! : null,
                    percentBps: input.type === "percent" ? input.percentBps! : null,
                    maxDiscountPaise: input.maxDiscountPaise ?? null,
                    minOrderPaise: input.minOrderPaise,
                    maxUses: input.maxUses,
                    maxUsesPerUser: input.maxUsesPerUser,
                    cityId: input.cityId ?? null,
                    scope: input.scope,
                    firstOrderOnly: input.firstOrderOnly,
                    allowedPaymentMethods: input.allowedPaymentMethods,
                    isActive: input.isActive,
                    startsAt: input.startsAt,
                    endsAt: input.endsAt,
                },
                tx,
            );
            await this.targets.replaceForCoupon(
                coupon.id,
                toTargetRows(coupon.id, input.scope, input.targetIds),
                tx,
            );
            return coupon;
        });

        const targetRows = await this.targets.listByCouponId(created.id);
        return mapCoupon({ ...created, cityName: null, usedCount: 0 }, targetRows);
    }

    async patch(id: string, input: PatchCouponInput): Promise<PublicCoupon> {
        const existing = await this.coupons.findById(id);
        if (!existing) {
            throw ApiError.notFound("coupon not found");
        }

        if (input.code && input.code !== existing.code) {
            const clash = await this.coupons.findByCode(input.code);
            if (clash) throw ApiError.conflict("coupon code already exists");
        }

        const nextType = input.type ?? existing.type;
        const nextScope = input.scope ?? existing.scope;

        await db.transaction(async (tx) => {
            await this.coupons.update(
                id,
                {
                    ...(input.code !== undefined ? { code: input.code } : {}),
                    ...(input.name !== undefined ? { name: input.name } : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                    ...(input.type !== undefined ? { type: input.type } : {}),
                    ...(input.valuePaise !== undefined ? { valuePaise: input.valuePaise } : {}),
                    ...(input.percentBps !== undefined ? { percentBps: input.percentBps } : {}),
                    ...(input.maxDiscountPaise !== undefined
                        ? { maxDiscountPaise: input.maxDiscountPaise }
                        : {}),
                    ...(input.minOrderPaise !== undefined ? { minOrderPaise: input.minOrderPaise } : {}),
                    ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
                    ...(input.maxUsesPerUser !== undefined
                        ? { maxUsesPerUser: input.maxUsesPerUser }
                        : {}),
                    ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
                    ...(input.scope !== undefined ? { scope: input.scope } : {}),
                    ...(input.firstOrderOnly !== undefined
                        ? { firstOrderOnly: input.firstOrderOnly }
                        : {}),
                    ...(input.allowedPaymentMethods !== undefined
                        ? { allowedPaymentMethods: input.allowedPaymentMethods }
                        : {}),
                    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
                    ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
                    ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
                    ...(nextType === "flat"
                        ? { percentBps: null }
                        : input.type === "percent"
                          ? { valuePaise: null }
                          : {}),
                },
                tx,
            );

            if (input.targetIds !== undefined || input.scope !== undefined) {
                await this.targets.replaceForCoupon(
                    id,
                    toTargetRows(id, nextScope, input.targetIds ?? []),
                    tx,
                );
            }
        });

        const { items } = await this.coupons.list({ page: 1, limit: 1 }, { q: existing.code });
        const row = items.find((c) => c.id === id);
        if (!row) throw ApiError.notFound("coupon not found");
        const targetRows = await this.targets.listByCouponId(id);
        return mapCoupon(row, targetRows);
    }

    async setStatus(id: string, isActive: boolean): Promise<PublicCoupon> {
        const updated = await this.coupons.update(id, { isActive });
        if (!updated) throw ApiError.notFound("coupon not found");
        const { items } = await this.coupons.list({ page: 1, limit: 1 }, { q: updated.code });
        const row = items.find((c) => c.id === id);
        if (!row) throw ApiError.notFound("coupon not found");
        const targetRows = await this.targets.listByCouponId(id);
        return mapCoupon(row, targetRows);
    }

    async listRedemptions(query: ListRedemptionsQuery): Promise<Paginated<PublicRedemption>> {
        const pagination = parsePagination(query);
        const { items, total } = await this.redemptions.listAdmin(pagination, { q: query.q });
        return {
            items: items.map((row) => ({
                id: row.id,
                couponCode: row.couponCode,
                orderReference: row.orderReference,
                customerName: row.customerName,
                customerPhone: row.customerPhone,
                discountPaise: row.discountPaise,
                redeemedAt: row.redeemedAt.toISOString(),
            })),
            total,
            page: pagination.page,
            limit: pagination.limit,
        };
    }
}

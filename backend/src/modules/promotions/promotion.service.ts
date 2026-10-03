import { and, count, eq, notInArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { Coupon } from "@/modules/promotions/coupons/coupon.schema.js";
import type { ICouponRepository } from "@/modules/promotions/coupons/coupon.repository.js";
import type { ICouponTargetRepository } from "@/modules/promotions/targets/coupon-target.repository.js";
import type { IRedemptionRepository } from "@/modules/promotions/redemptions/redemption.repository.js";
import type { CouponTarget } from "@/modules/promotions/targets/coupon-target.schema.js";
import { buildCouponEligibilitySummary } from "@/modules/promotions/lib/coupon-summary.js";
import { resolveCouponTargetLabels } from "@/modules/promotions/targets/coupon-target.resolver.js";
import { getActiveCityById } from "@/modules/geo/index.js";

const NON_COUNTED_ORDER_STATUSES = ["CANCELLED", "DRAFT"] as const;

export type PromotionLine = {
    productId: string;
    categoryId: string;
    lineTotalPaise: number;
};

export type ValidateCouponInput = {
    code: string;
    cityId: string | null;
    subtotalPaise: number;
    lines: PromotionLine[];
    userId?: string;
    paymentMethod?: "online" | "cod";
    requirePaymentMethod?: boolean;
};

export type ValidatedCoupon = {
    coupon: Coupon;
    targets: CouponTarget[];
    discountPaise: number;
    eligibleSubtotalPaise: number;
};

export type PublicAvailableCoupon = {
    code: string;
    name: string;
    description: string | null;
    eligibilitySummary: string;
    appliesToProduct?: boolean;
};

export class PromotionService {
    constructor(
        private readonly coupons: ICouponRepository,
        private readonly targets: ICouponTargetRepository,
        private readonly redemptions: IRedemptionRepository,
    ) {}

    async validateAndCompute(input: ValidateCouponInput): Promise<ValidatedCoupon> {
        const coupon = await this.coupons.findByCode(input.code);
        if (!coupon) {
            throw ApiError.badRequest("invalid coupon code");
        }

        const targets = await this.targets.listByCouponId(coupon.id);
        this.assertCouponRules(coupon, targets, input);

        if (input.userId) {
            await this.assertUsageLimits(coupon, input.userId);
        }

        const eligibleSubtotalPaise = this.computeEligibleSubtotal(coupon, targets, input.lines);
        if (eligibleSubtotalPaise < coupon.minOrderPaise) {
            throw ApiError.badRequest("order does not meet minimum value for this coupon");
        }

        const discountPaise = this.computeDiscountPaise(coupon, eligibleSubtotalPaise);
        if (discountPaise <= 0) {
            throw ApiError.badRequest("coupon does not apply to this cart");
        }

        return { coupon, targets, discountPaise, eligibleSubtotalPaise };
    }

    async listAvailableForProduct(input: {
        productId: string;
        categoryId: string;
        cityId: string;
    }): Promise<PublicAvailableCoupon[]> {
        const items = await this.listAvailableForCity({
            cityId: input.cityId,
            productId: input.productId,
            categoryId: input.categoryId,
            productScopeOnly: true,
        });
        return items.filter((item) => item.appliesToProduct);
    }

    async listAvailableForCity(input: {
        cityId: string;
        productId?: string;
        categoryId?: string;
        productScopeOnly?: boolean;
    }): Promise<PublicAvailableCoupon[]> {
        const city = await getActiveCityById(input.cityId);
        const rows = await this.coupons.listCurrentlyActive();
        const results: PublicAvailableCoupon[] = [];

        for (const row of rows) {
            if (row.usedCount >= row.maxUses) continue;
            if (row.cityId && row.cityId !== input.cityId) continue;

            const targets = await this.targets.listByCouponId(row.id);
            const applies =
                input.productId && input.categoryId
                    ? this.couponAppliesToProduct(
                          row,
                          targets,
                          input.productId,
                          input.categoryId,
                      )
                    : undefined;

            if (input.productScopeOnly && !applies) continue;

            const targetLabels = await resolveCouponTargetLabels(row.scope, targets);
            results.push({
                code: row.code,
                name: row.name,
                description: row.description,
                eligibilitySummary: buildCouponEligibilitySummary(row, {
                    cityName: row.cityName ?? city.name,
                    targets: targetLabels,
                }),
                appliesToProduct: applies,
            });
        }

        return results;
    }

    private couponAppliesToProduct(
        coupon: Coupon,
        targets: CouponTarget[],
        productId: string,
        categoryId: string,
    ): boolean {
        if (coupon.scope === "entire_cart") return true;
        if (targets.length === 0) return false;

        const targetIds = new Set(targets.map((t) => t.targetId));
        if (coupon.scope === "products") {
            return targetIds.has(productId);
        }
        if (coupon.scope === "categories") {
            return targetIds.has(categoryId);
        }
        return false;
    }

    async validateAppliedCoupon(
        couponId: string,
        input: Omit<ValidateCouponInput, "code">,
    ): Promise<ValidatedCoupon> {
        const coupon = await this.coupons.findById(couponId);
        if (!coupon) {
            throw ApiError.badRequest("applied coupon is no longer valid");
        }
        const targets = await this.targets.listByCouponId(coupon.id);
        this.assertCouponRules(coupon, targets, { ...input, code: coupon.code });

        if (input.userId) {
            await this.assertUsageLimits(coupon, input.userId);
        }

        const eligibleSubtotalPaise = this.computeEligibleSubtotal(coupon, targets, input.lines);
        if (eligibleSubtotalPaise < coupon.minOrderPaise) {
            throw ApiError.badRequest("order does not meet minimum value for this coupon");
        }
        const discountPaise = this.computeDiscountPaise(coupon, eligibleSubtotalPaise);
        if (discountPaise <= 0) {
            throw ApiError.badRequest("coupon does not apply to this cart");
        }
        return { coupon, targets, discountPaise, eligibleSubtotalPaise };
    }

    private assertCouponRules(
        coupon: Coupon,
        targets: CouponTarget[],
        input: ValidateCouponInput,
    ): void {
        if (!coupon.isActive) {
            throw ApiError.badRequest("coupon is not active");
        }

        const now = new Date();
        if (coupon.startsAt > now) {
            throw ApiError.badRequest("coupon is not valid yet");
        }
        if (coupon.endsAt < now) {
            throw ApiError.badRequest("coupon has expired");
        }

        if (coupon.cityId && coupon.cityId !== input.cityId) {
            throw ApiError.badRequest("coupon is not valid in this city");
        }

        if (coupon.scope !== "entire_cart" && targets.length === 0) {
            throw ApiError.badRequest("coupon is misconfigured");
        }

        if (input.requirePaymentMethod && !input.paymentMethod) {
            throw ApiError.badRequest("select a payment method to use this coupon");
        }

        if (input.paymentMethod && !coupon.allowedPaymentMethods.includes(input.paymentMethod)) {
            const onlineOnly = coupon.allowedPaymentMethods.length === 1 && coupon.allowedPaymentMethods[0] === "online";
            const codOnly = coupon.allowedPaymentMethods.length === 1 && coupon.allowedPaymentMethods[0] === "cod";
            if (onlineOnly) {
                throw ApiError.badRequest("coupon is valid for online payment only");
            }
            if (codOnly) {
                throw ApiError.badRequest("coupon is valid for cash on delivery only");
            }
            throw ApiError.badRequest("coupon is not valid for this payment method");
        }
    }

    async assertUsageLimits(coupon: Coupon, userId: string, tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]): Promise<void> {
        const totalUses = await this.redemptions.countForCoupon(coupon.id, tx);
        if (totalUses >= coupon.maxUses) {
            throw ApiError.badRequest("coupon usage limit reached");
        }

        const userUses = await this.redemptions.countForCouponByUser(coupon.id, userId, tx);
        if (userUses >= coupon.maxUsesPerUser) {
            throw ApiError.badRequest("you have already used this coupon");
        }

        if (coupon.firstOrderOnly) {
            const priorOrders = await this.countPriorOrders(userId, tx);
            if (priorOrders > 0) {
                throw ApiError.badRequest("coupon is valid for first order only");
            }
        }
    }

    private async countPriorOrders(
        userId: string,
        tx?: Parameters<Parameters<typeof db.transaction>[0]>[0],
    ): Promise<number> {
        const client = tx ?? db;
        const [row] = await client
            .select({ value: count() })
            .from(orders)
            .where(
                and(eq(orders.userId, userId), notInArray(orders.status, [...NON_COUNTED_ORDER_STATUSES])),
            );
        return Number(row?.value ?? 0);
    }

    computeEligibleSubtotal(
        coupon: Coupon,
        targets: CouponTarget[],
        lines: PromotionLine[],
    ): number {
        if (coupon.scope === "entire_cart") {
            return lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
        }

        const targetIds = new Set(targets.map((t) => t.targetId));
        return lines.reduce((sum, line) => {
            const matches =
                coupon.scope === "products"
                    ? targetIds.has(line.productId)
                    : targetIds.has(line.categoryId);
            return matches ? sum + line.lineTotalPaise : sum;
        }, 0);
    }

    computeDiscountPaise(coupon: Coupon, eligibleSubtotalPaise: number): number {
        if (eligibleSubtotalPaise <= 0) return 0;

        if (coupon.type === "flat") {
            const value = coupon.valuePaise ?? 0;
            return Math.min(value, eligibleSubtotalPaise);
        }

        const percentBps = coupon.percentBps ?? 0;
        let discount = Math.floor((eligibleSubtotalPaise * percentBps) / 10000);
        if (coupon.maxDiscountPaise != null) {
            discount = Math.min(discount, coupon.maxDiscountPaise);
        }
        return Math.min(discount, eligibleSubtotalPaise);
    }
}

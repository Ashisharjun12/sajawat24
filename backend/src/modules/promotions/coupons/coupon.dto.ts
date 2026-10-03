import { z } from "zod";

const paymentMethodSchema = z.enum(["online", "cod"]);
const scopeSchema = z.enum(["entire_cart", "products", "categories"]);

const couponBaseSchema = z.object({
    code: z
        .string()
        .trim()
        .min(3)
        .max(24)
        .transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().max(1000).optional().nullable(),
    type: z.enum(["flat", "percent"]),
    valuePaise: z.number().int().positive().optional(),
    percentBps: z.number().int().min(100).max(10000).optional(),
    maxDiscountPaise: z.number().int().positive().optional().nullable(),
    minOrderPaise: z.number().int().nonnegative().default(0),
    maxUses: z.number().int().positive(),
    maxUsesPerUser: z.number().int().positive(),
    cityId: z.string().uuid().nullable().optional(),
    scope: scopeSchema.default("entire_cart"),
    targetIds: z.array(z.string().uuid()).optional(),
    firstOrderOnly: z.boolean().default(false),
    allowedPaymentMethods: z.array(paymentMethodSchema).min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isActive: z.boolean().default(true),
});

function refineCreateCoupon(
    value: z.infer<typeof couponBaseSchema>,
    ctx: z.RefinementCtx,
): void {
    if (value.type === "flat" && !value.valuePaise) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "valuePaise is required for flat coupons",
            path: ["valuePaise"],
        });
    }
    if (value.type === "percent" && !value.percentBps) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "percentBps is required for percent coupons",
            path: ["percentBps"],
        });
    }
    if (value.endsAt <= value.startsAt) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endsAt must be after startsAt",
            path: ["endsAt"],
        });
    }
    if (value.scope !== "entire_cart" && (!value.targetIds || value.targetIds.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "targetIds required for scoped coupons",
            path: ["targetIds"],
        });
    }
}

function refinePatchCoupon(
    value: Partial<z.infer<typeof couponBaseSchema>>,
    ctx: z.RefinementCtx,
): void {
    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endsAt must be after startsAt",
            path: ["endsAt"],
        });
    }
    if (
        value.scope &&
        value.scope !== "entire_cart" &&
        value.targetIds !== undefined &&
        value.targetIds.length === 0
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "targetIds required for scoped coupons",
            path: ["targetIds"],
        });
    }
    if (value.type === "flat" && value.valuePaise === undefined && "type" in value) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "valuePaise is required when setting type to flat",
            path: ["valuePaise"],
        });
    }
    if (value.type === "percent" && value.percentBps === undefined && "type" in value) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "percentBps is required when setting type to percent",
            path: ["percentBps"],
        });
    }
}

export const createCouponDto = couponBaseSchema.superRefine(refineCreateCoupon);

export const patchCouponDto = couponBaseSchema.partial().superRefine(refinePatchCoupon);

export const couponIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const listCouponsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
});

export const patchCouponStatusDto = z.object({
    isActive: z.boolean(),
});

export const listRedemptionsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
});

export const applyCartCouponDto = z.object({
    code: z.string().trim().min(3).max(24).transform((v) => v.toUpperCase()),
});

export const availableCouponsQueryDto = z
    .object({
        productId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        cityId: z.string().uuid().optional(),
        pincode: z.string().trim().optional(),
        scope: z.enum(["product", "city"]).optional(),
    })
    .refine((value) => Boolean(value.pincode?.trim()) || Boolean(value.cityId), {
        message: "pincode or cityId is required",
    })
    .refine(
        (value) =>
            (Boolean(value.productId) && Boolean(value.categoryId)) ||
            (!value.productId && !value.categoryId),
        { message: "productId and categoryId must be sent together" },
    );

export type CreateCouponInput = z.infer<typeof createCouponDto>;
export type PatchCouponInput = z.infer<typeof patchCouponDto>;
export type ListCouponsQuery = z.infer<typeof listCouponsQueryDto>;
export type ListRedemptionsQuery = z.infer<typeof listRedemptionsQueryDto>;

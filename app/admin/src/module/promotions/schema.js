import { z } from "zod"

export const promotionFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(24, "Code must be at most 24 characters")
      .transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    description: z.string().trim().max(1000, "Description is too long").optional(),
    type: z.enum(["flat", "percent"]),
    valuePaise: z.number().int().positive().optional(),
    percent: z.number().min(1).max(100).optional(),
    maxDiscountPaise: z.number().int().positive().optional().nullable(),
    minOrderPaise: z.number().int().nonnegative(),
    maxUses: z.number().int().positive("Max uses must be at least 1"),
    maxUsesPerUser: z.number().int().positive("Per-user limit must be at least 1"),
    cityId: z.string(),
    scope: z.enum(["entire_cart", "products", "categories"]),
    targetIds: z.array(z.string().uuid()).default([]),
    targetLabels: z
      .array(z.object({ id: z.string().uuid(), name: z.string() }))
      .default([]),
    firstOrderOnly: z.boolean(),
    paymentOnline: z.boolean(),
    paymentCod: z.boolean(),
    startsAt: z.string().min(1, "Start date is required"),
    endsAt: z.string().min(1, "End date is required"),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "flat" && !value.valuePaise) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a discount amount",
        path: ["valuePaise"],
      })
    }
    if (value.type === "percent" && !value.percent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a discount percent",
        path: ["percent"],
      })
    }
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["endsAt"],
      })
    }
    if (!value.paymentOnline && !value.paymentCod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one payment method",
        path: ["paymentOnline"],
      })
    }
    if (value.scope !== "entire_cart" && value.targetIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one target",
        path: ["targetIds"],
      })
    }
  })

export function buildApiPayload(values) {
  const allowedPaymentMethods = []
  if (values.paymentOnline) allowedPaymentMethods.push("online")
  if (values.paymentCod) allowedPaymentMethods.push("cod")

  return {
    code: values.code,
    name: values.name,
    description: values.description?.trim() ? values.description.trim() : null,
    type: values.type,
    valuePaise: values.type === "flat" ? values.valuePaise : undefined,
    percentBps: values.type === "percent" ? Math.round(values.percent * 100) : undefined,
    maxDiscountPaise:
      values.type === "percent" ? values.maxDiscountPaise ?? null : null,
    minOrderPaise: values.minOrderPaise,
    maxUses: values.maxUses,
    maxUsesPerUser: values.maxUsesPerUser,
    cityId: values.cityId === "all" ? null : values.cityId,
    scope: values.scope,
    targetIds: values.scope === "entire_cart" ? [] : values.targetIds,
    firstOrderOnly: values.firstOrderOnly,
    allowedPaymentMethods,
    startsAt: `${values.startsAt}T00:00:00.000Z`,
    endsAt: `${values.endsAt}T23:59:59.000Z`,
    isActive: values.isActive,
  }
}

import { z } from "zod";

const indianMobile = z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "invalid phone number");

const adminCreateOrderCustomerDto = z.object({
    name: z.string().trim().min(2).max(120),
    phone: indianMobile,
    email: z.string().trim().email().max(254).optional(),
});

const adminCreateOrderDeliveryDto = z.object({
    pincode: z.string().trim().regex(/^\d{6}$/),
    address: z.string().trim().min(6).max(500),
    landmark: z.string().trim().max(200).optional(),
    cityId: z.string().uuid(),
});

const adminCreateOrderSharedDto = z.object({
    customer: adminCreateOrderCustomerDto,
    delivery: adminCreateOrderDeliveryDto,
    scheduledAt: z.string().datetime({ offset: true }),
    paymentMethod: z.enum(["prepaid", "cod"]),
    adminNotes: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().trim().min(8).max(128),
});

const adminCatalogLineDto = z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(10),
    addonIds: z.array(z.string().uuid()).default([]),
});

const adminCustomLineDto = z.object({
    name: z.string().trim().min(2).max(120),
    pricePaise: z.coerce.number().int().positive().max(50_000_000),
    imageUploadId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export const adminCreateOrderDto = z.discriminatedUnion("orderKind", [
    adminCreateOrderSharedDto.extend({
        orderKind: z.literal("catalog"),
        items: z.array(adminCatalogLineDto).min(1).max(5),
    }),
    adminCreateOrderSharedDto.extend({
        orderKind: z.literal("custom"),
        customLine: adminCustomLineDto,
    }),
]);

export type AdminCreateOrderInput = z.infer<typeof adminCreateOrderDto>;

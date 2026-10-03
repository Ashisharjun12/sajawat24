import { z } from "zod";

const indianMobile = z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "invalid phone number");

export const createOrderDto = z.object({
    customer: z.object({
        name: z.string().trim().min(2).max(120),
        phone: indianMobile,
        email: z.string().trim().email().max(254),
    }),
    delivery: z.object({
        pincode: z.string().trim().regex(/^\d{6}$/),
        address: z.string().trim().min(6).max(500),
        landmark: z.string().trim().max(200).optional(),
        cityId: z.string().uuid(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
    }),
    paymentMethod: z.enum(["cod", "online"]),
    idempotencyKey: z.string().trim().min(8).max(128),
});

export const orderIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const userOrderListBucketEnum = z.enum(["all", "upcoming", "completed", "cancelled"]);

export const listOrdersQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    bucket: userOrderListBucketEnum.optional(),
});

export type UserOrderListBucket = z.infer<typeof userOrderListBucketEnum>;
export type ListOrdersQuery = z.infer<typeof listOrdersQueryDto>;

export const adminOrderListQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
    status: z.string().trim().optional(),
    cityId: z.string().uuid().optional(),
    paymentMethod: z.enum(["COD", "ONLINE", "PREPAID"]).optional(),
    sort: z.enum(["scheduled_at", "created_at"]).optional(),
    needsAssign: z.enum(["true", "false"]).optional(),
    fulfillmentType: z.enum(["scheduled", "instant"]).optional(),
    dispatchStatus: z
        .enum(["idle", "searching", "offering", "accepted", "exhausted", "cancelled"])
        .optional(),
    userId: z.string().uuid().optional(),
    vendorId: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderDto>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQueryDto>;

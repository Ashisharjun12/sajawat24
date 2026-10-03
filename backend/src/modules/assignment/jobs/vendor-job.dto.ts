import { z } from "zod";

export const vendorJobsQueryDto = z.object({
    filter: z.enum(["today", "upcoming", "completed", "action"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    q: z.string().trim().max(80).optional(),
});

export const vendorJobOrderParamsDto = z.object({
    orderId: z.string().uuid(),
});

export const completeVendorJobDto = z.object({
    code: z.string().regex(/^\d{6}$/, "code must be 6 digits"),
});

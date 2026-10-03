import { z } from "zod";
import { REFUND_REQUEST_STATUSES } from "@/modules/booking/refunds/refund-request.schema.js";

export const createRefundRequestDto = z.object({
    reason: z.string().trim().min(10).max(1000),
});

export const refundRequestOrderParamsDto = z.object({
    orderId: z.string().uuid(),
});

export const refundRequestIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const listRefundRequestsQueryDto = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(REFUND_REQUEST_STATUSES).optional(),
    userId: z.string().uuid().optional(),
    q: z.string().trim().min(1).max(100).optional(),
});

export const patchRefundRequestDto = z.object({
    action: z.enum(["approve", "reject", "complete"]),
    adminNote: z.string().trim().min(1).max(500).optional(),
});

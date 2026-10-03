import { z } from "zod";

export const listAuditLogsQueryDto = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    action: z.string().trim().optional(),
    entityType: z.string().trim().optional(),
    entityId: z.string().trim().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

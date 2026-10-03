import { z } from "zod";

export const adminCustomerListQueryDto = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(["active", "blocked"]).optional(),
    search: z.string().trim().optional(),
    cityId: z.string().uuid().optional(),
    hasBookings: z.preprocess(
        (value) => (value === "true" ? true : value === "false" ? false : undefined),
        z.boolean().optional(),
    ),
    joinedFrom: z.coerce.date().optional(),
    joinedTo: z.coerce.date().optional(),
});

export const adminCustomerIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const adminCustomerPatchDto = z.object({
    status: z.enum(["active", "blocked"]),
});

export type AdminCustomerListQuery = z.infer<typeof adminCustomerListQueryDto>;

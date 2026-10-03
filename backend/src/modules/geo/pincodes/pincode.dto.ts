import { z } from "zod";

export const resolvePincodeQueryDto = z.object({
    pincode: z.string().min(1),
    cityId: z.string().uuid().optional(),
});

export const createPincodeDto = z.object({
    code: z.string().min(6),
    cityId: z.string().uuid(),
    locality: z.string().min(1).optional().nullable(),
    isServiceable: z.boolean().optional(),
});

export const patchPincodeDto = z.object({
    cityId: z.string().uuid().optional(),
    locality: z.string().min(1).optional().nullable(),
    isServiceable: z.boolean().optional(),
});

export const pincodeIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const adminPincodeListQueryDto = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    cityId: z.string().uuid().optional(),
    q: z.string().optional(),
    isServiceable: z.enum(["true", "false"]).optional(),
});

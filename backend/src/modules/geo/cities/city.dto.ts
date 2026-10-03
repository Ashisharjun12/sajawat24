import { z } from "zod";

export const createCityDto = z.object({
    name: z.string().min(2),
    state: z.string().min(2),
    slug: z.string().min(2).optional(),
    imageUploadId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
});

export const patchCityDto = z.object({
    name: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    imageUploadId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
});

export const cityIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const adminListQueryDto = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
});

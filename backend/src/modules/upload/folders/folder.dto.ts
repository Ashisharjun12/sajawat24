import { z } from "zod";

export const createFolderDto = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).optional(),
    parentId: z.string().uuid().nullable().optional(),
});

export const patchFolderDto = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    parentId: z.string().uuid().nullable().optional(),
});

export const folderIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const folderListQueryDto = z.object({
    parentId: z.string().optional(),
    q: z.string().optional(),
});

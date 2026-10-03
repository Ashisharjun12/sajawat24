import { z } from "zod";

export const presignUploadDto = z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(3).max(100),
    kind: z.enum(["image", "video", "file"]),
    folderId: z.string().uuid().nullable().optional(),
    optimize: z.boolean().optional(),
});

export const uploadIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const patchUploadDto = z
    .object({
        folderId: z.string().uuid().nullable().optional(),
        filename: z.string().min(1).max(255).optional(),
    })
    .refine((value) => value.folderId !== undefined || value.filename !== undefined, {
        message: "folderId or filename is required",
    });

export const adminUploadListQueryDto = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    kind: z.enum(["image", "video", "file"]).optional(),
    folderId: z.string().optional(),
    status: z.enum(["pending", "completed", "failed"]).optional(),
    optimizeStatus: z.enum(["none", "queued", "completed", "failed"]).optional(),
});

export const imageCropDto = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().positive(),
    height: z.number().positive(),
});

export const optimizeOutputDto = z.object({
    width: z.number().int().positive().max(4096).optional(),
    height: z.number().int().positive().max(4096).optional(),
});

export const optimizeUploadDto = z.object({
    crop: imageCropDto.optional(),
    output: optimizeOutputDto.optional(),
});

export type ImageCropInput = z.infer<typeof imageCropDto>;
export type OptimizeOutputInput = z.infer<typeof optimizeOutputDto>;

export function parseCropJson(raw: unknown): ImageCropInput | undefined {
    if (raw === undefined || raw === null || raw === "") return undefined;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return imageCropDto.parse(parsed);
}

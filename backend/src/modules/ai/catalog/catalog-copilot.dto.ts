import { z } from "zod";

export const generateProductCopyDto = z.object({
    name: z.string().trim().min(2).max(120),
    categoryName: z.string().trim().min(2).max(120),
    parentCategoryName: z.string().trim().min(2).max(120).optional(),
    notes: z.string().trim().max(500).optional(),
    tone: z.enum(["professional", "friendly"]).default("professional"),
});

export type GenerateProductCopyInput = z.infer<typeof generateProductCopyDto>;

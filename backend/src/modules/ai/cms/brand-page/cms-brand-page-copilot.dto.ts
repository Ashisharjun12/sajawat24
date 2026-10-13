import { z } from "zod";

export const suggestCmsBrandPageDto = z.object({
    brief: z.string().trim().min(2).max(500),
    title: z.string().trim().max(200).optional(),
    tone: z.enum(["professional", "friendly"]).default("professional"),
});

export type SuggestCmsBrandPageInput = z.infer<typeof suggestCmsBrandPageDto>;

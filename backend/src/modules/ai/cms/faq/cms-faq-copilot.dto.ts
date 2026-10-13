import { z } from "zod";

export const suggestCmsFaqDto = z.object({
    topic: z.string().trim().min(2).max(200),
    question: z.string().trim().max(500).optional(),
    tone: z.enum(["professional", "friendly"]).default("professional"),
});

export type SuggestCmsFaqInput = z.infer<typeof suggestCmsFaqDto>;

import { z } from "zod";

export const suggestCmsTestimonialDto = z.object({
    topic: z.string().trim().min(2).max(200),
    quote: z.string().trim().max(2000).optional(),
    reviewerName: z.string().trim().max(120).optional(),
    reviewerCity: z.string().trim().max(120).optional(),
    tone: z.enum(["professional", "friendly"]).default("friendly"),
});

export type SuggestCmsTestimonialInput = z.infer<typeof suggestCmsTestimonialDto>;

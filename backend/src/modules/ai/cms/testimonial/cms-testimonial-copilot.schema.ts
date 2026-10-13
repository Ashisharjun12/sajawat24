import { z } from "zod";

export const cmsTestimonialOutputSchema = z.object({
    quote: z.string().min(10).max(2000),
    reviewerName: z.string().min(1).max(120),
    reviewerCity: z.string().max(120).optional(),
});

export type CmsTestimonialOutput = z.infer<typeof cmsTestimonialOutputSchema>;

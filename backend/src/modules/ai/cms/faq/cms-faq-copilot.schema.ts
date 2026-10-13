import { z } from "zod";

export const cmsFaqOutputSchema = z.object({
    question: z.string().min(5).max(500),
    answer: z.string().min(10).max(5000),
});

export type CmsFaqOutput = z.infer<typeof cmsFaqOutputSchema>;

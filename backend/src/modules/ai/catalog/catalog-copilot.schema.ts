import { z } from "zod";

const bulletListSchema = z.array(z.string().min(1).max(300)).min(1).max(20);

export const productCopyOutputSchema = z.object({
    description: z.string().min(20).max(3000),
    slug: z.string().min(2).max(120),
    includes: bulletListSchema,
    deliverySetup: bulletListSchema,
    careInstructions: z.array(z.string().min(1).max(300)).max(20),
    faqs: z
        .array(
            z.object({
                question: z.string().min(5).max(300),
                answer: z.string().min(5).max(1000),
            }),
        )
        .min(1)
        .max(10),
});

export type ProductCopyOutput = z.infer<typeof productCopyOutputSchema>;

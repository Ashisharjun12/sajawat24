import { z } from "zod";

export const cmsBrandPageOutputSchema = z.object({
    body: z.string().min(40).max(30_000),
});

export type CmsBrandPageOutput = z.infer<typeof cmsBrandPageOutputSchema>;

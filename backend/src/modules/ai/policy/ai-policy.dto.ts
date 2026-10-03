import { z } from "zod";

export const patchAiPolicyDto = z
    .object({
        enabled: z.boolean().optional(),
        admin: z.boolean().optional(),
        web: z.boolean().optional(),
        customer: z.boolean().optional(),
        vendor: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one AI policy field is required",
    });

import { z } from "zod";

export const walletWithdrawDto = z.object({
    amountPaise: z.number().int().positive(),
    payoutMethodId: z.string().uuid(),
});

const isoDateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const walletActivityQueryDto = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(50).optional(),
        type: z.enum(["earnings", "cod", "withdrawals"]).optional(),
        from: isoDateString.optional(),
        to: isoDateString.optional(),
    })
    .refine((value) => !value.from || !value.to || value.from <= value.to, {
        message: "from must be on or before to",
        path: ["from"],
    });

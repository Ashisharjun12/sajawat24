import { z } from "zod";

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const upiRegex = /^[\w.-]+@[\w.-]+$/;

export const addBankPayoutMethodDto = z.object({
    accountHolderName: z.string().trim().min(2).max(120),
    bankName: z.string().trim().min(2).max(120),
    accountNumber: z.string().trim().min(9).max(18).regex(/^\d+$/),
    ifsc: z.string().trim().toUpperCase().regex(ifscRegex),
    isDefault: z.boolean().optional(),
});

export const addUpiPayoutMethodDto = z.object({
    accountHolderName: z.string().trim().min(2).max(120),
    upiId: z.string().trim().toLowerCase().regex(upiRegex),
    isDefault: z.boolean().optional(),
});

export const payoutMethodIdParamsDto = z.object({
    id: z.string().uuid(),
});

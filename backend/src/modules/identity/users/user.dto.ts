import { z } from "zod";

export const linkPhoneDto = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
});

export const linkGoogleDto = z.object({
    idToken: z.string().min(10),
});

import { z } from "zod";

export const clientTypeSchema = z.enum(["web", "mobile"]);
export const deviceSchema = z.enum(["web", "ios", "android"]).optional();
export const partnerLoginIntentSchema = z.enum(["owner", "staff"]);

export const otpRequestDto = z.object({
    phone: z.string().min(10),
    loginIntent: partnerLoginIntentSchema.optional(),
    androidAppHash: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9+/=]{11}$/, "invalid android app hash")
        .optional(),
});

export const otpVerifyDto = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
    clientType: clientTypeSchema,
    device: deviceSchema,
    loginIntent: partnerLoginIntentSchema.optional(),
    partnerSignIn: z.literal(true).optional(),
});

export const googleLoginDto = z.object({
    idToken: z.string().min(10),
    clientType: clientTypeSchema,
    device: deviceSchema,
});

export const adminLoginDto = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    clientType: clientTypeSchema.default("web"),
    device: deviceSchema,
});

export const refreshDto = z.preprocess(
    (val) => (val && typeof val === "object" ? val : {}),
    z.object({
        refreshToken: z.string().min(10).optional(),
        clientType: clientTypeSchema.optional(),
        device: deviceSchema,
    }),
);

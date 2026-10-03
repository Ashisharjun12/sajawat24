import { z } from "zod";

const razorpayVerifyDto = z.object({
    provider: z.literal("razorpay"),
    orderId: z.string().uuid(),
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1),
});

const cashfreeVerifyDto = z.object({
    provider: z.literal("cashfree"),
    orderId: z.string().uuid(),
});

export const verifyPaymentDto = z.discriminatedUnion("provider", [
    razorpayVerifyDto,
    cashfreeVerifyDto,
]);

export type VerifyPaymentInput = z.infer<typeof verifyPaymentDto>;

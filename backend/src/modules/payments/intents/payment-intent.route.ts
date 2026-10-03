import { Router } from "express";
import type { PaymentIntentController } from "@/modules/payments/intents/payment-intent.controller.js";
import { verifyPaymentDto } from "@/modules/payments/intents/payment-intent.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createPaymentIntentRouter(controller: PaymentIntentController) {
    const router = Router();
    router.post("/verify", authRequired, validate(verifyPaymentDto), controller.verify);
    return router;
}

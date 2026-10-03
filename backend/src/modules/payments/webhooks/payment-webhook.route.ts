import { Router, type Request, type Response } from "express";
import { paymentWebhookService } from "@/modules/payments/webhooks/payment-webhook.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";

function shouldEnqueueWebhookRetry(err: unknown): boolean {
    if (err instanceof ApiError) {
        if (err.statusCode === 401 || err.statusCode === 400) {
            return false;
        }
    }
    const message = err instanceof Error ? err.message : "";
    if (message.includes("invalid input syntax for type uuid")) {
        return false;
    }
    return true;
}

async function handleWebhook(
    provider: "razorpay" | "cashfree",
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const rawBody = req.body as Buffer;
        await paymentWebhookService.process(provider, req.headers, rawBody);
        res.status(200).json({ ok: true });
    } catch (err) {
        logger.error({ err, provider }, "payment webhook failed");
        if (shouldEnqueueWebhookRetry(err)) {
            try {
                const rawBody = req.body as Buffer;
                await paymentWebhookService.enqueueRetry(provider, req.headers, rawBody);
            } catch (retryErr) {
                logger.error({ retryErr, provider }, "payment webhook retry enqueue failed");
            }
        }
        res.status(200).json({ ok: true });
    }
}

export function createPaymentWebhookRouter(): Router {
    const router = Router();
    router.post("/razorpay", (req, res) => void handleWebhook("razorpay", req, res));
    router.post("/cashfree", (req, res) => void handleWebhook("cashfree", req, res));
    return router;
}

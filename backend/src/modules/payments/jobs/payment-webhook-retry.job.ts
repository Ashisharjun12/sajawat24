import { paymentWebhookService } from "@/modules/payments/webhooks/payment-webhook.service.js";

export async function processPaymentWebhookRetryJob(job: {
    data: {
        provider: "razorpay" | "cashfree";
        headers: Record<string, string | string[] | undefined>;
        rawBody: string;
    };
}): Promise<void> {
    await paymentWebhookService.process(job.data.provider, job.data.headers, job.data.rawBody);
}

import { _config } from "@/config/config.js";

/** Public base URL for this API (ngrok in dev, real domain in prod). No trailing slash. */
export function getApiPublicOrigin(): string {
    const fromEnv = _config.API_PUBLIC_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }
    const port = _config.PORT || "3000";
    return `http://localhost:${port}`;
}

export function paymentWebhookUrl(provider: "razorpay" | "cashfree"): string {
    return `${getApiPublicOrigin()}/api/v1/webhooks/${provider}`;
}

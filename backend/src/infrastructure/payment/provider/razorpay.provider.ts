import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";
import {
    paymentCustomerEmail,
    razorpayContact,
} from "@/infrastructure/payment/payment-customer.js";
import type {
    CreateCollectQrInput,
    CreateCollectQrResult,
    CreateIntentInput,
    CreateIntentResult,
    IPaymentProvider,
    RefundInput,
    VerifyClientPaymentInput,
    SyncCollectPaymentResult,
    VerifyClientPaymentResult,
    WebhookEvent,
} from "@/infrastructure/payment/payment.interface.js";

function requireKeys(): { keyId: string; keySecret: string } {
    const keyId = _config.RAZORPAY_KEY_ID?.trim();
    const keySecret = _config.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
        throw ApiError.badRequest("razorpay is not configured");
    }
    return { keyId, keySecret };
}

function webhookSecret(): string {
    const secret = _config.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret) {
        throw ApiError.internalServerError("razorpay webhook secret is not configured");
    }
    return secret;
}

function asBodyString(rawBody: Buffer | string): string {
    return typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
}

/** Dev/test: payment link + display QR. Production: Razorpay UPI QR API (fallback to link). */
function codCollectionUsesPaymentLink(): boolean {
    const mode = _config.RAZORPAY_COD_COLLECTION_MODE?.trim().toLowerCase();
    if (mode === "payment_link") return true;
    if (mode === "qr_code") return false;
    return _config.NODE_ENV !== "production";
}

function rethrowProviderError(err: unknown): never {
    if (err && typeof err === "object" && "error" in err) {
        const providerErr = err as {
            statusCode?: number;
            error?: { description?: string; reason?: string };
        };
        const message =
            providerErr.error?.description ??
            providerErr.error?.reason ??
            "payment provider request failed";
        throw ApiError.badRequest(message);
    }
    throw err;
}

export class RazorpayProvider implements IPaymentProvider {
    readonly name = "razorpay" as const;

    private client(): Razorpay {
        const { keyId, keySecret } = requireKeys();
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
    }

    async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
        const { keyId } = requireKeys();
        const order = await this.client().orders.create({
            amount: input.amountPaise,
            currency: "INR",
            receipt: input.receipt,
            notes: { decory_order_id: input.orderId },
        });

        const customer = input.customer;
        return {
            provider: this.name,
            providerRef: order.id,
            payload: {
                keyId,
                orderId: order.id,
                amountPaise: input.amountPaise,
                currency: "INR",
                name: "Decoryy",
                description: `Booking ${input.receipt}`,
                prefill: customer
                    ? {
                          name: customer.name,
                          email: customer.email,
                          contact: customer.phone,
                      }
                    : undefined,
            },
        };
    }

    async createCollectQr(input: CreateCollectQrInput): Promise<CreateCollectQrResult> {
        if (codCollectionUsesPaymentLink()) {
            return this.createCollectPaymentLink(input);
        }

        try {
            return await this.createCollectUpiQr(input);
        } catch {
            return this.createCollectPaymentLink(input);
        }
    }

    private async createCollectUpiQr(input: CreateCollectQrInput): Promise<CreateCollectQrResult> {
        const closeBy = Math.floor(Date.now() / 1000) + 15 * 60;
        const qr = await this.client().qrCode.create({
            type: "upi_qr",
            name: `Collect ${input.receipt}`,
            usage: "single_use",
            fixed_amount: true,
            payment_amount: input.amountPaise,
            description: `COD collection ${input.receipt}`,
            close_by: closeBy,
            notes: {
                decory_order_id: input.orderId,
                decory_kind: "collection",
            },
        });

        const imageUrl =
            typeof qr.image_url === "string" && qr.image_url.length > 0 ? qr.image_url : undefined;

        return {
            providerRef: String(qr.id),
            qrImageUrl: imageUrl,
            shareUrl: imageUrl,
        };
    }

    private async createCollectPaymentLink(
        input: CreateCollectQrInput,
    ): Promise<CreateCollectQrResult> {
        try {
            const link = (await this.client().paymentLink.create({
                amount: input.amountPaise,
                currency: "INR",
                description: `COD collection ${input.receipt}`,
                reference_id: input.orderId.replace(/-/g, "").slice(0, 40),
                customer: {
                    name: input.customer.name,
                    email: paymentCustomerEmail(input.customer.email),
                    contact: razorpayContact(input.customer.phone),
                },
                notes: {
                    decory_order_id: input.orderId,
                    decory_kind: "collection",
                },
                notify: { sms: false, email: false },
                reminder_enable: false,
            })) as { id: string; short_url?: string };

            const shareUrl =
                typeof link.short_url === "string" && link.short_url.length > 0
                    ? link.short_url
                    : undefined;

            return {
                providerRef: String(link.id),
                shareUrl,
            };
        } catch (err) {
            rethrowProviderError(err);
        }
    }

    async verifyClientPayment(input: VerifyClientPaymentInput): Promise<VerifyClientPaymentResult> {
        if (input.provider !== "razorpay") {
            throw ApiError.badRequest("invalid payment provider");
        }
        const { keySecret } = requireKeys();
        const valid = validatePaymentVerification(
            {
                order_id: input.razorpayOrderId,
                payment_id: input.razorpayPaymentId,
            },
            input.razorpaySignature,
            keySecret,
        );
        if (!valid) {
            throw ApiError.badRequest("payment verification failed");
        }
        return {
            providerPaymentId: input.razorpayPaymentId,
            providerRef: input.razorpayOrderId,
        };
    }

    async verifyWebhook(
        headers: Record<string, string | string[] | undefined>,
        rawBody: Buffer | string,
    ): Promise<WebhookEvent> {
        const body = asBodyString(rawBody);
        const signature = String(headers["x-razorpay-signature"] ?? "");
        const expected = createHmac("sha256", webhookSecret()).update(body).digest("hex");
        const valid =
            signature.length === expected.length &&
            timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        if (!valid) {
            throw ApiError.unauthorized("invalid razorpay webhook signature");
        }

        const payload = JSON.parse(body) as {
            event?: string;
            payload?: {
                payment?: { entity?: Record<string, unknown> };
                qr_code?: { entity?: Record<string, unknown> };
                payment_link?: { entity?: Record<string, unknown> };
            };
        };

        const eventName = payload.event ?? "";
        const payment = payload.payload?.payment?.entity ?? {};
        const qr = payload.payload?.qr_code?.entity ?? {};
        const paymentLink = payload.payload?.payment_link?.entity ?? {};

        if (eventName === "payment_link.paid") {
            const linkNotes =
                paymentLink.notes && typeof paymentLink.notes === "object"
                    ? (paymentLink.notes as Record<string, string>)
                    : {};
            const orderId = linkNotes.decory_order_id ?? "";
            const providerRef = String(paymentLink.id ?? "");
            const providerPaymentId = String(payment.id ?? "");
            const amountPaise = Number(payment.amount ?? paymentLink.amount_paid ?? 0);

            if (!orderId || !providerRef || !providerPaymentId || !amountPaise) {
                throw ApiError.badRequest("unsupported razorpay payment link webhook");
            }

            return {
                provider: this.name,
                providerRef,
                providerPaymentId,
                orderId,
                amountPaise,
                status: "captured",
                kind: linkNotes.decory_kind === "collection" ? "collection" : "checkout",
                raw: payload,
            };
        }

        const providerPaymentId = String(payment.id ?? "");
        const amountPaise = Number(payment.amount ?? 0);
        const notes =
            payment.notes && typeof payment.notes === "object"
                ? (payment.notes as Record<string, string>)
                : {};
        const orderId = notes.decory_order_id ?? "";
        const providerRef =
            eventName === "qr_code.credited"
                ? String(qr.id ?? payment.qr_code_id ?? "")
                : String(payment.order_id ?? "");

        if (!orderId || !providerPaymentId || !amountPaise) {
            throw ApiError.badRequest("unsupported razorpay webhook payload");
        }

        const status =
            eventName === "payment.captured" || eventName === "qr_code.credited"
                ? "captured"
                : "failed";

        return {
            provider: this.name,
            providerRef,
            providerPaymentId,
            orderId,
            amountPaise,
            status,
            kind: eventName === "qr_code.credited" ? "collection" : "checkout",
            raw: payload,
        };
    }

    async syncCollectPayment(
        _providerRef: string,
        _expectedAmountPaise: number,
    ): Promise<SyncCollectPaymentResult> {
        return { paid: false };
    }

    async resolveCollectionWebhook(_raw: unknown): Promise<null> {
        return null;
    }

    async refund(input: RefundInput): Promise<void> {
        await this.client().payments.refund(input.providerRef, {
            amount: input.amountPaise,
            notes: { idempotency_key: input.idempotencyKey },
        });
    }
}

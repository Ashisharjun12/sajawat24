import { Cashfree, CFEnvironment } from "cashfree-pg";
import { _config } from "@/config/config.js";
import { paymentWebhookUrl } from "@/lib/api-public-url.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";
import {
    cashfreeCodMerchantOrderId,
    cashfreeCollectPaymentLinkId,
    cashfreeWebhookCollectionProviderRefCandidates,
    cashfreeWebhookIsCaptured,
    cashfreeWebhookPaymentAmountPaise,
    cashfreeWebhookSignatureMatches,
    type CashfreeWebhookPayload,
    extractQrBase64FromPayOrderData,
    isCashfreeCollectionLinkNotes,
    isCashfreeCollectPaymentLinkRef,
    isCashfreeInternalPaymentRef,
    isDecoryOrderUuid,
    parseCashfreeLinkQrField,
    formatCashfreeTransactionExpiryIso,
    isCashfreeCodCollectionMerchantOrderId,
    isCashfreePaymentLinkEntityPaid,
    isCashfreePgOrderPaid,
    parseDecoryOrderIdFromCashfreeOrderNote,
    parseDecoryOrderIdFromCodMerchantOrderId,
} from "@/infrastructure/payment/provider/cashfree-cod.helpers.js";
import {
    cashfreePhone,
    paymentCustomerEmail,
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

function cashfreeEnvironment(): CFEnvironment {
    const env = (_config.CASHFREE_ENV || "sandbox").toLowerCase();
    return env === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
}

function requireKeys(): { clientId: string; clientSecret: string } {
    const clientId = _config.CASHFREE_KEY_ID?.trim();
    const clientSecret = _config.CASHFREE_KEY_SECRET?.trim();
    if (!clientId || !clientSecret) {
        throw ApiError.badRequest("cashfree is not configured");
    }
    return { clientId, clientSecret };
}

/** PG signs webhooks with the API client secret; optional CASHFREE_WEBHOOK_SECRET for rotation overlap. */
function cashfreeWebhookSigningSecrets(): string[] {
    const { clientSecret } = requireKeys();
    const secrets = [clientSecret];
    const legacy = _config.CASHFREE_WEBHOOK_SECRET?.trim();
    if (legacy && legacy !== clientSecret) {
        secrets.push(legacy);
    }
    return secrets;
}

function assertCashfreeWebhookSignature(
    signature: string,
    timestamp: string,
    body: string,
): void {
    if (!signature || !timestamp) {
        throw ApiError.unauthorized("invalid cashfree webhook signature");
    }

    const pgVerify = (client() as Cashfree & {
        PGVerifyWebhookSignature?: (sig: string, raw: string, ts: string) => unknown;
    }).PGVerifyWebhookSignature;
    if (typeof pgVerify === "function") {
        try {
            pgVerify.call(client(), signature, body, timestamp);
            return;
        } catch (err: unknown) {
            logger.debug({ err }, "cashfree SDK webhook verify failed; trying manual secrets");
        }
    }

    for (const secret of cashfreeWebhookSigningSecrets()) {
        if (cashfreeWebhookSignatureMatches(signature, timestamp, body, secret)) {
            return;
        }
    }

    throw ApiError.unauthorized("invalid cashfree webhook signature");
}

function client(): Cashfree {
    const { clientId, clientSecret } = requireKeys();
    return new Cashfree(cashfreeEnvironment(), clientId, clientSecret);
}

function toRupees(amountPaise: number): number {
    return Number((amountPaise / 100).toFixed(2));
}

function asBodyString(rawBody: Buffer | string): string {
    return typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
}

function codCollectionTtlMinutes(input: CreateCollectQrInput): number {
    if (input.sessionTtlMinutes && input.sessionTtlMinutes > 0) {
        return input.sessionTtlMinutes;
    }
    return _config.CASHFREE_COD_QR_TTL_MINUTES;
}

function cashfreeCodCollectionMode(): "pod_qr" | "payment_link" {
    const mode = _config.CASHFREE_COD_COLLECTION_MODE;
    return mode === "payment_link" ? "payment_link" : "pod_qr";
}

function rethrowProviderError(err: unknown): never {
    const response = (err as { response?: { data?: { message?: string; code?: string } } })?.response
        ?.data;
    const message = response?.message ?? "cashfree request failed";
    throw ApiError.badRequest(message);
}

function shouldFallbackFromPodQr(err: unknown): boolean {
    const status = (err as { response?: { status?: number } })?.response?.status;
    const code = String(
        (err as { response?: { data?: { code?: string } } })?.response?.data?.code ?? "",
    ).toLowerCase();
    const message = String(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "",
    ).toLowerCase();
    if (status === 400 || status === 403 || status === 422) return true;
    if (code === "request_failed" || code === "payment_method_unsupported") return true;
    if (message.includes("s2s") || message.includes("seamless")) return true;
    return false;
}

export class CashfreeProvider implements IPaymentProvider {
    readonly name = "cashfree" as const;

    async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
        const customer = input.customer;
        try {
            const response = await client().PGCreateOrder({
                order_id: input.orderId,
                order_amount: toRupees(input.amountPaise),
                order_currency: "INR",
                customer_details: {
                    customer_id: input.orderId,
                    customer_name: customer?.name ?? "Customer",
                    customer_email: customer?.email ?? "customer@decoryy.com",
                    customer_phone: customer ? cashfreePhone(customer.phone) : cashfreePhone("9876543210"),
                },
                order_meta: {
                    return_url: `${_config.WEB_APP_ORIGIN}/checkout/success/${input.orderId}`,
                },
            });
            return this.intentFromOrderResponse(response.data, input);
        } catch (err: unknown) {
            if (this.isCashfreeOrderAlreadyExists(err)) {
                const response = await client().PGFetchOrder(input.orderId);
                return this.intentFromOrderResponse(response.data, input);
            }
            throw err;
        }
    }

    private isCashfreeOrderAlreadyExists(err: unknown): boolean {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
        return status === 409 || code === "order_already_exists";
    }

    private intentFromOrderResponse(
        data: {
            cf_order_id?: string | number;
            order_id?: string;
            payment_session_id?: string;
        },
        input: CreateIntentInput,
    ): CreateIntentResult {
        const providerRef = String(data.cf_order_id ?? data.order_id ?? input.orderId);
        const paymentSessionId = data.payment_session_id;
        if (!paymentSessionId) {
            throw ApiError.internalServerError("cashfree did not return a payment session");
        }

        return {
            provider: this.name,
            providerRef,
            payload: {
                paymentSessionId,
                orderId: input.orderId,
                environment: (_config.CASHFREE_ENV || "sandbox").toLowerCase(),
                amountPaise: input.amountPaise,
            },
        };
    }

    async createCollectQr(input: CreateCollectQrInput): Promise<CreateCollectQrResult> {
        if (cashfreeCodCollectionMode() === "payment_link") {
            return this.createCollectPaymentLink(input);
        }

        try {
            return await this.createCollectPodQr(input);
        } catch (err: unknown) {
            if (!shouldFallbackFromPodQr(err)) {
                rethrowProviderError(err);
            }
            logger.warn(
                { err, decoryOrderId: input.orderId },
                "cashfree POD QR failed; falling back to payment link",
            );
            return this.createCollectPaymentLink(input);
        }
    }

    private async createCollectPodQr(input: CreateCollectQrInput): Promise<CreateCollectQrResult> {
        const ttlMinutes = codCollectionTtlMinutes(input);
        const merchantOrderId = cashfreeCodMerchantOrderId(input.orderId, Date.now());
        const orderResponse = await client().PGCreateOrder({
            order_id: merchantOrderId,
            order_amount: toRupees(input.amountPaise),
            order_currency: "INR",
            customer_details: {
                customer_id: input.orderId,
                customer_name: input.customer.name,
                customer_email: paymentCustomerEmail(input.customer.email),
                customer_phone: cashfreePhone(input.customer.phone),
            },
            order_meta: {
                notify_url: paymentWebhookUrl("cashfree"),
                return_url: `${_config.WEB_APP_ORIGIN}/checkout/success/${input.orderId}`,
            },
            order_note: JSON.stringify({
                decory_order_id: input.orderId,
                decory_kind: "collection",
            }),
        });

        const orderData = orderResponse.data;
        const paymentSessionId = orderData.payment_session_id;
        if (!paymentSessionId) {
            throw ApiError.internalServerError("cashfree did not return a payment session for COD QR");
        }

        const payRequest = {
            payment_session_id: paymentSessionId,
            transaction_expiry_time: formatCashfreeTransactionExpiryIso(ttlMinutes),
            payment_method: {
                upi: {
                    channel: "podQrCode",
                },
            },
        };
        const payResponse = await client().PGPayOrder(
            payRequest as Parameters<Cashfree["PGPayOrder"]>[0],
        );

        const payData = payResponse.data as { data?: unknown };
        const qrBase64 = extractQrBase64FromPayOrderData(payData?.data ?? payResponse.data);
        if (!qrBase64) {
            throw ApiError.internalServerError("cashfree did not return a POD QR image");
        }

        return {
            providerRef: String(orderData.order_id ?? merchantOrderId),
            qrBase64,
        };
    }

    private async createCollectPaymentLink(input: CreateCollectQrInput): Promise<CreateCollectQrResult> {
        const linkId = cashfreeCollectPaymentLinkId(input.orderId, Date.now());
        const response = await client().PGCreateLink({
            link_id: linkId,
            link_amount: toRupees(input.amountPaise),
            link_currency: "INR",
            link_purpose: `COD collection ${input.receipt}`,
            customer_details: {
                customer_name: input.customer.name,
                customer_email: paymentCustomerEmail(input.customer.email),
                customer_phone: cashfreePhone(input.customer.phone),
            },
            link_meta: {
                notify_url: paymentWebhookUrl("cashfree"),
            },
            link_notes: {
                decory_order_id: input.orderId,
                decory_kind: "collection",
            },
        });

        const data = response.data;
        const linkQr = parseCashfreeLinkQrField(
            typeof data.link_qrcode === "string" ? data.link_qrcode : undefined,
        );
        return {
            providerRef: String(data.link_id ?? linkId),
            qrBase64: linkQr.qrBase64,
            qrImageUrl: linkQr.qrImageUrl,
            shareUrl: typeof data.link_url === "string" ? data.link_url : undefined,
        };
    }

    async syncCollectPayment(
        providerRef: string,
        expectedAmountPaise: number,
    ): Promise<SyncCollectPaymentResult> {
        try {
            if (isCashfreeCodCollectionMerchantOrderId(providerRef)) {
                const response = await client().PGFetchOrder(providerRef);
                const data = response.data;
                if (!isCashfreePgOrderPaid(data)) {
                    return { paid: false };
                }
                const paidPaise = Math.round(Number(data.order_amount ?? 0) * 100);
                if (paidPaise !== expectedAmountPaise) {
                    logger.warn(
                        { providerRef, paidPaise, expectedAmountPaise },
                        "cashfree COD order paid but amount mismatch on sync",
                    );
                    return { paid: false };
                }
                return {
                    paid: true,
                    providerPaymentId: String(data.cf_order_id ?? providerRef),
                };
            }

            if (isCashfreeCollectPaymentLinkRef(providerRef)) {
                const response = await client().PGFetchLink(providerRef);
                const data = response.data as {
                    link_amount?: number;
                    link_amount_paid?: number;
                    link_status?: string;
                    cf_link_id?: string | number;
                    link_id?: string;
                };
                if (!isCashfreePaymentLinkEntityPaid(data)) {
                    return { paid: false };
                }
                const paidPaise = Math.round(Number(data.link_amount_paid ?? data.link_amount ?? 0) * 100);
                if (paidPaise > 0 && paidPaise !== expectedAmountPaise) {
                    logger.warn(
                        { providerRef, paidPaise, expectedAmountPaise },
                        "cashfree payment link paid but amount mismatch on sync",
                    );
                }
                return {
                    paid: true,
                    providerPaymentId: String(data.cf_link_id ?? data.link_id ?? providerRef),
                };
            }

            return { paid: false };
        } catch (err: unknown) {
            logger.warn({ err, providerRef }, "cashfree collect payment sync failed");
            return { paid: false };
        }
    }

    async verifyClientPayment(input: VerifyClientPaymentInput): Promise<VerifyClientPaymentResult> {
        if (input.provider !== "cashfree") {
            throw ApiError.badRequest("invalid payment provider");
        }
        const response = await client().PGFetchOrder(input.orderId);
        const data = response.data;
        const status = String(data.order_status ?? "").toUpperCase();
        if (status !== "PAID") {
            throw ApiError.badRequest("payment not completed");
        }
        const paidPaise = Math.round(Number(data.order_amount ?? 0) * 100);
        if (paidPaise !== input.amountPaise) {
            throw ApiError.badRequest("payment amount mismatch");
        }
        return {
            providerPaymentId: String(data.cf_order_id ?? input.orderId),
            providerRef: String(data.cf_order_id ?? input.orderId),
        };
    }

    async resolveCollectionWebhook(
        raw: unknown,
    ): Promise<{ providerRef: string; providerPaymentId: string } | null> {
        const payload = raw as CashfreeWebhookPayload;
        const payment = payload.data?.payment;
        const paymentId = String(
            payment?.cf_payment_id ?? payload.data?.order?.cf_order_id ?? "",
        ).trim();

        for (const ref of cashfreeWebhookCollectionProviderRefCandidates(payload)) {
            if (isCashfreeCollectPaymentLinkRef(ref) || isCashfreeCodCollectionMerchantOrderId(ref)) {
                return { providerRef: ref, providerPaymentId: paymentId || ref };
            }
        }

        const merchantOrderId = payload.data?.order?.order_id?.trim() ?? "";
        if (merchantOrderId) {
            try {
                const response = await client().PGFetchOrder(merchantOrderId);
                const data = response.data as {
                    order_id?: string;
                    order_note?: string;
                };
                const fetchedOrderId = String(data.order_id ?? "").trim();
                const fromNote = parseDecoryOrderIdFromCashfreeOrderNote(data.order_note);
                if (isCashfreeCodCollectionMerchantOrderId(fetchedOrderId)) {
                    return {
                        providerRef: fetchedOrderId,
                        providerPaymentId: paymentId || fetchedOrderId,
                    };
                }
                if (fromNote && isCashfreeCollectPaymentLinkRef(merchantOrderId)) {
                    return { providerRef: merchantOrderId, providerPaymentId: paymentId || merchantOrderId };
                }
            } catch (err: unknown) {
                logger.debug({ err, merchantOrderId }, "cashfree PGFetchOrder for webhook resolve failed");
            }
        }

        const linkId = payload.data?.link?.link_id?.trim();
        if (linkId && isCashfreeCollectPaymentLinkRef(linkId)) {
            try {
                const response = await client().PGFetchLink(linkId);
                const data = response.data as { link_notes?: Record<string, string> };
                if (isCashfreeCollectionLinkNotes(data.link_notes)) {
                    return { providerRef: linkId, providerPaymentId: paymentId || linkId };
                }
            } catch (err: unknown) {
                logger.debug({ err, linkId }, "cashfree PGFetchLink for webhook resolve failed");
            }
            return { providerRef: linkId, providerPaymentId: paymentId || linkId };
        }

        return null;
    }

    async verifyWebhook(
        headers: Record<string, string | string[] | undefined>,
        rawBody: Buffer | string,
    ): Promise<WebhookEvent> {
        const body = asBodyString(rawBody);
        const signature = String(headers["x-webhook-signature"] ?? headers["x-cf-signature"] ?? "");
        const timestamp = String(headers["x-webhook-timestamp"] ?? "");
        assertCashfreeWebhookSignature(signature, timestamp, body);

        const payload = JSON.parse(body) as CashfreeWebhookPayload;
        const order = payload.data?.order;
        const payment = payload.data?.payment;
        const link = payload.data?.link;
        const amountPaise = cashfreeWebhookPaymentAmountPaise(payload);
        const status = cashfreeWebhookIsCaptured(payload) ? "captured" : "failed";
        const providerPaymentId = String(
            payment?.cf_payment_id ?? order?.cf_order_id ?? link?.link_id ?? "",
        ).trim();
        const merchantOrderId = String(order?.order_id ?? "").trim();

        const linkId = link?.link_id?.trim() ?? "";
        const linkIsCollection =
            Boolean(linkId) &&
            (isCashfreeCollectionLinkNotes(link?.link_notes) ||
                isCashfreeCollectPaymentLinkRef(linkId));

        if (linkIsCollection && linkId) {
            const linkPaid = link ? isCashfreePaymentLinkEntityPaid(link) : false;
            const paymentRef = providerPaymentId || linkId;
            const settleAmountPaise =
                amountPaise > 0
                    ? amountPaise
                    : Math.round(Number(link?.link_amount ?? 0) * 100);
            if (status === "captured" && paymentRef && (settleAmountPaise > 0 || linkPaid)) {
                const orderId = link?.link_notes?.decory_order_id?.trim() ?? "";
                return {
                    provider: this.name,
                    providerRef: linkId,
                    providerPaymentId: paymentRef,
                    orderId,
                    amountPaise: settleAmountPaise > 0 ? settleAmountPaise : amountPaise,
                    status,
                    kind: "collection",
                    raw: payload,
                };
            }
        }

        if (merchantOrderId && amountPaise > 0 && providerPaymentId) {
            if (isCashfreeCodCollectionMerchantOrderId(merchantOrderId)) {
                const orderId =
                    parseDecoryOrderIdFromCodMerchantOrderId(merchantOrderId) ??
                    parseDecoryOrderIdFromCashfreeOrderNote(order?.order_note) ??
                    "";
                return {
                    provider: this.name,
                    providerRef: merchantOrderId,
                    providerPaymentId,
                    orderId,
                    amountPaise,
                    status,
                    kind: "collection",
                    raw: payload,
                };
            }

            if (isCashfreeCollectPaymentLinkRef(merchantOrderId)) {
                const orderId = link?.link_notes?.decory_order_id?.trim() ?? "";
                return {
                    provider: this.name,
                    providerRef: merchantOrderId,
                    providerPaymentId,
                    orderId,
                    amountPaise,
                    status,
                    kind: "collection",
                    raw: payload,
                };
            }

            const fromNote = parseDecoryOrderIdFromCashfreeOrderNote(order?.order_note);
            if (fromNote) {
                return {
                    provider: this.name,
                    providerRef: merchantOrderId,
                    providerPaymentId,
                    orderId: fromNote,
                    amountPaise,
                    status,
                    kind: "collection",
                    raw: payload,
                };
            }

            if (isCashfreeInternalPaymentRef(merchantOrderId) || !isDecoryOrderUuid(merchantOrderId)) {
                const providerRef =
                    linkId && isCashfreeCollectPaymentLinkRef(linkId)
                        ? linkId
                        : merchantOrderId;
                return {
                    provider: this.name,
                    providerRef,
                    providerPaymentId,
                    orderId: "",
                    amountPaise,
                    status,
                    kind: "collection",
                    raw: payload,
                };
            }
        }

        if (!merchantOrderId || !providerPaymentId || !amountPaise) {
            throw ApiError.badRequest("unsupported cashfree webhook payload");
        }

        if (!isDecoryOrderUuid(merchantOrderId)) {
            logger.warn(
                { merchantOrderId, type: payload.type },
                "cashfree webhook ignored: order_id is not a Decory UUID",
            );
            return {
                provider: this.name,
                providerRef: String(order?.cf_order_id ?? merchantOrderId),
                providerPaymentId,
                orderId: merchantOrderId,
                amountPaise,
                status: "failed",
                kind: "checkout",
                raw: payload,
            };
        }

        const providerRef = String(order?.cf_order_id ?? merchantOrderId);
        return {
            provider: this.name,
            providerRef,
            providerPaymentId,
            orderId: merchantOrderId,
            amountPaise,
            status,
            kind: "checkout",
            raw: payload,
        };
    }

    async refund(input: RefundInput): Promise<void> {
        await client().PGOrderCreateRefund(input.providerRef, {
            refund_amount: toRupees(input.amountPaise),
            refund_id: input.idempotencyKey,
            refund_note: "decory refund",
        });
    }
}

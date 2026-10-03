import { createHmac, timingSafeEqual } from "node:crypto";

/** Cashfree PG payment link `link_id` max length (API validation). */
export const CASHFREE_PAYMENT_LINK_ID_MAX_LEN = 50;

/** PG webhooks: Base64(HMAC-SHA256(timestamp + rawBody, clientSecret)). */
export function cashfreeWebhookSignatureMatches(
    signature: string,
    timestamp: string,
    rawBody: string,
    clientSecret: string,
): boolean {
    if (!signature || !timestamp || !clientSecret) return false;
    const signedPayload = `${timestamp}${rawBody}`;
    const expected = createHmac("sha256", clientSecret).update(signedPayload).digest("base64");
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/** Cashfree merchant order id for COD POD QR (must not equal Decory booking UUID). */
export const CASHFREE_COD_ORDER_PREFIX = "cod-";

/** Unique `link_id` for COD collection payment links (≤ 50 chars). Full order id stays in link_notes. */
export function cashfreeCollectPaymentLinkId(decoryOrderId: string, timestampMs: number): string {
    const compact = decoryOrderId.replace(/-/g, "").toLowerCase();
    const orderPart = compact.slice(0, 12);
    const timePart = timestampMs.toString(36);
    const linkId = `cl-${orderPart}-${timePart}`;
    if (linkId.length > CASHFREE_PAYMENT_LINK_ID_MAX_LEN) {
        return linkId.slice(0, CASHFREE_PAYMENT_LINK_ID_MAX_LEN);
    }
    return linkId;
}

export function cashfreeCodMerchantOrderId(decoryOrderId: string, timestampMs: number): string {
    return `${CASHFREE_COD_ORDER_PREFIX}${decoryOrderId}-${timestampMs}`;
}

export function isCashfreeCodCollectionMerchantOrderId(merchantOrderId: string): boolean {
    return merchantOrderId.startsWith(CASHFREE_COD_ORDER_PREFIX);
}

/** Parses `cod-{uuid}-{timestamp}` → Decory order id. */
export function parseDecoryOrderIdFromCodMerchantOrderId(merchantOrderId: string): string | null {
    if (!isCashfreeCodCollectionMerchantOrderId(merchantOrderId)) return null;
    const rest = merchantOrderId.slice(CASHFREE_COD_ORDER_PREFIX.length);
    const lastDash = rest.lastIndexOf("-");
    if (lastDash <= 0) return null;
    const uuidPart = rest.slice(0, lastDash);
    const tsPart = rest.slice(lastDash + 1);
    if (!/^\d+$/.test(tsPart)) return null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuidPart)) {
        return null;
    }
    return uuidPart;
}

export function normalizeQrBase64(raw: string): string {
    const trimmed = raw.trim();
    const dataUriPrefix = /^data:image\/[a-z+]+;base64,/i.exec(trimmed);
    if (dataUriPrefix) {
        return trimmed.slice(dataUriPrefix[0].length);
    }
    return trimmed;
}

export type CashfreeLinkQrFields = {
    qrBase64?: string;
    qrImageUrl?: string;
};

/** Maps Cashfree payment-link `link_qrcode` to stored session QR fields. */
export function parseCashfreeLinkQrField(raw: string | undefined | null): CashfreeLinkQrFields {
    if (typeof raw !== "string") return {};
    const trimmed = raw.trim();
    if (!trimmed) return {};
    if (/^https?:\/\//i.test(trimmed)) {
        return { qrImageUrl: trimmed };
    }
    if (trimmed.length > 32) {
        return { qrBase64: normalizeQrBase64(trimmed) };
    }
    return {};
}

export function extractQrBase64FromPayOrderData(data: unknown): string | undefined {
    if (!data || typeof data !== "object") return undefined;
    const record = data as Record<string, unknown>;
    const candidates = [
        record.qrcode,
        record.qr_code,
        record.image,
        record.payload,
        record.qr,
    ];
    for (const value of candidates) {
        if (typeof value === "string" && value.length > 32) {
            return normalizeQrBase64(value);
        }
    }
    return undefined;
}

export function isCashfreeCollectPaymentLinkRef(providerRef: string): boolean {
    return providerRef.startsWith("cl-");
}

const DECORY_ORDER_UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDecoryOrderUuid(value: string): boolean {
    return DECORY_ORDER_UUID.test(value.trim());
}

/** Cashfree internal payment / session ids (not Decory order ids). */
export function isCashfreeInternalPaymentRef(value: string): boolean {
    const id = value.trim();
    return id.startsWith("CFPay_") || id.startsWith("cfpay_");
}

export type CashfreeWebhookPayload = {
    type?: string;
    data?: {
        order?: {
            order_id?: string;
            order_amount?: number;
            cf_order_id?: string | number;
            order_note?: string;
        };
        payment?: {
            cf_payment_id?: string | number;
            payment_amount?: number;
            payment_status?: string;
        };
        link?: {
            link_id?: string;
            link_amount?: number;
            link_amount_paid?: number;
            link_status?: string;
            link_notes?: Record<string, string>;
        };
    };
};

export function cashfreeWebhookPaymentAmountPaise(payload: CashfreeWebhookPayload): number {
    const payment = payload.data?.payment;
    const order = payload.data?.order;
    const link = payload.data?.link;
    const rupees =
        payment?.payment_amount != null
            ? Number(payment.payment_amount)
            : order?.order_amount != null
              ? Number(order.order_amount)
              : link?.link_amount_paid != null
                ? Number(link.link_amount_paid)
                : link?.link_amount != null
                  ? Number(link.link_amount)
                  : 0;
    return Math.round(rupees * 100);
}

export function cashfreeWebhookIsCaptured(payload: CashfreeWebhookPayload): boolean {
    const type = String(payload.type ?? "").toUpperCase();
    const paymentStatus = String(payload.data?.payment?.payment_status ?? "").toUpperCase();
    if (paymentStatus === "SUCCESS") return true;
    if (type.includes("SUCCESS") || type.includes("PAID")) return true;
    const link = payload.data?.link;
    if (link && isCashfreePaymentLinkEntityPaid(link)) return true;
    return false;
}

export function parseDecoryOrderIdFromCashfreeOrderNote(orderNote: string | undefined): string | null {
    if (!orderNote) return null;
    try {
        const parsed = JSON.parse(orderNote) as { decory_order_id?: string; decory_kind?: string };
        if (parsed.decory_kind === "collection" && parsed.decory_order_id) {
            return parsed.decory_order_id.trim() || null;
        }
        return parsed.decory_order_id?.trim() || null;
    } catch {
        return null;
    }
}

export function isCashfreeCollectionLinkNotes(notes: Record<string, string> | undefined): boolean {
    return notes?.decory_kind === "collection";
}

/** Provider refs to match collection_sessions.provider_ref from a webhook payload. */
export function cashfreeWebhookCollectionProviderRefCandidates(payload: CashfreeWebhookPayload): string[] {
    const out: string[] = [];
    const linkId = payload.data?.link?.link_id?.trim();
    const merchantOrderId = payload.data?.order?.order_id?.trim();
    const cfOrderId = payload.data?.order?.cf_order_id;
    if (linkId) out.push(linkId);
    if (merchantOrderId) out.push(merchantOrderId);
    if (cfOrderId != null && String(cfOrderId).trim()) out.push(String(cfOrderId).trim());
    return [...new Set(out.filter(Boolean))];
}

export function isCashfreePaymentLinkEntityPaid(data: {
    link_amount?: number;
    link_amount_paid?: number;
    link_status?: string;
}): boolean {
    const amountPaid = Number(data.link_amount_paid ?? 0);
    const linkAmount = Number(data.link_amount ?? 0);
    if (amountPaid > 0 && linkAmount > 0 && amountPaid >= linkAmount) {
        return true;
    }
    const status = String(data.link_status ?? "").toUpperCase();
    return status === "PAID" || (status === "PARTIALLY_PAID" && amountPaid > 0);
}

export function isCashfreePgOrderPaid(data: { order_status?: string }): boolean {
    return String(data.order_status ?? "").toUpperCase() === "PAID";
}

export function formatCashfreeTransactionExpiryIso(ttlMinutes: number): string {
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const istLocal = expires
        .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata", hour12: false })
        .replace(" ", "T");
    return `${istLocal}+05:30`;
}

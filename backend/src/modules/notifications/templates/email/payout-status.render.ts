import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_THEME } from "@/modules/notifications/templates/email/email-theme.js";

export type PayoutEmailVariant = "paid" | "failed";

const TEMPLATE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "payout-status.ejs");

function payoutMethodLabel(type: string): string {
    if (type === "upi") return "UPI";
    if (type === "bank") return "Bank transfer";
    return "Linked account";
}

function shortPayoutRef(id: string): string {
    const compact = id.replace(/-/g, "").toUpperCase();
    if (compact.length < 8) return id;
    return compact.slice(-8);
}

function formatProcessedAt(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

export async function renderPayoutStatusEmailHtml(input: {
    variant: PayoutEmailVariant;
    intro: string;
    amountFormatted: string;
    payoutDestination: string;
    payoutMethodType?: string;
    processedAt?: string;
    payoutRequestId?: string;
    failureReason?: string;
    accountHolderName?: string;
}): Promise<string> {
    const paid = input.variant === "paid";
    const processedLabel = input.processedAt ? formatProcessedAt(input.processedAt) : "";
    const details: { label: string; value: string }[] = [];
    if (input.payoutMethodType) {
        details.push({ label: "Method", value: payoutMethodLabel(input.payoutMethodType) });
    }
    if (input.accountHolderName?.trim()) {
        details.push({ label: "Account holder", value: input.accountHolderName.trim() });
    }
    if (input.payoutDestination) {
        details.push({ label: paid ? "Sent to" : "Destination", value: input.payoutDestination });
    }
    if (processedLabel) {
        details.push({ label: paid ? "Sent on" : "Updated", value: processedLabel });
    }
    if (input.payoutRequestId) {
        details.push({ label: "Reference", value: shortPayoutRef(input.payoutRequestId) });
    }

    return ejs.renderFile(TEMPLATE_PATH, {
        theme: EMAIL_THEME,
        variant: input.variant,
        pageTitle: paid ? "Payout sent" : "Payout could not be completed",
        headline: paid ? "Payout sent" : "Payout could not be completed",
        badge: "Wallet",
        intro: input.intro,
        amountLabel: paid ? "Amount sent" : "Returned to wallet",
        amountFormatted: input.amountFormatted,
        destinationPrefix: paid ? "to" : "intended for",
        payoutDestination: input.payoutDestination,
        failureReason: input.failureReason?.trim() || "",
        details,
    });
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { renderPayoutStatusEmailHtml } from "@/modules/notifications/templates/email/payout-status.render.js";

test("paid payout email uses branded HTML layout", async () => {
    const html = await renderPayoutStatusEmailHtml({
        variant: "paid",
        intro: "Hi Priya, your withdrawal of ₹12,500 has been processed.",
        amountFormatted: "₹12,500",
        payoutDestination: "HDFC · •••• 4321",
        payoutMethodType: "bank",
        processedAt: "2026-10-08T08:22:00.000Z",
        payoutRequestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        accountHolderName: "Priya Sharma",
    });

    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /Payout sent/);
    assert.match(html, /Amount sent/);
    assert.match(html, /₹12,500/);
    assert.match(html, /Bank transfer/);
    assert.match(html, /Priya Sharma/);
    assert.doesNotMatch(html, /View booking/);
    assert.doesNotMatch(html, /Why it failed/);
});

test("failed payout email highlights the reason", async () => {
    const html = await renderPayoutStatusEmailHtml({
        variant: "failed",
        intro: "Hi Priya, we could not complete your withdrawal of ₹12,500.",
        amountFormatted: "₹12,500",
        payoutDestination: "priya@okhdfcbank",
        payoutMethodType: "upi",
        processedAt: "2026-10-08T08:22:00.000Z",
        payoutRequestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        failureReason: "Bank rejected the transfer.",
        accountHolderName: "Priya Sharma",
    });

    assert.match(html, /Payout could not be completed/);
    assert.match(html, /Returned to wallet/);
    assert.match(html, /Why it failed/);
    assert.match(html, /Bank rejected the transfer/);
    assert.match(html, /UPI/);
});

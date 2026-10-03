import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canSettleCodCollectionPayment } from "@/modules/payments/collections/collection-payment.guards.js";

describe("canSettleCodCollectionPayment", () => {
    const base = {
        collectionStatus: "pending",
        sessionAmountPaise: 50000,
        orderSubtotalPaise: 50000,
        webhookAmountPaise: 50000,
    };

    it("allows pending matching amounts", () => {
        assert.equal(canSettleCodCollectionPayment(base), true);
    });

    it("rejects after cash or online collection", () => {
        assert.equal(
            canSettleCodCollectionPayment({ ...base, collectionStatus: "collected_cash" }),
            false,
        );
        assert.equal(
            canSettleCodCollectionPayment({ ...base, collectionStatus: "collected_online" }),
            false,
        );
    });

    it("rejects amount mismatch", () => {
        assert.equal(
            canSettleCodCollectionPayment({ ...base, webhookAmountPaise: 49900 }),
            false,
        );
        assert.equal(
            canSettleCodCollectionPayment({ ...base, sessionAmountPaise: 49900 }),
            false,
        );
    });
});

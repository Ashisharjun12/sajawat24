import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCheckoutAbandonedOrder } from "@/modules/booking/domain/checkout-abandoned-order.js";

describe("isCheckoutAbandonedOrder", () => {
    it("flags cancelled online orders with cleared idempotency", () => {
        assert.equal(
            isCheckoutAbandonedOrder({
                status: "CANCELLED",
                paymentMethod: "ONLINE",
                idempotencyKey: null,
            }),
            true,
        );
    });

    it("does not flag cancelled online orders that were confirmed", () => {
        assert.equal(
            isCheckoutAbandonedOrder({
                status: "CANCELLED",
                paymentMethod: "ONLINE",
                idempotencyKey: "idem-1",
            }),
            false,
        );
    });

    it("does not flag cancelled COD", () => {
        assert.equal(
            isCheckoutAbandonedOrder({
                status: "CANCELLED",
                paymentMethod: "COD",
                idempotencyKey: null,
            }),
            false,
        );
    });
});

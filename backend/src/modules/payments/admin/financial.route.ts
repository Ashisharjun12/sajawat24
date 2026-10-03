import { Router } from "express";
import { z } from "zod";
import { FinancialAdminController } from "@/modules/payments/admin/financial.controller.js";
import type { RefundRequestController } from "@/modules/booking/refunds/refund-request.controller.js";
import { createRefundRequestAdminRoutes } from "@/modules/booking/refunds/refund-request.route.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

const refundDto = z.object({
    reason: z.string().trim().min(3).max(500).optional(),
});

const payoutRequestIdParamsDto = z.object({
    id: z.string().uuid(),
});

const updatePayoutRequestDto = z.object({
    status: z.enum(["processing", "paid", "failed"]),
    failureReason: z.string().trim().min(3).max(500).optional(),
});

export function createFinancialAdminRouter(
    controller: FinancialAdminController,
    refundController?: RefundRequestController,
): Router {
    const router = Router();
    router.get("/overview", controller.overview);
    router.get("/vendors", controller.vendorLiabilities);
    router.get("/vendors/:vendorId/wallet", controller.vendorWallet);
    router.get("/payout-requests", controller.payoutRequests);
    router.get(
        "/payout-requests/:id",
        validate(payoutRequestIdParamsDto, "params"),
        controller.payoutRequestDetail,
    );
    router.patch(
        "/payout-requests/:id",
        validate(payoutRequestIdParamsDto, "params"),
        validate(updatePayoutRequestDto),
        controller.updatePayoutRequest,
    );
    router.get("/orders", controller.codPendingOrders);
    router.get("/revenue", controller.platformRevenue);
    if (refundController) {
        router.get(
            "/orders/:orderId/refund-request",
            validate(z.object({ orderId: z.string().uuid() }), "params"),
            refundController.getLatestForOrderAdmin,
        );
    }
    router.get("/orders/:orderId", controller.orderBreakdown);
    router.post(
        "/orders/:orderId/refund",
        validate(refundDto),
        controller.refundOrder,
    );
    router.post("/orders/:orderId/repost-ledger", controller.repostOrderLedger);

    if (refundController) {
        const refundRoutes = createRefundRequestAdminRoutes(refundController);
        router.get("/refund-requests", ...refundRoutes.list);
        router.get("/refund-requests/:id", ...refundRoutes.get);
        router.patch("/refund-requests/:id", ...refundRoutes.patch);
    }

    return router;
}

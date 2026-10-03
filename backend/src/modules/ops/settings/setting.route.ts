import { Router } from "express";
import { aiSettingsRouter } from "@/modules/ai/index.js";
import type { SettingController } from "@/modules/ops/settings/setting.controller.js";
import {
    patchBookingPolicyDto,
    patchDemoAuthDto,
    patchInstantDispatchDto,
    patchInstantMapsDto,
    patchInstantMarketplaceDto,
    patchNotificationChannelsDto,
    patchPaymentMethodsDto,
    patchPayoutPolicyDto,
} from "@/modules/ops/settings/setting.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";
import { getApiPublicOrigin, paymentWebhookUrl } from "@/lib/api-public-url.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";

export function createSettingsAdminRouter(controller: SettingController) {
    const router = Router();
    router.get("/notifications", controller.getNotifications);
    router.patch(
        "/notifications",
        validate(patchNotificationChannelsDto),
        controller.patchNotifications,
    );
    router.get("/payments", controller.getPayments);
    router.patch(
        "/payments",
        validate(patchPaymentMethodsDto),
        controller.patchPayments,
    );
    router.get("/payout-policy", controller.getPayoutPolicy);
    router.patch(
        "/payout-policy",
        validate(patchPayoutPolicyDto),
        controller.patchPayoutPolicy,
    );
    router.get("/booking-policy", controller.getBookingPolicy);
    router.patch(
        "/booking-policy",
        validate(patchBookingPolicyDto),
        controller.patchBookingPolicy,
    );
    router.get("/instant-dispatch", controller.getInstantDispatch);
    router.patch(
        "/instant-dispatch",
        validate(patchInstantDispatchDto),
        controller.patchInstantDispatch,
    );
    router.post("/instant-dispatch/system-user", controller.resolveInstantDispatchSystemUser);
    router.get("/instant-maps", controller.getInstantMaps);
    router.patch("/instant-maps", validate(patchInstantMapsDto), controller.patchInstantMaps);
    router.get("/instant-marketplace", controller.getInstantMarketplace);
    router.patch(
        "/instant-marketplace",
        validate(patchInstantMarketplaceDto),
        controller.patchInstantMarketplace,
    );
    router.get("/message-service/catalog", controller.getMessageServiceCatalog);
    router.get("/demo-auth", controller.getDemoAuth);
    router.patch("/demo-auth", validate(patchDemoAuthDto), controller.patchDemoAuth);
    router.use("/ai", aiSettingsRouter);
    return router;
}

export function createPaymentsPublicRouter(controller: SettingController) {
    const router = Router();
    router.get("/methods", controller.getPayments);
    router.get("/webhook-endpoints", (_req, res) => {
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    apiPublicUrl: getApiPublicOrigin(),
                    razorpay: paymentWebhookUrl("razorpay"),
                    cashfree: paymentWebhookUrl("cashfree"),
                    dashboardHint:
                        "Paste razorpay/cashfree URLs into each provider webhook settings.",
                },
                "ok",
            ),
        );
    });
    return router;
}

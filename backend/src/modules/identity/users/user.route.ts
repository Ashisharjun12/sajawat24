import { Router } from "express";
import type { AuthController } from "@/modules/identity/auth/auth.controller.js";
import type { UserController } from "@/modules/identity/users/user.controller.js";
import { linkGoogleDto, linkPhoneDto } from "@/modules/identity/users/user.dto.js";
import {
    registerPushDeviceDto,
    unregisterPushDeviceDto,
    vendorNotificationIdParamsDto,
    vendorNotificationsQueryDto,
} from "@/modules/notifications/devices/device.dto.js";
import type { UserNotificationController } from "@/modules/notifications/user-notification.controller.js";
import type { CustomerAddressController } from "@/modules/identity/addresses/customer-address.controller.js";
import { createCustomerAddressRouter } from "@/modules/identity/addresses/customer-address.route.js";
import type { RefundRequestController } from "@/modules/booking/refunds/refund-request.controller.js";
import { createRefundRequestUserRouter } from "@/modules/booking/refunds/refund-request.route.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createUserRouter(
    authController: AuthController,
    userController: UserController,
    userNotificationController: UserNotificationController,
    customerAddressController: CustomerAddressController,
    refundRequestController: RefundRequestController,
) {
    const router = Router();
    router.use("/addresses", createCustomerAddressRouter(customerAddressController));
    router.use("/refunds", createRefundRequestUserRouter(refundRequestController));
    router.get("/me", authRequired, authController.me);
    router.post("/link-phone", authRequired, validate(linkPhoneDto), userController.linkPhone);
    router.post("/link-google", authRequired, validate(linkGoogleDto), userController.linkGoogle);
    router.post(
        "/devices",
        authRequired,
        validate(registerPushDeviceDto),
        userNotificationController.registerDevice,
    );
    router.delete(
        "/devices",
        authRequired,
        validate(unregisterPushDeviceDto),
        userNotificationController.unregisterDevice,
    );
    router.get(
        "/notifications",
        authRequired,
        validate(vendorNotificationsQueryDto, "query"),
        userNotificationController.listInbox,
    );
    router.patch(
        "/notifications/read-all",
        authRequired,
        userNotificationController.markAllRead,
    );
    router.patch(
        "/notifications/:id/read",
        authRequired,
        validate(vendorNotificationIdParamsDto, "params"),
        userNotificationController.markRead,
    );
    return router;
}

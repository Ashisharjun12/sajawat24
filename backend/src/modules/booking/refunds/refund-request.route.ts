import { Router } from "express";
import type { RefundRequestController } from "@/modules/booking/refunds/refund-request.controller.js";
import {
    createRefundRequestDto,
    listRefundRequestsQueryDto,
    patchRefundRequestDto,
    refundRequestIdParamsDto,
    refundRequestOrderParamsDto,
} from "@/modules/booking/refunds/refund-request.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createRefundRequestUserRouter(controller: RefundRequestController) {
    const router = Router();
    router.use(authRequired);
    router.get("/", validate(listRefundRequestsQueryDto, "query"), controller.listForUser);
    router.post(
        "/orders/:orderId",
        validate(refundRequestOrderParamsDto, "params"),
        validate(createRefundRequestDto),
        controller.createForOrder,
    );
    router.get(
        "/orders/:orderId/latest",
        validate(refundRequestOrderParamsDto, "params"),
        controller.getLatestForOrder,
    );
    return router;
}

export function createRefundRequestAdminRoutes(controller: RefundRequestController) {
    return {
        list: [validate(listRefundRequestsQueryDto, "query"), controller.listAdmin] as const,
        get: [validate(refundRequestIdParamsDto, "params"), controller.getAdmin] as const,
        patch: [
            validate(refundRequestIdParamsDto, "params"),
            validate(patchRefundRequestDto),
            controller.patchAdmin,
        ] as const,
    };
}

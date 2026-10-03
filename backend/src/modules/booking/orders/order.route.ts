import { Router } from "express";
import type { OrderController } from "@/modules/booking/orders/order.controller.js";
import {
    createOrderDto,
    listOrdersQueryDto,
    orderIdParamsDto,
} from "@/modules/booking/orders/order.dto.js";
import { submitOrderReviewDto } from "@/modules/reviews/review.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createOrderRouter(orderController: OrderController) {
    const router = Router();
    router.use(authRequired);
    router.get("/", validate(listOrdersQueryDto, "query"), orderController.list);
    router.post("/", validate(createOrderDto), orderController.create);
    router.get("/:id", validate(orderIdParamsDto, "params"), orderController.getById);
    router.post(
        "/:id/cancel",
        validate(orderIdParamsDto, "params"),
        orderController.cancelPendingPayment,
    );
    router.post(
        "/:id/checkout",
        validate(orderIdParamsDto, "params"),
        orderController.resumeCheckout,
    );
    router.get(
        "/:id/tracking",
        validate(orderIdParamsDto, "params"),
        orderController.getTracking,
    );
    router.get(
        "/:id/route",
        validate(orderIdParamsDto, "params"),
        orderController.getRoute,
    );
    router.post(
        "/:id/review",
        validate(orderIdParamsDto, "params"),
        validate(submitOrderReviewDto),
        orderController.submitReview,
    );
    return router;
}

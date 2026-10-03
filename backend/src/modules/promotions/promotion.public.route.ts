import { Router } from "express";
import { availableCouponsQueryDto } from "@/modules/promotions/coupons/coupon.dto.js";
import type { PromotionPublicController } from "@/modules/promotions/promotion.public.controller.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createPromotionsPublicRouter(controller: PromotionPublicController) {
    const router = Router();
    router.get(
        "/coupons/available",
        validate(availableCouponsQueryDto, "query"),
        controller.listAvailable,
    );
    return router;
}

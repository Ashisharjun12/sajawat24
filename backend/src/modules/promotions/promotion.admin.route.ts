import { Router } from "express";
import type { CouponAdminController } from "@/modules/promotions/coupons/coupon.controller.js";
import {
    couponIdParamsDto,
    createCouponDto,
    listCouponsQueryDto,
    listRedemptionsQueryDto,
    patchCouponDto,
    patchCouponStatusDto,
} from "@/modules/promotions/coupons/coupon.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createPromotionsAdminRouter(controller: CouponAdminController) {
    const router = Router();
    router.get("/overview", controller.overview);
    router.get("/coupons", validate(listCouponsQueryDto, "query"), controller.list);
    router.post("/coupons", validate(createCouponDto), controller.create);
    router.patch(
        "/coupons/:id",
        validate(couponIdParamsDto, "params"),
        validate(patchCouponDto),
        controller.patch,
    );
    router.patch(
        "/coupons/:id/status",
        validate(couponIdParamsDto, "params"),
        validate(patchCouponStatusDto),
        controller.patchStatus,
    );
    router.get("/redemptions", validate(listRedemptionsQueryDto, "query"), controller.listRedemptions);
    return router;
}

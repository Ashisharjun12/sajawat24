import { Router } from "express";
import type { CartController } from "@/modules/booking/carts/cart.controller.js";
import {
    addCartItemDto,
    cartItemIdParamsDto,
    cartDeliveryGeoDto,
    cartLocationDto,
    patchCartItemDto,
} from "@/modules/booking/carts/cart.dto.js";
import { applyCartCouponDto } from "@/modules/promotions/coupons/coupon.dto.js";
import { authOptional, authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCartRouter(cartController: CartController) {
    const router = Router();
    router.use(authOptional);
    router.get("/", cartController.get);
    router.post("/items", validate(addCartItemDto), cartController.addItem);
    router.patch(
        "/items/:id",
        validate(cartItemIdParamsDto, "params"),
        validate(patchCartItemDto),
        cartController.patchItem,
    );
    router.delete(
        "/items/:id",
        validate(cartItemIdParamsDto, "params"),
        cartController.removeItem,
    );
    router.post("/location", validate(cartLocationDto), cartController.setLocation);
    router.post("/delivery-geo", validate(cartDeliveryGeoDto), cartController.setDeliveryGeo);
    router.post("/merge", authRequired, cartController.merge);
    router.post("/coupon", validate(applyCartCouponDto), cartController.applyCoupon);
    router.delete("/coupon", cartController.removeCoupon);
    return router;
}

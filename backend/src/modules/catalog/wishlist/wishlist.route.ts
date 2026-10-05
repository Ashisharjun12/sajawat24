import { Router } from "express";
import type { WishlistController } from "@/modules/catalog/wishlist/wishlist.controller.js";
import {
    addWishlistItemDto,
    mergeWishlistDto,
    wishlistLocationQueryDto,
    wishlistProductIdParamsDto,
} from "@/modules/catalog/wishlist/wishlist.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createWishlistRouter(wishlistController: WishlistController) {
    const router = Router();
    router.use(authRequired);
    router.get("/", validate(wishlistLocationQueryDto, "query"), wishlistController.list);
    router.post(
        "/items",
        validate(wishlistLocationQueryDto, "query"),
        validate(addWishlistItemDto),
        wishlistController.addItem,
    );
    router.delete(
        "/items/:productId",
        validate(wishlistProductIdParamsDto, "params"),
        validate(wishlistLocationQueryDto, "query"),
        wishlistController.removeItem,
    );
    router.post(
        "/merge",
        validate(wishlistLocationQueryDto, "query"),
        validate(mergeWishlistDto),
        wishlistController.merge,
    );
    return router;
}

import { Router } from "express";
import type { ReviewAdminController } from "@/modules/reviews/review.admin.controller.js";
import {
    createCustomerReviewDto,
    createVideoReviewDto,
    listCustomerReviewsQueryDto,
    listVideoReviewsQueryDto,
    patchCustomerReviewDto,
    patchVideoReviewDto,
    productReviewParamsDto,
    reviewIdParamsDto,
} from "@/modules/reviews/review.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createReviewsAdminRouter(controller: ReviewAdminController) {
    const router = Router();
    router.get(
        "/customer-reviews",
        validate(listCustomerReviewsQueryDto, "query"),
        controller.listCustomerReviews,
    );
    router.get(
        "/products/:productId/customer-reviews",
        validate(productReviewParamsDto, "params"),
        validate(listCustomerReviewsQueryDto, "query"),
        controller.listProductCustomerReviews,
    );
    router.get(
        "/customer-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        controller.getCustomerReview,
    );
    router.post("/customer-reviews", validate(createCustomerReviewDto), controller.createCustomerReview);
    router.patch(
        "/customer-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        validate(patchCustomerReviewDto),
        controller.patchCustomerReview,
    );
    router.delete(
        "/customer-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        controller.deleteCustomerReview,
    );
    router.get(
        "/video-reviews",
        validate(listVideoReviewsQueryDto, "query"),
        controller.listVideoReviews,
    );
    router.get(
        "/video-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        controller.getVideoReview,
    );
    router.post("/video-reviews", validate(createVideoReviewDto), controller.createVideoReview);
    router.patch(
        "/video-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        validate(patchVideoReviewDto),
        controller.patchVideoReview,
    );
    router.delete(
        "/video-reviews/:id",
        validate(reviewIdParamsDto, "params"),
        controller.deleteVideoReview,
    );
    return router;
}

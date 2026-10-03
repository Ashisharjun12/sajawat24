import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CustomerReviewService } from "@/modules/reviews/customer-reviews/customer-review.service.js";

export class ReviewPublicController {
    constructor(private readonly customerReviews: CustomerReviewService) {}

    listProductReviews = asyncHandler(async (req, res) => {
        const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.customerReviews.listPublic(productId, req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}

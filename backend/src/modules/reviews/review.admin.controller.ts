import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CustomerReviewService } from "@/modules/reviews/customer-reviews/customer-review.service.js";
import type { VideoReviewService } from "@/modules/reviews/video-reviews/video-review.service.js";

export class ReviewAdminController {
    constructor(
        private readonly customerReviews: CustomerReviewService,
        private readonly videoReviews: VideoReviewService,
    ) {}

    listCustomerReviews = asyncHandler(async (req, res) => {
        const data = await this.customerReviews.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listProductCustomerReviews = asyncHandler(async (req, res) => {
        const productId = Array.isArray(req.params.productId)
            ? req.params.productId[0]
            : req.params.productId;
        const data = await this.customerReviews.listByProductAdmin(productId, req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getCustomerReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.customerReviews.getAdmin(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createCustomerReview = asyncHandler(async (req, res) => {
        const data = await this.customerReviews.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "review created"));
    });

    patchCustomerReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.customerReviews.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "review updated"));
    });

    deleteCustomerReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.customerReviews.delete(id);
        res.status(200).json(new ApiResponse(200, data, "review deleted"));
    });

    listVideoReviews = asyncHandler(async (req, res) => {
        const data = await this.videoReviews.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getVideoReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.videoReviews.getAdmin(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createVideoReview = asyncHandler(async (req, res) => {
        const data = await this.videoReviews.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "video review created"));
    });

    patchVideoReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.videoReviews.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "video review updated"));
    });

    deleteVideoReview = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.videoReviews.delete(id);
        res.status(200).json(new ApiResponse(200, data, "video review deleted"));
    });
}

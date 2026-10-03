import { ProductRepository } from "@/modules/catalog/products/product.repository.js";
import { CustomerReviewRepository } from "@/modules/reviews/customer-reviews/customer-review.repository.js";
import { CustomerReviewService } from "@/modules/reviews/customer-reviews/customer-review.service.js";
import { ReviewAdminController } from "@/modules/reviews/review.admin.controller.js";
import { createReviewsAdminRouter } from "@/modules/reviews/review.admin.route.js";
import { ReviewPublicController } from "@/modules/reviews/review.public.controller.js";
import { ReviewStatsService } from "@/modules/reviews/review-stats.service.js";
import { VideoReviewRepository } from "@/modules/reviews/video-reviews/video-review.repository.js";
import { VideoReviewService } from "@/modules/reviews/video-reviews/video-review.service.js";

const customerReviewRepository = new CustomerReviewRepository();
const videoReviewRepository = new VideoReviewRepository();
const productRepository = new ProductRepository();
const reviewStatsService = new ReviewStatsService(customerReviewRepository);

export const customerReviewService = new CustomerReviewService(
    customerReviewRepository,
    productRepository,
    reviewStatsService,
);

export const videoReviewService = new VideoReviewService(videoReviewRepository);

const reviewAdminController = new ReviewAdminController(customerReviewService, videoReviewService);
export const reviewsAdminRouter = createReviewsAdminRouter(reviewAdminController);

export const reviewPublicController = new ReviewPublicController(customerReviewService);

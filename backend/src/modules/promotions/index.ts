import { CouponRepository } from "@/modules/promotions/coupons/coupon.repository.js";
import { CouponAdminService } from "@/modules/promotions/coupons/coupon.service.js";
import { CouponAdminController } from "@/modules/promotions/coupons/coupon.controller.js";
import { createPromotionsAdminRouter } from "@/modules/promotions/promotion.admin.route.js";
import { PromotionPublicController } from "@/modules/promotions/promotion.public.controller.js";
import { createPromotionsPublicRouter } from "@/modules/promotions/promotion.public.route.js";
import { PromotionService } from "@/modules/promotions/promotion.service.js";
import { CouponTargetRepository } from "@/modules/promotions/targets/coupon-target.repository.js";
import { RedemptionRepository } from "@/modules/promotions/redemptions/redemption.repository.js";

const couponRepository = new CouponRepository();
const couponTargetRepository = new CouponTargetRepository();
const redemptionRepository = new RedemptionRepository();

export const promotionService = new PromotionService(
    couponRepository,
    couponTargetRepository,
    redemptionRepository,
);

export const couponAdminService = new CouponAdminService(
    couponRepository,
    couponTargetRepository,
    redemptionRepository,
);

const couponAdminController = new CouponAdminController(couponAdminService);
const promotionPublicController = new PromotionPublicController(promotionService);

export const promotionsAdminRouter = createPromotionsAdminRouter(couponAdminController);
export const promotionsPublicRouter = createPromotionsPublicRouter(promotionPublicController);

export { CouponRepository, RedemptionRepository, PromotionService };

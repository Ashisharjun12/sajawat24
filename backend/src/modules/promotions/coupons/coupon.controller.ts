import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CouponAdminService } from "@/modules/promotions/coupons/coupon.service.js";

export class CouponAdminController {
    constructor(private readonly coupons: CouponAdminService) {}

    overview = asyncHandler(async (_req, res) => {
        const data = await this.coupons.getOverview();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    list = asyncHandler(async (req, res) => {
        const data = await this.coupons.list(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.coupons.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "coupon created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.coupons.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "coupon updated"));
    });

    patchStatus = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.coupons.setStatus(id, req.body.isActive);
        res.status(200).json(new ApiResponse(200, data, "coupon status updated"));
    });

    listRedemptions = asyncHandler(async (req, res) => {
        const data = await this.coupons.listRedemptions(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}

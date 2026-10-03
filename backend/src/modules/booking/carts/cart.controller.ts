import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ICartService } from "@/modules/booking/carts/cart.service.js";

export class CartController {
    constructor(private readonly carts: ICartService) {}

    get = asyncHandler(async (req, res) => {
        const data = await this.carts.getCart(req, res, req.actor);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    addItem = asyncHandler(async (req, res) => {
        const data = await this.carts.addItem(req, res, req.actor, req.body);
        res.status(200).json(new ApiResponse(200, data, "added to bag"));
    });

    patchItem = asyncHandler(async (req, res) => {
        const id = paramId(req);
        const data = await this.carts.patchItem(req, res, req.actor, id, req.body.quantity);
        res.status(200).json(new ApiResponse(200, data, "bag updated"));
    });

    removeItem = asyncHandler(async (req, res) => {
        const id = paramId(req);
        const data = await this.carts.removeItem(req, res, req.actor, id);
        res.status(200).json(new ApiResponse(200, data, "removed from bag"));
    });

    setLocation = asyncHandler(async (req, res) => {
        const data = await this.carts.setLocation(req, res, req.actor, req.body);
        res.status(200).json(new ApiResponse(200, data, "location updated"));
    });

    setDeliveryGeo = asyncHandler(async (req, res) => {
        const data = await this.carts.setDeliveryGeo(req, res, req.actor, req.body);
        res.status(200).json(new ApiResponse(200, data, "delivery location saved"));
    });

    merge = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const data = await this.carts.merge(req, res, { id: req.actor.id });
        res.status(200).json(new ApiResponse(200, data, "bag merged"));
    });

    applyCoupon = asyncHandler(async (req, res) => {
        const data = await this.carts.applyCoupon(req, res, req.actor, req.body.code);
        res.status(200).json(new ApiResponse(200, data, "coupon applied"));
    });

    removeCoupon = asyncHandler(async (req, res) => {
        const data = await this.carts.removeCoupon(req, res, req.actor);
        res.status(200).json(new ApiResponse(200, data, "coupon removed"));
    });
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

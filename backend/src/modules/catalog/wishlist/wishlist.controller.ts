import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IWishlistService } from "@/modules/catalog/wishlist/wishlist.service.js";

export class WishlistController {
    constructor(private readonly wishlist: IWishlistService) {}

    list = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const data = await this.wishlist.list(userId, req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    addItem = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const data = await this.wishlist.add(userId, req.body.productId, req.query);
        res.status(200).json(new ApiResponse(200, data, "saved"));
    });

    removeItem = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const productId = paramProductId(req);
        const data = await this.wishlist.remove(userId, productId, req.query);
        res.status(200).json(new ApiResponse(200, data, "removed"));
    });

    merge = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const data = await this.wishlist.merge(userId, req.body.productIds ?? [], req.query);
        res.status(200).json(new ApiResponse(200, data, "merged"));
    });
}

function requireUserId(req: Request): string {
    const id = req.actor?.id;
    if (!id) throw new Error("auth required");
    return id;
}

function paramProductId(req: Request): string {
    const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
    return String(productId ?? "");
}

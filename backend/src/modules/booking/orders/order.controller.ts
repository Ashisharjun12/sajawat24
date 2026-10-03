import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IOrderService } from "@/modules/booking/orders/order.service.js";

export class OrderController {
    constructor(private readonly orders: IOrderService) {}

    list = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const data = await this.orders.listForUser(req.actor.id, req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const data = await this.orders.createFromCart(req.actor.id, req.body);
        const message =
            req.body.paymentMethod === "online" ? "payment required" : "booking confirmed";
        res.status(200).json(new ApiResponse(200, data, message));
    });

    getById = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.getForUser(req.actor.id, id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getTracking = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.getTrackingForUser(req.actor.id, id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getRoute = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.getRouteForUser(req.actor.id, id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    cancelPendingPayment = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.cancelPendingPaymentForUser(req.actor.id, id);
        res.status(200).json(new ApiResponse(200, data, "payment cancelled"));
    });

    resumeCheckout = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.resumeCheckoutForUser(req.actor.id, id);
        res.status(200).json(new ApiResponse(200, data, "payment required"));
    });

    submitReview = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const id = paramId(req);
        const data = await this.orders.submitReview(req.actor.id, id, req.body);
        res.status(201).json(new ApiResponse(201, data, "review submitted"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.orders.listAdmin(req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getForAdmin = asyncHandler(async (req, res) => {
        const id = paramId(req);
        const data = await this.orders.getForAdmin(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createAdmin = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const data = await this.orders.createAdminOrder(req.actor.id, req.body);
        res.status(201).json(new ApiResponse(201, data, "booking created"));
    });
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

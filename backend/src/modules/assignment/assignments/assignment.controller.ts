import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAssignmentService } from "@/modules/assignment/assignments/assignment.service.js";
import type { IOrderService } from "@/modules/booking/orders/order.service.js";

export class AssignmentController {
    constructor(
        private readonly assignments: IAssignmentService,
        private readonly orders: IOrderService,
    ) {}

    listCandidates = asyncHandler(async (req, res) => {
        const orderId = paramId(req);
        const data = await this.assignments.listCandidates(orderId, req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    assign = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const orderId = paramId(req);
        const data = await this.assignments.assign(
            orderId,
            req.body,
            req.actor.id,
            (id) => this.orders.getForAdmin(id),
        );
        res.status(200).json(new ApiResponse(200, data, "vendor assigned"));
    });
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

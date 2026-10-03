import type { Request } from "express";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CollectionService } from "@/modules/payments/collections/collection.service.js";
import { OrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";

export class CollectionController {
    private readonly fieldAssignments = new OrderFieldAssignmentRepository();

    constructor(private readonly collections: CollectionService) {}

    private async assertFieldCollect(partner: NonNullable<Request["partner"]>, orderId: string) {
        if (partner.mode !== "field") {
            throw ApiError.forbidden("switch to worker mode to collect payment");
        }
        const assigned = await this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
        if (!assigned) {
            throw ApiError.forbidden("job not assigned to you");
        }
    }

    status = asyncHandler(async (req: Request, res) => {
        const orderId = String(req.params.orderId);
        const data = await this.collections.getStatusForVendor(orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    collectCash = asyncHandler(async (req: Request, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = String(req.params.orderId);
        await this.assertFieldCollect(partner, orderId);
        const data = await this.collections.collectCash(orderId, partner.vendorId);
        res.status(200).json(new ApiResponse(200, data, "cash collected"));
    });

    collectOnline = asyncHandler(async (req: Request, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = String(req.params.orderId);
        await this.assertFieldCollect(partner, orderId);
        const data = await this.collections.collectOnline(orderId, partner.vendorId);
        res.status(200).json(new ApiResponse(200, data, "collection qr created"));
    });
}

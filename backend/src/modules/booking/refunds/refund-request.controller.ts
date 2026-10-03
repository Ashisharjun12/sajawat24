import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { RefundRequestService } from "@/modules/booking/refunds/refund-request.service.js";

function paramId(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

export class RefundRequestController {
    constructor(private readonly service: RefundRequestService) {}

    listForUser = asyncHandler(async (req, res) => {
        const data = await this.service.listForUser(req.actor!.id, req.query);
        res.status(200).json(new ApiResponse(200, data, "refunds"));
    });

    createForOrder = asyncHandler(async (req, res) => {
        const refund = await this.service.createForOrder(
            req.actor!.id,
            paramId(req.params.orderId),
            req.body.reason,
        );
        res.status(201).json(new ApiResponse(201, { refund }, "refund requested"));
    });

    getLatestForOrder = asyncHandler(async (req, res) => {
        const refund = await this.service.getLatestForOrder(
            paramId(req.params.orderId),
            req.actor!.id,
        );
        res.status(200).json(new ApiResponse(200, { refund }, "ok"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.service.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "refunds"));
    });

    getAdmin = asyncHandler(async (req, res) => {
        const refund = await this.service.getAdmin(paramId(req.params.id));
        res.status(200).json(new ApiResponse(200, { refund }, "ok"));
    });

    patchAdmin = asyncHandler(async (req, res) => {
        const refund = await this.service.patchAdmin(
            paramId(req.params.id),
            req.actor!.id,
            req.body.action,
            req.body.adminNote,
        );
        res.status(200).json(new ApiResponse(200, { refund }, "refund updated"));
    });

    getLatestForOrderAdmin = asyncHandler(async (req, res) => {
        const refund = await this.service.getLatestForOrderAdmin(paramId(req.params.orderId));
        res.status(200).json(new ApiResponse(200, { refund }, "ok"));
    });
}

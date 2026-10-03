import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IPaymentIntentService } from "@/modules/payments/intents/payment-intent.service.js";

export class PaymentIntentController {
    constructor(private readonly payments: IPaymentIntentService) {}

    verify = asyncHandler(async (req, res) => {
        if (!req.actor?.id) {
            throw ApiError.unauthorized("login required");
        }
        const data = await this.payments.verifyAndConfirm(req.actor.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "payment verified"));
    });
}

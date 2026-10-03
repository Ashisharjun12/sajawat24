import type { Request } from "express";
import { payoutMethodService } from "@/modules/payments/payout-methods/payout-method.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";

export class PayoutMethodController {
    list = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await payoutMethodService.listForUser(userId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    addBank = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await payoutMethodService.addBankForUser(userId, req.body);
        res.status(201).json(new ApiResponse(201, data, "bank account added"));
    });

    addUpi = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await payoutMethodService.addUpiForUser(userId, req.body);
        res.status(201).json(new ApiResponse(201, data, "upi id added"));
    });

    setDefault = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await payoutMethodService.setDefaultForUser(userId, String(req.params.id));
        res.status(200).json(new ApiResponse(200, data, "default updated"));
    });

    remove = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        await payoutMethodService.removeForUser(userId, String(req.params.id));
        res.status(200).json(new ApiResponse(200, { ok: true }, "removed"));
    });
}

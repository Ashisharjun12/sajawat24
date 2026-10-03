import type { Request } from "express";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { WalletService } from "@/modules/payments/wallets/wallet.service.js";

export class WalletController {
    constructor(private readonly wallets: WalletService) {}

    summary = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.wallets.getSummaryForUser(userId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    activity = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.wallets.listActivityForUser(userId, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            type: typeof req.query.type === "string" ? req.query.type : undefined,
            from: typeof req.query.from === "string" ? req.query.from : undefined,
            to: typeof req.query.to === "string" ? req.query.to : undefined,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    transactions = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.wallets.listTransactionsForUser(userId, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    payoutRequests = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.wallets.listPayoutRequestsForUser(userId, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    withdraw = asyncHandler(async (req: Request, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.wallets.withdrawForUser(
            userId,
            req.body.amountPaise,
            req.body.payoutMethodId,
        );
        res.status(200).json(new ApiResponse(200, data, "withdrawal requested"));
    });
}

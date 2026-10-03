import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { AdminAccountService } from "@/modules/identity/admin-account/admin-account.service.js";

export class AdminAccountController {
    constructor(private readonly account: AdminAccountService) {}

    getAccount = asyncHandler(async (req, res) => {
        const data = await this.account.getAccount(req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchProfile = asyncHandler(async (req, res) => {
        const data = await this.account.updateProfile(req.actor!.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    changePassword = asyncHandler(async (req, res) => {
        const data = await this.account.changePassword(req.actor!.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    changeEmail = asyncHandler(async (req, res) => {
        const data = await this.account.requestEmailChange(req.actor!.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    skipPasswordSetup = asyncHandler(async (req, res) => {
        const data = await this.account.skipPasswordSetup(req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    verifyEmailChange = asyncHandler(async (req, res) => {
        const token = typeof req.query.token === "string" ? req.query.token : "";
        const data = await this.account.confirmEmailChange(token);
        res.status(200).json(new ApiResponse(200, data, "email verified"));
    });
}

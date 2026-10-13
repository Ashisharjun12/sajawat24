import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAccountDeletionService } from "@/modules/identity/account/account-deletion.service.js";

export class AccountController {
    constructor(private readonly accountDeletion: IAccountDeletionService) {}

    deleteConsumerAccount = asyncHandler(async (req, res) => {
        await this.accountDeletion.deleteConsumerAccount(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { deleted: true }, "account deleted"));
    });
}

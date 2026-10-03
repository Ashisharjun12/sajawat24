import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAuthService } from "@/modules/identity/auth/auth.service.js";

export class UserController {
    constructor(private readonly authService: IAuthService) {}

    linkPhone = asyncHandler(async (req, res) => {
        const user = await this.authService.linkPhone(
            req.actor!.id,
            req.body.phone,
            req.body.otp,
        );
        res.status(200).json(new ApiResponse(200, { user }, "phone linked"));
    });

    linkGoogle = asyncHandler(async (req, res) => {
        const user = await this.authService.linkGoogle(req.actor!.id, req.body.idToken);
        res.status(200).json(new ApiResponse(200, { user }, "google linked"));
    });
}

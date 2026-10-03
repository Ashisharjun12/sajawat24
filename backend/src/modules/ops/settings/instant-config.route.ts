import { Router } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ISettingService } from "@/modules/ops/settings/setting.service.js";

export function createInstantConfigPublicRouter(settings: ISettingService) {
    const router = Router();
    router.get(
        "/instant",
        asyncHandler(async (_req, res) => {
            const data = await settings.getPublicInstantConfig();
            res.status(200).json(new ApiResponse(200, data, "ok"));
        }),
    );
    return router;
}

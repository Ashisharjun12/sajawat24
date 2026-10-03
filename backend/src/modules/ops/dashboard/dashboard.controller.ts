import type { DashboardService } from "@/modules/ops/dashboard/dashboard.service.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";

export class DashboardController {
    constructor(private readonly dashboard: DashboardService) {}

    overview = asyncHandler(async (_req, res) => {
        const data = await this.dashboard.getOverview();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}

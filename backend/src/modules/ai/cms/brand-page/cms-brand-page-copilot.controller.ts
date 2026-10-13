import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CmsBrandPageCopilotService } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.service.js";

export class CmsBrandPageCopilotController {
    constructor(private readonly cmsBrandPageCopilot: CmsBrandPageCopilotService) {}

    suggestBrandPage = asyncHandler(async (req, res) => {
        const data = await this.cmsBrandPageCopilot.suggestBrandPage(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "brand page draft generated"));
    });
}

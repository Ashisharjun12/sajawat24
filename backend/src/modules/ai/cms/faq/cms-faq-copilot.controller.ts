import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CmsFaqCopilotService } from "@/modules/ai/cms/faq/cms-faq-copilot.service.js";

export class CmsFaqCopilotController {
    constructor(private readonly cmsFaqCopilot: CmsFaqCopilotService) {}

    suggestFaq = asyncHandler(async (req, res) => {
        const data = await this.cmsFaqCopilot.suggestFaq(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "faq draft generated"));
    });
}

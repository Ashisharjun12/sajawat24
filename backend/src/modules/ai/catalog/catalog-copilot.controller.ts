import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CatalogCopilotService } from "@/modules/ai/catalog/catalog-copilot.service.js";

export class CatalogCopilotController {
    constructor(private readonly catalogCopilot: CatalogCopilotService) {}

    generateProductCopy = asyncHandler(async (req, res) => {
        const data = await this.catalogCopilot.generateProductCopy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "product copy generated"));
    });
}

import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CmsTestimonialCopilotService } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.service.js";

export class CmsTestimonialCopilotController {
    constructor(private readonly cmsTestimonialCopilot: CmsTestimonialCopilotService) {}

    suggestTestimonial = asyncHandler(async (req, res) => {
        const data = await this.cmsTestimonialCopilot.suggestTestimonial(
            req.body,
            req.actor!.id,
        );
        res.status(200).json(new ApiResponse(200, data, "testimonial draft generated"));
    });
}

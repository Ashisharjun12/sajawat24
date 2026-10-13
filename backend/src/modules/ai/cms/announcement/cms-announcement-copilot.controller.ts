import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CmsAnnouncementCopilotService } from "@/modules/ai/cms/announcement/cms-announcement-copilot.service.js";

export class CmsAnnouncementCopilotController {
    constructor(private readonly cmsAnnouncementCopilot: CmsAnnouncementCopilotService) {}

    suggestAnnouncement = asyncHandler(async (req, res) => {
        const data = await this.cmsAnnouncementCopilot.suggestAnnouncement(
            req.body,
            req.actor!.id,
        );
        res.status(200).json(new ApiResponse(200, data, "announcement draft generated"));
    });
}

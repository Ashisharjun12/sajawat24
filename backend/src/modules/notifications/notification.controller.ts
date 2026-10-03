import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { TemplateService } from "@/modules/notifications/templates/template.service.js";
import type { PreferenceService } from "@/modules/notifications/preferences/preference.service.js";

export class NotificationTemplateController {
    constructor(private readonly templates: TemplateService) {}

    list = asyncHandler(async (_req, res) => {
        const items = await this.templates.listAdmin();
        res.status(200).json(new ApiResponse(200, { items }, "ok"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.templates.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "template updated"));
    });

    createVersion = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.templates.addVersion(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "template version created"));
    });
}

export class NotificationPreferenceController {
    constructor(private readonly prefs: PreferenceService) {}

    get = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.prefs.get(userId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    put = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.prefs.put(userId, req.body);
        res.status(200).json(new ApiResponse(200, data, "preferences updated"));
    });
}

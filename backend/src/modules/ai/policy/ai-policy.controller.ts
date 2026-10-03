import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAiPolicyService } from "@/modules/ai/policy/ai-policy.service.js";

export class AiPolicyController {
    constructor(private readonly aiPolicy: IAiPolicyService) {}

    getPolicy = asyncHandler(async (_req, res) => {
        const data = await this.aiPolicy.getPolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchPolicy = asyncHandler(async (req, res) => {
        const data = await this.aiPolicy.patchPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "AI policy updated"));
    });

    getPublicStatus = asyncHandler(async (_req, res) => {
        const data = await this.aiPolicy.getPolicy();
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    enabled: data.enabled,
                    admin: data.admin,
                    web: data.web,
                    customer: data.customer,
                    vendor: data.vendor,
                    llmConfigured: data.llmConfigured,
                },
                "ok",
            ),
        );
    });
}

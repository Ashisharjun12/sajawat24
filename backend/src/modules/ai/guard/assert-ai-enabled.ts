import { ApiError } from "@/shared/errors/apiError.js";
import type { IAiPolicyService } from "@/modules/ai/policy/ai-policy.service.js";
import { isLlmConfigured } from "@/modules/ai/policy/llm-configured.js";
import type { AiSurface } from "@/modules/ai/policy/ai-policy.js";

export async function assertAiEnabled(
    service: IAiPolicyService,
    surface: AiSurface,
): Promise<void> {
    const enabled = await service.isEnabledFor(surface);
    if (!enabled) {
        const policy = await service.getPolicy();
        if (!policy.enabled || !policy[surface]) {
            throw ApiError.forbidden("AI is disabled for this surface");
        }
        if (!isLlmConfigured()) {
            throw new ApiError(503, "LLM is not configured");
        }
        throw ApiError.forbidden("AI is disabled for this surface");
    }
}

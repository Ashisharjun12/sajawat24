import { CatalogCopilotController } from "@/modules/ai/catalog/catalog-copilot.controller.js";
import { catalogCopilotService } from "@/modules/ai/catalog/catalog-copilot.service.js";
import { AiPolicyController } from "@/modules/ai/policy/ai-policy.controller.js";
import { aiPolicyService } from "@/modules/ai/policy/ai-policy.runtime.js";
import { createAiAdminRouter, createAiPublicRouter, createAiSettingsRouter } from "@/modules/ai/routes/ai.route.js";
import { requireAiEnabled } from "@/modules/ai/guard/require-ai-enabled.js";
import type { AiSurface } from "@/modules/ai/policy/ai-policy.js";

const aiPolicyController = new AiPolicyController(aiPolicyService);
const catalogCopilotController = new CatalogCopilotController(catalogCopilotService);

export const aiSettingsRouter = createAiSettingsRouter(aiPolicyController);
export const aiPublicRouter = createAiPublicRouter(aiPolicyController);
export const aiAdminRouter = createAiAdminRouter(catalogCopilotController);

export { aiPolicyService };
export { requireAiEnabled };

export async function isAiEnabled(surface: AiSurface): Promise<boolean> {
    return aiPolicyService.isEnabledFor(surface);
}

export type { AiPolicy, AiPolicyView, AiSurface } from "@/modules/ai/policy/ai-policy.js";
export type { PatchAiPolicyInput, IAiPolicyService } from "@/modules/ai/policy/ai-policy.service.js";

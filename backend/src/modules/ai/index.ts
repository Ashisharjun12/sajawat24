import { CatalogCopilotController } from "@/modules/ai/catalog/catalog-copilot.controller.js";
import { catalogCopilotService } from "@/modules/ai/catalog/catalog-copilot.service.js";
import { CmsFaqCopilotController } from "@/modules/ai/cms/faq/cms-faq-copilot.controller.js";
import { cmsFaqCopilotService } from "@/modules/ai/cms/faq/cms-faq-copilot.service.js";
import { CmsTestimonialCopilotController } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.controller.js";
import { cmsTestimonialCopilotService } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.service.js";
import { CmsAnnouncementCopilotController } from "@/modules/ai/cms/announcement/cms-announcement-copilot.controller.js";
import { cmsAnnouncementCopilotService } from "@/modules/ai/cms/announcement/cms-announcement-copilot.service.js";
import { CmsBrandPageCopilotController } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.controller.js";
import { cmsBrandPageCopilotService } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.service.js";
import { AiPolicyController } from "@/modules/ai/policy/ai-policy.controller.js";
import { aiPolicyService } from "@/modules/ai/policy/ai-policy.runtime.js";
import { createAiAdminRouter, createAiPublicRouter, createAiSettingsRouter } from "@/modules/ai/routes/ai.route.js";
import { requireAiEnabled } from "@/modules/ai/guard/require-ai-enabled.js";
import type { AiSurface } from "@/modules/ai/policy/ai-policy.js";

const aiPolicyController = new AiPolicyController(aiPolicyService);
const catalogCopilotController = new CatalogCopilotController(catalogCopilotService);
const cmsFaqCopilotController = new CmsFaqCopilotController(cmsFaqCopilotService);
const cmsTestimonialCopilotController = new CmsTestimonialCopilotController(
    cmsTestimonialCopilotService,
);
const cmsAnnouncementCopilotController = new CmsAnnouncementCopilotController(
    cmsAnnouncementCopilotService,
);
const cmsBrandPageCopilotController = new CmsBrandPageCopilotController(
    cmsBrandPageCopilotService,
);

export const aiSettingsRouter = createAiSettingsRouter(aiPolicyController);
export const aiPublicRouter = createAiPublicRouter(aiPolicyController);
export const aiAdminRouter = createAiAdminRouter(
    catalogCopilotController,
    cmsFaqCopilotController,
    cmsTestimonialCopilotController,
    cmsAnnouncementCopilotController,
    cmsBrandPageCopilotController,
);

export { aiPolicyService };
export { requireAiEnabled };

export async function isAiEnabled(surface: AiSurface): Promise<boolean> {
    return aiPolicyService.isEnabledFor(surface);
}

export type { AiPolicy, AiPolicyView, AiSurface } from "@/modules/ai/policy/ai-policy.js";
export type { PatchAiPolicyInput, IAiPolicyService } from "@/modules/ai/policy/ai-policy.service.js";

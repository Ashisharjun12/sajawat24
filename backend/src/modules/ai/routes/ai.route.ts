import { Router } from "express";
import type { CatalogCopilotController } from "@/modules/ai/catalog/catalog-copilot.controller.js";
import { generateProductCopyDto } from "@/modules/ai/catalog/catalog-copilot.dto.js";
import type { CmsFaqCopilotController } from "@/modules/ai/cms/faq/cms-faq-copilot.controller.js";
import { suggestCmsFaqDto } from "@/modules/ai/cms/faq/cms-faq-copilot.dto.js";
import type { CmsTestimonialCopilotController } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.controller.js";
import { suggestCmsTestimonialDto } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.dto.js";
import type { CmsAnnouncementCopilotController } from "@/modules/ai/cms/announcement/cms-announcement-copilot.controller.js";
import { suggestCmsAnnouncementDto } from "@/modules/ai/cms/announcement/cms-announcement-copilot.dto.js";
import type { CmsBrandPageCopilotController } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.controller.js";
import { suggestCmsBrandPageDto } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.dto.js";
import type { AnalyticsChatController } from "@/modules/ai/analytics/analytics-chat.controller.js";
import { analyticsChatDto } from "@/modules/ai/analytics/analytics-chat.dto.js";
import type { AiPolicyController } from "@/modules/ai/policy/ai-policy.controller.js";
import { patchAiPolicyDto } from "@/modules/ai/policy/ai-policy.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createAiSettingsRouter(controller: AiPolicyController) {
    const router = Router();
    router.get("/", controller.getPolicy);
    router.patch("/", validate(patchAiPolicyDto), controller.patchPolicy);
    return router;
}

export function createAiPublicRouter(controller: AiPolicyController) {
    const router = Router();
    router.get("/status", controller.getPublicStatus);
    return router;
}

export function createAiAdminRouter(
    catalogController: CatalogCopilotController,
    cmsFaqController: CmsFaqCopilotController,
    cmsTestimonialController: CmsTestimonialCopilotController,
    cmsAnnouncementController: CmsAnnouncementCopilotController,
    cmsBrandPageController: CmsBrandPageCopilotController,
    analyticsController: AnalyticsChatController,
) {
    const router = Router();
    router.post(
        "/catalog/generate-product-copy",
        validate(generateProductCopyDto),
        catalogController.generateProductCopy,
    );
    router.post(
        "/cms/suggest-faq",
        validate(suggestCmsFaqDto),
        cmsFaqController.suggestFaq,
    );
    router.post(
        "/cms/suggest-testimonial",
        validate(suggestCmsTestimonialDto),
        cmsTestimonialController.suggestTestimonial,
    );
    router.post(
        "/cms/suggest-announcement",
        validate(suggestCmsAnnouncementDto),
        cmsAnnouncementController.suggestAnnouncement,
    );
    router.post(
        "/cms/suggest-brand-page",
        validate(suggestCmsBrandPageDto),
        cmsBrandPageController.suggestBrandPage,
    );
    router.post(
        "/analytics/chat",
        validate(analyticsChatDto),
        analyticsController.streamChat,
    );
    return router;
}

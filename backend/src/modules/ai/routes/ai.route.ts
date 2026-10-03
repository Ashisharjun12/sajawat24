import { Router } from "express";
import type { CatalogCopilotController } from "@/modules/ai/catalog/catalog-copilot.controller.js";
import { generateProductCopyDto } from "@/modules/ai/catalog/catalog-copilot.dto.js";
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

export function createAiAdminRouter(controller: CatalogCopilotController) {
    const router = Router();
    router.post(
        "/catalog/generate-product-copy",
        validate(generateProductCopyDto),
        controller.generateProductCopy,
    );
    return router;
}

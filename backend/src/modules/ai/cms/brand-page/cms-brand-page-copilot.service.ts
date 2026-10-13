import { _config } from "@/config/config.js";
import { getMastra } from "@/mastra/index.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { requireAiEnabled } from "@/modules/ai/guard/require-ai-enabled.js";
import { assertAiRateLimit } from "@/modules/ai/lib/ai-rate-limit.js";
import { runCatalogCopilotLlm } from "@/modules/ai/lib/catalog-copilot.breaker.js";
import {
    assertSafeAiOutput,
    sanitizeAiInput,
} from "@/modules/ai/lib/sanitize-ai-text.js";
import type { SuggestCmsBrandPageInput } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.dto.js";
import { buildCmsBrandPageCopilotPrompt } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.prompt.js";
import {
    cmsBrandPageOutputSchema,
    type CmsBrandPageOutput,
} from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.schema.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);
const TIMEOUT_MS = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

function normalizeOutput(raw: CmsBrandPageOutput): CmsBrandPageOutput {
    const body = raw.body.trim();
    assertSafeAiOutput(body);
    return { body };
}

export class CmsBrandPageCopilotService {
    async suggestBrandPage(
        input: SuggestCmsBrandPageInput,
        actorId: string,
    ): Promise<CmsBrandPageOutput> {
        await requireAiEnabled("admin");
        await assertAiRateLimit(`ai:cms-brand-page:${actorId}`, RATE_LIMIT_PER_HOUR);

        const payload: SuggestCmsBrandPageInput = {
            brief: sanitizeAiInput(input.brief, 500),
            title: input.title ? sanitizeAiInput(input.title, 200) : undefined,
            tone: input.tone,
        };

        const agent = getMastra().getAgentById("cms-brand-page");
        const prompt = buildCmsBrandPageCopilotPrompt(payload);
        const started = Date.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        try {
            const result = await runCatalogCopilotLlm(async () =>
                agent.generate(prompt, {
                    maxSteps: 1,
                    abortSignal: abortController.signal,
                    structuredOutput: {
                        schema: cmsBrandPageOutputSchema,
                        errorStrategy: "strict",
                    },
                }),
            );

            if (!result.object) {
                throw new Error("missing structured output");
            }

            const parsed = cmsBrandPageOutputSchema.parse(normalizeOutput(result.object));

            logger.info(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    usage: result.totalUsage,
                    feature: "cms-brand-page-copilot",
                },
                "cms brand page copilot completed",
            );

            await auditService.log({
                actorId,
                action: "ai.cms_brand_page_suggested",
                entityType: "settings",
                entityId: "cms-brand-page-copilot",
                summary: "CMS brand page draft generated with AI",
                before: null,
                after: { brief: payload.brief, tone: payload.tone },
            });

            return parsed;
        } catch (error) {
            logger.error(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    feature: "cms-brand-page-copilot",
                    err: error,
                },
                "cms brand page copilot failed",
            );
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export const cmsBrandPageCopilotService = new CmsBrandPageCopilotService();

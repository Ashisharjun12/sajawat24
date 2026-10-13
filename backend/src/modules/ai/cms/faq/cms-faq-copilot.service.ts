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
import type { SuggestCmsFaqInput } from "@/modules/ai/cms/faq/cms-faq-copilot.dto.js";
import { buildCmsFaqCopilotPrompt } from "@/modules/ai/cms/faq/cms-faq-copilot.prompt.js";
import {
    cmsFaqOutputSchema,
    type CmsFaqOutput,
} from "@/modules/ai/cms/faq/cms-faq-copilot.schema.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);
const TIMEOUT_MS = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

function normalizeOutput(raw: CmsFaqOutput): CmsFaqOutput {
    const question = raw.question.trim().replace(/\s+/g, " ");
    const answer = raw.answer.trim().replace(/\s+/g, " ");
    assertSafeAiOutput(question);
    assertSafeAiOutput(answer);
    return { question, answer };
}

export class CmsFaqCopilotService {
    async suggestFaq(input: SuggestCmsFaqInput, actorId: string): Promise<CmsFaqOutput> {
        await requireAiEnabled("admin");
        await assertAiRateLimit(`ai:cms-faq:${actorId}`, RATE_LIMIT_PER_HOUR);

        const payload: SuggestCmsFaqInput = {
            topic: sanitizeAiInput(input.topic, 200),
            question: input.question ? sanitizeAiInput(input.question, 500) : undefined,
            tone: input.tone,
        };

        const agent = getMastra().getAgentById("cms-faq");
        const prompt = buildCmsFaqCopilotPrompt(payload);
        const started = Date.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        try {
            const result = await runCatalogCopilotLlm(async () =>
                agent.generate(prompt, {
                    maxSteps: 1,
                    abortSignal: abortController.signal,
                    structuredOutput: {
                        schema: cmsFaqOutputSchema,
                        errorStrategy: "strict",
                    },
                }),
            );

            if (!result.object) {
                throw new Error("missing structured output");
            }

            const parsed = cmsFaqOutputSchema.parse(normalizeOutput(result.object));

            logger.info(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    usage: result.totalUsage,
                    feature: "cms-faq-copilot",
                },
                "cms faq copilot completed",
            );

            await auditService.log({
                actorId,
                action: "ai.cms_faq_suggested",
                entityType: "settings",
                entityId: "cms-faq-copilot",
                summary: "CMS FAQ draft generated with AI",
                before: null,
                after: { topic: payload.topic, tone: payload.tone },
            });

            return parsed;
        } catch (error) {
            logger.error(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    feature: "cms-faq-copilot",
                    err: error,
                },
                "cms faq copilot failed",
            );
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export const cmsFaqCopilotService = new CmsFaqCopilotService();

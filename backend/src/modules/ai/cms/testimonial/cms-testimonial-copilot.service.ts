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
import type { SuggestCmsTestimonialInput } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.dto.js";
import { buildCmsTestimonialCopilotPrompt } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.prompt.js";
import {
    cmsTestimonialOutputSchema,
    type CmsTestimonialOutput,
} from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.schema.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);
const TIMEOUT_MS = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

function normalizeOutput(raw: CmsTestimonialOutput): CmsTestimonialOutput {
    const quote = raw.quote.trim().replace(/\s+/g, " ");
    const reviewerName = raw.reviewerName.trim().replace(/\s+/g, " ");
    const reviewerCity = raw.reviewerCity?.trim().replace(/\s+/g, " ") || undefined;
    assertSafeAiOutput(quote);
    assertSafeAiOutput(reviewerName);
    if (reviewerCity) assertSafeAiOutput(reviewerCity);
    return { quote, reviewerName, reviewerCity };
}

export class CmsTestimonialCopilotService {
    async suggestTestimonial(
        input: SuggestCmsTestimonialInput,
        actorId: string,
    ): Promise<CmsTestimonialOutput> {
        await requireAiEnabled("admin");
        await assertAiRateLimit(`ai:cms-testimonial:${actorId}`, RATE_LIMIT_PER_HOUR);

        const payload: SuggestCmsTestimonialInput = {
            topic: sanitizeAiInput(input.topic, 200),
            quote: input.quote ? sanitizeAiInput(input.quote, 2000) : undefined,
            reviewerName: input.reviewerName ? sanitizeAiInput(input.reviewerName, 120) : undefined,
            reviewerCity: input.reviewerCity ? sanitizeAiInput(input.reviewerCity, 120) : undefined,
            tone: input.tone,
        };

        const agent = getMastra().getAgentById("cms-testimonial");
        const prompt = buildCmsTestimonialCopilotPrompt(payload);
        const started = Date.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        try {
            const result = await runCatalogCopilotLlm(async () =>
                agent.generate(prompt, {
                    maxSteps: 1,
                    abortSignal: abortController.signal,
                    structuredOutput: {
                        schema: cmsTestimonialOutputSchema,
                        errorStrategy: "strict",
                    },
                }),
            );

            if (!result.object) {
                throw new Error("missing structured output");
            }

            const parsed = cmsTestimonialOutputSchema.parse(normalizeOutput(result.object));

            logger.info(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    usage: result.totalUsage,
                    feature: "cms-testimonial-copilot",
                },
                "cms testimonial copilot completed",
            );

            await auditService.log({
                actorId,
                action: "ai.cms_testimonial_suggested",
                entityType: "settings",
                entityId: "cms-testimonial-copilot",
                summary: "CMS testimonial draft generated with AI",
                before: null,
                after: { topic: payload.topic, tone: payload.tone },
            });

            return parsed;
        } catch (error) {
            logger.error(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    feature: "cms-testimonial-copilot",
                    err: error,
                },
                "cms testimonial copilot failed",
            );
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export const cmsTestimonialCopilotService = new CmsTestimonialCopilotService();

import { _config } from "@/config/config.js";
import { getMastra } from "@/mastra/index.js";
import { toolAgentModel } from "@/mastra/model.js";
import { buildSeoSlug } from "@/modules/ai/lib/build-seo-slug.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { requireAiEnabled } from "@/modules/ai/guard/require-ai-enabled.js";
import { assertAiRateLimit } from "@/modules/ai/lib/ai-rate-limit.js";
import { runCatalogCopilotLlm } from "@/modules/ai/lib/catalog-copilot.breaker.js";
import {
    assertSafeAiOutput,
    sanitizeAiInput,
} from "@/modules/ai/lib/sanitize-ai-text.js";
import type { GenerateProductCopyInput } from "@/modules/ai/catalog/catalog-copilot.dto.js";
import { buildCatalogCopilotPrompt } from "@/modules/ai/catalog/catalog-copilot.prompt.js";
import {
    productCopyOutputSchema,
    type ProductCopyOutput,
} from "@/modules/ai/catalog/catalog-copilot.schema.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);
const TIMEOUT_MS = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

function normalizeBullets(items: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of items) {
        const text = raw.trim().replace(/\s+/g, " ");
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(text);
        if (result.length >= 20) break;
    }
    return result;
}

function normalizeOutput(
    raw: ProductCopyOutput,
    input: GenerateProductCopyInput,
): ProductCopyOutput {
    const slug = buildSeoSlug({
        name: input.name,
        categoryName: input.categoryName,
        parentCategoryName: input.parentCategoryName,
        llmSlug: raw.slug,
    });

    assertSafeAiOutput(raw.description);

    return {
        description: raw.description.trim(),
        slug,
        includes: normalizeBullets(raw.includes),
        deliverySetup: normalizeBullets(raw.deliverySetup),
        careInstructions: normalizeBullets(raw.careInstructions),
        faqs: raw.faqs
            .map((faq) => ({
                question: faq.question.trim(),
                answer: faq.answer.trim(),
            }))
            .filter((faq) => faq.question && faq.answer)
            .slice(0, 10),
    };
}

export class CatalogCopilotService {
    async generateProductCopy(
        input: GenerateProductCopyInput,
        actorId: string,
    ): Promise<ProductCopyOutput> {
        await requireAiEnabled("admin");
        await assertAiRateLimit(`ai:catalog:${actorId}`, RATE_LIMIT_PER_HOUR);

        const payload: GenerateProductCopyInput = {
            name: sanitizeAiInput(input.name, 120),
            categoryName: sanitizeAiInput(input.categoryName, 120),
            parentCategoryName: input.parentCategoryName
                ? sanitizeAiInput(input.parentCategoryName, 120)
                : undefined,
            notes: input.notes ? sanitizeAiInput(input.notes, 500) : undefined,
            tone: input.tone,
        };

        const agent = getMastra().getAgentById("catalog-copilot");
        const prompt = buildCatalogCopilotPrompt(payload);
        const started = Date.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        try {
            const result = await runCatalogCopilotLlm(async () =>
                agent.generate(prompt, {
                    maxSteps: 6,
                    abortSignal: abortController.signal,
                    structuredOutput: {
                        schema: productCopyOutputSchema,
                        model: toolAgentModel,
                        errorStrategy: "strict",
                    },
                }),
            );

            if (!result.object) {
                throw new Error("missing structured output");
            }

            const normalized = normalizeOutput(result.object, payload);
            const parsed = productCopyOutputSchema.parse(normalized);

            logger.info(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    usage: result.totalUsage,
                    feature: "catalog-copilot",
                },
                "catalog copilot generation completed",
            );

            await auditService.log({
                actorId,
                action: "ai.catalog_product_copy_generated",
                entityType: "settings",
                entityId: "catalog-copilot",
                summary: "Catalog product copy generated with AI",
                before: null,
                after: {
                    tone: payload.tone,
                    categoryName: payload.categoryName,
                    fieldCount: {
                        includes: parsed.includes.length,
                        deliverySetup: parsed.deliverySetup.length,
                        careInstructions: parsed.careInstructions.length,
                        faqs: parsed.faqs.length,
                    },
                },
            });

            return parsed;
        } catch (error) {
            logger.error(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    feature: "catalog-copilot",
                    err: error,
                },
                "catalog copilot generation failed",
            );
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export const catalogCopilotService = new CatalogCopilotService();

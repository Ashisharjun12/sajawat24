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
import type { SuggestCmsAnnouncementInput } from "@/modules/ai/cms/announcement/cms-announcement-copilot.dto.js";
import { buildCmsAnnouncementCopilotPrompt } from "@/modules/ai/cms/announcement/cms-announcement-copilot.prompt.js";
import {
    cmsAnnouncementOutputSchema,
    type CmsAnnouncementOutput,
} from "@/modules/ai/cms/announcement/cms-announcement-copilot.schema.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);
const TIMEOUT_MS = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

function normalizeOutput(raw: CmsAnnouncementOutput): CmsAnnouncementOutput {
    const message = raw.message.trim().replace(/\s+/g, " ");
    let href = raw.href?.trim() || undefined;
    if (href === "") href = undefined;
    assertSafeAiOutput(message);
    return { message, href, tone: raw.tone };
}

export class CmsAnnouncementCopilotService {
    async suggestAnnouncement(
        input: SuggestCmsAnnouncementInput,
        actorId: string,
    ): Promise<CmsAnnouncementOutput> {
        await requireAiEnabled("admin");
        await assertAiRateLimit(`ai:cms-announcement:${actorId}`, RATE_LIMIT_PER_HOUR);

        const payload: SuggestCmsAnnouncementInput = {
            topic: sanitizeAiInput(input.topic, 200),
            message: input.message ? sanitizeAiInput(input.message, 500) : undefined,
            href: input.href ? sanitizeAiInput(input.href, 500) : undefined,
            tone: input.tone,
        };

        const agent = getMastra().getAgentById("cms-announcement");
        const prompt = buildCmsAnnouncementCopilotPrompt(payload);
        const started = Date.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        try {
            const result = await runCatalogCopilotLlm(async () =>
                agent.generate(prompt, {
                    maxSteps: 1,
                    abortSignal: abortController.signal,
                    structuredOutput: {
                        schema: cmsAnnouncementOutputSchema,
                        errorStrategy: "strict",
                    },
                }),
            );

            if (!result.object) {
                throw new Error("missing structured output");
            }

            const parsed = cmsAnnouncementOutputSchema.parse(normalizeOutput(result.object));

            logger.info(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    usage: result.totalUsage,
                    feature: "cms-announcement-copilot",
                },
                "cms announcement copilot completed",
            );

            await auditService.log({
                actorId,
                action: "ai.cms_announcement_suggested",
                entityType: "settings",
                entityId: "cms-announcement-copilot",
                summary: "CMS announcement bar draft generated with AI",
                before: null,
                after: { topic: payload.topic, tone: parsed.tone },
            });

            return parsed;
        } catch (error) {
            logger.error(
                {
                    actorId,
                    durationMs: Date.now() - started,
                    feature: "cms-announcement-copilot",
                    err: error,
                },
                "cms announcement copilot failed",
            );
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

export const cmsAnnouncementCopilotService = new CmsAnnouncementCopilotService();

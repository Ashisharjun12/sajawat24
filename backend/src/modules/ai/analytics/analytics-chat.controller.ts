import type { Request, Response } from "express";
import { MastraAgent } from "@ag-ui/mastra";
import type { Message } from "@ag-ui/core";
import { _config } from "@/config/config.js";
import { getMastra } from "@/mastra/index.js";
import { requireAiEnabled } from "@/modules/ai/guard/require-ai-enabled.js";
import { assertAiRateLimit } from "@/modules/ai/lib/ai-rate-limit.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { logger } from "@/utils/logger.js";

const RATE_LIMIT_PER_HOUR = Number(_config.AI_CATALOG_RATE_LIMIT_PER_HOUR ?? 30);

export class AnalyticsChatController {
    streamChat = asyncHandler(async (req: Request, res: Response) => {
        await requireAiEnabled("admin");
        const actorId = req.actor?.id;
        if (!actorId) {
            throw ApiError.unauthorized();
        }
        await assertAiRateLimit(`ai:analytics:${actorId}`, RATE_LIMIT_PER_HOUR);

        const messages = req.body.messages as Message[];
        const threadId =
            typeof req.body.threadId === "string" && req.body.threadId.trim()
                ? req.body.threadId.trim()
                : crypto.randomUUID();
        const runId =
            typeof req.body.runId === "string" && req.body.runId.trim()
                ? req.body.runId.trim()
                : crypto.randomUUID();

        const agent = getMastra().getAgentById("platform-analytics");
        const mastraAgent = new MastraAgent({
            agent,
            resourceId: actorId,
            streamServerToolCalls: true,
        });

        res.status(200);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();

        const started = Date.now();
        const subscription = mastraAgent
            .run({
                messages,
                threadId,
                runId,
                tools: [],
                context: [],
            })
            .subscribe({
                next: (event) => {
                    if (!res.writableEnded) {
                        res.write(`data: ${JSON.stringify(event)}\n\n`);
                    }
                },
                complete: () => {
                    if (!res.writableEnded) {
                        res.write("data: [DONE]\n\n");
                        res.end();
                    }
                    logger.info(
                        { actorId, threadId, runId, durationMs: Date.now() - started },
                        "analytics chat run completed",
                    );
                },
                error: (error) => {
                    logger.error(
                        { actorId, threadId, runId, err: error },
                        "analytics chat run failed",
                    );
                    if (!res.writableEnded) {
                        const message = error instanceof Error ? error.message : "run failed";
                        res.write(`data: ${JSON.stringify({ type: "RUN_ERROR", message })}\n\n`);
                        res.end();
                    }
                },
            });

        const abort = () => {
            subscription.unsubscribe();
            mastraAgent.abortRun();
        };
        req.on("close", abort);
        req.on("aborted", abort);
    });
}

export const analyticsChatController = new AnalyticsChatController();

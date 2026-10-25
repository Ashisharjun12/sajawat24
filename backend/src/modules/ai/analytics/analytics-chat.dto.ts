import { z } from "zod";

export const analyticsChatDto = z.object({
    messages: z.array(z.record(z.string(), z.unknown())).min(1),
    threadId: z.string().min(1).max(120).optional(),
    runId: z.string().min(1).max(120).optional(),
});

export type AnalyticsChatInput = z.infer<typeof analyticsChatDto>;

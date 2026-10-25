import { Agent } from "@mastra/core/agent";
import { toolAgentModel } from "@/mastra/model.js";
import { getResearchMemory } from "@/mastra/memory.js";
import { isAiInfrastructureEnabled } from "@/mastra/ai-config.js";
import { buildAnalyticsInstructions } from "@/mastra/openui/analytics-prompt.js";
import { getKnownMetricTool } from "@/mastra/tools/analytics-tools.js";
import { executeValidatedSqlTool, getSchemaContextTool } from "@/mastra/tools/analytics-sql-tools.js";

export const analyticsAgent = new Agent({
    id: "platform-analytics",
    name: "Platform analytics",
    instructions: buildAnalyticsInstructions,
    model: toolAgentModel,
    memory: isAiInfrastructureEnabled() ? getResearchMemory() : undefined,
    tools: {
        getKnownMetricTool,
        getSchemaContextTool,
        executeValidatedSqlTool,
    },
});

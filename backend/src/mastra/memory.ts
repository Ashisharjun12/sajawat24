import { Memory } from "@mastra/memory";
import { getAiStorage } from "@/mastra/storage.js";
import { isAiInfrastructureEnabled } from "@/mastra/ai-config.js";

let researchMemory: Memory | null = null;

export function getResearchMemory(): Memory {
    if (!isAiInfrastructureEnabled()) {
        throw new Error("AI memory is disabled");
    }
    if (!researchMemory) {
        researchMemory = new Memory({
            storage: getAiStorage(),
            options: {
                lastMessages: 20,
                generateTitle: true,
            },
        });
    }
    return researchMemory;
}

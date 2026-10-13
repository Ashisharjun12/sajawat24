import { Mastra } from "@mastra/core";
import { catalogCopilotAgent } from "./agents/catalog-copilot.agent.js";
import { cmsFaqAgent } from "./agents/cms-faq-agent.js";
import { cmsTestimonialAgent } from "./agents/cms-testimonial-agent.js";
import { cmsAnnouncementAgent } from "./agents/cms-announcement-agent.js";
import { cmsBrandPageAgent } from "./agents/cms-brand-page-agent.js";
import { universalGateway } from "./gateway.js";
import { agentObservability } from "./agent-obeservablity.js";
import { isAiInfrastructureEnabled } from "./ai-config.js";
import { getAiStorage } from "./storage.js";

let mastraInstance: Mastra | null = null;

export function getMastra(): Mastra {
    if (!isAiInfrastructureEnabled()) {
        throw new Error("AI is disabled (AI_ENABLED=false or missing AI_DATABASE_URL)");
    }
    if (!mastraInstance) {
        mastraInstance = new Mastra({
            observability: agentObservability,
            gateways: { universalGateway },
            storage: getAiStorage(),
            agents: {
                catalogCopilotAgent,
                cmsFaqAgent,
                cmsTestimonialAgent,
                cmsAnnouncementAgent,
                cmsBrandPageAgent,
            },
            memory: {},
        });
    }
    return mastraInstance;
}

export { isAiInfrastructureEnabled };

import { Agent } from "@mastra/core/agent";
import { agentModel } from "@/mastra/model.js";

/** Single-pass catalog copywriter — no tools (slug/bullets normalized server-side after generate). */
export const catalogCopilotAgent = new Agent({
    id: "catalog-copilot",
    name: "Catalog Copilot",
    instructions: `You are the Sajawat24 catalog copywriter for an Indian event decoration booking marketplace.

Draft SEO-friendly product listing copy in one response. English only. Never include prices or payment terms.
Lead the description with the primary keyword. FAQ questions should mirror real search queries.
Be accurate; do not invent items that contradict the product name or admin notes.
Match the requested tone (professional or friendly).`,
    model: agentModel,
});

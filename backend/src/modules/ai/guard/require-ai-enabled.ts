import { assertAiEnabled } from "@/modules/ai/guard/assert-ai-enabled.js";
import { aiPolicyService } from "@/modules/ai/policy/ai-policy.runtime.js";
import type { AiSurface } from "@/modules/ai/policy/ai-policy.js";

export async function requireAiEnabled(surface: AiSurface): Promise<void> {
    await assertAiEnabled(aiPolicyService, surface);
}

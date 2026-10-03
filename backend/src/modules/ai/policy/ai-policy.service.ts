import { auditService } from "@/modules/ops/audit/audit.service.js";
import type { ISettingRepository } from "@/modules/ops/settings/setting.repository.js";
import {
    AI_POLICY_KEY,
    DEFAULT_AI_POLICY,
    mergeAiPolicy,
    type AiPolicy,
    type AiPolicyView,
    type AiSurface,
} from "@/modules/ai/policy/ai-policy.js";
import { isLlmConfigured } from "@/modules/ai/policy/llm-configured.js";

const POLICY_CACHE_TTL_MS = 5_000;

export type PatchAiPolicyInput = Partial<AiPolicy>;

export interface IAiPolicyService {
    getPolicy(): Promise<AiPolicyView>;
    patchPolicy(input: PatchAiPolicyInput, actorId: string): Promise<AiPolicyView>;
    isEnabledFor(surface: AiSurface): Promise<boolean>;
}

export class AiPolicyService implements IAiPolicyService {
    private cache: { policy: AiPolicy; at: number } | null = null;

    constructor(private readonly settings: ISettingRepository) {}

    async getPolicy(): Promise<AiPolicyView> {
        const policy = await this.loadPolicy();
        return this.toView(policy);
    }

    async patchPolicy(input: PatchAiPolicyInput, actorId: string): Promise<AiPolicyView> {
        const current = await this.loadPolicy();
        const next = mergeAiPolicy({ ...current, ...input });
        await this.settings.upsert(AI_POLICY_KEY, next);
        this.cache = { policy: next, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.ai_policy_updated",
            entityType: "settings",
            entityId: AI_POLICY_KEY,
            summary: "AI platform policy updated",
            before: current,
            after: next,
        });
        return this.toView(next);
    }

    async isEnabledFor(surface: AiSurface): Promise<boolean> {
        const policy = await this.loadPolicy();
        if (!policy.enabled || !policy[surface]) {
            return false;
        }
        return isLlmConfigured();
    }

    private async loadPolicy(): Promise<AiPolicy> {
        if (this.cache && Date.now() - this.cache.at < POLICY_CACHE_TTL_MS) {
            return this.cache.policy;
        }

        const row = await this.settings.findByKey(AI_POLICY_KEY);
        const policy = mergeAiPolicy(row?.value ?? DEFAULT_AI_POLICY);
        if (!row) {
            await this.settings.upsert(AI_POLICY_KEY, policy);
        }
        this.cache = { policy, at: Date.now() };
        return policy;
    }

    private toView(policy: AiPolicy): AiPolicyView {
        return {
            ...policy,
            llmConfigured: isLlmConfigured(),
        };
    }
}

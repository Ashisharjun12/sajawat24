export const AI_POLICY_KEY = "ai.policy";

export const AI_SURFACES = ["admin", "web", "customer", "vendor"] as const;

export type AiSurface = (typeof AI_SURFACES)[number];

export type AiPolicy = {
    enabled: boolean;
    admin: boolean;
    web: boolean;
    customer: boolean;
    vendor: boolean;
};

export type AiPolicyView = AiPolicy & {
    llmConfigured: boolean;
};

export const DEFAULT_AI_POLICY: AiPolicy = {
    enabled: false,
    admin: false,
    web: false,
    customer: false,
    vendor: false,
};

export function mergeAiPolicy(value: unknown): AiPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    return {
        enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_AI_POLICY.enabled,
        admin: typeof raw.admin === "boolean" ? raw.admin : DEFAULT_AI_POLICY.admin,
        web: typeof raw.web === "boolean" ? raw.web : DEFAULT_AI_POLICY.web,
        customer:
            typeof raw.customer === "boolean" ? raw.customer : DEFAULT_AI_POLICY.customer,
        vendor: typeof raw.vendor === "boolean" ? raw.vendor : DEFAULT_AI_POLICY.vendor,
    };
}

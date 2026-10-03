export const INSTANT_MARKETPLACE_KEY = "instant.marketplace";

export type InstantMarketplacePolicy = {
    enabled: boolean;
    defaultEtaMinutes: number;
    defaultBadgeLabel: string;
    defaultPdpTitle: string;
    defaultPdpBody: string;
};

export const DEFAULT_INSTANT_MARKETPLACE_POLICY: InstantMarketplacePolicy = {
    enabled: false,
    defaultEtaMinutes: 120,
    defaultBadgeLabel: "Instant",
    defaultPdpTitle: "Instant booking",
    defaultPdpBody:
        "Pay now — we find a nearby decorator. Typical assignment within {{etaMinutes}} minutes.",
};

export function mergeInstantMarketplacePolicy(value: unknown): InstantMarketplacePolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const defaultEtaMinutes =
        typeof raw.defaultEtaMinutes === "number" && raw.defaultEtaMinutes > 0
            ? Math.min(480, Math.round(raw.defaultEtaMinutes))
            : typeof raw.default_eta_minutes === "number"
              ? Math.min(480, Math.round(raw.default_eta_minutes))
              : DEFAULT_INSTANT_MARKETPLACE_POLICY.defaultEtaMinutes;

    return {
        enabled:
            typeof raw.enabled === "boolean"
                ? raw.enabled
                : DEFAULT_INSTANT_MARKETPLACE_POLICY.enabled,
        defaultEtaMinutes,
        defaultBadgeLabel:
            typeof raw.defaultBadgeLabel === "string" && raw.defaultBadgeLabel.trim()
                ? raw.defaultBadgeLabel.trim().slice(0, 40)
                : DEFAULT_INSTANT_MARKETPLACE_POLICY.defaultBadgeLabel,
        defaultPdpTitle:
            typeof raw.defaultPdpTitle === "string" && raw.defaultPdpTitle.trim()
                ? raw.defaultPdpTitle.trim().slice(0, 80)
                : DEFAULT_INSTANT_MARKETPLACE_POLICY.defaultPdpTitle,
        defaultPdpBody:
            typeof raw.defaultPdpBody === "string" && raw.defaultPdpBody.trim()
                ? raw.defaultPdpBody.trim().slice(0, 500)
                : DEFAULT_INSTANT_MARKETPLACE_POLICY.defaultPdpBody,
    };
}

export function interpolateInstantPdpBody(template: string, etaMinutes: number): string {
    return template.replace(/\{\{etaMinutes\}\}/g, String(etaMinutes));
}

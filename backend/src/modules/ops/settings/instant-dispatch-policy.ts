export const INSTANT_DISPATCH_KEY = "instant.dispatch";

export type InstantDispatchPolicy = {
    enabled: boolean;
    offerTtlSec: number;
    maxOffersPerOrder: number;
    radiusKmWaves: number[];
    geoCount: number;
    heartbeatSec: number;
    staleSec: number;
    locationMinIntervalSec: number;
    locationMinMoveM: number;
    instantSlaMinutes: number;
    systemUserId: string | null;
};

export const DEFAULT_INSTANT_DISPATCH_POLICY: InstantDispatchPolicy = {
    enabled: false,
    offerTtlSec: 75,
    maxOffersPerOrder: 5,
    radiusKmWaves: [5, 10, 15],
    geoCount: 30,
    heartbeatSec: 30,
    staleSec: 60,
    locationMinIntervalSec: 5,
    locationMinMoveM: 20,
    instantSlaMinutes: 120,
    systemUserId: null,
};

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}

export function mergeInstantDispatchPolicy(value: unknown): InstantDispatchPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const radiusKmWaves = Array.isArray(raw.radiusKmWaves)
        ? raw.radiusKmWaves
              .filter((n): n is number => typeof n === "number" && n > 0)
              .map((n) => Math.min(50, n))
        : DEFAULT_INSTANT_DISPATCH_POLICY.radiusKmWaves;

    return {
        enabled:
            typeof raw.enabled === "boolean"
                ? raw.enabled
                : DEFAULT_INSTANT_DISPATCH_POLICY.enabled,
        offerTtlSec: asNumber(raw.offerTtlSec, 75, 15, 300),
        maxOffersPerOrder: asNumber(raw.maxOffersPerOrder, 5, 1, 20),
        radiusKmWaves: radiusKmWaves.length ? radiusKmWaves : [5, 10, 15],
        geoCount: asNumber(raw.geoCount, 30, 5, 100),
        heartbeatSec: asNumber(raw.heartbeatSec, 30, 10, 120),
        staleSec: asNumber(raw.staleSec, 60, 30, 300),
        locationMinIntervalSec: asNumber(raw.locationMinIntervalSec, 5, 2, 60),
        locationMinMoveM: asNumber(raw.locationMinMoveM, 20, 5, 500),
        instantSlaMinutes: asNumber(raw.instantSlaMinutes, 120, 30, 480),
        systemUserId:
            typeof raw.systemUserId === "string" && raw.systemUserId.length > 0
                ? raw.systemUserId
                : null,
    };
}

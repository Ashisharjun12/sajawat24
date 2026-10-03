export const INSTANT_MAPS_KEY = "instant.maps";

export type InstantMapsPolicy = {
    provider: "google";
    customerAppMapEnabled: boolean;
    vendorAppMapEnabled: boolean;
    webMapEnabled: boolean;
    liveTrackingEnabled: boolean;
};

export const DEFAULT_INSTANT_MAPS_POLICY: InstantMapsPolicy = {
    provider: "google",
    customerAppMapEnabled: true,
    vendorAppMapEnabled: true,
    webMapEnabled: false,
    liveTrackingEnabled: true,
};

export function mergeInstantMapsPolicy(value: unknown): InstantMapsPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    return {
        provider: "google",
        customerAppMapEnabled:
            typeof raw.customerAppMapEnabled === "boolean"
                ? raw.customerAppMapEnabled
                : typeof raw.customer_app_map_enabled === "boolean"
                  ? raw.customer_app_map_enabled
                  : DEFAULT_INSTANT_MAPS_POLICY.customerAppMapEnabled,
        vendorAppMapEnabled:
            typeof raw.vendorAppMapEnabled === "boolean"
                ? raw.vendorAppMapEnabled
                : typeof raw.vendor_app_map_enabled === "boolean"
                  ? raw.vendor_app_map_enabled
                  : DEFAULT_INSTANT_MAPS_POLICY.vendorAppMapEnabled,
        webMapEnabled:
            typeof raw.webMapEnabled === "boolean"
                ? raw.webMapEnabled
                : typeof raw.web_map_enabled === "boolean"
                  ? raw.web_map_enabled
                  : DEFAULT_INSTANT_MAPS_POLICY.webMapEnabled,
        liveTrackingEnabled:
            typeof raw.liveTrackingEnabled === "boolean"
                ? raw.liveTrackingEnabled
                : typeof raw.live_tracking_enabled === "boolean"
                  ? raw.live_tracking_enabled
                  : DEFAULT_INSTANT_MAPS_POLICY.liveTrackingEnabled,
    };
}

import { _config } from "@/config/config.js";
import {
    assertOlaMapsCredentialsConfigured,
    getOlaAccessToken,
    hasOlaApiKey,
    hasOlaOAuthCredentials,
} from "@/modules/maps/providers/ola/ola-maps.auth.js";

const OLA_BASE = "https://api.olamaps.io";
const DEFAULT_STYLE_PATH =
    "/tiles/vector/v1/styles/default-light-standard/style.json";

export type OlaWebSdkConfig = {
    styleUrl: string;
    accessToken: string;
    apiKey: string;
    authMode: "oauth" | "api_key";
};

function baseStyleUrl(): string {
    return `${OLA_BASE}${DEFAULT_STYLE_PATH}`;
}

function styleUrlWithApiKey(): string {
    const key = _config.OLA_MAPS_API_KEY?.trim();
    if (!key) {
        throw new Error("OLA_MAPS_API_KEY missing");
    }
    return `${baseStyleUrl()}?api_key=${encodeURIComponent(key)}`;
}

export async function buildOlaWebSdkConfig(): Promise<OlaWebSdkConfig> {
    assertOlaMapsCredentialsConfigured();

    if (hasOlaOAuthCredentials()) {
        const accessToken = await getOlaAccessToken();
        if (!accessToken) {
            throw new Error("ola oauth token unavailable");
        }
        return {
            styleUrl: baseStyleUrl(),
            accessToken,
            apiKey: "",
            authMode: "oauth",
        };
    }

    if (hasOlaApiKey()) {
        const key = _config.OLA_MAPS_API_KEY!.trim();
        return {
            styleUrl: styleUrlWithApiKey(),
            accessToken: "",
            apiKey: key,
            authMode: "api_key",
        };
    }

    throw new Error("ola maps credentials not configured");
}

export function getOlaMapStyleUrl(): string {
    assertOlaMapsCredentialsConfigured();
    if (hasOlaOAuthCredentials()) {
        return baseStyleUrl();
    }
    return styleUrlWithApiKey();
}

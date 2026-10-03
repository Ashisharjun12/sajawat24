import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";

const TOKEN_URL = "https://api.olamaps.io/auth/v1/token";

type TokenCache = {
    accessToken: string;
    expiresAtMs: number;
};

let tokenCache: TokenCache | null = null;

export function hasOlaOAuthCredentials(): boolean {
    return Boolean(
        _config.OLA_MAPS_CLIENT_ID?.trim() && _config.OLA_MAPS_CLIENT_SECRET?.trim(),
    );
}

export function hasOlaApiKey(): boolean {
    return Boolean(_config.OLA_MAPS_API_KEY?.trim());
}

export async function getOlaAccessToken(): Promise<string | null> {
    if (!hasOlaOAuthCredentials()) {
        return null;
    }

    const now = Date.now();
    if (tokenCache && now < tokenCache.expiresAtMs - 30_000) {
        return tokenCache.accessToken;
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        scope: "openid",
        client_id: _config.OLA_MAPS_CLIENT_ID!.trim(),
        client_secret: _config.OLA_MAPS_CLIENT_SECRET!.trim(),
    });

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        throw ApiError.internalServerError(
            `ola maps token request failed: ${text.slice(0, 300)}`,
        );
    }

    const data = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
    };

    const accessToken = data.access_token?.trim();
    if (!accessToken) {
        throw ApiError.internalServerError("ola maps token response missing access_token");
    }

    const expiresInSec =
        typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 3600;
    tokenCache = {
        accessToken,
        expiresAtMs: now + expiresInSec * 1000,
    };

    return accessToken;
}

export function assertOlaMapsCredentialsConfigured(): void {
    if (hasOlaOAuthCredentials() || hasOlaApiKey()) {
        return;
    }
    throw ApiError.internalServerError(
        "configure OLA_MAPS_CLIENT_ID + OLA_MAPS_CLIENT_SECRET or OLA_MAPS_API_KEY",
    );
}

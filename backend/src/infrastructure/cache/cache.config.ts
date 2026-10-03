import { _config } from "@/config/config.js";

export const CACHE_KEY_PREFIX = "decory:v1:";

let runtimeCacheEnabled: boolean | null = null;

export function isCacheEnabled(): boolean {
    if (runtimeCacheEnabled !== null) {
        return runtimeCacheEnabled;
    }
    const flag = _config.CACHE_ENABLED;
    if (flag === "false" || flag === "0") return false;
    return true;
}

export function setRuntimeCacheEnabled(enabled: boolean): void {
    runtimeCacheEnabled = enabled;
}

export function defaultCacheTtlSeconds(): number {
    const raw = _config.CACHE_DEFAULT_TTL_SECONDS;
    const n = raw ? Number.parseInt(raw, 10) : 120;
    return Number.isFinite(n) && n > 0 ? n : 120;
}

/**
 * Prefer REDIS_CACHE_URL; else REDIS_URL with logical DB REDIS_CACHE_DB (default 1).
 */
export function resolveCacheRedisUrl(): string | null {
    if (_config.REDIS_CACHE_URL?.trim()) {
        return _config.REDIS_CACHE_URL.trim();
    }
    const base = _config.REDIS_URL?.trim();
    if (!base) return null;

    const dbIndex = _config.REDIS_CACHE_DB?.trim() || "1";
    try {
        const url = new URL(base);
        url.pathname = `/${dbIndex}`;
        return url.toString();
    } catch {
        const withoutPath = base.replace(/\/\d+$/, "");
        return `${withoutPath}/${dbIndex}`;
    }
}

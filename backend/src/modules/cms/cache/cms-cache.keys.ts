import { CACHE_KEY_PREFIX } from "@/infrastructure/cache/cache.config.js";

const CMS_PREFIX = `${CACHE_KEY_PREFIX}cms:`;

export const CMS_CACHE_TTL = {
    homeSeconds: 180,
    siteShellSeconds: 600,
    pageSeconds: 600,
} as const;

export function cmsSiteShellKey(platform: string): string {
    return `${CMS_PREFIX}site-shell:${platform}`;
}

export function cmsHomeKey(
    platform: string,
    cityId?: string,
    pincode?: string,
): string {
    const city = cityId?.trim() || "_";
    const pin = pincode?.trim() || "_";
    return `${CMS_PREFIX}home:${platform}:${city}:${pin}`;
}

export const CMS_HOME_PREFIX = `${CMS_PREFIX}home:`;
export const CMS_SITE_SHELL_PREFIX = `${CMS_PREFIX}site-shell:`;
export const CMS_PAGES_PREFIX = `${CMS_PREFIX}pages:`;

export function cmsPageKey(slug: string, platform: string): string {
    return `${CMS_PAGES_PREFIX}${platform}:${slug}`;
}

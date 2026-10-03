import { cacheService } from "@/infrastructure/cache/index.js";
import type { SiteShellService } from "@/modules/brand/site-shell.service.js";
import { CMS_CACHE_TTL, cmsSiteShellKey } from "@/modules/cms/cache/cms-cache.keys.js";

export class CachedSiteShellService {
    constructor(private readonly inner: SiteShellService) {}

    async get(options: { platform?: string } = {}) {
        const platform = options.platform ?? "web";
        const key = cmsSiteShellKey(platform);
        return cacheService.getOrSet(key, CMS_CACHE_TTL.siteShellSeconds, () => this.inner.get(options));
    }
}

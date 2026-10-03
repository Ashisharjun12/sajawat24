import { cacheService } from "@/infrastructure/cache/index.js";
import { CMS_HOME_PREFIX, CMS_PAGES_PREFIX, CMS_SITE_SHELL_PREFIX, cmsPageKey } from "./cms-cache.keys.js";

export async function invalidateHome(): Promise<void> {
    await cacheService.delByPrefix(CMS_HOME_PREFIX);
}

export async function invalidateSiteShell(): Promise<void> {
    await cacheService.delByPrefix(CMS_SITE_SHELL_PREFIX);
}

export async function invalidatePages(slug?: string): Promise<void> {
    if (slug) {
        await cacheService.del(cmsPageKey(slug, "web"));
        await cacheService.del(cmsPageKey(slug, "mobile"));
        return;
    }
    await cacheService.delByPrefix(CMS_PAGES_PREFIX);
}

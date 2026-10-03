import { BrandAdminController } from "@/modules/brand/brand.admin.controller.js";
import { createBrandAdminRouter } from "@/modules/brand/brand.admin.route.js";
import { SiteBrandService } from "@/modules/brand/site-brand.service.js";
import { SiteShellService } from "@/modules/brand/site-shell.service.js";
import { CachedSiteShellService } from "@/modules/brand/cached-site-shell.service.js";
import { SettingRepository } from "@/modules/ops/settings/setting.repository.js";
import { CmsSocialLinkRepository } from "@/modules/cms/social-links/social-link.repository.js";
import { CmsSocialLinkService } from "@/modules/cms/social-links/social-link.service.js";
import { CmsFooterColumnRepository } from "@/modules/cms/footer-columns/footer-column.repository.js";
import { CmsFooterColumnService } from "@/modules/cms/footer-columns/footer-column.service.js";
import { CmsPageRepository } from "@/modules/cms/pages/page.repository.js";
import { CmsPageService } from "@/modules/cms/pages/page.service.js";
import { CachedCmsPageService } from "@/modules/cms/cached-cms-page.service.js";

export function createBrandModule() {
    const settings = new SettingRepository();
    const siteBrandService = new SiteBrandService(settings);
    const socialLinkRepository = new CmsSocialLinkRepository();
    const socialLinkService = new CmsSocialLinkService(socialLinkRepository);
    const pageRepository = new CmsPageRepository();
    const cmsPageService = new CmsPageService(pageRepository);
    const cachedCmsPageService = new CachedCmsPageService(cmsPageService);
    const footerColumnRepository = new CmsFooterColumnRepository();
    const footerColumnService = new CmsFooterColumnService(footerColumnRepository, cmsPageService);
    const siteShellService = new SiteShellService(
        siteBrandService,
        socialLinkService,
        footerColumnService,
        cmsPageService,
    );
    const cachedSiteShellService = new CachedSiteShellService(siteShellService);

    const brandAdminController = new BrandAdminController(
        siteBrandService,
        socialLinkService,
        footerColumnService,
        cmsPageService,
    );

    return {
        brandAdminRouter: createBrandAdminRouter(brandAdminController),
        siteShellService,
        cachedSiteShellService,
        siteBrandService,
        socialLinkService,
        footerColumnService,
        cmsPageService,
        cachedCmsPageService,
    };
}

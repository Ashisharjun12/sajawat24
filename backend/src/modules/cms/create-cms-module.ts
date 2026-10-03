import { CmsAdminController } from "@/modules/cms/cms.admin.controller.js";
import { createCmsAdminRouter } from "@/modules/cms/cms.admin.route.js";
import { CmsPublicController } from "@/modules/cms/cms.public.controller.js";
import { createCmsPublicRouter } from "@/modules/cms/cms.public.route.js";
import { CmsPublicService } from "@/modules/cms/cms.public.service.js";
import { CachedCmsPublicService } from "@/modules/cms/cached-cms-public.service.js";
import { CmsBannerRepository } from "@/modules/cms/banners/banner.repository.js";
import { CmsBannerService } from "@/modules/cms/banners/banner.service.js";
import { CmsTestimonialRepository } from "@/modules/cms/testimonials/testimonial.repository.js";
import { CmsTestimonialService } from "@/modules/cms/testimonials/testimonial.service.js";
import { CmsHomeLayoutRepository } from "@/modules/cms/home-layout/home-layout.repository.js";
import { CmsHomeLayoutService } from "@/modules/cms/home-layout/home-layout.service.js";
import { CmsHomeFaqRepository } from "@/modules/cms/faq/faq.repository.js";
import { CmsHomeFaqService } from "@/modules/cms/faq/faq.service.js";
import type { ICategoryService } from "@/modules/catalog/categories/category.service.js";
import type { ICategoryRepository } from "@/modules/catalog/categories/category.repository.js";
import type { ISectionService } from "@/modules/catalog/sections/section.service.js";
import type { ISectionRepository } from "@/modules/catalog/sections/section.repository.js";
import type { CachedSiteShellService } from "@/modules/brand/cached-site-shell.service.js";
import type { CachedCmsPageService } from "@/modules/cms/cached-cms-page.service.js";

export type CmsModuleDeps = {
    sectionService: ISectionService;
    sectionRepository: ISectionRepository;
    categoryService: ICategoryService;
    categoryRepository: ICategoryRepository;
};

export function createCmsModule(
    deps: CmsModuleDeps,
    siteShellService: CachedSiteShellService,
    cachedCmsPageService: CachedCmsPageService,
) {
    const bannerRepository = new CmsBannerRepository();
    const testimonialRepository = new CmsTestimonialRepository();
    const layoutRepository = new CmsHomeLayoutRepository();
    const faqRepository = new CmsHomeFaqRepository();

    const cmsBannerService = new CmsBannerService(bannerRepository);
    const cmsTestimonialService = new CmsTestimonialService(testimonialRepository);
    const cmsHomeFaqService = new CmsHomeFaqService(faqRepository);
    const cmsHomeLayoutService = new CmsHomeLayoutService(
        layoutRepository,
        deps.sectionService,
        deps.sectionRepository,
        deps.categoryService,
        deps.categoryRepository,
    );

    const cmsPublicService = new CachedCmsPublicService(
        new CmsPublicService(
            bannerRepository,
            testimonialRepository,
            cmsHomeLayoutService,
            faqRepository,
        ),
    );

    const cmsAdminController = new CmsAdminController(
        cmsBannerService,
        cmsTestimonialService,
        cmsHomeLayoutService,
        cmsHomeFaqService,
    );
    const cmsPublicController = new CmsPublicController(
        cmsPublicService,
        siteShellService,
        cachedCmsPageService,
    );

    return {
        cmsPublicRouter: createCmsPublicRouter(cmsPublicController),
        cmsAdminRouter: createCmsAdminRouter(cmsAdminController),
        cmsBannerService,
        cmsTestimonialService,
        cmsHomeLayoutService,
        cmsHomeFaqService,
    };
}

import { Router } from "express";
import type { CmsPublicController } from "@/modules/cms/cms.public.controller.js";
import { homeCmsQueryDto } from "@/modules/cms/cms.dto.js";
import { siteShellQueryDto, cmsPageSlugParamsDto, cmsPagePublicQueryDto } from "@/modules/brand/brand.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCmsPublicRouter(controller: CmsPublicController) {
    const router = Router();
    router.get("/site-shell", validate(siteShellQueryDto, "query"), controller.getSiteShell);
    router.get("/home", validate(homeCmsQueryDto, "query"), controller.getHome);
    router.get(
        "/pages/:slug",
        validate(cmsPageSlugParamsDto, "params"),
        validate(cmsPagePublicQueryDto, "query"),
        controller.getPage,
    );
    return router;
}

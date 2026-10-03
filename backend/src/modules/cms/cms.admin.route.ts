import { Router } from "express";
import type { CmsAdminController } from "@/modules/cms/cms.admin.controller.js";
import {
    cmsIdParamsDto,
    createCmsBannerDto,
    createCmsTestimonialDto,
    listCmsBannersQueryDto,
    listCmsTestimonialsQueryDto,
    patchCmsBannerDto,
    patchCmsTestimonialDto,
    reorderCmsBannersDto,
    createHomeLayoutBlockDto,
    patchHomeLayoutBlockDto,
    listHomeLayoutBlocksQueryDto,
    reorderHomeLayoutBlocksDto,
    putHomeLayoutBlockCategoriesDto,
    homeLayoutBlockIdParamsDto,
    createCmsFaqDto,
    patchCmsFaqDto,
    listCmsFaqsQueryDto,
    reorderCmsFaqsDto,
} from "@/modules/cms/cms.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCmsAdminRouter(controller: CmsAdminController) {
    const router = Router();
    router.get("/banners", validate(listCmsBannersQueryDto, "query"), controller.listBanners);
    router.put("/banners/reorder", validate(reorderCmsBannersDto), controller.reorderBanners);
    router.get("/banners/:id", validate(cmsIdParamsDto, "params"), controller.getBanner);
    router.post("/banners", validate(createCmsBannerDto), controller.createBanner);
    router.patch(
        "/banners/:id",
        validate(cmsIdParamsDto, "params"),
        validate(patchCmsBannerDto),
        controller.patchBanner,
    );
    router.delete("/banners/:id", validate(cmsIdParamsDto, "params"), controller.deleteBanner);

    router.get(
        "/testimonials",
        validate(listCmsTestimonialsQueryDto, "query"),
        controller.listTestimonials,
    );
    router.get("/testimonials/:id", validate(cmsIdParamsDto, "params"), controller.getTestimonial);
    router.post("/testimonials", validate(createCmsTestimonialDto), controller.createTestimonial);
    router.patch(
        "/testimonials/:id",
        validate(cmsIdParamsDto, "params"),
        validate(patchCmsTestimonialDto),
        controller.patchTestimonial,
    );
    router.delete("/testimonials/:id", validate(cmsIdParamsDto, "params"), controller.deleteTestimonial);

    router.get(
        "/home-layout-blocks",
        validate(listHomeLayoutBlocksQueryDto, "query"),
        controller.listHomeLayoutBlocks,
    );
    router.put("/home-layout-blocks/reorder", validate(reorderHomeLayoutBlocksDto), controller.reorderHomeLayoutBlocks);
    router.get(
        "/home-layout-blocks/:id",
        validate(homeLayoutBlockIdParamsDto, "params"),
        controller.getHomeLayoutBlock,
    );
    router.post("/home-layout-blocks", validate(createHomeLayoutBlockDto), controller.createHomeLayoutBlock);
    router.patch(
        "/home-layout-blocks/:id",
        validate(homeLayoutBlockIdParamsDto, "params"),
        validate(patchHomeLayoutBlockDto),
        controller.patchHomeLayoutBlock,
    );
    router.delete(
        "/home-layout-blocks/:id",
        validate(homeLayoutBlockIdParamsDto, "params"),
        controller.deleteHomeLayoutBlock,
    );
    router.put(
        "/home-layout-blocks/:id/categories",
        validate(homeLayoutBlockIdParamsDto, "params"),
        validate(putHomeLayoutBlockCategoriesDto),
        controller.putHomeLayoutBlockCategories,
    );

    router.get("/faqs", validate(listCmsFaqsQueryDto, "query"), controller.listFaqs);
    router.put("/faqs/reorder", validate(reorderCmsFaqsDto), controller.reorderFaqs);
    router.get("/faqs/:id", validate(cmsIdParamsDto, "params"), controller.getFaq);
    router.post("/faqs", validate(createCmsFaqDto), controller.createFaq);
    router.patch(
        "/faqs/:id",
        validate(cmsIdParamsDto, "params"),
        validate(patchCmsFaqDto),
        controller.patchFaq,
    );
    router.delete("/faqs/:id", validate(cmsIdParamsDto, "params"), controller.deleteFaq);

    return router;
}

import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CmsBanner } from "@/modules/cms/banners/banner.schema.js";
import type { CmsBannerService } from "@/modules/cms/banners/banner.service.js";
import type { CmsTestimonialService } from "@/modules/cms/testimonials/testimonial.service.js";
import type { CmsHomeLayoutService } from "@/modules/cms/home-layout/home-layout.service.js";
import type { CmsHomeFaqService } from "@/modules/cms/faq/faq.service.js";

export class CmsAdminController {
    constructor(
        private readonly banners: CmsBannerService,
        private readonly testimonials: CmsTestimonialService,
        private readonly homeLayout: CmsHomeLayoutService,
        private readonly faqs: CmsHomeFaqService,
    ) {}

    listBanners = asyncHandler(async (req, res) => {
        const data = await this.banners.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getBanner = asyncHandler(async (req, res) => {
        const data = await this.banners.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createBanner = asyncHandler(async (req, res) => {
        const data = await this.banners.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchBanner = asyncHandler(async (req, res) => {
        const data = await this.banners.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteBanner = asyncHandler(async (req, res) => {
        const data = await this.banners.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    reorderBanners = asyncHandler(async (req, res) => {
        const { placement, ids } = req.body as { placement: string; ids: string[] };
        const data = await this.banners.reorder(placement as CmsBanner["placement"], ids);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listTestimonials = asyncHandler(async (req, res) => {
        const data = await this.testimonials.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getTestimonial = asyncHandler(async (req, res) => {
        const data = await this.testimonials.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createTestimonial = asyncHandler(async (req, res) => {
        const data = await this.testimonials.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchTestimonial = asyncHandler(async (req, res) => {
        const data = await this.testimonials.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteTestimonial = asyncHandler(async (req, res) => {
        const data = await this.testimonials.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    listHomeLayoutBlocks = asyncHandler(async (req, res) => {
        const cityId = parseCityIdQuery(req.query.cityId);
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const data = await this.homeLayout.listAdmin({
            cityId,
            status: status as "draft" | "published" | "hidden" | undefined,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getHomeLayoutBlock = asyncHandler(async (req, res) => {
        const data = await this.homeLayout.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createHomeLayoutBlock = asyncHandler(async (req, res) => {
        const data = await this.homeLayout.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchHomeLayoutBlock = asyncHandler(async (req, res) => {
        const data = await this.homeLayout.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteHomeLayoutBlock = asyncHandler(async (req, res) => {
        const data = await this.homeLayout.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    reorderHomeLayoutBlocks = asyncHandler(async (req, res) => {
        const { cityId, ids } = req.body as { cityId: string | null; ids: string[] };
        const data = await this.homeLayout.reorder(cityId, ids);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    putHomeLayoutBlockCategories = asyncHandler(async (req, res) => {
        const data = await this.homeLayout.replaceCategories(paramId(req), req.body.categoryIds);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listFaqs = asyncHandler(async (req, res) => {
        const data = await this.faqs.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getFaq = asyncHandler(async (req, res) => {
        const data = await this.faqs.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createFaq = asyncHandler(async (req, res) => {
        const data = await this.faqs.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchFaq = asyncHandler(async (req, res) => {
        const data = await this.faqs.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteFaq = asyncHandler(async (req, res) => {
        const data = await this.faqs.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    reorderFaqs = asyncHandler(async (req, res) => {
        const { ids } = req.body as { ids: string[] };
        const data = await this.faqs.reorder(ids);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}

function parseCityIdQuery(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === "global" || value === "null" || value === "") return null;
    return typeof value === "string" ? value : undefined;
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ISectionService } from "@/modules/catalog/sections/section.service.js";

export class SectionController {
    constructor(private readonly sections: ISectionService) {}

    listPublic = asyncHandler(async (req, res) => {
        const data = await this.sections.listPublic({
            pincode: typeof req.query.pincode === "string" ? req.query.pincode : undefined,
            cityId: typeof req.query.cityId === "string" ? req.query.cityId : undefined,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listAdmin = asyncHandler(async (_req, res) => {
        const data = await this.sections.listAdmin();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listGlobalProductOccupancy = asyncHandler(async (_req, res) => {
        const data = await this.sections.listGlobalProductOccupancy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.sections.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "section created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.sections.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "section updated"));
    });

    delete = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await this.sections.delete(id);
        res.status(200).json(new ApiResponse(200, { id }, "section deleted"));
    });

    listProducts = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cityId = typeof req.query.cityId === "string" ? req.query.cityId : undefined;
        const data = await this.sections.listProducts(id, cityId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    replaceProducts = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.sections.replaceProducts(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "products saved"));
    });

    deleteCityOverride = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cityId = Array.isArray(req.params.cityId) ? req.params.cityId[0] : req.params.cityId;
        const data = await this.sections.deleteCityOverride(id, cityId);
        res.status(200).json(new ApiResponse(200, data, "city override removed"));
    });
}

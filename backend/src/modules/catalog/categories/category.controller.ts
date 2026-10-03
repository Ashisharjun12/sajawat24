import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ICategoryService } from "@/modules/catalog/categories/category.service.js";

export class CategoryController {
    constructor(private readonly categories: ICategoryService) {}

    listActive = asyncHandler(async (_req, res) => {
        const data = await this.categories.listActiveTreeCached();
        res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.categories.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.categories.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "category created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.categories.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "category updated"));
    });
}

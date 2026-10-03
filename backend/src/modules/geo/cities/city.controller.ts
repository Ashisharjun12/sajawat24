import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ICityService } from "@/modules/geo/cities/city.service.js";

export class CityController {
    constructor(private readonly cities: ICityService) {}

    listActive = asyncHandler(async (_req, res) => {
        const data = await this.cities.listActive();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.cities.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.cities.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "city created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.cities.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "city updated"));
    });
}

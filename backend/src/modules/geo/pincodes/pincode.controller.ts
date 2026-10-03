import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IPincodeService } from "@/modules/geo/pincodes/pincode.service.js";

export class PincodeController {
    constructor(private readonly pincodes: IPincodeService) {}

    resolve = asyncHandler(async (req, res) => {
        const pincode = String(req.query.pincode ?? "");
        const cityId =
            typeof req.query.cityId === "string" && req.query.cityId.trim()
                ? req.query.cityId.trim()
                : undefined;
        const data = await this.pincodes.lookup(pincode, cityId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.pincodes.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.pincodes.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "pincode created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.pincodes.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "pincode updated"));
    });
}

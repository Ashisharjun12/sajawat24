import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { CustomerAddressService } from "@/modules/identity/addresses/customer-address.service.js";

function paramId(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

export class CustomerAddressController {
    constructor(private readonly service: CustomerAddressService) {}

    list = asyncHandler(async (req, res) => {
        const items = await this.service.list(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { items }, "addresses"));
    });

    create = asyncHandler(async (req, res) => {
        const address = await this.service.create(req.actor!.id, req.body);
        res.status(201).json(new ApiResponse(201, { address }, "address created"));
    });

    patch = asyncHandler(async (req, res) => {
        const address = await this.service.patch(req.actor!.id, paramId(req.params.id), req.body);
        res.status(200).json(new ApiResponse(200, { address }, "address updated"));
    });

    remove = asyncHandler(async (req, res) => {
        await this.service.remove(req.actor!.id, paramId(req.params.id));
        res.status(200).json(new ApiResponse(200, {}, "address deleted"));
    });

    setDefault = asyncHandler(async (req, res) => {
        const address = await this.service.setDefault(req.actor!.id, paramId(req.params.id));
        res.status(200).json(new ApiResponse(200, { address }, "default address set"));
    });
}

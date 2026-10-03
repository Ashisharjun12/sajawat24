import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ICustomerService } from "@/modules/identity/customers/customer.service.js";

export class CustomerAdminController {
    constructor(private readonly customers: ICustomerService) {}

    list = asyncHandler(async (req, res) => {
        const data = await this.customers.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    get = asyncHandler(async (req, res) => {
        const data = await this.customers.getAdminDetail(String(req.params.id));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patch = asyncHandler(async (req, res) => {
        const data = await this.customers.updateStatus(String(req.params.id), req.body.status);
        res.status(200).json(new ApiResponse(200, data, "customer updated"));
    });
}

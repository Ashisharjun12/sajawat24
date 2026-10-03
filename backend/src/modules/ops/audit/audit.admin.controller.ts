import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAuditService } from "@/modules/ops/audit/audit.service.js";

export class AuditAdminController {
    constructor(private readonly audit: IAuditService) {}

    list = asyncHandler(async (req, res) => {
        const data = await this.audit.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}

import type { Request } from "express";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { VendorTeamService } from "@/modules/identity/vendor-members/vendor-team.service.js";

export class VendorTeamController {
    constructor(private readonly team: VendorTeamService) {}

    list = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
        const data = await this.team.list(partner, {
            page: req.query.page,
            limit: req.query.limit,
            q: q || undefined,
            status: req.query.status as "active" | "invited" | "disabled" | undefined,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    invite = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const data = await this.team.invite(partner, req.body);
        res.status(201).json(new ApiResponse(201, data, "team member invited"));
    });

    patch = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const memberId = paramMemberId(req);
        const data = await this.team.patch(partner, memberId, req.body);
        res.status(200).json(new ApiResponse(200, data, "updated"));
    });

    disable = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const memberId = paramMemberId(req);
        await this.team.disable(partner, memberId);
        res.status(200).json(new ApiResponse(200, { ok: true }, "disabled"));
    });
}

function paramMemberId(req: Request): string {
    const id = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
    return String(id ?? "");
}

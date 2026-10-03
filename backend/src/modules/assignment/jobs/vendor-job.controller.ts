import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IVendorJobService } from "@/modules/assignment/jobs/vendor-job.service.js";
import { parsePagination } from "@/shared/http/pagination.js";

export class VendorJobController {
    constructor(private readonly jobs: IVendorJobService) {}

    list = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const pagination = parsePagination(req.query);
        const filter = req.query.filter as
            | "today"
            | "upcoming"
            | "completed"
            | "action"
            | undefined;
        const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
        const data = await this.jobs.listJobs(partner, filter, pagination, q || undefined);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    get = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.getJob(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getRoute = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.getJobRoute(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getTracking = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.getJobTracking(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    accept = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.acceptJob(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "job accepted"));
    });

    decline = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        await this.jobs.declineJob(partner, orderId);
        res.status(200).json(new ApiResponse(200, { ok: true }, "job declined"));
    });

    postLocation = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const result = await this.jobs.postJobLocation(partner, orderId, req.body);
        res.status(200).json(new ApiResponse(200, { ok: true, ...result }, "location updated"));
    });

    markEnRoute = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.markEnRoute(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "marked en route"));
    });

    markOnSite = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.markOnSite(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "marked on site"));
    });

    sendDeliveryCode = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.sendDeliveryCode(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "delivery code sent"));
    });

    complete = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const code = String(req.body?.code ?? "");
        const data = await this.jobs.completeJob(partner, orderId, code);
        res.status(200).json(new ApiResponse(200, data, "job completed"));
    });

    listAssignments = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.listFieldAssignments(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    setAssignments = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const memberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
        const data = await this.jobs.setFieldAssignments(partner, orderId, memberIds);
        res.status(200).json(new ApiResponse(200, data, "assignments updated"));
    });

    assignSelf = asyncHandler(async (req, res) => {
        const partner = req.partner;
        if (!partner) throw ApiError.forbidden("partner context required");
        const orderId = paramOrderId(req);
        const data = await this.jobs.assignSelfToJob(partner, orderId);
        res.status(200).json(new ApiResponse(200, data, "assigned"));
    });
}

function paramOrderId(req: Request): string {
    const id = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    return String(id ?? "");
}

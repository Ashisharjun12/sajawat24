import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { requireUploadFile } from "@/shared/middlewares/upload.middleware.js";
import { parseCropJson } from "@/modules/upload/media/media.dto.js";
import type { IMediaService } from "@/modules/upload/media/media.service.js";

export class MediaController {
    constructor(private readonly media: IMediaService) {}

    list = asyncHandler(async (req, res) => {
        const data = await this.media.list(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    presign = asyncHandler(async (req, res) => {
        const data = await this.media.presign({
            ...req.body,
            uploadedBy: req.actor?.id ?? null,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    ingest = asyncHandler(async (req, res) => {
        const file = requireUploadFile(req.file);
        let crop;
        try {
            crop = parseCropJson(req.body.crop);
        } catch {
            throw ApiError.badRequest("validation failed");
        }
        const data = await this.media.ingest({
            buffer: file.buffer,
            filename: typeof req.body.filename === "string" ? req.body.filename : file.originalname,
            mimeType: file.mimetype,
            folderId: typeof req.body.folderId === "string" ? req.body.folderId : null,
            uploadedBy: req.actor?.id ?? null,
            crop,
        });
        res.status(200).json(new ApiResponse(200, data, "upload ingested"));
    });

    complete = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.media.complete(id);
        res.status(200).json(new ApiResponse(200, data, "upload completed"));
    });

    get = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.media.get(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.media.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "upload updated"));
    });

    optimize = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.media.queueOptimize(id, req.body);
        res.status(202).json(new ApiResponse(202, data, "optimize queued"));
    });

    remove = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await this.media.remove(id);
        res.status(200).json(new ApiResponse(200, { id }, "upload deleted"));
    });
}

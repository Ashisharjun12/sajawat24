import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { FolderService } from "@/modules/upload/folders/folder.service.js";

export class FolderController {
    constructor(private readonly folders: FolderService) {}

    list = asyncHandler(async (req, res) => {
        const raw = typeof req.query.parentId === "string" ? req.query.parentId : undefined;
        let parentId: string | null | undefined;
        if (raw === undefined) parentId = undefined;
        else if (raw === "null" || raw === "") parentId = null;
        else parentId = raw;
        const q = typeof req.query.q === "string" ? req.query.q : undefined;
        const data = await this.folders.list(parentId, q);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.folders.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "folder created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.folders.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "folder updated"));
    });

    remove = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await this.folders.remove(id);
        res.status(200).json(new ApiResponse(200, { id }, "folder deleted"));
    });
}

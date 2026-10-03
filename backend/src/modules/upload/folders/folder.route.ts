import { Router } from "express";
import type { FolderController } from "@/modules/upload/folders/folder.controller.js";
import {
    createFolderDto,
    folderIdParamsDto,
    folderListQueryDto,
    patchFolderDto,
} from "@/modules/upload/folders/folder.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createFolderAdminRouter(controller: FolderController) {
    const router = Router();
    router.get("/", validate(folderListQueryDto, "query"), controller.list);
    router.post("/", validate(createFolderDto), controller.create);
    router.patch("/:id", validate(folderIdParamsDto, "params"), validate(patchFolderDto), controller.patch);
    router.delete("/:id", validate(folderIdParamsDto, "params"), controller.remove);
    return router;
}

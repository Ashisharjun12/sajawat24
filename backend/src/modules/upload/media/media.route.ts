import { Router } from "express";
import type { MediaController } from "@/modules/upload/media/media.controller.js";
import {
    adminUploadListQueryDto,
    optimizeUploadDto,
    patchUploadDto,
    presignUploadDto,
    uploadIdParamsDto,
} from "@/modules/upload/media/media.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";
import { uploadMemory } from "@/shared/middlewares/upload.middleware.js";

export function createMediaAdminRouter(mediaController: MediaController) {
    const router = Router();
    router.get("/", validate(adminUploadListQueryDto, "query"), mediaController.list);
    router.post("/presign", validate(presignUploadDto), mediaController.presign);
    router.post("/ingest", uploadMemory.single("file"), mediaController.ingest);
    router.post("/:id/complete", validate(uploadIdParamsDto, "params"), mediaController.complete);
    router.post(
        "/:id/optimize",
        validate(uploadIdParamsDto, "params"),
        validate(optimizeUploadDto),
        mediaController.optimize,
    );
    router.get("/:id", validate(uploadIdParamsDto, "params"), mediaController.get);
    router.patch("/:id", validate(uploadIdParamsDto, "params"), validate(patchUploadDto), mediaController.patch);
    router.delete("/:id", validate(uploadIdParamsDto, "params"), mediaController.remove);
    return router;
}

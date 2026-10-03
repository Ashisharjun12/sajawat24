import { Router } from "express";
import type {
    NotificationPreferenceController,
    NotificationTemplateController,
} from "@/modules/notifications/notification.controller.js";
import {
    createTemplateVersionDto,
    patchNotificationTemplateDto,
    putUserPreferencesDto,
    templateIdParamsDto,
} from "@/modules/notifications/notification.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createNotificationTemplateAdminRouter(controller: NotificationTemplateController) {
    const router = Router();
    router.get("/", controller.list);
    router.patch(
        "/:id",
        validate(templateIdParamsDto, "params"),
        validate(patchNotificationTemplateDto),
        controller.patch,
    );
    router.post(
        "/:id/versions",
        validate(templateIdParamsDto, "params"),
        validate(createTemplateVersionDto),
        controller.createVersion,
    );
    return router;
}

export function createUserPreferenceRouter(controller: NotificationPreferenceController) {
    const router = Router();
    router.get("/", authRequired, controller.get);
    router.put("/", authRequired, validate(putUserPreferencesDto), controller.put);
    return router;
}

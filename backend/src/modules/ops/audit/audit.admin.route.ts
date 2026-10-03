import { Router } from "express";
import type { AuditAdminController } from "@/modules/ops/audit/audit.admin.controller.js";

export function createAuditAdminRouter(controller: AuditAdminController) {
    const router = Router();
    router.get("/", controller.list);
    return router;
}

import { Router } from "express";
import type { DashboardController } from "@/modules/ops/dashboard/dashboard.controller.js";

export function createDashboardAdminRouter(controller: DashboardController) {
    const router = Router();
    router.get("/overview", controller.overview);
    return router;
}

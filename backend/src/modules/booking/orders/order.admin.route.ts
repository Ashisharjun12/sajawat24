import { Router } from "express";
import type { AssignmentController } from "@/modules/assignment/assignments/assignment.controller.js";
import {
    assignCandidatesQueryDto,
    assignVendorDto,
} from "@/modules/assignment/assignments/assignment.dto.js";
import type { OrderController } from "@/modules/booking/orders/order.controller.js";
import { adminCreateOrderDto } from "@/modules/booking/orders/order.admin.dto.js";
import {
    adminOrderListQueryDto,
    orderIdParamsDto,
} from "@/modules/booking/orders/order.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createOrderAdminRouter(
    orderController: OrderController,
    assignmentController: AssignmentController,
) {
    const router = Router();
    router.get("/", validate(adminOrderListQueryDto, "query"), orderController.listAdmin);
    router.post("/", validate(adminCreateOrderDto), orderController.createAdmin);
    router.get(
        "/:id/assign-candidates",
        validate(orderIdParamsDto, "params"),
        validate(assignCandidatesQueryDto, "query"),
        assignmentController.listCandidates,
    );
    router.post(
        "/:id/assign",
        validate(orderIdParamsDto, "params"),
        validate(assignVendorDto),
        assignmentController.assign,
    );
    router.get("/:id", validate(orderIdParamsDto, "params"), orderController.getForAdmin);
    return router;
}

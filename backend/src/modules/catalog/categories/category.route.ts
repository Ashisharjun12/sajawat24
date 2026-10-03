import { Router } from "express";
import type { CategoryController } from "@/modules/catalog/categories/category.controller.js";
import {
    adminCategoryListQueryDto,
    categoryIdParamsDto,
    createCategoryDto,
    patchCategoryDto,
} from "@/modules/catalog/categories/category.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCategoryPublicRouter(categoryController: CategoryController) {
    const router = Router();
    router.get("/", categoryController.listActive);
    return router;
}

export function createCategoryAdminRouter(categoryController: CategoryController) {
    const router = Router();
    router.get("/", validate(adminCategoryListQueryDto, "query"), categoryController.listAdmin);
    router.post("/", validate(createCategoryDto), categoryController.create);
    router.patch(
        "/:id",
        validate(categoryIdParamsDto, "params"),
        validate(patchCategoryDto),
        categoryController.patch,
    );
    return router;
}

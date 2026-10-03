import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { getActiveCityById, getCityByPincode } from "@/modules/geo/index.js";
import type { PromotionService } from "@/modules/promotions/promotion.service.js";

export class PromotionPublicController {
    constructor(private readonly promotions: PromotionService) {}

    listAvailable = asyncHandler(async (req, res) => {
        const productId =
            typeof req.query.productId === "string" ? req.query.productId : undefined;
        const categoryId =
            typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
        const scope = req.query.scope === "city" ? "city" : "product";
        const cityId = typeof req.query.cityId === "string" ? req.query.cityId : undefined;
        const pincode = typeof req.query.pincode === "string" ? req.query.pincode.trim() : "";

        let resolvedCityId = cityId;
        if (pincode) {
            const city = await getCityByPincode(pincode);
            resolvedCityId = city.id;
        }
        if (!resolvedCityId) {
            res.status(200).json(new ApiResponse(200, { items: [] }, "ok"));
            return;
        }

        await getActiveCityById(resolvedCityId);

        let items;
        if (scope === "city" || !productId || !categoryId) {
            items = await this.promotions.listAvailableForCity({
                cityId: resolvedCityId,
                productId,
                categoryId,
            });
            if (productId && categoryId) {
                items.sort((a, b) => Number(b.appliesToProduct) - Number(a.appliesToProduct));
            }
        } else {
            items = await this.promotions.listAvailableForProduct({
                productId,
                categoryId,
                cityId: resolvedCityId,
            });
        }

        res.status(200).json(new ApiResponse(200, { items }, "ok"));
    });
}

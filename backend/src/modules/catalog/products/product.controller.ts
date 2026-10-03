import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IProductService } from "@/modules/catalog/products/product.service.js";
import type { ICityPriceService } from "@/modules/catalog/pricing/city-price.service.js";
import type { IAddonService } from "@/modules/catalog/addons/addon.service.js";

export class ProductController {
    constructor(
        private readonly products: IProductService,
        private readonly prices: ICityPriceService,
        private readonly addons: IAddonService,
    ) {}

    listPublic = asyncHandler(async (req, res) => {
        const data = await this.products.listByPincode(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getPublic = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.products.getPublicByLocation(id, req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.products.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getAdmin = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.products.getAdmin(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.products.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "product created"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.products.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "product updated"));
    });

    delete = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await this.products.delete(id);
        res.status(200).json(new ApiResponse(200, { id }, "product deleted"));
    });

    listPrices = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.prices.listProductPrices(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    setPrice = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.prices.setProductPrice(id, {
            cityId: req.body.cityId,
            pricePaise: req.body.pricePaise,
            compareAtPaise: req.body.compareAtPaise,
        });
        res.status(200).json(new ApiResponse(200, data, "price saved"));
    });

    deletePrice = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cityId = Array.isArray(req.params.cityId) ? req.params.cityId[0] : req.params.cityId;
        await this.prices.deleteProductPrice(id, cityId);
        res.status(200).json(new ApiResponse(200, { id, cityId }, "price removed"));
    });

    mapAddon = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.addons.mapToProduct(id, req.body.addonId);
        res.status(200).json(new ApiResponse(200, data, "addon mapped"));
    });

    unmapAddon = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const addonId = Array.isArray(req.params.addonId) ? req.params.addonId[0] : req.params.addonId;
        await this.addons.unmapFromProduct(id, addonId);
        res.status(200).json(new ApiResponse(200, { id, addonId }, "addon unmapped"));
    });
}

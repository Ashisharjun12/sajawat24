import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAddonService } from "@/modules/catalog/addons/addon.service.js";
import type { ICityPriceService } from "@/modules/catalog/pricing/city-price.service.js";

export class AddonController {
    constructor(
        private readonly addons: IAddonService,
        private readonly prices: ICityPriceService,
    ) {}

    listAdmin = asyncHandler(async (req, res) => {
        const data = await this.addons.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    create = asyncHandler(async (req, res) => {
        const data = await this.addons.create(req.body);
        res.status(200).json(new ApiResponse(200, data, "addon created"));
    });

    getAdmin = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const addon = await this.addons.getAdmin(id);
        const prices = await this.prices.listAddonPrices(id);
        res.status(200).json(new ApiResponse(200, { ...addon, prices }, "ok"));
    });

    patch = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.addons.patch(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "addon updated"));
    });

    listColors = asyncHandler(async (_req, res) => {
        const items = await this.addons.listColors();
        res.status(200).json(new ApiResponse(200, { items }, "ok"));
    });

    createColor = asyncHandler(async (req, res) => {
        const data = await this.addons.createColor(req.body);
        res.status(200).json(new ApiResponse(200, data, "color created"));
    });

    patchColor = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.addons.patchColor(id, req.body);
        res.status(200).json(new ApiResponse(200, data, "color updated"));
    });

    listPrices = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.prices.listAddonPrices(id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    setPrice = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = await this.prices.setAddonPrice(id, {
            cityId: req.body.cityId,
            pricePaise: req.body.pricePaise,
            compareAtPaise: req.body.compareAtPaise,
        });
        res.status(200).json(new ApiResponse(200, data, "price saved"));
    });

    deletePrice = asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cityId = Array.isArray(req.params.cityId) ? req.params.cityId[0] : req.params.cityId;
        await this.prices.deleteAddonPrice(id, cityId);
        res.status(200).json(new ApiResponse(200, { id, cityId }, "price removed"));
    });
}

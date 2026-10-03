import { getMessageServiceCatalog } from "@/modules/ops/settings/message-service-catalog.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { ISettingService } from "@/modules/ops/settings/setting.service.js";

export class SettingController {
    constructor(private readonly settings: ISettingService) {}

    getNotifications = asyncHandler(async (_req, res) => {
        const data = await this.settings.getNotificationChannels();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchNotifications = asyncHandler(async (req, res) => {
        const data = await this.settings.patchNotificationChannels(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "notification channels updated"));
    });

    getPayments = asyncHandler(async (_req, res) => {
        const data = await this.settings.getPaymentMethods();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchPayments = asyncHandler(async (req, res) => {
        const data = await this.settings.patchPaymentMethods(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "payment methods updated"));
    });

    getPayoutPolicy = asyncHandler(async (_req, res) => {
        const data = await this.settings.getPayoutPolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchPayoutPolicy = asyncHandler(async (req, res) => {
        const data = await this.settings.patchPayoutPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "payout policy updated"));
    });

    getBookingPolicy = asyncHandler(async (_req, res) => {
        const data = await this.settings.getBookingPolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchBookingPolicy = asyncHandler(async (req, res) => {
        const data = await this.settings.patchBookingPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "booking policy updated"));
    });

    getInstantDispatch = asyncHandler(async (_req, res) => {
        const data = await this.settings.getInstantDispatchPolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchInstantDispatch = asyncHandler(async (req, res) => {
        const data = await this.settings.patchInstantDispatchPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "instant dispatch policy updated"));
    });

    resolveInstantDispatchSystemUser = asyncHandler(async (_req, res) => {
        const data = await this.settings.resolveInstantDispatchSystemUser();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getInstantMaps = asyncHandler(async (_req, res) => {
        const data = await this.settings.getInstantMapsPolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchInstantMaps = asyncHandler(async (req, res) => {
        const data = await this.settings.patchInstantMapsPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "instant maps policy updated"));
    });

    getInstantMarketplace = asyncHandler(async (_req, res) => {
        const data = await this.settings.getInstantMarketplacePolicy();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchInstantMarketplace = asyncHandler(async (req, res) => {
        const data = await this.settings.patchInstantMarketplacePolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "instant marketplace policy updated"));
    });

    getMessageServiceCatalog = asyncHandler(async (_req, res) => {
        res.status(200).json(new ApiResponse(200, { items: getMessageServiceCatalog() }, "ok"));
    });

    getDemoAuth = asyncHandler(async (_req, res) => {
        const data = await this.settings.getDemoAuthAdmin();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchDemoAuth = asyncHandler(async (req, res) => {
        const data = await this.settings.patchDemoAuthPolicy(req.body, req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "demo auth updated"));
    });
}

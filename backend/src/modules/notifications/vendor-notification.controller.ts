import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IPushDeviceService } from "@/modules/notifications/devices/device.service.js";
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import { parsePagination } from "@/shared/http/pagination.js";

export class VendorNotificationController {
    constructor(
        private readonly devices: IPushDeviceService,
        private readonly notifications: NotificationRepository,
    ) {}

    registerDevice = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        await this.devices.register(userId, req.body);
        res.status(200).json(new ApiResponse(200, { ok: true }, "device registered"));
    });

    unregisterDevice = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        await this.devices.unregister(userId, req.body);
        res.status(200).json(new ApiResponse(200, { ok: true }, "device unregistered"));
    });

    listInbox = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const pagination = parsePagination(req.query);
        const data = await this.notifications.listInboxForUser(userId, pagination);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    markRead = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const id = String(req.params.id);
        const row = await this.notifications.markInboxRead(userId, id);
        if (!row) throw ApiError.notFound("notification not found");
        res.status(200).json(new ApiResponse(200, row, "notification updated"));
    });

    markAllRead = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const count = await this.notifications.markAllInboxRead(userId);
        res.status(200).json(new ApiResponse(200, { count }, "notifications updated"));
    });
}

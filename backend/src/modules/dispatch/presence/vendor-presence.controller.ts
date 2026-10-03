import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { VendorPresenceService } from "@/modules/dispatch/presence/vendor-presence.service.js";

export class VendorPresenceController {
    constructor(private readonly presence: VendorPresenceService) {}

    postPresence = asyncHandler(async (req, res) => {
        const data = await this.presence.updatePresence(req.actor!.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "presence updated"));
    });

    postHeartbeat = asyncHandler(async (req, res) => {
        await this.presence.heartbeat(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { ok: true }, "ok"));
    });
}

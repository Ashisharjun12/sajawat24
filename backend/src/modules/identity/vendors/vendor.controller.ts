import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAuthService } from "@/modules/identity/auth/auth.service.js";
import type { IVendorService } from "@/modules/identity/vendors/vendor.service.js";

function clientIp(req: { ip?: string; socket: { remoteAddress?: string } }): string | undefined {
    return req.ip || req.socket.remoteAddress;
}

export class VendorController {
    constructor(
        private readonly authService: IAuthService,
        private readonly vendorService: IVendorService,
    ) {}

    register = asyncHandler(async (req, res) => {
        const validated = await this.vendorService.validateRegisterInput(req.body);
        const data = await this.authService.registerVendor(validated, clientIp(req));
        res.status(200).json(new ApiResponse(200, data, "otp sent"));
    });

    presignShopImage = asyncHandler(async (req, res) => {
        const data = await this.vendorService.presignShopImage(req.body);
        res.status(200).json(new ApiResponse(200, data, "upload url created"));
    });

    completeShopImage = asyncHandler(async (req, res) => {
        const uploadId = String(req.params.uploadId);
        const data = await this.vendorService.completeShopImage(uploadId);
        res.status(200).json(new ApiResponse(200, data, "upload completed"));
    });

    reapply = asyncHandler(async (req, res) => {
        await this.vendorService.reapply(req.actor!.id, req.body);
        const user = await this.authService.me(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { user }, "application resubmitted"));
    });

    getDuty = asyncHandler(async (req, res) => {
        const vendor = await this.vendorService.getDuty(req.actor!.id);
        res.status(200).json(new ApiResponse(200, vendor, "ok"));
    });

    getShopDuty = asyncHandler(async (req, res) => {
        const vendorId = req.partner?.vendorId;
        if (!vendorId) {
            res.status(403).json(new ApiResponse(403, null, "partner context required"));
            return;
        }
        const vendor = await this.vendorService.getShopDutyByVendorId(vendorId);
        res.status(200).json(new ApiResponse(200, vendor, "ok"));
    });

    setDuty = asyncHandler(async (req, res) => {
        const vendor = await this.vendorService.setDuty(req.actor!.id, req.body.isOnDuty);
        const user = await this.authService.me(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { vendor, user }, "duty updated"));
    });

    presignProfileAvatar = asyncHandler(async (req, res) => {
        const data = await this.vendorService.presignProfileAvatar(req.actor!.id, req.body);
        res.status(200).json(new ApiResponse(200, data, "upload url created"));
    });

    completeProfileAvatar = asyncHandler(async (req, res) => {
        const uploadId = String(req.params.uploadId);
        const data = await this.vendorService.completeProfileAvatar(uploadId);
        res.status(200).json(new ApiResponse(200, data, "upload completed"));
    });

    patchProfile = asyncHandler(async (req, res) => {
        await this.vendorService.patchProfile(req.actor!.id, req.body);
        const user = await this.authService.me(req.actor!.id);
        res.status(200).json(new ApiResponse(200, { user }, "profile updated"));
    });
}

export class VendorAdminController {
    constructor(private readonly vendorService: IVendorService) {}

    list = asyncHandler(async (req, res) => {
        const data = await this.vendorService.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    get = asyncHandler(async (req, res) => {
        const data = await this.vendorService.getAdminDetail(String(req.params.id));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patch = asyncHandler(async (req, res) => {
        const data = await this.vendorService.updateOnboardingStatus(
            String(req.params.id),
            req.body.onboardingStatus,
            req.actor!.id,
        );
        res.status(200).json(new ApiResponse(200, data, "vendor updated"));
    });

    listMembers = asyncHandler(async (req, res) => {
        const data = await this.vendorService.listTeamWorkersAdmin(String(req.params.id), req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}
